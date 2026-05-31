const path = require('path');
const root = path.join(__dirname, '..');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ [path.join(root, 'assets')]: 'assets' });
  eleventyConfig.addPassthroughCopy(path.join(root, 'favicon.svg'));
  eleventyConfig.addPassthroughCopy(path.join(root, 'resume.pdf'));
  eleventyConfig.addPassthroughCopy(path.join(root, 'site.webmanifest'));
  eleventyConfig.addPassthroughCopy(path.join(root, 'sitemap.xml'));
  eleventyConfig.addPassthroughCopy(path.join(root, 'robots.txt'));

  /* Homepage + 404 remain hand-maintained at repo root until full njk migration */
  eleventyConfig.addPassthroughCopy({ [path.join(root, 'index.html')]: 'index.html' });
  eleventyConfig.addPassthroughCopy({ [path.join(root, '404.html')]: '404.html' });

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
