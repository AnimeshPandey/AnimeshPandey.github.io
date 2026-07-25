#!/usr/bin/env node
/**
 * build-search-index.mjs — emits src/assets/search-index.json from
 * manifest.json + library-entries.json, so client-side search has a
 * single static file to fetch instead of the raw ~229-case / 779-entry
 * data files (manifest.json alone carries fields no search UI needs —
 * chapters, artPanels, outcomes — the index below is deliberately lean).
 *
 * Deliberately NOT committed to git (see .gitignore) — regenerated on
 * every build from the same two files that are already the source of
 * truth, so it can never drift the way a checked-in snapshot could.
 * Must run BEFORE `npm run build` in cases/, since src/assets/ is
 * passthrough-copied verbatim by Eleventy — see tests/scripts/
 * build-deploy.mjs's ordering.
 *
 * Idea-status cases are included (so search can tell a reader "this
 * topic is planned" rather than staying silent) but carry no `url` —
 * unlike live cases, an idea-status case has no real page (its
 * permalink is `false`; see scaffold-case.mjs's own safety writeup),
 * so linking to one would 404.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'src/_data/manifest.json');
const LIBRARY_PATH = path.join(ROOT, 'src/_data/library-entries.json');
const OUT_PATH = path.join(ROOT, 'src/assets/search-index.json');

function buildCaseEntries(manifest) {
  return manifest.cases.map((c) => ({
    type: 'case',
    slug: c.slug,
    title: c.title,
    track: c.track,
    principle: c.principle,
    tier: c.tier,
    status: c.status,
    url: c.status === 'live' ? `/cases/${c.slug}/` : null,
  }));
}

function buildLibraryEntries(entries) {
  return entries.map((e) => ({
    type: 'library',
    slug: e.slug,
    title: e.title,
    company: e.company,
    track: e.track,
    url: e.frontendcsUrl || e.primaryUrl || null,
    mapsToSlug: e.mapsToSlug || null,
  }));
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const library = JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf8'));

  const out = {
    generatedAt: new Date().toISOString(),
    cases: buildCaseEntries(manifest),
    library: buildLibraryEntries(library),
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out) + '\n');
  console.log(`✓ Wrote ${OUT_PATH} (${out.cases.length} cases, ${out.library.length} library entries)`);
}

main();
