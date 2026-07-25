/**
 * demos/accessibility-axe-ci.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": simulates (entirely client-side, no real axe-core run)
 * two CI policies scanning the same page with 3 pre-existing violations —
 * fail-on-any-violation vs. a baseline diff that fails only on violations
 * not already tracked.
 */
import { wireToggleDemo } from './_demo-utils.js';

const KNOWN = [
  { id: 'color-contrast', target: '.hero-cta' },
  { id: 'image-alt', target: '.footer-logo' },
  { id: 'label', target: '#search-input' },
];
const NEW_VIOLATION = { id: 'color-contrast', target: '.checkout-total' };

function listHtml(items) {
  return items.map((v) => `${v.id}::${v.target}`).join(', ');
}

function setupBroken(vp) {
  vp.innerHTML = `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ Fail on any axe violation — no baseline</div>
    <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;background:var(--casebook-surface-2);">
      <strong>This PR changed:</strong> checkout button onClick handler (no markup changes)
    </div>
    <button id="cbk-axe-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Run axe in CI</button>
    <button id="cbk-axe-reset" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;">Reset</button>
    <div id="cbk-axe-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:130px;white-space:pre-line;">Click "Run axe in CI" to simulate the check.</div>
  `;
  const log = vp.querySelector('#cbk-axe-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-axe-run').addEventListener('click', () => {
    lines.length = 0;
    push(`[axe.run()] ${KNOWN.length} violations found: ${listHtml(KNOWN)}`);
    push('[CI policy] fail if violations.length > 0');
    push(`RESULT: ✗ BUILD FAILED — ${KNOWN.length} violation(s), none of them touched by this PR`);
  });
  vp.querySelector('#cbk-axe-reset').addEventListener('click', () => {
    lines.length = 0;
    log.textContent = 'Click "Run axe in CI" to simulate the check.';
  });
}

function setupFixed(vp) {
  vp.innerHTML = `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Baseline diff — fail only on new violations</div>
    <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;background:var(--casebook-surface-2);">
      <strong>.axe-baseline.json:</strong><br>${listHtml(KNOWN)}
    </div>
    <button id="cbk-axe-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Run axe in CI</button>
    <button id="cbk-axe-new" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;">Simulate new violation</button>
    <button id="cbk-axe-reset" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;">Reset</button>
    <div id="cbk-axe-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:130px;white-space:pre-line;">Click "Run axe in CI" to simulate the check.</div>
  `;
  const log = vp.querySelector('#cbk-axe-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };
  let introduceNew = false;

  function run() {
    lines.length = 0;
    const found = introduceNew ? [...KNOWN, NEW_VIOLATION] : KNOWN;
    push(`[axe.run()] ${found.length} violations found: ${listHtml(found)}`);
    const newOnes = found.filter((v) => !KNOWN.some((k) => k.id === v.id && k.target === v.target));
    push(`[diff vs baseline] ${newOnes.length} new, ${found.length - newOnes.length} known (tracked)`);
    if (newOnes.length) {
      push(`RESULT: ✗ BUILD FAILED — new violation(s) this PR introduced: ${listHtml(newOnes)}`);
    } else {
      push('RESULT: ✓ BUILD PASSED — no new violations introduced by this PR');
    }
  }

  vp.querySelector('#cbk-axe-run').addEventListener('click', run);
  vp.querySelector('#cbk-axe-new').addEventListener('click', () => {
    introduceNew = true;
    run();
  });
  vp.querySelector('#cbk-axe-reset').addEventListener('click', () => {
    introduceNew = false;
    lines.length = 0;
    log.textContent = 'Click "Run axe in CI" to simulate the check.';
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
