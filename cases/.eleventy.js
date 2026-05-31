const site = require('./src/_data/site.json');
const manifest = require('./src/_data/manifest.json');

module.exports = function (eleventyConfig) {
  /* ── Passthrough ── */
  eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addPassthroughCopy({ 'src/cases/**/images': 'cases' });
  eleventyConfig.addPassthroughCopy({ 'src/cases/**/casey.json': 'cases' });

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
