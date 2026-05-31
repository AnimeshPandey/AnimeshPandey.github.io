/**
 * demo-loader.js — ES module
 * Reads data-demo-slug from .case-demo, dynamically imports the demo module.
 * Keeps case-layout.njk unchanged as new demos are added.
 */

const root = document.querySelector('.case-demo[data-demo-slug]');
if (root) {
  const slug = root.dataset.demoSlug;
  const interactive = root.querySelector('.case-demo__interactive');

  import(`./demos/${slug}.js`)
    .then(m => {
      if (typeof m.initDemo === 'function') {
        if (interactive) interactive.removeAttribute('hidden');
        m.initDemo(root, root.dataset);
      }
    })
    .catch(err => {
      console.warn('[Casebook] Demo failed to load:', slug, err);
    });
}
