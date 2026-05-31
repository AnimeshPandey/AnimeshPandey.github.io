/**
 * demos/skeleton-screens-perceived-speed.js
 * Export: initDemo(root, { demoType })
 * Broken: centered spinner with jarring content pop-in (CLS, long wait feel).
 * Fixed:  skeleton blocks → content fade (layout stable, faster perceived load).
 */

export function initDemo(root, { demoType } = {}) {
  const prm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const viewport  = root.querySelector('#demo-viewport');
  const stateLabel = root.querySelector('#demo-state-label');
  const brokenBtn = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn  = root.querySelector('[data-demo-state="fixed"]');
  if (!viewport) return;

  /* ── Spinner HTML (broken state) ── */
  function brokenHTML() {
    return `
<div style="display:flex;align-items:center;justify-content:center;
            height:160px;background:var(--casebook-bg);">
  ${prm ? '<span style="color:var(--casebook-ink-faint);font-size:13px;">Loading…</span>'
        : '<div style="width:36px;height:36px;border:3px solid var(--casebook-border);\
border-top-color:var(--casebook-accent);border-radius:50%;\
animation:cbk-spin 0.8s linear infinite;" aria-label="Loading spinner" role="img"></div>'}
</div>
<style>@keyframes cbk-spin{to{transform:rotate(360deg)}}</style>`;
  }

  /* ── Skeleton HTML (fixed state) ── */
  function skeletonHTML() {
    const shimmer = prm ? '' : `
<style>
@keyframes cbk-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.cbk-skel{background:linear-gradient(90deg,
  var(--casebook-surface-2) 25%,
  var(--casebook-border) 50%,
  var(--casebook-surface-2) 75%);
  background-size:200% 100%;
  animation:cbk-shimmer 1.4s ease-in-out infinite;}
</style>`;
    return `
${shimmer}
<div style="padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--casebook-bg);">
  <div class="cbk-skel" style="height:14px;border-radius:7px;width:45%"></div>
  <div class="cbk-skel" style="height:10px;border-radius:5px;width:90%"></div>
  <div class="cbk-skel" style="height:10px;border-radius:5px;width:75%"></div>
  <div style="display:flex;gap:10px;margin-top:6px;">
    <div class="cbk-skel" style="height:60px;border-radius:8px;flex:1"></div>
    <div class="cbk-skel" style="height:60px;border-radius:8px;flex:1"></div>
    <div class="cbk-skel" style="height:60px;border-radius:8px;flex:1"></div>
  </div>
  <div class="cbk-skel" style="height:10px;border-radius:5px;width:60%"></div>
</div>`;
  }

  /* ── Render ── */
  function render(state) {
    viewport.innerHTML = state === 'broken' ? brokenHTML() : skeletonHTML();
    if (stateLabel) {
      stateLabel.textContent = state === 'broken'
        ? 'Showing: Broken (spinner) — poor perceived performance'
        : 'Showing: Fixed (skeleton) — layout-stable, faster feel';
    }
    if (brokenBtn) brokenBtn.setAttribute('aria-pressed', state === 'broken' ? 'true' : 'false');
    if (fixedBtn)  fixedBtn.setAttribute('aria-pressed',  state === 'fixed'  ? 'true' : 'false');
  }

  /* ── Wire controls ── */
  if (brokenBtn) brokenBtn.addEventListener('click', () => render('broken'));
  if (fixedBtn)  fixedBtn.addEventListener('click',  () => render('fixed'));

  /* Default: show fixed state first */
  render('fixed');
}
