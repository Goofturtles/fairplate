/* Runs in <head> before the popup paints: saved light/dark choice, else the system setting (no flash of the wrong theme). */
(function () {
  let t = null;
  try { t = localStorage.getItem("fp-theme"); } catch (e) {}
  if (t !== "light" && t !== "dark") t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = t;
})();
