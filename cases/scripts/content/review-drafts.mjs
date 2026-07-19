#!/usr/bin/env node
/**
 * Turns every scripts/content/drafts/<slug>.json into one scannable
 * markdown file (drafts/REVIEW.md) — old boilerplate vs. proposed
 * replacement, grouped by case, so a human can read through all of them
 * in one pass instead of opening 20+ JSON files.
 *
 * This step does not call the Claude API and does not touch any real
 * casey.json — it only reads scripts/content/drafts/*.json (written by
 * draft-boilerplate-fixes.mjs) and writes drafts/REVIEW.md.
 *
 * Usage:
 *   node scripts/content/review-drafts.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = resolve(__dir, 'drafts');
const REVIEW_PATH = resolve(DRAFTS_DIR, 'REVIEW.md');

function loadDrafts() {
  let files;
  try {
    files = readdirSync(DRAFTS_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const drafts = [];
  for (const f of files) {
    try {
      drafts.push(JSON.parse(readFileSync(resolve(DRAFTS_DIR, f), 'utf8')));
    } catch (err) {
      console.warn(`  skipping ${f} — not valid JSON (${err.message})`);
    }
  }
  return drafts.sort((a, b) => a.slug.localeCompare(b.slug));
}

function renderDraft(draft) {
  const lines = [`## ${draft.slug}`, '', `_generated ${draft.generatedAt} · ${draft.model}_`, ''];
  for (const { chapter, tone, old, new: next } of draft.slots) {
    lines.push(`**${chapter} / ${tone}**`);
    lines.push(`- old: ${old ? `"${old}"` : '_(empty)_'}`);
    lines.push(`- new: "${next}"`);
    lines.push('');
  }
  return lines.join('\n');
}

function main() {
  const drafts = loadDrafts();
  if (drafts.length === 0) {
    console.log('No drafts found. Run draft-boilerplate-fixes.mjs first.');
    return;
  }

  const totalSlots = drafts.reduce((sum, d) => sum + d.slots.length, 0);
  const header = [
    '# Draft review — boilerplate Casey hint replacements',
    '',
    `${drafts.length} case${drafts.length === 1 ? '' : 's'}, ${totalSlots} proposed hint${totalSlots === 1 ? '' : 's'}.`,
    '',
    'Nothing here is live. Approve a case by running:',
    '```',
    'node scripts/content/apply-draft.mjs --slug=<slug>',
    '```',
    'which patches that case\'s real casey.json and leaves this draft file in place as a record.',
    '',
    '---',
    '',
  ].join('\n');

  const body = drafts.map(renderDraft).join('\n---\n\n');
  writeFileSync(REVIEW_PATH, `${header}${body}`, 'utf8');
  console.log(`Wrote ${REVIEW_PATH.replace(process.cwd(), '.')} — ${drafts.length} cases, ${totalSlots} slots.`);
}

main();
