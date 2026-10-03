/* Restaurant page (real mode): photo header, each app's captured prices, the menu comparison, the map, more of the same food nearby.
   Helpers: FP.rv (views-real.js). Styles: css/place.css, all scoped under .pp. */
(function () {
  const { I, esc, $, img, status, toast } = FP.ui;
  const V = FP.views, P = () => FP.places, X = () => FP.prices, S = () => FP.S;
  const mobile = () => FP.isMobile();
  const { initials, tint, photo, walk, dist, APPS3 } = FP.rv;

  const money = (n) => (n < 0 ? "-" : "") + $(Math.abs(n));
  const FEE_NAMES = [["subtotal", "Food"], ["delivery", "Delivery"], ["service", "Service"], ["small", "Small order"], ["other", "Other fees"], ["tax", "Tax"], ["tip", "Tip"], ["discount", "Discount"]];
  const feeLine = (f) => FEE_NAMES.filter(([k]) => f[k] != null).map(([k, n]) => `${n} ${money(f[k])}`).join(" · ");
  const hoursOf = (p) => (FP.hours ? FP.hours.status(p.hours) : null);   // null = unknown: show nothing
  const openChip = (h) => (h ? `<span class="pp-open ${h.open ? "on" : "off"}"><i aria-hidden="true"></i>${esc(h.label)}</span>` : "");
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return "Website"; } };

  /* captured menus side by side: items matched across apps by name (same words, any order). A name with several prices on one
     app (sizes, options) shows every price but isn't compared: we can't tell which size matches which. */
  const ikey = (n) => X().normName(n).split(" ").sort().join(" ");
  function menuTable(menu) {
    const apps = APPS3.filter((a) => menu[a]);
    if (!apps.length) return "";
    const rows = new Map();
    apps.forEach((a) => menu[a].items.forEach((it) => { const k = ikey(it.name); if (!k) return; if (!rows.has(k)) rows.set(k, { name: it.name, section: it.section, p: {} });
      const v = rows.get(k).p[a] = rows.get(k).p[a] || []; if (!v.some((x) => x.price === it.price)) v.push(it); }));
    const list = [...rows.values()], wins = {};
    let same = 0, varied = 0;
    list.forEach((r) => {
      const has = apps.filter((a) => r.p[a]);
      has.forEach((a) => r.p[a].sort((x, y) => x.price - y.price));
      r.n = has.length; r.multi = has.some((a) => r.p[a].length > 1);
      if (r.n < 2) return;
      if (r.multi) { varied++; return; }
      const ps = has.map((a) => r.p[a][0].price);
      r.lo = Math.min(...ps); r.tie = ps.every((v) => v === r.lo);
      if (r.tie) same++; else has.forEach((a) => { if (r.p[a][0].price === r.lo) wins[a] = (wins[a] || 0) + 1; });
    });
    const shared = list.filter((r) => r.n > 1), order = shared.concat(list.filter((r) => r.n === 1)), SHOW = 12;
    const A = (a) => X().APPS[a];
    const cheaper = apps.filter((a) => wins[a]).map((a) => `${A(a).name}: ${wins[a]}`).join(" · ");
    const bits = [cheaper && `Cheaper on ${cheaper}`, same && `same price: ${same}`, varied && `several sizes or options, not compared: ${varied}`].filter(Boolean).join(" · ");
    const summary = apps.length < 2 ? `Only ${A(apps[0]).name}'s menu is captured so far. Open it on another app with the extension on to compare.`
      : shared.length ? `${shared.length} item${shared.length === 1 ? "" : "s"} on more than one app. ${bits[0].toUpperCase() + bits.slice(1)}.`
      : "No item names match across the captured menus yet.";
    const cell = (r, a) => { const its = r.p[a]; if (!its) return `<td class="num faint" title="Not on ${A(a).name}'s captured menu">&ndash;</td>`;
      return `<td class="num${r.n > 1 && !r.multi && !r.tie && its[0].price === r.lo ? " best" : ""}">${its.map((it) => `<div><span class="p">${$(it.price)}</span>${it.deal ? `<div class="tiny muted">${esc(it.deal)}</div>` : ""}${its.length > 1 && it.section ? `<div class="tiny muted">${esc(it.section)}</div>` : ""}</div>`).join("")}</td>`; };
    const tr = (r) => `<tr><td><b>${esc(r.name)}</b>${r.section && !r.multi ? `<div class="tiny muted">${esc(r.section)}</div>` : ""}</td>${apps.map((a) => cell(r, a)).join("")}</tr>`;
    return `<section class="pp-sec">
      <h2 class="pp-h2">Menu prices</h2>
      <p class="pp-sub">${summary}</p>
      <div class="pp-tbl"><table class="mt"><thead><tr><th>Item</th>${apps.map((a) => `<th><span class="pp-th"><span class="ab sm ${a}" aria-hidden="true">${A(a).badge}</span>${A(a).short}</span><div class="tiny muted pp-ago">${X().ago(menu[a].at)}</div></th>`).join("")}</tr></thead>
      <tbody>${order.slice(0, SHOW).map(tr).join("")}</tbody>${order.length > SHOW ? `<tbody data-more hidden>${order.slice(SHOW).map(tr).join("")}</tbody>` : ""}</table></div>
      ${order.length > SHOW ? `<button class="pp-pill" data-showall>Show all ${order.length} items</button>` : ""}
      <p class="pp-foot">Before fees and tax. Items match by name, so a dish named differently on two apps shows twice.</p></section>`;
  }

  /* the 4 closest other places of the same kind of food (distance from this place), linking to their pages */
  const NOUN = { pizza: "pizza", burgers: "burgers", ramen: "ramen & noodles", chicken: "chicken", healthy: "healthy food", dessert: "dessert",
    breakfast: "breakfast", poutine: "poutine", sandwich: "sandwiches", cafe: "cafés" };
  function nearby(pl) {
    const km = P().km, nm = pl.name.toLowerCase();
    const pool = P().all.filter((o) => o.id !== pl.id && o.cat === pl.cat && (pl.cat !== "other" || o.amenity === pl.amenity) && o.name && o.name.toLowerCase() !== nm)
      .map((o) => [km(pl.lat, pl.lon, o.lat, o.lon), o]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    /* the same example photo twice in one row reads as fake: skip a place whose photo is already on screen */
    const seen = new Set([P().photoOf(pl)]);
    const near = [];
    for (const o of pool) { const f = P().photoOf(o); if (f && seen.has(f)) continue; seen.add(f); near.push(o); if (near.length === 4) break; }
    if (!near.length) return "";
    const noun = NOUN[pl.cat] || (pl.cat === "other" ? (pl.amenity === "fast_food" ? "fast food" : pl.amenity === "cafe" ? "cafés" : "restaurants") : pl.label);
    const h = mobile() ? 132 : 200;
    const card = (o) => { const L = X().latest(o.id), hs = hoursOf(o);
      return `<a class="pp-nb" href="#/p/${o.id}"><div class="ph zoom pp-nbph">${photo(o, h)}${L.ue || L.dd || L.sk ? `<span class="chip hl pp-tag">Real prices</span>` : ""}</div>
        <b class="pp-nbn">${esc(o.name)}</b><div class="pp-nbm">${hs ? `<span class="pp-dot ${hs.open ? "on" : "off"}">${hs.open ? "Open" : "Closed"}</span> · ` : ""}${walk(o.km)} · ${dist(o.km)}</div></a>`; };
    return `<section class="pp-sec pp-more"><div class="pp-hd"><h2 class="pp-h2">More ${esc(noun)} nearby</h2>${near.some((o) => P().photoOf(o)) ? `<span class="pp-aside">Example photos</span>` : ""}</div>
      <div class="pp-nbs">${near.map(card).join("")}</div></section>`;
  }

  /* ---------- place page ---------- */
  V.realPlace = (p, id) => {
    const pl = P().byId(id);
    if (!pl) return { title: "Not found · Fairplate", html: `<div class="pg ${mobile() ? "app" : "webp"}">${mobile() ? status() : V.realTop()}<div class="col" style="align-items:center;padding:120px 20px;text-align:center"><div class="h1" style="line-height:1.25;font-size:24px">We couldn't find that place</div><a class="btn ink" style="margin-top:20px" href="#/feed">Browse places</a></div></div>` };
    const m = mobile(), menu = X().latest(pl.id, "menu"), chk = X().latest(pl.id, "checkout"), apps = APPS3;
    const got = apps.filter((a) => chk[a]).sort((a, b) => chk[a].total - chk[b].total), menus = apps.filter((a) => menu[a]);
    /* only call one app cheapest when every captured checkout holds the same cart */
    const cart = (o) => o.items.map((it) => `${it.qty || 1}x ${X().normName(it.name)}`).sort().join("|");
    const same = got.length > 1 && chk[got[0]].items.length > 0 && got.every((a) => cart(chk[a]) === cart(chk[got[0]])), best = same ? got[0] : null;

    /* one card per app: captured checkout total, else captured menu count, else "Not checked yet" + a link to check */
    const appCard = (a) => { const o = chk[a], mn = menu[a], A = X().APPS[a], url = (o || mn || {}).store?.url;
      const body = o ? `<div class="pp-big num">${$(o.total)}</div><div class="pp-cap">Checkout total, captured ${X().ago(o.at)}</div>${feeLine(o.fees) ? `<div class="pp-fee">${feeLine(o.fees)}</div>` : ""}`
        : mn ? `<div class="pp-cnt"><b class="num">${mn.items.length}</b> menu price${mn.items.length === 1 ? "" : "s"}, captured ${X().ago(mn.at)}</div>${mn.note ? `<div class="pp-said">${A.name} showed: “${esc(mn.note)}”</div>` : ""}`
        : `<div class="pp-none">Not checked yet</div>`;
      return `<article class="pp-app${best === a ? " best" : ""}${o || mn ? "" : " off"}"><div class="pp-ah"><span class="ab ${a}" aria-hidden="true">${A.badge}</span><b>${A.name}</b>${best === a ? `<span class="chip hl">Cheapest</span>` : ""}</div>
        ${body}<a class="pp-go" target="_blank" rel="noopener" href="${esc(url || A.search(pl.name, pl.addr))}">${url ? "Open store" : `Check on ${A.name}`}${I("ext", "s")}</a></article>`; };
    const prices = `<section class="pp-sec"><h2 class="pp-h2">Prices on each app</h2>
      <p class="pp-sub">${got.length ? `Checkout totals, captured with the Fairplate extension.${best ? ` Cheapest for the same cart: ${X().APPS[best].name}.` : got.length > 1 ? " The carts differ, so these totals are not like-for-like yet." : ""}` : menus.length ? "Menu prices, captured with the Fairplate extension. Fees and tax only show at checkout." : "No prices captured for this place yet."}</p>
      <div class="pp-apps">${apps.map(appCard).join("")}</div>
      ${got.length || menus.length ? "" : `<a href="#/extension" class="pp-how"><span class="mark" style="flex:none"></span><span class="pp-howt"><b>How checking works</b><span>The extension reads the prices you already see. One visit.</span></span>${I("right", "s")}</a>`}</section>`;

    /* map card (Airbnb "where you'll be" / Google Maps place panel): address, walk, directions, website */
    const map = `https://www.openstreetmap.org/export/embed.html?bbox=${pl.lon - 0.004},${pl.lat - 0.0025},${pl.lon + 0.004},${pl.lat + 0.0025}&layer=mapnik&marker=${pl.lat},${pl.lon}`;
    const where = `<section class="pp-where"><div class="pp-map"><iframe title="Map of ${esc(pl.name)}" loading="lazy" src="${map}"></iframe></div>
      <div class="pp-wb"><b class="pp-addr">${pl.addr ? esc(pl.addr) : "Street address not listed"}</b>
        <div class="pp-wm">${walk(pl.km)} · ${dist(pl.km)}${S().addr ? ` from ${esc(S().addr)}` : ""}</div>
        <div class="pp-wa"><a class="pp-pill ink" target="_blank" rel="noopener" href="https://www.openstreetmap.org/directions?route=%3B${pl.lat}%2C${pl.lon}">${I("arrow", "s")}Directions</a>${pl.web ? `<a class="pp-pill" target="_blank" rel="noopener" href="${esc(pl.web)}">${esc(host(pl.web))}${I("ext", "s")}</a>` : ""}</div></div>
      <div class="pp-attr">Map and place data © OpenStreetMap contributors</div></section>`;

    /* header: example photo (labelled) or the name tile, then name, kind, open-now, walk, save + share */
    const ph = P().photoOf(pl), hs = hoursOf(pl), saved = !!S().saved[pl.id];
    const type = pl.amenity === "fast_food" ? "Fast food" : pl.amenity === "cafe" ? "Café" : "Restaurant";
    const kick = [pl.label, pl.brand && pl.brand !== pl.name ? pl.brand : "", type].filter((v, i, a) => v && a.indexOf(v) === i).map(esc).join(" · ");
    const alt = `Example photo of ${esc(pl.label)} food, not from ${esc(pl.name)}`;
    const head = `<div class="pp-kick">${kick}</div><h1 class="pp-name" style="view-transition-name:vt-title">${esc(pl.name)}</h1>
      <div class="pp-meta">${openChip(hs)}<span class="pp-walk">${I("walk", "s")}${walk(pl.km)} · ${dist(pl.km)}</span></div>`;
    const share = (cls, label) => `<button class="${cls}" data-share aria-label="Copy link to this page">${I("share", "s")}${label ? "<span>Share</span>" : ""}</button>`;
    const bg = ph ? "" : `background:${tint(pl.name)}`;
    let html;
    if (m) {
      html = `<div class="pg app pp"><section class="pp-hero m ${ph ? "on" : "tile"}" style="${bg}">
          ${ph ? `<img class="pp-full" src="${img(ph)}" alt="${alt}" style="view-transition-name:vt-${pl.id}">` : `<div class="pp-mono" role="img" aria-label="${esc(pl.name)}" style="view-transition-name:vt-${pl.id}">${esc(initials(pl.name))}</div>`}
          <div class="pp-stat">${status(!!ph)}</div>
          <div class="pp-top"><a href="#/feed" data-a="back" class="pp-ib" aria-label="Back">${I("left")}</a><span class="sp"></span>${share("pp-ib")}<button class="heart pp-ib${saved ? " on" : ""}" data-a="save" data-id="${pl.id}" aria-label="Save">${I("heart")}</button></div>
          ${ph ? `<span class="pp-ex">Example photo</span>` : ""}</section>
        <div class="pp-body"><div class="pp-mhead">${head}</div>${prices}${menuTable(menu)}<section class="pp-sec"><h2 class="pp-h2">Getting there</h2>${where}</section>${nearby(pl)}</div><div class="homebar"></div></div>`;
    } else {
      html = `<div class="pg webp pp">${V.realTop()}<main class="pp-wrap"><a href="#/feed" data-a="back" class="pp-back">${I("left", "s")}Back</a>
        <section class="pp-hero ${ph ? "on" : "tile"}" style="${bg}">${ph ? `<div class="pp-bd" aria-hidden="true" style="background-image:url('${img(ph)}')"></div>` : ""}<div class="pp-htext">${head}
            <div class="pp-acts"><button class="heart pp-btn${saved ? " on" : ""}" data-a="save" data-id="${pl.id}" aria-label="Save">${I("heart", "s")}<span class="l0">Save</span><span class="l1">Saved</span></button>${share("pp-btn", true)}</div></div>
          <figure class="pp-shot">${ph ? `<img src="${img(ph)}" alt="${alt}" style="view-transition-name:vt-${pl.id}"><span class="pp-ex">Example photo</span>` : `<div class="pp-mono" role="img" aria-label="${esc(pl.name)}" style="view-transition-name:vt-${pl.id}">${esc(initials(pl.name))}</div>`}</figure></section>
        <div class="pp-grid"><div class="pp-main">${prices}${menuTable(menu)}</div><aside class="pp-side">${where}</aside></div>${nearby(pl)}</main></div>`;
    }
    return { html, title: pl.name + " · Fairplate", mount(root) {
      const b = root.querySelector("[data-showall]"); if (b) b.onclick = () => { root.querySelector("[data-more]").hidden = false; b.remove(); };
      root.querySelectorAll("[data-share]").forEach((s) => (s.onclick = () => {
        (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => toast("Link copied"), () => toast("Couldn't copy the link"));
      }));
    } };
  };

})();
