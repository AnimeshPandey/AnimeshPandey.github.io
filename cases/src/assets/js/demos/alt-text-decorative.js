/**
 * demos/alt-text-decorative.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": simulates a screen reader's linear pass over a mini
 * page containing a decorative banner image and a data chart image,
 * comparing what actually gets announced when the banner has no alt
 * attribute and the chart is mistakenly marked alt="" (broken) against
 * the banner correctly marked alt="" and the chart given real descriptive
 * alt text (fixed).
 */
import { wireToggleDemo } from './_demo-utils.js';

function shell(bannerMarkup, chartMarkup) {
  return `
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;">
      <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:8px 10px;font-size:11.5px;background:var(--casebook-surface-2);">
        <strong>Banner:</strong> <code style="font-family:var(--casebook-mono, monospace);">${bannerMarkup}</code>
      </div>
      <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:8px 10px;font-size:11.5px;background:var(--casebook-surface-2);">
        <strong>Chart:</strong> <code style="font-family:var(--casebook-mono, monospace);">${chartMarkup}</code>
      </div>
    </div>
    <button id="cbk-alt-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Run screen reader pass</button>
    <button id="cbk-alt-reset" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;">Reset</button>
    <div id="cbk-alt-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:110px;white-space:pre-line;">Click "Run screen reader pass" to simulate the announcement.</div>
  `;
}

function setupBroken(vp) {
  vp.innerHTML = shell('&lt;img src="hero-banner-final-v3.jpg"&gt; (no alt attribute)', '&lt;img src="q3-revenue.png" alt=""&gt;');
  const log = vp.querySelector('#cbk-alt-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-alt-run').addEventListener('click', () => {
    lines.length = 0;
    push('[screen reader] entering page, reading top to bottom…');
    push('[banner] no alt attribute — falling back to filename');
    push('  announced: "Image, hero-banner-final-v3 dot j p g"');
    push('[chart] alt="" — marked as decorative, skipping');
    push('  announced: (nothing)');
    push('RESULT: ✗ decorative graphic announced as noise, real chart data never reaches the user');
  });
  vp.querySelector('#cbk-alt-reset').addEventListener('click', () => {
    lines.length = 0;
    log.textContent = 'Click "Run screen reader pass" to simulate the announcement.';
  });
}

function setupFixed(vp) {
  vp.innerHTML = shell('&lt;img src="hero-banner-final-v3.jpg" alt=""&gt;', '&lt;img src="q3-revenue.png" alt="Bar chart: Q3 revenue grew 18% year over year, driven by enterprise plan upgrades"&gt;');
  const log = vp.querySelector('#cbk-alt-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-alt-run').addEventListener('click', () => {
    lines.length = 0;
    push('[screen reader] entering page, reading top to bottom…');
    push('[banner] alt="" — marked as decorative, skipping');
    push('  announced: (nothing)');
    push('[chart] alt="Bar chart: Q3 revenue grew 18%…" — real content');
    push('  announced: "Bar chart. Q3 revenue grew 18% year over year, driven by enterprise plan upgrades."');
    push('RESULT: ✓ decorative noise silenced, real chart data reaches the user');
  });
  vp.querySelector('#cbk-alt-reset').addEventListener('click', () => {
    lines.length = 0;
    log.textContent = 'Click "Run screen reader pass" to simulate the announcement.';
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
