/* Fairplate app: state, router, page transitions, actions. */
(function () {
  const { I, $, countUp, stagger, segs, collapse, accordion, toast, bump, flip, reduce } = FP.ui;
  const V = FP.views, E = FP.engine;
  const qp = new URLSearchParams(location.search);
  const STILL = qp.has("still"), FORCE_MOBILE = qp.has("m"), SAMPLE = qp.has("sample") || STILL;
  FP.SAMPLE = SAMPLE;
  if (STILL) document.body.classList.add("still");
  if (FORCE_MOBILE) document.body.classList.add("demo");

  /* ---------- state ---------- */
  const DEFAULTS = { addr: "100 Queen St W", city: "Toronto, ON", lat: 43.6525, lon: -79.3835, locSource: "preset", locAsked: false, restId: "qsb", basket: { smash: 2, fries: 1 }, tip: 3, mode: "delivery", choice: null,
    sort: "rec", recent: ["pad thai", "smash burger", "poutine"], welcome: true, saved: {}, watch: false, range: "1 month", plan: "dd", withFees: true };
  const KEY = SAMPLE ? "fairplate-sample-v1" : "fairplate-v2";   // sample mode's made-up addresses have no coordinates; never let them leak into the real site
  let saved = null;
  if (!STILL) try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  FP.S = Object.assign({}, DEFAULTS, saved || {});
  if (saved && !saved.locSource && saved.addr && saved.addr !== DEFAULTS.addr) FP.S.locSource = "typed";   // saved before sources were tracked
  FP.S.checkedAt = STILL ? Date.now() - 12000 : FP.S.checkedAt || Date.now() - 12000;
  FP.checked = {};
  const persist = () => { if (STILL) return; try { localStorage.setItem(KEY, JSON.stringify(FP.S)); } catch (e) {} };
  const S = FP.S;
  // saved state from an older data.js can point at restaurants/items that no longer exist: reset those
  if (!E.rest(S.restId) || Object.keys(S.basket).some((id) => !E.item(E.rest(S.restId), id))) { S.restId = "qsb"; S.basket = { smash: 2, fries: 1 }; S.choice = null; }

  const mobile = () => FORCE_MOBILE || matchMedia("(max-width: 760px)").matches;
  FP.isMobile = mobile;

  /* ---------- routes ---------- */
  const REAL = [   // real mode: OpenStreetMap places + observed prices (sample mode keeps the old fictional set)
    [/^\/?$/, (p) => (mobile() ? V.realList(p) : V.landingReal())],
    [/^\/(feed|results|search)$/, (p) => V.realList(p)],
    [/^\/p\/([\w-]+)$/, (p, id) => V.realPlace(p, id)],
    [/^\/address$/, () => V.realAddress()],
    [/^\/extension$/, () => V.extension()],
    /* the phone tab bar's Price watch and Me: places with captured prices, and your extension + captured data */
    [/^\/history$/, (p) => { p.set("priced", "1"); return V.realList(p, "Price watch"); }],
    [/^\/membership$/, () => V.extension("Me")],
  ];
  const R = [
    [/^\/?$/, (p) => (mobile() ? V.home() : V.landing())],
    [/^\/(feed|results|search)$/, (p, w) => (mobile() ? (w === "search" ? V.search() : V.results(p)) : V.feed(p))],
    [/^\/r\/([\w-]+)$/, (p, id) => (mobile() ? V.restaurantApp(p, id) : V.restaurantWeb(p, id))],
    [/^\/r\/([\w-]+)\/item\/([\w-]+)$/, (p, id, it) => (mobile() ? V.item(p, id, it) : V.restaurantWeb(p, id))],
    [/^\/basket$/, (p) => (mobile() ? V.basket() : V.compareWeb(p))],
    [/^\/compare$/, (p) => (mobile() ? V.compareApp() : V.compareWeb(p))],
    [/^\/fees\/(\w+)$/, (p, a) => (mobile() ? V.fees(p, a) : Object.assign(V.compareWeb(p), { anchor: "fees" }))],
    [/^\/checkout$/, (p) => (mobile() ? V.checkoutApp() : V.checkoutWeb())],
    [/^\/history$/, (p) => (mobile() ? V.history() : Object.assign(V.compareWeb(p), { anchor: "history" }))],
    [/^\/membership$/, (p) => (mobile() ? V.membership() : Object.assign(V.compareWeb(p), { anchor: "fees" }))],
    [/^\/address$/, (p) => (mobile() ? V.address() : V.landing())],
  ];
  function resolve() {
    const h = location.hash.replace(/^#/, "") || "/";
    const [path, query] = h.split("?");
    const p = new URLSearchParams(query || "");
    for (const [re, fn] of (SAMPLE ? R : REAL.concat(R))) { const m = path.match(re); if (m) return fn(p, ...m.slice(1)); }
    return mobile() ? V.home() : V.landing();
  }

  /* ---------- render ---------- */
  const app = document.getElementById("app");
  const stack = [];
  let first = true;
  function render(opts = {}) {
    const view = resolve();
    const h = location.hash || "#/";
    const isBack = stack.length > 1 && stack[stack.length - 2] === h;
    if (!opts.keep) { if (isBack) stack.pop(); else if (stack[stack.length - 1] !== h) stack.push(h); }
    document.documentElement.dataset.dir = isBack ? "back" : "fwd";
    const olds = opts.countFrom ? [...app.querySelectorAll("[data-count]")].map((e) => parseFloat(e.dataset.prev || e.dataset.count)) : null;
    const y = window.scrollY;
    const swap = () => {
      app.innerHTML = view.html;
      document.title = view.title || "Fairplate";
      app.querySelectorAll("a,button,span").forEach((el) => { if (el.children.length === 1 && el.firstElementChild.matches(".ic") && !el.textContent.trim()) el.classList.add("ico"); });
      app.querySelectorAll(".seg span[data-v]").forEach((s) => { s.setAttribute("role", "button"); s.tabIndex = 0; });
      stagger(app); segs(app);
      if (opts.keep) { if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y); } else if (!view.anchor) window.scrollTo(0, 0);   // a no-op scrollTo would cancel a smooth scroll in progress
      view.mount && view.mount(app);
      if (olds) [...app.querySelectorAll("[data-count]")].forEach((e, i) => { const to = parseFloat(e.dataset.count); if (olds[i] !== undefined && olds[i] !== to) countUp(e, to, olds[i], 650, e.dataset.fmt === "plus" ? (n) => "+$" + n.toFixed(2) : $); else e.dataset.prev = to; });
      if (view.anchor) setTimeout(() => document.getElementById(view.anchor)?.scrollIntoView({ behavior: first ? "auto" : "smooth" }), 60);
      first = false;
    };
    if (!opts.keep && !first && document.startViewTransition && !reduce()) {
      const vt = document.startViewTransition(swap);   // a newer navigation can abort this one; that's fine, just don't leak rejections
      [vt.ready, vt.finished, vt.updateCallbackDone].forEach((pr) => pr.catch(() => {}));
    } else swap();
  }
  FP.rerender = (o = {}) => render(Object.assign({ keep: true }, o));

  /* ---------- the "checking 3 apps" sequence ---------- */
  FP.check = (root, key, delay = 0) => {
    if (!root) return;
    const rows = [...root.querySelectorAll(".chk")], banner = root.querySelector("[data-banner]");
    if (reduce() || FP.checked[key] || !rows.length) { FP.checked[key] = true; return; }
    FP.checked[key] = true;
    const orig = banner ? banner.innerHTML : "";
    const box = root.matches("[data-check]") ? root : root.querySelector("[data-check]") || root;
    box.classList.add("checking");
    rows.forEach((r) => r.classList.add("pending"));
    const name = (r) => (r.querySelector("b") || {}).textContent || "";
    let i = 0;
    const step = () => {
      if (i < rows.length) {
        const r = rows[i];
        if (banner) banner.innerHTML = `<span class="mini-spin"></span>Checking ${/Cheapest|Fastest|Pickup/.test(name(r)) ? "prices" : name(r)}…`;
        setTimeout(() => {
          r.classList.remove("pending"); r.classList.add("done");
          const v = r.querySelector(".val[data-count]");
          if (v) countUp(v, parseFloat(v.dataset.count), 0, 600);
          i++; step();
        }, 430);
      } else {
        box.classList.remove("checking");
        FP.S.checkedAt = Date.now(); persist();
        if (banner) banner.innerHTML = orig.includes("data-ago") ? orig.replace(/<span data-ago>.*?<\/span>/, "<span data-ago>just now</span>") : orig;
        FP.ago(root);
      }
    };
    setTimeout(step, delay);
  };
  let agoT;
  FP.ago = (root) => {
    clearInterval(agoT);
    const f = () => {
      const s = Math.round((Date.now() - FP.S.checkedAt) / 1000);
      const t = STILL ? "12 seconds ago" : s < 5 ? "just now" : s < 60 ? `${s} seconds ago` : `${Math.round(s / 60)} min ago`;
      document.querySelectorAll("[data-ago]").forEach((e) => (e.textContent = t));
    };
    f();
    if (!STILL) agoT = setInterval(f, 1000);
  };

  /* ---------- basket helpers ---------- */
  function setQty(rid, id, q) {
    if (S.restId !== rid) {
      const had = Object.keys(S.basket).length;
      S.restId = rid; S.basket = {}; S.choice = null;
      if (had) toast(`New basket at ${E.rest(rid).name}`);
    }
    if (q <= 0) delete S.basket[id]; else S.basket[id] = q;
    persist();
  }
  const go = (hash) => { location.hash = hash; };

  /* ---------- actions ---------- */
  /* light / dark: a saved choice wins; otherwise follow the system. Sample mode stays light (index.html). */
  const setTheme = (t, save) => {
    const h = document.documentElement; if (h.dataset.theme === t) return;
    h.classList.add("theming"); h.dataset.theme = t; setTimeout(() => h.classList.remove("theming"), 400);
    if (save) try { localStorage.setItem("fairplate-theme", t); } catch (e) {}
    document.querySelectorAll("[data-a=theme]").forEach((b) => b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode"));
  };
  if (!SAMPLE) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => { let saved = null; try { saved = localStorage.getItem("fairplate-theme"); } catch (x) {} if (!saved) setTheme(e.matches ? "dark" : "light"); });

  const A = {
    theme: () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true),
    scroll: (t) => document.getElementById(t.dataset.to)?.scrollIntoView({ behavior: "smooth" }),
    toast: (t) => toast(t.dataset.msg),
    demo: () => { S.restId = "qsb"; S.basket = { smash: 2, fries: 1 }; S.choice = null; persist(); },
    save: (t, e) => {
      e.preventDefault(); e.stopPropagation();
      const id = t.dataset.id; S.saved[id] = !S.saved[id]; if (!S.saved[id]) delete S.saved[id]; persist();
      t.classList.toggle("on", !!S.saved[id]);
      toast(S.saved[id] ? `Saved ${(E.rest(id) || FP.places.byId(id) || {}).name || "place"}` : "Removed from saved");
    },
    mode: (t, e) => {
      const opt = e.target.closest("span[data-v]"); if (!opt || opt.classList.contains("on")) return;
      t.querySelectorAll("span[data-v]").forEach((s) => s.classList.toggle("on", s === opt));
      segs(t.parentElement);
      S.mode = opt.dataset.v; persist();
      setTimeout(() => FP.rerender({ countFrom: true }), 320);
    },
    qty: (t, e) => {
      e.preventDefault();
      const rid = t.dataset.r || S.restId, id = t.dataset.id;
      const cur = S.restId === rid ? S.basket[id] || 0 : 0;
      setQty(rid, id, cur + parseInt(t.dataset.d, 10));
      FP.rerender();
      bump(document.querySelector("[data-bag]"));
    },
    recheck: () => { FP.checked = {}; FP.rerender(); },
    fees: () => { S.withFees = S.withFees === false; persist(); FP.rerender({ countFrom: true }); },
    wtab: (t) => {
      document.querySelectorAll("[data-tabs] .wt").forEach((w) => { const on = w === t; w.classList.toggle("on", on); w.classList.toggle("muted", !on); w.style.borderBottom = on ? "2.5px solid var(--ink)" : ""; w.style.fontWeight = on ? "600" : ""; w.style.height = on ? "64px" : ""; w.style.display = on ? "flex" : ""; w.style.alignItems = on ? "center" : ""; });
      const target = document.getElementById(t.dataset.to);
      if (t.dataset.to === "top") window.scrollTo({ top: 0, behavior: "smooth" }); else target?.scrollIntoView({ behavior: "smooth" });
    },
    choose: (t) => { S.choice = t.dataset.app; persist(); },
    tip: (t, e) => {
      const v = t.dataset.v === "custom" ? (S.tip >= 10 ? 1 : Math.max(S.tip + 1, 5)) : parseInt(t.dataset.v, 10);
      S.tip = v; persist(); FP.rerender({ countFrom: true });
    },
    pick: (t) => {
      S.choice = t.dataset.app; persist();
      const rowsBox = t.closest("[data-rows]");
      if (rowsBox) {   // phone compare: move the outline + update the button in place (keeps the animation smooth)
        rowsBox.querySelectorAll("[data-key]").forEach((r) => { const on = r === t; r.style.borderColor = on ? "var(--ink)" : "transparent"; r.style.padding = on ? "12px" : "10px 12px"; });
        const q = E.all(S.restId, S.basket).find((x) => x.app === S.choice), cta = document.querySelector("[data-cta]");
        if (cta) { cta.textContent = `Order on ${FP.APPS[q.app].name} · ${$(q.total)}`; bump(cta); }
      } else FP.rerender({ countFrom: true });
    },
    csort: (t) => {
      S.sort = t.dataset.v; persist();
      const box = document.querySelector("[data-rows]"); if (!box) return;
      document.querySelectorAll('[data-a="csort"]').forEach((b) => { const on = b === t; b.classList.toggle("out", on); b.style.borderColor = on ? "var(--ink)" : ""; b.style.borderWidth = on ? "2px" : ""; });
      const qs = E.all(S.restId, S.basket), sc = (q) => q.total + q.eta * 0.05;
      const order = S.sort === "fast" ? [...qs].sort((a, b) => a.eta - b.eta) : S.sort === "cheap" ? qs : [...qs].sort((a, b) => sc(a) - sc(b));
      const play = flip(box);
      order.forEach((q) => box.appendChild(box.querySelector(`[data-key="${q.app}"]`)));
      play();
    },
    basket: () => { const el = document.querySelector("[data-basket]"); const open = el.style.height === "0px"; accordion(el, open); },
    open: (t) => { const a = FP.APPS[t.dataset.app]; toast(`Opening ${a.name}…`); window.open(a.url, "_blank", "noopener"); },
    nothanks: () => { const w = document.querySelector("[data-welcome]"); S.welcome = false; persist(); const top = document.querySelector("[data-top]"); if (top) top.style.transition = "padding .35s"; if (top) top.style.paddingBottom = "6px"; collapse(w); },
    unrecent: (t) => { const txt = t.dataset.t; S.recent = S.recent.filter((x) => x !== txt); persist(); collapse(t.closest("[data-recent]")); },
    switch: (t) => { const c = t.querySelector(".check"); c.classList.add("on"); c.innerHTML = I("check", "s", "width:14px;height:14px"); S.choice = t.dataset.app; persist(); setTimeout(() => go("#/checkout"), 420); },
    range: (t) => { S.range = t.dataset.v; persist(); const box = document.querySelector("[data-history]"); const web = !!document.querySelector(".webp"); box.outerHTML = FP.historyBlock(web); FP.mountHistory(document); },
    watch: () => { S.watch = !S.watch; persist(); toast(S.watch ? "We'll tell you when this order gets cheaper" : "Price alert off"); A.range({ dataset: { v: S.range } }); },
    share: async () => { const url = location.href; try { if (navigator.share) await navigator.share({ title: "Fairplate", url }); else { await navigator.clipboard.writeText(url); toast("Link copied"); } } catch (e) {} },
    plan: (t) => { S.plan = t.dataset.v; persist(); FP.rerender(); },
    geo: () => { const inp = document.querySelector('[data-live="addr"]'); inp.value = "100 Queen St W"; A.addrpick({ dataset: { v: "100 Queen St W", c: "Toronto, ON" } }); toast("Found you near Queen West"); },
    addrpick: (t) => {
      FP.addrPick = [t.dataset.v, t.dataset.c];
      const inp = document.querySelector('[data-live="addr"]'); if (inp) inp.value = t.dataset.v;
      document.querySelector("[data-addr-list]").innerHTML = FP.addrList(t.dataset.v, t.dataset.v);
      const b = document.querySelector("[data-save]"); Object.assign(b.style, { background: "var(--hl)", color: "var(--ink)", pointerEvents: "auto" }); bump(b);
    },
    saveaddr: () => { if (!FP.addrPick) return; [S.addr, S.city] = FP.addrPick; persist(); FP.addrPick = null; toast("Address saved. Prices updated."); A.back(); },
    acc: (t) => { const el = document.querySelector(`[data-acc="${t.dataset.t}"]`); const open = el.style.height === "0px"; accordion(el, open); const ic = t.querySelector("svg use"); if (ic) ic.setAttribute("href", (t.dataset.t === "prices" ? !open : open) ? "#i-up" : "#i-down"); if (t.dataset.t === "prices") ic.setAttribute("href", open ? "#i-up" : "#i-down"); },
    sheetqty: (t) => { FP.sheetQty = Math.max(1, Math.min(20, (FP.sheetQty ?? parseInt(document.querySelector("[data-q]").textContent, 10)) + parseInt(t.dataset.d, 10))); document.querySelector("[data-q]").textContent = FP.sheetQty; document.querySelector("[data-qlabel]").textContent = `${FP.sheetQty} item${FP.sheetQty === 1 ? "" : "s"}`; bump(document.querySelector("[data-q]")); },
    meal: (t) => { const rid = (location.hash.match(/#\/r\/([\w-]+)/) || [])[1]; if (rid !== "qsb") return toast("Meals aren't on this menu"); setQty("qsb", "fries", (S.restId === "qsb" ? S.basket.fries || 0 : 0) || 1); t.textContent = "Meal added ✓"; bump(t); toast("Added Large Fries"); },
    addcompare: (t) => {
      const q = FP.sheetQty ?? parseInt(document.querySelector("[data-q]").textContent, 10);
      setQty(t.dataset.r, t.dataset.id, q); FP.sheetQty = null; FP.checked = {};
      const sh = document.querySelector(".sheet"); if (sh && !reduce()) sh.classList.add("closing");
      setTimeout(() => go("#/compare"), reduce() ? 0 : 300);
    },
    sheetclose: (t, e) => { e.preventDefault(); FP.sheetQty = null; const sh = document.querySelector(".sheet"); if (sh && !reduce()) sh.classList.add("closing"); const href = t.dataset.href || t.getAttribute("href"); setTimeout(() => (stack.length > 1 ? history.back() : go(href || "#/")), reduce() ? 0 : 300); },
    back: (t, e) => { e && e.preventDefault && e.preventDefault(); if (stack.length > 1) history.back(); else go("#/"); },
  };

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-a]");
    if (!t || !A[t.dataset.a]) return;
    if (t.tagName === "BUTTON" || (t.tagName === "A" && !t.getAttribute("href"))) e.preventDefault();
    A[t.dataset.a](t, e);
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-f]"); if (!f) return;
    e.preventDefault();
    const v = (f.querySelector("input") || {}).value?.trim() || "";
    if (f.dataset.f === "hero") { if (v) { S.addr = v; persist(); } go("#/feed"); }
    else if (f.dataset.f === "crave" || f.dataset.f === "feedsearch") go("#/feed?q=" + encodeURIComponent(v));
    else if (f.dataset.f === "realsearch") go("#/feed?q=" + encodeURIComponent(v));
    else if (f.dataset.f === "geo") geoSearch(v);
    else if (f.dataset.f === "msearch") { if (v) { S.recent = [v, ...S.recent.filter((x) => x !== v)].slice(0, 5); persist(); } go("#/results?q=" + encodeURIComponent(v)); }
  });
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.live === "geo") { clearTimeout(geoT); geoT = setTimeout(() => geoSearch(t.value), 600); return; }
    if (t.dataset.live === "search") {
      const out = document.querySelector("[data-live-out]"), idle = document.querySelector("[data-idle]");
      out.innerHTML = FP.liveSearch(t.value); stagger(out); idle.style.display = t.value.trim() ? "none" : "";
    } else if (t.dataset.live === "addr") {
      FP.addrPick = null;
      document.querySelector("[data-addr-list]").innerHTML = FP.addrList(t.value);
      Object.assign(document.querySelector("[data-save]").style, { background: "var(--hl-soft)", color: "#B8A36A", pointerEvents: "none" });
    }
  });

  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches('[role="button"][tabindex]')) { e.preventDefault(); e.target.click(); }
  });
  /* ---------- real address: Nominatim geocoding ---------- */
  let geoT;
  async function geoSearch(q) {
    const box = document.querySelector("[data-geo-list]"); if (!box || q.trim().length < 4) return;
    box.innerHTML = `<div class="small muted" style="padding:14px 0">Searching…</div>`;
    try {
      const res = await FP.places.geocode(q);
      box.innerHTML = res.map((r) => `<div class="hr"></div><button data-a="geopick" data-lat="${r.lat}" data-lon="${r.lon}" data-v="${FP.ui.esc(r.label)}" data-c="${FP.ui.esc(r.city)}" class="row g12 row-link" style="height:66px;width:100%;text-align:left">${I("pin")}<div><b>${FP.ui.esc(r.label)}</b><div class="small muted">${FP.ui.esc(r.city)}</div></div></button>`).join("") || `<div class="small muted" style="padding:14px 0">No match. Add the city.</div>`;
    } catch (e) { box.innerHTML = `<div class="small muted" style="padding:14px 0">Address search is busy. Try again in a moment.</div>`; }
  }
  async function setPlace(lat, lon, label, city, source = "typed", stay = false) {
    Object.assign(S, { lat, lon, addr: label, city, locSource: source }); persist();
    toast("Finding restaurants near " + label + "…");
    await FP.places.load(lat, lon);
    if (stay) FP.rerender();
    const ok = await FP.places.refresh(lat, lon);
    toast(ok ? `${FP.places.all.length.toLocaleString()} places near ${label}` : "Showing saved places; live map data is busy");
    if (stay) FP.rerender(); else go("#/feed");
  }
  A.geopick = (t) => setPlace(+t.dataset.lat, +t.dataset.lon, t.dataset.v, t.dataset.c);
  /* the visitor's own location: ask the browser, name the spot with a reverse lookup */
  function locate(stay, onNo) {
    if (!navigator.geolocation) return onNo();
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = +pos.coords.latitude.toFixed(5), lon = +pos.coords.longitude.toFixed(5);
      const r = await FP.places.reverse(lat, lon).catch(() => null);
      setPlace(lat, lon, (r && r.label) || "Your location", (r && r.city) || "", "you", stay);
    }, onNo, { timeout: 15000, maximumAge: 600000 });
  }
  A.gps = () => locate(false, () => toast("Location is blocked. Type your address instead."));

  window.addEventListener("hashchange", () => render({ keep: FP.keepNext })) ;
  document.addEventListener("click", (e) => { FP.keepNext = !!e.target.closest("[data-keep]"); }, true);
  FP.prices.onChange(() => { if (!SAMPLE && FP.places.all.length) FP.rerender(); });   // the extension can speak before places load; the boot render covers that
  let wasMobile = mobile();
  matchMedia("(max-width: 760px)").addEventListener("change", () => { if (mobile() !== wasMobile) { wasMobile = mobile(); render({ keep: true }); } });
  // boot: real places first (snapshot is instant), then a live refresh around the saved address
  if (SAMPLE) render();
  else FP.places.load(S.lat, S.lon).then(() => { render();
    if (!S.locAsked) { S.locAsked = true; persist(); locate(true, () => { if (S.locSource === "preset") toast(`Location not shared. Showing the preset: ${S.addr}`); }); } FP.places.refresh(S.lat, S.lon).then((ok) => ok && /feed|results|search|^#?\/?$/.test(location.hash) && FP.rerender()); FP.prices.sync(S.lat, S.lon); })
    .catch(() => render());
})();
