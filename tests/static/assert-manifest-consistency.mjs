#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'cases/src/_data/manifest.json'), 'utf8')
);
const hubLive = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'cases/src/_data/hub-live-cases.json'), 'utf8')
);

const errors = [];
const slugs = new Set();
const liveFromManifest = manifest.cases.filter((c) => c.status === 'live');

if (liveFromManifest.length !== hubLive.cases.length) {
  errors.push(
    `hub-live-cases count ${hubLive.cases.length} !== manifest live ${liveFromManifest.length}`
  );
}

for (const c of manifest.cases) {
  if (slugs.has(c.slug)) errors.push(`duplicate slug: ${c.slug}`);
  slugs.add(c.slug);
  if (!c.title || !c.track) errors.push(`incomplete entry: ${c.slug}`);
  if (c.status === 'live' && (!c.chapters || !c.chapters.length)) {
    errors.push(`live case missing chapters: ${c.slug}`);
  }
}

const hubSlugs = new Set(hubLive.cases.map((c) => c.slug));
for (const c of liveFromManifest) {
  if (!hubSlugs.has(c.slug)) errors.push(`live ${c.slug} missing from hub-live-cases.json`);
}

const caseDir = path.join(ROOT, 'cases/src/cases');
for (const c of liveFromManifest) {
  const idx = path.join(caseDir, c.slug, 'index.njk');
  if (!fs.existsSync(idx)) errors.push(`live case missing source: ${c.slug}/index.njk`);
  const casey = path.join(caseDir, c.slug, 'casey.json');
  if (!fs.existsSync(casey)) errors.push(`live case missing casey.json: ${c.slug}`);
}

if (errors.length) {
  console.error('Manifest consistency failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log(
  'OK: manifest',
  manifest.cases.length,
  'cases,',
  liveFromManifest.length,
  'live, hub-live aligned'
);
