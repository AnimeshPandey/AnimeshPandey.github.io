#!/usr/bin/env node
/**
 * Applies an already-reviewed draft (scripts/content/drafts/<slug>.json)
 * into the real cases/src/cases/<slug>/casey.json — the one explicit,
 * human-triggered step in the pipeline that actually changes published
 * content. draft-boilerplate-fixes.mjs never writes here directly.
 *
 * Usage:
 *   node scripts/content/apply-draft.mjs --slug=<slug> [--dry-run]
 *
 *   --dry-run   print old -> new per slot, write nothing
 *
 * Re-running on the same slug after a fresh draft (--force'd from
 * draft-boilerplate-fixes.mjs) re-applies the newer draft's text.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFlags } from '../social/lib/cli-args.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = resolve(__dir, 'drafts');
const CASES_ROOT = resolve(__dir, '../..');

function caseyPath(slug) {
  return resolve(CASES_ROOT, `src/cases/${slug}/casey.json`);
}

function main() {
  const { flags, kv } = parseFlags(process.argv.slice(2));
  const slug = kv.slug;
  const dryRun = flags.has('--dry-run') || process.env.DRY_RUN === '1';

  if (!slug) {
    console.error('usage: node scripts/content/apply-draft.mjs --slug=<slug> [--dry-run]');
    process.exit(1);
  }

  const draftPath = resolve(DRAFTS_DIR, `${slug}.json`);
  if (!existsSync(draftPath)) {
    console.error(`error: no draft at scripts/content/drafts/${slug}.json — run draft-boilerplate-fixes.mjs first`);
    process.exit(1);
  }
  const draft = JSON.parse(readFileSync(draftPath, 'utf8'));

  const targetPath = caseyPath(slug);
  if (!existsSync(targetPath)) {
    console.error(`error: no casey.json at ${targetPath}`);
    process.exit(1);
  }
  const casey = JSON.parse(readFileSync(targetPath, 'utf8'));

  let applied = 0;
  let skipped = 0;
  casey.hints = casey.hints ?? [];
  for (const { chapter, tone, new: next } of draft.slots) {
    const text = (next ?? '').trim();
    if (!text) {
      console.warn(`  skip [${chapter}/${tone}] — draft has no replacement text, leaving casey.json untouched here`);
      skipped++;
      continue;
    }

    let entry = casey.hints.find((h) => h.chapter === chapter);
    if (!entry) {
      // The chapter had no hints entry at all (findBoilerplateSlots treats
      // that the same as boilerplate text) — create it rather than silently
      // dropping the slot, or the reviewed content never actually lands.
      entry = { chapter };
      casey.hints.push(entry);
    }

    const before = entry[tone] ?? '(empty)';
    console.log(`  [${chapter}/${tone}] "${before}"  ->  "${text}"`);
    if (!dryRun) entry[tone] = text;
    applied++;
  }

  if (skipped > 0) {
    console.warn(`  ${skipped} slot(s) skipped — re-run draft-boilerplate-fixes.mjs --force to regenerate them`);
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] would apply ${applied} slot(s) to ${targetPath.replace(process.cwd(), '.')}`);
    return;
  }

  if (applied === 0) {
    console.error(`\nApplied 0 of ${draft.slots.length} slot(s) — nothing written`);
    process.exit(1);
  }

  writeFileSync(targetPath, `${JSON.stringify(casey, null, 2)}\n`, 'utf8');
  console.log(`\nApplied ${applied} slot(s) to ${targetPath.replace(process.cwd(), '.')}`);
}

main();
