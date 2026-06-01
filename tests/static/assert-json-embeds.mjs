#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { deployRoot } from './deploy-root.mjs';

const DEPLOY = deployRoot();
const hub = fs.readFileSync(path.join(DEPLOY, 'cases/index.html'), 'utf8');

const ids = ['manifest-slug-order', 'hub-case-titles', 'casey-hub-data', 'hub-live-cases'];
const errors = [];

for (const id of ids) {
  const re = new RegExp(`<script[^>]+id="${id}"[^>]*>([\\s\\S]*?)</script>`, 'i');
  const m = hub.match(re);
  if (!m) {
    errors.push(`hub missing script#${id}`);
    continue;
  }
  try {
    const data = JSON.parse(m[1].trim());
    if (id === 'manifest-slug-order' && !Array.isArray(data)) errors.push(`${id} not array`);
    if (id === 'hub-live-cases' && (!data.cases || !data.cases.length)) errors.push(`${id} empty cases`);
    if (id === 'hub-case-titles' && typeof data !== 'object') errors.push(`${id} not object`);
  } catch (e) {
    errors.push(`${id} invalid JSON: ${e.message}`);
  }
}

const caseHtml = fs.readFileSync(
  path.join(DEPLOY, 'cases/abort-controller-ghost-updates/index.html'),
  'utf8'
);
if (!caseHtml.includes('id="casey-data"')) errors.push('case page missing casey-data');

if (errors.length) {
  console.error('JSON embed failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log('OK: hub JSON embeds parse; casey-data present on sample case');
