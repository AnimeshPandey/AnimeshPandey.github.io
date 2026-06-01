import { wireToggleDemo } from './_demo-utils.js';

const TRACKS = ['All', 'Performance', 'Accessibility', 'React', 'CSS'];
const ITEMS = [
  { title: 'Skeleton screens', track: 'Performance' },
  { title: 'Font loading CLS', track: 'Performance' },
  { title: 'Focus visible',     track: 'Accessibility' },
  { title: 'Reduced motion',    track: 'Accessibility' },
  { title: 'Key prop identity', track: 'React' },
  { title: 'Hydration trees',   track: 'React' },
  { title: 'Z-index contexts',  track: 'CSS' },
  { title: 'Gestalt spacing',   track: 'CSS' },
];

export function initDemo(root) {
  function setup(vp, useURL) {
    let active = 'All';
    let history = ['All'];

    function urlBar() {
      if (!useURL) return '';
      const q = active === 'All' ? '' : `?track=${active.toLowerCase()}`;
      return `<div style="font-size:11px;color:var(--casebook-ink-faint);padding:5px 8px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:4px;margin-bottom:10px;font-family:monospace;">/cases/${q}</div>`;
    }

    function draw() {
      const filtered = active === 'All' ? ITEMS : ITEMS.filter(i => i.track === active);
      vp.querySelector('#cbk-url-bar').innerHTML = urlBar();
      vp.querySelector('#cbk-results').innerHTML = `<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 6px;">${filtered.length} case${filtered.length !== 1 ? 's' : ''}</p>
${filtered.map(i => `<div style="padding:6px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;margin-bottom:4px;">${i.title} <span style="font-size:10px;color:var(--casebook-ink-faint);">${i.track}</span></div>`).join('')}`;
      vp.querySelectorAll('.cbk-track-btn').forEach(b => {
        b.style.background = b.dataset.track === active ? 'var(--casebook-accent)' : 'var(--casebook-surface-2)';
        b.style.color      = b.dataset.track === active ? 'var(--casebook-bg)' : 'var(--casebook-ink-muted)';
      });
    }

    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">
  ${useURL ? '✓ Filter state in URL — refresh keeps your selection' : '✗ JS state only — refresh resets filter'}
</p>
<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">
  ${TRACKS.map(t => `<button class="cbk-track-btn" data-track="${t}" style="padding:5px 10px;border:1px solid var(--casebook-border);border-radius:6px;font-size:11px;cursor:pointer;min-height:32px;">${t}</button>`).join('')}
</div>
<div id="cbk-url-bar"></div>
<div style="display:flex;gap:6px;margin-bottom:8px;">
  <button id="cbk-refresh" style="padding:4px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:11px;cursor:pointer;color:var(--casebook-ink-faint);">↺ Refresh</button>
  <button id="cbk-back" style="padding:4px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:11px;cursor:pointer;color:var(--casebook-ink-faint);">← Back</button>
</div>
<div id="cbk-results"></div>
</div>`;

    draw();

    vp.querySelectorAll('.cbk-track-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        history.push(btn.dataset.track);
        active = btn.dataset.track;
        draw();
      });
    });

    vp.querySelector('#cbk-refresh').addEventListener('click', () => {
      if (!useURL) { active = 'All'; history = ['All']; }
      draw();
    });

    vp.querySelector('#cbk-back').addEventListener('click', () => {
      if (useURL && history.length > 1) {
        history.pop();
        active = history[history.length - 1];
        draw();
      }
    });
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
