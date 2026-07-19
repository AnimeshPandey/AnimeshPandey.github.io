#!/usr/bin/env node
/**
 * Post a case as an X (Twitter) thread, via the pay-per-use v2 API (X
 * dropped subscription tiers for pay-per-use in Feb 2026 — no monthly
 * minimum). Run scripts/social/x-oauth-setup.mjs once first to obtain
 * X_ACCESS_TOKEN.
 *
 * Required env vars:
 *   X_ACCESS_TOKEN   — OAuth 2.0 user-context token, from x-oauth-setup.mjs
 *
 * Usage:
 *   node scripts/social/post-to-x.mjs <slug> [--tone=junior] [--force]
 *
 * Cost: ~$0.015 per tweet, ~$0.20 for any tweet containing a link (the last
 * tweet in every thread here does). This script logs an estimate before
 * posting and after — verify current pricing at docs.x.com/x-api/pricing
 * before relying on the number.
 *
 * DRY_RUN=1   print the thread and the cost estimate, make no network calls.
 *
 * See ./README.md for the full setup guide.
 */

import { loadCase } from './lib/content.mjs';
import { buildXThread } from './lib/compose.mjs';
import { loadLocalEnv, requireEnv } from './lib/env.mjs';
import { alreadyPosted, recordPost } from './lib/ledger.mjs';

const TWEETS_API = 'https://api.x.com/2/tweets';
const COST_PER_TWEET = 0.015;
const COST_PER_TWEET_WITH_LINK = 0.2;

function parseArgs(argv) {
  const [slug, ...rest] = argv;
  const flags = new Set(rest.filter((a) => a.startsWith('--') && !a.includes('=')));
  const kv = Object.fromEntries(
    rest.filter((a) => a.includes('=')).map((a) => a.replace(/^--/, '').split('=')),
  );
  return { slug, force: flags.has('--force'), tone: kv.tone ?? 'junior' };
}

function containsLink(text) {
  return /https?:\/\//.test(text);
}

function estimateCost(tweets) {
  return tweets.reduce((sum, t) => sum + (containsLink(t) ? COST_PER_TWEET_WITH_LINK : COST_PER_TWEET), 0);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postTweet(token, text, replyToId) {
  const body = replyToId ? { text, reply: { in_reply_to_tweet_id: replyToId } } : { text };
  const res = await fetch(TWEETS_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`X API ${res.status}: ${await res.text()}`);
  const { data } = await res.json();
  return data.id;
}

async function postThread(token, tweets) {
  const ids = [];
  let replyTo;
  for (const text of tweets) {
    const id = await postTweet(token, text, replyTo);
    ids.push(id);
    replyTo = id;
    await sleep(1000); // stay well clear of burst rate limits
  }
  return ids;
}

async function main() {
  loadLocalEnv();
  const { slug, force, tone } = parseArgs(process.argv.slice(2));
  const dryRun = process.env.DRY_RUN === '1';

  if (!slug) {
    console.error('usage: node scripts/social/post-to-x.mjs <slug> [--tone=junior] [--force]');
    process.exit(1);
  }

  const { X_ACCESS_TOKEN } = requireEnv(['X_ACCESS_TOKEN'], { dryRun });

  if (!force && alreadyPosted('x', slug)) {
    console.log(`"${slug}" is already in the X ledger — pass --force to post again.`);
    return;
  }

  const c = loadCase(slug, { tone });
  const tweets = buildXThread(c);
  const estimate = estimateCost(tweets);

  if (dryRun) {
    console.log(`[DRY RUN] would post a ${tweets.length}-tweet thread (est. $${estimate.toFixed(3)}):`);
    tweets.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
    return;
  }

  console.log(`posting ${tweets.length}-tweet thread for "${slug}" (est. $${estimate.toFixed(3)})…`);

  try {
    const ids = await postThread(X_ACCESS_TOKEN, tweets);
    recordPost('x', slug, { tweetIds: ids, estimatedCostUsd: estimate });
    console.log(`posted: ${slug} → https://x.com/i/status/${ids[0]} (${ids.length} tweets)`);
  } catch (err) {
    console.error(`error posting ${slug} to x: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`error: ${err.message ?? err}`);
  process.exit(1);
});
