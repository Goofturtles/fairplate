/* Desktop pages (1:1 with design s01/s02/s03/s20, s05, s09, s12, s16). */
(function () {
  const { I, badge, esc, $, img, pcs, counts, stagger, reveals, segs } = FP.ui;
  const E = FP.engine, S = () => FP.S, V = (FP.views = FP.views || {});
  const DEMO = { rest: "qsb", items: { smash: 2, fries: 1 } };

  const logo = (white) => `<a href="#/" class="logo${white ? " w" : ""}"><span class="mark"></span>fairplate</a>`;

  /* ---------------- landing ---------------- */
  V.landing = () => {
    const qs = E.all(DEMO.rest, DEMO.items);
    const rows = qs.map((q, i) => i === 0
      ? `<div class="row g10 chk" style="background:var(--hl-soft);border-radius:10px;padding:8px 10px">${badge(q.app, true)}<b>${FP.APPS[q.app].name}</b><span class="chip hl later" style="height:22px">Cheapest</span><span class="sp"></span><span class="skel"></span><b class="num val" data-count="${q.total}">${$(q.total)}</b></div>`
      : `<div class="row g10 chk" style="padding:4px 10px">${badge(q.app, true)}${FP.APPS[q.app].name}<span class="sp"></span><span class="skel"></span><span class="num val" data-count="${q.total}">${$(q.total)}</span></div>`).join("");
    const tick = (on) => on === true ? `<span class="tick y">${I("check", "s", "width:14px;height:14px")}</span>` : `<span class="tick n">${I("x", "s", "width:12px;height:12px")}</span>`;
    const vsRow = (label, a, b) => `<div class="row reveal" style="height:52px;padding:0 16px;border-bottom:1px solid var(--line)"><span style="flex:1">${label}</span><span style="width:230px;display:flex;justify-content:center">${a === true ? tick(true) : `<b class="small">${a}</b>`}</span><span style="width:230px;display:flex;justify-content:center">${b === false ? tick(false) : `<span class="small muted">${b}</span>`}</span></div>`;
    const html = `<div class="pg webp">
<section style="position:relative;height:900px;background:#0b0b0c;color:#fff;overflow:hidden">
  <img class="hero-img" src="${img("hero-dark")}" alt="Smash burger with fries" style="position:absolute;right:-80px;top:0;width:1100px;height:900px;object-position:40% 50%">
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,#0b0b0c 30%,rgba(11,11,12,.75) 52%,rgba(11,11,12,0) 75%)"></div>
  <div class="wtop hero-in" style="position:relative;border:0">
    ${logo(true)}
    <div class="row g24" style="margin-left:40px;font-weight:500;color:rgba(255,255,255,.8)"><button data-a="scroll" data-to="how">How it works</button><a href="#/history">Price watch</a><button data-a="scroll" data-to="vs">For restaurants</button></div>
    <div class="sp"></div>
    <button data-a="toast" data-msg="Accounts come later. Everything works without one." style="font-weight:600">Sign in</button>
    <button data-a="scroll" data-to="vs" class="btn hl sm">Get the extension</button>
  </div>
  <div style="position:relative;padding:160px 0 0 80px;width:900px">
    <div class="chip hl hero-in" style="margin-bottom:22px;--d:.1s">Uber Eats · DoorDash · Skip, side by side</div>
    <h1 style="font-size:62px;line-height:1.1;font-weight:700;letter-spacing:-.035em"><span class="hero-line"><span style="--d:.15s">Same burger.</span></span><span class="hero-line"><span style="--d:.27s">Three different prices.</span></span></h1>
    <p class="hero-in" style="--d:.4s;margin-top:22px;font-size:19px;line-height:1.5;color:rgba(255,255,255,.72);width:540px">Fairplate checks every delivery app and shows the real total, with menu markup, fees and tax included, before you order.</p>
    <form class="row hero-in" data-f="hero" style="--d:.5s;margin-top:36px;background:#fff;border-radius:14px;padding:6px;width:640px;color:var(--ink)">
      <label class="row g10" style="flex:1;padding:0 12px">${I("pin")}<input name="addr" aria-label="Delivery address" placeholder="Enter delivery address" autocomplete="street-address" style="font-size:16px;width:100%;height:44px"></label>
      <div class="row g8" style="padding:0 14px;height:44px;border-left:1px solid var(--line);font-weight:500">${I("clock", "s")}Now${I("down", "s")}</div>
      <button class="btn ink" style="height:48px">Compare prices</button>
    </form>
  </div>
  <div class="card hero-card" data-check="hero" style="position:absolute;right:70px;bottom:70px;width:340px;padding:18px;color:var(--ink);border:0;box-shadow:0 20px 60px rgba(0,0,0,.45)">
    <div class="row"><div><div class="h3">2 × Smash Burger Combo</div><div class="small muted">Queen St Burger Co. · <span data-banner>checked just now</span></div></div></div>
    <div class="col g8" style="margin-top:14px">${rows}</div>
  </div>
</section>

<section style="height:440px;background:var(--paper)">
  <div class="col reveal" style="align-items:center;padding-top:90px">
    <h2 style="font-size:46px;line-height:1.15;font-weight:700">What are you craving tonight?</h2>
    <p class="muted" style="margin-top:12px;font-size:18px">We'll find the app where it costs the least, all-in.</p>
    <form data-f="crave" class="row" style="margin-top:34px;width:640px;height:64px;border-radius:99px;border:1.5px solid var(--line);box-shadow:0 6px 24px rgba(0,0,0,.07);padding:0 8px 0 28px">
      <input name="q" aria-label="Search food" placeholder="Try “pad thai” or “Nonna's Slice”" style="flex:1;font-size:17px;height:60px">
      <button aria-label="Search" style="width:48px;height:48px;border-radius:50%;background:var(--hl);display:grid;place-items:center">${I("search")}</button>
    </form>
    <div class="row g8" style="margin-top:22px">${["Burgers", "Pizza", "Sushi", "Pad thai", "Poutine", "Under $20 all-in"].map((c) => `<a class="pill out" href="#/feed?q=${encodeURIComponent(c === "Under $20 all-in" ? "" : c)}${c === "Under $20 all-in" ? "&under20=1" : ""}">${c}</a>`).join("")}</div>
  </div>
</section>

<section id="how" style="height:780px;background:var(--paper)">
  <h2 class="reveal" style="text-align:center;font-size:44px;line-height:1.15;font-weight:700;padding-top:80px">How it works</h2>
  <div class="row g24" style="justify-content:center;margin-top:48px;align-items:stretch">
    <div class="reveal lift" style="--rd:0ms;width:380px;border-radius:20px;overflow:hidden;background:linear-gradient(170deg,#FFF1B8,#FFE07A)">
      <div style="height:360px;position:relative">
        <div class="card" style="position:absolute;left:36px;right:36px;top:48px;padding:16px;border:0;box-shadow:0 14px 40px rgba(120,90,0,.2)">
          <div class="search" style="height:42px">${I("search", "s")}<span style="color:var(--ink)">smash burger</span></div>
          <div class="row g10" style="margin-top:12px"><img src="${img("burger")}" alt="" style="width:56px;height:56px;border-radius:10px"><div><b>Queen St Burger Co.</b><div class="small muted">2 × Smash Combo</div></div></div>
        </div>
        <div class="row g8" style="position:absolute;left:36px;top:224px"><span class="pill" style="background:#fff">${I("pin", "s")}100 Queen St W</span><span class="pill" style="background:#fff">${I("clock", "s")}Tonight</span></div>
        <div class="row g8" style="position:absolute;left:36px;top:272px"><span class="pill" style="background:rgba(255,255,255,.55)">+ Fries</span><span class="pill" style="background:rgba(255,255,255,.55)">+ Shake</span></div>
      </div>
      <div style="padding:22px 26px 26px"><div class="small" style="font-weight:600">01</div><div style="font-size:20px;font-weight:600;line-height:1.3;margin-top:4px">Tell us what you're craving</div></div>
    </div>
    <div class="reveal lift" style="--rd:120ms;width:380px;border-radius:20px;overflow:hidden;background:linear-gradient(170deg,#E3F4E9,#BFE6CC)">
      <div style="height:360px;position:relative">
        <div class="col g10" style="position:absolute;left:36px;right:36px;top:52px">${qs.map((q, i) => `<div class="row g10 card" style="padding:12px;border:0${i ? `;opacity:${i === 1 ? .9 : .8}` : ""}">${badge(q.app)}<div><b>${FP.APPS[q.app].name}</b><div class="small muted">${q.eta} min</div></div><span class="sp"></span><b class="num">${$(q.total)}</b></div>`).join("")}</div>
      </div>
      <div style="padding:22px 26px 26px"><div class="small" style="font-weight:600">02</div><div style="font-size:20px;font-weight:600;line-height:1.3;margin-top:4px">We check every app's real total</div></div>
    </div>
    <div class="reveal lift" style="--rd:240ms;width:380px;border-radius:20px;overflow:hidden;background:linear-gradient(170deg,#2B2D33,#0E0F12);color:#fff">
      <div style="height:360px;position:relative">
        <div style="position:absolute;left:36px;right:36px;top:70px;text-align:center">
          <div class="chip save" style="height:30px;font-size:14px">You save ${$(qs[2].total - qs[0].total)}</div>
          <div style="font-size:54px;font-weight:700;line-height:1.1;margin-top:18px" class="num">${$(qs[0].total)}</div>
          <div class="small" style="color:rgba(255,255,255,.6);margin-top:6px">all-in on ${FP.APPS[qs[0].app].name}, tax and fees included</div>
          <a href="#/compare" data-a="demo" class="btn hl" style="margin-top:26px;width:100%">Open ${FP.APPS[qs[0].app].name}${I("ext", "s")}</a>
        </div>
      </div>
      <div style="padding:22px 26px 26px"><div class="small" style="font-weight:600;color:rgba(255,255,255,.7)">03</div><div style="font-size:20px;font-weight:600;line-height:1.3;margin-top:4px">Order where it's cheapest</div></div>
    </div>
  </div>
</section>

<section id="vs" style="height:760px;background:var(--paper)">
  <div style="width:1000px;margin:0 auto;padding-top:70px">
    <div class="row reveal" style="align-items:flex-end;padding-bottom:22px">
      <div style="flex:1"><h2 style="font-size:40px;line-height:1.15;font-weight:700">Fairplate vs<br>one app at a time</h2></div>
      <div style="width:230px;padding:0 16px"><b style="font-size:16px">Fairplate</b><div class="small muted" style="margin:2px 0 12px">Free, every app</div><button data-a="toast" data-msg="The extension is next. This demo runs in the browser." class="btn hl sm full">Get the extension</button></div>
      <div style="width:230px;padding:0 16px"><b style="font-size:16px">One app at a time</b><div class="small muted" style="margin:2px 0 12px">What most people do</div><a href="#/feed" class="btn ghost sm full">Keep guessing</a></div>
    </div>
    <div class="reveal" style="background:var(--soft);border-radius:10px;padding:10px 16px;font-weight:600">Price</div>
    ${vsRow("See every app's total at once", true, false)}${vsRow("Menu markup shown", true, false)}${vsRow("Fees shown before checkout", true, "At checkout")}${vsRow("Pickup price next to delivery", true, false)}
    <div class="reveal" style="background:var(--soft);border-radius:10px;padding:10px 16px;font-weight:600;margin-top:18px">Over time</div>
    ${vsRow("Price history for your usual orders", true, false)}${vsRow("Tells you if a membership would pay off", true, "Not shown")}${vsRow("Sponsored results", "Never", "Yes")}
  </div>
</section>
<footer class="foot"><div class="wrap row">${logo()}<span class="sp"></span><span>Hackathon prototype · all prices are demo numbers · photos: TheMealDB, Pexels</span></div></footer>
</div>`;
    return { html, title: "Fairplate: every delivery app's real total", mount(root) { reveals(root); FP.check(root.querySelector("[data-check=hero]"), "hero", 1400); } };
  };

  /* ---------------- feed ---------------- */
  const cardQuotes = (r) => FP.APP_ORDER.map((k) => E.quote(r.id, r.typicalItems, k));
  function cardTag(r, qs) {
    const s = [...qs].sort((a, b) => a.total - b.total), gap = s[s.length - 1].total - s[0].total;
    if (r.flag === "dropped") return `<span class="chip ink tag">Price dropped</span>`;
    if (r.flag === "winner") return `<span class="chip soft tag">${FP.APPS[s[0].app].name} wins here</span>`;
    return `<span class="chip hl tag">Save up to ${$(gap)}</span>`;
  }
  const heart = (id, size = "s") => `<button class="heart${S().saved[id] ? " on" : ""}" data-a="save" data-id="${id}" aria-label="Save">${I("heart", size)}</button>`;
  const feedCard = (r) => {
    const qs = cardQuotes(r);
    return `<a href="#/r/${r.id}" class="lift" style="flex:1;display:block;border-radius:14px;min-width:0"><div class="zoom ph" style="position:relative"><img loading="lazy" src="${img(r.img)}" alt="${esc(r.name)}" style="width:100%;height:170px;view-transition-name:vt-${r.id}">${cardTag(r, qs)}</div><div class="row" style="margin-top:10px"><b style="font-size:16px">${esc(r.name)}</b><span class="sp"></span>${heart(r.id)}</div><div class="small muted" style="margin:2px 0 8px">${r.rating} ★ (${r.count}) · ${r.feedEta} min</div>${pcs(qs)}</a>`;
  };
  function feedFilter(p) {
    let list = FP.RESTAURANTS.slice();
    const q = (p.get("q") || "").trim().toLowerCase(), cat = p.get("cat");
    if (q) list = list.filter((r) => (r.name + " " + r.cuisine + " " + r.menu.map((m) => m.name).join(" ")).toLowerCase().includes(q.replace(/s$/, "")));
    if (cat) list = list.filter((r) => r.cat === cat || (cat === "dessert" && r.id === "qsb"));
    if (p.get("under20")) list = list.filter((r) => Math.min(...cardQuotes(r).map((x) => x.total)) < 20);
    if (p.get("u30")) list = list.filter((r) => r.feedEta < 30);
    if (p.get("top")) list = list.filter((r) => r.rating >= 4.7);
    const cheap = (r) => Math.min(...cardQuotes(r).map((x) => x.total));
    list.sort((a, b) => cheap(a) - cheap(b));
    return list;
  }
  V.feed = (p) => {
    const filtering = ["q", "cat", "under20", "u30", "top"].some((k) => p.get(k));
    const link = (k, v) => { const n = new URLSearchParams(p); n.get(k) ? n.delete(k) : n.set(k, v); return "#/feed?" + n.toString(); };
    const byId = (id) => FP.RESTAURANTS.find((r) => r.id === id);
    const cats = FP.CATEGORIES.map(([k, lab, im]) => `<a href="${link("cat", k)}" class="col g6" style="align-items:center${p.get("cat") && p.get("cat") !== k ? ";opacity:.45" : ""}"><img class="circle" src="${img(im)}" alt="" style="width:52px;height:52px">${`<span class="tiny" style="font-weight:500">${lab}</span>`}</a>`).join("");
    const pills = `<a class="pill on" href="#/feed">Cheapest total</a><a class="pill${p.get("u30") ? " on" : ""}" href="${link("u30", 1)}">Under 30 min</a><a class="pill${p.get("top") ? " on" : ""}" href="${link("top", 1)}">Best overall</a><span class="pill">Rating${I("down", "s")}</span><a class="pill${p.get("under20") ? " on" : ""}" href="${link("under20", 1)}">Price${I("down", "s")}</a><span class="pill">Dietary${I("down", "s")}</span><span class="pill">Apps${I("down", "s")}</span>`;
    const results = filtering ? feedFilter(p) : [];
    const body = filtering
      ? `<div class="row" style="padding:30px 40px 0"><span class="h2">${results.length} result${results.length === 1 ? "" : "s"}${p.get("q") ? ` for “${esc(p.get("q"))}”` : ""}</span><span class="sp"></span><a class="pill" href="#/feed">Reset</a></div>
         <div data-stagger style="display:grid;grid-template-columns:repeat(4,1fr);gap:28px 20px;padding:14px 40px 60px">${results.map(feedCard).join("") || `<p class="muted">Nothing yet. Try “burger” or “pizza”.</p>`}</div>`
      : `<div class="row" style="padding:30px 40px 0;align-items:flex-start">
    <div style="flex:1"><h1 style="font-size:40px;line-height:1.15;font-weight:700">Crave it? Compare it.</h1><p class="muted" style="margin-top:8px;font-size:16px">Every price below is the all-in total for a typical order.</p></div>
    <a href="#/r/kinthai" class="row lift" style="width:430px;height:120px;border-radius:16px;background:var(--hl);overflow:hidden">
      <div style="padding:16px 18px;flex:1"><div class="chip ink" style="height:22px;font-size:11.5px">Price watch</div><div style="font-weight:600;margin-top:8px;line-height:1.35">Pad thai at Kin Thai dropped to <b>${$(E.quote("kinthai", byId("kinthai").typicalItems, "sk").total)}</b> on Skip</div></div>
      <div class="zoom" style="width:120px;height:120px"><img src="${img("padthai")}" alt="" style="width:120px;height:120px"></div>
    </a>
  </div>
  <div class="row" style="padding:28px 40px 0"><span class="h2">Featured near you</span><span class="sp"></span><a class="small" style="font-weight:600" href="#/feed?q=">See all</a></div>
  <div class="row g20" data-stagger style="padding:14px 40px 0;align-items:flex-start">${["nonnas", "kinthai", "qsb", "sakura"].map((id) => feedCard(byId(id))).join("")}</div>
  <div class="row" style="padding:30px 40px 0"><span class="h2">Biggest price gaps tonight</span></div>
  <div class="row g20" data-stagger style="padding:14px 40px 60px;align-items:flex-start">${["birdbox", "pitalane", "mamalin", "saffron"].map((id) => feedCard(byId(id))).join("")}</div>`;
    const html = `<div class="pg webp">
  <header class="wtop">
    <button data-a="toast" data-msg="Menu: Saved, Price watch and Settings live in the app." aria-label="Menu">${I("menu", "l")}</button>
    ${logo()}
    <div class="seg" data-a="mode"><span class="${S().mode === "delivery" ? "on" : ""}" data-v="delivery">Delivery</span><span class="${S().mode === "pickup" ? "on" : ""}" data-v="pickup">Pickup</span></div>
    <a href="#/" class="row g6" style="font-weight:600">${I("pin", "s")}${esc(S().addr)} · Now${I("down", "s")}</a>
    <form data-f="feedsearch" class="search" style="flex:1;height:44px;border-radius:99px">${I("search", "s")}<input name="q" value="${esc(p.get("q") || "")}" aria-label="Search" placeholder="Search restaurants or dishes" style="flex:1;height:40px"></form>
    <a class="iconbtn" href="#/history" aria-label="Price watch">${I("bell")}</a>
  </header>
  <div class="row g24" data-stagger style="padding:20px 40px 0">${cats}</div>
  <div class="row g8" style="padding:18px 40px 0">${pills}</div>
  ${body}
</div>`;
    return { html, title: "Restaurants near you · Fairplate", mount(root) { stagger(root); segs(root); } };
  };

  /* ---------------- restaurant menu ---------------- */
  V.restaurantWeb = (p, id) => {
    const r = E.rest(id) || E.rest("qsb"), b = S().restId === r.id ? S().basket : {};
    const count = Object.values(b).reduce((a, c) => a + c, 0);
    const f = p.get("f") || "best";
    let items = r.menu.filter((m) => f === "best" ? m.best : f === "under10" ? m.store < 10 : f === "markup" ? true : m.cat === f);
    if (f === "markup") items.sort((a, c) => Math.max(c.ue, c.dd, c.sk) / c.store - Math.max(a.ue, a.dd, a.sk) / a.store);
    const now = new Date(), stamp = document.body.classList.contains("still") ? "7:42 PM" : now.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?([ap])\.?m\.?/i, (m, a) => " " + a.toUpperCase() + "M");
    const chip = (k, lab) => `<a class="pill${f === k ? " on" : ""}" href="#/r/${r.id}?f=${k}">${lab}</a>`;
    const card = (m) => {
      const q = b[m.id] || 0, chips = m.chips || ["store", "sk", "dd"];
      const prices = { store: m.store, sk: m.sk, dd: m.dd, ue: m.ue }, best = FP.APP_ORDER.reduce((a, k) => (m[k] < m[a] ? k : a), "sk");
      const pc = chips.map((k) => `<span${k === best ? ' class="best"' : ""}>${k === "store" ? "In store" : FP.APPS[k].short} ${$(prices[k])}</span>`).join("");
      const tag = m.tag ? `<span class="chip ${m.tag[0]} tag">${m.tag[1]}</span>` : "";
      const ctl = q ? `<div class="row" style="margin-top:14px;height:40px;border-radius:10px;background:var(--ink);color:#fff;padding:0 12px"><button data-a="qty" data-r="${r.id}" data-id="${m.id}" data-d="-1" aria-label="Remove one">${I("minus", "s")}</button><span class="sp" style="text-align:center;font-weight:600;font-size:13.5px">${q} in basket</span><button data-a="qty" data-r="${r.id}" data-id="${m.id}" data-d="1" aria-label="Add one">${I("plus", "s")}</button></div>`
        : `<div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn ghost sm" data-a="qty" data-r="${r.id}" data-id="${m.id}" data-d="1">Add</button></div>`;
      return `<div class="card lift" style="overflow:hidden${q ? ";border-width:2px;border-color:var(--ink)" : ""}"><div class="zoom" style="position:relative"><img loading="lazy" src="${img(m.img)}" alt="${esc(m.name)}" style="width:100%;height:190px">${tag}</div><div style="padding:14px 16px 16px"><b style="font-size:17px">${esc(m.name)}</b><div class="small muted" style="margin-top:2px">${esc(m.desc)} · ${m.cal} cal</div><div class="pcs" style="margin-top:10px">${pc}</div>${ctl}</div></div>`;
    };
    const html = `<div class="pg webp">
  <header class="wtop">
    <a href="#/feed" aria-label="Close">${I("x", "l")}</a>
    <b style="font-size:18px;view-transition-name:vt-title">${esc(r.name)}</b><span class="muted">Menu · prices checked ${stamp}</span>
    <span class="sp"></span>
    <a href="#/compare" class="iconbtn" style="position:relative" aria-label="Basket">${I("bag")}<span data-bag style="position:absolute;top:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:var(--hl);font-size:11px;font-weight:700;display:${count ? "grid" : "none"};place-items:center">${count}</span></a>
    <a href="#/compare" class="btn ink sm${count ? "" : " disabled"}">Compare basket</a>
  </header>
  <div class="row g8" style="padding:18px 40px">
    <span class="pill out">${I("sliders", "s")}Sort &amp; filter</span>${chip("best", "Best sellers")}${chip("burgers", "Burgers")}${chip("sides", "Sides")}${chip("salads", "Salads")}${chip("desserts", "Desserts")}${chip("under10", "Under $10")}${chip("markup", "Biggest markup")}
  </div>
  <div data-grid data-stagger style="display:grid;grid-template-columns:repeat(4,1fr);gap:22px;padding:0 40px 60px">${items.map(card).join("") || `<p class="muted">No items here.</p>`}</div>
</div>`;
    return { html, title: r.name + " · Fairplate", mount(root) { stagger(root); } };
  };

  /* ---------------- compare ---------------- */
  FP.whyRow = (rid, items) => {
    const qs = E.all(rid, items), best = qs[0];
    const others = qs.slice(1).map((q) => `${E.pct(q.markup)} on ${FP.APPS[q.app].name}`).join(" and ");
    let big = { v: 0 };
    qs.forEach((q) => [["service fee", q.service], ["delivery fee", q.delivery]].forEach(([n, v]) => { if (v > big.v) big = { v, n, app: q.app, q }; }));
    const lowDel = Math.min(...qs.map((q) => q.delivery)) === big.q.delivery;
    const h = rid === "qsb" && items.smash === 2 && items.fries === 1 && Object.keys(items).length === 2 ? FP.HISTORY["1 month"].points : null;
    const lo = h ? Math.floor(Math.min(...h.slice(0, -1))) : 0, hi = h ? Math.ceil(Math.max(...h.slice(0, -1))) : 0;
    return [
      ["WHY " + FP.APPS[best.app].name.toUpperCase() + " WINS HERE", qs.every((q) => best.markup <= q.markup) ? "Smallest menu markup" : "Lowest fees overall", `${E.pct(best.markup)} vs ${others}`],
      ["BIGGEST FEE", `${FP.APPS[big.app].name} ${big.n}, ${$(big.v)}`, lowDel && big.n === "service fee" ? `Its ${$(big.q.delivery)} delivery fee looks cheap until this line` : "The largest single fee in this basket"],
      ["PRICE HISTORY", h ? "Lower than usual tonight" : "New basket", h ? `This basket is normally $${lo} to $${hi} on ${FP.APPS[best.app].name}` : "We'll start tracking this basket tonight"],
    ];
  };

  V.compareWeb = (p) => {
    const st = S(), r = E.rest(st.restId), items = st.basket, fees = st.withFees !== false;
    if (!Object.keys(items).length) return V.emptyWeb();
    const qs = E.all(r.id, items), best = qs[0], fast = [...qs].sort((a, b) => a.eta - b.eta || a.total - b.total)[0], pu = E.pickup(r.id, items);
    const show = (q) => (fees ? q.total : q.menu);
    const summary = Object.entries(items).map(([id, n]) => `${n} × ${esc(E.item(r, id).short || E.item(r, id).name)}`).join(", ");
    const why = FP.whyRow(r.id, items);
    const html = `<div class="pg webp" data-check="web">
  <header class="wtop">${logo()}<span class="sp"></span><button class="iconbtn" data-a="toast" data-msg="Accounts come later. Everything works without one." aria-label="Account">${I("user")}</button></header>
  <div class="row" style="padding:0 150px;height:64px;border-bottom:1px solid var(--line);gap:34px;font-weight:500;position:sticky;top:0;background:var(--paper);z-index:5" data-tabs>
    <button data-a="wtab" data-to="top" class="wt on" style="height:64px;display:flex;align-items:center;border-bottom:2.5px solid var(--ink);font-weight:600">Overview</button><button data-a="wtab" data-to="cards" class="wt muted">Prices</button><button data-a="wtab" data-to="fees" class="wt muted">Fees</button><button data-a="wtab" data-to="history" class="wt muted">Price history</button><button data-a="toast" data-msg="Reviews come from each app. Coming next." class="wt muted">Reviews</button>
    <span class="sp"></span><div style="text-align:right"><b class="num" style="font-size:18px">${$(best.total)}</b> <span class="small muted">all-in · ${FP.APPS[best.app].name}</span></div><a href="#/checkout" data-a="choose" data-app="${best.app}" class="btn hl sm">Open ${FP.APPS[best.app].name}</a>
  </div>
  <div id="top" style="padding:30px 150px 0">
    <div class="row g24" style="align-items:flex-start">
      <img src="${img(r.hero || r.img)}" alt="${esc(r.name)}" style="width:300px;height:190px;border-radius:14px;view-transition-name:vt-${r.id}">
      <div style="flex:1">
        <div class="h1" style="view-transition-name:vt-title">${esc(r.name)}</div>
        <p class="muted" style="margin-top:8px;line-height:1.5;width:560px">${esc(r.blurb)}</p>
        <div class="row g12" style="margin-top:16px" data-stagger>
          <div style="width:150px;height:84px;border-radius:12px;background:var(--ink);color:#fff;padding:12px"><b style="font-size:24px;line-height:1.2">${r.rating}</b><div class="tiny" style="color:rgba(255,255,255,.7)">${r.rating >= 4.6 ? "Very good" : "Good"} · ${r.count}</div></div>
          <div class="card" style="width:150px;height:84px;padding:12px">${I("walk", "s")}<div class="small" style="margin-top:8px;font-weight:500">${r.walk} min walk</div></div>
          <div class="card" style="width:150px;height:84px;padding:12px">${I("clock", "s")}<div class="small" style="margin-top:8px;font-weight:500">${r.open}</div></div>
          <div class="card" style="width:150px;height:84px;padding:12px">${I("tag", "s")}<div class="small" style="margin-top:8px;font-weight:500">${Math.round(Math.min(...qs.map((q) => q.markup)) * 100)}–${Math.round(Math.max(...qs.map((q) => q.markup)) * 100)}% app markup</div></div>
        </div>
      </div>
    </div>
    <div class="hr" style="margin:30px 0 24px;height:2px;background:var(--ink)"></div>
    <div class="h2">Your basket, on every app</div>
    <div class="row g10" style="margin-top:14px">
      <a href="#/r/${r.id}" class="row g8 card" style="height:46px;padding:0 14px">${I("bag", "s")}${summary}</a>
      <a href="#/" class="row g8 card" style="height:46px;padding:0 14px">${I("pin", "s")}${esc(st.addr)}</a>
      <div class="row g8 card" style="height:46px;padding:0 14px">${I("clock", "s")}Tonight · ASAP</div>
      <button data-a="recheck" aria-label="Check prices again" class="iconbtn" style="width:46px;height:46px;border-radius:12px;background:var(--hl)">${I("search")}</button>
    </div>
    <button data-a="fees" class="row g8 small" style="margin-top:14px"><span class="check${fees ? " on" : ""}" style="${fees ? "background:var(--ink);border-color:var(--ink);display:grid;place-items:center;color:#fff" : ""}">${fees ? I("check", "s", "width:14px;height:14px") : ""}</span>Include fees and tax in prices</button>
    <div class="row g16" id="cards" style="margin-top:18px">
      <div class="card chk winbox lift" style="flex:1;padding:18px;border-color:var(--ink);border-width:2px"><div class="row"><b style="font-size:18px">Cheapest</b><span class="sp"></span><span class="skel"></span><b class="num val" style="font-size:22px" data-count="${show(best)}">${$(show(best))}</b></div><div class="small muted" style="margin-top:2px">${best.eta} min</div><div class="row" style="margin-top:22px"><span class="row g8">${badge(best.app, true)}<b>${FP.APPS[best.app].name}</b></span><span class="sp"></span><a href="#/checkout" data-a="choose" data-app="${best.app}" class="btn hl sm">Open ${FP.APPS[best.app].name}</a></div></div>
      <div class="card chk lift" style="flex:1;padding:18px"><div class="row"><b style="font-size:18px">Fastest</b><span class="sp"></span><span class="skel"></span><b class="num val" style="font-size:22px" data-count="${show(fast)}">${$(show(fast))}</b></div><div class="small save" style="margin-top:2px;font-weight:600">${fast.eta} min</div><div class="row" style="margin-top:22px"><span class="row g8">${badge(fast.app, true)}<b>${FP.APPS[fast.app].name}</b></span><span class="sp"></span><a href="#/checkout" data-a="choose" data-app="${fast.app}" class="btn ghost sm">Open ${FP.APPS[fast.app].name}</a></div></div>
      <div class="card chk lift" style="flex:1;padding:18px"><div class="row"><b style="font-size:18px">Pickup</b><span class="sp"></span><span class="skel"></span><b class="num val" style="font-size:22px" data-count="${fees ? pu.total : pu.menu}">${$(fees ? pu.total : pu.menu)}</b></div><div class="small muted" style="margin-top:2px">Ready in 15 min</div><div class="row" style="margin-top:22px"><span class="row g8">${badge("store", true)}<b>In store</b></span><span class="sp"></span><a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(r.addr + " Toronto")}">Directions</a></div></div>
    </div>
    <div class="row g16" style="margin-top:26px;align-items:stretch" data-stagger>${why.map(([k, t, s]) => `<div style="flex:1;border-radius:14px;background:var(--soft);padding:16px 18px"><div class="tiny muted" style="font-weight:600">${k}</div><div style="font-weight:600;margin-top:6px">${t}</div><div class="small muted">${s}</div></div>`).join("")}</div>
    <section id="fees" style="padding-top:56px"><div class="h2">Fees, line by line</div><div class="card" style="margin-top:16px;padding:8px 22px 18px;max-width:760px">${FP.feeTable(r.id, items, 0, best.app)}</div></section>
    <section id="history" style="padding:56px 0 90px"><div class="h2">Price history</div><div class="card" style="margin-top:16px;padding:22px;max-width:760px">${FP.historyBlock(true)}</div></section>
  </div>
</div>`;
    return { html, title: "Compare · Fairplate", mount(root) { stagger(root); FP.check(root, st.restId + JSON.stringify(items), 0); FP.mountHistory(root); } };
  };

  /* 3-app fee table (desktop compare + checkout) */
  FP.feeTable = (rid, items, tip, pick) => {
    const qs = FP.APP_ORDER.map((k) => E.quote(rid, items, k, { tip }));
    const col = (k) => (k === pick ? "font-weight:600;color:var(--ink)" : "");
    const line = (lab, f) => `<tr><td style="padding:6px 0">${lab}</td>${qs.map((q) => `<td style="text-align:right">${$(f(q))}</td>`).join("")}</tr>`;
    const min = Math.min(...qs.map((q) => q.total));
    return `<table style="width:100%;margin-top:12px;font-size:14px" class="num">
      <tr class="muted" style="font-size:12.5px"><td style="padding:4px 0"></td>${qs.map((q) => `<td style="text-align:right;${col(q.app)}">${FP.APPS[q.app].short}</td>`).join("")}</tr>
      ${line("Menu", (q) => q.menu)}${line("Delivery", (q) => q.delivery)}${line("Service", (q) => q.service)}${line("Tax", (q) => q.tax)}${tip ? line("Tip", (q) => q.tip) : ""}
      <tr style="font-weight:700;font-size:15px;border-top:1px solid var(--line)"><td style="padding:10px 0 4px">Total</td>${qs.map((q) => `<td style="text-align:right;padding-top:10px">${q.total === min ? `<span style="background:var(--hl);padding:2px 6px;border-radius:6px" data-count="${q.total}">${$(q.total)}</span>` : `<span data-count="${q.total}">${$(q.total)}</span>`}</td>`).join("")}</tr>
    </table>`;
  };

  /* ---------------- checkout ---------------- */
  V.checkoutWeb = () => {
    const st = S(), r = E.rest(st.restId), items = st.basket;
    if (!Object.keys(items).length) return V.emptyWeb();
    const tip = st.tip, qs = E.all(r.id, items, { tip }), fastest = [...qs].sort((a, b) => a.eta - b.eta)[0];
    const pick = st.choice && qs.find((q) => q.app === st.choice) ? st.choice : qs[0].app, cur = qs.find((q) => q.app === pick);
    const pickup = st.mode === "pickup", pu = E.pickup(r.id, items);
    const n = Object.values(items).reduce((a, c) => a + c, 0);
    const list = Object.entries(items).map(([id, q]) => `<div class="row g10 small" style="padding:4px 0"><img src="${img(E.item(r, id).img)}" alt="" style="width:32px;height:32px;border-radius:8px"><span style="flex:1">${q} × ${esc(E.item(r, id).name)}</span></div>`).join("");
    const html = `<div class="pg webp" style="background:var(--soft)">
  <header class="wtop" style="background:var(--paper)"><a href="#/r/${r.id}" class="row g8" style="font-weight:600">${I("back", "s")}Back to menu</a><span class="sp"></span><div style="position:absolute;left:50%;transform:translateX(-50%)">${logo()}</div></header>
  <div class="row g24" style="max-width:1060px;margin:0 auto;padding:34px 0;align-items:flex-start">
    <div class="col g20" style="flex:1" data-stagger>
      <div class="card" style="padding:22px;border:0"><div class="row"><b style="font-size:19px">Delivery details</b><span class="sp"></span><div class="seg" data-a="mode"><span class="${pickup ? "" : "on"}" data-v="delivery">Delivery</span><span class="${pickup ? "on" : ""}" data-v="pickup">Pickup</span></div></div>
        <div class="row g12" style="margin-top:18px">${I("pin")}<div style="flex:1"><b>${esc(st.addr)}</b><div class="small muted">${esc(st.city)} · Leave at the door</div></div><a href="#/" class="btn ghost sm">Edit</a></div>
        <div class="hr" style="margin:16px 0"></div>
        <div class="row g12">${I("clock")}<div style="flex:1"><b>Tonight, ASAP</b><div class="small muted">${pickup ? `Ready for pickup in 15 min · ${r.walk} min walk` : `${FP.APPS[qs[0].app].name} says ${qs[0].eta} min · ${FP.APPS[fastest.app].name} says ${fastest.eta} min`}</div></div><button data-a="toast" data-msg="Scheduling comes next. Tonight, ASAP for now." class="btn ghost sm">Edit</button></div>
      </div>
      <div class="card" style="padding:22px;border:0"><b style="font-size:19px">Driver tip</b><div class="small muted" style="margin-top:2px">Added the same way on every app</div>
        <div class="row g8" style="margin-top:14px">${[2, 3, 4, 5].map((t) => `<button class="pill${tip === t ? " on" : ""}" data-a="tip" data-v="${t}">$${t}</button>`).join("")}<button class="pill${[2, 3, 4, 5].includes(tip) ? "" : " on"}" data-a="tip" data-v="custom">${[2, 3, 4, 5].includes(tip) ? "Custom" : "$" + tip}</button></div></div>
      <div class="card" style="padding:22px;border:0"><b style="font-size:19px">Where you'll order</b>
        <div class="col g4" style="margin-top:12px">${pickup ? `<div class="row g12" style="height:52px"><span class="radio on"></span>${badge("store", true)}<b style="flex:1">Pick it up yourself</b><span class="chip save" style="height:22px">No fees</span><b class="num" style="width:80px;text-align:right">${$(pu.total)}</b></div>`
          : qs.map((q, i) => `<button data-a="pick" data-app="${q.app}" class="row g12 row-link" style="height:52px;width:100%;text-align:left;padding:0 6px"><span class="radio${q.app === pick ? " on" : ""}"></span>${badge(q.app, true)}${q.app === pick ? `<b style="flex:1">${FP.APPS[q.app].name}</b>` : `<span style="flex:1">${FP.APPS[q.app].name}</span>`}${i === 0 ? `<span class="chip hl" style="height:22px">Cheapest</span>` : q.app === fastest.app ? `<span class="chip soft" style="height:22px">Fastest</span>` : ""}<span class="num" style="width:80px;text-align:right;font-weight:${q.app === pick ? 600 : 400}" data-count="${q.total}">${$(q.total)}</span></button>`).join("")}
        </div></div>
    </div>
    <div class="card fade-in" style="width:430px;padding:22px;border:0;position:sticky;top:24px">
      <div class="row g12"><img src="${img(r.img)}" alt="" style="width:48px;height:48px;border-radius:10px"><div style="flex:1"><b>${esc(r.name)}</b><div class="small muted">${esc(r.addr)}</div></div>${I("right", "s")}</div>
      ${pickup ? `<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(r.addr + " Toronto")}" class="btn ink full" style="margin-top:16px;height:52px">Get directions · ${$(pu.total)}</a>`
        : `<button data-a="open" data-app="${pick}" class="btn ink full" style="margin-top:16px;height:52px">Open ${FP.APPS[pick].name} · <span data-count="${cur.total}">${$(cur.total)}</span></button>`}
      <button data-a="basket" class="row" style="margin-top:16px;height:40px;width:100%">${I("bag", "s", "margin-right:10px")}<span style="flex:1;font-weight:500;text-align:left">Basket (${n} item${n === 1 ? "" : "s"})</span>${I("down", "s")}</button>
      <div data-basket class="acc" style="height:0"><div>${list}</div></div>
      <div class="hr" style="margin:6px 0 14px"></div>
      <b style="font-size:17px">Order total</b>
      ${FP.feeTable(r.id, items, tip, pick)}
      <div class="tiny muted" style="margin-top:14px;line-height:1.45">Checked <span data-ago>12 seconds ago</span>. Final price is set by each app at its own checkout.</div>
    </div>
  </div>
</div>`;
    return { html, title: "Review · Fairplate", mount(root) { stagger(root); segs(root); FP.ago(root); } };
  };

  V.emptyWeb = () => ({ title: "Fairplate", html: `<div class="pg webp"><header class="wtop">${logo()}</header><div class="col" style="align-items:center;padding:140px 0"><div class="h1">Your basket is empty</div><p class="muted" style="margin-top:8px">Add something from a menu and we'll check every app.</p><a href="#/feed" class="btn ink" style="margin-top:24px">Browse restaurants</a></div></div>` });
})();
