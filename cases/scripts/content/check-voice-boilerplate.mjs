#!/usr/bin/env node
/**
 * check-voice-boilerplate.mjs — flags live cases whose casey.json
 * voice.sections has empty or generic-boilerplate spoken-script text.
 * See lib/voice-boilerplate.mjs for the detection rule and how this
 * relates to (and differs from) the existing hints-boilerplate guard.
 *
 * Usage:
 *   node check-voice-boilerplate.mjs                 (all live cases)
 *   node check-voice-boilerplate.mjs --json           (machine-readable)
 *
 * Exit code 1 if any live case has a flagged slot, 0 otherwise.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findVoiceBoilerplateSlots } from './lib/voice-boilerplate.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const CASES_ROOT = resolve(__dir, '../..');

function main() {
  const jsonMode = process.argv.includes('--json');
  const manifest = JSON.parse(readFileSync(resolve(CASES_ROOT, 'src/_data/manifest.json'), 'utf8'));
  const liveSlugs = manifest.cases.filter((c) => c.status === 'live').map((c) => c.slug);

  const results = [];
  for (const slug of liveSlugs) {
    const caseyPath = resolve(CASES_ROOT, `src/cases/${slug}/casey.json`);
    if (!existsSync(caseyPath)) continue;
    const casey = JSON.parse(readFileSync(caseyPath, 'utf8'));
    const slots = findVoiceBoilerplateSlots(casey);
    if (slots.length > 0) results.push({ slug, slots });
  }

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const r of results) {
      console.log(`FLAGGED  ${r.slug} — ${r.slots.length} slot(s): ${r.slots.map((s) => `${s.chapter}/${s.tone}`).join(', ')}`);
    }
    const flaggedSlots = results.reduce((sum, r) => sum + r.slots.length, 0);
    console.log(`\n${results.length} of ${liveSlugs.length} live cases flagged, ${flaggedSlots} total slot(s)`);
  }

  process.exit(results.length > 0 ? 1 : 0);
}

main();
