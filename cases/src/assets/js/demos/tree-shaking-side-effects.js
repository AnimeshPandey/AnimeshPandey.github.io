import { wireToggleDemo } from './_demo-utils.js';

const FILES = [
  { name: 'debounce.js', used: true, size: 1.2 },
  { name: 'throttle.js', used: false, size: 1.4 },
  { name: 'deepClone.js', used: false, size: 3.1 },
  { name: 'formatDate.js', used: false, size: 2.8 },
  { name: 'groupBy.js', used: false, size: 1.9 },
  { name: 'memoize.js', used: false, size: 2.2 },
  { name: '...34 more files', used: false, size: 68.4 },
];

function render(vp, sideEffectsFalse) {
  const kept = sideEffectsFalse ? FILES.filter(f => f.used) : FILES;
  const total = kept.reduce((sum, f) => sum + f.size, 0);
  const rows = kept
    .map(f => `<div style="display:flex;justify-content:space-between;padding:2px 0;${f.used ? 'color:var(--casebook-ink);' : 'color:var(--casebook-ink-faint);'}">
      <span>${f.used ? '✓' : '○'} ${f.name}${f.used ? ' (imported)' : ''}</span>
      <span>${f.size.toFixed(1)} KB</span>
    </div>`)
    .join('');

  vp.innerHTML = `
    <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      import { debounce } from 'utils-lib' — ${sideEffectsFalse ? 'package.json has "sideEffects": false' : 'package.json has no sideEffects field'}
    </p>
    <div style="font-size:12px;font-family:var(--casebook-mono, monospace);padding:10px 12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;">
      ${rows}
      <div style="border-top:1px solid var(--casebook-border);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:600;color:var(--casebook-ink);">
        <span>Bundled</span>
        <span>${total.toFixed(1)} KB</span>
      </div>
    </div>
  `;
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: vp => render(vp, false),
    renderFixed: vp => render(vp, true),
  });
}
