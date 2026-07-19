/**
 * Per-channel idempotency ledger — same pattern as ../../.newsletter-sent.json:
 * a small committed JSON file keyed by slug, so re-running a script never
 * double-posts. Each post-to-*.mjs script gets its own ledger file.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dir, '../../../src/_data');

export function ledgerPath(channel) {
  return resolve(DATA_DIR, `.${channel}-posted.json`);
}

export function readLedger(channel) {
  const path = ledgerPath(channel);
  if (!existsSync(path)) return { posted: {} };
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeLedger(channel, ledger) {
  writeFileSync(ledgerPath(channel), `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
}

export function recordPost(channel, slug, meta) {
  const ledger = readLedger(channel);
  ledger.posted[slug] = { postedAt: new Date().toISOString(), ...meta };
  writeLedger(channel, ledger);
}

export function alreadyPosted(channel, slug) {
  const ledger = readLedger(channel);
  return ledger.posted[slug] ?? null;
}
