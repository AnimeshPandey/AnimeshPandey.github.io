#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
import { deployRoot } from './deploy-root.mjs';

const DEPLOY = deployRoot();
const { caseNav, liveCases } = require(path.join(ROOT, 'cases/lib/case-navigation.js'));

const errors = [];

for (const c of liveCases) {
  const nav = caseNav(c.slug);
  if (!nav || !nav.next) {
    errors.push(`${c.slug}: caseNav missing next`);
    continue;
  }
  const htmlPath = path.join(DEPLOY, 'cases', c.slug, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    errors.push(`${c.slug}: no built HTML`);
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  if (!html.includes('id="case-continue"')) {
    errors.push(`${c.slug}: missing case-continue section`);
  }
  if (!html.includes(nav.next.slug)) {
    errors.push(`${c.slug}: continue CTA does not reference next slug ${nav.next.slug}`);
  }
  const nextHtml = path.join(DEPLOY, 'cases', nav.next.slug, 'index.html');
  if (!fs.existsSync(nextHtml)) {
    errors.push(`${c.slug}: next case ${nav.next.slug} not built`);
  }
}

if (errors.length) {
  console.error('Case continue failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log('OK: case-continue present and links valid for', liveCases.length, 'live cases');
