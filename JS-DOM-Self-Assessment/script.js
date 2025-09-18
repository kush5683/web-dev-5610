// Entry point constants for data retrieval and UI behavior
const DATA_URL = "airbnb_sf_listings_500.json"; // Dataset path containing 500 SF listings
const MAX_LISTINGS = 50; // Upper bound of items rendered on the page
const AMENITIES_TO_SHOW = 8; // Limit amenities chips per card before showing a "+more" badge

// Fallback imagery ensures the layout stays balanced when remote assets are missing
const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'><rect width='640' height='360' fill='%23f2f2f2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23909090' font-family='Arial, sans-serif' font-size='28'>Image coming soon</text></svg>";
const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' rx='12' fill='%23d1d5db'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial, sans-serif' font-size='28'>SF</text></svg>";

// Theme key keeps the user's preference sticky between sessions
const THEME_STORAGE_KEY = "sf-stays-theme";

// Human readable labels for the refinement controls
const PRICE_DESCRIPTIONS = {
    "lt150": "price under $150",
    "150-300": "price between $150 and $300",
    "gt300": "price over $300",
};
const RATING_DESCRIPTIONS = {
    "4": "rating 4.0+",
    "4.5": "rating 4.5+",
    "4.8": "rating 4.8+",
};
const BED_DESCRIPTIONS = {
    "1": "1+ beds",
    "2": "2+ beds",
    "3": "3+ beds",
    "4": "4+ beds",
};

// Core DOM references for rendering, user feedback, and interactivity
const gridEl = document.querySelector("#listing-grid");
const statusEl = document.querySelector("#listing-status");
const filterInput = document.querySelector("#amenity-filter");
const priceFilter = document.querySelector("#price-filter");
const ratingFilter = document.querySelector("#rating-filter");
const bedsFilter = document.querySelector("#beds-filter");
const themeToggle = document.querySelector("#theme-toggle");
const themeToggleIcon = themeToggle?.querySelector(".theme-toggle__icon");
const themeToggleText = themeToggle?.querySelector(".theme-toggle__text");
const cardTemplate = document.querySelector("#listing-card-template");

// Live state for rendered listings and active filter selections
let allListings = [];
const currentFilters = {
    amenity: "", // Current amenity keyword typed by the user
    price: "any", // Selected price band
    rating: "any", // Minimum rating threshold
    beds: "any", // Minimum bed count requirement
};

// Kick off initialization as soon as the script loads
init();

function init() {
    // Guard clause stops execution when essential DOM nodes are missing
    if (!gridEl || !statusEl || !filterInput || !cardTemplate) {
        console.error("Missing critical DOM nodes. Double-check the HTML structure.");
        return;
    }

    // Configure theme on initial load and set up the toggle handler
    initTheme();

    // Amenity search reacts on each input change
    filterInput.addEventListener("input", handleAmenityFilterChange);

    // Each select filter shares the same change handling pipeline
    [
        [priceFilter, (value) => (currentFilters.price = value)],
        [ratingFilter, (value) => (currentFilters.rating = value)],
        [bedsFilter, (value) => (currentFilters.beds = value)],
    ].forEach(([element, applyValue]) => {
        if (!element) {
            return; // Skip absent controls so the page still works without them
        }
        element.addEventListener("change", (event) => {
            applyValue(event.target.value);
            applyFilters();
        });
    });

    // Fetch listings and render them once
    loadListings();
}

async function loadListings() {
    // Announce the loading state to screen readers and sighted users
    updateStatus("Loading listings...");

    // Retrieve and normalize the dataset (we only run against the provided JSON)
    const response = await fetch(DATA_URL);
    const rawListings = await response.json();
    allListings = rawListings.slice(0, MAX_LISTINGS).map((listing) => prepareListing(listing));

    // Apply any active filters now that data is available
    applyFilters();
}

function prepareListing(listing) {
    // Normalize raw fields into structures that are easier to consume later
    const amenitiesList = parseAmenities(listing.amenities);
    const vibeScore = computeExplorerScore(listing, amenitiesList);
    const priceValue = parsePrice(listing.price);
    const ratingValue = Number(listing.review_scores_rating) || 0;
    const bedsValue = Number(listing.beds) || 0;

    return {
        ...listing,
        amenitiesList,
        vibeScore,
        priceValue,
        ratingValue,
        bedsValue,
    };
}

function applyFilters() {
    // Bail if data is still loading
    if (!allListings.length) {
        return;
    }

    // Normalize the amenity query for case-insensitive matching
    const rawAmenity = (currentFilters.amenity || "").trim();
    const amenityQuery = rawAmenity.toLowerCase();

    // Walk all listings and keep only those that satisfy every active filter
    const filtered = allListings.filter((listing) => {
        if (amenityQuery && !listing.amenitiesList.some((amenity) => amenity.toLowerCase().includes(amenityQuery))) {
            return false;
        }
        if (!matchesPriceFilter(listing)) {
            return false;
        }
        if (!matchesRatingFilter(listing)) {
            return false;
        }
        if (!matchesBedsFilter(listing)) {
            return false;
        }
        return true;
    });

    // Push results to the DOM and update status messaging
    renderListings(filtered, rawAmenity);
    updateStatus(buildStatusMessage(filtered.length, rawAmenity));
}

function handleAmenityFilterChange(event) {
    currentFilters.amenity = event.target.value || ""; // Persist the current query
    applyFilters(); // Re-evaluate listings in response
}

function matchesPriceFilter(listing) {
    const price = listing.priceValue; // Already parsed numeric price
    switch (currentFilters.price) {
        case "lt150":
            return Number.isFinite(price) && price < 150;
        case "150-300":
            return Number.isFinite(price) && price >= 150 && price <= 300;
        case "gt300":
            return Number.isFinite(price) && price > 300;
        default:
            return true; // "Any" means do not filter
    }
}

function matchesRatingFilter(listing) {
    const minRating = Number(currentFilters.rating);
    if (!minRating) {
        return true; // No threshold selected
    }
    return Number.isFinite(listing.ratingValue) && listing.ratingValue >= minRating;
}

function matchesBedsFilter(listing) {
    const minBeds = Number(currentFilters.beds);
    if (!minBeds) {
        return true; // Return early when set to "Any"
    }
    return listing.bedsValue >= minBeds;
}

function renderListings(listings, amenityQuery = "") {
    gridEl.innerHTML = ""; // Reset the container before re-rendering
    const normalizedQuery = amenityQuery.toLowerCase();

    if (!listings.length) {
        // Show an empty state when filters remove all results
        const emptyState = document.createElement("p");
        emptyState.className = "listing-grid__empty";
        emptyState.textContent = "No listings match the current filters.";
        gridEl.appendChild(emptyState);
        return;
    }

    // Use a fragment for quick DOM insertion
    const fragment = document.createDocumentFragment();
    listings.forEach((listing) => {
        fragment.appendChild(createListingCard(listing, normalizedQuery));
    });
    gridEl.appendChild(fragment);
}

function createListingCard(listing, normalizedQuery) {
    const card = cardTemplate.content.firstElementChild.cloneNode(true); // Clone the card skeleton

    // Populate listing media with safe fallbacks
    const thumbnail = card.querySelector(".listing-card__thumbnail");
    thumbnail.src = listing.picture_url || FALLBACK_IMAGE;
    thumbnail.alt = listing.name ? `Photo of ${listing.name}` : "Listing photo";
    thumbnail.loading = "lazy";

    // Present the nightly price (or a placeholder) separate from the image
    const price = card.querySelector(".listing-card__price");
    price.textContent = "";
    if (listing.price) {
        price.textContent = `${listing.price} `;
        const perNight = document.createElement("span");
        perNight.textContent = "per night";
        price.appendChild(perNight);
    } else {
        price.textContent = "Price unavailable";
    }

    // Bind listing metadata and navigation
    const titleLink = card.querySelector(".listing-card__link");
    titleLink.href = listing.listing_url || "#";
    titleLink.textContent = listing.name || "View listing";
    titleLink.title = "Open listing in a new tab";

    const meta = card.querySelector(".listing-card__meta");
    meta.textContent = formatMeta(listing);

    // Descriptions may include markup from the dataset
    const description = card.querySelector(".listing-card__description");
    description.innerHTML = sanitizeDescription(listing.description);

    // Construct the amenity chips with optional highlighting
    const amenitiesList = card.querySelector(".listing-card__amenities ul");
    amenitiesList.innerHTML = "";
    const visibleAmenities = listing.amenitiesList.slice(0, AMENITIES_TO_SHOW);
    visibleAmenities.forEach((amenity) => {
        amenitiesList.appendChild(buildAmenityItem(amenity, normalizedQuery));
    });
    const remainingCount = Math.max(listing.amenitiesList.length - visibleAmenities.length, 0);
    if (remainingCount > 0) {
        const moreItem = document.createElement("li");
        moreItem.className = "listing-card__amenities-more";
        moreItem.textContent = `+${remainingCount} more`;
        amenitiesList.appendChild(moreItem);
    }

    // Host imagery and metadata
    const hostPhoto = card.querySelector(".listing-card__host-photo");
    hostPhoto.src = listing.host_picture_url || listing.host_thumbnail_url || FALLBACK_AVATAR;
    hostPhoto.alt = listing.host_name ? `Photo of host ${listing.host_name}` : "Host";
    hostPhoto.loading = "lazy";

    const hostName = card.querySelector(".listing-card__host-name");
    hostName.textContent = listing.host_name ? `Hosted by ${listing.host_name}` : "Host info unavailable";

    const hostDetail = card.querySelector(".listing-card__host-detail");
    hostDetail.textContent = formatHostDetail(listing);

    // Explorer score meter shares a semantic meter role and visual flair
    const vibe = card.querySelector(".listing-card__vibe");
    const vibeLabel = card.querySelector(".listing-card__vibe-label");
    const vibeIndicator = card.querySelector(".listing-card__vibe-indicator");
    const score = Number.isFinite(listing.vibeScore) ? listing.vibeScore : 0;
    vibe.setAttribute("aria-valuenow", String(score));
    vibeLabel.textContent = `Explorer score ${score}`;
    vibeIndicator.style.width = `${score}%`;
    vibeIndicator.dataset.score = String(score);

    return card;
}

function buildAmenityItem(amenity, normalizedQuery) {
    const item = document.createElement("li");
    if (!normalizedQuery) {
        item.textContent = amenity; // Fast path when no search term present
        return item;
    }

    // Manual highlight routine lets us wrap each match with a <mark>
    const lowerAmenity = amenity.toLowerCase();
    const queryLength = normalizedQuery.length;
    let cursor = 0;
    let matchIndex = lowerAmenity.indexOf(normalizedQuery, cursor);

    while (matchIndex !== -1) {
        if (matchIndex > cursor) {
            item.appendChild(document.createTextNode(amenity.slice(cursor, matchIndex)));
        }

        const matchText = amenity.slice(matchIndex, matchIndex + queryLength);
        const highlight = document.createElement("mark");
        highlight.textContent = matchText;
        item.appendChild(highlight);

        cursor = matchIndex + queryLength;
        matchIndex = lowerAmenity.indexOf(normalizedQuery, cursor);
    }

    if (cursor < amenity.length) {
        item.appendChild(document.createTextNode(amenity.slice(cursor)));
    }

    if (!item.childNodes.length) {
        item.textContent = amenity; // Fallback for unexpected cases
    }

    return item;
}

function sanitizeDescription(html) {
    if (!html) {
        return "No description provided yet."; // Guard against missing text
    }

    const container = document.createElement("div");
    container.innerHTML = html; // Insert raw HTML to strip scripts/styles safely
    container.querySelectorAll("script, style").forEach((node) => node.remove());
    return container.innerHTML.trim() || "No description provided yet.";
}

function parseAmenities(value) {
    if (Array.isArray(value)) {
        return value; // Already parsed
    }

    if (typeof value === "string" && value.trim()) {
        return JSON.parse(value);
    }

    return []; // Always return an array for downstream loops
}

function parsePrice(value) {
    if (typeof value !== "string") {
        return NaN; // Maintain NaN typing for non-parsable values
    }
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : NaN;
}

function formatMeta(listing) {
    const details = [];
    if (listing.property_type) {
        details.push(listing.property_type);
    }
    if (listing.neighbourhood_cleansed) {
        details.push(listing.neighbourhood_cleansed);
    }

    const rating = Number(listing.review_scores_rating);
    const reviewTotal = Number(listing.number_of_reviews) || 0;
    if (rating) {
        const roundedRating = Math.round(rating * 10) / 10;
        details.push(`Rating ${roundedRating.toFixed(1)} / 5 (${reviewTotal} reviews)`);
    } else if (reviewTotal) {
        details.push(`${reviewTotal} reviews`);
    }

    return details.join(" | ") || "Details coming soon";
}

function formatHostDetail(listing) {
    const insights = [];
    if (listing.host_is_superhost === "t") {
        insights.push("Superhost");
    }
    if (listing.host_since) {
        const year = new Date(listing.host_since).getFullYear();
        if (Number.isFinite(year)) {
            insights.push(`Hosting since ${year}`);
        }
    }
    if (listing.host_location) {
        insights.push(listing.host_location);
    }
    return insights.join(" | ") || "Host details unavailable";
}

function computeExplorerScore(listing, amenitiesList) {
    // Weighted blend of quality, social proof, and amenity breadth
    const rating = Number(listing.review_scores_rating) || 0;
    const reviews = Number(listing.number_of_reviews) || 0;
    const amenityCount = Array.isArray(amenitiesList) ? amenitiesList.length : 0;

    const ratingComponent = rating ? Math.min(rating / 5, 1) : 0; // Clamp to 0-1
    const reviewComponent = reviews ? Math.min(Math.log10(reviews + 1) / Math.log10(201), 1) : 0; // Log curve for diminishing returns
    const amenityComponent = amenityCount ? Math.min(amenityCount / 25, 1) : 0; // Normalize by 25 amenities

    const combined = ratingComponent * 0.55 + reviewComponent * 0.25 + amenityComponent * 0.20;
    return Math.round(combined * 100);
}

function updateStatus(message) {
    statusEl.textContent = message; // aria-live region picks up this change
}

function buildStatusMessage(count, rawAmenity) {
    const criteria = []; // Collect textual descriptions for the status label

    if (PRICE_DESCRIPTIONS[currentFilters.price]) {
        criteria.push(PRICE_DESCRIPTIONS[currentFilters.price]);
    }
    if (RATING_DESCRIPTIONS[currentFilters.rating]) {
        criteria.push(RATING_DESCRIPTIONS[currentFilters.rating]);
    }
    if (BED_DESCRIPTIONS[currentFilters.beds]) {
        criteria.push(BED_DESCRIPTIONS[currentFilters.beds]);
    }
    if (rawAmenity) {
        criteria.push(`amenity "${rawAmenity}"`);
    }

    if (!count) {
        if (criteria.length) {
            return `No listings match ${formatCriteria(criteria)}.`;
        }
        return "No listings to display.";
    }

    if (!criteria.length) {
        return `Showing ${count} of the first ${MAX_LISTINGS} listings`;
    }

    return `Showing ${count} listing${count === 1 ? "" : "s"} matching ${formatCriteria(criteria)}`;
}

function formatCriteria(criteria) {
    if (criteria.length === 1) {
        return criteria[0];
    }
    const head = criteria.slice(0, -1).join(", ");
    const tail = criteria[criteria.length - 1];
    return `${head} and ${tail}`;
}

function initTheme() {
    if (!themeToggle || !themeToggleIcon || !themeToggleText) {
        return; // Skip theme setup if the toggle is missing
    }

    const root = document.documentElement;
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    let theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : root.getAttribute("data-theme");

    if (!theme) {
        // Fall back to OS preference when nothing else exists
        theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    applyTheme(theme);

    // Persist the next theme selection on click
    themeToggle.addEventListener("click", () => {
        const currentTheme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
        const nextTheme = currentTheme === "light" ? "dark" : "light";
        applyTheme(nextTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch (error) {
            console.warn("Unable to persist theme preference", error);
        }
    });
}

function applyTheme(theme) {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme); // Update the attribute consumed by CSS

    if (!themeToggle || !themeToggleIcon || !themeToggleText) {
        return; // No UI to update
    }

    // Update the toggle label/icon to reflect the new state
    if (theme === "light") {
        themeToggle.setAttribute("aria-label", "Switch to dark mode");
        themeToggleIcon.textContent = "☀️";
        themeToggleText.textContent = "Light";
    } else {
        themeToggle.setAttribute("aria-label", "Switch to light mode");
        themeToggleIcon.textContent = "🌙";
        themeToggleText.textContent = "Dark";
    }
}











