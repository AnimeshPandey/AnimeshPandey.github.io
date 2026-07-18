#!/usr/bin/env node
/**
 * Regression guard for portfolio articles' reading time (design-backlog idea
 * #9, mirrors idea #1's Casebook guard) — PR #17 replaced one flagship
 * article's hand-typed "N min read" with a real, build-time wordStats
 * computation off its actual prose (site/.eleventy.js's `wordStats` filter).
 * This script re-checks the *built* output so a future edit can't silently
 * swap a computed figure back for a hand-typed one.
 *
 * Scope note: only "full" articles (ones whose prose lives entirely in this
 * repo) can have their reading time computed locally. This site also has
 * teaser pages (e.g. fundamentals-of-functional-javascript,
 * how-well-do-you-know-this) whose full text lives externally on Medium/
 * Dev.to — there is no local prose to measure, so their "N min read" figures
 * are necessarily hand-typed estimates of the external piece, not a bug this
 * script can or should flag. We identify "full" articles the same way PR #17
 * marked them: the presence of the real `title="<N> words, measured from
 * this article's actual prose"` attribute the wordStats-driven markup emits.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deployRoot } from './deploy-root.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEPLOY = deployRoot();
const SITE_SRC = path.join(ROOT, 'site/src');

function listHtmlFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'cases') continue; // Casebook has its own guard
      out.push(...listHtmlFiles(p));
    } else if (ent.name === 'index.html') {
      out.push(p);
    }
  }
  return out;
}

function rawWordCount(slug) {
  const filePath = path.join(SITE_SRC, slug, 'index.njk');
  if (!fs.existsSync(filePath)) return null;
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
let computedCount = 0;
const teaserFindings = [];

for (const file of listHtmlFiles(DEPLOY)) {
  const html = fs.readFileSync(file, 'utf8');
  const computedMatch = html.match(
    /title="(\d+) words, measured from this article's actual prose">(\d+) min read/
  );
  const anyReadTime = html.match(/(\d+) min read/);
  if (!anyReadTime) continue; // not an article page at all

  const slug = path.relative(DEPLOY, path.dirname(file)) || '.';

  if (computedMatch) {
    computedCount += 1;
    const words = Number(computedMatch[1]);
    const minutes = Number(computedMatch[2]);
    if (!(minutes >= 1)) errors.push(`${slug}: computed minutes ${minutes} is not positive`);
    if (!(words > 20)) errors.push(`${slug}: computed word count ${words} implausibly small`);
    const raw = rawWordCount(slug);
    if (raw !== null && !(words < raw)) {
      errors.push(`${slug}: computed words ${words} not less than raw file total ${raw}`);
    }
    const expectedMinutes = Math.max(1, Math.ceil(words / 200));
    if (minutes !== expectedMinutes) {
      errors.push(
        `${slug}: shown ${minutes} min read doesn't match Math.ceil(${words}/200) = ${expectedMinutes}`
      );
    }
  } else {
    teaserFindings.push(`${slug}: "${anyReadTime[0]}" (hand-typed — no local prose to verify against)`);
  }
}

if (computedCount === 0) {
  errors.push('no article page found using the real, computed wordStats reading-time idiom');
}

if (errors.length) {
  console.error('Portfolio reading-time honesty failures:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log(
  'OK:',
  computedCount,
  'portfolio article(s) show real, computed reading time, consistent with their own prose'
);
if (teaserFindings.length) {
  console.log('  (', teaserFindings.length, 'teaser page(s) with hand-typed, unverifiable-locally read times — not a failure:');
  teaserFindings.forEach((f) => console.log('    -', f));
  console.log('  )');
}
