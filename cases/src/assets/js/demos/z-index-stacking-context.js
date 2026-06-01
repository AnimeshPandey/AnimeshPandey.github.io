import { wireToggleDemo } from './_demo-utils.js';

export function initDemo(root) {
  function renderBroken(vp) {
    vp.innerHTML = `
<style>
.cbk-zi-scene{position:relative;height:160px;padding:16px;display:flex;gap:16px;align-items:flex-start;}
.cbk-zi-card{flex:1;padding:12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:8px;font-size:12px;position:relative;}
.cbk-zi-card--transform{transform:translateZ(0);}
.cbk-zi-card--sibling{background:var(--casebook-surface);z-index:1;}
.cbk-zi-tooltip{position:absolute;top:8px;right:-8px;background:var(--casebook-accent);color:var(--casebook-bg);font-size:11px;padding:4px 8px;border-radius:4px;white-space:nowrap;z-index:9999;}
</style>
<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">Tooltip has z-index:9999 but is trapped inside a <code style="font-size:10px;">transform</code> parent.</p>
<div class="cbk-zi-scene">
  <div class="cbk-zi-card cbk-zi-card--transform">
    <strong>Card A</strong><br><span style="font-size:10px;color:var(--casebook-ink-faint);">transform: translateZ(0)</span>
    <div class="cbk-zi-tooltip">Tooltip z-index:9999 ↑</div>
  </div>
  <div class="cbk-zi-card cbk-zi-card--sibling">
    <strong>Card B</strong><br><span style="font-size:10px;color:var(--casebook-ink-faint);">z-index: 1</span>
  </div>
</div>
<p style="font-size:11px;color:var(--casebook-accent);margin:6px 16px 0;">Tooltip disappears behind Card B — z-index can't escape the stacking context created by transform.</p>
</div>`;
  }

  function renderFixed(vp) {
    vp.innerHTML = `
<style>
.cbk-zi-scene2{position:relative;height:160px;padding:16px;display:flex;gap:16px;align-items:flex-start;}
.cbk-zi-card2{flex:1;padding:12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:8px;font-size:12px;position:relative;}
.cbk-zi-portal{position:absolute;top:26px;left:30px;background:var(--casebook-accent);color:var(--casebook-bg);font-size:11px;padding:4px 8px;border-radius:4px;white-space:nowrap;z-index:10;}
</style>
<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">Tooltip rendered at root level (portal) — no stacking context traps it.</p>
<div class="cbk-zi-scene2" style="position:relative;">
  <div class="cbk-zi-card2">
    <strong>Card A</strong><br><span style="font-size:10px;color:var(--casebook-ink-faint);">no transform</span>
  </div>
  <div class="cbk-zi-card2">
    <strong>Card B</strong>
  </div>
  <div class="cbk-zi-portal">Tooltip z-index:10 — appears above both cards ↗</div>
</div>
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:6px 16px 0;">Fix: remove transform, or use <code style="font-size:10px;">isolation: isolate</code>, or portal the tooltip to document.body.</p>
</div>`;
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
