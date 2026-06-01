#!/usr/bin/env node
/**
 * After eleventy build: assert every live manifest case has _site/{slug}/index.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/_data/manifest.json'), 'utf8')
);
const live = manifest.cases.filter((c) => c.status === 'live');
const siteDir = path.join(ROOT, '_site');
const missing = [];

for (const c of live) {
  const html = path.join(siteDir, c.slug, 'index.html');
  if (!fs.existsSync(html)) missing.push(c.slug);
}

if (missing.length) {
  console.error('Missing built pages for live cases:');
  missing.forEach((s) => console.error('  -', s));
  process.exit(1);
}
console.log('OK:', live.length, 'live case pages exist under _site/');
