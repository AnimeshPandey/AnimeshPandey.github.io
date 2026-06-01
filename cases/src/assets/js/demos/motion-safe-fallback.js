import { wireToggleDemo } from './_demo-utils.js';

const box = (animated) => `<div style="width:80px;height:80px;background:var(--casebook-accent);border-radius:8px;margin:12px 0;${animated ? 'animation:cbk-slide 1.2s ease infinite alternate;' : ''}"></div>
<style>@keyframes cbk-slide{from{transform:translateX(0)}to{transform:translateX(40px)}}</style>
<p style="font-size:11px;color:var(--casebook-ink-faint);">Toggle OS "Reduce motion" to compare.</p>`;

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken(vp) {
      vp.innerHTML = `<div style="padding:16px;"><p style="font-size:11px;margin:0 0 6px;">Animation always runs:</p>${box(true)}</div>`;
    },
    renderFixed(vp) {
      vp.innerHTML = `<div style="padding:16px;"><p style="font-size:11px;margin:0 0 6px;">Wrapped in <code>@media (prefers-reduced-motion: no-preference)</code> — static when PRM on.</p>
<style>@media (prefers-reduced-motion: no-preference){@keyframes cbk-slide{from{transform:translateX(0)}to{transform:translateX(40px)}}.cbk-anim{animation:cbk-slide 1.2s ease infinite alternate;}}</style>
<div class="cbk-anim" style="width:80px;height:80px;background:var(--casebook-accent);border-radius:8px;margin:12px 0;"></div>
<p style="font-size:11px;color:var(--casebook-ink-faint);">With Reduce Motion: no slide.</p></div>`;
    },
  });
}
