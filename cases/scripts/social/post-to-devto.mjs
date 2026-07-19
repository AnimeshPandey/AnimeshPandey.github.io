#!/usr/bin/env node
/**
 * Cross-post a live case to Dev.to as an excerpt, canonical_url'd back to
 * the Casebook. The easiest of the four channels to automate — a personal
 * API key, no OAuth, no app review.
 *
 * Required env vars:
 *   DEVTO_API_KEY   — Settings → Extensions → DEV Community API Keys
 *
 * Usage:
 *   node scripts/social/post-to-devto.mjs <slug> [--publish] [--tone=junior] [--force]
 *
 *   <slug>       required — must be `status: "live"` in manifest.json
 *   --publish    publish immediately (default: create as a Dev.to draft to review first)
 *   --tone       junior | mid | staff (default: junior — see AUDIENCE-TONE.md)
 *   --force      re-post even if this slug is already in the ledger (creates a duplicate article)
 *
 * DRY_RUN=1      print the article payload, make no network call
 *
 * Idempotency: cases/src/_data/.devto-posted.json records slug → Dev.to article id.
 * Re-running an already-posted slug UPDATES that article (PUT) instead of duplicating,
 * unless --force is passed (which always creates a new one).
 *
 * See ./README.md for the full setup guide.
 */

import { loadLocalEnv, requireEnv } from './lib/env.mjs';

loadLocalEnv();

import { loadCase } from './lib/content.mjs';
import { buildDevtoArticle } from './lib/compose.mjs';
import { alreadyPosted, recordPost } from './lib/ledger.mjs';
import { parseFlags } from './lib/cli-args.mjs';

const DEVTO_API = 'https://dev.to/api/articles';

function parseArgs(argv) {
  const [slug, ...rest] = argv;
  const { flags, kv } = parseFlags(rest);
  return {
    slug,
    publish: flags.has('--publish'),
    force: flags.has('--force'),
    tone: kv.tone ?? 'junior',
  };
}

async function createArticle(apiKey, article) {
  const res = await fetch(DEVTO_API, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ article }),
  });
  if (!res.ok) throw new Error(`Dev.to API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function updateArticle(apiKey, id, article) {
  const res = await fetch(`${DEVTO_API}/${id}`, {
    method: 'PUT',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ article }),
  });
  if (!res.ok) throw new Error(`Dev.to API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const { slug, publish, force, tone } = parseArgs(process.argv.slice(2));
  const dryRun = process.env.DRY_RUN === '1';

  if (!slug) {
    console.error('usage: node scripts/social/post-to-devto.mjs <slug> [--publish] [--tone=junior] [--force]');
    process.exit(1);
  }

  const { DEVTO_API_KEY } = requireEnv(['DEVTO_API_KEY'], { dryRun });

  const c = loadCase(slug, { tone });
  const article = { ...buildDevtoArticle(c), published: publish };

  const existing = force ? null : alreadyPosted('devto', slug);

  if (dryRun) {
    console.log(`[DRY RUN] ${existing ? 'would UPDATE' : 'would CREATE'} dev.to article for "${slug}"`);
    console.log(JSON.stringify(article, null, 2));
    if (existing) console.log(`existing article id: ${existing.id} (${existing.url})`);
    return;
  }

  try {
    const result = existing
      ? await updateArticle(DEVTO_API_KEY, existing.id, article)
      : await createArticle(DEVTO_API_KEY, article);

    recordPost('devto', slug, { id: result.id, url: result.url, published: article.published });
    console.log(`${existing ? 'updated' : 'created'}: ${slug} → ${result.url} (published: ${article.published})`);
  } catch (err) {
    console.error(`error posting ${slug} to dev.to: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`error: ${err.message ?? err}`);
  process.exit(1);
});
