import { wireToggleDemo } from './_demo-utils.js';

const SUGGESTIONS = [
  { label: 'Categorize as "Billing question"', confidence: 0.97 },
  { label: 'Categorize as "Refund eligible"', confidence: 0.54 },
  { label: 'Categorize as "Feature request"', confidence: 0.89 },
  { label: 'Categorize as "Refund eligible"', confidence: 0.61 },
];
const THRESHOLD = 0.8;

function rowHTML(s, applied, reviewing) {
  const pct = Math.round(s.confidence * 100);
  let statusHTML;
  if (applied) {
    statusHTML = '<span style="color:var(--casebook-ok, #3f7a5c);">✓ Applied</span>';
  } else if (reviewing) {
    statusHTML = '<span style="color:var(--casebook-warn, #a8721f);">⏸ Needs review</span>';
  } else {
    statusHTML = '<span style="color:var(--casebook-critical, #b23b3b);">✓ Applied (unreviewed)</span>';
  }
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid var(--casebook-border);border-radius:6px;margin-bottom:6px;font-size:12px;">
    <span>${s.label} <span style="color:var(--casebook-ink-faint);">(confidence ${pct}%)</span></span>
    ${statusHTML}
  </div>`;
}

function renderBroken(vp) {
  vp.innerHTML = `
    <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0 0 10px;">Every suggestion applies immediately, regardless of confidence.</p>
    ${SUGGESTIONS.map((s) => rowHTML(s, false, false)).join('')}
  `;
}

function renderFixed(vp) {
  vp.innerHTML = `
    <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0 0 10px;">Only suggestions at or above ${Math.round(THRESHOLD * 100)}% confidence apply automatically.</p>
    ${SUGGESTIONS.map((s) => rowHTML(s, s.confidence >= THRESHOLD, s.confidence < THRESHOLD)).join('')}
  `;
}

export function initDemo(root) {
  wireToggleDemo(root, { renderBroken, renderFixed });
}
