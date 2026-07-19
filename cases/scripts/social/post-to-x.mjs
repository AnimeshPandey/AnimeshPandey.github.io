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
 * Resumable: each tweet is ledgered as soon as it posts, not just at the
 * end of the thread. If a mid-thread call fails (rate limit, transient
 * 5xx), re-running the same command resumes by replying to the last
 * successfully-posted tweet instead of reposting the whole thread — X has
 * no delete-and-retry-safe primitive here, so avoiding duplicate live
 * tweets matters more than a clean restart. --force ignores any partial
 * progress and posts the full thread fresh (accepting duplicates for
 * whatever was already live).
 *
 * See ./README.md for the full setup guide.
 */

import { loadLocalEnv, requireEnv } from './lib/env.mjs';

loadLocalEnv();

import { loadCase } from './lib/content.mjs';
import { buildXThread } from './lib/compose.mjs';
import { alreadyPosted, recordPost } from './lib/ledger.mjs';
import { parseFlags } from './lib/cli-args.mjs';

const TWEETS_API = 'https://api.x.com/2/tweets';
const COST_PER_TWEET = 0.015;
const COST_PER_TWEET_WITH_LINK = 0.2;

function parseArgs(argv) {
  const [slug, ...rest] = argv;
  const { flags, kv } = parseFlags(rest);
  return { slug, force: flags.has('--force'), tone: kv.tone ?? 'junior' };
}

/**
 * A ledger entry with no `complete` field is always from the pre-resumable
 * code, which only ever wrote a ledger entry *after* the full thread
 * posted successfully — so its absence means "complete", not "unknown".
 * Treating it as incomplete would let a fully-posted thread be silently
 * treated as resumable and get new tweets appended onto it.
 */
function isFullyPosted(existing) {
  if (!existing) return false;
  return existing.complete ?? true;
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

/**
 * Posts tweets[startIndex..] as replies continuing from ids already in
 * `ids`, ledgering after every single tweet so a crash mid-thread leaves
 * an accurate, resumable record rather than nothing at all.
 */
async function postThread(token, tweets, { slug, estimate, ids, startIndex }) {
  let replyTo = ids[ids.length - 1];
  for (let i = startIndex; i < tweets.length; i += 1) {
    const id = await postTweet(token, tweets[i], replyTo);
    ids.push(id);
    replyTo = id;
    recordPost('x', slug, { tweetIds: [...ids], estimatedCostUsd: estimate, complete: i === tweets.length - 1 });
    await sleep(1000); // stay well clear of burst rate limits
  }
  return ids;
}

async function main() {
  const { slug, force, tone } = parseArgs(process.argv.slice(2));
  const dryRun = process.env.DRY_RUN === '1';

  if (!slug) {
    console.error('usage: node scripts/social/post-to-x.mjs <slug> [--tone=junior] [--force]');
    process.exit(1);
  }

  const { X_ACCESS_TOKEN } = requireEnv(['X_ACCESS_TOKEN'], { dryRun });

  const existing = force ? null : alreadyPosted('x', slug);
  if (isFullyPosted(existing)) {
    console.log(`"${slug}" is already in the X ledger — pass --force to post again.`);
    return;
  }

  const c = loadCase(slug, { tone });
  const tweets = buildXThread(c);
  const estimate = estimateCost(tweets);

  const startIndex = force ? 0 : (existing?.tweetIds?.length ?? 0);
  const startIds = force ? [] : [...(existing?.tweetIds ?? [])];

  if (dryRun) {
    console.log(`[DRY RUN] would post a ${tweets.length}-tweet thread (est. $${estimate.toFixed(3)}):`);
    tweets.forEach((t, i) => console.log(`  ${i + 1}. ${i < startIndex ? '(already posted)' : t}`));
    return;
  }

  if (startIndex > 0) {
    console.log(`resuming "${slug}" from tweet ${startIndex + 1}/${tweets.length} (${startIndex} already posted)…`);
  } else {
    console.log(`posting ${tweets.length}-tweet thread for "${slug}" (est. $${estimate.toFixed(3)})…`);
  }

  try {
    const ids = await postThread(X_ACCESS_TOKEN, tweets, { slug, estimate, ids: startIds, startIndex });
    console.log(`posted: ${slug} → https://x.com/i/status/${ids[0]} (${ids.length} tweets)`);
  } catch (err) {
    console.error(`error posting ${slug} to x: ${err.message}`);
    console.error('progress so far is ledgered — re-run the same command to resume from the last posted tweet.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`error: ${err.message ?? err}`);
  process.exit(1);
});
