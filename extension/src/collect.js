/* Fairplate collector: runs on Uber Eats, DoorDash and Skip pages you open yourself.
   Saves only the store (name, street, city, map point, page URL) and prices: menu items, cart items, fees, taxes, total.
   Never saves your delivery address, name, email, phone, payment details or order history. */
(function () {
  "use strict";
  if (self.__fairplateCollector === true) return;   // "=== true": an element with that id on the page shows up here too (named access)
  self.__fairplateCollector = true;
  const P = self.FairplateParse;
  /* test hook for tools/extension_check.cjs. A page can't set our variables, but an element id on it still appears as a
     global (named access), so only a plain object counts */
  const T = self.FAIRPLATE_TEST && Object.getPrototypeOf(self.FAIRPLATE_TEST) === Object.prototype ? self.FAIRPLATE_TEST : null;
  const HOSTS = { "www.ubereats.com": "ue", "www.doordash.com": "dd", "www.skipthedishes.com": "sk" };
  const app = (T && T.app) || HOSTS[location.hostname];
  if (!P || !app) return;
  const MAX = 500, DUP_MS = 10 * 60 * 1000, STORE_MS = 3 * 3600 * 1000;
  const loadId = Math.random().toString(36).slice(2, 8);
  const href = () => (T && T.href) || location.href;
  const url = () => new URL(href());
  const text = (el) => (el ? el.innerText || el.textContent || "" : "");
  const cap = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
  const get = (k) => new Promise((res) => chrome.storage.local.get(k, (o) => res(o || {})));
  const set = (o) => new Promise((res) => chrome.storage.local.set(o, () => res(!chrome.runtime.lastError)));   // false = not saved (storage full)

  let visit = 0, lastHref = "", mo = null, timer = null, due = 0, stopT = null;
  let status = { app, page: "other" };

  /* which page is this? checkout, a store menu, or neither (then we do nothing) */
  function pageKind() {
    const p = url().pathname;
    if (/\/checkout\b/i.test(p)) return "checkout";
    if (app === "sk") return p.length > 1 && !/^\/(?:user|account|orders?|profile|settings|login|signup|help)\b/i.test(p) ? "menu" : null;   // Skip store URLs are one slug: /pizza-pizza-front-street
    return /\/store\//i.test(p) ? "menu" : null;
  }

  function storeUrl() { const u = url(); return u.origin + u.pathname; }   // no query string: it can carry tracking or cart ids

  /* ---------- store pages ---------- */
  function ldBlocks() {
    return [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch (e) { return null; } }).filter(Boolean);
  }
  function skipSection(el) {
    const w = el.closest('[data-testid="menu-list-wrapper"]'), s = w && w.parentElement && w.parentElement.closest("div[id]");
    return s ? s.id : "";
  }
  function menu() {
    let r;
    if (app === "sk") {
      const side = document.querySelector('[data-testid="menu-partner-sidebar"]');   // only a store page has the store sidebar
      const els = side ? [...document.querySelectorAll('[data-testid^="menu-item-"]')].filter((el) => !el.parentElement.closest('[data-testid^="menu-item-"]')) : [];
      if (!els.length) return null;
      r = P.fromSkip({ title: document.title, header: text(side), items: els.map((el) => ({ text: text(el), section: skipSection(el) })) });
    } else {
      r = P.fromSchemaOrg(ldBlocks());
      if (!r.items.length) {   // no schema.org menu (Uber Eats layout untested live): items are elements whose text has a name line and a $ line,
        /* inside a menu section with a heading, never in the page's nav, header, cart or account panels */
        const els = [...document.querySelectorAll('li, [data-testid*="item" i]')].filter((el) => { const t = text(el), sec = el.closest("section, [role=region]");
          return t.length < 300 && /\$\s*\d/.test(t) && sec && sec.querySelector("h2, h3") && !el.closest("nav, header, footer, aside, dialog, [role=dialog], [role=navigation], [role=banner], [aria-modal=true]"); });
        r.items = P.fromTextItems(els.map((el) => ({ text: text(el), section: cap(text(el.closest("section, [role=region]").querySelector("h2, h3")), 80) })));
      }
      if (!r.store.name) r.store.name = cap(text(document.querySelector("h1")), 120);
    }
    if (!r.items.length || !r.store.name) return null;
    const o = { kind: "menu", store: Object.assign(r.store, { url: storeUrl() }), items: r.items.slice(0, 400), fees: {} };
    const fee = document.querySelector('[data-testid="MenuHeaderDeliveryFee"]');   // DoorDash: "$0 delivery fee, first order"
    if (fee) { const v = P.parsePrice(text(fee)); if (v != null) { o.fees.delivery = v; o.note = cap(text(fee), 80); } }
    return o;
  }

  /* ---------- checkout: only the order-summary block (the smallest box holding "Subtotal" and "Total") is read ---------- */
  function summaryBox() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (/^\s*sub\s*-?\s*total\b/i.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    const n = w.nextNode();
    for (let el = n && n.parentElement; el && el !== document.body; el = el.parentElement) {
      const t = text(el);
      if (t.length > 6000) return null;
      if (/\btotal\b/i.test(t.replace(/sub\s*-?\s*total/gi, "")) && (t.match(/\$/g) || []).length >= 2) return el;
    }
    return null;
  }
  async function checkout() {
    const box = summaryBox();
    if (!box) return null;
    const t = text(box), r = P.parseCheckout(t);
    if (r.total == null || r.fees.subtotal == null) return null;
    /* checkout pages rarely name the store, so pick from the store pages you opened on this app in the last 3 h: the one named
       in the order summary, else the one whose menu has the most cart items. A tie or no fit = "store not known", never a guess. */
    const { lastStore = {} } = await get("lastStore");
    const words = ` ${P.normName(t)} `, cart = r.items.map((i) => P.normName(i.name));
    const recent = [].concat(lastStore[app] || []).filter((x) => x && x.store && Date.now() - x.at < STORE_MS);
    const fit = (x) => cart.filter((n) => (x.names || []).includes(n)).length;
    const named = recent.filter((x) => P.normName(x.store.name) && words.includes(` ${P.normName(x.store.name)} `));
    const pool = named.length ? named : recent.filter((x) => fit(x) > 0), top = Math.max(...pool.map(fit)), hits = pool.filter((x) => fit(x) === top);
    const store = hits.length === 1 ? hits[0].store : { name: "", address: "", city: "", lat: null, lon: null, url: "" };
    return { kind: "checkout", store, items: r.items.slice(0, 100), fees: r.fees, total: r.total, lines: r.lines };
  }

  /* ---------- save: newest 500, one capture per page visit, skip repeats within 10 min ---------- */
  const sig = (o) => [o.app, P.normName(o.store.name), o.store.address, o.kind, o.items.length, o.total == null ? "" : o.total].join("|");
  async function save(o) {
    const { observations = [], lastStore = {} } = await get(["observations", "lastStore"]);
    const extra = {};
    if (o.kind === "menu") {   // every menu read, repeats included: the last 5 store pages (+ their item names) are what a checkout is matched against
      const mine = { store: o.store, at: o.at, names: o.items.map((i) => P.normName(i.name)) };
      lastStore[app] = [mine].concat([].concat(lastStore[app] || []).filter((x) => x && x.store && x.store.url !== o.store.url)).slice(0, 5);
      extra.lastStore = lastStore;
    }
    const same = observations.find((x) => x.visit === o.visit);
    if (same && sig(same) === sig(o)) { if (o.kind === "menu") await set(extra); return { saved: false, obs: same }; }
    const dup = observations.find((x) => x.visit !== o.visit && sig(x) === sig(o) && o.at - x.at < DUP_MS);
    if (dup) {   // a repeat of a capture from the last 10 min: also drop this visit's earlier, half-loaded read of the same menu
      await set(Object.assign(same ? { observations: observations.filter((x) => x !== same) } : {}, extra));
      return { saved: false, dup: true, obs: dup };
    }
    let list = observations.filter((x) => x.visit !== o.visit).concat(o).slice(-MAX);   // same visit: replace (a menu that loaded more items, a new tip at checkout)
    while (!(await set(Object.assign({ observations: list }, extra))) && list.length > 1) list = list.slice(Math.floor(list.length / 2));   // storage full: drop the oldest half
    return { saved: true, obs: o };
  }

  let chain = Promise.resolve();
  const run = () => (chain = chain.then(pass).catch(() => {}));   // one pass at a time: save() is read-modify-write
  /* page changed: read again once it's quiet for 1 s, but at most 3 s after the first change (a ticking clock never goes quiet) */
  const kick = () => { const now = Date.now(); if (!due) due = now + 3000; clearTimeout(timer); timer = setTimeout(() => { due = 0; run(); }, Math.min(1000, due - now)); };
  async function pass() {
    const h = href();
    if (h !== lastHref) {   // new page (SPAs change the URL without reloading)
      lastHref = h; visit++; clearTimeout(stopT); stopT = null;
      status = { app, page: pageKind() || "other" };
      if (mo) { mo.disconnect(); mo = null; }
      if (pageKind()) { mo = new MutationObserver(kick); mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true }); }
    }
    const kind = pageKind();
    if (!kind) return;
    let o = null;
    try { o = kind === "checkout" ? await checkout() : menu(); } catch (e) { o = null; }
    if (!o) return;
    const at = Date.now();
    o = Object.assign({ id: `${app}-${o.kind}-${at.toString(36)}-${loadId}`, app, at, visit: `${loadId}-${visit}` }, o);
    const res = await save(o);
    status = { app, page: kind, store: res.obs.store.name, count: res.obs.items.length, total: res.obs.total, at: res.obs.at, saved: res.saved, dup: !!res.dup };
    if (kind === "menu" && !stopT) stopT = setTimeout(() => { if (mo) { mo.disconnect(); mo = null; } }, 15000);   // menus: watch 15 s more for lazy-loaded items, then stop
  }

  chrome.runtime.onMessage.addListener((m, sender, reply) => { if (m && m.type === "fairplate:status") reply(status); });
  setInterval(() => { if (href() !== lastHref) run(); }, 1000);   // content scripts can't hook the page's history.pushState, so poll the URL
  self.__fairplateRun = run;   // lets the test harness trigger a pass without waiting
  run();
})();
