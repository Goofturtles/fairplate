/* Real-mode desktop landing (route "/" when not ?sample). Sample-mode landing stays in views-web.js (V.landing) for the design pixel tests.
   Every number here comes from FP.places (OpenStreetMap), FP.prices (checks saved by the extension) or FP.S. Nothing is invented:
   when a place has no check it says "No price yet", and illustrations use labels and grey bars, never made-up amounts. */
(function () {
  const { I, esc, $, img, countUp, reduce, accordion, toast } = FP.ui;
  const V = FP.views, P = () => FP.places, X = () => FP.prices, S = () => FP.S;
  const NEAR = 2.5, WALK = 1.2;   // km: the radius the map data covers, and roughly a 15-minute walk

  const initials = (s) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const TINTS = [0, 1, 2, 3, 4, 5].map((i) => `var(--t${i})`);   /* theme.css: pastel in light, deep tints in dark */
  const tint = (s) => TINTS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 6];
  const dist = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
  const walk = (km) => `${Math.max(1, Math.round(km * 12))} min walk`;
  const num = (v) => Math.round(v).toLocaleString();
  const logo = `<a href="#/" class="logo"><span class="mark"></span>fairplate</a>`;
  const APPS3 = [["ue", "Uber Eats"], ["dd", "DoorDash"], ["sk", "Skip"]];
  const LOCK = `<svg class="ic" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>`;
  const PARTIAL = "Showing saved map data: the live map hasn't loaded for this address, so some nearby places may be missing.";

  /* re-renders (new prices, refreshed places) must not replay the entrance motion or reset the address field */
  let fresh = true, io, seen = new Set(), shown = {}, keep = {};
  addEventListener("hashchange", () => (fresh = true));

  /* ---------- data ---------- */
  const cartKey = (o) => o.items.map((it) => `${it.qty || 1}x ${X().normName(it.name)}`).sort().join("|");
  /* each app's newest checkout, cheapest first. "same" only when every cart holds the same items: a cheapest mark must compare like with like */
  function checkout(id) {
    const got = Object.values(X().latest(id, "checkout")).sort((a, b) => a.total - b.total);
    return { got, same: got.length > 1 && !!got[0].items.length && got.every((o) => cartKey(o) === cartKey(got[0])) };
  }
  const nItems = (o) => { const n = o.items.reduce((a, it) => a + (it.qty || 1), 0); return n ? ` · ${n} item${n === 1 ? "" : "s"}` : ""; };
  const menuSeen = (p) => (Object.keys(X().latest(p.id, "menu")).length ? "Menu seen" : "No price yet");
  function model() {
    const all = P().all, near = all.filter((p) => p.km <= NEAR), priced = new Set(X().checkedPlaces()), cats = {}, names = new Set();
    all.forEach((p) => { if (p.cat !== "other") (cats[p.cat] = cats[p.cat] || { key: p.cat, label: p.label, img: p.img, n: 0 }).n++; });   // same set the feed lists, so linked counts match it
    const uniq = near.filter((p) => { const k = p.name.toLowerCase(); return !names.has(k) && names.add(k); });   // OSM sometimes maps one place twice
    const c = P().cover, partial = !!(c && all.length && P().km(S().lat, S().lon, c.lat, c.lon) + NEAR > c.km + 0.2);   // saved map data centred elsewhere: part of the circle is missing
    return { all: all.length, near, uniq, priced, cats: Object.values(cats).sort((a, b) => b.n - a.n), nearCats: new Set(near.filter((p) => p.cat !== "other").map((p) => p.cat)).size, walkN: near.filter((p) => p.km <= WALK).length, partial };
  }
  function chip(p) {
    const { got, same } = checkout(p.id), A = X().APPS;
    if (!got.length) return `<span class="lp-pc">${menuSeen(p)}</span>`;
    const one = (o, i) => `<span class="lp-pc ${same && !i ? "best" : "real"}"${same && !i ? ' title="Cheapest for the same cart"' : ""}>${A[o.app].short} ${$(o.total)}${got.length > 1 && !same ? nItems(o) : ""}</span>`;
    return got.length === 1 ? one(got[0], 1) : `<span class="lp-pcs">${got.map(one).join("")}${same ? "" : `<span class="lp-pcn">Different carts</span>`}</span>`;
  }
  const tile = (p) => `<div class="lp-nt" style="background:${tint(p.name)}" aria-hidden="true">${esc(initials(p.name))}</div>`;
  const start = (k, v) => (reduce() ? v : k in shown ? shown[k] : 0);   // what a counter shows before it animates
  const counter = (k, v) => `<span class="num" data-n="${v}" data-k="${k}">${num(start(k, v))}</span>`;
  const head = (kick, h, extra = "") => `<div class="lp-head" data-rv="h-${kick}"><div><div class="lp-kick">${kick}</div><h2 class="lp-h2">${h}</h2></div>${extra}</div>`;
  const photo = (name, cls = "") => `<img class="lp-photo${cls ? " " + cls : ""}" src="img/ph-${name}.jpg" alt="" loading="lazy" decoding="async">`;   /* example photos (PHOTO-CREDITS.md), never a specific restaurant */

  /* ---------- sections ---------- */
  const nav = () => `<header class="lp-nav"><div class="lp-w lp-navin">${logo}
    <nav class="lp-links" aria-label="On this page"><button data-lp-to="lp-how">How it works</button><a href="#/feed">Restaurants</a><a href="#/extension">Extension</a><button data-lp-to="lp-faq" class="lp-opt">FAQ</button></nav>
    <span class="sp"></span>${V.themeBtn()}<a href="#/address" class="lp-addrpill" title="Change address">${I("pin", "s")}<span>${esc(S().addr)}</span>${I("down", "s")}</a><a class="btn hl sm" href="#/extension">Get the extension</a></div></header>`;

  /* Hero (refs: Uber Eats + sweetgreen full-bleed food, Frontify selection frame, Zipline hotspots, Mews cards over the photo edge).
     The pins name what a delivery total is made of; they carry no numbers because the photo is an example dish, not a real order. */
  const PARTS = [["Menu price", "", 52, 30], ["Delivery fee", "+", 43, 50], ["Service fee", "+", 45, 64], ["Tax", "+", 46, 80]];
  function hero(m) {
    const board = m.uniq.slice(0, 5), got = board.filter((p) => m.priced.has(p.id)).length;
    const cards = board.map((p) => `<a href="#/p/${p.id}" class="lp-brow"><div class="lp-btop">${tile(p)}${chip(p)}</div><div class="lp-bmid"><b>${esc(p.name)}</b><span>${esc(p.label)} · ${dist(p.km)} · ${walk(p.km)}</span></div></a>`).join("");
    const pins = PARTS.map(([t, op, x, y], k) => `<span class="lp-hot" style="left:${x}%;top:${y}%;--k:${k}"><span class="lp-hc">${op ? `<b>${op}</b>` : ""}${t}</span><i></i></span>`).join("");
    return `<section class="lp-hero"><div class="lp-stage">
  <div class="lp-art" role="img" aria-label="Example burger photo. A delivery total is its menu price plus the delivery fee, the service fee and tax.">
    <img src="${img("hero-burger-r")}" alt="" fetchpriority="high">
    <div class="lp-anno" aria-hidden="true"><div class="lp-frame"><span class="lp-ftab">Your order</span><i></i><i></i><i></i><i></i></div>${pins}<span class="lp-tot"><b>=</b>Real total, before you pay</span></div>
  </div>
  <div class="lp-w lp-hin"><div class="lp-hcopy">
    <div class="lp-eyebrow lp-in"><span class="mark"></span>Uber Eats · DoorDash · Skip, compared</div>
    <h1 class="lp-h1"><span class="lp-in" style="--d:80ms">Same order.</span><span class="lp-in" style="--d:160ms">Three apps.</span><span class="lp-in" style="--d:240ms">See the <mark>real total</mark>.</span></h1>
    <p class="lp-lead lp-in" style="--d:340ms">What an order really costs on each delivery app. Real prices, never estimates.</p>
    <div class="lp-formwrap lp-in" style="--d:440ms">
      <form data-f="geo" class="lp-addr" autocomplete="off" role="search">${I("pin")}<input name="q" data-live="geo" value="${esc(keep.v || "")}" placeholder="Enter your address" aria-label="Your address"><button class="btn hl">Find restaurants</button></form>
      <div class="lp-geo" data-geo-list>${keep.list || ""}</div>
    </div>
    <div class="lp-meta lp-in" style="--d:520ms"><span>Near <b>${esc(S().addr)}</b>${S().locSource === "preset" ? `<span class="lp-preset" title="You didn't share your location, so this is the preset address">Preset</span>` : ""}</span><a href="#/address">Change</a><button data-a="gps">${I("loc", "s")}Use my location</button></div>
    ${m.partial ? `<p class="lp-partial lp-in" style="--d:560ms">${I("info", "s")}<span>${PARTIAL}</span></p>` : ""}
  </div></div>
</div>
<div class="lp-w"><div class="lp-board">
  <div class="lp-bhead"><span class="mark"></span><div><b>Closest to ${esc(S().addr)}</b><span>OpenStreetMap data · ${got ? `${got} of these ${board.length} ${got === 1 ? "has" : "have"} real prices` : "no prices saved for these in this browser yet"}</span></div><a class="lp-ball" href="#/feed">See all${I("arrow", "s")}</a></div>
  <div class="lp-brows">${cards || `<p class="lp-empty">No map data near this address yet. Try another address.</p>`}</div>
</div></div></section>`;
  }

  function stats(m) {
    const c = X().count, toronto = /toronto/i.test(S().city || "") || /toronto/i.test(S().addr || "");
    const stat = (k, v, label, extra = "") => `<div class="lp-stat"><div class="lp-sn">${counter(k, v)}</div><span>${label}</span>${extra}</div>`;
    return `<section class="lp-sec" id="lp-stats"><div class="lp-w"><div class="lp-band" data-rv="band">${photo(toronto ? "toronto" : "night", "lp-bandimg")}
      <div class="lp-bandin"><h2 class="lp-h2">Your neighbourhood, counted.</h2>
      ${m.partial ? `<p class="lp-partial">${I("info", "s")}<span>${PARTIAL}</span></p>` : ""}
      <div class="lp-stats rvk" data-rv="stats">${stat("near", m.near.length, `places within ${NEAR} km`)}${stat("walk", m.walkN, "within a 15-min walk")}${stat("cuis", m.nearCats, "kinds of food")}
        ${stat("obs", c, `price check${c === 1 ? "" : "s"} saved`, c ? "" : `<a href="#/extension">Add the first${I("arrow", "s")}</a>`)}</div></div></div></div></section>`;
  }

  /* cuisines: big photo tiles, name + real count on the photo (ref: SAP Good Energy micro captions) */
  function cuisines(m) {
    const top = m.cats.filter((c) => c.img).slice(0, 8);
    if (!top.length) return "";
    return `<section class="lp-sec" id="lp-cuisines"><div class="lp-w">${head("Browse", "What's nearby", `<a class="lp-more" href="#/feed">All ${num(m.all)} places${I("arrow", "s")}</a>`)}
    <div class="lp-cuis rvk" data-rv="cuis">${top.map((c, i) => `<a class="lp-cui" href="#/feed?cat=${c.key}" style="--i:${i}"><img src="${img(c.img)}" alt="" loading="lazy"><span class="lp-cuit"><b>${esc(c.label)}</b><span>${c.n}</span></span></a>`).join("")}</div></div></section>`;
  }

  /* how it works: a photo per step with a piece of Fairplate's own UI on top (ref: Superpower steps) */
  function how(m) {
    const p = m.uniq[0];
    const ui = [
      `<div class="lp-isearch">${I("search", "s")}<span>${esc(p ? p.name : "pizza")}</span><i class="lp-caret"></i></div>${p ? `<div class="lp-ires">${tile(p)}<div class="lp-bmid"><b>${esc(p.name)}</b><span>${esc(p.label)} · ${dist(p.km)}</span></div></div>` : ""}`,
      `<div class="lp-ixt"><span class="mark"></span><b>fairplate</b><span class="sp"></span><span class="lp-ion">${I("check", "s")}Saved</span></div>${["Menu prices", "Delivery fee", "Service fee"].map((l) => `<div class="lp-irow">${l}<span class="sp"></span><span class="lp-bar" style="width:46px"></span></div>`).join("")}`,
      `<div class="lp-cmp">${APPS3.map(([k, n], i) => `<div${i ? "" : ' class="best"'}><span class="dot ${k}"></span>${n}<span class="sp"></span>${i ? "" : `<span class="lp-cb">Cheapest</span>`}<span class="lp-bar" style="width:${[44, 52, 60][i]}px"></span></div>`).join("")}</div>`,
    ];
    const steps = [["find", "Find it"], ["open", "Open it on each app"], ["receipt", "Compare the totals"]];
    return `<section class="lp-sec" id="lp-how"><div class="lp-w">${head("How it works", "Three steps to the real total")}
    <div class="lp-steps rvk" data-rv="how">${steps.map(([ph, t], i) => `<div class="lp-step" style="--i:${i}"><div class="lp-sph">${photo(ph)}<div class="lp-sui u${i + 1}">${ui[i]}</div></div>
      <div class="lp-sct"><span class="lp-num">0${i + 1}</span><b>${t}</b></div></div>`).join("")}</div></div></section>`;
  }

  /* where the money goes: one full-bleed photo, the formula on it (ref: Daylight hero band) */
  const FEES = [["menu", "Menu prices"], ["delivery", "Delivery fee"], ["service", "Service fee"], ["tax", "Tax"], ["tip", "Tip"]];
  const fees = () => `<section class="lp-sec" id="lp-fees"><div class="lp-w"><div class="lp-formula" data-rv="formula">${photo("bag")}<div class="lp-fin">
      <div class="lp-kick">Where the money goes</div><div class="lp-ftot">Your total <span>=</span></div>
      <div class="lp-fparts">${FEES.map(([k, n], i) => `${i ? `<span class="lp-fplus">+</span>` : ""}<span class="lp-fp" data-fee="${k}">${n}</span>`).join("")}</div></div></div></div></section>`;

  /* real places plotted around the address: x/y from lat/lon, 1 km rings */
  function dotMap(m) {
    const w = 760, h = 420, s = (h / 2 - 22) / WALK, lat0 = S().lat, lon0 = S().lon, kx = 111.32 * Math.cos((lat0 * Math.PI) / 180), ky = 110.57;
    const pt = (p) => [w / 2 + (p.lon - lon0) * kx * s, h / 2 - (p.lat - lat0) * ky * s];
    const inside = m.near.map((p) => [p, ...pt(p)]).filter(([, x, y]) => x > 6 && x < w - 6 && y > 6 && y < h - 6);
    const dot = ([p, x, y]) => { const on = m.priced.has(p.id); return `<a href="#/p/${p.id}" tabindex="-1" data-name="${esc(p.name)}" data-sub="${esc(p.label)} · ${dist(p.km)}${on ? " · has real prices" : ""}"${on ? ' class="on"' : ""}><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 5.5 : 3.2}"/></a>`; };
    const ring = (km) => `<circle class="lp-ring" cx="${w / 2}" cy="${h / 2}" r="${(km * s).toFixed(1)}"/>`;
    const label = (km, t) => { const pw = t.length * 6.4 + 14, y = h / 2 - km * s; return `<g class="lp-rl"><rect x="${(w / 2 - pw / 2).toFixed(1)}" y="${(y - 9).toFixed(1)}" width="${pw.toFixed(1)}" height="18" rx="9"/><text x="${w / 2}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${t}</text></g>`; };
    return { n: inside.length, svg: `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Map of ${inside.length} places around ${esc(S().addr)}">${ring(0.5)}${ring(1)}
      <g class="lp-dots">${inside.filter(([p]) => !m.priced.has(p.id)).map(dot).join("")}${inside.filter(([p]) => m.priced.has(p.id)).map(dot).join("")}</g>
      ${label(0.5, "500 m")}${label(1, "1 km")}
      <circle class="lp-pulse" cx="${w / 2}" cy="${h / 2}" r="11"/><circle class="lp-you" cx="${w / 2}" cy="${h / 2}" r="9"/><circle class="lp-youc" cx="${w / 2}" cy="${h / 2}" r="3.6"/></svg>` };
  }

  function bento(m) {
    const map = dotMap(m), p = m.uniq[0];
    return `<section class="lp-sec" id="lp-features"><div class="lp-w">${head("What you get", "Honest about money")}
    <div class="lp-bento rvk" data-rv="bento">
      <div class="lp-b map" style="--i:0"><div class="lp-bt"><div class="lp-kick">Every place, mapped</div><b>${num(map.n)} places around ${esc(S().addr)}</b></div>
        <div class="lp-map">${map.n ? map.svg : `<p class="lp-empty">No map data near this address yet.</p>`}<div class="lp-tip" hidden></div></div>
        <div class="lp-legend"><span><i></i>A place</span><span><i class="on"></i>Has real prices</span><span><i class="you"></i>You</span></div></div>
      <div class="lp-b walk ph" style="--i:1">${photo("pickup")}<div class="lp-bov"><div class="lp-kick">Walk or deliver?</div>${p ? `<div class="lp-big num">${Math.max(1, Math.round(p.km * 12))} min</div><span>on foot to ${esc(p.name)}</span>` : ""}</div></div>
      <div class="lp-b lock" style="--i:2"><div class="lp-bi">${LOCK}</div><b>No account.<br>No login.</b><span class="lp-bsub">It never sees your password or card.</span></div>
    </div></div></section>`;
  }

  /* the extension's real popup (extension/popup.html + popup.js), same sections and wording, filled with the captures saved in this browser */
  function popup() {
    const list = X().all.sort((a, b) => a.at - b.at), o = list[list.length - 1], A = X().APPS, ver = (FP.ext || {}).version;
    const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`, name = (x) => x.store.name || (x.place && P().byId(x.place) || {}).name || "";
    const status = !o ? "Open a restaurant or checkout page on Uber Eats, DoorDash or Skip."
      : o.kind === "menu" ? `${A[o.app].name} menu: ${plural(o.items.length, "price")} captured for ${esc(name(o) || "this store")}`
      : `${A[o.app].name} checkout: ${$(o.total)} total captured${name(o) ? ` for ${esc(name(o))}` : ""}`;
    const chk = list.filter((x) => x.kind === "checkout").length, stores = new Set(list.map((x) => `${x.app}|${x.store.name.toLowerCase()}|${x.store.address.toLowerCase()}`)).size;
    const stat = (n, w) => `<div><b class="num">${n.toLocaleString()}</b><span>${n === 1 ? w : w + "s"}</span></div>`;
    const row = (x) => `<li><span class="ab sm ${x.app}" aria-hidden="true">${A[x.app].badge}</span><div><b>${esc(name(x) || "Store not known yet")}</b><span>${A[x.app].name} · ${x.kind === "checkout" ? `${$(x.total)} checkout total` : plural(x.items.length, "menu price")} · ${X().ago(x.at)}</span></div></li>`;
    return `<div class="lp-pop"><div class="lp-ph"><span class="mark"></span>fairplate${ver ? `<span class="lp-pv">v${esc(ver)}</span>` : ""}<span class="sp"></span><span class="lp-picon" aria-hidden="true"><svg class="ic lp-psun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg><svg class="ic lp-pmoon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg></span></div>
      <div class="lp-pt">This tab</div><div class="lp-pnow${o ? " ok" : ""}"><i></i><p class="lp-pst">${status}</p></div>
      <div class="lp-pstats">${stat(list.length, "capture")}${stat(stores, "store")}${stat(chk, "checkout")}</div>
      <div class="lp-pt">Last captures</div><ol class="lp-prec">${list.slice(-3).reverse().map(row).join("") || `<li class="empty">Nothing yet. Open a restaurant on Uber Eats, DoorDash or Skip.</li>`}</ol>
      <div class="lp-pbtns"><span class="lp-pb hl">Open Fairplate${I("arrow", "s")}</span><span class="lp-pb q${list.length ? "" : " off"}">Clear captured data</span></div>
      <p class="lp-pfine">Saves the store's details, menu prices, cart items and checkout amounts. Never saves your address, name, email, phone, payment details or order history.</p></div>`;
  }
  const ext = () => `<section class="lp-sec" id="lp-ext"><div class="lp-w"><div class="lp-extp" data-rv="ext">
    <div class="lp-extl"><h2 class="lp-h2">One extension makes the prices real.</h2>
      <p class="lp-ep">It reads the prices you already see. Free for Chrome, Edge, Brave and Arc.</p>
      <div class="lp-ebtns"><a class="btn hl" href="#/extension">Get the extension</a><button class="btn lp-ghostd" data-lp-to="lp-faq">Read the FAQ</button></div></div>
    <div class="lp-emock">${photo("laptop", "lp-ebg")}${popup()}</div>
  </div></div></section>`;

  function faqs() {
    const Q = [
      ["Is it free?", "Yes. No account, no ads."],
      ["Do I log in to anything?", "No. It never sees your password or card."],
      ["Where do the prices come from?", "Real app pages, saved with the time they were seen. Nothing is estimated."],
      ["Why do places say “No price yet”?", FP.API ? "Nobody has checked them yet." : "No check is saved for them in this browser yet."],
      ["Is Fairplate part of Uber Eats, DoorDash or Skip?", "No. Fairplate is independent."],
    ];
    return `<section class="lp-sec" id="lp-faq"><div class="lp-w lp-faq"><div class="lp-fql" data-rv="faq-h"><div class="lp-kick">FAQ</div><h2 class="lp-h2">Questions</h2><a class="btn ghost" href="#/extension">How the extension works</a></div>
    <div class="lp-qs rvk" data-rv="faq">${Q.map(([q, a], i) => { const o = (keep.faq || []).includes(`lp-qa${i}`); return `<div class="lp-q${o ? " open" : ""}" style="--i:${i}"><button class="lp-qh" aria-expanded="${o}" aria-controls="lp-qa${i}"><span>${q}</span><i class="lp-x"></i></button><div class="lp-qa" id="lp-qa${i}"${o ? "" : " hidden"}><div><p>${a}</p></div></div></div>`; }).join("")}</div></div></section>`;
  }

  const cta = () => `<section class="lp-sec"><div class="lp-w"><div class="lp-cta" data-rv="cta"><div class="lp-ctal"><h2 class="lp-h2">Check before you order.</h2>
    <div class="lp-ctab"><a class="btn ink" href="#/extension">Get the extension</a><a class="btn ghost" href="#/feed">Browse places nearby</a></div></div>
    <div class="lp-ctaph">${photo("share")}</div></div></div></section>`;

  function footer() {
    return `<footer class="lp-foot"><div class="lp-w"><div class="lp-fcols">
      <div>${logo}<p class="lp-ftag">Every delivery app's real total.</p></div>
      <div class="lp-flinks"><a href="#/feed">Restaurants</a><a href="#/extension">Extension</a><a href="#/address">Change address</a><button data-lp-to="lp-faq">FAQ</button></div>
    </div>
    <div class="lp-fbot"><span>Restaurant data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors (ODbL). Not affiliated with any delivery app. Photos: Pexels, TheMealDB.</span><span class="sp"></span><button data-lp-to="lp-top">Back to top${I("up", "s")}</button></div></div></footer>`;
  }

  /* ---------- behaviour ---------- */
  function counts(scope) {
    scope.querySelectorAll("[data-n]").forEach((el) => {
      const k = el.dataset.k, to = +el.dataset.n, from = k in shown ? shown[k] : 0;
      shown[k] = to;
      countUp(el, to, from, 1100, num);
    });
  }
  function reveal(lp) {
    if (io) io.disconnect();
    const show = (el, now) => { el.classList.add("on"); if (now) { el.classList.add("now", "done"); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("now"))); } else setTimeout(() => el.classList.add("done"), 1500); seen.add(el.dataset.rv); counts(el); };
    const els = [...lp.querySelectorAll("[data-rv]")];
    if (reduce()) return els.forEach((el) => show(el, true));
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); show(e.target); } }), { threshold: 0.12 });
    els.forEach((el) => (seen.has(el.dataset.rv) ? show(el, true) : io.observe(el)));
  }
  function faq(b) {
    const el = document.getElementById(b.getAttribute("aria-controls")), open = b.getAttribute("aria-expanded") !== "true", ms = reduce() ? 0 : 420;
    b.setAttribute("aria-expanded", open); b.parentElement.classList.toggle("open", open); clearTimeout(el._t);
    if (open) { el.hidden = false; el.style.height = "0px"; void el.offsetHeight; accordion(el, true); el._t = setTimeout(() => (el.style.height = ""), ms); }
    else { el.style.height = el.offsetHeight + "px"; void el.offsetHeight; accordion(el, false); el._t = setTimeout(() => (el.hidden = true), ms); }
  }
  function mapTip(lp) {
    const box = lp.querySelector(".lp-map"), tip = lp.querySelector(".lp-tip"), svg = box && box.querySelector("svg"); if (!svg) return;
    svg.addEventListener("mouseover", (e) => {
      const a = e.target.closest("a"); if (!a) return;
      const r = a.getBoundingClientRect(), b = box.getBoundingClientRect();
      tip.innerHTML = `<b>${esc(a.dataset.name)}</b><span>${esc(a.dataset.sub)}</span>`; tip.hidden = false;
      const half = tip.offsetWidth / 2;   // centred on the dot, but never past the map's edges
      tip.style.left = Math.min(Math.max(r.left - b.left + r.width / 2, half), box.clientWidth - half) + "px"; tip.style.top = r.top - b.top + "px";
    });
    svg.addEventListener("mouseleave", () => (tip.hidden = true));
  }
  function feeLink(lp) {
    lp.querySelectorAll("[data-fee]").forEach((el) => {
      const hot = (v) => lp.querySelectorAll(`[data-fee="${el.dataset.fee}"]`).forEach((x) => x.classList.toggle("hot", v));
      ["mouseenter", "focus"].forEach((ev) => el.addEventListener(ev, () => hot(true)));
      ["mouseleave", "blur"].forEach((ev) => el.addEventListener(ev, () => hot(false)));
    });
  }
  function parallax(lp) {
    const st = lp.querySelector(".lp-stage"); if (!st || reduce() || !matchMedia("(pointer:fine)").matches) return;
    let raf = 0;
    st.addEventListener("pointermove", (e) => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const r = st.getBoundingClientRect();
      st.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3)); st.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3)); }); });
    st.addEventListener("pointerleave", () => { st.style.setProperty("--mx", 0); st.style.setProperty("--my", 0); });
  }
  const onScroll = () => { const n = document.querySelector(".lp-nav"); if (n) n.classList.toggle("up", scrollY > 8); };
  addEventListener("scroll", onScroll, { passive: true });
  /* close the address suggestions when clicking elsewhere or pressing Escape */
  const closeGeo = () => { const l = document.querySelector(".lp [data-geo-list]"); if (l) l.innerHTML = ""; };
  document.addEventListener("click", (e) => { if (!e.target.closest(".lp-formwrap")) closeGeo(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeGeo(); });

  function mount(root) {
    const lp = root.querySelector(".lp"); if (!lp) return;
    reveal(lp);
    lp.querySelectorAll("[data-lp-to]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); document.getElementById(b.dataset.lpTo)?.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "start" }); }));
    const inp = lp.querySelector("[data-live=geo]"), list = lp.querySelector("[data-geo-list]");
    inp.addEventListener("input", () => { if (inp.value.trim().length < 4) list.innerHTML = ""; });
    inp.form.addEventListener("submit", () => { if (inp.value.trim().length < 4) { toast("Type a street address, like 100 Queen St W"); inp.focus(); } });
    if (keep.focus) { inp.focus(); inp.setSelectionRange(keep.sel, keep.sel); }
    if (/Searching/.test(keep.list)) inp.dispatchEvent(new Event("input", { bubbles: true }));   // a re-render mid-lookup: the answer went to the old list, so ask again (geocode results are cached)
    lp.querySelectorAll(".lp-qh").forEach((b) => b.addEventListener("click", () => faq(b)));
    mapTip(lp); feeLink(lp); onScroll(); parallax(lp);
  }

  V.landingReal = () => {
    const q = (s) => document.querySelector(".lp " + s), oldIn = q("[data-live=geo]"), oldList = q("[data-geo-list]");
    keep = { v: oldIn ? oldIn.value : "", list: oldList ? oldList.innerHTML : "", focus: !!oldIn && document.activeElement === oldIn, sel: oldIn ? oldIn.selectionStart : 0,
      faq: [...document.querySelectorAll('.lp .lp-qh[aria-expanded="true"]')].map((b) => b.getAttribute("aria-controls")) };
    if (fresh) { seen.clear(); shown = {}; }
    const anim = fresh && !reduce(); fresh = false;
    const m = model();
    const html = `<div class="pg webp lp${anim ? " anim" : ""}" id="lp-top">${nav()}${hero(m)}${stats(m)}${cuisines(m)}${how(m)}${fees()}${bento(m)}${ext()}${faqs()}${cta()}${footer()}</div>`;
    return { html, title: "Fairplate: every delivery app's real total", mount };
  };
})();
