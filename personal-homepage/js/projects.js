import { PROJECTS } from "./projects-data.js";

const filterContainer = document.querySelector("[data-filter-chips]");
const projectsGrid = document.querySelector("[data-project-grid]");
const emptyState = document.querySelector("[data-empty-state]");
const clearFiltersButton = document.querySelector("[data-clear-filters]");

if (!filterContainer || !projectsGrid) {
  console.warn("Projects page: missing filter container or grid; skipping render.");
} else {
  const normalise = (value) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const createElement = (tag, className, props = {}) => {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    Object.entries(props).forEach(([key, value]) => {
      if (key === "text") {
        el.textContent = value;
      } else if (key === "dataset") {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          el.dataset[dataKey] = dataValue;
        });
      } else if (key === "attributes") {
        Object.entries(value).forEach(([attrKey, attrValue]) => {
          if (attrValue !== undefined && attrValue !== null) {
            el.setAttribute(attrKey, attrValue);
          }
        });
      } else {
        el[key] = value;
      }
    });
    return el;
  };

  const tagElements = new Map();
  const filters = new Set();
  let hoverTag = null;

  const registerTagElement = (tagKey, element) => {
    if (!tagElements.has(tagKey)) {
      tagElements.set(tagKey, []);
    }
    tagElements.get(tagKey).push(element);
  };

  const renderedCards = PROJECTS.map((project) => {
    const tags = Array.isArray(project.tags) ? project.tags : [];
    const normalisedTags = tags.map(normalise).filter(Boolean);

    const card = createElement("article", "project-card", {
      dataset: { projectCard: "", tags: normalisedTags.join(",") },
    });

    const header = createElement("header", "project-card__header");
    header.appendChild(
      createElement("h2", "project-card__title", { text: project.title })
    );
    card.appendChild(header);

    if (project.desc) {
      card.appendChild(
        createElement("p", "project-card__summary", { text: project.desc })
      );
    }

    if (tags.length) {
      const tagList = createElement("div", "project-card__tags");
      tags.forEach((tag) => {
        const tagKey = normalise(tag);
        if (!tagKey) {
          return;
        }
        const tagButton = createElement("button", "project-tag", {
          text: tag,
          dataset: { filter: tagKey },
          attributes: { type: "button", "aria-pressed": "false" },
        });
        registerTagElement(tagKey, tagButton);
        tagButton.addEventListener("click", () => toggleFilter(tagKey));
        tagButton.addEventListener("mouseenter", () => {
          hoverTag = tagKey;
          updateHoverState();
        });
        tagButton.addEventListener("mouseleave", () => {
          hoverTag = null;
          updateHoverState();
        });
        tagList.appendChild(tagButton);
      });
      card.appendChild(tagList);
    }

    if (Array.isArray(project.links) && project.links.length > 0) {
      const linksContainer = createElement("div", "project-card__links");
      project.links.forEach((link) => {
        if (!link || !link.href) {
          return;
        }
        const isExternal = /^(?:https?:)?\/\//i.test(link.href);
        const linkEl = createElement("a", null, {
          text: link.label || link.href,
          attributes: {
            href: link.href,
            target: isExternal ? "_blank" : undefined,
            rel: isExternal ? "noopener" : undefined,
          },
        });
        linksContainer.appendChild(linkEl);
      });
      card.appendChild(linksContainer);
    }

    return card;
  });

  const tagMap = new Map();
  PROJECTS.forEach((project) => {
    (project.tags || []).forEach((tag) => {
      const key = normalise(tag);
      if (key && !tagMap.has(key)) {
        tagMap.set(key, tag);
      }
    });
  });

  const filterButtons = [];

  const updateTagPressStates = () => {
    tagElements.forEach((elements, tagKey) => {
      const isActive = filters.has(tagKey);
      elements.forEach((element) => {
        element.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    });
  };

  const updateHoverState = () => {
    tagElements.forEach((elements, tagKey) => {
      const isMatch = hoverTag === tagKey;
      elements.forEach((element) => {
        element.classList.toggle("is-hover", isMatch);
      });
    });
  };

  const updateUI = () => {
    const activeFilters = Array.from(filters);

    filterButtons.forEach((button) => {
      const buttonKey = button.dataset.filter;
      const isActive =
        buttonKey === "all"
          ? activeFilters.length === 0
          : filters.has(buttonKey);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    const filteredCards = renderedCards.filter((card) => {
      const cardTags = (card.dataset.tags || "").split(",").filter(Boolean);
      return (
        activeFilters.length === 0 ||
        activeFilters.every((filterKey) => cardTags.includes(filterKey))
      );
    });

    projectsGrid.replaceChildren(...filteredCards);

    if (emptyState) {
      emptyState.hidden = filteredCards.length > 0;
    }

    if (clearFiltersButton) {
      clearFiltersButton.hidden = activeFilters.length === 0;
    }

    updateTagPressStates();
    updateHoverState();
  };

  function toggleFilter(tagKey) {
    if (filters.has(tagKey)) {
      filters.delete(tagKey);
    } else {
      filters.add(tagKey);
    }
    updateUI();
  }

  const tagEntries = Array.from(tagMap.entries()).sort(([, labelA], [, labelB]) =>
    labelA.toLowerCase().localeCompare(labelB.toLowerCase())
  );

  const allChip = createElement("button", "filter-chip", {
    text: "All",
    dataset: { filter: "all" },
    attributes: { type: "button", "aria-pressed": "true" },
  });
  filterButtons.push(allChip);
  filterContainer.appendChild(allChip);

  allChip.addEventListener("click", () => {
    filters.clear();
    updateUI();
  });
  allChip.addEventListener("mouseenter", () => {
    hoverTag = null;
    updateHoverState();
  });
  allChip.addEventListener("mouseleave", () => {
    hoverTag = null;
    updateHoverState();
  });

  tagEntries.forEach(([tagKey, readableLabel]) => {
    const button = createElement("button", "filter-chip", {
      text: readableLabel,
      dataset: { filter: tagKey },
      attributes: { type: "button", "aria-pressed": "false" },
    });
    registerTagElement(tagKey, button);
    button.addEventListener("click", () => toggleFilter(tagKey));
    button.addEventListener("mouseenter", () => {
      hoverTag = tagKey;
      updateHoverState();
    });
    button.addEventListener("mouseleave", () => {
      hoverTag = null;
      updateHoverState();
    });
    filterButtons.push(button);
    filterContainer.appendChild(button);
  });

  if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", () => {
      filters.clear();
      updateUI();
    });
  }

  emptyState && (emptyState.hidden = true);
  updateUI();
}
