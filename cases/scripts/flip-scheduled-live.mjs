#!/usr/bin/env node
/**
 * Flip manifest cases from `scheduled` → `live` when scheduledPublishAt has passed.
 *
 * Run by casebook-publish-scheduled.yml on an hourly schedule.
 * Idempotent: safe to run any number of times.
 *
 * Exit codes: 0 = success (0 or more flipped), 1 = error.
 *
 * Outputs: list of flipped slugs to stdout, warnings to stderr.
 */

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const MANIFEST = resolve(__dir, '../src/_data/manifest.json');

function main() {
  let data;
  try {
    data = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch (err) {
    console.error(`error: cannot read manifest: ${err.message}`);
    process.exit(1);
  }

  const now = new Date();
  const flipped = [];

  for (const c of data.cases ?? []) {
    if (c.status !== 'scheduled') continue;
    if (!c.scheduledPublishAt) {
      console.warn(`warn: ${c.slug} has status=scheduled but no scheduledPublishAt — skipping`);
      continue;
    }
    const due = new Date(c.scheduledPublishAt);
    if (isNaN(due.getTime())) {
      console.warn(`warn: ${c.slug} has invalid scheduledPublishAt "${c.scheduledPublishAt}" — skipping`);
      continue;
    }
    if (due <= now) {
      c.status = 'live';
      c.publishedAt = now.toISOString();
      flipped.push(c.slug);
    }
  }

  if (flipped.length === 0) {
    console.log('No cases due for publish.');
    return;
  }

  writeFileSync(MANIFEST, JSON.stringify(data, null, 2) + '\n', 'utf8');

  for (const slug of flipped) {
    console.log(`flipped: ${slug}`);
  }
  console.log(`\nTotal flipped: ${flipped.length}`);

  // Write machine-readable output for downstream CI steps (newsletter, deploy)
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `flipped_slugs=${flipped.join(',')}\nflipped_count=${flipped.length}\n`,
      'utf8',
    );
  }
}

main();
