const path = require('path');
const root = path.join(__dirname, '..');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ '../assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ '../favicon.svg': 'favicon.svg' });
  eleventyConfig.addPassthroughCopy({ '../resume.pdf': 'resume.pdf' });
  eleventyConfig.addPassthroughCopy({ '../site.webmanifest': 'site.webmanifest' });
  eleventyConfig.addPassthroughCopy({ '../sitemap.xml': 'sitemap.xml' });
  eleventyConfig.addPassthroughCopy({ '../robots.txt': 'robots.txt' });
  eleventyConfig.addPassthroughCopy({ '../llms.txt': 'llms.txt' });
  eleventyConfig.addPassthroughCopy({ '../index.html': 'index.html' });
  eleventyConfig.addPassthroughCopy({ '../404.html': '404.html' });

  return {
    dir: {
      input: 'src',
      // Local-dev escape hatch: on machines where the repo lives under a
      // synced folder (e.g. iCloud Drive's ~/Documents), rapid rebuilds of
      // the default in-tree `_site` can race the sync daemon and leave
      // "conflict copy" junk files behind. Set ELEVENTY_OUTPUT_DIR to an
      // unsynced path (e.g. /tmp/...) to build there instead. Unset in CI
      // and for anyone else cloning the repo, so the default `_site` output
      // (what the deploy workflow expects) is unchanged.
      output: process.env.ELEVENTY_OUTPUT_DIR || '_site',
      includes: '_includes',
      data: '_data',
    },
    pathPrefix: '/',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
};
