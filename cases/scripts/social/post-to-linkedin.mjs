#!/usr/bin/env node
/**
 * Post a case to LinkedIn as a native text post, via the self-serve
 * `w_member_social` scope ("Share on LinkedIn" product — free, no partner
 * review, as of 2026). Run scripts/social/linkedin-oauth-setup.mjs once
 * first to obtain LINKEDIN_ACCESS_TOKEN.
 *
 * Required env vars:
 *   LINKEDIN_ACCESS_TOKEN   — from linkedin-oauth-setup.mjs
 *
 * Optional env vars:
 *   LINKEDIN_PERSON_URN     — e.g. "urn:li:person:abc123"; skips the userinfo
 *                             lookup if you already know it
 *   LINKEDIN_API_VERSION    — LinkedIn's versioned REST API uses a rolling
 *                             YYYYMM string. Defaults below; LinkedIn expires
 *                             versions after ~12 months, so bump this if posts
 *                             start failing with a version error.
 *
 * Usage:
 *   node scripts/social/post-to-linkedin.mjs <slug> [--tone=staff] [--force]
 *
 * The case link is posted as the FIRST COMMENT, not in the post body —
 * LinkedIn visibly suppresses reach on posts with outbound links. The
 * first-comment call is best-effort: if LinkedIn's comments endpoint shape
 * has moved, the post itself still succeeds and the link is printed so you
 * can paste it by hand.
 *
 * DRY_RUN=1   print what would be sent, make no network calls.
 *
 * See ./README.md for the full setup guide.
 */

import { loadCase } from './lib/content.mjs';
import { buildLinkedInPost } from './lib/compose.mjs';
import { loadLocalEnv, requireEnv } from './lib/env.mjs';
import { alreadyPosted, recordPost } from './lib/ledger.mjs';

const API_VERSION = process.env.LINKEDIN_API_VERSION ?? '202401';
const BASE = 'https://api.linkedin.com';

function parseArgs(argv) {
  const [slug, ...rest] = argv;
  const flags = new Set(rest.filter((a) => a.startsWith('--') && !a.includes('=')));
  const kv = Object.fromEntries(
    rest.filter((a) => a.includes('=')).map((a) => a.replace(/^--/, '').split('=')),
  );
  return { slug, force: flags.has('--force'), tone: kv.tone ?? 'staff' };
}

function authHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    'LinkedIn-Version': API_VERSION,
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function resolvePersonUrn(token) {
  if (process.env.LINKEDIN_PERSON_URN) return process.env.LINKEDIN_PERSON_URN;
  const res = await fetch(`${BASE}/v2/userinfo`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`LinkedIn userinfo ${res.status}: ${await res.text()}`);
  const info = await res.json();
  if (!info.sub) throw new Error('LinkedIn userinfo response had no "sub" claim — cannot build person URN');
  return `urn:li:person:${info.sub}`;
}

async function createPost(token, authorUrn, commentary) {
  const res = await fetch(`${BASE}/rest/posts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      author: authorUrn,
      commentary,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!res.ok) throw new Error(`LinkedIn posts API ${res.status}: ${await res.text()}`);
  // Versioned LinkedIn write APIs typically return the new entity's URN in
  // the x-restli-id response header rather than a JSON body.
  const postUrn = res.headers.get('x-restli-id');
  if (postUrn) return postUrn;
  const body = await res.json().catch(() => ({}));
  return body.id ?? null;
}

async function addFirstComment(token, authorUrn, postUrn, url) {
  const encoded = encodeURIComponent(postUrn);
  const res = await fetch(`${BASE}/rest/socialActions/${encoded}/comments`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ actor: authorUrn, message: { text: url } }),
  });
  if (!res.ok) throw new Error(`LinkedIn comments API ${res.status}: ${await res.text()}`);
}

async function main() {
  loadLocalEnv();
  const { slug, force, tone } = parseArgs(process.argv.slice(2));
  const dryRun = process.env.DRY_RUN === '1';

  if (!slug) {
    console.error('usage: node scripts/social/post-to-linkedin.mjs <slug> [--tone=staff] [--force]');
    process.exit(1);
  }

  const { LINKEDIN_ACCESS_TOKEN } = requireEnv(['LINKEDIN_ACCESS_TOKEN'], { dryRun });

  if (!force && alreadyPosted('linkedin', slug)) {
    console.log(`"${slug}" is already in the LinkedIn ledger — pass --force to post again.`);
    return;
  }

  const c = loadCase(slug, { tone });
  const { commentary, linkComment } = buildLinkedInPost(c);

  if (dryRun) {
    console.log('[DRY RUN] would POST to LinkedIn:');
    console.log(commentary);
    console.log(`\n[DRY RUN] would add first comment: ${linkComment}`);
    return;
  }

  try {
    const authorUrn = await resolvePersonUrn(LINKEDIN_ACCESS_TOKEN);
    const postUrn = await createPost(LINKEDIN_ACCESS_TOKEN, authorUrn, commentary);
    console.log(`posted: ${slug} → ${postUrn ?? '(no urn returned)'}`);

    if (postUrn) {
      try {
        await addFirstComment(LINKEDIN_ACCESS_TOKEN, authorUrn, postUrn, linkComment);
        console.log('added link as first comment.');
      } catch (err) {
        console.warn(`warn: post succeeded but first comment failed (${err.message}).`);
        console.warn(`Paste this link as the first comment by hand: ${linkComment}`);
      }
    } else {
      console.warn(`warn: no post URN returned — paste this link as the first comment by hand: ${linkComment}`);
    }

    recordPost('linkedin', slug, { postUrn });
  } catch (err) {
    console.error(`error posting ${slug} to linkedin: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`error: ${err.message ?? err}`);
  process.exit(1);
});
