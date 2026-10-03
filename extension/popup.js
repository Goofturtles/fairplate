/* Popup: what this tab has captured, totals, the last 5 captures. Page text goes in with textContent only. */
const APPS = { ue: "Uber Eats", dd: "DoorDash", sk: "Skip" }, BADGE = { ue: "Ue", dd: "DD", sk: "S" };
const $ = (id) => document.getElementById(id);
const money = (n) => (n < 0 ? "-$" : "$") + Math.abs(n).toFixed(2);
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`; };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

function statusText(st) {
  if (!st || !APPS[st.app]) return null;
  const A = APPS[st.app];
  if (st.page === "menu" && st.count) return `${A} menu: ${plural(st.count, "price")} captured for ${st.store}${st.dup ? " (already saved in the last 10 min)" : ""}`;
  if (st.page === "checkout" && st.total != null) return `${A} checkout: ${money(st.total)} total captured${st.store ? ` for ${st.store}` : ""}`;
  if (st.page === "checkout") return `${A} checkout: waiting for the order summary (Subtotal and Total).`;
  if (st.page === "menu") return `${A}: no menu prices found on this page yet.`;
  return `You're on ${A}. Open a restaurant page to capture its menu prices.`;
}
function showStatus(st) {
  const t = statusText(st), p = $("status");
  p.textContent = t || "Open a restaurant or checkout page on Uber Eats, DoorDash or Skip.";
  $("now").dataset.state = st && (st.count || st.total != null) ? "ok" : t ? "wait" : "idle";   // dot: green captured, amber on an app, grey elsewhere
}
function pollTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab) return showStatus(null);
    chrome.tabs.sendMessage(tab.id, { type: "fairplate:status" }, (st) => { void chrome.runtime.lastError; showStatus(st); });   // no reply = not a delivery-app tab
  });
}

function stat(n, label) { const d = el("div", "stat"); d.append(el("b", "", n.toLocaleString()), el("span", "", label)); return d; }
function showData(list) {
  const chk = list.filter((o) => o.kind === "checkout").length;
  const stores = new Set(list.map((o) => `${o.app}|${(o.store.name || "").toLowerCase()}|${(o.store.address || "").toLowerCase()}`));
  $("stats").replaceChildren(stat(list.length, list.length === 1 ? "capture" : "captures"), stat(stores.size, stores.size === 1 ? "store" : "stores"), stat(chk, chk === 1 ? "checkout" : "checkouts"));
  $("clear").disabled = !list.length;
  const recent = list.slice(-5).reverse(), ol = $("recent");
  if (!recent.length) {
    const li = el("li", "empty");
    li.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7"/></svg>';   // static icon only; text goes in with textContent
    li.append(el("span", "", "Nothing yet. Open a restaurant on Uber Eats, DoorDash or Skip."));
    return ol.replaceChildren(li);
  }
  ol.replaceChildren(...recent.map((o) => {
    const li = el("li"), what = el("div", "what"), b = el("span", `ab ${o.app}`, BADGE[o.app]);
    b.setAttribute("aria-hidden", "true");
    const detail = o.kind === "checkout" ? `${money(o.total)} checkout total` : plural(o.items.length, "menu price");
    what.append(el("b", "", o.store.name || "Store not known yet"), el("span", "", `${APPS[o.app]} \u00b7 ${detail} \u00b7 ${ago(o.at)}`));
    li.append(b, what);
    return li;
  }));
}
const load = () => chrome.storage.local.get("observations", (r) => showData((r && r.observations) || []));

$("ver").textContent = "v" + chrome.runtime.getManifest().version;
/* light / dark (theme.js applied the saved or system theme before paint) */
const themeLabel = () => $("theme").setAttribute("aria-label", document.documentElement.dataset.theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
themeLabel();
$("theme").addEventListener("click", () => {
  const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = t; try { localStorage.setItem("fp-theme", t); } catch (e) {}
  themeLabel();
});
$("open").addEventListener("click", () => chrome.storage.local.get("site", (r) => { chrome.tabs.create({ url: ((r && r.site) || "https://goofturtles.github.io/fairplate/") + "#/feed" }); window.close(); }));
let armed = false;
$("clear").addEventListener("click", () => {
  const b = $("clear");
  if (!armed) { armed = true; b.textContent = "Click again to delete everything captured"; b.classList.add("danger"); setTimeout(() => { armed = false; b.textContent = "Clear captured data"; b.classList.remove("danger"); }, 4000); return; }
  chrome.storage.local.remove(["observations", "lastStore"], () => { armed = false; b.textContent = "Cleared"; b.classList.remove("danger"); });
});
chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && ch.observations) showData(ch.observations.newValue || []); });
load();
pollTab();
setInterval(pollTab, 1500);
