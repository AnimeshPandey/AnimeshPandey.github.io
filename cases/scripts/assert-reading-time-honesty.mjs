#!/usr/bin/env node
/**
 * Regression guard for the "real number, not decoration" reading-time fix
 * (design-backlog idea #1): manifest.json's readMin used to be a flat,
 * hand-typed 10 for every single case (live or not), and each case's own
 * front-matter readMin was a second, independently hand-typed guess. Both
 * are now derived at build time from real prose (cases/.eleventy.js's
 * caseReadingStats). This script re-checks the *built* output so a future
 * change can't silently reintroduce a fabricated, one-size-fits-all number
 * without deliberately reimplementing the exact tone-stripping word-count
 * logic (which would risk false failures) — it instead checks the
 * properties that a real, honest number must have:
 *   1. every live case shows a positive "N min read" on its own page
 *   2. the hub card's "Nm" for that case matches the cover page exactly
 *      (single computed source, not two independently drifting guesses)
 *   3. the reported word count is a plausible fraction of the case's raw
 *      source file's total word count (catches "someone hardcoded a
 *      constant again" and "the tone-stripping broke and now double/triple
 *      counts" as gross sanity bounds, without duplicating the exact
 *      balanced-div stripping algorithm here)
 *   4. not every live case reports the identical minute value (the
 *      specific shape of the original bug)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/_data/manifest.json'), 'utf8')
);
const live = manifest.cases.filter((c) => c.status === 'live');
const siteDir = path.join(ROOT, '_site');

function rawWordCount(slug) {
  const filePath = path.join(ROOT, 'src/cases', slug, 'index.njk');
  const raw = fs.readFileSync(filePath, 'utf8');
  const body = raw.replace(/^---[\s\S]*?---\s*/, '');
  const text = body
    .replace(/\{#[\s\S]*?#\}/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/\{%[\s\S]*?%\}/g, ' ')
    .replace(/<[^>]*>/g, ' ');
  return (text.match(/\S+/g) || []).length;
}

const errors = [];
const minuteValues = new Set();
const fullHubHtml = fs.readFileSync(path.join(siteDir, 'index.html'), 'utf8');
// Restrict lookups to the actual card grid — the page also links to the
// flagship case from an earlier hero CTA using the same href, which would
// otherwise be matched instead of the real card.
const gridStart = fullHubHtml.indexOf('id="hub-grid"');
const gridEnd = fullHubHtml.indexOf('id="hub-grid-empty"');
const hubHtml = fullHubHtml.slice(gridStart, gridEnd);

for (const c of live) {
  const coverPath = path.join(siteDir, c.slug, 'index.html');
  if (!fs.existsSync(coverPath)) {
    errors.push(`${c.slug}: missing built cover page`);
    continue;
  }
  const coverHtml = fs.readFileSync(coverPath, 'utf8');
  const coverMatch = coverHtml.match(/(\d+) min read/);
  if (!coverMatch) {
    errors.push(`${c.slug}: cover page has no "N min read"`);
    continue;
  }
  const coverMinutes = Number(coverMatch[1]);
  if (!(coverMinutes >= 1)) {
    errors.push(`${c.slug}: cover minutes ${coverMinutes} is not a positive number`);
  }
  minuteValues.add(coverMinutes);

  const wordsMatch = coverHtml.match(/title="(\d+) words, measured from this case's actual prose"/);
  if (!wordsMatch) {
    errors.push(`${c.slug}: cover page missing the real-word-count title attribute`);
  } else {
    const reportedWords = Number(wordsMatch[1]);
    const rawTotal = rawWordCount(c.slug);
    // Reported words should be a real fraction of the file's total word
    // count (all three tones + chrome combined) — strictly less than the
    // raw total (since only one tone's prose is counted), and not
    // vanishingly small.
    if (!(reportedWords > 20 && reportedWords < rawTotal)) {
      errors.push(
        `${c.slug}: reported words ${reportedWords} outside plausible bounds (raw file total ${rawTotal})`
      );
    }
  }

  const hrefIdx = hubHtml.indexOf(`href="/cases/${c.slug}/"`);
  if (hrefIdx === -1) {
    errors.push(`${c.slug}: not found on hub grid`);
    continue;
  }
  const liEnd = hubHtml.indexOf('</li>', hrefIdx);
  const hubSegment = hubHtml.slice(hrefIdx, liEnd === -1 ? hrefIdx + 1500 : liEnd);
  const hubMatch = hubSegment.match(/case-card__read">(\d+)m/);
  if (!hubMatch) {
    errors.push(`${c.slug}: hub card missing "Nm" read time`);
    continue;
  }
  const hubMinutes = Number(hubMatch[1]);
  if (hubMinutes !== coverMinutes) {
    errors.push(
      `${c.slug}: hub card shows ${hubMinutes}m but cover page shows ${coverMinutes} min — same case, two different numbers`
    );
  }
}

if (minuteValues.size === 1) {
  errors.push(
    `all ${live.length} live cases report the identical reading time (${[...minuteValues][0]} min) — looks like a flat placeholder, not real per-case measurement`
  );
}

if (errors.length) {
  console.error('Reading-time honesty failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log(
  'OK:',
  live.length,
  'live cases show real, per-case reading times, consistent between hub card and cover page (',
  minuteValues.size,
  'distinct values)'
);
