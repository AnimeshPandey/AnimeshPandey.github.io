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
