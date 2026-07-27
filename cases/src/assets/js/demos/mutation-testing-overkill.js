/**
 * demos/mutation-testing-overkill.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": "Run mutation testing" simulates a mutation-testing
 * run against a codebase that has one real, injected gap: a removed
 * idempotency check in the payment retry path survives (the tests never
 * assert it). "broken" mode mutates the whole codebase — hundreds of
 * trivial UI/utility mutants get generated alongside the one real one,
 * so the real survivor is buried in a long noisy list nobody reads.
 * "fixed" mode scopes mutation testing to payments/auth/money-math only
 * — a handful of mutants, fast, and the same real survivor is the only
 * (or one of very few) result, impossible to miss.
 */
import { wireToggleDemo, simulateAsync } from './_demo-utils.js';

const NOISY_FILES = [
  'PriceTag.jsx', 'Tooltip.jsx', 'Avatar.jsx', 'Breadcrumbs.jsx', 'Badge.jsx',
  'DateLabel.jsx', 'EmptyState.jsx', 'SkeletonRow.jsx', 'Toast.jsx', 'IconButton.jsx',
];

function shell(mode) {
  return `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      ${mode === 'broken'
    ? 'Scope: entire codebase (340+ files) — one real bug: missing idempotency check in payments/charge.js'
    : 'Scope: src/payments/, src/auth/, src/money-math.js only — same real bug'}
    </div>
    <button id="cbk-mut-run" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Run mutation testing</button>
    <div id="cbk-mut-progress" style="font-size:11.5px;color:var(--casebook-ink-faint);margin-bottom:8px;"></div>
    <div id="cbk-mut-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:140px;white-space:pre-line;max-height:220px;overflow-y:auto;">Click "Run mutation testing" to start.</div>
  `;
}

function setupBroken(vp) {
  vp.innerHTML = shell('broken');
  const progress = vp.querySelector('#cbk-mut-progress');
  const log = vp.querySelector('#cbk-mut-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); log.scrollTop = log.scrollHeight; };

  vp.querySelector('#cbk-mut-run').addEventListener('click', async () => {
    lines.length = 0;
    progress.textContent = 'Generating mutants across 340 files...';
    await simulateAsync(500);
    progress.textContent = 'Running test suite against 2,140 mutants...';
    push('[mutate] payments/charge.js: 6 mutants generated');
    push('[mutate] auth/session.js: 4 mutants generated');
    push('[mutate] money-math.js: 5 mutants generated');
    await simulateAsync(400);
    push('[mutate] ' + NOISY_FILES.length + ' presentational components: 2,125 mutants generated (330 more files not shown)');
    await simulateAsync(600);
    progress.textContent = 'Elapsed: 3h 12m — CI timeout warning';
    push('');
    push('=== 214 mutants survived ===');
    NOISY_FILES.forEach((f) => push('  ✗ survived: ' + f + ' — equivalent or low-value mutant'));
    push('  ✗ survived: ' + '...(203 more, mostly presentational components)');
    push('  ✗ survived: payments/charge.js line 41 — idempotency key check removed, tests still pass');
    push('');
    push('RESULT: ✗ the one survived mutant that mattered is line 215 of 215 — nobody read that far. Mutation testing disabled in CI the following week.');
  });
}

function setupFixed(vp) {
  vp.innerHTML = shell('fixed');
  const progress = vp.querySelector('#cbk-mut-progress');
  const log = vp.querySelector('#cbk-mut-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-mut-run').addEventListener('click', async () => {
    lines.length = 0;
    progress.textContent = 'Generating mutants across 3 scoped paths...';
    await simulateAsync(400);
    push('[mutate] payments/charge.js: 6 mutants generated');
    push('[mutate] auth/session.js: 4 mutants generated');
    push('[mutate] money-math.js: 5 mutants generated');
    await simulateAsync(400);
    progress.textContent = 'Elapsed: 4m 10s';
    push('');
    push('=== 1 mutant survived (14 killed) ===');
    push('  ✗ survived: payments/charge.js line 41 — idempotency key check removed, tests still pass');
    push('');
    push('RESULT: ✓ one clear, actionable survivor in a report short enough to read in full. Fixed the same day it appeared.');
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
