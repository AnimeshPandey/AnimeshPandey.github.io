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
const mvpReferences = require('./src/_data/mvp-references.json');
const { liveCases, liveCaseCount, caseNav, nextWave } = require('./lib/case-navigation');
const { lastCommitDate } = require('./lib/git-dates');

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

/* Real "most-covered companies" ranking (design-backlog idea #36) and
   coverage-span outlier (idea #37) — both derived from the same per-company
   `count`/`minYear`/`maxYear` facts already stamped onto hubFacets.companies
   above, not a separately hand-picked list. Top 5 by article count, and the
   single company with the widest real publishedYear span (ties broken by
   earliest minYear, then name, so the result is deterministic). */
const mostCoveredCompanies = hubFacets.companies
  .slice()
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

let widestCoverageCompany = null;
hubFacets.companies.forEach((company) => {
  if (company.minYear == null || company.maxYear == null) return;
  const span = company.maxYear - company.minYear;
  if (
    !widestCoverageCompany ||
    span > widestCoverageCompany.span ||
    (span === widestCoverageCompany.span && company.minYear < widestCoverageCompany.minYear) ||
    (span === widestCoverageCompany.span &&
      company.minYear === widestCoverageCompany.minYear &&
      company.name < widestCoverageCompany.name)
  ) {
    widestCoverageCompany = {
      name: company.name,
      slug: company.slug,
      minYear: company.minYear,
      maxYear: company.maxYear,
      span: span,
    };
  }
});

/* Real per-year article counts across the whole reading library
   (design-backlog idea #31) — a plain tally of libraryEntries.publishedYear,
   sorted ascending, used to render a real (not illustrative) per-year
   coverage bar on the library page. */
const libraryYearCounts = {};
libraryEntries.forEach((entry) => {
  if (!entry.publishedYear) return;
  libraryYearCounts[entry.publishedYear] = (libraryYearCounts[entry.publishedYear] || 0) + 1;
});
const libraryYearCoverage = Object.keys(libraryYearCounts)
  .map((y) => ({ year: Number(y), count: libraryYearCounts[y] }))
  .sort((a, b) => a.year - b.year);
const libraryYearCoverageMax = libraryYearCoverage.reduce((m, y) => Math.max(m, y.count), 0);

/* Real clusterId-based "similar articles" grouping (design-backlog idea
   #32). library-entries.json's clusterId groups entries into 24 real
   clusters, but they're wildly uneven — one cluster (C25) alone holds 335
   of the 779 entries (43%), clearly a catch-all/uncategorized bucket rather
   than a genuine similarity signal. Showing "334 similar articles" would be
   noise, not a fact a reader can use, so siblings are only computed for
   clusters in a size band that plausibly means "genuinely related"
   (2–40 entries) — below that there's nothing to relate to, above it the
   grouping stops being meaningful. Capped at 4 siblings per entry so the
   card stays a card, not a second list. */
const MIN_MEANINGFUL_CLUSTER = 2;
const MAX_MEANINGFUL_CLUSTER = 40;
const MAX_SIBLINGS_SHOWN = 4;
const entriesByCluster = {};
libraryEntries.forEach((entry) => {
  if (!entry.clusterId) return;
  (entriesByCluster[entry.clusterId] = entriesByCluster[entry.clusterId] || []).push(entry);
});
libraryEntries.forEach((entry) => {
  const siblings = entry.clusterId ? entriesByCluster[entry.clusterId] : null;
  if (!siblings || siblings.length < MIN_MEANINGFUL_CLUSTER || siblings.length > MAX_MEANINGFUL_CLUSTER) {
    return;
  }
  entry.clusterSiblings = siblings
    .filter((other) => other !== entry)
    .slice(0, MAX_SIBLINGS_SHOWN)
    .map((other) => ({ title: other.title, primaryUrl: other.primaryUrl }));
  entry.clusterSize = siblings.length;
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
/* Real per-case "last updated" date (design-backlog idea #27), read from
   this case's own index.njk git history rather than hand-typed. Idea #11
   ("git-blame code-verified date") was folded into this one instead of
   shipped separately: it only applies to the single case with a runnable
   code sample (url-as-source-of-truth), and a file-level git date can't
   distinguish "the code changed" from "the prose changed" within the same
   file — it would be the identical date as this stamp, not a distinct fact. */
const caseLastUpdated = {};
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
  const allTones = ['junior', 'mid', 'staff'];
  const otherTones = allTones.filter((t) => t !== tone);
  const onlyDefaultTone = stripBalancedToneBlocks(body, otherTones);
  const words = countRealWords(onlyDefaultTone);
  const minutes = Math.max(1, Math.ceil(words / 200));
  caseReadingStats[c.slug] = { words: words, minutes: minutes };

  /* Per-tone reading-time delta (design-backlog idea #29) — same word-count
     machinery, run once per tone instead of only the default, so switching
     the reading-level control can show that tone's own real minutes rather
     than reusing the default tone's number for all three. */
  const byTone = {};
  allTones.forEach((t) => {
    const stripped = stripBalancedToneBlocks(body, allTones.filter((other) => other !== t));
    const w = countRealWords(stripped);
    byTone[t] = { words: w, minutes: Math.max(1, Math.ceil(w / 200)) };
  });
  caseReadingStats[c.slug].byTone = byTone;

  caseLastUpdated[c.slug] = lastCommitDate(filePath);
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

/* Per-track live/planned counts (design-backlog: roadmap progress chart) —
   computed once from manifest.cases so the /about/ progress section can
   never drift the way a hand-typed case count already has (see BRANDING.md
   decision log, 2026-07-19: three docs and the GitHub profile README all
   said "223" after the real count moved to 229). Sorted alphabetically by
   track slug for a stable render order across builds. */
const TRACK_LABEL_OVERRIDES = { css: 'CSS', ux: 'UX', ai: 'AI', dom: 'DOM', cwv: 'CWV', javascript: 'JavaScript' };
function trackLabel(slug) {
  return slug
    .split('-')
    .map((word) => TRACK_LABEL_OVERRIDES[word] || word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
const tracksProgress = (() => {
  const byTrack = {};
  manifest.cases.forEach((c) => {
    if (!byTrack[c.track]) byTrack[c.track] = { track: c.track, label: trackLabel(c.track), live: 0, total: 0 };
    byTrack[c.track].total += 1;
    if (c.status === 'live') byTrack[c.track].live += 1;
  });
  return Object.values(byTrack).sort((a, b) => a.track.localeCompare(b.track));
})();
const tracksProgressTotals = tracksProgress.reduce(
  (acc, t) => ({ live: acc.live + t.live, total: acc.total + t.total }),
  { live: 0, total: 0 },
);

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
  eleventyConfig.addGlobalData('tracksProgress', tracksProgress);
  eleventyConfig.addGlobalData('tracksProgressTotals', tracksProgressTotals);
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
  eleventyConfig.addGlobalData('mvpReferences', mvpReferences);
  eleventyConfig.addGlobalData('caseLastUpdated', caseLastUpdated);
  eleventyConfig.addGlobalData('mostCoveredCompanies', mostCoveredCompanies);
  eleventyConfig.addGlobalData('widestCoverageCompany', widestCoverageCompany);
  eleventyConfig.addGlobalData('libraryYearCoverage', libraryYearCoverage);
  eleventyConfig.addGlobalData('libraryYearCoverageMax', libraryYearCoverageMax);
  // Real "next wave" roadmap teaser (design-backlog idea #3) — the lowest
  // not-yet-live wave number and its real count, computed from manifest.json
  // itself so it can't drift from the actual case pipeline (lib/case-navigation.js).
  eleventyConfig.addGlobalData('nextWave', nextWave);
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
