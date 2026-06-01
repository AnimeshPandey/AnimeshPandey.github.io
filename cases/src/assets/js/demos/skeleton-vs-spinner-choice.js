import { wireToggleDemo, makeSkeleton } from './_demo-utils.js';

const cards = () => `<div style="display:grid;gap:8px;">${[1, 2, 3].map(() => `<div style="padding:10px;border:1px solid var(--casebook-border);border-radius:8px;background:var(--casebook-surface);"><strong style="font-size:13px;">Product</strong><p style="margin:4px 0 0;font-size:12px;color:var(--casebook-ink-muted);">$24.00</p></div>`).join('')}</div>`;

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken(vp) {
      vp.innerHTML = `<div style="padding:16px;"><p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">Spinner while loading (1.2s)…</p><div id="cbk-vp" style="min-height:120px;display:flex;align-items:center;justify-content:center;"></div></div>`;
      const box = vp.querySelector('#cbk-vp');
      box.innerHTML = '<div style="width:28px;height:28px;border:3px solid var(--casebook-border);border-top-color:var(--casebook-accent);border-radius:50%;animation:cbk-spin .8s linear infinite;"></div><style>@keyframes cbk-spin{to{transform:rotate(360deg)}}</style>';
      setTimeout(() => { box.innerHTML = cards(); }, 1200);
    },
    renderFixed(vp) {
      vp.innerHTML = `<div style="padding:16px;"><p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">Skeleton shapes while loading (1.2s)…</p><div id="cbk-vp" style="min-height:120px;"></div></div>`;
      const box = vp.querySelector('#cbk-vp');
      box.innerHTML = makeSkeleton(3, ['100%', '90%', '80%']);
      setTimeout(() => { box.innerHTML = cards(); }, 1200);
    },
  });
}
