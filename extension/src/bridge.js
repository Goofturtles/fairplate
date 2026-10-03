/* Fairplate bridge: runs only on the Fairplate site. Hands the site what the extension captured, via
   window.postMessage to this page's own origin (never "*"). The site checks the origin and the shape of every message. */
(function () {
  "use strict";
  const ORIGIN = location.origin, version = chrome.runtime.getManifest().version;
  const post = (m) => window.postMessage(m, ORIGIN);
  let known = new Set();

  /* hello carries the ids we hold, so the site drops captures you cleared in the popup */
  function send(list, all) {
    post({ type: "fairplate:ext", version, ids: list.map((o) => o.id) });
    list.forEach((o) => { if (all || !known.has(o.id)) post({ type: "fairplate:obs", obs: o }); });
    known = new Set(list.map((o) => o.id));
  }
  const replay = () => chrome.storage.local.get("observations", (r) => send((r && r.observations) || [], true));

  chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && ch.observations) send(ch.observations.newValue || [], false); });
  window.addEventListener("message", (e) => { if (e.source === window && e.origin === ORIGIN && e.data && e.data.type === "fairplate:ping") replay(); });
  /* remember where Fairplate lives so the popup's "Open Fairplate" goes to the same site */
  const site = ORIGIN + location.pathname.replace(/[^/]*$/, "");
  chrome.storage.local.get("site", (r) => { if (!r || r.site !== site) chrome.storage.local.set({ site }); });
  replay();
})();
