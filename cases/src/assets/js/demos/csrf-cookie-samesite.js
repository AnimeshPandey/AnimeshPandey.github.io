/**
 * demos/csrf-cookie-samesite.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": simulates (entirely client-side, no real cross-site
 * request) a browser sending a cross-site attack against a session-revoke
 * endpoint, comparing a GET-based endpoint with no SameSite restriction
 * against a POST-based endpoint with SameSite=Lax and a CSRF token.
 */
import { wireToggleDemo } from './_demo-utils.js';

function shell(bannerText, bannerGood, endpointDesc) {
  return `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      ${bannerGood ? '✓' : '✗'} ${bannerText}
    </div>
    <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;background:var(--casebook-surface-2);">
      <strong>Endpoint:</strong> ${endpointDesc}
    </div>
    <button id="cbk-csrf-attack" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Simulate cross-site attack</button>
    <button id="cbk-csrf-reset" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;">Reset</button>
    <div id="cbk-csrf-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:130px;white-space:pre-line;">Click "Simulate cross-site attack" to run the scenario.</div>
  `;
}

function setupBroken(vp) {
  vp.innerHTML = shell(
    'GET /settings/revoke-session — no SameSite attribute set',
    false,
    'GET /settings/revoke-session?id=42 (Cookie: session=abc123; no SameSite)'
  );
  const log = vp.querySelector('#cbk-csrf-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-csrf-attack').addEventListener('click', () => {
    lines.length = 0;
    push('[attacker page] <a href="https://victim.example/settings/revoke-session?id=42">');
    push('[victim browser] top-level navigation to victim.example (GET, "safe" method)');
    push('[victim browser] cookie session=abc123 attached — no SameSite restriction applies');
    push('[victim server] GET handler mutates state: session #42 revoked');
    push('RESULT: ✗ attack succeeded — a cross-site link revoked a real session');
  });
  vp.querySelector('#cbk-csrf-reset').addEventListener('click', () => {
    lines.length = 0;
    log.textContent = 'Click "Simulate cross-site attack" to run the scenario.';
  });
}

function setupFixed(vp) {
  vp.innerHTML = shell(
    'POST-only endpoint, SameSite=Lax cookie, server-checked CSRF token',
    true,
    'POST /settings/revoke-session (Cookie: session=abc123; SameSite=Lax) — requires X-CSRF-Token'
  );
  const log = vp.querySelector('#cbk-csrf-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-csrf-attack').addEventListener('click', () => {
    lines.length = 0;
    push('[attacker page] <a href="https://victim.example/settings/revoke-session?id=42">');
    push('[victim server] GET on this route: 405 Method Not Allowed — mutation moved to POST');
    push('[attacker page] fallback: hidden auto-submitting <form method="POST" action="...">');
    push('[victim browser] cross-site POST — SameSite=Lax cookie is withheld (not a top-level GET)');
    push('[victim server] request arrives with no session cookie — 401 Unauthorized');
    push('[victim server] even with a cookie, missing X-CSRF-Token — request would be rejected anyway');
    push('RESULT: ✓ attack blocked twice over — GET can\'t mutate, and cross-site POST has no cookie or token');
  });
  vp.querySelector('#cbk-csrf-reset').addEventListener('click', () => {
    lines.length = 0;
    log.textContent = 'Click "Simulate cross-site attack" to run the scenario.';
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
