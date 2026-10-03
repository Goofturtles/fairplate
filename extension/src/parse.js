/* Fairplate parsers. Pure functions, no DOM: the content scripts use them as self.FairplateParse,
   the node tests require() them. Every number returned was read from the page's own text. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FairplateParse = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const r2 = (n) => Math.round(n * 100) / 100;

  /* "$23.00", "CA$1,234.50", "-$5.00", "($5.00)", "23,50 $", "Free", "2 for $21.00" (-> 21), 23 -> number, or null */
  const DOLLAR = /([-\u2212\u2013]\s*)?(?:CA|US|C|A)?\$\s*([-\u2212\u2013]\s*)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d{1,2})?(?!\d)/;
  const FRENCH = /([-\u2212\u2013]\s*)?(\d{1,3}(?:[ \u202f]\d{3})*|\d+),(\d{2})\s*\$/;
  function parsePrice(v) {
    if (typeof v === "number") return isFinite(v) ? r2(v) : null;
    if (typeof v !== "string") return null;
    const s = v.replace(/\u00a0/g, " ").trim();
    if (!s) return null;
    if (/^free\b/i.test(s)) return 0;
    let m = s.match(DOLLAR);
    if (m) {
      const n = parseFloat(m[3].replace(/,/g, "") + (m[4] || ""));
      const paren = /\(\s*$/.test(s.slice(0, m.index)) && /^\s*\)/.test(s.slice(m.index + m[0].length));   // "($5.00)" is a credit, "$12.99 ($2.00 off)" is not
      return r2(m[1] || m[2] || paren ? -n : n);
    }
    if ((m = s.match(FRENCH))) { const n = parseFloat(m[2].replace(/[ \u202f]/g, "") + "." + m[3]); return r2(m[1] ? -n : n); }
    if ((m = s.match(/^([-\u2212\u2013])?\s*(\d+(?:\.\d{1,2})?)$/))) return r2(m[1] ? -m[2] : +m[2]);
    return null;
  }
  /* a line that is only a price ("$9.99", "Free", "-CA$3.00", "2 for $21.00") -> { price, deal? } */
  const PRICE_ONLY = /^\(?\s*[-\u2212\u2013]?\s*(?:CA|US|C|A)?\$\s*[-\u2212\u2013]?\s*\d[\d,]*(?:\.\d{1,2})?\s*\)?$|^[-\u2212\u2013]?\s*\d[\d \u202f]*,\d{2}\s*\$$/;
  function offer(line) {
    const s = String(line == null ? "" : line).replace(/\u00a0/g, " ").trim();
    if (/^free$/i.test(s)) return { price: 0 };
    if (PRICE_ONLY.test(s)) return { price: parsePrice(s) };
    if (/^\d+\s*for\s*(?:CA|US)?\$\s*\d[\d,]*(?:\.\d{1,2})?$/i.test(s)) return { price: parsePrice(s), deal: s };   // DoorDash BOGO: "2 for $21.00" = $21 each, 2nd free
    return null;
  }
  const lines = (t) => String(t || "").split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const cut = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);   // same caps as the site: names 120, sections 80, streets 160

  /* matching key: lowercase, no accents/punctuation, no "(branch)" suffix, no "the"/"restaurant" */
  const STOP = new Set(["the", "restaurant", "restaurants"]);
  function normName(s) {
    return String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/\([^)]*\)|\[[^\]]*\]/g, " ").replace(/&/g, " and ").replace(/['\u2019`]/g, "")
      .replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w && !STOP.has(w)).join(" ");
  }
  const slug = (s) => normName(s).replace(/ /g, "-");

  /* ---------- schema.org ld+json (DoorDash; Uber Eats is reported to ship the same shape) ---------- */
  const types = (o) => [].concat(o["@type"] || []).map(String);
  const isStore = (o) => types(o).some((t) => /Restaurant|FoodEstablishment|LocalBusiness|Store|CafeOrCoffeeShop|Bakery|BarOrPub/i.test(t));
  const isItem = (o) => types(o).some((t) => /^MenuItem$/i.test(t)) || (!!o.offers && !!o.name && !o.hasMenuItem && !o.hasMenuSection);
  const PROMO_SECTION = /most ordered|popular|featured|picked for you|deals|offers|exclusive/i;
  function flat(x, out = []) {
    if (Array.isArray(x)) x.forEach((y) => flat(y, out));
    else if (x && typeof x === "object") { out.push(x); if (x["@graph"]) flat(x["@graph"], out); }
    return out;
  }
  function addItem(items, seen, it) {
    const k = normName(it.name) + "|" + it.price, prev = seen.get(k);
    if (!prev) { seen.set(k, it); items.push(it); }
    else if (PROMO_SECTION.test(prev.section) && it.section && !PROMO_SECTION.test(it.section)) prev.section = it.section;   // keep the real section, not "Most Ordered"
  }
  function walkMenu(node, section, items, seen) {
    if (Array.isArray(node)) return node.forEach((n) => walkMenu(n, section, items, seen));
    if (!node || typeof node !== "object") return;
    if (isItem(node)) {
      const of = [].concat(node.offers || [])[0] || {};
      const raw = of.price ?? (of.priceSpecification || {}).price ?? of.lowPrice ?? node.price;
      const o = typeof raw === "number" ? { price: parsePrice(raw) } : offer(raw) || { price: parsePrice(raw) };
      const name = cut(node.name, 120);
      if (name && o.price != null && o.price >= 0) addItem(items, seen, Object.assign({ name, price: o.price, section: section || "" }, o.deal ? { deal: o.deal } : {}));
      return;
    }
    const sec = types(node).some((t) => /^Menu$/i.test(t)) ? section : cut(node.name || section, 80);
    if (node.hasMenuSection) walkMenu(node.hasMenuSection, sec, items, seen);
    if (node.hasMenuItem) walkMenu(node.hasMenuItem, sec, items, seen);
  }
  const numOrNull = (v) => (v === "" || v == null || !isFinite(+v) ? null : +v);
  function fromSchemaOrg(ld) {
    const all = flat(ld), st = all.find(isStore) || {};
    const a = st.address || {}, geo = st.geo || {};
    const store = typeof a === "string"
      ? { name: cut(st.name, 120), address: cut(a.split(",")[0], 160), city: cut(a.split(",").slice(1, 3).join(","), 80) }
      : { name: cut(st.name, 120), address: cut(a.streetAddress, 160), city: cut([a.addressLocality, a.addressRegion].filter(Boolean).join(", "), 80) };
    store.lat = numOrNull(geo.latitude); store.lon = numOrNull(geo.longitude);
    const items = [], seen = new Map();
    [].concat(st.hasMenu || []).forEach((m) => walkMenu(m, "", items, seen));   // hasMenu can also be a URL string: ignored
    all.filter((o) => o !== st && types(o).some((t) => /^Menu$/i.test(t))).forEach((m) => walkMenu(m, "", items, seen));
    return { store, items };
  }

  /* ---------- items from visible text (Skip; Uber Eats fallback) ---------- */
  const BADGE = /^(?:popular|new|spicy|vegetarian|vegan|halal|gluten[- ]free|most (?:liked|ordered|popular)|best ?seller|chef['\u2019]?s (?:pick|choice)|recommended|limited time|#\s?\d+(?: most liked)?)$/i;
  function itemFromText(text, section) {
    const ls = lines(text);
    while (ls.length > 2 && BADGE.test(ls[0])) ls.shift();   // "Popular", "#1 Most liked" badges sit above the name
    if (ls.length < 2 || ls[0].length > 120 || offer(ls[0])) return null;
    for (let i = 1; i < ls.length; i++) {
      const o = offer(ls[i]);
      if (o && o.price != null && o.price >= 0) return Object.assign({ name: ls[0], price: o.price, section: cut(section, 80) }, o.deal ? { deal: o.deal } : {});
    }
    return null;
  }
  function fromTextItems(list) {
    const items = [], seen = new Map();
    (list || []).forEach((x) => { const it = typeof x === "string" ? itemFromText(x) : x && itemFromText(x.text, x.section); if (it) addItem(items, seen, it); });
    return items;
  }
  /* Skip: no ld+json. title "Pizza Pizza (109 Front St E) | Order Delivery ... | SkipTheDishes"; header = sidebar text "Name\nrating\nstreet\nCity, PROV, POSTAL, CAN" */
  function fromSkip({ title, header, items } = {}) {
    const h = lines(header), t = String(title || "");
    const m = t.match(/^(.*?)\s*\(([^)]+)\)\s*\|/);
    const name = (m ? m[1] : t.split("|")[0]).trim() || h[0] || "";
    const street = m ? m[2].trim() : h.find((l) => /^\d+[a-z]?\s+[a-z]/i.test(l)) || "";
    const cityLine = h.find((l) => /^[^,\d]+,\s*[A-Z]{2}\b/.test(l)) || "";
    const city = cityLine.split(",").slice(0, 2).map((s) => s.trim()).join(", ");
    return { store: { name: cut(name, 120), address: cut(street, 160), city: cut(city, 80), lat: null, lon: null }, items: fromTextItems(items) };
  }

  /* ---------- checkout: pair fee labels with amounts in the order summary's text lines ---------- */
  const FEES = [   // first match wins, so the specific labels come before the general ones
    ["subtotal", /^sub\s*-?\s*total\b/, "Subtotal"],
    ["discount", /promo|promotion|discount|savings|you saved|uber one|dashpass|coupon|voucher|offer applied/, "Discount"],
    ["other", /fees?\s*(?:&|and)\s*(?:estimated\s*)?tax|tax(?:es)?\s*(?:&|and)\s*(?:other\s*)?fees/, "Fees & estimated taxes"],
    ["small", /small\s*order/, "Small order fee"],
    ["delivery", /deliver(?:y)?\s*fee|^delivery$/, "Delivery fee"],
    ["service", /service\s*fee|^service$/, "Service fee"],
    ["other", /expanded\s*range|long\s*distance|distance\s*fee/, "Expanded range fee"],
    ["other", /regulatory/, "Regulatory response fee"],
    ["other", /\bbag\b/, "Bag fee"],
    ["other", /other\s*fees?|packaging/, "Other fees"],
    ["tax", /^(?:estimated\s*)?(?:sales\s*)?tax(?:es)?\b|\b(?:hst|gst|pst|qst)\b/, "Tax"],
    ["tip", /\btip\b|gratuity/, "Tip"],
    ["total", /^(?:order\s*|estimated\s*|grand\s*)?total\b/, "Total"],
  ];
  const AMT_G = /\(?\s*[-\u2212\u2013]?\s*(?:CA|US|C|A)?\$\s*[-\u2212\u2013]?\s*\d[\d,]*(?:\.\d{1,2})?(?!\d)\s*\)?|[-\u2212\u2013]?\s*\d[\d \u202f]*,\d{2}\s*\$/g;
  const amounts = (l) => { const a = (l.match(AMT_G) || []).map(parsePrice).filter((n) => n != null); return a.length ? a : /\bfree$/i.test(l) ? [0] : []; };
  const labelOf = (l) => l.replace(/\([^)]*[a-z][^)]*\)/gi, " ").replace(AMT_G, " ").replace(/\bfree$/i, "").replace(/[:\u24d8\u2139*\u2022\u00b7]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const pick = (a) => (a.length === 1 ? a[0] : a.length === 2 ? a[1] : null);   // 2 amounts = struck-through original, then what you pay; 3+ = skip
  const INFO = /you(?:['\u2019]re| are)? sav|you saved|\bsavings?\b/;   // "You're saving $3.99 with DashPass"
  function parseCheckout(input) {
    const ls = Array.isArray(input) ? input.map((l) => String(l).replace(/\s+/g, " ").trim()).filter(Boolean) : lines(input);
    const fees = {}, out = { fees, total: null, items: [], lines: [] };
    let struck = 0;
    for (let i = 0; i < ls.length; i++) {
      const l = ls[i];
      /* cart line: "2x Margherita Pizza $42.00" or "2 \u00d7" / name / price */
      const q = l.match(/^(\d{1,2})\s*[x\u00d7](?=\s|$)\s*(.*)$/i);
      if (q) {
        let name = labelOf(q[2]) ? q[2].replace(AMT_G, "").trim() : "", j = i + 1, a = amounts(q[2]);
        if (!name && j < ls.length && !amounts(ls[j]).length) name = ls[j++];
        if (!a.length && j < ls.length && offer(ls[j])) a = [offer(ls[j++]).price];
        if (name && a.length && name.length <= 120) { out.items.push({ name, qty: +q[1], price: pick(a) ?? a[0] }); i = j - 1; continue; }
      }
      const label = labelOf(l);
      if (!label || label.length > 40 || !/[a-z]/.test(label)) continue;
      const f = FEES.find(([, re]) => re.test(label));
      if (!f) continue;
      let a = amounts(l), j = i;
      if (!a.length) {   // amount on the following line(s); skip a lone info glyph in between
        let k = i + 1;
        while (k < ls.length && ls[k].length <= 2 && !/\d/.test(ls[k])) k++;
        while (k < ls.length && offer(ls[k])) { a.push(offer(ls[k]).price); k++; }
        j = k - 1;
      }
      const [key, , name] = f;
      const v = key === "tip" && a.length > 1 ? null : pick(a);   // a tip is one amount; 2+ are preset buttons, not what you pay
      if (v == null) continue;
      i = Math.max(i, j);
      if (key === "total") { if (out.total != null) continue; out.total = v; }   // first total wins: later "Order total" lines are repeats or upsells
      else if (key === "discount") {
        const had = -(fees.discount || 0);   // a savings note that equals what's already counted (struck-through fees, earlier promos) is a recap, not another discount
        if (INFO.test(label) && [struck, had, r2(struck + had)].some((n) => n > 0 && Math.abs(Math.abs(v) - n) < 0.005)) continue;
        fees.discount = r2((fees.discount || 0) - Math.abs(v));
      }
      else if (key === "other") fees.other = r2((fees.other || 0) + v);
      else if (fees[key] == null) fees[key] = v;
      else continue;
      if (a.length === 2 && key !== "discount" && a[0] > a[1]) struck = r2(struck + a[0] - a[1]);
      out.lines.push({ key, label: name, amount: key === "discount" ? -Math.abs(v) : v });   // fixed label names only: never store page text
    }
    return out;
  }

  return { parsePrice, offer, lines, normName, slug, fromSchemaOrg, fromSkip, fromTextItems, parseCheckout };
});
