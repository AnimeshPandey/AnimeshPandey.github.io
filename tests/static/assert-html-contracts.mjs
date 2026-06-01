#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
import { deployRoot } from './deploy-root.mjs';

const DEPLOY = deployRoot();
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'cases/src/_data/manifest.json'), 'utf8')
);

const errors = [];

function assertContains(file, patterns, label) {
  const html = fs.readFileSync(file, 'utf8');
  for (const p of patterns) {
    if (typeof p === 'string') {
      if (!html.includes(p)) errors.push(`${label}: missing "${p}" in ${path.relative(DEPLOY, file)}`);
    } else if (!p.test(html)) {
      errors.push(`${label}: pattern ${p} failed in ${path.relative(DEPLOY, file)}`);
    }
  }
}

// Portfolio home
assertContains(
  path.join(DEPLOY, 'index.html'),
  ['<main', 'platform-header', '/cases/', 'sw-migrate.js', 'id="hero"'],
  'portfolio-home'
);

// Casebook hub
assertContains(
  path.join(DEPLOY, 'cases/index.html'),
  [
    'data-casey-hub',
    'data-casey-greeting',
    'id="track-filter"',
    'id="hub-grid"',
    'id="hub-grid-empty"',
    'hub-progress',
    'casey-companion.js',
    'casebook-auth-core.js',
    'manifest-slug-order',
  ],
  'casebook-hub'
);

// Hub empty must respect hidden (CSS)
const hubCss = fs.readFileSync(
  path.join(DEPLOY, 'cases/assets/css/hub-filters.css'),
  'utf8'
);
if (!/\.hub-empty\[hidden\]/.test(hubCss) && !/hub-empty\[hidden\]/.test(hubCss)) {
  errors.push('casebook-hub: hub-empty [hidden] CSS guard missing');
}

// Sample live cases
const sampleSlugs = [
  'abort-controller-ghost-updates',
  'focus-visible-not-outline-none',
  'static-site-zero-backend',
];

for (const slug of sampleSlugs) {
  const file = path.join(DEPLOY, 'cases', slug, 'index.html');
  if (!fs.existsSync(file)) {
    errors.push(`case-page: missing ${slug}`);
    continue;
  }
  assertContains(
    file,
    [
      'case-chapter',
      'data-chapter="takeaway"',
      'casey-coach',
      'case-continue',
      'data-case-continue-next',
      'casey-data',
      'case-scroll.js',
      'data-pagefind-body',
    ],
    `case-${slug}`
  );
}

// Account
assertContains(
  path.join(DEPLOY, 'cases/account/index.html'),
  ['account-email-form', 'account-signed-in', 'casebook-auth.js'],
  'account'
);

// Library
assertContains(
  path.join(DEPLOY, 'cases/library/index.html'),
  ['casebook-hub', 'hub-filter', /reading-card|library/],
  'library'
);

if (errors.length) {
  console.error('HTML contract failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log('OK: HTML contracts for portfolio, hub,', sampleSlugs.length, 'cases, account, library');
