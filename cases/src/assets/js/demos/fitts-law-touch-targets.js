import { wireToggleDemo } from './_demo-utils.js';

const ACTIONS = ['Archive','Star','Reply','Forward','Delete'];

export function initDemo(root) {
  function makeRow(size, isFixed) {
    const pad = isFixed ? '0 12px' : '0 2px';
    const minH = isFixed ? '44px' : '20px';
    const btnStyle = `min-height:${minH};min-width:${isFixed ? '44' : '20'}px;padding:${pad};background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:${isFixed ? '6' : '3'}px;cursor:pointer;color:var(--casebook-ink-muted);font-size:${isFixed ? '13' : '11'}px;display:inline-flex;align-items:center;`;
    return `<div style="display:flex;gap:${isFixed ? '8' : '4'}px;align-items:center;flex-wrap:wrap;">
${ACTIONS.map(a => `<button style="${btnStyle}" title="${a}">${a}</button>`).join('')}
</div>`;
  }

  function renderBroken(vp) {
    vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 12px;">20px targets — try tapping precisely on mobile</p>
${makeRow('20px', false)}
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:12px 0 0;">WCAG 2.5.5 requires ≥44×44px. These fail.</p>
</div>`;
  }

  function renderFixed(vp) {
    vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 12px;">44px targets — comfortable tap area on any device</p>
${makeRow('44px', true)}
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:12px 0 0;">Same visual intent, much larger hit area via padding.</p>
</div>`;
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
