/**
 * skills-casebook-links.js — annotates the portfolio's #skills chips with
 * real Casebook article counts and links (design-backlog idea #5).
 *
 * The counts come from /assets/casebook-stats.json, generated at build
 * time by scripts/generate-casebook-stats.mjs from the Casebook's own
 * cases/src/_data/hub-facets.json — the same source of truth the Casebook
 * itself renders category chip counts from. This script never invents a
 * number; if the fetch fails or a skill isn't in SKILL_TO_CATEGORY, that
 * chip is left exactly as it was.
 *
 * The skill → Casebook category mapping below is a deliberately small,
 * hand-picked list — only skills with one unambiguous Casebook category
 * are included. Broader/ambiguous tags (e.g. "Next.js", spanning
 * performance + React + architecture coverage) are left unmapped rather
 * than guessed at.
 */
(function () {
  'use strict';

  var SKILL_TO_CATEGORY = {
    'React': 'react',
    'React Native': 'react',
    'React Query': 'react',
    'JavaScript': 'javascript',
    'TypeScript': 'javascript',
    'CSS3': 'css-layout',
    'WCAG 2.1': 'accessibility',
    'Perf Budgets': 'performance',
    'Redux': 'state-arch',
    'Zustand': 'state-arch',
    'Module Federation': 'state-arch',
    'Microfrontends': 'state-arch',
    'GraphQL': 'networking',
    'REST / OpenAPI': 'networking',
    'Playwright': 'testing',
    'Jest': 'testing',
    'React Testing Library': 'testing',
    'Cypress': 'testing',
    'E2E / Unit / Integration': 'testing',
    'Webpack': 'tooling',
    'Vite': 'tooling',
    'Turborepo': 'tooling',
    'Nx': 'tooling',
    'GitHub Actions': 'tooling',
    'CI/CD': 'tooling',
    'Agentic AI': 'ai-agents',
    'LLM Streaming': 'ai-agents',
    'Tool Calling': 'ai-agents',
    'RAG': 'ai-agents',
    'OpenAI API': 'ai-agents',
    'LangChain': 'ai-agents',
    'Prompt Engineering': 'ai-agents',
  };

  function annotateChip(chip, category, stats) {
    var entry = stats.categories && stats.categories[category];
    if (!entry || !entry.count) return;

    var link = document.createElement('a');
    link.className = chip.className;
    link.href = '/cases/library/?category=' + encodeURIComponent(category);
    link.title =
      entry.count + ' Casebook article' + (entry.count !== 1 ? 's' : '') + ' on ' + entry.label;
    link.setAttribute('data-skill-casebook-link', category);

    var text = document.createElement('span');
    text.className = 'sv-chip-text';
    text.textContent = chip.textContent;
    link.appendChild(text);

    var count = document.createElement('span');
    count.className = 'sv-chip-count';
    count.setAttribute('aria-hidden', 'true');
    count.textContent = entry.count;
    link.appendChild(count);

    chip.replaceWith(link);
  }

  function init() {
    var chips = document.querySelectorAll('.sv-chip');
    if (!chips.length) return;

    fetch('/assets/casebook-stats.json', { credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('casebook-stats.json not available');
        return res.json();
      })
      .then(function (stats) {
        chips.forEach(function (chip) {
          var category = SKILL_TO_CATEGORY[chip.textContent.trim()];
          if (category) annotateChip(chip, category, stats);
        });
      })
      .catch(function () {
        // No stats file (e.g. a plain local preview that skipped the build
        // pipeline) — leave the skill chips exactly as authored.
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
