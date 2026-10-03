/* Fairplate demo data. Every restaurant is fictional and every price is a demo number.
   Real prices would come from the browser extension reading each app's own pages. */
window.FP = window.FP || {};

FP.TAX = 0.13; // Ontario HST, applied to menu + delivery + service

FP.APPS = {
  sk: { key: "sk", name: "Skip", short: "Skip", badge: "S", delivery: 3.99, service: 0.10, url: "https://www.skipthedishes.com/" },
  ue: { key: "ue", name: "Uber Eats", short: "UE", badge: "Ue", delivery: 0.49, service: 0.15, url: "https://www.ubereats.com/" },
  dd: { key: "dd", name: "DoorDash", short: "DD", badge: "DD", delivery: 2.99, service: 0.15, url: "https://www.doordash.com/",
        pass: { name: "DashPass", price: 9.99, delivery: 0, service: 0.10 } },
};
FP.APP_ORDER = ["sk", "ue", "dd"];

/* Items: store = the restaurant's own price; sk/ue/dd = that app's menu price.
   chips = which prices the menu card shows, in order. */
const QSB_MENU = [
  { id: "smash", name: "Smash Burger Combo", short: "Smash Combo", cat: "burgers", best: true, img: "burger", desc: "Double patty, fries, drink", cal: 980, protein: 42,
    store: 13.49, sk: 14.49, dd: 15.49, ue: 16.19, tag: ["ink", "BEST SELLER"], chips: ["store", "sk", "ue"], promo: "−7%" },
  { id: "poutine", name: "Classic Poutine", cat: "sides", best: true, img: "poutine", desc: "Fries, curds, gravy", cal: 740,
    store: 8.49, sk: 9.10, dd: 9.79, ue: 10.49, tag: ["warn", "MARKUP +24% ON UE"], chips: ["store", "sk", "ue"] },
  { id: "tenders", name: "Chicken Tenders", cat: "burgers", best: true, img: "friedchicken", desc: "4 pieces, honey dip", cal: 610,
    store: 10.49, sk: 11.20, dd: 11.99, ue: 12.49, tag: ["soft", "NEW"], chips: ["store", "sk", "dd"] },
  { id: "salad", name: "Greek Chicken Salad", cat: "salads", best: true, img: "salad", desc: "Quinoa, feta, olives", cal: 520,
    store: 12.99, dd: 13.99, sk: 14.20, ue: 14.79, tag: ["soft", "LIGHT"], chips: ["store", "dd", "sk"] },
  { id: "tacos", name: "Fish Tacos", cat: "burgers", best: true, img: "tacos", desc: "Two tacos, slaw, chipotle mayo", cal: 560,
    store: 11.99, sk: 12.90, dd: 13.80, ue: 14.39, chips: ["store", "sk", "dd"] },
  { id: "brownie", name: "Double Brownie", cat: "desserts", best: true, img: "brownies", desc: "Dark chocolate, raspberry", cal: 430,
    store: 4.99, sk: 5.39, dd: 5.69, ue: 5.99, chips: ["store", "sk", "ue"] },
  { id: "cheesecake", name: "NY Cheesecake", cat: "desserts", best: true, img: "cheesecake", desc: "Baked, graham crust", cal: 510,
    store: 6.49, dd: 6.99, sk: 7.10, ue: 7.49, chips: ["store", "dd", "sk"] },
  { id: "nanaimo", name: "Nanaimo Bar", cat: "desserts", best: true, img: "nanaimo", desc: "Custard, chocolate, coconut", cal: 390,
    store: 3.99, sk: 4.29, dd: 4.49, ue: 4.79, chips: ["store", "sk", "ue"] },
  { id: "fries", name: "Large Fries", short: "Fries", cat: "sides", img: "poutine", desc: "Hand-cut, sea salt", cal: 380,
    store: 4.49, sk: 5.01, dd: 5.21, ue: 5.38, chips: ["store", "sk", "dd"] },
];

/* Other restaurants: `typical` is the all-in total (no tip) for one of their signature item.
   calibrate() below turns those totals into per-app item prices, so the engine reproduces them exactly. */
FP.RESTAURANTS = [
  { id: "qsb", name: "Queen St Burger Co.", img: "burger", hero: "hero-plate", cuisine: "Burgers, Fries, Shakes", cat: "burgers", price: "$$",
    rating: 4.6, count: "1,000+", eta: { sk: 35, ue: 22, dd: 28 }, feedEta: 22, km: 1.2, walk: 8, addr: "542 Queen St W", open: "Open till 2 AM",
    blurb: "Smash burgers, hand-cut fries and shakes on Queen West. Open until 2 AM. Same kitchen on every app, but not the same price.",
    menu: QSB_MENU, typicalItems: { smash: 1 } },
  { id: "nonnas", name: "Nonna's Slice", img: "pizza", cuisine: "Pizza, Italian", cat: "pizza", price: "$", rating: 4.7, count: "900+", feedEta: 18, km: 0.9,
    typical: { item: "Margherita Pie", store: 14.49, sk: 19.40, dd: 22.10, ue: 25.60 }, flag: "save" },
  { id: "kinthai", name: "Kin Thai Kitchen", img: "padthai", cuisine: "Thai", cat: "thai", price: "$$", rating: 4.6, count: "1,200+", feedEta: 25, km: 1.6,
    typical: { item: "Pad Thai", store: 15.99, sk: 21.40, dd: 22.80, ue: 24.90 }, flag: "dropped" },
  { id: "sakura", name: "Sakura Roll House", img: "sushi", cuisine: "Sushi, Japanese", cat: "sushi", price: "$$", rating: 4.8, count: "600+", feedEta: 30, km: 2.1,
    typical: { item: "Salmon Roll Platter", store: 19.99, dd: 31.20, sk: 32.60, ue: 34.90 }, flag: "winner" },
  { id: "birdbox", name: "Bird Box Chicken", img: "friedchicken", cuisine: "Fried chicken", cat: "chicken", price: "$", rating: 4.7, count: "2k+", feedEta: 24, km: 1.2,
    typical: { item: "3-Piece Box", store: 11.49, sk: 18.20, dd: 19.90, ue: 21.10 } },
  { id: "pitalane", name: "Pita Lane", img: "shawarma", cuisine: "Shawarma, Middle Eastern", cat: "shawarma", price: "$", rating: 4.5, count: "800+", feedEta: 20, km: 0.7,
    typical: { item: "Chicken Shawarma Wrap", store: 10.99, sk: 15.60, dd: 16.40, ue: 18.90 } },
  { id: "mamalin", name: "Mama Lin's Dumplings", img: "dumplings", cuisine: "Dumplings, Chinese", cat: "dumplings", price: "$", rating: 4.8, count: "1,500+", feedEta: 27, km: 1.9,
    typical: { item: "12 Pork Dumplings", store: 7.99, sk: 12.40, dd: 13.20, ue: 13.90 } },
  { id: "uzu", name: "Uzu Ramen", img: "ramen", cuisine: "Ramen, Japanese", cat: "ramen", price: "$$", rating: 4.6, count: "700+", feedEta: 26, km: 1.4,
    typical: { item: "Tonkotsu Ramen", store: 12.49, dd: 16.80, sk: 17.40, ue: 18.60 } },
  { id: "taconorte", name: "Taco Norte", img: "tacos", cuisine: "Tacos, Mexican", cat: "tacos", price: "$", rating: 4.5, count: "500+", feedEta: 21, km: 1.1,
    typical: { item: "Three Tacos", store: 9.99, ue: 14.10, sk: 14.90, dd: 15.30 } },
  { id: "falafel", name: "Falafel Stop", img: "falafel", cuisine: "Falafel, Vegetarian", cat: "healthy", price: "$", rating: 4.4, count: "400+", feedEta: 19, km: 0.8,
    typical: { item: "Falafel Plate", store: 7.49, sk: 10.90, dd: 11.60, ue: 12.20 } },
  { id: "saffron", name: "Saffron House", img: "tandoori", cuisine: "Indian", cat: "indian", price: "$$", rating: 4.7, count: "1,100+", feedEta: 32, km: 2.4,
    typical: { item: "Tandoori Chicken", store: 16.99, sk: 24.80, dd: 26.10, ue: 27.90 } },
];

FP.CATEGORIES = [
  ["burgers", "Burgers", "burger"], ["pizza", "Pizza", "pizza"], ["sushi", "Sushi", "sushi"], ["thai", "Thai", "padthai"],
  ["indian", "Indian", "curry"], ["shawarma", "Shawarma", "shawarma"], ["poutine", "Poutine", "poutine"], ["dumplings", "Dumplings", "dumplings"],
  ["ramen", "Ramen", "ramen"], ["tacos", "Tacos", "tacos"], ["healthy", "Healthy", "salad"], ["dessert", "Dessert", "cheesecake"],
];

/* Price history of the demo basket on Skip (all-in, no tip). Last point = tonight. */
FP.HISTORY = {
  "1 month": { labels: ["Aug 4", "Aug 25", "Sep 15", "Tonight"],
    points: [49.28, 49.92, 48.80, 52.00, 50.88, 52.80, 50.24, 51.36, 49.60, 48.32, 47.40, 46.76] },
  "3 months": { labels: ["Jul 1", "Jul 29", "Aug 26", "Tonight"],
    points: [51.20, 52.40, 50.10, 53.60, 54.20, 51.80, 49.90, 52.70, 50.30, 51.90, 49.20, 48.40, 50.60, 48.10, 47.30, 46.76] },
  "1 year": { labels: ["Oct", "Jan", "May", "Tonight"],
    points: [44.90, 45.80, 47.20, 46.40, 48.90, 50.30, 49.10, 51.60, 52.40, 50.90, 53.10, 51.40, 49.80, 48.30, 47.10, 46.76] },
};

FP.MEMBERSHIP = { month: "September", orders: 3, ddFees: 18.20, ddFeesWithPass: 3.60, passPrice: 9.99, ueCost: 2.30 };

FP.ADDRESSES = [
  ["100 Queen St W", "Toronto, ON"], ["100 Queen St E", "Toronto, ON"], ["100 Queensway", "Etobicoke, ON"], ["100 Queen St", "Brampton, ON"],
  ["100 King St W", "Toronto, ON"], ["100 Bloor St W", "Toronto, ON"], ["100 Spadina Ave", "Toronto, ON"], ["100 Dundas St W", "Toronto, ON"],
];

/* Turn each `typical` total into menu prices the engine reproduces to the cent. */
(function calibrate() {
  const r2 = (n) => Math.round(n * 100) / 100;
  for (const r of FP.RESTAURANTS) {
    if (r.menu) continue;
    const t = r.typical, item = { id: "sig", name: t.item, cat: r.cat, best: true, img: r.img, desc: r.cuisine, cal: 700, store: t.store };
    for (const k of FP.APP_ORDER) {
      const a = FP.APPS[k];
      const base = r2((t[k] / (1 + FP.TAX) - a.delivery) / (1 + a.service));
      const total = (m, d) => { const s = r2(m * a.service), sub = m + d + s; return r2(sub + r2(sub * FP.TAX)); };
      // cent rounding can make a total unreachable; nudge the item price, then this restaurant's delivery fee
      search: for (const dn of [0, 0.01, -0.01, 0.02, -0.02]) {
        for (const mn of [0, 0.01, -0.01, 0.02, -0.02, 0.03, -0.03]) {
          const m = r2(base + mn), d = r2(a.delivery + dn);
          if (Math.abs(total(m, d) - t[k]) < 0.005) {
            item[k] = m;
            if (dn) (r.fees = r.fees || {})[k] = { delivery: d };
            break search;
          }
        }
      }
      if (item[k] === undefined) item[k] = base;
    }
    r.menu = [item];
    r.typicalItems = { sig: 1 };
    r.eta = { sk: r.feedEta + 10, ue: r.feedEta, dd: r.feedEta + 5 };
    r.walk = Math.round(r.km * 12);
    r.addr = r.addr || "Queen West, Toronto";
    r.open = "Open till 11 PM";
    r.blurb = `${r.cuisine} near Queen West. Same kitchen on every app, but not the same price.`;
  }
})();
