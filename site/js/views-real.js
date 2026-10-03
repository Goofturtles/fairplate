/* Real mode: every restaurant from OpenStreetMap, prices only from real observations (Fairplate extension). */
(function () {
  const { I, esc, $, img, status, tabbar, stagger, reduce } = FP.ui;
  const V = FP.views, P = () => FP.places, X = () => FP.prices, S = () => FP.S;
  const mobile = () => FP.isMobile();
  const PAGE = 24;

  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const tint = (n) => `var(--t${[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % 6})`;   /* theme.css: pastel in light, deep tints in dark */
  /* No stock photos for real places: one cuisine photo repeated on every pizza place reads as fake. A name tile is honest. */
  function photo(p, h, w = "100%", vt = true) {
    const style = `width:${w};height:${h}px;background:${tint(p.name)}${vt ? `;view-transition-name:vt-${p.id}` : ""}`;
    const ph = P().photoOf(p);
    if (ph) return `<img class="ex" src="${img(ph)}" alt="Example photo of ${esc(p.label)} food, not from ${esc(p.name)}" title="Example photo, not from this restaurant" loading="lazy" style="${style};object-fit:cover">`;
    if (h < 100) return `<div role="img" aria-label="${esc(p.name)}" style="${style};display:grid;place-items:center;font-weight:700;font-size:${Math.round(h / 3.2)}px;line-height:1.25;color:var(--ink2)">${esc(initials(p.name))}</div>`;
    return `<div class="nametile" role="img" aria-label="${esc(p.name)}" style="${style}"><b style="font-size:${h > 220 ? 34 : 24}px">${esc(p.name)}</b><span>${esc(p.label)}</span></div>`;
  }
  const walk = (km) => `${Math.max(1, Math.round(km * 12))} min walk`;
  const dist = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

  /* price line for a card: real checkout totals, else which apps' menus were captured, else an honest "no price yet" */
  function priceLine(p) {
    const got = X().latest(p.id, "checkout"), apps = Object.values(got).sort((a, b) => a.total - b.total);
    if (!apps.length) {
      const menu = X().latest(p.id, "menu"), ms = APPS3.filter((a) => menu[a]);
      if (ms.length) return `<div class="pcs"><span style="color:var(--ink);font-weight:600">Menu prices from ${ms.map((a) => X().APPS[a].short).join(", ")}</span><span>${X().ago(Math.max(...ms.map((a) => menu[a].at)))}</span></div>`;
      return `<div class="pcs"><span>No price yet</span></div>`;
    }
    return `<div class="pcs">${apps.map((o, i) => `<span${i === 0 ? ' class="best"' : ""}>${X().APPS[o.app].short} ${$(o.total)}</span>`).join("")}<span>${X().ago(apps[0].at)}</span></div>`;
  }
  const APPS3 = ["ue", "dd", "sk"];
  const heart = (id) => `<button class="heart${S().saved[id] ? " on" : ""}" data-a="save" data-id="${id}" aria-label="Save">${I("heart", "s")}</button>`;

  const hrs = (p) => (FP.hours && p.hours ? FP.hours.status(p.hours) : null);   /* null = hours unknown: show nothing */
  /* 3D map: MapLibre GL (open source) + OpenFreeMap vector tiles (free, no key). Loaded only when the map view opens,
     so no other page pays for it; without WebGL there is no map toggle. */
  const webgl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } })();
  const hasMap = () => webgl;
  const priced = (id) => Object.keys(X().latest(id)).length > 0;
  const GRID = `<svg class="ic" viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>`;

  /* photo-led card: example photo (labelled), hours badge only when OSM hours are readable, name, cuisine · distance · walk, real price line */
  /* phone map strip: a compact card per place, snapped; the one in the middle is the one lit on the map */
  function mini(p) {
    const ph = P().photoOf(p), h = hrs(p);
    return `<a href="#/p/${p.id}" class="fd-mini" data-id="${p.id}">${ph ? `<img src="${img(ph)}" alt="" loading="lazy">` : `<span class="fd-mini-t" style="background:${tint(p.name)}">${esc(initials(p.name))}</span>`}
      <div><b>${esc(p.name)}</b><span>${esc(p.label)} · ${dist(p.km)}${h ? ` · <em class="${h.open ? "o" : ""}">${h.open ? "Open" : "Closed"}</em>` : ""}</span>${priceLine(p)}</div></a>`;
  }
  function card(p) {
    const h = hrs(p), badges = (h ? `<span class="fd-badge${h.open ? " open" : ""}" title="${esc(h.label)}"><i></i>${h.open ? "Open now" : "Closed"}</span>` : "") + (priced(p.id) ? `<span class="chip hl">Real prices</span>` : "");
    return `<a href="#/p/${p.id}" class="fd-card" data-id="${p.id}">
      <div class="ph fd-ph zoom">${photo(p, 220)}${badges ? `<div class="fd-badges">${badges}</div>` : ""}${heart(p.id)}${P().photoOf(p) ? `<span class="fd-ex">Example photo</span>` : ""}</div>
      <b class="fd-name">${esc(p.name)}</b>
      <div class="fd-meta">${esc(p.label)} · ${dist(p.km)} · ${walk(p.km)}</div>${priceLine(p)}</a>`;
  }
  const popup = (p) => { const h = hrs(p);
    return `<a href="#/p/${p.id}" class="fd-popcard">${P().photoOf(p) ? `<span class="fd-popimg">${photo(p, 116, "100%", false)}<span class="fd-ex">Example photo</span></span>` : ""}
      <span class="fd-popbody"><b>${esc(p.name)}</b><span class="fd-popmeta">${esc(p.label)} · ${dist(p.km)}${h ? ` · ${h.open ? "Open now" : "Closed"}` : ""}</span>${priceLine(p)}<span class="fd-popgo">View place ${I("arrow", "s")}</span></span></a>`; };

  /* categories actually present nearby, most common first */
  function cats() {
    const c = {};
    P().all.forEach((p) => { if (p.cat !== "other") c[p.cat] = c[p.cat] || { n: 0, label: p.label, img: p.img }; if (c[p.cat]) c[p.cat].n++; });
    return Object.entries(c).sort((a, b) => b[1].n - a[1].n);
  }
  function filterList(p) {
    let list = P().search(p.get("q") || "");
    const kept = {};
    list = list.filter((x) => { const k = x.name.toLowerCase().replace(/[^a-z0-9]/g, ""), near = (kept[k] || []).some((y) => P().km(x.lat, x.lon, y.lat, y.lon) < 0.2);
      if (!near) (kept[k] = kept[k] || []).push(x); return !near; });
    if (p.get("cat")) list = list.filter((x) => x.cat === p.get("cat"));
    if (p.get("priced")) list = list.filter((x) => priced(x.id));
    if (p.get("saved")) list = list.filter((x) => S().saved[x.id]);
    if (p.get("type")) list = list.filter((x) => x.amenity === p.get("type"));
    let noHours = 0;   // "Open now" can only keep places whose hours we can read; the rest are hidden and counted, never guessed
    if (p.get("open")) list = list.filter((x) => { const h = hrs(x); if (!h) noHours++; return !!(h && h.open); });
    if (p.get("sort") === "priced") {   // checkout totals, then captured menus, then the rest; distance order kept inside each group (stable sort)
      const rank = new Map(list.map((x) => [x.id, Object.keys(X().latest(x.id, "checkout")).length ? 0 : priced(x.id) ? 1 : 2]));
      list = list.slice().sort((a, b) => rank.get(a.id) - rank.get(b.id));
    }
    list.noHours = noHours;
    return list;
  }

  /* ---------- list (desktop feed + map split / phone results) ---------- */
  V.realList = (p, tab) => {
    const list = filterList(p), n = Math.min(list.length, PAGE * (+p.get("page") || 1)), shown = list.slice(0, n);
    const ph = mobile(), map = p.get("view") === "map" && hasMap(), q = p.get("q") || "";
    const to = (u) => "#/feed" + (String(u) ? "?" + u : "");
    const edit = (f) => { const u = new URLSearchParams(p); u.delete("page"); f(u); return to(u); };
    const link = (k, v) => edit((u) => (u.get(k) === String(v) ? u.delete(k) : u.set(k, v)));   // toggle
    const setp = (k, v) => edit((u) => (v ? u.set(k, v) : u.delete(k)));                       // set / clear
    const active = ["q", "cat", "priced", "type", "saved", "open"].some((k) => p.get(k));
    const reset = map ? "#/feed?view=map" : "#/feed";
    const on = (b) => (b ? ` class="on" aria-current="true"` : "");

    const cat = p.get("cat"), catA = (k, label, pic) => `<a href="${k ? link("cat", k) : setp("cat")}" class="fd-cat${(k ? cat === k : !cat) ? " on" : ""}"><span class="fd-ci">${pic}</span><span class="fd-cl">${esc(label)}</span></a>`;
    const catRow = catA("", "All", GRID) + cats().slice(0, ph ? 12 : 24).map(([k, c]) => catA(k, c.label, c.img ? `<img src="${img(c.img)}" alt="" loading="lazy">` : `<b>${esc(c.label[0])}</b>`)).join("");
    const pill = (k, v, label, pre = "") => { const is = p.get(k) === String(v); return `<a class="pill${is ? " on" : ""}" href="${link(k, v)}"${is ? ' aria-current="true"' : ""}>${pre}${label}</a>`; };
    const pills = pill("open", 1, "Open now", `<i class="fd-dot"></i>`) + pill("priced", 1, "Has real prices") + `<span class="fd-sep"></span>`
      + pill("type", "restaurant", "Restaurants") + pill("type", "fast_food", "Fast food") + pill("type", "cafe", "Cafés") + `<span class="fd-sep"></span>`
      + pill("saved", 1, "Saved", I("heart", "s")), resetA = active ? `<a class="pill fd-reset" href="${reset}">Reset</a>` : "";
    const byPrice = p.get("sort") === "priced";
    const sortSeg = `<div class="fd-seg" role="group" aria-label="Sort"><a href="${setp("sort")}"${on(!byPrice)}>Distance</a><a href="${setp("sort", "priced")}"${on(byPrice)}>Real prices first</a></div>`;
    const viewSeg = hasMap() ? `<div class="fd-seg" role="group" aria-label="View"><a href="${setp("view")}"${on(!map)}>${I("menu", "s")}List</a><a href="${setp("view", "map")}"${on(map)}>${I("pin", "s")}Map</a></div>` : "";

    const head = `<b class="fd-count">${list.length.toLocaleString()} place${list.length === 1 ? "" : "s"}${q ? ` for “${esc(q)}”` : ""} near ${esc(S().addr)}</b>`;
    const note = p.get("open") && list.noHours ? `<span class="fd-note">${I("clock", "s")}${list.noHours.toLocaleString()} with unknown hours hidden</span>` : "";
    const credit = `<span class="fd-credit">Photos are examples of the food · © OpenStreetMap contributors</span>`;
    const empty = p.get("priced") && !X().count   // nothing captured yet: say where real prices come from
      ? `<div class="fd-empty"><b>No real prices yet</b><span>Prices show up here once the Fairplate extension saves them from Uber Eats, DoorDash or Skip.</span><a class="btn ghost sm" href="#/extension">Get the extension</a></div>`
      : `<div class="fd-empty"><b>Nothing matches</b><span>${note ? "Most places don't list their hours on OpenStreetMap." : "Try “pizza”, or clear a filter."}</span><a class="btn ghost sm" href="${reset}">Reset filters</a></div>`;
    const grid = `<div class="fd-grid" data-stagger>${shown.map(card).join("") || empty}</div>`;
    const more = n < list.length ? `<div class="fd-more"><a class="btn ghost" href="${edit((u) => u.set("page", (+p.get("page") || 1) + 1))}" data-keep>Show ${Math.min(PAGE, list.length - n)} more of ${list.length - n}</a></div>` : "";
    const bar = (inner) => `<div class="fd-sentinel"></div><div class="fd-bar${cat ? " has-cat" : ""}">${inner}</div>`;

    const html = ph ? `<div class="pg app fd fd-phone">${status()}
  <div class="pad" style="margin-top:6px"><div class="row"><a href="#/address" class="row g8" style="min-width:0">${I("pin")}<b style="font-size:16px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(S().addr)}</b>${I("down", "s")}</a><span class="sp"></span>${V.themeBtn()}</div>
    <form data-f="realsearch" class="search" style="margin-top:12px">${I("search", "s")}<input name="q" value="${esc(q)}" aria-label="Search" placeholder="Search ${P().all.length.toLocaleString()} places" style="flex:1;height:42px"></form></div>
  ${bar(`<div class="fd-cats scroll-x">${catRow}</div><div class="fd-pills scroll-x">${pills}</div>`)}
  <div class="fd-head">${head}</div><div class="fd-sub">${map ? "" : sortSeg}${viewSeg}<span class="sp"></span>${resetA}${note}</div>
  ${map ? `<div class="fd-pmap"><div class="fd-mapbox" role="region" aria-label="Map of the places listed"></div>
    <div class="fd-strip scroll-x" role="group" aria-label="Places on the map">${shown.map(mini).join("") || `<div class="fd-mini empty">${empty}</div>`}</div></div>`
  : `${grid}${more}<p class="fd-credit fd-foot">Photos are examples of the food · © OpenStreetMap contributors</p>`}
  <div class="tab-spacer"></div>${tabbar(tab || (p.get("saved") ? "Saved" : "Search"))}</div>`
      : `<div class="pg webp fd${map ? " fd-mapview" : ""}">${V.realTop(q)}
  ${bar(`<div class="fd-cats-wrap"><button class="fd-arrow l" aria-label="Scroll cuisines left" hidden>${I("left", "s")}</button><div class="fd-cats scroll-x">${catRow}</div><button class="fd-arrow r" aria-label="Scroll cuisines right" hidden>${I("right", "s")}</button></div>
    <div class="fd-tools"><div class="fd-pills">${pills}${resetA}</div><span class="sp"></span>${sortSeg}${viewSeg}</div>`)}
  ${map ? `<div class="fd-body"><div class="fd-main"><div class="fd-head">${head}${note}</div>${grid}${more}<p class="fd-credit fd-foot">Photos are examples of the food · © OpenStreetMap contributors</p></div><aside class="fd-map"><div class="fd-mapbox" role="region" aria-label="Map of the places listed"></div></aside></div>`
    : `<div class="fd-head">${head}${note}<span class="sp"></span>${credit}</div><div class="fd-body">${grid}${more}</div>`}</div>`;
    return { html, title: "Places near you · Fairplate", mount(root) { stagger(root); mountBar(root); if (map) mountMap(root, shown); } };
  };

  /* sticky filter bar: condenses once it sticks; cuisine carousel gets arrows + edge fades when it overflows */
  let io, ro, lmap, mro;
  function mountBar(root) {
    io && io.disconnect(); ro && ro.disconnect();
    const fd = root.querySelector(".fd"), bar = root.querySelector(".fd-bar"), sen = root.querySelector(".fd-sentinel"), box = root.querySelector(".fd-cats");
    if (!bar) return;
    io = new IntersectionObserver(([e]) => bar.classList.toggle("stuck", !e.isIntersecting && e.boundingClientRect.top < 0 && document.documentElement.scrollHeight - innerHeight > 320));
    io.observe(sen);
    ro = new ResizeObserver(() => fd.style.setProperty("--fdtop", bar.offsetHeight + "px"));
    ro.observe(bar);
    const sel = box.querySelector(".fd-cat.on:not(:first-child)");
    if (sel) box.scrollLeft = sel.offsetLeft - box.clientWidth / 2 + sel.offsetWidth / 2;
    const wrap = box.parentElement, l = wrap.querySelector(".fd-arrow.l"), r = wrap.querySelector(".fd-arrow.r");
    const edges = () => { const a = box.scrollLeft > 4, b = box.scrollLeft + box.clientWidth < box.scrollWidth - 4;
      wrap.classList.toggle("fl", a); wrap.classList.toggle("fr", b); if (l) { l.hidden = !a; r.hidden = !b; } };
    box.addEventListener("scroll", edges, { passive: true }); edges();
    [l, r].forEach((btn, i) => btn && btn.addEventListener("click", () => box.scrollBy({ left: (i ? 1 : -1) * box.clientWidth * 0.75, behavior: "smooth" })));
  }

  /* Airbnb-style split with a 3D city: tilted camera, extruded buildings shaded by height, soft light, sky + horizon haze,
     photo pins for the places in the list, your address pulsing. Renders only when something moves (no idle animation). */
  const GL = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl";
  const SRI = { js: "sha384-SYKAG6cglRMN0RVvhNeBY0r3FYKNOJtznwA0v7B5Vp9tr31xAHsZC0DqkQ/pZDmj", css: "sha384-MinO0mNliZ3vwppuPOUnGa+iq619pfMhLVUXfC4LHwSCvF9H+6P/KO4Q7qBOYV5V" };
  /* rebuilding the map on a redraw cancels its in-flight tile requests on purpose; don't report those cancellations as errors */
  addEventListener("unhandledrejection", (e) => { if (e.reason && e.reason.name === "AbortError" && lmap !== undefined) e.preventDefault(); });
  let glReady, tmo, cam = null, camIds = "";   // last camera + which places it framed: a redraw keeps the view instead of replaying the intro
  function loadGL() {
    if (window.maplibregl) return Promise.resolve(window.maplibregl);
    return (glReady = glReady || new Promise((res, rej) => {
      document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href: GL + ".css", integrity: SRI.css, crossOrigin: "anonymous" }));
      document.head.append(Object.assign(document.createElement("script"), { src: GL + ".js", integrity: SRI.js, crossOrigin: "anonymous",
        onload: () => res(window.maplibregl), onerror: () => { glReady = null; rej(new Error("map library")); } }));
    }));
  }
  const dark = () => document.documentElement.dataset.theme === "dark";
  const styleUrl = () => `https://tiles.openfreemap.org/styles/${dark() ? "dark" : "positron"}`;
  const TILT = { pitch: 52, bearing: -18 };   // enough tilt for depth, low enough that streets between towers stay visible
  /* map colours: blue water, green parks, warm land, brand-yellow main roads; buildings run from warm low-rises to glass-blue towers (b: 0 / 40 / 120 / 250 m) */
  const PAL = {
    light: { bg: "#f3efe6", resi: "#f0ebe1", green: "#c9e4ba", wood: "#b7dba8", sand: "#f3e6c4", edu: "#f3e8d0", care: "#f7e0dc", water: "#a9d4f3", wlabel: "#33709e",
      minor: "#ffffff", major: "#ffffff", pri: "#ffe6a0", mcase: "#e2d9c6", mw: "#ffd166", mwcase: "#e6b54a", path: "#ded6c5", rail: "#cdc6b8",
      flat: "#ebe2d3", b: ["#efe5d5", "#e7ddd0", "#d5dbe7", "#b9c9e2"] },
    dark: { bg: "#14151b", resi: "#16171e", green: "#18352a", wood: "#153024", sand: "#2a2619", edu: "#211f1a", care: "#261b1f", water: "#0f2942", wlabel: "#7fb0d8",
      minor: "#2f313d", major: "#414454", pri: "#6b5b2c", mcase: "#1b1c23", mw: "#8c7431", mwcase: "#1b1c23", path: "#262731", rail: "#2c2d38",
      flat: "#20222b", b: ["#262833", "#2d3040", "#363d59", "#434f78"] }
  };
  /* after each style load: our colours, 3D buildings under the labels, a key light, and the sky */
  function dress(m, phone) {
    /* above every road/fill layer (the Dark style lists a label early, so "first label" would bury the buildings), under the labels that follow */
    const d = dark(), C = PAL[d ? "dark" : "light"], L = m.getStyle().layers, last = L.reduce((k, l, i) => (l.type !== "symbol" ? i : k), -1);
    const below = (L.slice(last + 1).find((l) => l.type === "symbol") || {}).id, h = ["coalesce", ["get", "render_height"], 0];
    if (!m.getLayer("fp-3d")) m.addLayer({ id: "fp-3d", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 13.5, paint: {
      "fill-extrusion-color": ["interpolate", ["linear"], h, 0, C.b[0], 40, C.b[1], 120, C.b[2], 250, C.b[3]],
      "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13.5, 0, 15, h],
      "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
      "fill-extrusion-opacity": d ? 0.86 : 0.8, "fill-extrusion-vertical-gradient": true } }, below);
    /* the Dark style lists its street names before the buildings, which would paint the towers over them: lift those names above */
    L.slice(0, last).forEach((l) => { if (l.type === "symbol" && l.layout && l.layout["text-field"]) m.moveLayer(l.id, below); });
    /* city parks, sports fields and campuses: the base styles draw none of them, so two fills of our own go under the roads and buildings */
    const under = m.getLayer("building") ? "building" : below, cls = (list) => ["match", ["get", "class"], list, true, false];
    if (!m.getLayer("fp-use")) m.addLayer({ id: "fp-use", type: "fill", source: "openmaptiles", "source-layer": "landuse",
      filter: cls(["pitch", "stadium", "playground", "cemetery", "school", "university", "college", "kindergarten", "hospital"]),
      paint: { "fill-color": ["match", ["get", "class"], ["school", "university", "college", "kindergarten"], C.edu, "hospital", C.care, C.green] } }, under);
    if (!m.getLayer("fp-green")) m.addLayer({ id: "fp-green", type: "fill", source: "openmaptiles", "source-layer": "landcover",
      filter: cls(["grass", "wood", "wetland", "sand"]), paint: { "fill-color": ["match", ["get", "class"], "wood", C.wood, "sand", C.sand, C.green] } }, under);
    /* recolour the grey base style layer by layer, then labels that read over a 3D city: high-contrast names with a solid halo, bigger bold street names */
    L.forEach((l) => {
      const id = l.id, sl = l["source-layer"] || "";
      if (l.type === "background") m.setPaintProperty(id, "background-color", C.bg);
      if (l.type === "fill") {
        const c = sl === "water" ? C.water : sl === "building" ? C.flat : /pier/.test(id) ? C.bg : /wood/.test(id) ? C.wood : /park/.test(id) ? C.green : /residential/.test(id) ? C.resi : null;
        if (c) m.setPaintProperty(id, "fill-color", c);
      }
      if (l.type === "line") {
        const c = sl === "waterway" ? C.water : sl !== "transportation" ? null : /pier/.test(id) ? C.bg : /rail/.test(id) ? (/dash/.test(id) ? C.bg : C.rail) : /path/.test(id) ? C.path
          : /motorway/.test(id) ? (/casing/.test(id) ? C.mwcase : C.mw) : /casing/.test(id) ? C.mcase : /minor/.test(id) ? C.minor : ["match", ["get", "class"], ["primary", "trunk"], C.pri, C.major];
        if (c) m.setPaintProperty(id, "line-color", c);
      }
      if (l.type !== "symbol" || !(l.layout && l.layout["text-field"])) return;
      if (/water/.test(id)) { m.setPaintProperty(id, "text-color", C.wlabel); m.setPaintProperty(id, "text-halo-color", d ? "rgba(10,10,14,.6)" : "rgba(255,255,255,.7)"); return; }
      m.setPaintProperty(l.id, "text-color", d ? "#f3f3f6" : "#15161a");
      m.setPaintProperty(l.id, "text-halo-color", d ? "rgba(10,10,14,.95)" : "rgba(255,255,255,.97)");
      m.setPaintProperty(l.id, "text-halo-width", 1.8);
      if (l["source-layer"] === "transportation_name") {
        m.setLayoutProperty(l.id, "text-font", ["Noto Sans Bold"]);
        /* footpaths (incl. Toronto's underground PATH) smaller and muted, so they never read as streets */
        const fp = (a, b) => ["match", ["get", "class"], ["path", "track"], a, b];
        m.setLayoutProperty(l.id, "text-size", ["interpolate", ["linear"], ["zoom"], 13, fp(9, 11), 15, fp(10, 13.5), 17, fp(11.5, 16), 19, fp(13, 18)]);
        m.setPaintProperty(l.id, "text-color", fp(d ? "#9a9ba6" : "#7a7c85", d ? "#f3f3f6" : "#15161a"));
      }
    });
    m.setLight({ anchor: "viewport", color: d ? "#e8ebf5" : "#ffffff", intensity: d ? 0.42 : 0.42, position: [1.35, 205, 32] });
    /* horizon haze: desktop only (on a tall phone screen it just hides the far streets) */
    if (!phone && m.setSky) m.setSky({ "sky-color": d ? "#0b0d16" : "#cfe4f7", "horizon-color": d ? "#1c1f2e" : "#f6efe2", "fog-color": C.bg,
      "sky-horizon-blend": 0.7, "horizon-fog-blend": 0.55, "fog-ground-blend": 0.25 });
  }
  /* The map is built once per view and address. A redraw (new prices, the live places refresh, "Show more", a filter) moves the
     running map into the new page and only swaps the pins, so there is no rebuild, no tile reload and no replayed intro. */
  let pinMarkers = [], ctlEl = null;
  function mountMap(root, shown) {
    const box = root.querySelector(".fd-mapbox"); if (!box) return;
    const ids = shown.map((p) => p.id).join(), changed = ids !== camIds; camIds = ids;
    loadGL().then((gl) => {
      if (!box.isConnected) return;   // the visitor already left the map view
      const s = S(), still = reduce() || document.body.classList.contains("still"), pm = box.closest(".fd-pmap"), phone = !!pm, key = `${phone}|${s.lat},${s.lon}`;
      if (pm) pm.style.height = Math.max(420, innerHeight - pm.getBoundingClientRect().top) + "px";   // phone: the map runs to the bottom of the screen, under the tab bar; the card strip is pinned above it
      const tilt = phone ? { pitch: 36, bearing: -14 } : TILT;   // a tall narrow screen shows too much sky at full tilt
      let m = lmap, el, fresh = false;
      if (m && m._fpKey === key) { el = m.getContainer(); box.replaceWith(el); m.resize(); }
      else {
        if (m) { cam = { center: m.getCenter(), zoom: m.getZoom(), pitch: m.getPitch(), bearing: m.getBearing() }; try { m.remove(); } catch (e) {} }   // removing a map whose style is still loading throws; carry on
        mro && mro.disconnect(); tmo && tmo.disconnect();
        el = box; fresh = true;
        /* FP.map3d: exposed for tools/map_shots.cjs */
        m = lmap = FP.map3d = new gl.Map({ container: el, style: styleUrl(), ...(cam || { center: [s.lon, s.lat], zoom: 13.4, pitch: 20, bearing: 0 }), maxPitch: 70,
          antialias: true, attributionControl: { compact: true }, dragRotate: true, fadeDuration: 180 });
        m._fpKey = key;
        m.addControl(new gl.NavigationControl({ visualizePitch: true, showZoom: !phone }), "top-right");
        m.on("style.load", () => dress(m, phone));
        m.on("zoom", () => el.classList.toggle("near", m.getZoom() >= 16.3));   // names under the pins only when there is room
        const you = document.createElement("div"); you.className = "fd-you3"; you.innerHTML = `<i></i><b>${I("home", "s")}</b>`; you.title = s.addr;
        new gl.Marker({ element: you }).setLngLat([s.lon, s.lat]).addTo(m);
        /* theme switch while the map is open: swap to the matching style; buildings, labels, light and sky follow via style.load */
        tmo = new MutationObserver(() => m.setStyle(styleUrl()));
        tmo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        mro = new ResizeObserver(() => m.resize()); mro.observe(el);
      }
      /* pins for the places in this render: photo pin (yellow ring = real prices captured), desktop popup, phone card strip */
      pinMarkers.forEach((mk) => mk.remove()); pinMarkers = [];
      const bounds = new gl.LngLatBounds([s.lon, s.lat], [s.lon, s.lat]), pins = {}, strip = root.querySelector(".fd-strip");
      const cardEl = (id) => root.querySelector(`.fd-card[data-id="${id}"], .fd-mini[data-id="${id}"]`);
      const glow = (id, v) => { pins[id]?.getElement().classList.toggle("on", v); cardEl(id)?.classList.toggle("hl", v); };
      let lit = null, st;
      const pick = (id, scroll) => {
        if (lit === id) return; if (lit) glow(lit, false); lit = id; glow(id, true);
        const c = cardEl(id); if (scroll && c && strip) strip.scrollTo({ left: c.offsetLeft - (strip.clientWidth - c.offsetWidth) / 2, behavior: still ? "auto" : "smooth" });
      };
      shown.forEach((p) => {
        const pe = document.createElement("button"), ph = P().photoOf(p);
        pe.type = "button"; pe.className = "fd-pin3" + (priced(p.id) ? " pr" : ""); pe.setAttribute("aria-label", p.name);
        pe.innerHTML = `<span>${ph ? `<img src="${img(ph)}" alt="" loading="lazy">` : `<b>${esc(initials(p.name))}</b>`}</span><em>${esc(p.name)}</em>`;
        pe.addEventListener("mouseenter", () => glow(p.id, true)); pe.addEventListener("mouseleave", () => glow(p.id, false));
        pe.addEventListener("click", () => { if (!still) m.easeTo({ center: [p.lon, p.lat], zoom: Math.max(m.getZoom(), 16.2), ...tilt, duration: 900 }); if (phone) pick(p.id, true); });
        const mk = new gl.Marker({ element: pe, anchor: "bottom" }).setLngLat([p.lon, p.lat]);
        if (!phone) mk.setPopup(new gl.Popup({ offset: 46, closeButton: false, className: "fd-pop3", maxWidth: "260px" }).setHTML(popup(p)));
        pins[p.id] = mk.addTo(m); pinMarkers.push(mk); bounds.extend([p.lon, p.lat]);
      });
      root.querySelectorAll(".fd-card").forEach((c) => { c.addEventListener("mouseenter", () => glow(c.dataset.id, true)); c.addEventListener("mouseleave", () => glow(c.dataset.id, false)); });
      /* phone: tap a pin -> its card slides to the middle; swipe the strip -> the middle card's pin lights up and the map glides to it */
      if (strip) strip.addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(() => {
        const mid = strip.scrollLeft + strip.clientWidth / 2, c = [...strip.querySelectorAll(".fd-mini[data-id]")].sort((x, y) => Math.abs(x.offsetLeft + x.offsetWidth / 2 - mid) - Math.abs(y.offsetLeft + y.offsetWidth / 2 - mid))[0];
        if (!c || c.dataset.id === lit) return; pick(c.dataset.id, false);
        const q = shown.find((x) => x.id === c.dataset.id); if (q) m.easeTo({ center: [q.lon, q.lat], duration: still ? 0 : 700 });
      }, 140); }, { passive: true });
      /* camera: the first open sweeps from a flat overview into 3D; new places get a quick reframe; a plain redraw stays put */
      const frame = (ms) => m.fitBounds(bounds, { padding: phone ? { top: 30, bottom: 130, left: 30, right: 30 } : { top: 70, bottom: 60, left: 50, right: 70 }, maxZoom: 16.4, ...tilt, duration: ms });
      if (fresh) m.once("load", () => { el.classList.add("ready"); if (changed || !cam) frame(still ? 0 : cam ? 900 : 2400); });
      else if (changed) frame(still ? 0 : 900);
      /* 2D / 3D and recenter, over the map */
      ctlEl && ctlEl.remove();
      ctlEl = document.createElement("div"); ctlEl.className = "fd-mapctl";
      const flatNow = m.getPitch() <= 5;
      ctlEl.innerHTML = `<button type="button" data-k="tilt" aria-pressed="${!flatNow}">${flatNow ? "2D" : "3D"}</button><button type="button" data-k="fit" aria-label="Recenter on these places">${I("loc", "s")}</button>`;
      ctlEl.addEventListener("click", (e) => { const bt = e.target.closest("button"); if (!bt) return;
        if (bt.dataset.k === "fit") return frame(still ? 0 : 900);
        const flat = m.getPitch() > 5; m.easeTo({ pitch: flat ? 0 : tilt.pitch, bearing: flat ? 0 : tilt.bearing, duration: still ? 0 : 800 });
        bt.textContent = flat ? "2D" : "3D"; bt.setAttribute("aria-pressed", String(!flat)); });
      el.parentElement.append(ctlEl);
    }).catch((e) => { console.warn("3D map unavailable:", e && e.message); box.classList.add("ready", "fail"); box.innerHTML = `<p class="fd-mapfail">The map couldn't load. The list works without it.</p>`; });
  }

  /* light / dark switch (app.js action "theme"); both icons render, theme.css shows the right one */
  V.themeBtn = () => `<button class="themebtn" data-a="theme" aria-label="${document.documentElement.dataset.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}"><svg class="ic sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg><svg class="ic moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg></button>`;

  V.realTop = (q = "") => `<header class="wtop">
    <a href="#/" class="logo" style="line-height:1.25"><span class="mark"></span>fairplate</a>
    <a href="#/address" class="row g6" style="font-weight:600">${I("pin", "s")}${esc(S().addr)}${I("down", "s")}</a>
    <form data-f="realsearch" class="search" style="flex:1;height:44px;border-radius:99px">${I("search", "s")}<input name="q" value="${esc(q)}" aria-label="Search" placeholder="Search ${P().all.length.toLocaleString()} restaurants, cafés and dishes" style="flex:1;height:40px"></form>
    ${V.themeBtn()}${(FP.ext || {}).connected ? `<a class="btn ghost sm" href="#/extension">${I("check", "s")}Extension on</a>` : `<a class="btn hl sm" href="#/extension">Get the extension</a>`}</header>`;

  /* ---------- address (real geocoding) ---------- */
  V.realAddress = () => ({ title: "Address · Fairplate", html: `<div class="pg ${mobile() ? "app" : "webp"}">${mobile() ? status() : V.realTop()}
    <div style="max-width:560px;margin:0 auto;padding:22px 20px 60px"><a href="#/" data-a="back" class="iconbtn" aria-label="Back">${I("back")}</a>
    <div class="h1" style="line-height:1.25;font-size:32px;margin-top:20px">Where should we check?</div><p class="muted" style="margin-top:6px">Prices and fees change with your address.</p>
    <form data-f="geo" style="margin-top:22px"><label style="display:block;border:2px solid var(--ink);border-radius:12px;padding:8px 14px"><div class="tiny muted">Address</div><input name="q" data-live="geo" value="" placeholder="e.g. 100 Queen St W, Toronto" aria-label="Address" style="width:100%;font-size:17px;font-weight:500;height:26px" autocomplete="off"></label></form>
    <button data-a="gps" class="row g12" style="height:62px;width:100%">${I("loc")}<b>Use current location</b></button>
    <div data-geo-list class="col"></div></div></div>` });

  /* shared with views-place.js and views-extpage.js */
  FP.rv = { initials, tint, photo, walk, dist, priceLine, heart, APPS3 };
})();
