#!/usr/bin/env node
/**
 * One-time local OAuth 2.0 + PKCE helper for X — run this once to obtain
 * X_ACCESS_TOKEN for post-to-x.mjs. Cannot be run headless or in CI: it
 * opens your browser for the one-time "Authorize app" click, which only
 * you can make while logged into your own X account.
 *
 * Before running:
 *   1. developer.x.com → create a free Project + App with OAuth 2.0 enabled.
 *   2. App settings → User authentication settings → add this exact callback URL:
 *        http://127.0.0.1:8934/callback
 *      and enable scopes: tweet.read, tweet.write, users.read, offline.access
 *   3. export X_CLIENT_ID=...        (App's "Keys and tokens" page)
 *      export X_CLIENT_SECRET=...    (only if the app is a "confidential" client;
 *                                      omit for a "public" client — PKCE covers it)
 *
 * Usage:
 *   node scripts/social/x-oauth-setup.mjs
 *
 * Prints an X_ACCESS_TOKEN (and refresh_token) to export for post-to-x.mjs.
 * Nothing is written to disk — copy the printed export line into your shell
 * or scripts/social/.env yourself. Tokens expire; re-run this script for a
 * fresh one (refresh-token rotation isn't automated here yet).
 */

import { randomBytes, createHash } from 'node:crypto';
import { waitForCallback, openInBrowser } from './lib/oauth-callback-server.mjs';

const PORT = 8934;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function main() {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET; // optional — public vs confidential client

  if (!clientId) {
    console.error("error: X_CLIENT_ID not set. See this file's header comment for setup steps.");
    process.exit(1);
  }

  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  const state = base64url(randomBytes(16));

  const authorizeUrl = new URL(AUTHORIZE_URL);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authorizeUrl.searchParams.set('scope', SCOPES.join(' '));
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  console.log('Opening your browser to authorize this app on X…');
  console.log(`If it doesn't open automatically, visit:\n${authorizeUrl}\n`);
  openInBrowser(authorizeUrl.toString());

  const params = await waitForCallback({ port: PORT });

  if (params.error) {
    console.error(`error: X denied authorization: ${params.error} — ${params.error_description ?? ''}`);
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
    code_verifier: verifier,
    client_id: clientId,
  });

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  }

  const res = await fetch(TOKEN_URL, { method: 'POST', headers, body });
  const tokens = await res.json();
  if (!res.ok) {
    console.error(`error exchanging code for tokens: ${JSON.stringify(tokens)}`);
    process.exit(1);
  }

  console.log('\nSuccess. Export this for post-to-x.mjs:\n');
  console.log(`export X_ACCESS_TOKEN=${tokens.access_token}`);
  if (tokens.refresh_token) {
    console.log(`\n# refresh_token (not auto-refreshed by this repo yet — save it if you want to add that later):`);
    console.log(`# ${tokens.refresh_token}`);
  }
  console.log(`\nExpires in ${tokens.expires_in ?? '?'} seconds — re-run this script for a fresh token once it expires.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
