# San Francisco Stays Explorer

This project turns the provided Airbnb dataset into an interactive gallery that loads the first 50 listings with async JavaScript. Each card highlights the listing details, host information, and a custom explorer score designed to surface high-impact stays at a glance.

## Features

- Fetches `airbnb_sf_listings_500.json` with `fetch`/`await` and renders the first 50 listings dynamically.
- Displays name, description, amenities, nightly price, host details, review insights, and a lazy-loaded thumbnail.
- Amenity search box filters results in real time and highlights matching amenity badges.
- Additional refinements for price range, minimum rating, and beds so you can narrow the dataset quickly.
- Theme toggle remembers your dark/light preference and updates the palette without reloading.
- Explorer score meter blends rating, review volume, and amenity depth into a quick visual signal (creative addition).
- Accessible-by-default markup including `aria-live` status updates, semantic sections, and keyboard-friendly focus styles.

## Getting Started

Because browsers block `fetch` from the local filesystem, use a lightweight static server:

```bash
# Option 1: using npm 6+
npx http-server .

# Option 2: using Python 3
python -m http.server 8000
```

Then open `http://localhost:8080` (or the port printed in your terminal) in your browser. The app automatically loads the dataset and renders the listing cards.

## Project Structure

- `index.html` - Page skeleton, controls, and an HTML template used for each listing card.
- `styles.css` - Modern, responsive layout for the gallery, amenity chips, filters, and explorer score meter.
- `script.js` - Fetches the JSON, prepares listing data, renders cards, and wires up the filters and theme toggle.
- `airbnb_sf_listings_500.json` - Source data with 500 San Francisco Airbnb listings (the page uses the first 50).

## Implementation Notes

- Amenities are stored as a JSON string inside the dataset; the client parses them and caps the visible badges to keep cards compact while indicating how many remain.
- Descriptions may contain HTML markup from the dataset. The renderer strips unsafe tags and preserves simple formatting.
- Images and avatar photos fall back to inline SVG placeholders when no remote asset is available.
- The explorer score is intentionally opinionated: 55% guest rating, 25% review volume (log scaled), and 20% amenity depth.

## Ideas for Extension

1. Add sorting controls (price, rating, review count) alongside the amenity filter.
2. Integrate a map view that plots the fetched coordinates.
3. Provide pagination or lazy loading beyond the first 50 listings.
