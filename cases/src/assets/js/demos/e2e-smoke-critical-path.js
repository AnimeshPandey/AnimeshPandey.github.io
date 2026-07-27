/**
 * demos/e2e-smoke-critical-path.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": "Run CI" simulates a test run against the same
 * injected checkout regression in two different suites. "broken" mode
 * runs a blanket 40-test E2E suite where several tests are flaky by
 * design (retry-until-green), so the one test that actually caught the
 * real regression looks identical to routine flake and gets auto-retried
 * into a passing build. "fixed" mode runs a single deterministic E2E
 * smoke on the checkout path — no retry policy — so the same regression
 * fails once, visibly, and blocks the merge.
 */
import { wireToggleDemo, simulateAsync } from './_demo-utils.js';

const BLANKET_TESTS = [
  'E2E: checkout happy path',
  'E2E: checkout with discount code',
  'E2E: checkout with expired card',
  'E2E: cart persists across tabs',
  'E2E: navbar renders on mobile',
  'E2E: search autocomplete',
  'E2E: wishlist add/remove',
  'E2E: account settings save',
];

function shellBroken() {
  return `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      40-test E2E suite (8 shown) · a config change has broken the live payment-provider connection
    </div>
    <button id="cbk-e2e-run" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Run CI</button>
    <div id="cbk-e2e-list" style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;font-size:11.5px;font-family:var(--casebook-mono, monospace);"></div>
    <div id="cbk-e2e-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:60px;white-space:pre-line;">Click "Run CI" to run the suite against the current build.</div>
  `;
}

function shellFixed() {
  return `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      1 E2E smoke on the checkout critical path (edge cases covered separately by 12 fast unit/integration tests, not shown here) · same broken build
    </div>
    <button id="cbk-e2e-run" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Run CI</button>
    <div id="cbk-e2e-list" style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;font-size:11.5px;font-family:var(--casebook-mono, monospace);"></div>
    <div id="cbk-e2e-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:60px;white-space:pre-line;">Click "Run CI" to run the suite against the current build.</div>
  `;
}

function row(label, state) {
  const icon = state === 'pending' ? '…' : state === 'pass' ? '✓' : state === 'fail' ? '✗' : '↻';
  const color = state === 'pass' ? 'var(--casebook-ink-faint)' : state === 'fail' ? '#c0392b' : 'var(--casebook-accent)';
  return `<div style="color:${color};">${icon} ${label}</div>`;
}

function setupBroken(vp) {
  vp.innerHTML = shellBroken();
  const list = vp.querySelector('#cbk-e2e-list');
  const log = vp.querySelector('#cbk-e2e-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };
  list.innerHTML = BLANKET_TESTS.map((t) => row(t, 'pending')).join('');

  vp.querySelector('#cbk-e2e-run').addEventListener('click', async () => {
    lines.length = 0;
    push('[ci] running 40 E2E tests (8 shown)...');
    await simulateAsync(500);
    const states = BLANKET_TESTS.map((t) => t === 'E2E: checkout happy path' ? 'fail' : (Math.random() < 0.25 ? 'flaky' : 'pass'));
    list.innerHTML = BLANKET_TESTS.map((t, i) => row(t, states[i] === 'flaky' ? 'fail' : states[i])).join('');
    push('[ci] 3 tests failed on first run — auto-retrying failed tests (standard policy for this suite)...');
    await simulateAsync(500);
    // On retry: the real checkout bug fails again (deterministic), flaky ones pass.
    list.innerHTML = BLANKET_TESTS.map((t, i) => {
      if (t === 'E2E: checkout happy path') return row(t, 'fail');
      return row(t, 'pass');
    }).join('');
    push('[ci] retry: 2 of 3 previously-failed tests passed (flake) — 1 still failing: "checkout happy path"');
    await simulateAsync(400);
    push('[ci] retrying "checkout happy path" one more time (same retry policy applies to every test)...');
    await simulateAsync(500);
    push('[ci] ✓ "checkout happy path" passed on retry 2 — merge unblocked');
    push('RESULT: ✗ the real payment-provider regression looked identical to routine flake and got retried into a green build.');
  });
}

function setupFixed(vp) {
  vp.innerHTML = shellFixed();
  const list = vp.querySelector('#cbk-e2e-list');
  const log = vp.querySelector('#cbk-e2e-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };
  list.innerHTML = row('E2E smoke: guest checkout', 'pending');

  vp.querySelector('#cbk-e2e-run').addEventListener('click', async () => {
    lines.length = 0;
    push('[ci] running 1 E2E smoke: guest checkout...');
    await simulateAsync(600);
    list.innerHTML = row('E2E smoke: guest checkout', 'fail');
    push('[ci] ✗ "guest checkout" failed — payment provider step did not complete');
    push('[ci] no retry policy on this test — a failure here blocks the merge and pages on-call');
    push('RESULT: ✓ the same regression was caught before it reached production, on the one test built to catch exactly this.');
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
