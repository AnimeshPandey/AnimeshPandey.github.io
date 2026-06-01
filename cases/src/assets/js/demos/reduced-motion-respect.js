import { wireToggleDemo, PRM } from './_demo-utils.js';

function spinnerHTML(animate) {
  const spinStyle = animate && !PRM
    ? 'animation:cbk-spin 0.7s linear infinite;'
    : 'border-top-color:var(--casebook-border);';
  return `<div style="width:36px;height:36px;border-radius:50%;border:3px solid var(--casebook-border);border-top-color:var(--casebook-accent);${spinStyle}"></div>`;
}

function badgeHTML(animate) {
  const bounceStyle = animate && !PRM
    ? 'animation:cbk-bounce 0.6s ease-in-out infinite alternate;'
    : '';
  return `<span style="background:var(--casebook-accent);color:var(--casebook-bg);font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;display:inline-block;${bounceStyle}">3 new</span>`;
}

export function initDemo(root) {
  function renderBroken(vp) {
    vp.innerHTML = `
<style>
@keyframes cbk-spin{to{transform:rotate(360deg)}}
@keyframes cbk-bounce{to{transform:translateY(-6px)}}
</style>
<div style="padding:16px;">
  <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 14px;">Animations play regardless of OS "Reduce Motion" setting.</p>
  <div style="display:flex;gap:24px;align-items:center;">
    ${spinnerHTML(true)}
    <div>
      <p style="margin:0 0 6px;font-size:13px;">Notifications</p>
      ${badgeHTML(true)}
    </div>
  </div>
  <p style="font-size:11px;color:var(--casebook-accent);margin:12px 0 0;">Motion plays unconditionally — can cause vestibular issues.</p>
</div>`;
  }

  function renderFixed(vp) {
    // In fixed state: PRM simulated toggle
    const systemPRM = PRM;
    let simPRM = systemPRM;

    function draw() {
      const card = vp.querySelector('#cbk-rm-card');
      if (!card) return;
      card.innerHTML = `<div style="display:flex;gap:24px;align-items:center;margin-bottom:12px;">
    ${spinnerHTML(!simPRM)}
    <div>
      <p style="margin:0 0 6px;font-size:13px;">Notifications</p>
      ${badgeHTML(!simPRM)}
    </div>
  </div>
  <p style="font-size:11px;color:var(--casebook-ink-faint);">${simPRM ? '✓ Animations suppressed — static fallbacks shown.' : 'Animations active — OS reduce-motion not set.'}</p>`;
    }

    vp.innerHTML = `
<style>
@keyframes cbk-spin{to{transform:rotate(360deg)}}
@keyframes cbk-bounce{to{transform:translateY(-6px)}}
</style>
<div style="padding:16px;">
  <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--casebook-ink-muted);margin-bottom:14px;cursor:pointer;">
    <input type="checkbox" id="cbk-prm-toggle" ${simPRM ? 'checked' : ''} style="width:16px;height:16px;">
    Simulate <code style="font-size:11px;background:var(--casebook-surface-2);padding:1px 4px;border-radius:3px;">prefers-reduced-motion: reduce</code>
  </label>
  <div id="cbk-rm-card"></div>
</div>`;

    draw();
    vp.querySelector('#cbk-prm-toggle').addEventListener('change', e => {
      simPRM = e.target.checked;
      draw();
    });
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
