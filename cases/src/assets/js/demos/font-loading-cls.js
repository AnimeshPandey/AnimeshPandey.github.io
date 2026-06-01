import { wireToggleDemo, PRM, simulateAsync } from './_demo-utils.js';

const COPY = 'The quick brown fox jumps over the lazy dog. This headline demonstrates font-induced layout shift.';

function badge(cls, label) {
  const color = cls === 'high' ? '#e05' : 'var(--casebook-accent)';
  return `<span style="font-size:11px;background:${color};color:#fff;padding:2px 7px;border-radius:10px;font-weight:700;">${label}</span>`;
}

function renderScene(vp, shifted, prm) {
  vp.innerHTML = `<div id="cbk-font-scene" style="padding:14px 16px;">
  <div id="cbk-metrics" style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
    ${shifted ? badge('high','CLS: 0.18') : badge('low','CLS: 0.01')}
    <span style="font-size:11px;color:var(--casebook-ink-faint);">
      ${shifted ? 'Fallback → web font swap caused shift' : 'Metric-matched fallback — no shift'}
    </span>
  </div>
  <div id="cbk-font-box" style="border:1px solid var(--casebook-border);border-radius:8px;padding:12px;background:var(--casebook-surface-2);">
    <h3 id="cbk-headline" style="margin:0 0 6px;font-size:17px;line-height:1.3;font-family:${shifted ? 'Georgia,serif' : 'system-ui,sans-serif'};">${COPY.split('.')[0]}.</h3>
    <p style="margin:0;font-size:13px;color:var(--casebook-ink-faint);">Body text unaffected — only display fonts cause CLS.</p>
  </div>
  <button id="cbk-reload-font" style="margin-top:10px;padding:6px 14px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;color:var(--casebook-ink-muted);min-height:36px;">↺ Simulate font load</button>
</div>`;
  setupReplay(vp, shifted, prm);
}

function setupReplay(vp, broken, prm) {
  const btn = vp.querySelector('#cbk-reload-font');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const h = vp.querySelector('#cbk-headline');
    const m = vp.querySelector('#cbk-metrics');
    if (!h) return;
    btn.disabled = true;
    if (broken) {
      h.style.fontFamily = 'Arial,sans-serif';
      h.style.fontSize = '17px';
      await simulateAsync(prm ? 0 : 700);
      // Simulate shift: different metrics
      h.style.fontFamily = 'Georgia,serif';
      h.style.fontSize = '18.5px';
      h.style.letterSpacing = '-0.02em';
      if (m) m.innerHTML = badge('high','CLS: 0.18') + `<span style="font-size:11px;color:var(--casebook-ink-faint);"> ← layout shifted on swap</span>`;
    } else {
      h.style.fontFamily = 'system-ui,sans-serif';
      await simulateAsync(prm ? 0 : 700);
      // Metric-matched: same size, no visual shift
      h.style.fontFamily = 'system-ui,sans-serif';
      if (m) m.innerHTML = badge('low','CLS: 0.01') + `<span style="font-size:11px;color:var(--casebook-ink-faint);"> ← no shift</span>`;
    }
    btn.disabled = false;
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp, prm) => renderScene(vp, true, prm),
    renderFixed:  (vp, prm) => renderScene(vp, false, prm),
  });
}
