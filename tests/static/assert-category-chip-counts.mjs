#!/usr/bin/env node
/**
 * Regression guard for design-backlog idea #33 (Reading library category
 * chip counts). The library's category filter chips
 * (cases/src/library/index.njk) render each category's `count` straight
 * from the pre-baked cases/src/_data/hub-facets.json — unlike the track
 * chips (hub-filters.js's annotateTrackOptions(), computed live from the
 * DOM) there is no build step that regenerates hub-facets.json's category
 * counts from the 779-row cases/src/_data/library-entries.json they're
 * supposed to describe. Auditing this pass found the counts still correct
 * today, but nothing was actually protecting them — the same
 * two-independent-copies shape that already caused real drift for the
 * `principle` field (idea #25) and a truncated-slug collision (idea #34).
 * This test closes that gap by tallying the real per-category counts from
 * library-entries.json and failing if hub-facets.json's `count`,
 * `totalCount`, or `interactiveCount` fields ever drift from reality.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const facets = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'cases/src/_data/hub-facets.json'), 'utf8')
);
const entries = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'cases/src/_data/library-entries.json'), 'utf8')
);

const real = new Map(); // id -> { total, interactive }
entries.forEach((e) => {
  (e.categories || []).forEach((id) => {
    const rec = real.get(id) || { total: 0, interactive: 0 };
    rec.total += 1;
    if (e.interactive) rec.interactive += 1;
    real.set(id, rec);
  });
});

const errors = [];
facets.categories.forEach((cat) => {
  const rec = real.get(cat.id) || { total: 0, interactive: 0 };
  if (cat.count !== rec.total) {
    errors.push(`${cat.id}: "count" is ${cat.count}, real tally is ${rec.total}`);
  }
  if (cat.totalCount !== rec.total) {
    errors.push(`${cat.id}: "totalCount" is ${cat.totalCount}, real tally is ${rec.total}`);
  }
  if (cat.interactiveCount !== rec.interactive) {
    errors.push(`${cat.id}: "interactiveCount" is ${cat.interactiveCount}, real tally is ${rec.interactive}`);
  }
});

// Also catch a category present in the real data but missing from the chip
// list entirely (a reader would have no way to filter to it).
const declaredIds = new Set(facets.categories.map((c) => c.id));
for (const id of real.keys()) {
  if (!declaredIds.has(id)) {
    errors.push(`"${id}" appears on ${real.get(id).total} library entries but has no chip in hub-facets.json`);
  }
}

if (errors.length) {
  console.error('Category chip count failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log(
  'OK:', facets.categories.length, 'category chip counts checked against', entries.length, 'library entries'
);
