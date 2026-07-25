import { wireToggleDemo } from './_demo-utils.js';

// Simplified gzipped-KB breakdown of a real regression shape: a date-picker
// library's default import pulled in every locale instead of the two used.
const MODULES = [
  { name: 'date-picker-lib (all locales)', kb: 178, color: '#B2555D' },
  { name: 'chart-lib (one sparkline)', kb: 58, color: '#8A5A9C' },
  { name: 'react + react-dom', kb: 45, color: '#3F7A5C' },
  { name: 'app code', kb: 62, color: '#BF5A32' },
  { name: 'lodash-es (full import)', kb: 24, color: '#A8721F' },
  { name: 'other deps', kb: 13, color: '#5B7FA6' },
];
const TOTAL = MODULES.reduce((sum, m) => sum + m.kb, 0);

function renderBroken(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
        ✗ Raw gzipped size — no breakdown of what's inside
      </p>
      <div style="font-size:26px;font-weight:700;color:var(--casebook-ink);margin-bottom:4px;">
        main.js: ${TOTAL} KB <span style="font-size:13px;font-weight:400;color:var(--casebook-ink-faint);">gzipped</span>
      </div>
      <p style="font-size:12px;color:var(--casebook-ink-muted);margin:0 0 10px;">Up from 210 KB before the last merge (+170 KB).</p>
      <pre style="background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;padding:10px 12px;font-size:11px;line-height:1.6;color:var(--casebook-ink-muted);overflow-x:auto;margin:0 0 10px;">import './app';
import { DateRangePicker } from 'date-picker-lib';
import { Sparkline } from 'chart-lib';
import { debounce } from 'lodash-es';</pre>
      <p style="font-size:12px;color:var(--casebook-ink-muted);margin:0;">Which import added 170 KB? Nothing above tells you.</p>
    </div>`;
}

function renderFixed(vp) {
  const rows = MODULES.map((m) => {
    const pct = Math.round((m.kb / TOTAL) * 100);
    return `<button type="button" data-mod="${m.name}" style="flex-grow:${m.kb};flex-basis:0;min-width:34px;height:64px;border:1px solid var(--casebook-bg);background:${m.color};color:#fff;font-size:10px;padding:4px 6px;cursor:pointer;display:flex;align-items:flex-end;text-align:left;overflow:hidden;" aria-label="${m.name}, ${m.kb} KB, ${pct}% of bundle">${pct >= 10 ? pct + '%' : ''}</button>`;
  }).join('');

  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
        ✓ Treemap — box area = gzipped size. Click a box.
      </p>
      <div id="cbk-treemap" style="display:flex;gap:2px;margin-bottom:10px;border-radius:6px;overflow:hidden;">${rows}</div>
      <p id="cbk-treemap-readout" style="font-size:12px;color:var(--casebook-ink-muted);min-height:34px;margin:0;">main.js total: ${TOTAL} KB gzipped — click the largest box.</p>
    </div>`;

  const readout = vp.querySelector('#cbk-treemap-readout');
  vp.querySelectorAll('[data-mod]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mod = MODULES.find((m) => m.name === btn.dataset.mod);
      const pct = Math.round((mod.kb / TOTAL) * 100);
      readout.innerHTML = `<strong>${mod.name}</strong> — ${mod.kb} KB, ${pct}% of the bundle.${mod.kb === 178 ? ' This is the regression — the library bundled 200+ locales the app never uses.' : ''}`;
    });
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken,
    renderFixed,
  });
}
