#!/usr/bin/env node
/**
 * One-time local OAuth 2.0 helper for LinkedIn — run this once to obtain
 * LINKEDIN_ACCESS_TOKEN for post-to-linkedin.mjs. Cannot be run headless or
 * in CI: it opens your browser for the one-time "Allow" click, which only
 * you can make while logged into your own LinkedIn account.
 *
 * Before running:
 *   1. linkedin.com/developers → create an app.
 *   2. Products tab → add "Share on LinkedIn" and
 *      "Sign In with LinkedIn using OpenID Connect" (both free, self-serve).
 *   3. Auth tab → add this exact redirect URL:
 *        http://localhost:8935/callback
 *   4. export LINKEDIN_CLIENT_ID=...
 *      export LINKEDIN_CLIENT_SECRET=...
 *
 * Usage:
 *   node scripts/social/linkedin-oauth-setup.mjs
 *
 * Prints a LINKEDIN_ACCESS_TOKEN (typically valid ~60 days) and your
 * resolved person URN to export for post-to-linkedin.mjs.
 */

import { randomBytes } from 'node:crypto';
import { waitForCallback, openInBrowser } from './lib/oauth-callback-server.mjs';

const PORT = 8935;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const AUTHORIZE_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const SCOPES = ['openid', 'profile', 'w_member_social'];

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function main() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("error: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must both be set. See this file's header comment.");
    process.exit(1);
  }

  const state = base64url(randomBytes(16));
  const authorizeUrl = new URL(AUTHORIZE_URL);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authorizeUrl.searchParams.set('scope', SCOPES.join(' '));
  authorizeUrl.searchParams.set('state', state);

  console.log('Opening your browser to authorize this app on LinkedIn…');
  console.log(`If it doesn't open automatically, visit:\n${authorizeUrl}\n`);
  openInBrowser(authorizeUrl.toString());

  const params = await waitForCallback({ port: PORT });

  if (params.error) {
    console.error(`error: LinkedIn denied authorization: ${params.error} — ${params.error_description ?? ''}`);
    process.exit(1);
  }
  if (params.state !== state) {
    console.error('error: state mismatch — possible CSRF, aborting. Run this script again.');
    process.exit(1);
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokens = await res.json();
  if (!res.ok) {
    console.error(`error exchanging code for tokens: ${JSON.stringify(tokens)}`);
    process.exit(1);
  }

  console.log('\nSuccess. Export this for post-to-linkedin.mjs:\n');
  console.log(`export LINKEDIN_ACCESS_TOKEN=${tokens.access_token}`);
  console.log(`\nExpires in ${tokens.expires_in ?? '?'} seconds.`);

  try {
    const infoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const info = await infoRes.json();
    if (info.sub) {
      console.log('\nOptional (post-to-linkedin.mjs resolves this itself if you skip it):');
      console.log(`export LINKEDIN_PERSON_URN=urn:li:person:${info.sub}`);
    }
  } catch {
    // non-fatal — post-to-linkedin.mjs resolves this itself at post time
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
