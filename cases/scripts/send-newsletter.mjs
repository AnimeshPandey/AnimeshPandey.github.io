#!/usr/bin/env node
/**
 * Send a Buttondown newsletter email for each newly-live case.
 *
 * Idempotency: a sent record is stored in .newsletter-sent.json (in manifest dir)
 * keyed by `${slug}:${publishedAt}` — re-running never double-sends.
 *
 * Required env vars (set via GitHub Actions secrets):
 *   BUTTONDOWN_API_KEY       — Buttondown API key
 *
 * Optional env vars:
 *   DRY_RUN=1                — print what would be sent, do not call Buttondown API
 *   SLUGS=a,b,c              — only send for these slugs (comma-separated)
 *
 * Run by casebook-publish-scheduled.yml after flip-scheduled-live.mjs.
 *
 * Spec: ../docs/platform/AUDIENCE-GROWTH-AND-PUBLISHING.md
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const MANIFEST = resolve(__dir, '../src/_data/manifest.json');
const SITE_JSON = resolve(__dir, '../src/_data/site.json');
const SENT_LEDGER = resolve(__dir, '../src/_data/.newsletter-sent.json');
const BUTTONDOWN_API = 'https://api.buttondown.email/v1/emails';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeLedger(ledger) {
  writeFileSync(SENT_LEDGER, JSON.stringify(ledger, null, 2) + '\n', 'utf8');
}

async function sendEmail({ apiKey, subject, body, slug }) {
  const res = await fetch(BUTTONDOWN_API, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject,
      body,
      email_type: 'public',
      // Buttondown supports idempotency-key header to deduplicate
      // but we also maintain our own ledger for resilience
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Buttondown API ${res.status}: ${text}`);
  }
  return res.json();
}

function buildEmailBody(c, siteUrl) {
  const url = `${siteUrl}${c.slug}/`;
  const track = (c.track ?? '').replace(/-/g, ' ');
  const readMin = c.readMin ?? 5;
  return [
    `# ${c.title}`,
    '',
    `*${track} · ${readMin} min read*`,
    '',
    c.description ?? c.meta ?? '',
    '',
    `[Read the case study →](${url})`,
    '',
    '---',
    '_You received this because you subscribed to The Frontend Casebook._',
    '_[Unsubscribe]({unsubscribe_url}) · [RSS feed](' + siteUrl + 'feed.xml)_',
  ].join('\n');
}

async function main() {
  const apiKey = process.env.BUTTONDOWN_API_KEY ?? '';
  const dryRun = process.env.DRY_RUN === '1';
  const filterSlugs = process.env.SLUGS ? new Set(process.env.SLUGS.split(',').map(s => s.trim())) : null;

  if (!apiKey && !dryRun) {
    console.error('error: BUTTONDOWN_API_KEY not set. Set DRY_RUN=1 to test without sending.');
    process.exit(1);
  }

  const data = readJson(MANIFEST);
  const site = readJson(SITE_JSON);

  if (!site.newsletter?.enabled) {
    console.log('Newsletter not enabled in site.json — nothing to send.');
    return;
  }

  const ledger = existsSync(SENT_LEDGER) ? readJson(SENT_LEDGER) : { sent: {} };

  const live = (data.cases ?? []).filter(c => {
    if (c.status !== 'live') return false;
    if (!c.publishedAt) return false;
    if (filterSlugs && !filterSlugs.has(c.slug)) return false;
    const key = `${c.slug}:${c.publishedAt}`;
    return !ledger.sent[key];
  });

  if (live.length === 0) {
    console.log('No unsent live cases found.');
    return;
  }

  const siteUrl = site.url.endsWith('/') ? site.url : site.url + '/';

  for (const c of live) {
    const subject = `New case: ${c.title}`;
    const body = buildEmailBody(c, siteUrl);
    const key = `${c.slug}:${c.publishedAt}`;

    if (dryRun) {
      console.log(`[DRY RUN] Would send: "${subject}"`);
      console.log(`  slug: ${c.slug}`);
      console.log(`  publishedAt: ${c.publishedAt}`);
      console.log(`  ledger key: ${key}`);
      continue;
    }

    try {
      const result = await sendEmail({ apiKey, subject, body, slug: c.slug });
      ledger.sent[key] = { sentAt: new Date().toISOString(), id: result.id };
      writeLedger(ledger);
      console.log(`sent: ${c.slug} (id: ${result.id})`);
    } catch (err) {
      console.error(`error sending ${c.slug}: ${err.message}`);
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
