import { wireToggleDemo } from './_demo-utils.js';

function panel(label, radius, pad) {
  return `<div style="flex:1;padding:12px;border:1px dashed var(--casebook-border);border-radius:8px;">
<p style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--casebook-ink-faint);margin:0 0 8px;">${label}</p>
<button type="button" style="padding:${pad}px 14px;border-radius:${radius}px;border:1px solid var(--casebook-border);background:var(--casebook-surface);font-size:12px;cursor:pointer;">Action</button></div>`;
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken(vp) {
      vp.innerHTML = `<div style="padding:16px;display:flex;gap:10px;">${panel('MFE A (v1 tokens)', 4, 8)}${panel('MFE B (v3 tokens)', 12, 14)}</div>`;
    },
    renderFixed(vp) {
      vp.innerHTML = `<div style="padding:16px;display:flex;gap:10px;">${panel('MFE A (shared DS)', 8, 10)}${panel('MFE B (shared DS)', 8, 10)}</div>`;
    },
  });
}
