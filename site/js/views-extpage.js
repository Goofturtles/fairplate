/* #/extension: hero with the real popup, connection state, install steps, captures in this browser, what it saves.
   Styles: css/extpage.css (scoped to .xp). Popup shots: img/ext/popup-<light|dark>.png, the real popup.html rendered with a
   chrome.* stub holding the two captures our parser reads from the REAL test fixtures (no checkout, so no prices shown). */
(function () {
  const { I, esc, $, status, tabbar } = FP.ui;
  const V = FP.views, P = () => FP.places, X = () => FP.prices;
  const mobile = () => FP.isMobile();
  const { photo } = FP.rv;
  const DL = `<svg class="ic s" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  function capRow(o) {
    const pl = o.place && P().byId(o.place), A = X().APPS[o.app];
    const what = o.kind === "checkout" ? `checkout total ${$(o.total)}` : plural(o.items.length, "menu price");
    const where = pl ? pl.addr : [o.store.address, o.store.city].filter(Boolean).join(", ");
    const th = pl ? `<span class="xc-th">${photo(pl, 52, "52px", false)}</span>` : `<span class="xc-th xc-app ${o.app}" aria-hidden="true">${A.badge}</span>`;
    const inner = `${th}<span class="xc-tx"><b>${esc(pl ? pl.name : o.store.name || "Store not known (open its store page first)")}</b><span>${pl ? `<span class="ab sm ${o.app}" aria-hidden="true">${A.badge}</span>` : ""}${A.name} · ${what} · ${X().ago(o.at)}${where ? ` · ${esc(where)}` : ""}</span></span>`;
    return pl ? `<a href="#/p/${pl.id}" class="xc-row">${inner}${I("right", "s xc-go")}</a>` : `<div class="xc-row">${inner}</div>`;
  }

  /* install-step art: plain HTML shapes, no numbers, so nothing reads as a real price */
  const bars = (ws) => ws.map((w) => `<i style="width:${w}%"></i>`).join("");
  const ART = [
    `<div class="xs-win"><div class="xs-top"><b>Extensions</b><span class="xs-dev">Developer mode<span class="xs-tog"></span></span></div>
      <div class="xs-acts"><span class="xs-btn on">Load unpacked</span><span class="xs-btn">Pack extension</span></div>
      <div class="xs-dir">${I("store", "s")}<span>fairplate-extension</span><span class="xs-file">manifest.json</span></div></div>`,
    `<div class="xs-win"><div class="xs-tabs"><span class="ab sm ue">Ue</span><span class="ab sm dd">DD</span><span class="ab sm sk">S</span></div>
      <div class="xs-sk">${bars([62, 38])}</div><div class="xs-menu">${[0, 1].map(() => `<div><span></span><em>${bars([72, 44])}</em></div>`).join("")}</div>
      <div class="xs-toast"><span class="mark"></span><span>Prices captured</span><span class="xs-ok"></span></div></div>`,
    `<div class="xs-win xs-cmp">${["ue", "dd", "sk"].map((a, i) => `<div class="${i === 1 ? "best" : ""}"><span class="ab sm ${a}">${X().APPS[a].badge}</span>${bars([[58, 72, 50][i]])}<span class="xs-pill">${i === 1 ? I("check", "s") : ""}</span></div>`).join("")}</div>`,
  ];

  V.extension = (tab) => {
    const all = X().all.reverse(), ext = FP.ext || {}, m = mobile(), local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    const on = all.filter((o) => o.place && P().byId(o.place)), off = all.filter((o) => !(o.place && P().byId(o.place)));

    const state = ext.connected
      ? `<div class="xp-state ok"><span class="xp-dot"></span><div><b>Extension connected${ext.version ? ` · v${esc(ext.version)}` : ""}</b><span>${all.length ? `${plural(all.length, "capture")} in this browser, ${on.length} matched to a restaurant on our map.` : "Nothing captured yet. Open a restaurant on Uber Eats, DoorDash or Skip."}</span></div></div>`
      : `<div class="xp-state"><span class="xp-dot"></span><div><b>Not detected in this browser</b><span>Install it below, then reload this page.${all.length ? ` ${plural(all.length, "earlier capture")} ${all.length === 1 ? "is" : "are"} still saved here.` : ""}</span></div></div>`;

    const hero = `<section class="xp-hero">
      <div class="xp-copy">
        <span class="xp-eye"><span class="mark"></span>Browser extension</span>
        <h1 class="xp-h1">Real prices, captured as you browse.</h1>
        <p class="xp-lede">It reads what Uber Eats, DoorDash and Skip already show you, and lines it up here.</p>
        <div class="xp-cta"><a class="btn ink xp-dl" href="fairplate-extension.zip?v=11" download>${DL}Download the extension<span class="xp-zip">.zip</span></a>
        <div class="xp-free">Free · Chrome, Edge, Brave, Arc</div></div>
        ${state}
      </div>
      <figure class="xp-fig"><div class="xp-stage">
        <img class="xp-bg" src="img/hero-dark.jpg" alt="" aria-hidden="true">
        <div class="xp-bar" aria-hidden="true"><span class="xp-dots"><i></i><i></i><i></i></span><span class="xp-url"></span><span class="xp-pin"><span class="mark"></span></span></div>
        <div class="xp-pop"><img class="l" src="img/ext/popup-light.png" width="720" height="1128" alt="The Fairplate popup: this tab's status, capture counts and the last captures"><img class="d" src="img/ext/popup-dark.png" width="720" height="1128" alt="" aria-hidden="true"></div>
      </div><figcaption>The real popup, showing two captures from our test pages. Example photo.</figcaption></figure>
    </section>`;

    const steps = [["Load it", "Unzip it. In chrome://extensions, turn on Developer mode, click Load unpacked and pick the fairplate-extension folder (the one with manifest.json in it)."],
      ["Browse like normal", "Open a restaurant on Uber Eats, DoorDash or Skip. No login needed."],
      ["Compare here", "Each app's prices line up on the restaurant's page."]];
    const how = `<section class="xp-sec"><h2 class="xp-h2">Three steps, then forget it’s there.</h2>
      <div class="xp-steps">${steps.map(([t, s], i) => `<div class="xp-step"><div class="xp-art">${ART[i]}</div><div class="xp-st"><span class="xp-n">${i + 1}</span><b>${t}</b></div><p>${s}</p></div>`).join("")}</div>
      ${local ? `<div class="xp-note">${I("info", "s")}<span>Running Fairplate on this computer? Load the project's extension folder instead: the .zip only talks to the published site.</span></div>` : ""}</section>`;

    const hasPhoto = on.some((o) => P().photoOf(P().byId(o.place)));
    const caps = all.length ? `<section class="xp-sec"><div class="xp-hrow"><h2 class="xp-h2">Your captures</h2><span class="xp-counts"><span>${plural(all.length, "capture")}</span><span>${on.length} matched</span></span></div>
      ${on.length ? `<div class="xc-list">${on.slice(0, 30).map(capRow).join("")}</div><div class="xp-small">Open one to see it next to the other apps.${hasPhoto ? " Photos are examples of the cuisine, not from the restaurant." : ""}</div>` : ""}
      ${off.length ? `<h3 class="xp-h3">Captured but not on our map yet</h3><div class="xp-small">We match by map point or street address, never by name alone.</div><div class="xc-list">${off.slice(0, 30).map(capRow).join("")}</div>` : ""}</section>` : "";

    const facts = [["bag", "What it saves", "Store name, address and link, menu prices, and at checkout your cart items with every fee, tax, tip and total."],
      ["x", "What it never saves", "Your address, name, email, phone, payment details or order history. It never places an order."],
      ["loc", "Where captures go", "Only to your browser and this site, for now. Clear them any time from the popup."],
      ["check", "What's been tested", "DoorDash and Skip, on real store pages. Uber Eats is untested against a live page (Uber blocked our test browser)."]];
    const data = `<section class="xp-sec"><h2 class="xp-h2">What it keeps, and what it doesn’t.</h2>
      <div class="xp-facts">${facts.map(([ic, t, s], i) => `<div class="xp-fact${i === 1 ? " inv" : ""}"><span class="xp-ic">${I(ic, "s")}</span><b>${t}</b><p>${s}</p></div>`).join("")}</div></section>`;

    return { title: "Get the extension · Fairplate", html: `<div class="pg ${m ? "app" : "webp"}">${m ? status() : V.realTop()}<div class="xp${m ? " m" : ""}">${hero}${how}${caps}${data}</div>${m && tab ? `<div class="tab-spacer"></div>${tabbar(tab)}` : ""}</div>` };
  };
})();
