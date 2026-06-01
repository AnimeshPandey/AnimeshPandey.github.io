/**
 * _demo-utils.js — shared helpers for all demo modules.
 * Import from any demos/{slug}.js file.
 */

export const PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * wireToggleDemo — wires broken/fixed toggle buttons.
 * Manages aria-pressed, state-label, dispatches case-demo-fixed on broken→fixed.
 */
export function wireToggleDemo(root, { renderBroken, renderFixed, defaultState = 'fixed' } = {}) {
  const viewport   = root.querySelector('#demo-viewport, .case-demo__viewport');
  const stateLabel = root.querySelector('.case-demo__state-label');
  const brokenBtn  = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn   = root.querySelector('[data-demo-state="fixed"]');
  let current = null;

  function render(state) {
    const prev = current;
    current = state;
    if (viewport) {
      if (state === 'broken') renderBroken && renderBroken(viewport, PRM);
      else                    renderFixed  && renderFixed(viewport, PRM);
    }
    if (stateLabel) {
      const lbl = state === 'broken' ? brokenBtn : fixedBtn;
      if (lbl) stateLabel.textContent = 'Showing: ' + lbl.textContent.trim();
    }
    brokenBtn && brokenBtn.setAttribute('aria-pressed', state === 'broken' ? 'true' : 'false');
    fixedBtn  && fixedBtn.setAttribute('aria-pressed',  state === 'fixed'  ? 'true' : 'false');
    if (state === 'fixed' && prev === 'broken') {
      document.dispatchEvent(new CustomEvent('case-demo-fixed'));
    }
  }

  brokenBtn && brokenBtn.addEventListener('click', () => render('broken'));
  fixedBtn  && fixedBtn.addEventListener('click',  () => render('fixed'));
  render(defaultState);
  return { render };
}

/** makeSkeleton — returns shimmer skeleton row HTML. */
export function makeSkeleton(count = 3, widths = ['90%', '75%', '60%']) {
  const css = PRM ? '' : `<style>@keyframes cbk-sh{0%{background-position:-200% 0}100%{background-position:200% 0}}.cbk-sk{background:linear-gradient(90deg,var(--casebook-surface-2) 25%,var(--casebook-border) 50%,var(--casebook-surface-2) 75%);background-size:200% 100%;animation:cbk-sh 1.4s ease-in-out infinite;}</style>`;
  const rows = Array.from({ length: count }, (_, i) =>
    `<div class="cbk-sk" style="height:10px;width:${widths[i % widths.length]};border-radius:4px;margin-bottom:8px;background:var(--casebook-border);"></div>`
  ).join('');
  return `${css}<div style="padding:12px;">${rows}</div>`;
}

/** simulateAsync — resolves after ms milliseconds. */
export function simulateAsync(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** withPRM — calls prmFn if reduced motion active, else normalFn. */
export function withPRM(normalFn, prmFn) {
  return PRM ? prmFn() : normalFn();
}

/** vp — shared viewport style wrapper. */
export function wrap(html, padding = '16px') {
  return `<div style="padding:${padding};font-size:13px;color:var(--casebook-ink-muted);">${html}</div>`;
}
