#!/usr/bin/env node
/**
 * Turns every scripts/content/drafts/<slug>-prose.json into one readable
 * report — same purpose as review-drafts.mjs, for case-prose drafts
 * instead of hint drafts.
 *
 * Usage:
 *   node scripts/content/review-case-prose.mjs
 *   node scripts/content/review-case-prose.mjs --slug=<slug>   (single case)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFlags } from '../social/lib/cli-args.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = resolve(__dir, 'drafts');

function loadDrafts(slugFilter) {
  if (!existsSync(DRAFTS_DIR)) return [];
  return readdirSync(DRAFTS_DIR)
    .filter((f) => f.endsWith('-prose.json'))
    .map((f) => JSON.parse(readFileSync(resolve(DRAFTS_DIR, f), 'utf8')))
    .filter((d) => !slugFilter || d.slug === slugFilter);
}

function renderDraft(draft) {
  const lines = [`## ${draft.slug}`, '', `_generated ${draft.generatedAt} · ${draft.model}_`, ''];
  for (const ch of draft.chapters) {
    lines.push(`### ${ch.chapter} — "${ch.headline}"`, '');
    for (const tone of ['junior', 'mid', 'staff']) {
      lines.push(`**${tone}**`);
      for (const p of ch.tones[tone] ?? []) lines.push(`> ${p}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function main() {
  const { kv } = parseFlags(process.argv.slice(2));
  const drafts = loadDrafts(kv.slug);

  if (drafts.length === 0) {
    console.log('No case-prose drafts found. Run draft-case-prose.mjs first.');
    return;
  }

  const report = [
    '# Case prose review',
    '',
    `${drafts.length} draft${drafts.length === 1 ? '' : 's'} — read every paragraph before applying. This is a first draft, not reviewed copy.`,
    '',
    ...drafts.map(renderDraft),
  ].join('\n');

  mkdirSync(DRAFTS_DIR, { recursive: true });
  writeFileSync(resolve(DRAFTS_DIR, 'PROSE_REVIEW.md'), report, 'utf8');
  console.log(`Wrote drafts/PROSE_REVIEW.md (${drafts.length} case${drafts.length === 1 ? '' : 's'})`);
}

main();
