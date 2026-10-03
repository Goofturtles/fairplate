/* node --test extension/test/  \u2014 parsers against the real captured fixtures + synthetic checkout layouts. */
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../src/parse.js");
const dd = require("./fixtures/doordash-store.json");
const sk = require("./fixtures/skip-store.json");

test("parsePrice edge cases", () => {
  const cases = [
    ["$23.00", 23], ["CA$1,234.50", 1234.5], ["US$ 4.5", 4.5], ["$0.00", 0], ["$0", 0], ["Free", 0], ["FREE", 0],
    ["-$5.00", -5], ["\u2212CA$3.00", -3], ["$-2.50", -2.5], ["($5.00)", -5], ["23,50 $", 23.5], ["1 234,50 $", 1234.5],
    ["2 for $21.00", 21], ["$0 delivery fee, first order", 0], ["23.00", 23], ["12", 12], [9.994, 9.99],
    ["", null], ["Popular", null], ["4.5 (200+)", null], [NaN, null], [null, null], [undefined, null], [{}, null],
  ];
  for (const [inp, want] of cases) assert.equal(P.parsePrice(inp), want, JSON.stringify(inp));
});

test("offer: price-only lines and DoorDash deals", () => {
  assert.deepEqual(P.offer("$9.99"), { price: 9.99 });
  assert.deepEqual(P.offer("Free"), { price: 0 });
  assert.deepEqual(P.offer("2 for $21.00"), { price: 21, deal: "2 for $21.00" });
  assert.equal(P.offer("Create your own pizza"), null);
  assert.equal(P.offer("Delivery Fee $2.99"), null);   // a label with an amount is not a price-only line
  assert.equal(P.offer("4.5"), null);                  // ratings are not prices
});

test("fromSchemaOrg on the real DoorDash fixture", () => {
  const r = P.fromSchemaOrg(dd.ld);
  assert.equal(r.store.name, "Pizzeria Libretto");
  assert.equal(r.store.address, "155 University Ave");
  assert.equal(r.store.city, "Toronto, ON");
  assert.equal(r.store.lat, 43.64844);
  assert.equal(r.store.lon, -79.384989);
  assert.equal(r.items.length, 5);
  const marg = r.items.find((i) => i.name === "Margherita Pizza");
  assert.deepEqual(marg, { name: "Margherita Pizza", price: 21, section: "Most Ordered", deal: "2 for $21.00" });
  assert.deepEqual(r.items.find((i) => i.name === "Pepperoni Pizza"), { name: "Pepperoni Pizza", price: 23, section: "Most Ordered" });
  assert.equal(r.items.find((i) => i.name === "Game Day Combo").section, "DoorDash-Exclusive");
  assert.equal(P.parsePrice(dd.feeHeader), 0);
});

test("fromSchemaOrg tolerates the other shapes (Uber Eats is untested live)", () => {
  const ld = [{ "@context": "https://schema.org", "@graph": [
    { "@type": ["Restaurant", "LocalBusiness"], name: "Test Kitchen", address: "12 King St W, Toronto, ON", geo: { latitude: 43.6, longitude: -79.3 },
      hasMenu: { "@type": "Menu", hasMenuSection: { "@type": "MenuSection", name: "Mains",
        hasMenuSection: [{ name: "Bowls", hasMenuItem: { "@type": "MenuItem", name: "Rice Bowl", offers: [{ price: 14.5 }] } }],
        hasMenuItem: [{ "@type": "MenuItem", name: "Burger", offers: { priceSpecification: { price: "16.00" } } }, { "@type": "MenuItem", name: "No price" }] } } },
  ] }];
  const r = P.fromSchemaOrg(ld);
  assert.deepEqual(r.store, { name: "Test Kitchen", address: "12 King St W", city: "Toronto, ON", lat: 43.6, lon: -79.3 });
  assert.deepEqual(r.items, [{ name: "Rice Bowl", price: 14.5, section: "Bowls" }, { name: "Burger", price: 16, section: "Mains" }]);
  assert.deepEqual(P.fromSchemaOrg([]), { store: { name: "", address: "", city: "", lat: null, lon: null }, items: [] });
});

test("fromSchemaOrg keeps one copy of an item listed in 'Most Ordered' and its real section", () => {
  const ld = [{ "@type": "Menu", hasMenuSection: [[
    { name: "Most Ordered", hasMenuItem: [{ "@type": "MenuItem", name: "Margherita", offers: { price: "$18.00" } }] },
    { name: "Pizza", hasMenuItem: [{ "@type": "MenuItem", name: "Margherita", offers: { price: "$18.00" } }, { "@type": "MenuItem", name: "Margherita", offers: { price: "$24.00" } }] },
  ]] }];
  assert.deepEqual(P.fromSchemaOrg(ld).items, [{ name: "Margherita", price: 18, section: "Pizza" }, { name: "Margherita", price: 24, section: "Pizza" }]);
});

test("fromSkip on the real Skip fixture", () => {
  const items = sk.items.map((x, i) => ({ ...x, section: i < 6 ? "Create Your Own" : "Stuffed Crust" }));
  const r = P.fromSkip({ title: sk.title, header: sk.header, items });
  assert.equal(r.store.name, "Pizza Pizza");
  assert.equal(r.store.address, "109 Front St E");
  assert.equal(r.store.city, "Toronto, ON");
  assert.equal(r.items.length, 8);
  assert.deepEqual(r.items[0], { name: "Small", price: 9.99, section: "Create Your Own" });
  assert.equal(r.items.find((i) => i.name === "PARTY").price, 28.39);
  assert.equal(r.items[7].name, "Large Stuffed Crust Pizza");
  // a title without the street falls back to the sidebar's street line
  assert.equal(P.fromSkip({ title: "Pizza Pizza | SkipTheDishes", header: sk.header, items: [] }).store.address, "109 Front St E");
});

test("fromTextItems: name = first line, price = first price line", () => {
  const r = P.fromTextItems([
    { text: "Spicy Chicken Sandwich\n$12.49\n\u2022 92% (310)", section: "Sandwiches" },
    "Fries\nCrispy.\nCA$4.99",
    "Popular\n",            // no price: ignored
    "$5.00\nOrphan price",  // name can't be a price
    "Soda\n2 for $3.00",
  ]);
  assert.deepEqual(r, [
    { name: "Spicy Chicken Sandwich", price: 12.49, section: "Sandwiches" },
    { name: "Fries", price: 4.99, section: "" },
    { name: "Soda", price: 3, section: "", deal: "2 for $3.00" },
  ]);
});

test("fromTextItems: a badge line above the name is not the name", () => {
  assert.deepEqual(P.fromTextItems(["Popular\nSmall\n$9.99", "#1 Most liked\nGarlic Bread\n$5.49", "New\nSpicy\nHot Wings\n$12.00"]),
    [{ name: "Small", price: 9.99, section: "" }, { name: "Garlic Bread", price: 5.49, section: "" }, { name: "Hot Wings", price: 12, section: "" }]);
});

/* Checkout pages need a login, so these layouts are SYNTHETIC: typed by hand to cover the label/amount pairings the three apps use. */
test("parseCheckout: synthetic, a savings note that repeats a struck-through fee or earlier promos is not a second discount", () => {
  assert.deepEqual(P.parseCheckout(["Subtotal $30.00", "Delivery Fee $3.99 $0.00", "You're saving $3.99 with DashPass", "Total $30.00"]).fees, { subtotal: 30, delivery: 0 });
  assert.deepEqual(P.parseCheckout(["Subtotal $30.00", "Promo code -$3.00", "Promotion ($2.00)", "You saved $5.00", "Total $25.00"]).fees, { subtotal: 30, discount: -5 });
  assert.deepEqual(P.parseCheckout(["Subtotal $30.00", "Promotion -$5.00", "Uber One savings -$2.00", "Total $23.00"]).fees, { subtotal: 30, discount: -7 });   // its own row: counts
});

test("parseCheckout: synthetic, same-line labels (Uber Eats-style)", () => {
  const r = P.parseCheckout(["Order summary", "Subtotal CA$42.00", "Delivery Fee CA$0.49", "Fees & Estimated Taxes CA$9.87", "Uber One savings -CA$3.00", "Total CA$49.36"]);
  assert.deepEqual(r.fees, { subtotal: 42, delivery: 0.49, other: 9.87, discount: -3 });
  assert.equal(r.total, 49.36);
  assert.deepEqual(r.lines.map((l) => l.label), ["Subtotal", "Delivery fee", "Fees & estimated taxes", "Discount", "Total"]);
});

test("parseCheckout: synthetic, label line then amount line (DoorDash-style)", () => {
  const text = "Order Summary\n1\u00d7\nMargherita Pizza\n$21.00\n2x Caesar Salad $34.00\nSubtotal\n$55.00\nDelivery Fee\n\u24d8\n$3.99\n$0.00\nService Fee\n$8.25\nSmall Order Fee\nFree\nEstimated Tax\n$8.35\nExpanded Range Fee\n$1.99\nRegulatory Response Fee\n$0.10\nDasher Tip\n$4.00\nPromotion\n($5.00)\nTotal\n$71.69\nPlace Order";
  const r = P.parseCheckout(text);
  assert.deepEqual(r.items, [{ name: "Margherita Pizza", qty: 1, price: 21 }, { name: "Caesar Salad", qty: 2, price: 34 }]);
  assert.deepEqual(r.fees, { subtotal: 55, delivery: 0, service: 8.25, small: 0, tax: 8.35, other: 2.09, tip: 4, discount: -5 });
  assert.equal(r.total, 71.69);
});

test("parseCheckout: synthetic, Skip-style with HST and courier tip chooser", () => {
  const r = P.parseCheckout(["Subtotal:", "$24.78", "Delivery Fee:", "$2.99", "Service Fee:", "$3.72", "HST:", "$4.10", "Courier Tip", "$2.00", "$3.00", "$4.00", "Other", "Bag fee $0.25", "Total:", "$35.84"]);
  assert.deepEqual(r.fees, { subtotal: 24.78, delivery: 2.99, service: 3.72, tax: 4.1, other: 0.25 });   // 3 tip buttons = a chooser, not a charge
  assert.equal(r.fees.tip, undefined);
  assert.equal(r.total, 35.84);
});

test("parseCheckout: synthetic, taxes & other fees + first total wins + labels never copied from the page", () => {
  const r = P.parseCheckout(["Subtotal $10.00", "Taxes & Other Fees $3.10", "Visa \u2022\u2022\u2022\u2022 4242", "Total $13.10", "Place order \u2022 $13.10", "Order total $99.00", "Deliver to 55 Secret Ave", "Tip the courier (optional)"]);
  assert.deepEqual(r.fees, { subtotal: 10, other: 3.1 });
  assert.equal(r.total, 13.1);
  assert.ok(!JSON.stringify(r).includes("4242") && !JSON.stringify(r).includes("Secret"));
  assert.deepEqual(P.parseCheckout([]), { fees: {}, total: null, items: [], lines: [] });
});

test("normName and slug", () => {
  assert.equal(P.normName("Pizza Pizza (109 Front St E)"), "pizza pizza");
  assert.equal(P.normName("The Keg Steakhouse & Bar"), "keg steakhouse and bar");
  assert.equal(P.normName("McDonald\u2019s"), "mcdonalds");
  assert.equal(P.normName("Caf\u00e9 Landwer Restaurant"), "cafe landwer");
  assert.equal(P.normName('Neapolitan (12")'), "neapolitan");
  assert.equal(P.normName("  Pad-Thai!! "), "pad thai");
  assert.equal(P.slug("Pizzeria Libretto (University)"), "pizzeria-libretto");
});
