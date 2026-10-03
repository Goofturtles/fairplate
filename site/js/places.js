/* Real restaurants from OpenStreetMap (© OpenStreetMap contributors, ODbL).
   1) data/osm-toronto.json snapshot loads instantly (works offline),
   2) live Overpass refresh around the user's geocoded address, cached in localStorage. */
window.FP = window.FP || {};
(function () {
  const OVERPASS = "https://overpass-api.de/api/interpreter";
  const NOMINATIM = "https://nominatim.openstreetmap.org/search";
  const CACHE = "fairplate-places-v1", GEO = "fairplate-geo-v2";

  /* OSM cuisine tag -> [category key, label, example photo]. Photos show the cuisine, never the actual restaurant. */
  const MAP = [
    [/pizza/, "pizza", "Pizza", "pizza"], [/burger|hamburger/, "burgers", "Burgers", "burger"], [/sushi|japanese/, "sushi", "Japanese", "sushi"],
    [/ramen|noodle/, "ramen", "Ramen & noodles", "ramen"], [/thai/, "thai", "Thai", "padthai"], [/indian|pakistani|nepal|sri_lankan/, "indian", "Indian", "curry"],
    [/shawarma|kebab|lebanese|middle_eastern|turkish|persian|afghan|falafel/, "shawarma", "Middle Eastern", "shawarma"],
    [/chinese|dumpling|cantonese|sichuan|dim_sum/, "dumplings", "Chinese", "dumplings"], [/vietnamese|pho|banh/, "vietnamese", "Vietnamese", "banhmi"],
    [/korean/, "korean", "Korean", "karaage"], [/mexican|tex-mex|taco|burrito|latin/, "tacos", "Mexican", "tacos"],
    [/chicken|wings|fried/, "chicken", "Chicken", "friedchicken"], [/italian|pasta/, "italian", "Italian", "lasagne"],
    [/salad|vegan|vegetarian|healthy|poke|bowl/, "healthy", "Healthy", "salad"], [/greek|mediterranean/, "greek", "Greek", "falafel"],
    [/dessert|ice_cream|cake|donut|bakery|crepe|waffle/, "dessert", "Dessert", "cheesecake"], [/breakfast|brunch|diner/, "breakfast", "Breakfast", "pancakes"],
    [/caribbean|jamaican/, "caribbean", "Caribbean", "tandoori"], [/poutine|canadian/, "poutine", "Poutine", "poutine"],
    [/sandwich|deli|bagel|sub/, "sandwich", "Sandwiches", "sandwich"], [/coffee|tea|bubble/, "cafe", "Café", "brownies"],
  ];
  function kind(cuisine, amenity) {
    for (const [re, cat, label, img] of MAP) if (re.test(cuisine)) return { cat, label, img };
    if (amenity === "cafe") return { cat: "cafe", label: "Café", img: "brownies" };
    return { cat: "other", label: amenity === "fast_food" ? "Fast food" : "Restaurant", img: null };
  }
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const km = (a, b, c, d) => { const x = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };

  function norm(p) {
    const k = kind(p.c || "", p.a);
    return { id: p.id, name: p.n, amenity: p.a, cuisine: p.c, cat: k.cat, label: k.label, img: k.img, lat: p.lat, lon: p.lon,
      addr: p.ad || "", brand: p.b || "", hours: p.h || "", web: p.w || "" };
  }
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
                  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  let all = [], cover = null;   // cover: the circle the loaded data was fetched for, { lat, lon, km }
  function withDistance(lat, lon) { all.forEach((p) => (p.km = km(lat, lon, p.lat, p.lon))); all.sort((a, b) => a.km - b.km); assignPhotos(); return all; }

  /* example-dish photo per place: a pool per cuisine (tools/fetch_cuisines.py), picked by the place id so it never changes
     and neighbours differ. Always an example of the food, never the restaurant's own photo; the UI says so. */
  let pools = {};
  const poolsReady = fetch("data/cuisine-photos.json").then((r) => r.json()).then((j) => (pools = j)).catch(() => {});
  const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const photoOf = (p) => p.photo || null;
  /* in distance order, a place of the same cuisine never repeats one of the last few photos, so a list of pizzas varies */
  function assignPhotos() {
    const recent = {};
    for (const p of all) {
      const n = pools[p.cat] || 0; if (!n) { p.photo = null; continue; }
      const r = (recent[p.cat] = recent[p.cat] || []), start = hash(p.id) % n;
      let i = start; for (let k = 0; k < n && r.includes(i); k++) i = (start + k + 1) % n;
      r.push(i); if (r.length > Math.min(3, n - 1)) r.shift();
      p.photo = `cz/${p.cat}-${i}`;
    }
  }

  async function load(lat, lon) {
    await poolsReady;
    const cached = store.get(CACHE);
    if (cached && cached.places && cached.places.length) { all = cached.places.map(norm); cover = { lat: cached.lat, lon: cached.lon, km: (cached.radius || 2500) / 1000 }; }
    else {
      const snap = await fetch("data/osm-toronto.json").then((r) => r.json());
      all = snap.places.map(norm); cover = snap.center ? { lat: snap.center[0], lon: snap.center[1], km: (snap.radius || 2500) / 1000 } : null;
    }
    return withDistance(lat, lon);
  }

  /* Live refresh from Overpass around a point; keeps the snapshot if Overpass is slow or down. */
  async function refresh(lat, lon, radius = 2500) {
    const q = `[out:json][timeout:25];nwr["amenity"~"^(restaurant|fast_food|cafe)$"]["name"](around:${radius},${lat},${lon});out tags center;`;
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(OVERPASS + "?data=" + encodeURIComponent(q), { signal: ctl.signal });
      if (!r.ok) throw new Error("overpass " + r.status);
      const els = (await r.json()).elements || [];
      const places = els.map((e) => { const t = e.tags || {}, c = e.center || e; return c.lat ? { id: e.type[0] + e.id, n: t.name, a: t.amenity, c: (t.cuisine || "").split(";")[0].trim().toLowerCase(),
        lat: +(+c.lat).toFixed(5), lon: +(+c.lon).toFixed(5), ad: [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "), b: t.brand || "", h: t.opening_hours || "", w: t.website || t["contact:website"] || "" } : null; }).filter(Boolean);
      if (places.length) { store.set(CACHE, { at: Date.now(), lat, lon, radius, places }); all = places.map(norm); cover = { lat, lon, km: radius / 1000 }; withDistance(lat, lon); }
      return true;
    } catch (e) { return false; } finally { clearTimeout(t); }
  }

  /* Address -> coordinates (Nominatim; cached; 1 request per search). */
  async function geocode(q) {
    const cache = store.get(GEO) || {};
    const key = q.trim().toLowerCase();
    if (cache[key]) return cache[key];
    const url = `${NOMINATIM}?format=jsonv2&limit=5&countrycodes=ca,us&addressdetails=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } }).then((r) => r.json());
    const seen = new Set();   // Nominatim often returns the same address as a building, a node and an entrance
    const out = res.map((x) => ({ label: [x.address?.house_number, x.address?.road].filter(Boolean).join(" ") || x.display_name.split(",")[0],
      city: [x.address?.city || x.address?.town || x.address?.village, x.address?.state].filter(Boolean).join(", "), lat: +x.lat, lon: +x.lon }))
      .filter((o) => !seen.has(o.label + o.city) && seen.add(o.label + o.city));
    cache[key] = out; store.set(GEO, cache);
    return out;
  }

  /* coordinates -> a street label (Nominatim reverse, cached). Used when the visitor shares their location. */
  async function reverse(lat, lon) {
    const cache = store.get(GEO) || {}, key = `@${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (cache[key]) return cache[key];
    const x = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lon}`, { headers: { "Accept-Language": "en" } }).then((r) => r.json());
    const a = x.address || {}, out = { label: [a.house_number, a.road].filter(Boolean).join(" ") || a.neighbourhood || a.suburb || "Your location",
      city: [a.city || a.town || a.village, a.state].filter(Boolean).join(", ") };
    cache[key] = out; store.set(GEO, cache);
    return out;
  }

  function search(q, list = all) {
    q = q.trim().toLowerCase().replace(/s$/, "");
    if (!q) return list;
    return list.filter((p) => (p.name + " " + p.cuisine + " " + p.label + " " + p.brand).toLowerCase().includes(q));
  }

  FP.places = { load, refresh, geocode, reverse, search, photoOf, kind, km, get all() { return all; }, get cover() { return cover; }, byId: (id) => all.find((p) => p.id === id) };
})();
