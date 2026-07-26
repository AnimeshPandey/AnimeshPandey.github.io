/**
 * demos/css-transition-gpu.js
 * Export: initDemo(root)
 * Broken: a box animated via the `left` CSS property — a real, continuously
 *         running @keyframes loop (layout-triggering every frame).
 * Fixed:  a box animated via `transform: translateX(...)` — the same
 *         distance/timing, but compositor-only.
 * Both states include a "Block main thread" button that runs a genuine
 * synchronous busy-loop, so the difference in behavior under load is real
 * browser behavior, not a simulated one. Respects prefers-reduced-motion by
 * skipping the continuous animation (still wires the block button so the
 * demo isn't empty for PRM users).
 */

import { PRM } from './_demo-utils.js';

function markup(kind) {
  const isTransform = kind === 'transform';
  return `
    <style>
      @keyframes cbk-ctg-left {
        0%   { left: 4px; }
        50%  { left: calc(100% - 50px); }
        100% { left: 4px; }
      }
      @keyframes cbk-ctg-transform {
        0%   { transform: translateX(0); }
        50%  { transform: translateX(calc(100% - 54px)); }
        100% { transform: translateX(0); }
      }
      .cbk-ctg-track {
        position: relative;
        height: 60px;
        background: var(--casebook-surface-2);
        border: 1px solid var(--casebook-border);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 12px;
      }
      .cbk-ctg-box {
        position: absolute;
        top: 5px;
        left: 4px;
        width: 46px;
        height: 46px;
        border-radius: 8px;
        background: var(--casebook-accent);
      }
      ${PRM ? '' : `
      .cbk-ctg-box--left { animation: cbk-ctg-left 2.4s ease-in-out infinite; }
      .cbk-ctg-box--transform { animation: cbk-ctg-transform 2.4s ease-in-out infinite; }
      `}
    </style>
    <div style="padding:6px 4px;">
      <p style="font-size:11.5px;color:var(--casebook-ink-faint);margin:0 0 8px;">
        ${isTransform
          ? '✓ Animating transform — compositor-only, no layout or paint per frame'
          : '✗ Animating left — triggers layout + paint every frame'}
      </p>
      <div class="cbk-ctg-track">
        <div class="cbk-ctg-box cbk-ctg-box--${isTransform ? 'transform' : 'left'}" aria-hidden="true"></div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button id="cbk-ctg-block" type="button" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">
          Block main thread (1.2s)
        </button>
        <span id="cbk-ctg-status" style="font-size:11.5px;color:var(--casebook-ink-faint);">Idle</span>
      </div>
    </div>`;
}

function wire(vp, kind) {
  vp.innerHTML = markup(kind);
  const btn = vp.querySelector('#cbk-ctg-block');
  const status = vp.querySelector('#cbk-ctg-status');
  if (!btn) return;

  btn.addEventListener('click', () => {
    btn.disabled = true;
    if (status) {
      status.textContent = kind === 'transform'
        ? 'Main thread blocked — watch the box: it keeps sliding (compositor thread).'
        : 'Main thread blocked — watch the box: it freezes in place until this ends.';
    }
    // Real synchronous busy-wait — genuinely occupies the main thread for ~1.2s.
    const end = Date.now() + (PRM ? 50 : 1200);
    while (Date.now() < end) { /* busy wait */ }
    if (status) status.textContent = 'Unblocked.';
    btn.disabled = false;
  });
}

export function initDemo(root) {
  const viewport = root.querySelector('#demo-viewport, .case-demo__viewport');
  const stateLabel = root.querySelector('.case-demo__state-label');
  const brokenBtn = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn = root.querySelector('[data-demo-state="fixed"]');

  function render(state) {
    if (viewport) wire(viewport, state === 'broken' ? 'left' : 'transform');
    if (stateLabel) {
      const lbl = state === 'broken' ? brokenBtn : fixedBtn;
      if (lbl) stateLabel.textContent = 'Showing: ' + lbl.textContent.trim();
    }
    if (brokenBtn) brokenBtn.setAttribute('aria-pressed', state === 'broken' ? 'true' : 'false');
    if (fixedBtn) fixedBtn.setAttribute('aria-pressed', state === 'fixed' ? 'true' : 'false');
  }

  if (brokenBtn) brokenBtn.addEventListener('click', () => render('broken'));
  if (fixedBtn) fixedBtn.addEventListener('click', () => render('fixed'));
  render('fixed');
}
