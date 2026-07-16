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
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    pathPrefix: '/',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
};
