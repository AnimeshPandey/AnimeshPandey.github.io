import { chromium } from '@playwright/test';
import { readFileSync } from 'fs';

const axeSource = readFileSync('/Users/animeshpandey/.npm/_npx/0f94ee7615faf582/node_modules/axe-core/axe.min.js', 'utf8');

const THEMES = ['light', 'dark', 'sage', 'slate', 'dusk', 'high-contrast'];
// 'light' = default theme (no data-theme attr / removed)
const PAGES = [
  '/',
  '/cases/',
  '/cases/library/',
  '/cases/companies/',
  '/cases/about/',
  '/cases/focus-visible-not-outline-none/',
  '/cases/mcp-host-client-server/',
  '/cases/companies/ebay/',
];

const browser = await chromium.launch();
const page = await browser.newPage();
let totalViolations = 0;

for (const theme of THEMES) {
  for (const url of PAGES) {
    await page.goto('http://localhost:8765' + url, { waitUntil: 'networkidle' });
    await page.evaluate((t) => {
      if (t === 'light') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', t);
      }
    }, theme);
    await page.waitForTimeout(150);
    await page.addScriptTag({ content: axeSource });
    const results = await page.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      });
    });
    if (results.violations.length > 0) {
      totalViolations += results.violations.length;
      console.log(`\n=== [${theme}] ${url} ===`);
      for (const v of results.violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
        for (const n of v.nodes.slice(0, 4)) {
          console.log('    ' + n.target.join(' ') + ' :: ' + n.html.slice(0, 140));
          if (n.any && n.any[0] && n.any[0].message) console.log('      ' + n.any[0].message);
        }
      }
    }
  }
}

console.log(`\nDone. Total violations across ${THEMES.length} themes x ${PAGES.length} pages: ${totalViolations}`);
await browser.close();
