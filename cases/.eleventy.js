const path = require('path');
const nunjucks = require('nunjucks');
const site = require('./src/_data/site.json');
const manifest = require('./src/_data/manifest.json');
const libraryEntries = require('./src/_data/library-entries.json');
const hubFacets = require('./src/_data/hub-facets.json');
const hubIndex = require('./src/_data/hub-index.json');
const caseyHub = require('./src/_data/casey-hub.json');
const caseyLibrary = require('./src/_data/casey-library.json');

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
  eleventyConfig.addPassthroughCopy({ 'src/cases/**/images': 'cases' });
  eleventyConfig.addPassthroughCopy('src/cases/**/casey.json');

  /* ── Global data ── */
  eleventyConfig.addGlobalData('libraryEntries', libraryEntries);
  eleventyConfig.addGlobalData('hubFacets', hubFacets);
  eleventyConfig.addGlobalData('hubIndex', hubIndex);
  eleventyConfig.addGlobalData('caseyHub', caseyHub);
  eleventyConfig.addGlobalData('caseyLibrary', caseyLibrary);

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
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    pathPrefix: site.pathPrefix || '/cases/',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
};
