const GITHUB_USER = 'kush5683';

const outputContainer = document.querySelector('[data-creative-output]');

if (!outputContainer) {
  console.warn('Creative console element not found; skipping animation.');
} else {
  let linkEl = outputContainer.querySelector('[data-creative-link]') || null;
  let activeTarget = linkEl || outputContainer;
  const cursorEl = document.querySelector('[data-creative-cursor]');

  const defaultPhrases = [
    { text: `github.com/${GITHUB_USER}`, href: `https://github.com/${GITHUB_USER}` },
    {
      text: '@kush5683 -> cloud security & creative code',
      href: `https://github.com/${GITHUB_USER}?tab=repositories`,
    },
    {
      text: 'starred: secure apps, playful experiments',
      href: `https://github.com/${GITHUB_USER}?tab=stars`,
    },
  ];

  let phrases = [...defaultPhrases];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let runAnimation = false;
  let currentIndex = 0;

  const toggleCursor = (isVisible) => {
    if (!cursorEl) {
      return;
    }
    cursorEl.classList.toggle('hero-console__cursor--hidden', !isVisible);
  };

  const ensureLink = (href) => {
    if (!linkEl) {
      linkEl = document.createElement('a');
      linkEl.className = 'hero-console__link';
      linkEl.setAttribute('data-creative-link', '');
      linkEl.target = '_blank';
      linkEl.rel = 'noopener';
      outputContainer.textContent = '';
      outputContainer.appendChild(linkEl);
    }
    linkEl.href = href;
    linkEl.setAttribute('aria-label', `Open ${href}`);
    activeTarget = linkEl;
  };

  const removeLink = () => {
    if (linkEl) {
      linkEl.remove();
      linkEl = null;
    }
    outputContainer.textContent = '';
    activeTarget = outputContainer;
  };

  const prepareForTyping = (phrase) => {
    if (phrase.href) {
      ensureLink(phrase.href);
      activeTarget.textContent = '';
    } else {
      removeLink();
      activeTarget.textContent = '';
    }
    return activeTarget;
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitUntilVisible = async () => {
    while (runAnimation && document.hidden) {
      await wait(250);
    }
  };

  const typePhrase = async (phrase) => {
    const target = prepareForTyping(phrase);
    for (const char of phrase.text) {
      if (!runAnimation) {
        return;
      }
      await waitUntilVisible();
      target.textContent += char;
      await wait(70 + Math.floor(Math.random() * 45));
    }
  };

  const erasePhrase = async () => {
    if (!activeTarget) {
      return;
    }
    while (runAnimation && activeTarget.textContent.length > 0) {
      await waitUntilVisible();
      activeTarget.textContent = activeTarget.textContent.slice(0, -1);
      await wait(28 + Math.floor(Math.random() * 22));
    }
  };

  const renderStaticPhrase = (phrase) => {
    const resolved = phrase || phrases[0] || defaultPhrases[0];
    const target = prepareForTyping(resolved);
    target.textContent = resolved.text;
  };

  const cyclePhrases = async () => {
    while (runAnimation) {
      const phrase = phrases[currentIndex % phrases.length];
      await typePhrase(phrase);
      if (!runAnimation) {
        break;
      }
      await wait(1600);
      if (!runAnimation) {
        break;
      }
      await erasePhrase();
      if (!runAnimation) {
        break;
      }
      await wait(450);
      currentIndex = (currentIndex + 1) % phrases.length;
    }
  };

  const startAnimation = () => {
    if (prefersReducedMotion.matches) {
      renderStaticPhrase();
      toggleCursor(false);
      return;
    }
    if (runAnimation) {
      return;
    }
    runAnimation = true;
    toggleCursor(true);
    cyclePhrases().catch((error) => {
      console.error('Creative console animation failed', error);
      runAnimation = false;
      renderStaticPhrase();
      toggleCursor(false);
    });
  };

  const stopAnimation = () => {
    if (!runAnimation) {
      renderStaticPhrase();
      toggleCursor(false);
      return;
    }
    runAnimation = false;
    renderStaticPhrase();
    toggleCursor(false);
  };

  const fetchGitHubPhrases = async () => {
    try {
      const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
      if (!response.ok) {
        throw new Error(`GitHub responded with ${response.status}`);
      }
      const repos = await response.json();
      if (!Array.isArray(repos) || repos.length === 0) {
        return [];
      }
      const sorted = [...repos].sort((a, b) => {
        const starsA = a.stargazers_count ?? 0;
        const starsB = b.stargazers_count ?? 0;
        if (starsA === starsB) {
          return (b.updated_at || '').localeCompare(a.updated_at || '');
        }
        return starsB - starsA;
      });
      const topRepos = sorted.slice(0, 3);
      const repoPhrases = topRepos.map((repo) => {
        const stars = repo.stargazers_count ?? 0;
        const label = stars === 0 ? 'no stars yet' : `${stars} star${stars === 1 ? '' : 's'}`;
        const href = repo.html_url || `https://github.com/${GITHUB_USER}/${repo.name}`;
        return { text: `github.com/${GITHUB_USER}/${repo.name} ${label}`, href };
      });
      const languages = [...new Set(sorted.map((repo) => repo.language).filter(Boolean))].slice(0, 3);
      if (languages.length > 0) {
        repoPhrases.push({ text: `fav languages: ${languages.join(' / ')}` });
      }
      return repoPhrases;
    } catch (error) {
      console.warn('Failed to load GitHub data for creative console', error);
      return [];
    }
  };

  const updatePhrasesFromGitHub = async () => {
    const githubPhrases = await fetchGitHubPhrases();
    if (githubPhrases.length === 0) {
      return;
    }
    phrases = [...githubPhrases, ...defaultPhrases];
    currentIndex = 0;
    if (!runAnimation && prefersReducedMotion.matches) {
      renderStaticPhrase(phrases[0]);
    }
  };

  if (prefersReducedMotion.matches) {
    renderStaticPhrase();
    toggleCursor(false);
  } else {
    startAnimation();
  }

  updatePhrasesFromGitHub().then(() => {
    if (!prefersReducedMotion.matches && !runAnimation) {
      startAnimation();
    }
  });

  const handlePreferenceChange = (event) => {
    if (event.matches) {
      stopAnimation();
    } else {
      startAnimation();
    }
  };

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', handlePreferenceChange);
  } else if (typeof prefersReducedMotion.addListener === 'function') {
    prefersReducedMotion.addListener(handlePreferenceChange);
  }

  document.addEventListener('visibilitychange', () => {
    if (!runAnimation) {
      return;
    }
    toggleCursor(!document.hidden);
  });
}
