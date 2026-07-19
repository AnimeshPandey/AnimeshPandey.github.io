#!/usr/bin/env node
/**
 * Renders a "principle card" PNG (1080×1350, IG feed portrait) for a live
 * case — the missing half of the Instagram pipeline post-to-instagram.mjs
 * needs. See lib/card-template.mjs for the HTML/CSS itself.
 *
 * Requires the `playwright` devDependency (added to cases/package.json —
 * run `npm install` in cases/ once; it pulls down a Chromium build).
 *
 * Usage:
 *   node scripts/social/render-cards.mjs <slug> [--tone=junior]
 *   node scripts/social/render-cards.mjs --all [--tone=junior]
 *
 * Output: cases/src/assets/social/<slug>/principle-card.png
 * That's inside src/assets/, which .eleventy.js already passthrough-copies
 * — the next `npm run build` + deploy serves it at:
 *   {site.url}assets/social/<slug>/principle-card.png
 *
 * This script only renders and saves locally — it does NOT commit, build,
 * deploy, or post anything. The file has to actually be live at its public
 * URL before post-to-instagram.mjs can use it (the Graph API fetches
 * image_url itself; it won't accept a local path).
 */

import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCase, loadSite, loadManifest, VALID_TONES } from './lib/content.mjs';
import { buildPrincipleCardHtml, CARD_WIDTH, CARD_HEIGHT } from './lib/card-template.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const CASES_ROOT = resolve(__dir, '../..');
const OUT_ROOT = resolve(CASES_ROOT, 'src/assets/social');
const CASEY_ROOT = resolve(CASES_ROOT, 'src/assets/casey');

function parseArgs(argv) {
  const [maybeSlug, ...rest] = argv;
  const all = maybeSlug === '--all';
  const args = all ? argv : rest;
  const kv = Object.fromEntries(
    args.filter((a) => a.includes('=')).map((a) => a.replace(/^--/, '').split('=')),
  );
  return { all, slug: all ? null : maybeSlug, tone: kv.tone ?? 'junior' };
}

function readCaseySvg(tone) {
  const path = resolve(CASEY_ROOT, tone, 'idle.svg');
  if (!existsSync(path)) {
    throw new Error(`no Casey SVG at ${path} — expected cases/src/assets/casey/${tone}/idle.svg`);
  }
  return readFileSync(path, 'utf8');
}

async function renderOne(browser, slug, tone) {
  const c = loadCase(slug, { tone });
  const caseySvg = readCaseySvg(tone);
  const html = buildPrincipleCardHtml(c, caseySvg);

  const page = await browser.newPage({ viewport: { width: CARD_WIDTH, height: CARD_HEIGHT } });
  await page.setContent(html, { waitUntil: 'load' });

  const outDir = resolve(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'principle-card.png');
  await page.screenshot({ path: outPath });
  await page.close();

  const site = loadSite();
  const publicUrl = `${site.url}assets/social/${slug}/principle-card.png`;
  return { slug, outPath, publicUrl };
}

async function main() {
  const { all, slug, tone } = parseArgs(process.argv.slice(2));

  if (!VALID_TONES.includes(tone)) {
    console.error(`error: invalid --tone "${tone}" — must be one of: ${VALID_TONES.join(', ')}`);
    process.exit(1);
  }
  if (!all && !slug) {
    console.error('usage: node scripts/social/render-cards.mjs <slug> [--tone=junior]');
    console.error('       node scripts/social/render-cards.mjs --all [--tone=junior]');
    process.exit(1);
  }

  const slugs = all
    ? loadManifest().cases.filter((c) => c.status === 'live').map((c) => c.slug)
    : [slug];

  const browser = await chromium.launch();
  const results = [];
  try {
    for (const s of slugs) {
      try {
        const result = await renderOne(browser, s, tone);
        results.push(result);
        console.log(`rendered: ${result.outPath}`);
      } catch (err) {
        console.error(`error rendering ${s}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  if (results.length === 0) {
    process.exit(1);
  }

  console.log(`\n${results.length} card(s) rendered. After committing + deploying, these become:`);
  for (const r of results) console.log(`  ${r.publicUrl}`);
  if (results.length === 1) {
    console.log('\nOnce that URL is live, post it with:');
    console.log(`  node scripts/social/post-to-instagram.mjs ${results[0].slug} --image=${results[0].publicUrl}`);
  }
}

main().catch((err) => {
  console.error(`error: ${err.message ?? err}`);
  process.exit(1);
});
