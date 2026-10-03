/* Fairplate price engine: one rule for every app.
   menu (app item prices) + delivery + service (rate × menu) → tax 13% on all three → + tip */
(function () {
  const r2 = (n) => Math.round(n * 100) / 100;
  const rest = (id) => FP.RESTAURANTS.find((r) => r.id === id);
  const item = (r, id) => r.menu.find((m) => m.id === id);

  function storeSubtotal(r, items) {
    return r2(Object.entries(items).reduce((s, [id, q]) => s + item(r, id).store * q, 0));
  }

  function quote(restId, items, appKey, opt = {}) {
    const r = rest(restId), a = FP.APPS[appKey];
    const fee = opt.pass && a.pass ? a.pass : a;
    const menu = r2(Object.entries(items).reduce((s, [id, q]) => s + item(r, id)[appKey] * q, 0));
    const own = !(opt.pass && a.pass) && r.fees && r.fees[appKey];            // per-restaurant fee overrides
    const delivery = own ? own.delivery : fee.delivery, service = r2(menu * fee.service);
    const tax = r2((menu + delivery + service) * FP.TAX);
    const tip = opt.tip || 0;
    const store = storeSubtotal(r, items);
    return { app: appKey, pass: !!(opt.pass && a.pass), menu, delivery, service, tax, tip,
      total: r2(menu + delivery + service + tax + tip), store,
      markup: store ? (menu - store) / store : 0, eta: r.eta[appKey] };
  }

  function pickup(restId, items, opt = {}) {
    const store = storeSubtotal(rest(restId), items);
    const tax = r2(store * FP.TAX);
    return { app: "pickup", menu: store, tax, total: r2(store + tax), store };
  }

  /* All three apps, cheapest first; ties broken by speed. */
  function all(restId, items, opt = {}) {
    return FP.APP_ORDER.map((k) => quote(restId, items, k, opt)).sort((a, b) => a.total - b.total || a.eta - b.eta);
  }

  const money = (n) => "$" + n.toFixed(2);
  const signed = (n) => (n >= 0 ? "+$" : "−$") + Math.abs(n).toFixed(2);
  const pct = (n) => (n >= 0 ? "+" : "−") + Math.round(Math.abs(n) * 100) + "%";

  FP.engine = { quote, pickup, all, storeSubtotal, rest, item, money, signed, pct, r2 };
})();
