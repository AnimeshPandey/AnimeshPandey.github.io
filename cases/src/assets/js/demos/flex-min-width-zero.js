/**
 * demos/flex-min-width-zero.js
 * Export: initDemo(root, { demoType })
 * Broken: flex cards use the min-width: auto default — a long filename overflows the row.
 * Fixed:  min-width: 0 on the cards lets them shrink; the filename truncates with an ellipsis.
 */
import { wireToggleDemo } from '../demos/_demo-utils.js';

const LONG_FILENAME = 'quarterly-financial-report-2026-final-v3-reviewed.xlsx';

function cardStyle(minWidthZero) {
  return `
    flex: 1;
    ${minWidthZero ? 'min-width: 0;' : ''}
    border: 1px solid var(--casebook-border);
    border-radius: 8px;
    padding: 10px 12px;
    background: var(--casebook-bg);
    font-size: 12px;
  `;
}

function labelStyle(minWidthZero) {
  return minWidthZero
    ? 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;'
    : 'white-space: nowrap; display: block;';
}

function render(viewport, minWidthZero) {
  viewport.innerHTML = `
    <div style="border: 1px dashed var(--casebook-border-strong, var(--casebook-border)); border-radius: 8px; padding: 10px; overflow-x: auto;">
      <div style="display: flex; gap: 10px; ${minWidthZero ? '' : 'width: max-content;'}">
        <div style="${cardStyle(minWidthZero)}">
          <strong style="${labelStyle(minWidthZero)}">Card 1</strong>
          <span style="color:var(--casebook-ink-faint);">Short label</span>
        </div>
        <div style="${cardStyle(minWidthZero)}">
          <strong style="${labelStyle(minWidthZero)}">${LONG_FILENAME}</strong>
          <span style="color:var(--casebook-ink-faint);">Long, unbreakable content</span>
        </div>
        <div style="${cardStyle(minWidthZero)}">
          <strong style="${labelStyle(minWidthZero)}">Card 3</strong>
          <span style="color:var(--casebook-ink-faint);">Short label</span>
        </div>
      </div>
    </div>
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;">
      ${minWidthZero ? 'Row stays within its container — the filename truncates.' : 'Row overflows its container — scroll to see the full width.'}
    </p>
  `;
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken(viewport) { render(viewport, false); },
    renderFixed(viewport) { render(viewport, true); },
    defaultState: 'fixed',
  });
}
