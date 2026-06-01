import { wireToggleDemo, PRM } from './_demo-utils.js';

export function initDemo(root) {
  let timers = [];
  function clear() { timers.forEach(clearTimeout); timers = []; }

  function renderBroken(vp) {
    clear();
    vp.innerHTML = `
<div style="padding:20px;">
  <p style="margin:0 0 10px;">Uploading report.pdf…</p>
  <div style="height:6px;background:var(--casebook-border);border-radius:3px;overflow:hidden;">
    <div id="cbk-bar" style="height:100%;background:var(--casebook-accent);border-radius:3px;width:0%;transition:${PRM ? 'none' : 'width 0.35s ease'};"></div>
  </div>
  <p id="cbk-pct" style="font-size:11px;color:var(--casebook-ink-faint);margin:5px 0 0;text-align:right;">0%</p>
</div>`;
    if (PRM) {
      const b = vp.querySelector('#cbk-bar'), p = vp.querySelector('#cbk-pct');
      if (b) b.style.width = '90%';
      if (p) p.textContent = '90% — stalled';
      return;
    }
    [[12,350],[35,750],[62,1150],[84,1550],[90,1900],[90,4000]].forEach(([pct, ms], i) => {
      const t = setTimeout(() => {
        const b = vp.querySelector('#cbk-bar'), p = vp.querySelector('#cbk-pct');
        if (!b) return;
        b.style.width = pct + '%';
        if (p) p.textContent = pct + '%' + (i >= 4 ? ' — stalled' : '');
      }, ms);
      timers.push(t);
    });
  }

  function renderFixed(vp) {
    clear();
    const anim = PRM ? '' : `<style>@keyframes cbk-id{0%{background-position:200% 0}100%{background-position:-200% 0}}</style>`;
    const barStyle = PRM
      ? 'width:100%;background:var(--casebook-border);'
      : 'width:100%;background:linear-gradient(90deg,var(--casebook-bg) 0%,var(--casebook-accent) 50%,var(--casebook-bg) 100%);background-size:200% 100%;animation:cbk-id 1.5s ease-in-out infinite;';
    vp.innerHTML = `${anim}
<div style="padding:20px;">
  <p style="margin:0 0 10px;">Uploading report.pdf…</p>
  <div style="height:6px;background:var(--casebook-border);border-radius:3px;overflow:hidden;">
    <div style="height:100%;border-radius:3px;${barStyle}"></div>
  </div>
  <p style="font-size:11px;color:var(--casebook-ink-faint);margin:5px 0 0;text-align:right;">Working — duration unknown</p>
</div>`;
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
