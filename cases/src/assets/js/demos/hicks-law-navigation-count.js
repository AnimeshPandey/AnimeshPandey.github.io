import { wireToggleDemo } from './_demo-utils.js';

const ITEMS = ['Dashboard', 'Reports', 'Campaigns', 'Audience', 'Integrations', 'Templates', 'Settings', 'Help', 'Billing'];
const PRIMARY = ['Dashboard', 'Campaigns', 'Audience', 'Reports', 'Billing'];

function navHTML(items, grouped) {
  const style = 'padding:6px 10px;border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;background:var(--casebook-surface);color:var(--casebook-ink);min-height:36px;';
  if (!grouped) {
    return `<nav style="display:flex;flex-wrap:wrap;gap:6px;">${items.map((l) => `<button type="button" style="${style}">${l}</button>`).join('')}</nav>`;
  }
  return `<nav style="display:flex;flex-wrap:wrap;gap:6px;">${PRIMARY.map((l) => `<button type="button" style="${style}">${l}</button>`).join('')}<button type="button" style="${style}">⋯ More</button></nav>`;
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken(vp) {
      vp.innerHTML = `<div style="padding:16px;"><p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">9 flat items — find <strong>Billing</strong>.</p>${navHTML(ITEMS, false)}</div>`;
    },
    renderFixed(vp) {
      vp.innerHTML = `<div style="padding:16px;"><p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">5 primary + overflow — find <strong>Billing</strong> (in primary).</p>${navHTML(ITEMS, true)}</div>`;
    },
  });
}
