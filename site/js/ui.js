/* Small view helpers + animation utilities shared by every page. */
(function () {
  const E = FP.engine;
  const reduce = () => document.body.classList.contains("still") || matchMedia("(prefers-reduced-motion: reduce)").matches;

  const I = (name, cls = "", style = "") => `<svg class="ic ${cls}"${style ? ` style="${style}"` : ""}><use href="#i-${name}"/></svg>`;
  const badge = (k, sm = false, style = "") =>
    k === "pickup" ? `<span class="ab ${sm ? "sm " : ""}st"${style ? ` style="${style}"` : ""}>${I("walk", "s", sm ? "width:12px;height:12px" : "")}</span>`
    : k === "store" ? `<span class="ab ${sm ? "sm " : ""}st">${I("store", "s", "width:12px;height:12px")}</span>`
    : `<span class="ab ${sm ? "sm " : ""}${k}"${style ? ` style="${style}"` : ""}>${FP.APPS[k].badge}</span>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const $ = E.money;
  const img = (name) => `img/${name}.jpg`;

  const SIGNAL = (fill = "#0E0F12") => `<svg viewBox="0 0 70 12" fill="${fill}"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/><path d="M29 4.5a9 9 0 0 1 12 0l-1.6 1.7a6.6 6.6 0 0 0-8.8 0zM31.6 7.3a5.2 5.2 0 0 1 6.8 0L35 11z"/><rect x="47" y="1" width="21" height="10.5" rx="3" fill="none" stroke="${fill}"/><rect x="49" y="3" width="15" height="6.5" rx="1.5"/></svg>`;
  const status = (light = false, style = "") => `<div class="status"${light || style ? ` style="${light ? "color:#fff;" : ""}${style}"` : ""}><span>9:41</span>${SIGNAL(light ? "#fff" : "#0E0F12")}</div><div class="status-gap"></div>`;

  const tabbar = (on) => `<nav class="tabbar" aria-label="Main">${[["home", "Home", "#/"], ["search", "Search", "#/search"], ["chart", "Price watch", "#/history"], ["heart", "Saved", "#/results?saved=1"], ["user", "Me", "#/membership"]]
    .map(([ic, lab, href]) => `<a href="${href}" class="${lab === on ? "on" : ""}">${I(ic)}${lab}</a>`).join("")}</nav><div class="homebar"></div>`;

  /* price strip: cheapest first, cheapest highlighted */
  function pcs(quotes, extra = "") {
    const sorted = [...quotes].sort((a, b) => a.total - b.total);
    return `<div class="pcs">${sorted.map((q, i) => `<span${i === 0 ? ' class="best"' : ""}>${FP.APPS[q.app].short} ${$(q.total)}</span>`).join("")}${extra}</div>`;
  }

  /* ---------- motion ---------- */
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  function countUp(el, to, from, ms = 750, fmt = $) {
    if (from === undefined) from = parseFloat(el.dataset.prev || "0");
    el.dataset.prev = to;
    if (reduce() || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    (function tick(now) {
      const t = Math.min(1, (now - t0) / ms);
      el.textContent = fmt(from + (to - from) * easeOut(t));
      if (t < 1) requestAnimationFrame(tick);
    })(t0);
  }
  /* animate every [data-count] inside root from its previous value */
  function counts(root, fromZero = false) {
    root.querySelectorAll("[data-count]").forEach((el) => {
      const to = parseFloat(el.dataset.count), fmt = el.dataset.fmt === "signed" ? E.signed : el.dataset.fmt === "plus" ? (n) => "+$" + n.toFixed(2) : $;
      countUp(el, to, fromZero ? 0 : undefined, 800, fmt);
    });
  }
  function stagger(root) {
    root.querySelectorAll("[data-stagger]").forEach((box) => [...box.children].forEach((c, i) => c.style.setProperty("--i", i)));
  }
  let io;
  function reveals(root) {
    if (io) io.disconnect();
    if (reduce()) { root.querySelectorAll(".reveal").forEach((el) => el.classList.add("in")); return; }
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }
  /* FLIP: call before a DOM reorder, run the returned fn after it */
  function flip(container) {
    const kids = [...container.children], first = new Map(kids.map((k) => [k, k.getBoundingClientRect().top]));
    return () => {
      if (reduce()) return;
      [...container.children].forEach((k) => {
        const dy = (first.get(k) ?? 0) - k.getBoundingClientRect().top;
        if (!dy) return;
        k.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    };
  }
  /* segmented controls: add a sliding thumb under the active option */
  function segs(root) {
    root.querySelectorAll(".seg").forEach((seg) => {
      let th = seg.querySelector(".thumb");
      if (!th) { th = document.createElement("i"); th.className = "thumb"; seg.prepend(th); seg.classList.add("slid"); th.style.transition = "none"; }
      const on = seg.querySelector("span.on");
      if (!on) { th.style.opacity = 0; return; }
      th.style.opacity = 1; th.style.left = on.offsetLeft + "px"; th.style.width = on.offsetWidth + "px";
      requestAnimationFrame(() => (th.style.transition = ""));
    });
  }
  function collapse(el, done) {
    if (reduce()) { el.remove(); done && done(); return; }
    el.classList.add("collapse");
    el.style.height = el.offsetHeight + "px";
    requestAnimationFrame(() => { el.style.height = "0px"; el.style.opacity = "0"; el.style.marginTop = el.style.marginBottom = "0px"; el.style.paddingTop = el.style.paddingBottom = "0px"; });
    setTimeout(() => { el.remove(); done && done(); }, 380);
  }
  function accordion(el, open) {
    el.classList.add("acc");
    const inner = el.firstElementChild;
    el.style.height = (open ? inner.offsetHeight : 0) + "px";
  }
  let toastT;
  function toast(msg) {
    document.querySelectorAll(".toast").forEach((t) => t.remove());
    const t = document.createElement("div");
    t.className = "toast" + (document.querySelector(".webp") ? " web" : "");
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastT);
    toastT = setTimeout(() => t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250 }).onfinish = () => t.remove(), 2400);
  }
  function bump(el) { if (!el) return; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }

  FP.ui = { I, badge, esc, $, img, status, tabbar, pcs, countUp, counts, stagger, reveals, flip, segs, collapse, accordion, toast, bump, reduce, SIGNAL };
})();
