/**
 * Shared data loader for the social cross-posting scripts.
 *
 * Reads manifest.json + a case's casey.json + site.json and returns one
 * normalized object per case — the single source every post-to-*.mjs script
 * renders from. See ../README.md for the full picture.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CASES_ROOT = resolve(__dir, '../../..');
const MANIFEST = resolve(CASES_ROOT, 'src/_data/manifest.json');
const SITE_JSON = resolve(CASES_ROOT, 'src/_data/site.json');

// Dev.to tags must be single lowercase words, max 4 — map each track to its
// closest real dev.to tag. Unmapped tracks fall back to just "webdev".
const DEVTO_TAG_MAP = {
  'accessibility': ['accessibility', 'a11y'],
  'advanced-frontend': ['webdev'],
  'agent-architecture': ['ai'],
  'agentic-ai': ['ai'],
  'ai-frontend-integration': ['ai', 'javascript'],
  'animation-motion': ['css'],
  'browser-dom': ['javascript'],
  'build-tooling': ['webdev'],
  'css-layout': ['css'],
  'javascript': ['javascript'],
  'networking': ['webdev'],
  'patterns-ux': ['ux'],
  'performance-cwv': ['performance'],
  'psychology-perception': ['ux'],
  'react': ['react'],
  'security': ['security'],
  'state-architecture': ['javascript'],
};

// Found by auditing all 31 live casey.json files while building this
// pipeline: `concept` and `fe-depth` hints are frequently placeholder text
// reused near-verbatim across most/all cases (concept/staff is identical in
// 31 of 31), while `hook` and `demo` are reliably case-specific (0
// duplicates). Never post one of these verbatim — better to drop the line
// than publish an obviously-templated sentence under a specific case's
// name. This is a stopgap, not a fix for the underlying casey.json content
// gap — see scripts/social/README.md "Known limitations".
const KNOWN_BOILERPLATE_HINTS = new Set([
  'Map the pattern to observability: what would you measure in RUM or lab to prove the fix?',
  'Connect the principle to your component API: what prop or CSS change encodes the fix?',
  'Connect the principle to your component API. What prop or CSS change encodes the fix?',
  'Check edge cases: SSR, hydration, design tokens, and high-contrast mode.',
  'Skim the code patterns here; you can copy the structure even if the syntax is new.',
  'Skim the code patterns here: you can copy the structure even if the syntax is new.',
  'The concept chapter is the principle: read it before the demo so the toggle makes sense.',
  'The concept chapter is the principle. Read it before the demo so the toggle makes sense.',
  'Compare broken vs fixed implementation: the diff is usually smaller than you expect.',
  'Compare broken vs fixed implementation. The diff is usually smaller than you expect.',
  'Compare broken vs fixed implementation; the diff is usually smaller than you expect.',
]);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadSite() {
  return readJson(SITE_JSON);
}

export function loadManifest() {
  return readJson(MANIFEST);
}

export function loadManifestCase(slug) {
  const data = loadManifest();
  const c = (data.cases ?? []).find((x) => x.slug === slug);
  if (!c) throw new Error(`slug "${slug}" not found in manifest.json`);
  return c;
}

export function loadCaseyHints(slug) {
  const path = resolve(CASES_ROOT, `src/cases/${slug}/casey.json`);
  if (!existsSync(path)) return null;
  return readJson(path);
}

/** Normalizes site.url to always end in a single trailing slash. */
export function siteBaseUrl(site) {
  return site.url.endsWith('/') ? site.url : `${site.url}/`;
}

export function caseUrl(site, slug) {
  return `${siteBaseUrl(site)}${slug}/`;
}

export const VALID_TONES = ['junior', 'mid', 'staff'];

export function hintFor(casey, chapter, tone = 'junior') {
  if (!casey) return '';
  const entry = (casey.hints ?? []).find((h) => h.chapter === chapter);
  const text = entry?.[tone] ?? '';
  return KNOWN_BOILERPLATE_HINTS.has(text.trim()) ? '' : text;
}

export function devtoTags(track) {
  const mapped = DEVTO_TAG_MAP[track] ?? [];
  return [...new Set([...mapped, 'webdev'])].slice(0, 4);
}

/**
 * Load and normalize everything a compose.mjs renderer needs for one case.
 * Throws if the slug is missing from the manifest, or is not `live`
 * (never cross-post a case that isn't published on the canonical site yet).
 */
export function loadCase(slug, { tone = 'junior' } = {}) {
  if (!VALID_TONES.includes(tone)) {
    throw new Error(`invalid --tone "${tone}" — must be one of: ${VALID_TONES.join(', ')}`);
  }

  const site = loadSite();
  const manifestCase = loadManifestCase(slug);

  if (manifestCase.status !== 'live') {
    throw new Error(
      `slug "${slug}" has status "${manifestCase.status}", not "live" — refusing to cross-post an unpublished case`,
    );
  }

  const casey = loadCaseyHints(slug);
  if (!casey) {
    throw new Error(
      `slug "${slug}" has no casey.json — nothing to reuse. Author the hints before cross-posting.`,
    );
  }

  return {
    slug,
    title: manifestCase.title,
    track: manifestCase.track,
    tier: manifestCase.tier,
    readMin: manifestCase.readMin,
    principle: manifestCase.principle ?? '',
    publishedAt: manifestCase.publishedAt,
    url: caseUrl(site, slug),
    siteName: site.name,
    hook: hintFor(casey, 'hook', tone),
    demo: hintFor(casey, 'demo', tone),
    feDepth: hintFor(casey, 'fe-depth', tone),
    concept: hintFor(casey, 'concept', tone),
    devtoTags: devtoTags(manifestCase.track),
  };
}
