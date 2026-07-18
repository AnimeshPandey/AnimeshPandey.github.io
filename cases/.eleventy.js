const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const site = require('./src/_data/site.json');
const manifest = require('./src/_data/manifest.json');
const libraryEntries = require('./src/_data/library-entries.json');
const hubFacets = require('./src/_data/hub-facets.json');
const hubIndex = require('./src/_data/hub-index.json');
const caseyHub = require('./src/_data/casey-hub.json');
const caseyLibrary = require('./src/_data/casey-library.json');
const companionLines = require('./src/_data/companion-lines.json');
const hubLiveCases = require('./src/_data/hub-live-cases.json');
const mvpQuality = require('./src/_data/mvp-quality.json');
const guideLines = require('./src/_data/guide-lines.json');
const changelog = require('./src/_data/changelog.json');
const { liveCases, liveCaseCount, caseNav } = require('./lib/case-navigation');

/* Stamp each library entry with its real 1-based position in libraryEntries'
   canonical order, once, on the shared object — so the reading-card catalog
   number is always this entry's true global position no matter which
   page/sort order the card is rendered under (e.g. the company page renders
   a filtered + re-sorted subset that still holds references to these same
   entry objects). Deliberately keyed by array position, not slug: the source
   data has at least one genuine duplicate/truncated slug (two distinct
   Financial Times articles both slugify to
   "financial-times-improving-the-cache-performance-of-the-polyf"), which
   would collide in a slug-keyed lookup. */
libraryEntries.forEach((entry, i) => {
  entry.catalogNo = i + 1;
});

/* Stamp each company facet with the real published-year span of its
   library entries (min/max of entry.publishedYear across that company's
   articles) — a real, build-time-derived fact about the company's coverage
   in this library, not a fabricated figure. Mutates the same hubFacets.companies
   objects that company-detail.njk's pagination iterates over, so both the
   companies index and each company's detail page read from one computed
   value. */
const companyYearSpans = {};
libraryEntries.forEach((entry) => {
  if (!entry.companySlug || !entry.publishedYear) return;
  const span = companyYearSpans[entry.companySlug];
  if (!span) {
    companyYearSpans[entry.companySlug] = { minYear: entry.publishedYear, maxYear: entry.publishedYear };
  } else {
    if (entry.publishedYear < span.minYear) span.minYear = entry.publishedYear;
    if (entry.publishedYear > span.maxYear) span.maxYear = entry.publishedYear;
  }
});
hubFacets.companies.forEach((company) => {
  const span = companyYearSpans[company.slug];
  if (span) {
    company.minYear = span.minYear;
    company.maxYear = span.maxYear;
  }
});

/* Compute a real, build-time reading-time figure for every live case, from
   that case's actual chapter prose — replacing two independent hand-typed
   numbers: manifest.json's `readMin` (a flat 10 for all 229 cases, live or
   not) shown on the hub card, and each case's own front-matter `readMin`
   (varies per case but is still a guess) shown on the case cover. Same bug
   class PR #17 fixed for portfolio articles ("18 min read" that drifted
   from the real prose), computed once here and read by both surfaces so
   they can't drift from each other.

   Only the default tone's prose is counted (all 31 live cases render all
   three tones — junior/mid/staff — into the DOM simultaneously and toggle
   visibility client-side; counting all three would overcount by ~3x
   relative to what a reader on one tone actually reads). All 31 cases
   currently set defaultTone: "junior". */
function stripBalancedToneBlocks(html, tonesToStrip) {
  let result = html;
  tonesToStrip.forEach((tone) => {
    const marker = `class="tone-${tone}"`;
    let searchFrom = 0;
    for (;;) {
      const markerIdx = result.indexOf(marker, searchFrom);
      if (markerIdx === -1) break;
      const divStart = result.lastIndexOf('<div', markerIdx);
      if (divStart === -1) {
        searchFrom = markerIdx + marker.length;
        continue;
      }
      // Walk forward counting <div>/</div> depth to find the true matching
      // close, rather than a naive non-greedy regex that would stop at the
      // first </div> even if this tone block contains a nested <div>.
      let depth = 0;
      let pos = divStart;
      let closeEnd = -1;
      while (pos < result.length) {
        const nextOpen = result.indexOf('<div', pos);
        const nextClose = result.indexOf('</div>', pos);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth += 1;
          pos = nextOpen + 4;
        } else {
          depth -= 1;
          pos = nextClose + 6;
          if (depth === 0) {
            closeEnd = pos;
            break;
          }
        }
      }
      if (closeEnd === -1) break;
      result = result.slice(0, divStart) + result.slice(closeEnd);
      searchFrom = divStart;
    }
  });
  return result;
}

function countRealWords(rawTemplateSource) {
  const text = String(rawTemplateSource || '')
    .replace(/\{#[\s\S]*?#\}/g, ' ') // nunjucks comments
    .replace(/\{\{[\s\S]*?\}\}/g, ' ') // nunjucks output tags
    .replace(/\{%[\s\S]*?%\}/g, ' ') // nunjucks logic tags
    .replace(/<[^>]*>/g, ' '); // html tags
  return (text.match(/\S+/g) || []).length;
}

const caseReadingStats = {};
liveCases.forEach((c) => {
  const filePath = path.join(__dirname, 'src/cases', c.slug, 'index.njk');
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return; // no source file — leave the hand-typed readMin as a fallback
  }
  const body = raw.replace(/^---[\s\S]*?---\s*/, ''); // drop front matter
  const tone = c.defaultTone || 'junior';
  const otherTones = ['junior', 'mid', 'staff'].filter((t) => t !== tone);
  const onlyDefaultTone = stripBalancedToneBlocks(body, otherTones);
  const words = countRealWords(onlyDefaultTone);
  const minutes = Math.max(1, Math.ceil(words / 200));
  caseReadingStats[c.slug] = { words: words, minutes: minutes };
});
/* Deliberately NOT mutating `c.readMin` on the manifest case object here:
   Eleventy's automatic `_data/manifest.json` loading parses that file
   independently of this module's own `require('./src/_data/manifest.json')`
   above — they are two distinct objects, not a shared require-cache
   reference (unlike hubFacets/libraryEntries, which templates only ever see
   via this file's explicit addGlobalData registration, never Eleventy's
   auto-loading, so there's no second copy to drift from). Mutating this
   copy would silently do nothing to what index.njk reads. Templates look up
   caseReadingStats[slug] directly instead — see index.njk and
   case-layout.njk. */

module.exports = function (eleventyConfig) {
  const nunjucksEnvironment = nunjucks.configure(
    [
      path.join(__dirname, 'src/_includes'),
      path.join(__dirname, '../site/src/_includes'),
    ],
    {
      autoescape: true,
      throwOnUndefined: false,
      trimBlocks: true,
      lstripBlocks: true,
    }
  );
  eleventyConfig.setLibrary('njk', nunjucksEnvironment);
  /* ── Passthrough ── */
  eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addPassthroughCopy({ 'lib/casebook-auth-core.js': 'assets/js/casebook-auth-core.js' });
  eleventyConfig.addPassthroughCopy({ 'src/cases/**/images': 'cases' });
  eleventyConfig.addPassthroughCopy('src/cases/**/casey.json');

  /* ── Global data ── */
  eleventyConfig.addGlobalData('caseReadingStats', caseReadingStats);
  eleventyConfig.addGlobalData('libraryEntries', libraryEntries);
  eleventyConfig.addGlobalData('hubFacets', hubFacets);
  eleventyConfig.addGlobalData('hubIndex', hubIndex);
  eleventyConfig.addGlobalData('caseyHub', caseyHub);
  eleventyConfig.addGlobalData('caseyLibrary', caseyLibrary);
  eleventyConfig.addGlobalData('companionLines', companionLines);
  eleventyConfig.addGlobalData('hubLiveCases', hubLiveCases);
  eleventyConfig.addGlobalData('mvpQuality', mvpQuality);
  eleventyConfig.addGlobalData('guideLines', guideLines);
  eleventyConfig.addGlobalData('changelog', changelog);
  eleventyConfig.addGlobalData('liveCases', liveCases);
  eleventyConfig.addGlobalData('liveCaseCount', liveCaseCount);
  eleventyConfig.addGlobalData('hubCaseTitles', () => {
    const titles = {};
    manifest.cases.forEach((c) => {
      titles[c.slug] = c.title;
    });
    return titles;
  });

  eleventyConfig.addFilter('caseNav', caseNav);

  eleventyConfig.addFilter('isRecent', function (dateStr, days) {
    if (!dateStr) return false;
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days || 14));
    return new Date(dateStr) >= cutoff;
  });

  /* ── Collections ── */
  eleventyConfig.addCollection('liveCases', () =>
    manifest.cases.filter((c) => c.status === 'live')
  );

  /* ── Filters ── */

  /* Escape < for JSON-LD inline scripts */
  eleventyConfig.addFilter('jsonLd', (obj) =>
    JSON.stringify(obj).replace(/</g, '\\u003c')
  );

  /* Format ISO date as human-readable */
  eleventyConfig.addFilter('readableDate', (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  });

  /* Format ISO date as RFC 2822 for RSS */
  eleventyConfig.addFilter('rssDate', (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toUTCString();
  });

  /* Absolute URL helper */
  eleventyConfig.addFilter('absoluteUrl', (path, base) => {
    try {
      return new URL(path, base).href;
    } catch (e) {
      return base + path;
    }
  });

  /* Zero-pad a number for the case-file "No." stamp (e.g. 7 -> "007") */
  eleventyConfig.addFilter('pad3', (n) => String(n).padStart(3, '0'));

  return {
    dir: {
      input: 'src',
      // See site/.eleventy.js for why this env var exists: lets local dev
      // builds escape a synced ~/Documents-style folder without changing
      // the default output path CI and the deploy workflow expect.
      output: process.env.ELEVENTY_OUTPUT_DIR || '_site',
      includes: '_includes',
      data: '_data',
    },
    pathPrefix: site.pathPrefix || '/cases/',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
};
