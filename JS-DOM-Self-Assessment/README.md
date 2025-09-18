# Deployment

<a href="https://web-dev-class.kushshah.net/JS-DOM-Self-Assessment/">Deployment Link</a>

# San Francisco Stays Explorer

This project turns the provided Airbnb dataset into an interactive gallery that loads the first 50 listings with async JavaScript. Each card highlights the listing details, host information, and a custom explorer score designed to surface high-impact stays at a glance.

## Features

- Fetches `airbnb_sf_listings_500.json` with `fetch`/`await` and renders the first 50 listings dynamically.
- Displays name, description, amenities, nightly price, host details, review insights, and a lazy-loaded thumbnail.
- Amenity search box filters results in real time and highlights matching amenity badges.
- Additional refinements for price range, minimum rating, and beds so you can narrow the dataset quickly.
- Theme toggle remembers your dark/light preference and updates the palette without reloading.
- Explorer score meter blends rating, review volume, and amenity depth into a quick visual signal (creative addition).

## Project Structure

- `index.html` - Page skeleton, controls, and an HTML template used for each listing card.
- `styles.css` - Modern, responsive layout for the gallery, amenity chips, filters, and explorer score meter.
- `script.js` - Fetches the JSON, prepares listing data, renders cards, and wires up the filters and theme toggle.
- `airbnb_sf_listings_500.json` - Source data with 500 San Francisco Airbnb listings (the page uses the first 50).

## Implementation Notes

- Amenities are stored as a JSON string inside the dataset; the client parses them and caps the visible badges to keep cards compact while indicating how many remain.
- Descriptions may contain HTML markup from the dataset. The renderer strips unsafe tags and preserves simple formatting.
- The explorer score is intentionally opinionated: 55% guest rating, 25% review volume (log scaled), and 20% amenity depth.
