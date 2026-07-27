/**
 * demos/csp-inline-script.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": simulates (entirely client-side, no real network
 * request or actual script execution) a browser's CSP enforcement
 * checking two inline <script> blocks against a policy — one the page
 * legitimately owns, one representing an attacker's injected payload —
 * comparing a plain script-src 'self' policy against a nonce-based one.
 */
import { wireToggleDemo } from './_demo-utils.js';

function shell(policyLine, ownResult, ownGood, attackerResult, attackerGood) {
  return `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;font-family:var(--casebook-mono, monospace);">
      Policy: ${policyLine}
    </div>
    <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:10px 12px;margin-bottom:8px;font-size:12px;background:var(--casebook-surface-2);">
      <strong>Your inline script</strong> — <code>&lt;script&gt;initDropdown()&lt;/script&gt;</code><br>
      <span style="color:${ownGood ? 'var(--casebook-accent)' : 'inherit'};">${ownGood ? '✓' : '✗'} ${ownResult}</span>
    </div>
    <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;background:var(--casebook-surface-2);">
      <strong>Attacker-injected script</strong> — <code>&lt;script&gt;stealCookies()&lt;/script&gt;</code><br>
      <span style="color:${attackerGood ? 'var(--casebook-accent)' : 'inherit'};">${attackerGood ? '✓' : '✗'} ${attackerResult}</span>
    </div>
  `;
}

function setupBroken(vp) {
  vp.innerHTML = shell(
    "script-src 'self'",
    'Blocked — no nonce, no src attribute, CSP refuses it just like the attacker’s',
    false,
    'Blocked — same policy, same reason, but this one was supposed to be blocked',
    true
  );
}

function setupFixed(vp) {
  vp.innerHTML = shell(
    "script-src 'self' 'nonce-8f3a1c'",
    'Allowed — tag carries nonce="8f3a1c", matches the policy’s nonce for this response',
    true,
    'Blocked — attacker’s injected tag has no nonce attribute, and can’t predict this response’s random value',
    true
  );
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
