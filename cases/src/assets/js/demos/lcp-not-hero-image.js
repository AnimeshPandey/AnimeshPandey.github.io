import { wireToggleDemo, PRM, simulateAsync } from './_demo-utils.js';

function badge(ms, color) {
  return `<span style="font-size:11px;background:${color};color:#fff;padding:2px 7px;border-radius:10px;font-weight:700;">LCP: ${ms}ms</span>`;
}

function timelineBar(label, color, widthPct, delay) {
  return `<div style="margin-bottom:6px;">
  <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--casebook-ink-faint);margin-bottom:2px;">
    <span>${label}</span><span>${delay}ms</span>
  </div>
  <div style="height:6px;background:var(--casebook-border);border-radius:3px;overflow:hidden;">
    <div style="height:100%;width:${widthPct}%;background:${color};border-radius:3px;"></div>
  </div>
</div>`;
}

export function initDemo(root) {
  function renderBroken(vp) {
    vp.innerHTML = `<div style="padding:14px 16px;">
<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
  ${badge(1400,'#e05')}
  <span style="font-size:11px;color:var(--casebook-ink-faint);">LCP = headline text, loaded last</span>
</div>
<p style="font-size:11px;font-weight:600;color:var(--casebook-ink-muted);margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em;">Load order</p>
${timelineBar('Hero image (large PNG)', 'var(--casebook-accent)', 55, 550)}
${timelineBar('Headline text (render-blocked)', '#e05', 95, 1400)}
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:10px 0 0;">Hero image loads first but headline is the actual LCP element.</p>
</div>`;
  }

  function renderFixed(vp) {
    vp.innerHTML = `<div style="padding:14px 16px;">
<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
  ${badge(120,'#0a5')}
  <span style="font-size:11px;color:var(--casebook-ink-faint);">LCP = headline text, prioritised</span>
</div>
<p style="font-size:11px;font-weight:600;color:var(--casebook-ink-muted);margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em;">Load order</p>
${timelineBar('Headline text (fetchpriority="high")', '#0a5', 12, 120)}
${timelineBar('Hero image (lazy, lower priority)', 'var(--casebook-accent)', 55, 550)}
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:10px 0 0;">Text rendered first: browser paints text before network-heavy images.</p>
</div>`;
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
