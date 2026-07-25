#!/usr/bin/env node
/**
 * Applies an already-reviewed draft (scripts/content/drafts/<slug>-prose.json)
 * into the real cases/src/cases/<slug>/index.njk — the one explicit,
 * human-triggered step that actually changes a case's published prose.
 * draft-case-prose.mjs never writes here directly.
 *
 * Usage:
 *   node scripts/content/apply-case-prose.mjs --slug=<slug> [--dry-run]
 *
 *   --dry-run   print what would change, write nothing
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFlags } from '../social/lib/cli-args.mjs';
import { caseSourcePath } from './lib/case-source.mjs';
import { patchHeadline, patchToneBody, buildParagraphsHtml } from './lib/case-patch.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = resolve(__dir, 'drafts');
const TONES = ['junior', 'mid', 'staff'];

function main() {
  const { flags, kv } = parseFlags(process.argv.slice(2));
  const slug = kv.slug;
  const dryRun = flags.has('--dry-run') || process.env.DRY_RUN === '1';

  if (!slug) {
    console.error('usage: node scripts/content/apply-case-prose.mjs --slug=<slug> [--dry-run]');
    process.exit(1);
  }

  const draftPath = resolve(DRAFTS_DIR, `${slug}-prose.json`);
  if (!existsSync(draftPath)) {
    console.error(`error: no draft at scripts/content/drafts/${slug}-prose.json — run draft-case-prose.mjs first`);
    process.exit(1);
  }
  const draft = JSON.parse(readFileSync(draftPath, 'utf8'));

  const targetPath = caseSourcePath(slug);
  if (!existsSync(targetPath)) {
    console.error(`error: no index.njk at ${targetPath}`);
    process.exit(1);
  }
  let html = readFileSync(targetPath, 'utf8');

  let applied = 0;
  let skipped = 0;
  for (const ch of draft.chapters) {
    const headlinePatched = patchHeadline(html, ch.chapter, ch.headline);
    if (headlinePatched === null) {
      console.warn(`  skip [${ch.chapter}] headline — chapter not found in index.njk`);
      skipped++;
    } else {
      html = headlinePatched;
      applied++;
    }

    for (const tone of TONES) {
      const paragraphs = ch.tones?.[tone] ?? [];
      if (paragraphs.length === 0) {
        console.warn(`  skip [${ch.chapter}/${tone}] — draft has no paragraphs`);
        skipped++;
        continue;
      }
      // takeaway tone blocks are bare text inside a compact <li>, not full
      // <p> paragraphs (see any live case's takeaway list) — every other
      // chapter uses full <p>-wrapped prose.
      const bodyHtml = ch.chapter === 'takeaway' ? paragraphs.join(' ') : buildParagraphsHtml(paragraphs);
      const bodyPatched = patchToneBody(html, ch.chapter, tone, bodyHtml);
      if (bodyPatched === null) {
        console.warn(`  skip [${ch.chapter}/${tone}] — tone block not found in index.njk`);
        skipped++;
        continue;
      }
      html = bodyPatched;
      console.log(`  [${ch.chapter}/${tone}] ${paragraphs.length} paragraph(s) applied`);
      applied++;
    }
  }

  if (skipped > 0) {
    console.warn(`  ${skipped} slot(s) skipped`);
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] would apply ${applied} slot(s) to ${targetPath.replace(process.cwd(), '.')}`);
    return;
  }

  if (applied === 0) {
    console.error('\nApplied 0 slots — nothing written');
    process.exit(1);
  }

  writeFileSync(targetPath, html, 'utf8');
  console.log(`\nApplied ${applied} slot(s) to ${targetPath.replace(process.cwd(), '.')}`);
  console.log('Remaining manual work: ui-strip copy, demo button/aria labels, noscript text, references, the actual demo — see scaffold-case.mjs\'s README.');
}

main();
