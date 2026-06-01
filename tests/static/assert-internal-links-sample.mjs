#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { deployRoot } from './deploy-root.mjs';

const DEPLOY = deployRoot();

const LINK_RE = /href="(\/cases\/[^"#?]+)"/g;

function checkHtml(rel) {
  const file = path.join(DEPLOY, rel);
  const html = fs.readFileSync(file, 'utf8');
  const bad = [];
  let m;
  while ((m = LINK_RE.exec(html))) {
    let href = m[1];
    if (href.endsWith('/')) href += 'index.html';
    else if (!path.extname(href)) href = href.replace(/\/$/, '') + '/index.html';
    const target = path.join(DEPLOY, href.replace(/^\//, ''));
    if (!fs.existsSync(target)) bad.push({ href: m[1], from: rel });
  }
  return bad;
}

const pages = ['cases/index.html', 'cases/about/index.html', 'cases/abort-controller-ghost-updates/index.html'];
const allBad = pages.flatMap(checkHtml);

if (allBad.length) {
  console.error('Broken internal /cases/ links (sample):');
  allBad.slice(0, 20).forEach((b) => console.error(`  ${b.from} → ${b.href}`));
  process.exit(1);
}
console.log('OK: sampled internal casebook links resolve on disk');
