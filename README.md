# Fairplate

**Live:** https://goofturtles.github.io/fairplate/

Uber Eats, DoorDash and SkipTheDishes each show a different menu price, delivery fee and service fee for the same
restaurant. Fairplate puts the real totals side by side, with menu markup, fees and 13% HST included, so you can see
which app is cheapest before you order.

Built for LovHack Season 3.

## How it works

- **Places** come from OpenStreetMap: a snapshot of downtown Toronto that refreshes live from the Overpass API.
  Addresses use Nominatim, and opening hours come from OSM's `opening_hours` tag.
- **Prices come only from the Fairplate browser extension** (`extension/`). It saves the menu prices and checkout fees
  you see on the three apps, and the site lines them up. Nothing is estimated or invented: a place with no captured
  prices shows "No price yet".
- Captured prices stay in your own browser (extension storage and the site's localStorage). There's no shared server yet.
- Food photos are examples of the cuisine, labelled as examples, never shown as a restaurant's own.
- The map is a 3D city view (MapLibre GL with OpenFreeMap vector tiles). It loads only when you open Map view.
- Light and dark mode. Phone layout with a List / Map switch.

## Extension

Download `fairplate-extension.zip` from the site's **Get the extension** page, unzip it, then in `chrome://extensions`
turn on Developer mode and click **Load unpacked**. Details and exactly what it saves are in
[extension/README.md](extension/README.md). It has one permission (`storage`) and makes no network requests of its own.

## Run locally

```
python -m http.server 3540 -d site
```

Then open http://localhost:3540/. No build step: plain HTML, CSS and JavaScript. For local work, load the `extension/`
folder unpacked rather than the zip (the folder also runs on localhost:3540).

Extension tests: `node --test extension/test/`

## Credits

- Built by Arjun Sharma. The code was written with AI assistance (Claude).
- Map data © OpenStreetMap contributors (ODbL). Tiles: OpenFreeMap. Map engine: MapLibre GL JS. Geocoding: Nominatim.
- Photos: TheMealDB and Pexels, listed in [site/PHOTO-CREDITS.md](site/PHOTO-CREDITS.md). Font: Inter (SIL OFL).
- Not affiliated with Uber Eats, DoorDash or SkipTheDishes.
