#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { deployRoot } from './deploy-root.mjs';

const DEPLOY = deployRoot();
const CASEBOOK = path.join(DEPLOY, 'cases');

const ASSETS = [
  'assets/js/casey-companion.js',
  'assets/js/casey-hub.js',
  'assets/js/casey-coach.js',
  'assets/js/case-scroll.js',
  'assets/js/casebook-auth-core.js',
  'assets/js/casebook-auth.js',
  'assets/js/casebook-progression.js',
  'assets/js/case-continue.js',
  'assets/css/casebook.css',
  'assets/css/hub-filters.css',
  'assets/css/casey-motion.css',
  'assets/css/casebook-progression.css',
  'assets/casey/junior/present.png',
  'assets/casey/junior/wave.png',
];

const PORTFOLIO = [
  'assets/theme.js',
  'assets/nav.js',
  'assets/platform/chrome.js',
];

const missing = [];
for (const rel of ASSETS) {
  if (!fs.existsSync(path.join(CASEBOOK, rel))) missing.push('cases/' + rel);
}
for (const rel of PORTFOLIO) {
  if (!fs.existsSync(path.join(DEPLOY, rel))) missing.push(rel);
}

if (missing.length) {
  console.error('Missing critical assets:');
  missing.forEach((m) => console.error('  -', m));
  process.exit(1);
}

for (const rel of ASSETS) {
  const stat = fs.statSync(path.join(CASEBOOK, rel));
  if (stat.size < 10) {
    console.error('Asset too small:', rel);
    process.exit(1);
  }
}

console.log('OK:', ASSETS.length + PORTFOLIO.length, 'critical assets present and non-empty');
