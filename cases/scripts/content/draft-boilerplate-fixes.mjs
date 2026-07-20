#!/usr/bin/env node
/**
 * Drafts replacement `concept`/`fe-depth` Casey hints for cases whose
 * casey.json currently hits KNOWN_BOILERPLATE_HINTS (see
 * ../social/lib/content.mjs) — the content-quality gap found while
 * building the social cross-posting scripts.
 *
 * This is a DRAFT tool, not a publish tool: it never writes to a real
 * casey.json. It writes one review file per case under scripts/content/
 * drafts/<slug>.json, pairing the old boilerplate text with a proposed
 * replacement grounded in that case's own real chapter prose (index.njk),
 * for a human to read and explicitly accept via apply-draft.mjs.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY   — console.anthropic.com/settings/keys
 *
 * Usage:
 *   node scripts/content/draft-boilerplate-fixes.mjs --slug=<slug> [--dry-run] [--force]
 *   node scripts/content/draft-boilerplate-fixes.mjs --all [--dry-run] [--force]
 *
 *   --dry-run   print the exact prompt(s) that would be sent, make no API call, write nothing
 *   --force     regenerate even if scripts/content/drafts/<slug>.json already exists
 *
 * DRY_RUN=1 works the same as --dry-run, matching the social scripts' convention.
 *
 * See ./README.md for the full pipeline (draft → review-drafts.mjs → apply-draft.mjs).
 */

import { loadLocalEnv, requireEnv } from '../social/lib/env.mjs';

loadLocalEnv();

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { loadManifest, loadCaseyHints, KNOWN_BOILERPLATE_HINTS, rawHintText } from '../social/lib/content.mjs';
import { parseFlags } from '../social/lib/cli-args.mjs';
import { findBoilerplateSlots } from './lib/boilerplate.mjs';
import { chapterProse, readCaseHtml } from './lib/case-source.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = resolve(__dir, 'drafts');
const MODEL = 'claude-opus-4-8';
const TONES = ['junior', 'mid', 'staff'];

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    hints: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chapter: { type: 'string', enum: ['concept', 'fe-depth'] },
          tone: { type: 'string', enum: TONES },
          text: { type: 'string' },
        },
        required: ['chapter', 'tone', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['hints'],
  additionalProperties: false,
};

const BANNED_LIST = [...KNOWN_BOILERPLATE_HINTS].map((s) => `- "${s}"`).join('\n');

const SYSTEM_PROMPT = `You are drafting short "Casey" hint lines for The Frontend Casebook, a technical case-study site with a cat mascot named Casey who narrates alongside each chapter.

WHAT A HINT IS: 1-2 sentences shown next to Casey's avatar in a chapter's margin. It is NOT the chapter's educational prose (that's written separately and already good) — it's Casey's own short, specific remark that points at something real in that chapter. A reader should be able to tell which case and which chapter a hint belongs to just by reading it; a hint that could be pasted onto any other case's same chapter without anyone noticing is a failure.

TONE RULES (three reading levels, same case, different depth):
- Concept chapter — junior: an analogy plus a one-sentence statement of the principle. mid: the principle plus a pointer to the relevant spec/MDN concept (name it, don't invent a URL). staff: trade-offs and failure modes.
- FE-depth chapter — junior: a checklist item or a short, concrete tip. mid: a snippet-shaped tip plus when NOT to use it. staff: architecture, observability, or process framing.
- Register across all chapters — junior: encouraging, plain words, no jargon. mid: names the pattern, pragmatic. staff: terse, production-lens, assumes competence.

NEVER WRITE ANY OF THESE EXACT SENTENCES, OR ANYTHING CLOSE TO THEM IN MEANING — they are the boilerplate this task exists to replace:
${BANNED_LIST}

GOOD EXAMPLES (real fe-depth hints from other live cases, for length/register only — do not reuse their content):
- [junior] "isolation: isolate is the clean way to create a stacking context on purpose; it has zero visual effect unlike opacity or transform."
- [mid] "A z-index token scale prevents the 9999 arms race. Define --z-modal, --z-tooltip, --z-dropdown once and reference them everywhere."
- [staff] "Portal rendering is the architectural solution: it decouples component logical position from DOM physical position, which is the right mental model for overlay components."
- [junior] "If you see 'Text content did not match' in the console, that's React telling you exactly which component has the mismatch."
- [mid] "Grep for Math.random and new Date in your render functions: those are the two most common culprits. Move them to useEffect or useMemo with stable deps."

ILLUSTRATIVE concept-chapter example (hand-written, not from a real case — shows the junior/mid/staff shape only, do not reuse its content):
- [junior] "Think of it like a bouncer checking IDs at the door: the browser refuses entry to anything that doesn't match, no exceptions."
- [mid] "This is the same contract MDN documents for CORS preflight: the browser, not your server, enforces it."
- [staff] "The failure mode to design for isn't the request being blocked; it's a misconfigured allowlist silently widening over time."

CONSTRAINTS:
- Exactly one hint per requested (chapter, tone) slot, nothing extra.
- 1-2 sentences, plain text, no markdown, no surrounding quotes.
- Ground every hint in the real chapter prose given to you for THIS case — do not invent facts, APIs, or numbers that aren't in it.
- Do not just restate the chapter's opening sentence; add something Casey would actually notice or say about it.`;

function rawHint(casey, chapter, tone) {
  return rawHintText(casey, chapter, tone).trim();
}

function buildUserPrompt(manifestCase, casey, html, slots) {
  const chapters = [...new Set(slots.map((s) => s.chapter))];
  const lines = [];

  lines.push(`Case: "${manifestCase.title}"`);
  lines.push(`Principle: ${manifestCase.principle || '(not set)'}`);
  lines.push('');
  lines.push(
    "Real hook/demo hints already written for THIS case (use only as a voice/length anchor — don't repeat their content):",
  );
  for (const chapter of ['hook', 'demo']) {
    for (const tone of TONES) {
      const text = rawHint(casey, chapter, tone);
      if (text) lines.push(`  [${chapter}/${tone}] ${text}`);
    }
  }

  for (const chapter of chapters) {
    lines.push('');
    lines.push(`--- ${chapter} chapter, real body prose per tone (ground your hint in this) ---`);
    for (const tone of TONES) {
      const prose = chapterProse(html, chapter, tone);
      lines.push(`[${chapter}/${tone} body]: ${prose || '(not available)'}`);
    }
  }

  lines.push('');
  lines.push('Write a replacement hint for exactly these slots, and no others:');
  for (const { chapter, tone } of slots) {
    lines.push(`- chapter="${chapter}", tone="${tone}"`);
  }

  return lines.join('\n');
}

async function draftCase(client, manifestCase, { dryRun, force }) {
  const draftPath = resolve(DRAFTS_DIR, `${manifestCase.slug}.json`);
  if (!dryRun && !force && existsSync(draftPath)) {
    console.log(`  skip ${manifestCase.slug} — draft already exists (--force to regenerate)`);
    return 'skipped';
  }

  const casey = loadCaseyHints(manifestCase.slug);
  if (!casey) {
    console.log(`  skip ${manifestCase.slug} — no casey.json`);
    return 'skipped';
  }

  const slots = findBoilerplateSlots(casey);
  if (slots.length === 0) {
    console.log(`  skip ${manifestCase.slug} — no boilerplate concept/fe-depth slots`);
    return 'skipped';
  }

  const html = readCaseHtml(manifestCase.slug);
  const userPrompt = buildUserPrompt(manifestCase, casey, html, slots);

  if (dryRun) {
    console.log(`\n=== DRY RUN: ${manifestCase.slug} (${slots.length} slot${slots.length === 1 ? '' : 's'}) ===`);
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
      max_tokens: 4096,
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

  const requestedKeys = new Set(slots.map((s) => `${s.chapter}|${s.tone}`));
  const returned = (parsed.hints ?? []).filter((h) => requestedKeys.has(`${h.chapter}|${h.tone}`));
  const missing = [...requestedKeys].filter((key) => !returned.some((h) => `${h.chapter}|${h.tone}` === key));
  if (missing.length > 0) {
    console.warn(`  ${manifestCase.slug}: model omitted ${missing.length} requested slot(s): ${missing.join(', ')}`);
  }

  const draft = {
    slug: manifestCase.slug,
    generatedAt: new Date().toISOString(),
    model: MODEL,
    slots: returned.map((h) => ({
      chapter: h.chapter,
      tone: h.tone,
      old: rawHint(casey, h.chapter, h.tone),
      new: h.text.trim(),
    })),
  };

  mkdirSync(DRAFTS_DIR, { recursive: true });
  writeFileSync(draftPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
  console.log(`  wrote drafts/${manifestCase.slug}.json (${draft.slots.length} slot${draft.slots.length === 1 ? '' : 's'})`);
  return 'drafted';
}

async function main() {
  const { flags, kv } = parseFlags(process.argv.slice(2));
  const dryRun = flags.has('--dry-run') || process.env.DRY_RUN === '1';
  const force = flags.has('--force');
  const all = flags.has('--all');
  const slug = kv.slug;

  if (!slug && !all) {
    console.error('usage: node scripts/content/draft-boilerplate-fixes.mjs --slug=<slug> | --all [--dry-run] [--force]');
    process.exit(1);
  }

  const { ANTHROPIC_API_KEY } = requireEnv(['ANTHROPIC_API_KEY'], { dryRun });
  const client = dryRun ? null : new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const manifest = loadManifest();
  const liveCases = manifest.cases.filter((c) => c.status === 'live');
  const targets = slug ? liveCases.filter((c) => c.slug === slug) : liveCases;

  if (slug && targets.length === 0) {
    console.error(`error: slug "${slug}" not found among live cases`);
    process.exit(1);
  }

  console.log(
    `Drafting replacement hints for ${targets.length} case${targets.length === 1 ? '' : 's'}` +
      `${dryRun ? ' (DRY RUN — no API calls, nothing written)' : ''}...`,
  );

  const counts = { drafted: 0, skipped: 0, error: 0, 'dry-run': 0 };
  for (const manifestCase of targets) {
    const result = await draftCase(client, manifestCase, { dryRun, force });
    counts[result] = (counts[result] ?? 0) + 1;
  }

  console.log(
    `\nDone. ${counts.drafted} drafted, ${counts.skipped} skipped, ${counts.error} failed` +
      `${dryRun ? `, ${counts['dry-run']} previewed` : ''}.`,
  );
  if (counts.drafted > 0) {
    console.log('Review with:  node scripts/content/review-drafts.mjs');
    console.log('Apply one with:  node scripts/content/apply-draft.mjs --slug=<slug>');
  }
}

main().catch((err) => {
  console.error('error:', err.message);
  process.exit(1);
});
