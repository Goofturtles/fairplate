/* Site side: site/js/prices.js resolving captured stores to real OpenStreetMap places (data/osm-toronto.json),
   plus its message checks. Runs places.js + prices.js in a vm with a tiny window shim. */
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm"), fs = require("node:fs"), path = require("node:path");
const P = require("../src/parse.js");
const dd = require("./fixtures/doordash-store.json");
const sk = require("./fixtures/skip-store.json");
const SITE = path.join(__dirname, "..", "..", "site");
const ORIGIN = "http://localhost:3540";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function site(quota = Infinity) {
  const mem = {}, handlers = [];
  const win = {
    location: { origin: ORIGIN }, console, setTimeout, clearTimeout,
    addEventListener: (t, f) => t === "message" && handlers.push(f), postMessage() {},
    localStorage: { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { if (String(v).length > quota) throw new Error("QuotaExceededError"); mem[k] = String(v); }, removeItem: (k) => delete mem[k] },
    fetch: async (u) => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(SITE, u), "utf8")) }),
  };
  win.window = win;
  vm.createContext(win);
  for (const f of ["js/places.js", "js/prices.js"]) vm.runInContext(fs.readFileSync(path.join(SITE, f), "utf8"), win, { filename: f });
  await win.FP.places.load(43.6525, -79.3835);
  const self = vm.runInContext("window", win);   // the page's own window as scripts inside the context see it
  win.send = (data, origin = ORIGIN, source = self) => handlers.forEach((h) => h({ source, origin, data }));
  return win;
}
const ddObs = () => { const r = P.fromSchemaOrg(dd.ld); return { id: "dd-menu-test", app: "dd", kind: "menu", store: Object.assign(r.store, { url: dd.url }), items: r.items, fees: { delivery: 0 }, note: dd.feeHeader, at: Date.now() - 5 * 60000 }; };
const skObs = () => { const r = P.fromSkip({ title: sk.title, header: sk.header, items: sk.items }); return { id: "sk-menu-test", app: "sk", kind: "menu", store: Object.assign(r.store, { url: sk.url }), items: r.items, fees: {}, at: Date.now() - 2 * 60000 }; };

test("site normName agrees with the extension's", async () => {
  const w = await site();
  for (const s of ["Pizza Pizza (109 Front St E)", "The Keg Steakhouse & Bar", "McDonald\u2019s", "Caf\u00e9 Landwer", 'Neapolitan (12")', "PIZZERIA LIBRETTO - University", ""])
    assert.equal(w.FP.prices.normName(s), P.normName(s), s);
});

test("DoorDash capture (map point) resolves to Pizzeria Libretto on University Ave, not the College St branch", async () => {
  const w = await site(), R = w.FP.prices.resolve;
  assert.equal(R(ddObs()), "n3181901871");
  const noGeo = ddObs(); noGeo.store.lat = noGeo.store.lon = null;
  assert.equal(R(noGeo), "n3181901871");   // falls back to exact name + "155 University Ave" = "155 University Avenue"
  const college = ddObs(); Object.assign(college.store, { lat: 43.65515, lon: -79.41346, address: "589 College St" });
  assert.equal(R(college), "n5431819322");
});

test("Skip capture (no map point) resolves by name + street to the right Pizza Pizza", async () => {
  const w = await site(), R = w.FP.prices.resolve;
  assert.equal(R(skObs()), "n281666193");
  const wellesley = skObs(); wellesley.store.address = "68 Wellesley St E";
  assert.equal(R(wellesley), "n4035050898");
  const nowhere = skObs(); nowhere.store.address = "";
  assert.equal(R(nowhere), null, "never by name alone");
  const wrongDir = skObs(); wrongDir.store.address = "109 Front St W";
  assert.equal(R(wrongDir), null);
});

test("map-point matching: nearest same-name branch within 250 m, generic words never match", async () => {
  const w = await site(), R = w.FP.prices.resolve;
  const at = (name, lat, lon) => ({ app: "ue", kind: "menu", store: { name, lat, lon, address: "" }, items: [{ name: "x", price: 1 }] });
  assert.equal(R(at("Pizza Pizza", 43.64869, -79.39084)), "n595987866");
  assert.equal(R(at("Pizza Pizza", 43.6487, -79.3700)), "n281666193");            // ~100 m from 109 Front St E
  assert.equal(R(at("Pizza Nova", 43.64869, -79.39084)), null);                  // shares only "pizza"
  assert.equal(R(at("Pizzeria Libretto (University)", 43.6485, -79.3850)), "n3181901871");
  assert.equal(R(at("Pizzeria Libretto", 43.6575, -79.3850)), null);             // ~1 km away and no address
});

test("map-point matching: two same-name branches in range, the capture's street address picks the branch", async () => {
  const w = await site(), R = w.FP.prices.resolve, all = w.FP.places.all;
  const a = all.find((p) => p.id === "n6403221844"), b = all.find((p) => p.id === "n6433351346");   // Ikkousha Ramen, 249 and 257 Queen St W
  assert.equal(w.FP.prices.normName(a.name), w.FP.prices.normName(b.name));
  const cap = (lat, lon, address) => ({ app: "dd", kind: "menu", store: { name: a.name, lat, lon, address }, items: [{ name: "x", price: 1 }] });
  assert.equal(R(cap(b.lat, b.lon, "249 Queen St W")), "n6403221844");   // map point sits on the other branch: the address decides
  assert.equal(R(cap(a.lat, a.lon, "257 Queen Street West")), "n6433351346");
  assert.equal(R(cap(b.lat, b.lon, "")), "n6433351346");                  // no address: nearest
});

test("messages can't choose the place or use inherited names as the app", async () => {
  const w = await site(), X = w.FP.prices;
  for (const app of ["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"])
    assert.equal(X.add({ app, kind: "menu", store: { name: "x" }, items: [{ name: "a", price: 1 }] }), false, app);
  w.send({ type: "fairplate:obs", obs: { id: "spoof", app: "dd", kind: "menu", place: "n281666193", store: { name: "Totally Different" }, items: [{ name: "a", price: 1 }] } });
  X.add({ id: "api", app: "dd", kind: "menu", place: "n281666193", store: { name: "Pizza Pizza" }, items: [{ name: "a", price: 1 }] }, "api");
  await wait(60);
  assert.equal(X.all.find((o) => o.id === "spoof").place, undefined, "a message's place is ignored: its store goes through resolve()");
  assert.equal(X.all.find((o) => o.id === "api").place, "n281666193", "the backend's place is kept");
  assert.equal(X.count, 2);
});

test("localStorage full: keeps the newest captures that fit, never a stale copy", async () => {
  const w = await site(20000), X = w.FP.prices;
  const big = (i) => ({ id: "q" + i, app: "ue", kind: "menu", store: { name: "Store " + i }, items: Array.from({ length: 10 }, (_, k) => ({ name: `Item ${k} ${"x".repeat(40)}`, price: k })) });
  X.add(big(0));
  await wait(60);
  assert.equal(JSON.parse(w.localStorage.getItem("fairplate-obs-v1")).length, 1);
  for (let i = 1; i < 40; i++) X.add(big(i));
  await wait(60);
  const kept = JSON.parse(w.localStorage.getItem("fairplate-obs-v1"));
  assert.ok(kept.length > 1 && kept.length < 40, `kept ${kept.length}`);
  assert.equal(kept[kept.length - 1].id, "q39");
  assert.equal(X.count, 40, "memory keeps them all");
});

test("messages: origin + shape checks, hello sets FP.ext, captures resolve, popup clears sync", async () => {
  const w = await site(), X = w.FP.prices;
  let changes = 0; X.onChange(() => changes++);
  w.send({ type: "fairplate:obs", obs: ddObs() }, "https://evil.example");
  w.send({ type: "fairplate:obs", obs: ddObs() }, ORIGIN, {});
  assert.equal(X.count, 0, "wrong origin / source ignored");
  assert.equal(w.FP.ext.connected, false);
  w.send({ type: "fairplate:ext", version: "1.0.0", ids: ["dd-menu-test", "sk-menu-test"] });
  w.send({ type: "fairplate:obs", obs: ddObs() });
  w.send({ type: "fairplate:obs", obs: ddObs() });   // replayed: deduped by id
  w.send({ type: "fairplate:obs", obs: skObs() });
  w.send({ type: "fairplate:obs", obs: { app: "dd", kind: "menu", store: { name: "x" }, items: [{ name: "a", price: NaN }] } });
  w.send({ type: "fairplate:obs", obs: { app: "zz", kind: "menu", items: [{ name: "a", price: 1 }] } });
  await wait(60);
  assert.deepEqual(JSON.parse(JSON.stringify(w.FP.ext)), { connected: true, version: "1.0.0" });
  assert.equal(X.count, 2);
  assert.equal(changes, 1, "one re-render for the batch");
  assert.equal(X.latest("n3181901871", "menu").dd.items.length, 5);
  assert.equal(X.latest("n281666193").sk.items[0].price, 9.99);
  assert.deepEqual(Object.keys(X.latest("n5431819322")), []);
  w.send({ type: "fairplate:ext", version: "1.0.0", ids: ["sk-menu-test"] });   // DoorDash capture cleared in the popup
  await wait(60);
  assert.equal(X.count, 1);
  assert.equal(X.all[0].id, "sk-menu-test");
});

test("sanitising: caps, finite numbers, safe URLs", async () => {
  const w = await site(), X = w.FP.prices;
  const items = Array.from({ length: 500 }, (_, i) => ({ name: "Item " + i + "x".repeat(300), price: i, section: "<b>s</b>" }));
  X.add({ id: "big", app: "ue", kind: "menu", store: { name: "A".repeat(999), url: "javascript:alert(1)", lat: "43.6", lon: Infinity }, items, fees: { delivery: "3", tax: 1.234 } });
  X.add({ app: "dd", kind: "checkout", store: { name: "No total" }, items: [], fees: {} });
  const o = X.all.find((x) => x.id === "big");
  assert.equal(o.items.length, 400);
  assert.equal(o.items[0].name.length, 120);
  assert.equal(o.store.name.length, 120);
  assert.equal(o.store.url, "");
  assert.equal(o.store.lat, null);
  assert.equal(o.store.lon, null);
  assert.deepEqual(JSON.parse(JSON.stringify(o.fees)), { tax: 1.23 });
  assert.equal(X.count, 1, "checkout without a total is rejected");
});
