#!/usr/bin/env node
/**
 * Regression guard for design-backlog idea #34 — PR #20 fixed one library
 * entry whose slug was truncated mid-word
 * (financial-times-improving-the-cache-performance-of-the-polyf), which
 * collided with a second, different article sharing the same truncated
 * slug. The fix (unique catalog number by array position) tolerates
 * duplicates gracefully, but a truncated-slug import bug is still a real
 * data-quality issue worth catching, not silently accepting more of.
 *
 * This sweeps the full 779-entry library-entries.json for duplicate slugs.
 * The one known, already-triaged duplicate is allowlisted explicitly; any
 * NEW duplicate fails the build so it gets noticed at PR time instead of
 * being discovered by a reader hitting an ambiguous catalog link.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const entries = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'cases/src/_data/library-entries.json'), 'utf8')
);

const KNOWN_DUPLICATE_SLUGS = new Set([
  'financial-times-improving-the-cache-performance-of-the-polyf',
]);

const counts = new Map();
entries.forEach((e) => {
  if (!e.slug) return;
  counts.set(e.slug, (counts.get(e.slug) || 0) + 1);
});

const errors = [];
const newDuplicates = [];
for (const [slug, count] of counts) {
  if (count <= 1) continue;
  if (KNOWN_DUPLICATE_SLUGS.has(slug)) continue;
  newDuplicates.push(`${slug} (${count}×)`);
}
if (newDuplicates.length) {
  errors.push(`new duplicate slug(s) found: ${newDuplicates.join(', ')}`);
}

// Keep the allowlist honest — if the known duplicate ever gets fixed to be
// unique, remove it from KNOWN_DUPLICATE_SLUGS rather than leaving stale
// tolerance in place.
for (const slug of KNOWN_DUPLICATE_SLUGS) {
  if ((counts.get(slug) || 0) <= 1) {
    errors.push(`allowlisted duplicate "${slug}" is no longer duplicated — remove it from the allowlist`);
  }
}

if (errors.length) {
  console.error('Library slug uniqueness failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log(
  'OK:', entries.length, 'library entries checked,', KNOWN_DUPLICATE_SLUGS.size,
  'known pre-existing duplicate(s) allowlisted, no new duplicates'
);
