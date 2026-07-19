/**
 * Tiny local HTTP server used only by the one-time *-oauth-setup.mjs
 * scripts to catch an OAuth redirect on localhost. Not used by anything
 * that runs in CI — this step is inherently interactive (a human clicking
 * "Authorize" in a browser), which is why it can't be automated further.
 */

import { createServer } from 'node:http';
import { execFile } from 'node:child_process';

export function waitForCallback({ port, path = '/callback', timeoutMs = 120000 }) {
  return new Promise((resolve, reject) => {
    // Un-cleared, this timer keeps the event loop alive for the full
    // timeoutMs even after a successful callback — the script prints its
    // result but the shell prompt doesn't return until it fires.
    const timer = setTimeout(() => {
      server.close();
      reject(new Error(`timed out waiting for OAuth callback on port ${port}`));
    }, timeoutMs);

    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (url.pathname !== path) {
        res.writeHead(404).end();
        return;
      }
      const params = Object.fromEntries(url.searchParams);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body style="font-family:sans-serif;padding:2rem"><h1>Done — you can close this tab.</h1></body></html>');
      clearTimeout(timer);
      server.close();
      resolve(params);
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1');
  });
}

/** Best-effort browser open (macOS `open`). Falls back silently — the
 * caller always prints the URL too, so this is a convenience, not a
 * requirement. */
export function openInBrowser(url) {
  execFile('open', [url], () => {});
}
