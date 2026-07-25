/**
 * demos/coverage-myth-lines.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": simulates (entirely client-side, no real test runner)
 * a payment retry under a lost-response network condition, comparing a
 * retry with no idempotency key against one with an idempotency key.
 * Both modes report the identical 100%-coverage, all-green suite header
 * on purpose — that's the point the demo makes.
 */
import { wireToggleDemo } from './_demo-utils.js';

const SUITE_HEADER = `
  <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;background:var(--casebook-surface-2);">
    <strong>Test suite:</strong> 4/4 passing &nbsp;·&nbsp; <strong>Line coverage:</strong> 100% &nbsp;·&nbsp; <strong>Branch coverage:</strong> 100%
    <div style="color:var(--casebook-ink-faint);margin-top:4px;">(identical in both modes below — that's the whole point)</div>
  </div>
`;

function setupBroken(vp) {
  vp.innerHTML = `
    ${SUITE_HEADER}
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ Retry sends the same request again, no idempotency key</div>
    <button id="cbk-cov-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Simulate lost response</button>
    <button id="cbk-cov-reset" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;">Reset</button>
    <div id="cbk-cov-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:140px;white-space:pre-line;">Click "Simulate lost response" to run the scenario.</div>
  `;
  const log = vp.querySelector('#cbk-cov-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-cov-run').addEventListener('click', () => {
    lines.length = 0;
    push('[client] POST /charge  orderId=order-42  amount=$129.00');
    push('[server] charge created: ch_001, orderId=order-42');
    push('[network] ...response lost in transit (timeout)...');
    push('[client] no response within 3s — retrying');
    push('[client] POST /charge  orderId=order-42  amount=$129.00  (retry, no idempotency key)');
    push('[server] charge created: ch_002, orderId=order-42 — indistinguishable from a new charge');
    push('RESULT: ✗ customer charged twice ($258.00 total)');
    push('Test suite for this exact code: still 4/4 passing, still 100% coverage.');
  });
  vp.querySelector('#cbk-cov-reset').addEventListener('click', () => {
    lines.length = 0;
    log.textContent = 'Click "Simulate lost response" to run the scenario.';
  });
}

function setupFixed(vp) {
  vp.innerHTML = `
    ${SUITE_HEADER}
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Retry sends the same idempotency key as the original attempt</div>
    <button id="cbk-cov-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Simulate lost response</button>
    <button id="cbk-cov-reset" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;">Reset</button>
    <div id="cbk-cov-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:140px;white-space:pre-line;">Click "Simulate lost response" to run the scenario.</div>
  `;
  const log = vp.querySelector('#cbk-cov-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-cov-run').addEventListener('click', () => {
    lines.length = 0;
    push('[client] POST /charge  orderId=order-42  amount=$129.00  Idempotency-Key: idem-a1b2c3');
    push('[server] charge created: ch_001, orderId=order-42');
    push('[network] ...response lost in transit (timeout)...');
    push('[client] no response within 3s — retrying');
    push('[client] POST /charge  orderId=order-42  amount=$129.00  Idempotency-Key: idem-a1b2c3  (retry, same key)');
    push('[server] Idempotency-Key idem-a1b2c3 already used — returning original result ch_001, no new charge');
    push('RESULT: ✓ customer charged once ($129.00 total)');
    push('Test suite for this exact code: also 4/4 passing, also 100% coverage.');
  });
  vp.querySelector('#cbk-cov-reset').addEventListener('click', () => {
    lines.length = 0;
    log.textContent = 'Click "Simulate lost response" to run the scenario.';
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
