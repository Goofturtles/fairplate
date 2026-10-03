/* Phone pages (1:1 with design s04, s06, s07, s08, s10, s11, s13, s14, s15, s17, s18, s19). */
(function () {
  const { I, badge, esc, $, img, status, tabbar, pcs, counts, stagger, segs } = FP.ui;
  const E = FP.engine, S = () => FP.S, V = FP.views;
  const cardQuotes = (r) => FP.APP_ORDER.map((k) => E.quote(r.id, r.typicalItems, k));
  const cheapest = (r) => cardQuotes(r).sort((a, b) => a.total - b.total)[0];
  const heart = (id, size = "") => `<button class="heart${S().saved[id] ? " on" : ""}" data-a="save" data-id="${id}" aria-label="Save">${I("heart", size)}</button>`;
  const back = (href = "back") => href === "back" ? `href="#/" data-a="back"` : `href="${href}"`;

  /* ---------------- home ---------------- */
  V.home = () => {
    const st = S(), qs = E.all("qsb", { smash: 2, fries: 1 });
    const nonnas = E.rest("nonnas"), nq = cardQuotes(nonnas).sort((a, b) => a.total - b.total);
    const welcome = st.welcome ? `<div data-welcome style="text-align:center;margin-top:6px;padding:0 20px">
      <div style="font-size:21px;font-weight:700;line-height:1.25">Welcome to Fairplate</div>
      <div style="margin-top:6px;font-size:14.5px;line-height:1.4">Your last order would've been <b>${$(qs[2].total - qs[0].total)} cheaper</b> on ${FP.APPS[qs[0].app].name}.</div>
      <div class="row g10" style="justify-content:center;margin-top:12px"><a href="#/compare" data-a="demo" class="btn ink sm">See how</a><button data-a="nothanks" class="btn ghost sm" style="border:0">Not now</button></div></div>` : "";
    const html = `<div class="pg app">
  <div style="background:var(--hl);padding-bottom:${st.welcome ? 18 : 6}px" data-top>${status()}${welcome}</div>
  <div class="pad" style="margin-top:14px">
    <a href="#/address" class="row g8">${I("pin")}<b style="font-size:16px">${esc(st.addr)}</b>${I("down", "s")}<span class="sp"></span><span data-a="toast" data-msg="Price drops for your saved orders show up here.">${I("bell")}</span></a>
    <a href="#/search" class="search" style="margin-top:12px">${I("search", "s")}Search “Poutine”</a>
  </div>
  <div class="row g12 pad scroll-x" style="margin-top:16px" data-stagger>${FP.CATEGORIES.filter((c) => ["burgers", "pizza", "sushi", "thai", "poutine"].includes(c[0])).map(([k, lab, im]) => `<a href="#/results?cat=${k}" class="col g6" style="align-items:center;flex:none"><img class="circle" src="${img(im)}" alt=""><span class="tiny" style="font-weight:500">${lab}</span></a>`).join("")}</div>
  <div class="row g8 scroll-x" style="margin-top:16px;padding-left:20px;white-space:nowrap">
    <a href="#/results" class="pill on">Cheapest total${I("down", "s")}</a><a href="#/results?u30=1" class="pill">Under 30 min</a><a href="#/results?pickup=1" class="pill">Pickup</a><a href="#/results?deals=1" class="pill">Deals</a>
  </div>
  <div class="pad" style="margin-top:16px">
    <a href="#/r/nonnas" class="row lift" style="border-radius:16px;background:var(--soft);overflow:hidden;height:118px">
      <div style="padding:14px 16px;flex:1"><div class="chip ink" style="height:22px;font-size:11.5px">Biggest gap tonight</div><div style="font-weight:600;font-size:15px;line-height:1.35;margin-top:8px">Nonna's Slice is <span class="save">${$(nq[2].total - nq[0].total)} less</span> on ${FP.APPS[nq[0].app].name} than ${FP.APPS[nq[2].app].name}</div></div>
      <div class="zoom" style="width:118px;height:118px;flex:none"><img src="${img("pizza")}" alt="" style="width:118px;height:118px;view-transition-name:vt-nonnas"></div>
    </a>
  </div>
  <div class="row pad" style="margin-top:18px"><span class="h2" style="font-size:20px">Cheapest near you</span><span class="sp"></span><a href="#/results" class="iconbtn" style="width:32px;height:32px" aria-label="See all">${I("arrow", "s")}</a></div>
  <div class="row g12 pad scroll-x" style="margin-top:10px;align-items:flex-start" data-stagger>
    ${[["uzu", 260], ["taconorte", 120], ["mamalin", 120]].map(([id, w]) => { const r = E.rest(id), c = cheapest(r); return `<a href="#/r/${id}" style="flex:none;width:${w}px"><div class="ph zoom"><img src="${img(r.img)}" alt="${esc(r.name)}" style="width:${w}px;height:120px;view-transition-name:vt-${id}"></div><div class="small" style="font-weight:600;margin-top:6px">${esc(r.name)}</div><div class="tiny muted">${$(c.total)} on ${FP.APPS[c.app].name}</div></a>`; }).join("")}
  </div>
  <div class="tab-spacer"></div>
  ${tabbar("Home")}
</div>`;
    return { html, title: "Fairplate", mount(root) { stagger(root); } };
  };

  /* ---------------- search ---------------- */
  V.search = () => {
    const st = S();
    const tile = (id) => { const r = E.rest(id), c = cheapest(r); return `<a href="#/r/${id}" style="width:104px;flex:none"><div class="ph zoom"><img src="${img(r.img)}" alt="" style="width:104px;height:104px;view-transition-name:vt-${id}"></div><div class="small" style="font-weight:600;margin-top:6px">${esc(r.name)}</div><div class="tiny muted">from ${$(c.total)}${id === "falafel" ? "" : ` on ${FP.APPS[c.app].name}`}</div></a>`; };
    const chips = (list) => list.map((c) => `<a class="pill out" href="#/results?q=${encodeURIComponent(c)}">${c}</a>`).join("");
    const html = `<div class="pg app">
  ${status()}
  <form data-f="msearch" class="pad" style="margin-top:8px"><label class="search" style="border:1.5px solid var(--ink);background:var(--paper)">${I("search", "s", "color:var(--ink)")}<input name="q" data-live="search" aria-label="Search" placeholder="Search restaurants or dishes" style="flex:1;height:42px;font-size:15px" autocomplete="off"></label></form>
  <div data-live-out></div>
  <div data-idle>
  <div class="pad" style="margin-top:24px"><div class="h3">Recent searches</div>
    <div class="col" style="margin-top:6px">${st.recent.map((t) => `<div class="row g12" style="height:44px" data-recent><a href="#/results?q=${encodeURIComponent(t)}" class="row g12" style="flex:1;height:44px">${I("clock", "s muted")}<span>${esc(t)}</span></a><button data-a="unrecent" data-t="${esc(t)}" aria-label="Remove ${esc(t)}">${I("x", "s")}</button></div>`).join("") || `<div class="small muted" style="padding:10px 0">Nothing yet.</div>`}</div>
  </div>
  <div class="pad" style="margin-top:16px"><div class="h3">Cheapest right now</div><div class="tiny muted" style="margin-top:2px">Never sponsored. Ranked by all-in total only.</div></div>
  <div class="row g10 scroll-x" style="padding-left:20px;margin-top:12px;align-items:flex-start" data-stagger>${["mamalin", "uzu", "taconorte", "falafel"].map(tile).join("")}</div>
  <div class="pad" style="margin-top:22px"><div class="h3">Popular in Toronto</div><div class="row g8" style="flex-wrap:wrap;margin-top:12px">${chips(["poutine", "pizza", "sushi", "shawarma", "pad thai", "butter chicken", "wings"])}</div></div>
  <div class="pad" style="margin-top:22px"><div class="h3">Under $20 all-in</div><div class="row g8" style="flex-wrap:wrap;margin-top:12px">${["burritos", "banh mi", "dumplings", "falafel"].map((c) => `<a class="pill out" href="#/results?under20=1&q=${encodeURIComponent(c)}">${c}</a>`).join("")}</div></div>
  </div>
  <div class="tab-spacer"></div>
  ${tabbar("Search")}
</div>`;
    return { html, title: "Search · Fairplate", mount(root) { stagger(root); } };
  };
  /* live search results (typed) */
  FP.liveSearch = (q) => {
    q = q.trim().toLowerCase();
    if (!q) return "";
    const list = FP.RESTAURANTS.filter((r) => (r.name + " " + r.cuisine + " " + r.menu.map((m) => m.name).join(" ")).toLowerCase().includes(q));
    return `<div class="col pad" style="margin-top:12px" data-stagger>${list.map((r) => { const c = cheapest(r); return `<a href="#/r/${r.id}" class="row g12 row-link" style="padding:8px 4px"><img src="${img(r.img)}" alt="" style="width:48px;height:48px;border-radius:10px"><div style="flex:1"><b>${esc(r.name)}</b><div class="tiny muted">${esc(r.cuisine)}</div></div><span class="small"><b>${$(c.total)}</b> <span class="muted">on ${FP.APPS[c.app].short}</span></span></a>`; }).join("") || `<div class="small muted" style="padding:12px 4px">No matches yet. Try “ramen”.</div>`}</div>`;
  };

  /* ---------------- results ---------------- */
  V.results = (p) => {
    const st = S(), q = (p.get("q") || "").trim(), cat = p.get("cat");
    let list = FP.RESTAURANTS.slice();
    if (q) list = list.filter((r) => (r.name + " " + r.cuisine + " " + r.menu.map((m) => m.name).join(" ")).toLowerCase().includes(q.toLowerCase().replace(/s$/, "")));
    if (cat) list = list.filter((r) => r.cat === cat || (cat === "poutine" && r.id === "qsb"));
    if (p.get("saved")) list = list.filter((r) => st.saved[r.id]);
    if (p.get("u30")) list = list.filter((r) => r.feedEta < 30);
    if (p.get("top")) list = list.filter((r) => r.rating >= 4.5);
    if (p.get("under20")) list = list.filter((r) => cheapest(r).total < 20);
    list.sort((a, b) => cheapest(a).total - cheapest(b).total);
    const link = (k, v) => { const n = new URLSearchParams(p); n.get(k) ? n.delete(k) : n.set(k, v); return "#/results?" + n.toString(); };
    const card = (r) => { const qs = cardQuotes(r), s = [...qs].sort((a, b) => a.total - b.total); return `<div style="margin-top:20px"><a href="#/r/${r.id}" class="ph zoom" style="display:block"><img loading="lazy" src="${img(r.img)}" alt="${esc(r.name)}" style="width:100%;height:190px;view-transition-name:vt-${r.id}"></a>
      <div class="row" style="margin-top:10px"><a href="#/r/${r.id}" style="font-size:17px;font-weight:600">${esc(r.name)}</a><span class="sp"></span>${heart(r.id)}</div>
      <div class="small muted" style="margin:2px 0 8px">${r.rating} ★ (${r.count}) · ${r.km} km · ${r.feedEta} min</div>${pcs(qs, `<span style="background:var(--save-soft);color:var(--save)">save ${$(s[2].total - s[0].total)}</span>`)}</div>`; };
    const title = p.get("saved") ? "Saved" : q ? `“${esc(q)}”` : cat ? FP.CATEGORIES.find((c) => c[0] === cat)?.[1] || "Results" : null;
    const html = `<div class="pg app">
  ${status()}
  <div class="pad" style="margin-top:6px">
    <div class="row g8"><a href="#/address" class="row g8">${I("pin")}<b style="font-size:16px">${esc(st.addr)}</b>${I("down", "s")}</a><span class="sp"></span>${I("bell")}</div>
    <div class="row g10" style="margin-top:12px"><a href="#/search" class="search" style="flex:1">${I("search", "s")}${q ? `<span style="color:var(--ink)">${esc(q)}</span>` : "Search “Fried chicken”"}</a><a href="#/results" class="iconbtn" style="width:46px;height:46px;border-radius:14px" aria-label="Clear filters">${I("sliders")}</a></div>
  </div>
  <div class="row g8 scroll-x" style="margin-top:14px;padding-left:20px;white-space:nowrap">
    <a href="${link("top", 1)}" class="pill${p.get("top") ? " on" : ""}">★ Over 4.5${I("down", "s")}</a><a href="#/results" class="pill on">Cheapest total</a><a href="${link("u30", 1)}" class="pill${p.get("u30") ? " on" : ""}">Under 30 min</a><a href="${link("under20", 1)}" class="pill${p.get("under20") ? " on" : ""}">Price</a>
  </div>
  <div class="row pad" style="margin-top:18px"><b style="font-size:17px">${title ? title + " · " : ""}${list.length} result${list.length === 1 ? "" : "s"}</b><span class="sp"></span><a href="#/results" class="pill" style="height:32px">Reset</a></div>
  <div class="pad" data-stagger style="margin-top:-6px">${list.map(card).join("") || `<p class="muted small" style="margin-top:20px">Nothing here yet.</p>`}</div>
  <div class="tab-spacer"></div>
  ${tabbar(p.get("saved") ? "Saved" : "Home")}
</div>`;
    return { html, title: "Results · Fairplate", mount(root) { stagger(root); } };
  };

  /* ---------------- restaurant ---------------- */
  const orderFor = (r) => (S().restId === r.id && Object.keys(S().basket).length ? S().basket : r.typicalItems);
  V.restaurantApp = (p, id) => {
    const r = E.rest(id) || E.rest("qsb"), items = orderFor(r), qs = E.all(r.id, items);
    const best = qs[0], fast = [...qs].sort((a, b) => a.eta - b.eta || a.total - b.total)[0], worst = qs[qs.length - 1];
    const pickup = S().mode === "pickup", pu = E.pickup(r.id, items);
    const lo = Math.round(Math.min(...qs.map((q) => q.markup)) * 100), hi = Math.round(Math.max(...qs.map((q) => q.markup)) * 100);
    const rows = pickup
      ? [["walk", `Pick it up: ${$(pu.total)}`, `${r.walk} min walk · restaurant prices, no fees`, "#/compare"], ["clock", "Ready in 15 min", r.addr, `https://www.google.com/maps/search/${encodeURIComponent(r.addr + " Toronto")}`], ["tag", `Saves ${$(best.total - pu.total)} vs delivery`, `vs ${FP.APPS[best.app].name}, the cheapest app`, "#/compare"]]
      : [["badge", `Cheapest: ${FP.APPS[best.app].name}`, `${$(best.total)} all-in for your usual order`, "#/compare"], ["clock", `Fastest: ${FP.APPS[fast.app].name}, ${fast.eta} min`, fast.app === best.app ? "Also the cheapest" : `${$(fast.total - best.total)} more than ${FP.APPS[best.app].name}`, "#/compare"], ["tag", `Menu markup: +${lo}% to +${hi}%`, "vs the restaurant's own prices", `#/fees/${worst.app}`]];
    const bests = r.menu.filter((m) => m.best).slice(0, 6);
    const html = `<div class="pg app" style="background:var(--soft)">
  <div style="position:relative;height:300px">
    <img src="${img(r.img)}" alt="${esc(r.name)}" style="width:100%;height:300px;object-position:50% 40%;view-transition-name:vt-${r.id}">
    <div style="position:absolute;top:0;left:0;right:0">${status(true)}</div>
    <div class="row pad" style="position:absolute;top:54px;left:0;right:0"><a ${back()} class="iconbtn w" aria-label="Back">${I("left")}</a><span class="sp"></span><a href="#/search" class="iconbtn w" style="margin-right:8px" aria-label="Search">${I("search")}</a><button data-a="toast" data-msg="Share, report a wrong price and more." class="iconbtn w" aria-label="More">${I("more")}</button></div>
    <span class="chip hl pop" style="position:absolute;left:20px;bottom:44px;animation-delay:.35s">Cheapest on ${FP.APPS[best.app].name} tonight</span>
  </div>
  <div style="position:relative;margin-top:-28px;background:var(--paper);border-radius:24px 24px 0 0;padding:22px 20px 0;min-height:600px">
    <div class="row"><span class="h1" style="font-size:26px;view-transition-name:vt-title">${esc(r.name)}</span><span class="sp"></span>${heart(r.id, "l")}</div>
    <div class="row g6 small muted" style="margin-top:6px"><b style="color:var(--ink)">${r.rating} ★</b>(${r.count}) · ${r.price} · ${esc(r.cuisine)}</div>
    <div class="seg" data-a="mode" style="margin-top:16px;width:100%;padding:4px"><span class="${pickup ? "" : "on"}" data-v="delivery" style="flex:1;justify-content:center;height:40px">${I("bolt", "s", "margin-right:6px")}Delivery</span><span class="${pickup ? "on" : ""}" data-v="pickup" style="flex:1;justify-content:center;height:40px">${I("walk", "s", "margin-right:6px")}Pickup</span></div>
    <div class="col" style="margin-top:8px" data-stagger>${rows.map(([ic, t, s, href], i) => `${i ? '<div class="hr"></div>' : ""}<a href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""} class="row g12 row-link" style="height:60px">${ic === "badge" ? badge(best.app, true) : I(ic, "", "width:22px")}<div style="flex:1"><b>${t}</b><div class="tiny muted">${s}</div></div>${I("right", "s")}</a>`).join("")}</div>
    <div class="h2" style="margin-top:14px;font-size:20px">${r.menu.length > 1 ? "Best sellers" : "Signature"}</div>
    <div class="row g10 scroll-x" style="margin-top:12px;align-items:flex-start;padding-bottom:30px" data-stagger>${bests.map((m) => `<a href="#/r/${r.id}/item/${m.id}" style="width:110px;flex:none"><div style="position:relative" class="ph zoom"><img src="${img(m.img)}" alt="" style="width:110px;height:110px">${m.promo ? `<span class="chip hl" style="position:absolute;left:6px;top:6px;height:20px;font-size:10.5px;padding:0 7px">${m.promo}</span>` : ""}</div><div class="small" style="font-weight:600;margin-top:6px">${esc(m.short || m.name)}</div><div class="tiny muted">from ${$(Math.min(m.sk, m.dd, m.ue))}</div></a>`).join("")}</div>
  </div>
  <div class="homebar"></div>
</div>`;
    return { html, title: r.name + " · Fairplate", mount(root) { stagger(root); segs(root); } };
  };

  /* ---------------- item sheet ---------------- */
  V.item = (p, rid, iid) => {
    const r = E.rest(rid) || E.rest("qsb"), m = E.item(r, iid) || r.menu[0];
    const inBasket = S().restId === r.id ? S().basket[m.id] || 0 : 0, q = FP.sheetQty ?? (inBasket || 1);
    const apps = FP.APP_ORDER.map((k) => ({ k, v: m[k], mk: (m[k] - m.store) / m.store })).sort((a, b) => a.v - b.v);
    const maxMk = Math.max(...apps.map((a) => a.mk));
    const row = (a, i) => i === 0
      ? `<div class="row g12" style="background:var(--hl-soft);border-radius:12px;padding:12px">${badge(a.k, true)}<b style="width:90px">${FP.APPS[a.k].name}</b><div style="flex:1;height:8px;border-radius:4px;background:#fff"><div class="bar-fill" style="--i:${i};width:${Math.max(6, (a.mk / maxMk) * 100)}%;height:8px;border-radius:4px;background:var(--hl)"></div></div><span class="small muted" style="width:44px;text-align:right">${E.pct(a.mk)}</span><b class="num" style="width:58px;text-align:right">${$(a.v)}</b></div>`
      : `<div class="row g12" style="padding:0 12px">${badge(a.k, true)}<span style="width:90px">${FP.APPS[a.k].name}</span><div style="flex:1;height:8px;border-radius:4px;background:var(--soft)"><div class="bar-fill" style="--i:${i};width:${Math.max(6, (a.mk / maxMk) * 100)}%;height:8px;border-radius:4px;background:var(--faint)"></div></div><span class="small muted" style="width:44px;text-align:right">${E.pct(a.mk)}</span><span class="num" style="width:58px;text-align:right">${$(a.v)}</span></div>`;
    const html = `<div class="pg app" style="background:#8a8a8a">
  <a ${back(`#/r/${r.id}`)} data-a="sheetclose" class="sheet-bg" style="position:fixed;inset:0;background:#8a8a8a;display:block" aria-label="Close"></a>
  <div style="position:relative;z-index:1">${status(true)}</div>
  <div class="sheet" style="position:absolute;left:0;right:0;top:56px;bottom:0;background:var(--paper);border-radius:22px 22px 0 0;z-index:2;min-height:788px">
    <div class="pad" style="padding-top:20px"><button data-a="sheetclose" data-href="#/r/${r.id}" aria-label="Close">${I("x", "l")}</button></div>
    <div class="pad" style="margin-top:14px">
      <div class="h1" style="font-size:26px">${esc(m.name)}</div>
      <div class="row g8 small muted" style="margin-top:6px"><b style="color:var(--ink)">${$(m.store)} in store</b>·<span>${m.cal} cal</span>${m.protein ? `·<span>${m.protein}g protein</span>` : ""}</div>
    </div>
    <button data-a="acc" data-t="prices" class="pad row" style="margin-top:20px;width:100%"><b style="font-size:17px">Price on each app</b><span class="sp"></span>${I("up")}</button>
    <div data-acc="prices" class="acc"><div class="col g10 pad" style="padding-top:14px">${apps.map(row).join("")}
      <div class="row g12" style="padding:0 12px">${badge("store", true)}<span style="width:90px">In store</span><div style="flex:1"></div><span style="width:44px"></span><span class="num" style="width:58px;text-align:right">${$(m.store)}</span></div></div></div>
    <div class="pad small muted" style="margin-top:14px;line-height:1.45">Apps often charge more for the same item than the restaurant does. Fees come on top of this.</div>
    <div class="pad" style="margin-top:18px"><div class="hr"></div>
      <button data-a="acc" data-t="in" class="row" style="height:56px;width:100%"><b style="font-size:17px">What's in it</b><span class="sp"></span>${I("down")}</button>
      <div data-acc="in" class="acc" style="height:0"><div class="small muted" style="padding:0 0 14px;line-height:1.5">${esc(m.desc)}. ${m.cal} calories${m.protein ? `, ${m.protein}g protein` : ""}.</div></div>
      <div class="hr"></div>
      <button data-a="acc" data-t="req" class="row" style="height:56px;width:100%"><b style="font-size:17px">Special requests</b><span class="sp"></span>${I("down")}</button>
      <div data-acc="req" class="acc" style="height:0"><div style="padding-bottom:14px"><textarea rows="2" aria-label="Special requests" placeholder="e.g. no pickles. Each app gets your note." style="width:100%;border:1.5px solid var(--line);border-radius:10px;padding:10px;font-size:14px;resize:none"></textarea></div></div>
      <div class="hr"></div></div>
    <div style="position:absolute;left:0;right:0;bottom:0;padding:14px 20px 34px;border-top:1px solid var(--line);background:var(--paper)">
      <div class="row g10"><div class="row" style="height:48px;border-radius:12px;border:1.5px solid var(--line);padding:0 14px;gap:18px"><button data-a="sheetqty" data-d="-1" aria-label="Fewer">${I("minus", "s")}</button><b data-q>${q}</b><button data-a="sheetqty" data-d="1" aria-label="More">${I("plus", "s")}</button></div><button data-a="meal" class="btn ghost" style="flex:1">${S().basket.fries && S().restId === r.id && r.id === "qsb" ? "Meal added ✓" : "Make it a meal"}</button></div>
      <button data-a="addcompare" data-r="${r.id}" data-id="${m.id}" class="btn hl full" style="margin-top:10px;height:52px">Add to compare · <span data-qlabel>${q} item${q === 1 ? "" : "s"}</span></button>
    </div>
  </div>
</div>`;
    return { html, title: m.name + " · Fairplate", mount(root) { FP.ui.accordion(root.querySelector('[data-acc="prices"]'), true); } };
  };

  /* ---------------- basket ---------------- */
  V.basket = () => {
    const st = S(), r = E.rest(st.restId), items = st.basket;
    if (!Object.keys(items).length) return V.emptyApp("Your basket is empty", "Add something from a menu and we'll check every app.");
    const qs = E.all(r.id, items), best = qs[0], n = Object.values(items).reduce((a, c) => a + c, 0);
    const stamp = document.body.classList.contains("still") ? "7:42 PM" : new Date().toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?([ap])\.?m\.?/i, (m, a) => " " + a.toUpperCase() + "M");
    const html = `<div class="pg app">
  ${status()}
  <div class="row pad" style="margin-top:6px"><a ${back()} aria-label="Back">${I("left", "l")}</a><span class="sp"></span><button data-a="share" aria-label="Share">${I("share")}</button></div>
  <div class="pad" style="margin-top:14px"><div class="h1" style="font-size:26px">Your basket</div><div class="small muted" style="margin-top:4px">${esc(r.name)} · checked ${stamp}</div></div>
  <div class="pad" style="margin-top:20px"><b style="font-size:16px">${n} item${n === 1 ? "" : "s"}</b>
    <div class="col g12" style="margin-top:12px" data-stagger>${Object.entries(items).map(([id, q]) => { const m = E.item(r, id); return `<a href="#/r/${r.id}/item/${id}" class="row g12"><img src="${img(m.img)}" alt="" style="width:52px;height:52px;border-radius:10px"><div style="flex:1"><div style="font-weight:500">${esc(m.name)}</div><div class="tiny muted">× ${q} · ${$(m.store)}${q > 1 ? " each" : ""} in store</div></div><span class="num">${$(m.store * q)}</span></a>`; }).join("")}</div>
  </div>
  <div class="thick" style="margin-top:20px"></div>
  <div class="pad" style="margin-top:18px"><div class="row"><b style="font-size:16px">Bill details on ${FP.APPS[best.app].name}</b><span class="sp"></span><span class="chip hl pop" style="height:22px">Cheapest</span></div>
    <div class="col g10 small" style="margin-top:12px;font-size:14px">
      <div class="row"><span class="muted">Restaurant's own price</span><span class="sp"></span><span class="num">${$(best.store)}</span></div>
      <div class="row"><span class="muted">${FP.APPS[best.app].name} menu markup (${E.pct(best.markup)})</span><span class="sp"></span><span class="num">${E.signed(best.menu - best.store)}</span></div>
      <div class="row"><span class="muted">Delivery fee</span><span class="sp"></span><span class="num">+${$(best.delivery)}</span></div>
      <div class="row"><span class="muted">Service fee</span><span class="sp"></span><span class="num">+${$(best.service)}</span></div>
      <div class="row"><span class="muted">Tax</span><span class="sp"></span><span class="num">+${$(best.tax)}</span></div>
      <div class="hr"></div>
      <div class="row" style="font-weight:700;font-size:16px"><span>${FP.APPS[best.app].name} total</span><span class="sp"></span><span class="num" data-count="${best.total}">${$(best.total)}</span></div>
    </div>
  </div>
  <div class="thick" style="margin-top:18px"></div>
  <div class="pad" style="margin-top:16px"><b style="font-size:16px">Other apps</b>
    ${qs.slice(1).map((q, i) => `<a href="#/fees/${q.app}" class="row g8 small" style="margin-top:${i ? 8 : 10}px"><span class="dot ${q.app}"></span>${FP.APPS[q.app].name}<span class="sp"></span><span class="num">${$(q.total)}</span></a>`).join("")}
  </div>
  <div class="bar-spacer"></div>
  <div class="bottombar pad" style="padding-top:12px;padding-bottom:34px;background:transparent"><button data-a="open" data-app="${best.app}" class="btn ink full" style="height:52px;flex-direction:column;gap:0"><span>Open ${FP.APPS[best.app].name} to order</span><span style="font-size:11px;font-weight:500;opacity:.7;line-height:1.3">WE'LL OPEN THIS RESTAURANT</span></button></div>
  <div class="homebar"></div>
</div>`;
    return { html, title: "Basket · Fairplate", mount(root) { stagger(root); counts(root, true); } };
  };

  /* ---------------- compare ---------------- */
  const score = (q) => q.total + q.eta * 0.05;
  V.compareApp = () => {
    const st = S(), r = E.rest(st.restId), items = st.basket;
    if (!Object.keys(items).length) return V.emptyApp("Nothing to compare yet", "Add something from a menu first.");
    const qs = E.all(r.id, items), best = qs[0], sortBy = st.sort || "rec";
    const pick = st.choice && qs.find((q) => q.app === st.choice) ? st.choice : [...qs].sort((a, b) => score(a) - score(b))[0].app;
    const pass = E.quote(r.id, items, "dd", { pass: true }), pu = E.pickup(r.id, items);
    const order = sortBy === "fast" ? [...qs].sort((a, b) => a.eta - b.eta) : sortBy === "cheap" ? qs : [...qs].sort((a, b) => score(a) - score(b));
    const summary = Object.entries(items).map(([id, n]) => `${n} × ${esc(E.item(r, id).short || E.item(r, id).name)}`).join(", ");
    const row = (q) => { const on = q.app === pick, d = q.total - best.total; return `<button data-a="pick" data-app="${q.app}" data-key="${q.app}" class="row g12 chk winbox" style="width:100%;text-align:left;border:2px solid ${on ? "var(--ink)" : "transparent"};border-radius:14px;padding:${on ? "12px" : "10px 12px"}">${badge(q.app)}<div style="flex:1"><b style="font-size:16px">${FP.APPS[q.app].name}</b><div class="tiny muted">${q.eta} min · ${$(q.delivery)} delivery</div></div><div style="text-align:right"><span class="skel" style="margin-left:auto"></span><b class="num val" style="font-size:17px" data-count="${q.total}">${$(q.total)}</b><div class="tiny later ${q.app === best.app ? "save" : "muted"}" style="${q.app === best.app ? "font-weight:600" : ""}">${q.app === best.app ? "Cheapest" : E.signed(d)}</div></div></button>`; };
    const html = `<div class="pg app" style="background:var(--soft)">
  ${status()}
  <div class="pad"><div class="row g10 card" style="padding:10px 12px;border:0"><a ${back()} aria-label="Back">${I("back")}</a><img src="${img(r.img)}" alt="" style="width:36px;height:36px;border-radius:8px;view-transition-name:vt-${r.id}"><div style="flex:1"><b>${esc(r.name)}</b><div class="tiny muted">${summary}</div></div><a href="#/basket" class="small" style="font-weight:600">Edit</a></div></div>
  <div style="position:relative;margin-top:26px;background:var(--paper);border-radius:22px 22px 0 0;min-height:712px">
    <div class="row g6" style="justify-content:center;height:36px;background:var(--hl);border-radius:22px 22px 0 0;font-weight:600;font-size:13.5px" data-banner-wrap><span class="banner-msg" data-banner>${I("check", "s")}3 apps checked <span data-ago>12 seconds ago</span></span></div>
    <div class="row g8 pad" style="margin-top:14px">${[["rec", "Recommended", ""], ["fast", "Faster", "clock"], ["cheap", "Cheaper", "tag"]].map(([k, lab, ic]) => `<button data-a="csort" data-v="${k}" class="pill${sortBy === k ? " out" : ""}" style="${sortBy === k ? "border-color:var(--ink);border-width:2px" : ""}">${ic ? I(ic, "s") : ""}${lab}</button>`).join("")}</div>
    <div class="col pad" style="margin-top:12px;gap:6px" data-rows>${order.map(row).join("")}</div>
    <div class="col pad" style="gap:6px;margin-top:6px">
      ${pass.total < best.total ? `<a href="#/membership" class="row g12" style="padding:12px 14px;opacity:.8">${badge("dd", false, "opacity:.6")}<div style="flex:1"><b style="font-size:16px">DoorDash + DashPass</b><div class="tiny muted">if you had it · $9.99/mo</div></div><div style="text-align:right"><b class="num" style="font-size:17px">${$(pass.total)}</b><div class="tiny muted">${E.signed(pass.total - best.total)}</div></div></a>` : ""}
      <div class="hr" style="margin:4px 0"></div>
      <a href="https://www.google.com/maps/search/${encodeURIComponent(r.addr + " Toronto")}" target="_blank" rel="noopener" class="row g12 row-link" style="padding:12px 14px">${badge("pickup")}<div style="flex:1"><b style="font-size:16px">Pick it up yourself</b><div class="tiny muted">${r.walk} min walk · restaurant prices</div></div><div style="text-align:right"><b class="num" style="font-size:17px">${$(pu.total)}</b><div class="tiny save" style="font-weight:600">${E.signed(pu.total - best.total)}</div></div></a>
    </div>
    <div class="bar-spacer"></div>
  </div>
  <div class="bottombar" style="padding:12px 20px 34px;border-top:1px solid var(--line)">
    <div class="row g6 small muted">${I("info", "s")}Totals include menu markup, fees and tax. Tip not included.</div>
    <div class="row g10" style="margin-top:12px"><a href="#/checkout" class="btn ink" style="flex:1;height:54px;font-size:17px" data-cta>Order on ${FP.APPS[pick].name} · ${$(qs.find((q) => q.app === pick).total)}</a><a href="#/history" class="iconbtn" style="width:54px;height:54px;border-radius:14px;background:var(--hl)" aria-label="Price watch">${I("bell")}</a></div>
  </div>
</div>`;
    return { html, title: "Compare · Fairplate", mount(root) { FP.check(root, st.restId + JSON.stringify(items), 0); FP.ago(root); } };
  };

  /* ---------------- fees ---------------- */
  V.fees = (p, app) => {
    const st = S(), r = E.rest(st.restId), items = st.basket;
    if (!Object.keys(items).length || !FP.APPS[app]) return V.emptyApp("Nothing to break down yet", "Add something from a menu first.");
    const tip = st.tip, q = E.quote(r.id, items, app, { tip }), qs = E.all(r.id, items, { tip }), best = qs[0];
    const markup$ = q.menu - q.store, biggest = markup$ >= q.service && markup$ >= q.delivery ? "menu" : q.service >= q.delivery ? "service" : "delivery";
    const call = { menu: `<b>The menu markup is the biggest extra cost here, not the delivery fee.</b> ${FP.APPS[app].name}'s menu is ${$(markup$)} higher than the restaurant's own prices.`,
      service: `<b>The service fee is the biggest extra cost here.</b> It grows with your basket: ${Math.round(FP.APPS[app].service * 100)}% of the menu total.`,
      delivery: `<b>The delivery fee is the biggest extra cost here.</b> Bigger baskets spread it out.` }[biggest];
    const tips = [2, 3, 4];
    const html = `<div class="pg app">
  ${status()}
  <div class="pad row g8" style="margin-top:4px"><a href="#/compare" class="pill" style="height:34px">${I("left", "s")}Compare</a></div>
  <div class="pad" style="margin-top:18px"><div class="row g10">${badge(app)}<div><div class="h2" style="font-size:22px">${FP.APPS[app].name}, line by line</div><div class="small muted">Why this order costs ${$(q.total - q.tip)}</div></div></div></div>
  <div class="pad" style="margin-top:20px">
    <b style="font-size:16px">Driver tip</b>
    <div class="seg" style="margin-top:10px;width:100%;padding:4px">${tips.map((t) => `<span data-a="tip" data-v="${t}" role="button" tabindex="0" class="${tip === t ? "on" : ""}" style="flex:1;justify-content:center">$${t}</span>`).join("")}<span data-a="tip" data-v="custom" role="button" tabindex="0" class="${tips.includes(tip) ? "" : "on"}" style="flex:1;justify-content:center">${tips.includes(tip) ? "Custom" : "$" + tip}</span></div>
    <div class="tiny muted" style="margin-top:6px">Same on every app, so it doesn't change the ranking.</div>
  </div>
  <div class="pad col" style="margin-top:18px;gap:12px" data-stagger>
    <div class="row"><span class="row g4">Menu prices${I("info", "s muted")}</span><span class="sp"></span><span class="chip warn" style="height:22px;margin-right:8px">${E.pct(q.markup)}</span><span class="num">${$(q.menu)}</span></div>
    <div class="row"><span class="row g4">Delivery${I("info", "s muted")}</span><span class="sp"></span>${FP.APPS[app].pass ? `<a href="#/membership" class="chip soft" style="height:22px;margin-right:8px">$0 with ${FP.APPS[app].pass.name}</a>` : ""}<span class="num">${$(q.delivery)}</span></div>
    <div class="row"><span class="row g4">Service fee${I("info", "s muted")}</span><span class="sp"></span><span class="num">${$(q.service)}</span></div>
  </div>
  <div class="pad" style="margin-top:14px"><div class="fade-in" style="background:var(--hl-soft);border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.45;animation-delay:.3s">${call}</div></div>
  <div class="pad col" style="margin-top:14px;gap:12px">
    <div class="row"><span>Tax (HST 13%)</span><span class="sp"></span><span class="num">${$(q.tax)}</span></div>
    <div class="row"><span>Driver tip</span><span class="sp"></span><span class="num" data-count="${q.tip}">${$(q.tip)}</span></div>
    <div class="row" style="font-size:18px;font-weight:700"><span>Order total</span><span class="sp"></span><span class="num" data-count="${q.total}">${$(q.total)}</span></div>
  </div>
  <div class="pad" style="margin-top:14px">${best.app === app
      ? `<div class="row g10" style="border:2px solid var(--save);background:var(--save-soft);border-radius:12px;padding:12px 14px"><span class="check on">${I("check", "s", "width:14px;height:14px")}</span><span style="flex:1;font-weight:500">${FP.APPS[app].name} is already the cheapest</span></div>`
      : `<button data-a="switch" data-app="${best.app}" class="row g10" style="width:100%;text-align:left;border:2px dashed var(--save);background:var(--save-soft);border-radius:12px;padding:12px 14px"><span class="check" style="border-color:var(--save);background:#fff"></span><span style="flex:1;font-weight:500">Switch to <b>${FP.APPS[best.app].name}</b> and pay</span><b class="save num" style="font-size:17px" data-count="${best.total}">${$(best.total)}</b></button>`}</div>
  <div class="bar-spacer"></div>
  <div class="bottombar pad" style="padding-bottom:34px;background:transparent"><a href="#/compare" class="btn ink full" style="height:52px">See all 3 apps</a></div>
  <div class="homebar"></div>
</div>`;
    return { html, title: FP.APPS[app].name + " fees · Fairplate", mount(root) { stagger(root); segs(root); } };
  };

  /* ---------------- checkout ---------------- */
  V.checkoutApp = () => {
    const st = S(), r = E.rest(st.restId), items = st.basket;
    if (!Object.keys(items).length) return V.emptyApp("Nothing to review yet", "Add something from a menu first.");
    const tip = st.tip, qs = E.all(r.id, items, { tip }), pick = st.choice && qs.find((q) => q.app === st.choice) ? st.choice : qs[0].app;
    const q = qs.find((x) => x.app === pick), worst = qs[qs.length - 1], best = qs[0];
    const save = pick === best.app ? `<div class="row g8" style="margin-top:12px;background:var(--save-soft);border-radius:10px;padding:8px 12px;color:var(--save);font-weight:600;font-size:14px">${I("tag", "s")}You save <span data-count="${worst.total - q.total}">${$(worst.total - q.total)}</span>&nbsp;compared with ${FP.APPS[worst.app].name}</div>`
      : `<div class="row g8" style="margin-top:12px;background:var(--warn-soft);border-radius:10px;padding:8px 12px;color:var(--warn);font-weight:600;font-size:14px">${I("info", "s")}${$(q.total - best.total)} more than ${FP.APPS[best.app].name}</div>`;
    const html = `<div class="pg app">
  ${status()}
  <div class="row g12 pad" style="margin-top:6px"><a ${back()} class="iconbtn" style="border-radius:12px;background:var(--paper);border:1.5px solid var(--line)" aria-label="Back">${I("back")}</a><b style="font-size:17px">Review</b></div>
  <div class="pad" style="margin-top:22px"><div class="row g6"><b style="font-size:18px">Tip your driver</b>${I("info", "s muted")}</div><div class="small muted" style="margin-top:2px">Drivers keep 100% of tips on all three apps</div>
    <div class="row g8" style="margin-top:14px">${[2, 3, 4, 5, 6].map((t) => `<button data-a="tip" data-v="${t}" class="card" style="flex:1;height:64px;display:grid;place-items:center;text-align:center;${tip === t ? "border:2px solid var(--ink)" : "background:var(--soft);border:0"}"><b>$${t}</b></button>`).join("")}</div>
  </div>
  <div class="thick" style="margin-top:22px"></div>
  <div class="pad" style="margin-top:18px"><b style="font-size:18px">Payment summary · ${FP.APPS[pick].name}</b>
    <div class="col g12" style="margin-top:14px">
      <div class="row"><span>Menu (incl. ${E.pct(q.markup)} markup)</span><span class="sp"></span><span class="num">${$(q.menu)}</span></div>
      <div class="row"><span class="row g4">Delivery fee${I("info", "s muted")}</span><span class="sp"></span><span class="num">${$(q.delivery)}</span></div>
      <div class="row"><span class="row g4">Service fee${I("info", "s muted")}</span><span class="sp"></span><span class="num">${$(q.service)}</span></div>
      <div class="row"><span>Tax</span><span class="sp"></span><span class="num">${$(q.tax)}</span></div>
      <div class="row"><span>Tip</span><span class="sp"></span><span class="num" data-count="${q.tip}">${$(q.tip)}</span></div>
      <div class="hr"></div>
      <div class="row" style="font-weight:700;font-size:17px"><span>Order total</span><span class="sp"></span><span class="num" data-count="${q.total}">${$(q.total)}</span></div>
    </div>
    ${save}
  </div>
  <div class="thick" style="margin-top:18px"></div>
  <a href="#/address" class="row g12 pad" style="height:66px">${I("pin")}<div style="flex:1"><div class="tiny muted">Deliver to</div><b>${esc(st.addr)}</b></div>${I("right", "s")}</a>
  <div class="bar-spacer"></div>
  <div class="bottombar row g10 pad" style="padding-top:10px;padding-bottom:34px"><div class="col" style="flex:1"><span class="tiny muted">Pay in ${FP.APPS[pick].name}</span><b class="num" style="font-size:20px" data-count="${q.total}">${$(q.total)}</b></div><button data-a="open" data-app="${pick}" class="btn ink" style="height:54px;width:190px">Open ${FP.APPS[pick].name}${I("ext", "s")}</button></div>
  <div class="homebar"></div>
</div>`;
    return { html, title: "Review · Fairplate", mount() {} };
  };

  /* ---------------- price history ---------------- */
  FP.historyBlock = (web = false) => {
    const st = S(), range = st.range || "1 month", h = FP.HISTORY[range], pts = h.points, now = pts[pts.length - 1];
    const prev = pts.slice(0, -1), lo = Math.floor(Math.min(...prev)), hi = Math.ceil(Math.max(...prev));
    const usualLo = Math.floor(Math.min(...prev)), usualHi = Math.ceil(Math.max(...prev));   // "normal" = the range of every past check
    const good = now < usualLo;
    const W = web ? 700 : 390, X0 = 56, X1 = W - 22, Y0 = 20, Y1 = 210, yMin = Math.min(44, Math.floor(Math.min(...pts)) - 1), yMax = Math.max(56, Math.ceil(Math.max(...pts)) + 1);
    const x = (i) => X0 + (i * (X1 - X0)) / (pts.length - 1), y = (v) => Y0 + ((yMax - v) * (Y1 - Y0 - 20)) / (yMax - yMin);
    const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const ticks = [0, 1, 2, 3].map((i) => Math.round(yMax - (i * (yMax - yMin)) / 3));
    const bar = Math.max(4, Math.min(96, ((now - 44) / (56 - 44)) * 100));
    return `<div data-history>
    <div class="h1" style="font-size:26px">${good ? "Good time to order" : "About normal tonight"}</div>
    <div class="tiny muted" style="margin-top:4px">Your usual: 2 × Smash Combo + Fries, Queen St Burger Co.</div>
    <p style="margin-top:10px;line-height:1.5">Tonight <b>${$(now)}</b> on Skip. That's <b>${good ? "lower than usual" : "within the usual range"}</b>. This order is normally $${usualLo} to $${usualHi}.</p>
    <button data-a="watch" class="row g6" style="margin-top:8px;font-weight:600;color:var(--save)">${I(st.watch ? "check" : "bell", "s")}${st.watch ? "We'll tell you when it drops" : "Tell me when it drops"}</button>
    <div style="margin-top:26px"><div class="small muted">Tonight</div><b class="num" style="font-size:20px" data-count="${now}">${$(now)}</b>
      <div style="position:relative;margin-top:10px;height:14px;border-radius:7px;background:linear-gradient(90deg,var(--save-soft) 0 22%,var(--soft) 22% 70%,#F6D6D2 70%)"><span class="marker" data-marker="${bar}" style="position:absolute;left:0%;top:-4px;width:6px;height:22px;border-radius:3px;background:var(--ink)"></span></div>
      <div class="row tiny muted num" style="margin-top:6px"><span>$44</span><span class="sp"></span><span>$56</span></div></div>
    <div class="chart" style="margin-top:22px;position:relative;height:230px${web ? "" : ";margin-left:-20px;margin-right:-20px"}">
      <svg viewBox="0 0 ${W} 230" style="position:absolute;inset:0;width:100%;height:230px" preserveAspectRatio="none" aria-label="Price over time">
        <g stroke="#E8E6E1" stroke-width="1">${[20, 70, 120, 170, 210].map((yy) => `<line x1="56" y1="${yy}" x2="${W - 20}" y2="${yy}"/>`).join("")}</g>
        <g fill="#6B6E76" font-size="12" font-family="InterL, Inter, sans-serif">${ticks.map((t, i) => `<text x="20" y="${[24, 74, 124, 174][i]}">$${t}</text>`).join("")}</g>
        <path class="area" d="${d} L${x(pts.length - 1).toFixed(1)} 210 L${X0} 210 Z" fill="#FFF4C7"/>
        <path class="line" d="${d}" fill="none" stroke="#0E0F12" stroke-width="2.5" stroke-linejoin="round"/>
        <circle class="dot" cx="${x(pts.length - 1).toFixed(1)}" cy="${y(now).toFixed(1)}" r="5.5" fill="#FFD43B" stroke="#0E0F12" stroke-width="2"/>
      </svg>
    </div>
    <div class="row tiny muted" style="padding-left:${web ? 56 : 36}px;padding-right:${web ? 22 : 2}px">${h.labels.map((l, i) => `${i ? '<span class="sp"></span>' : ""}<span>${l}</span>`).join("")}</div>
    <div class="row g8" style="justify-content:center;margin-top:20px">${Object.keys(FP.HISTORY).map((k) => `<button data-a="range" data-v="${k}" class="pill${k === range ? " on" : " out"}">${k}</button>`).join("")}</div>
  </div>`;
  };
  FP.mountHistory = (root) => {
    const box = root.querySelector("[data-history]");
    if (!box) return;
    const line = box.querySelector(".line");
    if (line) line.style.setProperty("--len", Math.ceil(line.getTotalLength()) + 1);
    const m = box.querySelector("[data-marker]");
    if (m) requestAnimationFrame(() => requestAnimationFrame(() => (m.style.left = m.dataset.marker + "%")));
    counts(box, true);
  };
  V.history = () => {
    const html = `<div class="pg app">
  ${status()}
  <div class="row pad" style="margin-top:6px"><a ${back()} aria-label="Back">${I("back", "l")}</a><span class="sp"></span><span style="margin-right:14px">${I("heart", "l")}</span><button data-a="share" aria-label="Share">${I("share", "l")}</button></div>
  <div class="pad" style="margin-top:26px">${FP.historyBlock(false)}</div>
  <div class="tab-spacer"></div>
  ${tabbar("Price watch")}
</div>`;
    return { html, title: "Price watch · Fairplate", mount(root) { FP.mountHistory(root); } };
  };

  /* ---------------- membership ---------------- */
  V.membership = () => {
    const m = FP.MEMBERSHIP, saves = FP.engine.r2(m.ddFees - m.ddFeesWithPass - m.passPrice), plan = S().plan || "dd";
    const opt = (k, title, sub, subCls, extra = "") => `<button data-a="plan" data-v="${k}" class="row g12" style="width:100%;text-align:left;border:${plan === k ? "2px solid var(--ink)" : "1.5px solid var(--line)"};border-radius:14px;padding:12px 14px">${plan === k ? `<span class="tick k pop">${I("check", "s", "width:14px;height:14px")}</span>` : `<span class="radio"></span>`}<div style="flex:1"><b>${title}</b><div class="tiny ${subCls}" style="font-weight:600">${sub}</div>${extra}</div></button>`;
    const html = `<div class="pg app">
  <div style="height:250px;background:linear-gradient(180deg,#FFE27A,#FFF4C7);position:relative">
    ${status()}
    <a ${back()} class="iconbtn w" style="position:absolute;left:20px;top:54px" aria-label="Back">${I("back")}</a>
    <div style="position:absolute;left:0;right:0;top:92px;text-align:center">
      <div class="small" style="font-weight:600">Your last 30 days</div>
      <div class="num" style="font-size:58px;font-weight:700;line-height:1.1;margin-top:4px;letter-spacing:-.03em" data-count="${saves}" data-fmt="plus">+${$(saves)}</div>
      <div class="small muted" style="margin-top:4px">what DashPass would have saved you</div>
    </div>
  </div>
  <div class="pad" style="margin-top:22px;text-align:center">
    <div class="h1" style="font-size:25px">Is a membership worth it?</div>
    <p class="muted" style="margin-top:8px;font-size:14.5px;line-height:1.45">Based on the ${m.orders} orders you checked with Fairplate in ${m.month}.</p>
  </div>
  <div class="pad" style="margin-top:18px"><div class="card fade-in" style="padding:14px 16px"><div class="row small"><span>Fees you paid on DoorDash</span><span class="sp"></span><span class="num">${$(m.ddFees)}</span></div><div class="row small" style="margin-top:8px"><span>Same orders with DashPass</span><span class="sp"></span><span class="num">${$(m.ddFeesWithPass)}</span></div><div class="row small" style="margin-top:8px"><span>DashPass price</span><span class="sp"></span><span class="num">${$(m.passPrice)}</span></div></div></div>
  <div class="pad" style="margin-top:18px"><b style="font-size:17px;display:block;text-align:center">Pick one to check</b>
    <div class="col g10" style="margin-top:12px" data-stagger>
      ${opt("dd", "DashPass · $9.99/mo", `Worth it for you: saves ${$(saves)}`, "save")}
      ${opt("ue", "Uber One · $9.99/mo", `Not worth it yet: costs you ${$(m.ueCost)}`, "warn", `<div class="tiny muted">You order on Uber Eats less often</div>`)}
    </div>
  </div>
  <div class="bar-spacer"></div>
  <div class="bottombar pad" style="padding-bottom:34px;background:transparent"><button data-a="open" data-app="${plan}" class="btn ink full" style="height:52px">${plan === "dd" ? "Open DashPass in DoorDash" : "Open Uber One in Uber Eats"}</button></div>
  <div class="homebar"></div>
</div>`;
    return { html, title: "Membership check · Fairplate", mount(root) { stagger(root); counts(root, true); } };
  };

  /* ---------------- address ---------------- */
  V.address = () => {
    const html = `<div class="pg app">
  ${status()}
  <div class="pad" style="margin-top:6px"><a ${back()} class="iconbtn" aria-label="Back">${I("back")}</a></div>
  <div class="pad" style="margin-top:22px"><div class="h1" style="font-size:32px">Where should we check?</div><p class="muted" style="margin-top:6px">Prices and fees change with your address.</p></div>
  <div class="pad" style="margin-top:22px"><label style="display:block;border:2px solid var(--ink);border-radius:12px;padding:8px 14px"><div class="tiny muted">Address</div><input data-live="addr" value="100 Queen" aria-label="Address" style="width:100%;font-size:17px;font-weight:500;height:24px" autocomplete="off"></label></div>
  <div class="pad col" style="margin-top:10px">
    <button data-a="geo" class="row g12" style="height:62px;width:100%">${I("loc")}<b>Use current location</b></button>
    <div data-addr-list>${FP.addrList("100 Queen")}</div>
  </div>
  <div class="bar-spacer"></div>
  <div class="bottombar pad" style="padding-bottom:34px;background:transparent"><button data-a="saveaddr" data-save class="btn full" style="height:52px;background:var(--hl-soft);color:#B8A36A;pointer-events:none">Save address</button></div>
  <div class="homebar"></div>
</div>`;
    return { html, title: "Address · Fairplate", mount() {} };
  };
  FP.addrList = (q, pick) => {
    const list = FP.ADDRESSES.filter(([a]) => a.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 4);
    return list.map(([a, c]) => `<div class="hr"></div><button data-a="addrpick" data-v="${esc(a)}" data-c="${esc(c)}" class="row g12 row-link" style="height:66px;width:100%;text-align:left${pick === a ? ";background:var(--hl-soft)" : ""}">${I(pick === a ? "check" : "pin")}<div><b>${esc(a)}</b><div class="small muted">${esc(c)}</div></div></button>`).join("") || `<div class="hr"></div><div class="small muted" style="padding:18px 0">No match. Try “100 Queen”.</div>`;
  };

  V.emptyApp = (t, s) => ({ title: "Fairplate", html: `<div class="pg app">${status()}<div class="pad" style="margin-top:6px"><a href="#/" data-a="back" aria-label="Back">${I("back", "l")}</a></div><div class="col pad" style="align-items:center;text-align:center;padding-top:160px"><div class="h1" style="font-size:24px">${t}</div><p class="muted" style="margin-top:8px">${s}</p><a href="#/" class="btn ink" style="margin-top:24px">Browse restaurants</a></div>${tabbar("Home")}</div>` });
})();
