#!/usr/bin/env node
/**
 * Publish a case to Instagram via the Graph API's container-publish flow.
 * Self-serve ("Standard Access") when publishing to an account you own and
 * have added as a tester on your own Meta app — full App Review is only
 * required to publish on behalf of OTHER people's accounts.
 *
 * PREREQUISITE this repo doesn't have yet: a hosted image. The Graph API's
 * media container requires a public HTTPS `image_url` / `video_url` — it
 * cannot accept a local file upload. Generate + host the social card first
 * (see the "Production pipeline" section of the social plan); this script
 * is the publish half, not the render half.
 *
 * Required env vars:
 *   IG_ACCESS_TOKEN   — long-lived Graph API access token
 *   IG_USER_ID        — Instagram Business Account id (run with --discover
 *                        using just IG_ACCESS_TOKEN to find it)
 *
 * Optional env vars:
 *   GRAPH_API_VERSION — defaults to v21.0
 *
 * Usage (flags take =value, same convention as --tone=):
 *   node scripts/social/post-to-instagram.mjs --discover
 *   node scripts/social/post-to-instagram.mjs <slug> --image=<public-url> [--tone=junior] [--force]
 *   node scripts/social/post-to-instagram.mjs <slug> --images=<url1,url2,url3> [...]   # carousel
 *   node scripts/social/post-to-instagram.mjs <slug> --video=<public-url> [...]         # Reel
 *
 * DRY_RUN=1   print the container payload(s), make no network calls.
 *
 * See ./README.md for the full setup guide.
 */

import { loadLocalEnv, requireEnv } from './lib/env.mjs';

loadLocalEnv();

import { loadCase } from './lib/content.mjs';
import { buildInstagramCaption } from './lib/compose.mjs';
import { alreadyPosted, recordPost } from './lib/ledger.mjs';
import { parseFlags } from './lib/cli-args.mjs';

const GRAPH_VERSION = process.env.GRAPH_API_VERSION ?? 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function parseArgs(argv) {
  const [maybeSlug, ...rest] = argv;
  const discover = maybeSlug === '--discover';
  const slug = discover ? null : maybeSlug;
  const args = discover ? argv : rest;
  const { kv } = parseFlags(args);
  return {
    discover,
    slug,
    image: kv.image ?? null,
    images: kv.images ? kv.images.split(',').map((s) => s.trim()) : null,
    video: kv.video ?? null,
    force: args.includes('--force'),
    tone: kv.tone ?? 'junior',
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function graphCall(path, token, { method = 'GET', params = {} } = {}) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  const res = await fetch(url, { method });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Graph API ${res.status}: ${JSON.stringify(json.error ?? json)}`);
  }
  return json;
}

async function discover(token) {
  const pages = await graphCall('/me/accounts', token, {
    params: { fields: 'name,instagram_business_account' },
  });
  if (!pages.data?.length) {
    console.log('No Facebook Pages found for this token. Link a Page to your Instagram Business/Creator account first.');
    return;
  }
  console.log('Facebook Pages linked to this token:');
  for (const page of pages.data) {
    const igId = page.instagram_business_account?.id ?? '(no Instagram account linked)';
    console.log(`  ${page.name} — page id ${page.id} — IG_USER_ID: ${igId}`);
  }
}

// Video/Reels transcoding on Meta's side routinely takes longer than image
// processing, especially for larger files — a fixed image-sized budget was
// timing out still-in-flight video uploads and causing redundant retries.
const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS_IMAGE = 30; // 60s
const MAX_ATTEMPTS_VIDEO = 90; // 180s

async function waitUntilFinished(containerId, token, { maxAttempts = MAX_ATTEMPTS_IMAGE } = {}) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const status = await graphCall(`/${containerId}`, token, { params: { fields: 'status_code' } });
    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'ERROR') throw new Error(`container ${containerId} failed processing`);
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`timed out waiting for container ${containerId} to finish processing`);
}

async function publishSingle({ igUserId, token, mediaType, url, caption }) {
  const params = mediaType === 'video' ? { video_url: url, caption, media_type: 'REELS' } : { image_url: url, caption };
  const container = await graphCall(`/${igUserId}/media`, token, { method: 'POST', params });
  const maxAttempts = mediaType === 'video' ? MAX_ATTEMPTS_VIDEO : MAX_ATTEMPTS_IMAGE;
  await waitUntilFinished(container.id, token, { maxAttempts });
  const published = await graphCall(`/${igUserId}/media_publish`, token, {
    method: 'POST',
    params: { creation_id: container.id },
  });
  return published.id;
}

async function publishCarousel({ igUserId, token, imageUrls, caption }) {
  const childIds = [];
  for (const imageUrl of imageUrls) {
    const item = await graphCall(`/${igUserId}/media`, token, {
      method: 'POST',
      params: { image_url: imageUrl, is_carousel_item: 'true' },
    });
    childIds.push(item.id);
  }
  const container = await graphCall(`/${igUserId}/media`, token, {
    method: 'POST',
    params: { media_type: 'CAROUSEL', children: childIds.join(','), caption },
  });
  await waitUntilFinished(container.id, token);
  const published = await graphCall(`/${igUserId}/media_publish`, token, {
    method: 'POST',
    params: { creation_id: container.id },
  });
  return published.id;
}

async function main() {
  const { discover: discoverMode, slug, image, images, video, force, tone } = parseArgs(process.argv.slice(2));
  const dryRun = process.env.DRY_RUN === '1';

  if (discoverMode) {
    const { IG_ACCESS_TOKEN } = requireEnv(['IG_ACCESS_TOKEN']);
    await discover(IG_ACCESS_TOKEN);
    return;
  }

  if (!slug || (!image && !images && !video)) {
    console.error('usage: node scripts/social/post-to-instagram.mjs <slug> --image=<url> | --images=<url1,url2> | --video=<url>');
    console.error('       node scripts/social/post-to-instagram.mjs --discover');
    process.exit(1);
  }

  const { IG_ACCESS_TOKEN, IG_USER_ID } = requireEnv(['IG_ACCESS_TOKEN', 'IG_USER_ID'], { dryRun });

  if (!force && alreadyPosted('instagram', slug)) {
    console.log(`"${slug}" is already in the Instagram ledger — pass --force to post again.`);
    return;
  }

  const c = loadCase(slug, { tone });
  const caption = buildInstagramCaption(c);
  const mediaDescription = images ? `carousel (${images.length} images)` : video ? 'Reel' : 'image';

  if (dryRun) {
    console.log(`[DRY RUN] would publish ${mediaDescription} for "${slug}"`);
    console.log(`media: ${images ? images.join(', ') : (video ?? image)}`);
    console.log(`caption:\n${caption}`);
    return;
  }

  try {
    let mediaId;
    if (images) {
      mediaId = await publishCarousel({ igUserId: IG_USER_ID, token: IG_ACCESS_TOKEN, imageUrls: images, caption });
    } else if (video) {
      mediaId = await publishSingle({ igUserId: IG_USER_ID, token: IG_ACCESS_TOKEN, mediaType: 'video', url: video, caption });
    } else {
      mediaId = await publishSingle({ igUserId: IG_USER_ID, token: IG_ACCESS_TOKEN, mediaType: 'image', url: image, caption });
    }
    recordPost('instagram', slug, { mediaId, mediaDescription });
    console.log(`published: ${slug} → media id ${mediaId}`);
  } catch (err) {
    console.error(`error publishing ${slug} to instagram: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`error: ${err.message ?? err}`);
  process.exit(1);
});
