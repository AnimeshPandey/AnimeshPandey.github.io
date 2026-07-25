#!/usr/bin/env node
/**
 * Drafts chapter prose (headline + junior/mid/staff body paragraphs) for
 * an idea-status case's core narrative chapters — hook, concept, story-1,
 * fe-depth, takeaway. Extends the draft/review/apply pattern that
 * draft-boilerplate-fixes.mjs established for casey.json hints, applied
 * here to the actual chapter bodies of a not-yet-written case, per the
 * §04/§06 plan in the deferred-work doc.
 *
 * Scope, deliberately: this drafts prose for a case ALREADY scaffolded by
 * scaffold-case.mjs (manifest entry + front-matter + demo shell must
 * already exist). It does NOT draft ui-strip copy, demo button labels/
 * aria-labels/noscript text, references, or the interactive demo itself —
 * those stay real engineering/authoring work per the scaffold tool's own
 * README. This is a drafting aid for the narrative chapters, not a
 * full-case generator.
 *
 * Like draft-boilerplate-fixes.mjs, this never writes to a real
 * index.njk. It drafts, a human reads every paragraph, and
 * apply-case-prose.mjs is the one explicit step that patches the real file.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY   — console.anthropic.com/settings/keys
 *
 * Usage:
 *   node scripts/content/draft-case-prose.mjs --slug=<slug> [--dry-run] [--force]
 *
 *   --dry-run   print the exact prompt that would be sent, make no API call, write nothing
 *   --force     regenerate even if scripts/content/drafts/<slug>-prose.json already exists
 *
 * See ./README.md for the full pipeline.
 */

import { loadLocalEnv, requireEnv } from '../social/lib/env.mjs';

loadLocalEnv();

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { loadManifestCase } from '../social/lib/content.mjs';
import { parseFlags } from '../social/lib/cli-args.mjs';
import { chapterProse, readCaseHtml, caseSourcePath } from './lib/case-source.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = resolve(__dir, 'drafts');
const MODEL = 'claude-opus-4-8';
const TONES = ['junior', 'mid', 'staff'];
const CHAPTERS = ['hook', 'concept', 'story-1', 'fe-depth', 'takeaway'];

// One real, already-good case supplies few-shot voice/register calibration —
// not content to copy, just how long a paragraph runs and how each tone reads.
const EXAMPLE_SLUG = 'key-prop-identity';

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chapter: { type: 'string', enum: CHAPTERS },
          headline: { type: 'string' },
          tones: {
            type: 'object',
            properties: {
              junior: { type: 'array', items: { type: 'string' } },
              mid: { type: 'array', items: { type: 'string' } },
              staff: { type: 'array', items: { type: 'string' } },
            },
            required: ['junior', 'mid', 'staff'],
            additionalProperties: false,
          },
        },
        required: ['chapter', 'headline', 'tones'],
        additionalProperties: false,
      },
    },
  },
  required: ['chapters'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are drafting the core narrative chapters for a new case study on The Frontend Casebook, a technical case-study site with a cat mascot named Casey. This site's stated brand value is no AI slop — every claim must be concrete and technically correct, not generic advice restated confidently.

CHAPTER ROLES:
- hook: opens with a SPECIFIC, concrete broken-code scenario the reader will recognize — a symptom, not an explanation. End by naming the real cause in one sentence, not a teaser.
- concept: explains the underlying mechanism precisely — cite the real spec/API/algorithm behavior, not a hand-wavy analogy (analogies belong in the junior tone only, per the register rules below).
- story-1: a short narrative grounding the concept in a plausible real dev-team situation — how the bug got introduced, what the fix actually looked like in review. Not a repeat of the hook.
- fe-depth: goes past the immediate fix into production concerns — architecture, tooling (lint rules, TypeScript patterns), or failure modes at scale.
- takeaway: one crisp, quotable, memorizable statement of the principle per tone — this is what a reader should still remember a week later, not a summary of the chapter.

TONE REGISTER (same case, three reading levels — write genuinely different content per tone, not the same paragraph reworded):
- junior: plain words, an analogy is welcome, encouraging, assumes no prior context beyond basic syntax.
- mid: names the pattern/API directly, pragmatic, assumes working knowledge of the ecosystem.
- staff: terse, production-lens, assumes competence — trade-offs, failure modes, or architectural framing, not a restatement of the mid-tone content at higher vocabulary.

CONSTRAINTS:
- Each chapter needs a headline (plain text, no markdown, no trailing period) and 1-3 short paragraphs PER TONE as an array of strings.
- Paragraphs may use inline <code>...</code> for identifiers/APIs/props and <strong>...</strong> for emphasis — no other HTML, no markdown syntax (no backticks, no **bold**).
- Ground every technical claim in real, verifiable behavior of the actual technology named — do not invent API names, error messages, or numbers.
- Do not repeat the same sentence or claim across hook/concept/story-1/fe-depth — each chapter must add something the others didn't say.
- takeaway paragraphs should be a single short sentence each, not a full paragraph — see the example case's takeaway list for length.`;

function buildFewShotExample() {
  const html = readCaseHtml(EXAMPLE_SLUG);
  if (!html) return '(no example case found — proceeding without few-shot grounding)';
  const lines = [`Example case: "${EXAMPLE_SLUG}" — for voice/length/register calibration only, do not reuse its content:`];
  for (const chapter of ['hook', 'concept']) {
    lines.push(`\n[${chapter}]`);
    for (const tone of TONES) {
      const prose = chapterProse(html, chapter, tone);
      if (prose) lines.push(`  [${tone}]: ${prose}`);
    }
  }
  return lines.join('\n');
}

function buildUserPrompt(manifestCase) {
  const lines = [];
  lines.push(`Case: "${manifestCase.title}"`);
  lines.push(`Track: ${manifestCase.track}`);
  lines.push(`Principle (short tag, not a full sentence — expand on this): ${manifestCase.principle}`);
  lines.push(`Demo type: ${manifestCase.demoType} (the demo chapter itself is out of scope — do not draft it)`);
  lines.push('');
  lines.push(buildFewShotExample());
  lines.push('');
  lines.push(`Draft headline + junior/mid/staff paragraphs for exactly these chapters: ${CHAPTERS.join(', ')}.`);
  return lines.join('\n');
}

async function draftCase(client, manifestCase, { dryRun, force }) {
  const draftPath = resolve(DRAFTS_DIR, `${manifestCase.slug}-prose.json`);
  if (!dryRun && !force && existsSync(draftPath)) {
    console.log(`  skip ${manifestCase.slug} — draft already exists (--force to regenerate)`);
    return 'skipped';
  }

  if (!existsSync(caseSourcePath(manifestCase.slug))) {
    console.error(`  ${manifestCase.slug}: no index.njk found — run scaffold-case.mjs promote first`);
    return 'error';
  }

  const userPrompt = buildUserPrompt(manifestCase);

  if (dryRun) {
    console.log(`\n=== DRY RUN: ${manifestCase.slug} ===`);
    console.log('--- system prompt (identical + cached across cases) ---');
    console.log(SYSTEM_PROMPT);
    console.log('--- user prompt ---');
    console.log(userPrompt);
    return 'dry-run';
  }

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      output_config: { format: { type: 'json_schema', schema: DRAFT_SCHEMA } },
      messages: [{ role: 'user', content: userPrompt }],
    });
  } catch (err) {
    console.error(`  ${manifestCase.slug}: API call failed — ${err.message}`);
    return 'error';
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    console.error(`  ${manifestCase.slug}: no text block in response (stop_reason: ${response.stop_reason})`);
    return 'error';
  }

  let parsed;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch (err) {
    console.error(`  ${manifestCase.slug}: model response wasn't valid JSON — ${err.message}`);
    return 'error';
  }

  const returnedChapters = new Set((parsed.chapters ?? []).map((c) => c.chapter));
  const missing = CHAPTERS.filter((c) => !returnedChapters.has(c));
  if (missing.length > 0) {
    console.warn(`  ${manifestCase.slug}: model omitted ${missing.length} requested chapter(s): ${missing.join(', ')}`);
  }

  const draft = {
    slug: manifestCase.slug,
    generatedAt: new Date().toISOString(),
    model: MODEL,
    chapters: parsed.chapters ?? [],
  };

  mkdirSync(DRAFTS_DIR, { recursive: true });
  writeFileSync(draftPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
  console.log(`  wrote drafts/${manifestCase.slug}-prose.json (${draft.chapters.length} chapter${draft.chapters.length === 1 ? '' : 's'})`);
  return 'drafted';
}

async function main() {
  const { flags, kv } = parseFlags(process.argv.slice(2));
  const dryRun = flags.has('--dry-run') || process.env.DRY_RUN === '1';
  const force = flags.has('--force');
  const slug = kv.slug;

  if (!slug) {
    console.error('usage: node scripts/content/draft-case-prose.mjs --slug=<slug> [--dry-run] [--force]');
    process.exit(1);
  }

  const { ANTHROPIC_API_KEY } = requireEnv(['ANTHROPIC_API_KEY'], { dryRun });
  const client = dryRun ? null : new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  let manifestCase;
  try {
    manifestCase = loadManifestCase(slug);
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
  if (manifestCase.status === 'live') {
    console.error(`error: "${slug}" is already live — this tool is for idea-status cases only`);
    process.exit(1);
  }

  console.log(`Drafting core chapter prose for "${manifestCase.title}"${dryRun ? ' (DRY RUN — no API call, nothing written)' : ''}...`);
  const result = await draftCase(client, manifestCase, { dryRun, force });

  if (result === 'drafted') {
    console.log('Review with:  node scripts/content/review-case-prose.mjs --slug=' + slug);
    console.log('Apply with:   node scripts/content/apply-case-prose.mjs --slug=' + slug);
  }
}

main().catch((err) => {
  console.error('error:', err.message);
  process.exit(1);
});
