/* Real prices = observations captured by the Fairplate extension while someone browses Uber Eats / DoorDash / Skip.
   An observation: { id, app, kind: "menu"|"checkout", store:{name,address,city,lat,lon,url}, items:[{name,price,section,deal,qty}],
   fees:{subtotal,delivery,service,small,tax,other,tip,discount}, total, at, place }
   The extension doesn't know our place ids, so resolve() matches its store to an OpenStreetMap place: by map point + name,
   or by exact name + street address. Never by name alone (there are 10 Pizza Pizzas downtown).
   Stored locally (this browser) and, when FP.API is set, shared through the backend. Nothing here is ever invented. */
window.FP = window.FP || {};
(function () {
  const KEY = "fairplate-obs-v1", MAX = 500;
  const listeners = new Set();
  FP.ext = { connected: false };

  /* Apps we compare. Search URLs send you to the right place on each app when we have no price yet. */
  const APPS = {
    ue: { name: "Uber Eats", short: "UE", badge: "Ue", search: (q) => `https://www.ubereats.com/search?q=${encodeURIComponent(q)}` },
    dd: { name: "DoorDash", short: "DD", badge: "DD", search: (q) => `https://www.doordash.com/search/store/${encodeURIComponent(q)}/` },
    /* Skip has no search URL (/search 404s, checked 2026-09-28), so find the exact store page through a site search */
    sk: { name: "Skip", short: "Skip", badge: "S", search: (q, addr = "") => `https://www.google.com/search?q=${encodeURIComponent(`site:skipthedishes.com ${q} ${addr}`.trim())}` },
  };

  /* ---------- shape checks: everything from a message or storage is untrusted ---------- */
  const str = (s, n = 120) => (typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");
  const num = (v, lo, hi) => (typeof v === "number" && isFinite(v) && v >= lo && v <= hi ? Math.round(v * 100) / 100 : undefined);
  const coord = (v, lim) => (typeof v === "number" && isFinite(v) && Math.abs(v) <= lim ? +v.toFixed(6) : null);
  const FEES = ["subtotal", "delivery", "service", "small", "tax", "other", "tip", "discount"];
  function clean(o, src, trusted) {
    if (!o || typeof o !== "object" || !Object.hasOwn(APPS, o.app) || (o.kind !== "menu" && o.kind !== "checkout")) return null;
    const s = o.store && typeof o.store === "object" ? o.store : {}, url = str(s.url, 300);
    const items = (Array.isArray(o.items) ? o.items.slice(0, 400) : []).map((it) => {
      if (!it || typeof it !== "object") return null;
      const x = { name: str(it.name), price: num(it.price, 0, 10000) }, sec = str(it.section, 80), deal = str(it.deal, 40), qty = num(it.qty, 1, 99);
      if (!x.name || x.price === undefined) return null;
      if (sec) x.section = sec;
      if (deal) x.deal = deal;
      if (qty !== undefined) x.qty = Math.round(qty);
      return x;
    }).filter(Boolean);
    const fees = {};
    FEES.forEach((k) => { const v = num(o.fees && o.fees[k], -10000, 10000); if (v !== undefined) fees[k] = v; });
    const at = num(o.at, 1e12, Date.now() + 60000) || Date.now();
    const out = { id: str(o.id, 80) || `${o.app}-${o.kind}-${at}`, app: o.app, kind: o.kind, items, fees, at,
      store: { name: str(s.name), address: str(s.address, 160), city: str(s.city, 80), lat: coord(s.lat, 90), lon: coord(s.lon, 180),
        url: /^https:\/\/www\.(ubereats|doordash|skipthedishes)\.com\//.test(url) ? url : "" } };
    if (o.kind === "menu" && !items.length) return null;
    if (o.kind === "checkout") { out.total = num(o.total, 0, 10000); if (out.total === undefined) return null; }
    const note = str(o.note, 80), place = str(o.place, 32);
    if (note) out.note = note;
    if (trusted && /^[nwr]\d+$/.test(place)) out.place = place;   // only our own storage / backend: a message's store goes through resolve()
    if (["ext", "api", "site"].includes(src)) out.src = src;
    return out;
  }

  /* ---------- matching a captured store to an OpenStreetMap place ---------- */
  /* same rule as the extension's parse.js normName (a test checks they agree) */
  const STOP = new Set(["the", "restaurant", "restaurants"]);
  function normName(s) {
    return String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/\([^)]*\)|\[[^\]]*\]/g, " ").replace(/&/g, " and ").replace(/['\u2019`]/g, "")
      .replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w && !STOP.has(w)).join(" ");
  }
  const TYPES = new Set(["st", "street", "ave", "av", "avenue", "rd", "road", "blvd", "boulevard", "dr", "drive", "ln", "lane", "pl", "place", "ct", "court", "cres", "crescent", "sq", "square", "terr", "terrace", "pkwy", "parkway", "hwy", "highway", "cir", "circle", "trl", "trail"]);
  const DIRS = { e: "e", east: "e", w: "w", west: "w", n: "n", north: "n", s: "s", south: "s" };
  /* "109 Front St E" and "109 Front Street East" -> { num: "109", core: "front", dir: "e" } */
  function normAddr(s) {
    for (const part of String(s || "").split(",")) {
      const t = normName(part).split(" ").filter(Boolean);
      const i = t.findIndex((w, k) => /^\d+[a-z]?$/.test(w) && t[k + 1] && !/^\d/.test(t[k + 1]));
      if (i < 0) continue;
      const rest = t.slice(i + 1), core = rest.filter((w) => !DIRS[w] && !TYPES.has(w));
      return { num: t[i], core: (core.length ? core : rest).join(" "), dir: rest.filter((w) => DIRS[w]).map((w) => DIRS[w]).join("") };
    }
    return null;
  }
  const sameAddr = (a, b) => !!(a && b && a.num === b.num && a.core === b.core && (!a.dir || !b.dir || a.dir === b.dir));
  /* words that say what a place sells, not which place it is: "Pizza Pizza" vs "Pizza Nova" must not match */
  const GENERIC = new Set(["pizza", "pizzeria", "cafe", "coffee", "bar", "grill", "kitchen", "and", "house", "express", "food", "foods", "sushi", "thai", "burger", "burgers",
    "shawarma", "bakery", "chicken", "pho", "noodle", "noodles", "ramen", "taco", "tacos", "indian", "chinese", "bistro", "eatery", "deli", "co", "of", "on", "la", "le", "el", "de"]);
  const distinct = (ws) => ws.some((w) => w.length > 2 && !GENERIC.has(w) && !/^\d+$/.test(w));
  function nameScore(a, b) {   // both normName'd; 0 = no match
    if (!a || !b) return 0;
    if (a === b) return 3;
    const [s, l] = a.length < b.length ? [a, b] : [b, a];
    if (` ${l} `.includes(` ${s} `) && (distinct(s.split(" ")) || s.includes(" "))) return 2;
    const A = new Set(a.split(" ")), B = new Set(b.split(" ")), both = [...A].filter((w) => B.has(w));
    const j = both.length / new Set([...A, ...B]).size;
    return j >= 0.5 && distinct(both) ? 1 + j / 2 : 0;
  }
  function resolve(o, places = FP.places ? FP.places.all : []) {
    const s = o.store || {}, n = normName(s.name), a = normAddr(s.address);
    if (!n || !places.length) return null;
    if (typeof s.lat === "number" && typeof s.lon === "number") {   // map point: place within 250 m whose name matches; same street address, then nearest, breaks ties
      let best = null;
      for (const p of places) {
        const sc = nameScore(n, normName(p.name));
        if (!sc) continue;
        const d = FP.places.km(s.lat, s.lon, p.lat, p.lon);
        if (d > 0.25) continue;
        const ad = a && sameAddr(a, normAddr(p.addr)) ? 1 : 0;
        if (!best || sc > best.sc || (sc === best.sc && (ad > best.ad || (ad === best.ad && d < best.d)))) best = { p, sc, d, ad };
      }
      if (best) return best.p.id;
    }
    /* no map point (Skip): exact name AND same street number + street */
    const hit = a && places.find((p) => normName(p.name) === n && sameAddr(a, normAddr(p.addr)));
    return hit ? hit.id : null;
  }

  /* ---------- store ---------- */
  function load() {
    try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a.map((o) => clean(o, o && o.src, true)).filter(Boolean) : []; } catch (e) { return []; }
  }
  function save() {   // quota: halve until the newest ones fit; if nothing fits, drop the copy rather than leave a stale one
    for (let n = MAX; n >= 1; n = Math.floor(n / 2)) try { localStorage.setItem(KEY, JSON.stringify(obs.slice(-n))); return; } catch (e) {}
    try { localStorage.removeItem(KEY); } catch (e) {}
  }
  let obs = load(), placesRef = null, notifyT = 0;
  const notify = () => { clearTimeout(notifyT); notifyT = setTimeout(() => { save(); listeners.forEach((f) => f()); }, 30); };   // the bridge replays captures one message each: one re-render for the batch
  /* places load after the extension's first messages, and change when you move: retry unmatched captures then */
  function ensure() {
    const all = FP.places ? FP.places.all : [];
    if (!all.length || all === placesRef) return;
    placesRef = all;
    let hit = false;
    obs.forEach((o) => { if (!o.place) { const id = resolve(o, all); if (id) { o.place = id; hit = true; } } });
    if (hit) save();
  }

  function add(o, src = "site") {
    const c = clean(o, src, src === "api");
    if (!c || obs.some((x) => x.id === c.id)) return false;
    if (!c.place) c.place = resolve(c) || undefined;
    obs.push(c);
    if (obs.length > MAX) obs = obs.slice(-MAX);
    notify();
    if (FP.API && src !== "api") fetch(FP.API + "/observations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) }).catch(() => {});
    return true;
  }
  /* newest observation per app for a place */
  function latest(placeId, kind) {
    ensure();
    const out = {};
    for (const o of obs) if (o.place === placeId && (!kind || o.kind === kind) && (!out[o.app] || out[o.app].at < o.at)) out[o.app] = o;
    return out;
  }
  const checkedPlaces = () => { ensure(); return [...new Set(obs.filter((o) => o.place).map((o) => o.place))]; };
  async function sync(lat, lon) {
    if (!FP.API) return;
    try {
      const r = await fetch(`${FP.API}/observations?lat=${lat}&lon=${lon}&km=5`);
      if (!r.ok) return;
      const remote = await r.json();
      if (Array.isArray(remote)) remote.forEach((o) => add(o, "api"));
    } catch (e) {}
  }

  /* ---------- the extension's bridge (content script on this site) ---------- */
  window.addEventListener("message", (e) => {
    if (e.source !== window || e.origin !== location.origin || !e.data || typeof e.data !== "object") return;
    const d = e.data;
    if (d.type === "fairplate:obs") add(d.obs, "ext");
    else if (d.type === "fairplate:ext") {
      FP.ext = { connected: true, version: str(d.version, 20) };
      if (Array.isArray(d.ids)) { const keep = new Set(d.ids.map(String)); obs = obs.filter((o) => o.src !== "ext" || keep.has(o.id)); }   // cleared in the popup = gone here too
      notify();
    }
  });
  window.postMessage({ type: "fairplate:ping" }, location.origin);   // if the bridge started first, ask it to send everything again

  const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`; };
  FP.prices = { APPS, add, latest, checkedPlaces, sync, ago, resolve, normName, normAddr, onChange: (f) => listeners.add(f),
    get all() { ensure(); return obs.slice(); }, get count() { return obs.length; } };
})();
