#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'cases/src/_data/manifest.json'), 'utf8')
);
const slugs = manifest.cases.filter((c) => c.status === 'live').map((c) => c.slug);
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/live-slugs.json');
fs.writeFileSync(out, JSON.stringify(slugs, null, 2) + '\n');
console.log('Wrote', slugs.length, 'live slugs to', out);
