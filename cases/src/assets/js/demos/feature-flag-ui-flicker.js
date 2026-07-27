/**
 * demos/feature-flag-ui-flicker.js
 * Export: initDemo(root)
 * Broken: "Simulate page load" paints the default article layout first, then
 *         after a delay (simulating an async flag fetch that resolves after
 *         first paint) inserts a promo banner above the paragraph — the
 *         paragraph's actual on-screen movement is measured from the DOM,
 *         not a hardcoded number, and shown as the shift amount.
 * Fixed:  the flag is already resolved before the first render, so the
 *         banner is part of the very first frame — nothing moves because
 *         there's nothing to insert after paint.
 * The "flag fetch" is simulated client-side (no real network — this
 * project has no backend to poll); the layout-shift measurement itself is
 * real DOM geometry, read the same way the browser's own Layout Instability
 * API would.
 */

import { PRM } from './_demo-utils.js';

function articleMarkup(withBannerNow) {
  return `
    <div style="padding:6px 4px;">
      <div id="cbk-ffl-page" style="border:1px solid var(--casebook-border);border-radius:8px;padding:14px;background:var(--casebook-bg);max-width:420px;">
        <div id="cbk-ffl-banner-slot"></div>
        <h4 style="margin:0 0 6px;font-size:14px;">Q3 Release Notes</h4>
        <p id="cbk-ffl-para" style="margin:0;font-size:12.5px;line-height:1.6;color:var(--casebook-ink-muted);">
          This section is what the reader is looking at. If a banner is inserted above it later, this paragraph — and everything below it — moves down by exactly the banner's height.
        </p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px;">
        <button id="cbk-ffl-run" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">
          Simulate page load
        </button>
        <span id="cbk-ffl-status" style="font-size:11.5px;color:var(--casebook-ink-faint);">${withBannerNow ? 'Flag resolved before paint — 0px shift' : 'Click to run'}</span>
      </div>
    </div>`;
}

const BANNER_HTML = `<div id="cbk-ffl-banner" style="background:color-mix(in srgb, var(--casebook-accent) 18%, var(--casebook-surface-2));border:1px solid var(--casebook-accent);border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:11.5px;">
  🎉 New pricing is here — <strong>see what changed</strong>
</div>`;

function setupBroken(vp) {
  vp.innerHTML = articleMarkup(false);
  const btn = vp.querySelector('#cbk-ffl-run');
  const status = vp.querySelector('#cbk-ffl-status');
  const slot = vp.querySelector('#cbk-ffl-banner-slot');
  const para = vp.querySelector('#cbk-ffl-para');
  if (!btn) return;

  btn.addEventListener('click', () => {
    // Reset to the pre-flag layout every run.
    slot.innerHTML = '';
    status.textContent = 'Painted default layout — fetching flag…';
    const before = para.getBoundingClientRect().top;

    const insert = () => {
      slot.innerHTML = BANNER_HTML;
      const after = para.getBoundingClientRect().top;
      const shift = Math.round(after - before);
      status.textContent = `Flag arrived after paint — layout shifted ${shift}px under the reader`;
      status.style.color = '#c0392b';
      const banner = vp.querySelector('#cbk-ffl-banner');
      if (banner && !PRM) {
        banner.animate(
          [{ backgroundColor: 'color-mix(in srgb, #c0392b 35%, var(--casebook-surface-2))' }, { backgroundColor: 'color-mix(in srgb, var(--casebook-accent) 18%, var(--casebook-surface-2))' }],
          { duration: 900, easing: 'ease-out' }
        );
      }
    };
    status.style.color = 'var(--casebook-ink-faint)';
    setTimeout(insert, PRM ? 50 : 700);
  });
}

function setupFixed(vp) {
  vp.innerHTML = articleMarkup(true);
  const btn = vp.querySelector('#cbk-ffl-run');
  const status = vp.querySelector('#cbk-ffl-status');
  const slot = vp.querySelector('#cbk-ffl-banner-slot');
  if (!btn) return;

  // Banner is already present — the flag resolved before this ever rendered.
  slot.innerHTML = BANNER_HTML;

  btn.addEventListener('click', () => {
    status.textContent = 'Flag resolved before paint — 0px shift';
    status.style.color = 'var(--casebook-ink-faint)';
  });
}

export function initDemo(root) {
  const viewport = root.querySelector('#demo-viewport, .case-demo__viewport');
  const stateLabel = root.querySelector('.case-demo__state-label');
  const brokenBtn = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn = root.querySelector('[data-demo-state="fixed"]');

  function render(state) {
    if (viewport) {
      if (state === 'broken') setupBroken(viewport);
      else setupFixed(viewport);
    }
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
