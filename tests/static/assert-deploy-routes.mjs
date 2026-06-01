#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { deployRoot } from './deploy-root.mjs';

const DEPLOY = deployRoot();

const REQUIRED = [
  'index.html',
  '404.html',
  'assets/sw-migrate.js',
  'sw.js',
  'cases/index.html',
  'cases/about/index.html',
  'cases/library/index.html',
  'cases/account/index.html',
  'cases/whats-new/index.html',
  'cases/feed.xml',
  'cases/sitemap.xml',
  'cases/companies/index.html',
];

const missing = REQUIRED.filter((rel) => !fs.existsSync(path.join(DEPLOY, rel)));
if (missing.length) {
  console.error('Missing required deploy routes:');
  missing.forEach((m) => console.error('  -', m));
  process.exit(1);
}
console.log('OK:', REQUIRED.length, 'required deploy routes exist');
