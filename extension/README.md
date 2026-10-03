# Fairplate extension

Saves the real prices you see on Uber Eats, DoorDash and SkipTheDishes so Fairplate can put them side by side.
Manifest V3, one permission (`storage`), no background worker, no remote code, no network requests of its own.

## Install

1. Get the folder: download `fairplate-extension.zip` from Fairplate's **Get the extension** page (`#/extension`) and unzip it,
   or use this `extension/` folder directly.
2. Open `chrome://extensions` (Edge: `edge://extensions`), turn on **Developer mode**.
3. Click **Load unpacked** and choose the unzipped `fairplate-extension` folder (the one holding `manifest.json`).
4. Pin it, then open a restaurant on DoorDash, Skip or Uber Eats. The popup says what it captured on that tab.

The zip only talks to the published site (`https://goofturtles.github.io/fairplate/`). This `extension/` folder also runs
on `http://localhost:3540/` for development, so load the folder, not the zip, when running Fairplate locally.

## What it saves

- **Store pages:** the store's name, street, city and map point (when the page has one), the page URL, and every menu
  item's name, section and price. DoorDash's "N for $X" deals keep their text (`2 for $21.00` = $21 each, second free).
  DoorDash's delivery-fee banner is kept as shown (e.g. "$0 delivery fee, first order").
  On Skip it reads only pages with the store sidebar, never account or order pages. Without a schema.org menu (the Uber
  Eats fallback) it reads only list items inside a menu section with a heading, never the page's nav, header, cart or
  account panels.
- **Checkout pages** (`/checkout` on all three apps): only the order-summary box, the smallest block holding "Subtotal"
  and "Total". From it: subtotal, delivery, service, small-order, other fees, tax, tip, discounts, total, and cart lines
  (`2x Name $price`: name, quantity, price). Fee labels are stored as fixed names ("Delivery fee"), never as page text.
  Checkout pages rarely name the store, so a checkout is tied to one of the last 5 store pages you opened on that app
  (in the last 3 hours): the one named in the order summary, else the one whose menu has the most cart items. If none
  fits, or two fit equally, it's saved as "Store not known" instead of guessing.

## What it never saves

Your delivery address, name, email, phone number, payment details or order history. The checkout reader looks at the
order-summary text and keeps only the amounts and cart lines it recognises. It never clicks, orders or changes anything
on the page. It never logs in.

## How it gets to the site

- Captures go to `chrome.storage.local`:
  - `observations`: the captures, newest 500 kept (fewer if storage fills up); the same store/page/total inside 10
    minutes is saved once.
  - `lastStore`: the last 5 store pages per app (store details, when, and the menu item names), used only to tell which
    store a checkout belongs to.
  - `site`: the Fairplate address the bridge last ran on, so the popup's **Open Fairplate** goes there.
- `src/bridge.js` runs only on Fairplate (`https://goofturtles.github.io/fairplate/*`, plus `http://localhost:3540/*` in
  this unpacked folder; `tools/build_extension.py` leaves localhost out of the zip). It
  posts `{type:"fairplate:ext", version, ids}` and then each capture as `{type:"fairplate:obs", obs}` with
  `window.postMessage(..., location.origin)`, and live ones as they're saved.
- The site (`site/js/prices.js`) accepts messages only from its own window and origin, checks every field (finite
  numbers, capped strings, at most 400 items), and matches the store to an OpenStreetMap place: nearest place within
  250 m with a matching name, or the exact name at the same street number and street. Never by name alone, so each
  Pizza Pizza lands on its own branch. Captures it can't place are listed on `#/extension`.
- **Clear captured data** in the popup deletes everything in the extension; the site drops those captures the next
  time the bridge says hello.
- Nothing is uploaded anywhere yet. `FP.API` (a shared price database) is not switched on.

## What's tested

- `node --test extension/test/` - parsers against real DoorDash and Skip store pages captured by hand (public, not
  logged in) in `test/fixtures/`, synthetic checkout layouts (labelled synthetic: checkouts need a login), and the
  site's store matcher against the real OpenStreetMap snapshot.
- `node tools/extension_check.cjs` - Playwright: runs `parse.js` + `collect.js` on pages rebuilt from the fixtures,
  then the bridge on the live dev site, and checks the captures land on the right restaurant pages.
  Branded Chrome 137+ ignores `--load-extension` and the installed Playwright browser is the headless shell, so the
  test injects the scripts with a small `chrome.*` shim instead of loading the packed extension.
- **Uber Eats is untested against a live page.** Uber showed our test browser a bot challenge, so there is no fixture.
  It uses the same schema.org reader as DoorDash (Uber store pages are widely reported to ship the same ld+json), plus
  a text fallback (an element whose text has a name line and a `$` line). It may miss prices until checked on a real page.

## Files

`manifest.json`, `src/parse.js` (pure parsers, also `require()`-able in node), `src/collect.js` (store and checkout
pages), `src/bridge.js` (Fairplate site only), `popup.html/.js/.css`, `icons/` (drawn by `tools/build_extension.py`).
Rebuild the zip with `python tools/build_extension.py`.
