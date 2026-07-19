#!/usr/bin/env node
/**
 * Regression guard for the manifest.json <-> per-case front-matter drift
 * found while shipping design-backlog ideas #23/#25 (demo-type tag and
 * principle chip on the case cover): manifest.json and each live case's own
 * src/cases/{slug}/index.njk front matter are two independently-maintained
 * copies of the same facts (same duplication class as the readMin drift
 * documented in .eleventy.js, and the flagship drift fixed for idea #24).
 *
 * Concretely, 9 of 31 live cases had a `principle` value in manifest.json
 * that no longer matched their own front matter (e.g.
 * micro-frontend-boundary-drift: manifest said "Bounded context", the case's
 * own page said "Design system governance") — meaning llms.txt and the
 * sitemap described a case differently than the case's own page did. Fixed
 * once by syncing manifest.json to the front matter (the page-authored,
 * reader-visible value). This test stops it from silently drifting again
 * for the three fields readers or crawlers can see: `principle` (case cover
 * chip + SEO keywords/JSON-LD), `demoType` (case cover chip + demo chapter
 * icon), and `flagship` (case cover badge + hub badge + llms.txt tag).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'cases/src/_data/manifest.json'), 'utf8')
);

const FIELDS = ['principle', 'demoType', 'flagship'];
const liveCases = manifest.cases.filter((c) => c.status === 'live');

const errors = [];
liveCases.forEach((c) => {
  const fmPath = path.join(ROOT, 'cases/src/cases', c.slug, 'index.njk');
  let raw;
  try {
    raw = fs.readFileSync(fmPath, 'utf8');
  } catch (e) {
    errors.push(`${c.slug}: no front-matter file found at ${fmPath}`);
    return;
  }
  const fmBlock = raw.match(/^---([\s\S]*?)---/);
  if (!fmBlock) {
    errors.push(`${c.slug}: front matter block not found`);
    return;
  }
  const fm = fmBlock[1];

  FIELDS.forEach((field) => {
    const re = new RegExp(`^${field}:\\s*(.+)$`, 'm');
    const match = fm.match(re);
    const fmValue = match ? match[1].trim() : undefined;
    const manifestValue = c[field] === undefined ? undefined : String(c[field]);
    if (fmValue !== manifestValue) {
      errors.push(
        `${c.slug}: "${field}" mismatch — manifest.json has ${JSON.stringify(manifestValue)}, front matter has ${JSON.stringify(fmValue)}`
      );
    }
  });
});

if (errors.length) {
  console.error('Manifest <-> front-matter parity failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log(
  'OK:', liveCases.length, 'live cases checked for manifest.json <-> front-matter parity on', FIELDS.join(', ')
);
