import { wireToggleDemo } from './_demo-utils.js';

function row(overflowHidden) {
  const items = Array.from({ length: 8 }, (_, i) => `<div style="flex:0 0 120px;height:64px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;">Card ${i + 1}</div>`).join('');
  return `<div style="overflow-x:${overflowHidden ? 'hidden' : 'auto'};display:flex;gap:8px;padding:4px;border:1px solid var(--casebook-border);border-radius:8px;-webkit-overflow-scrolling:touch;">${items}</div>`;
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken(vp) {
      vp.innerHTML = `<div style="padding:16px;"><p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">1px overflow triggers page-level horizontal scroll.</p>${row(false)}<p style="font-size:11px;margin-top:8px;color:#b71c1c;">Try scrolling the page sideways.</p></div>`;
    },
    renderFixed(vp) {
      vp.innerHTML = `<div style="padding:16px;"><p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;"><code>overflow-x: hidden</code> on carousel container — scroll contained.</p>${row(true)}</div>`;
    },
  });
}
