import { wireToggleDemo, PRM, simulateAsync } from './_demo-utils.js';

function stepRow(label, ms, color, done) {
  const barW = Math.min(100, Math.round((ms / 2000) * 100));
  return `<div style="margin-bottom:6px;opacity:${done ? '1' : '0.35'};">
  <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--casebook-ink-faint);margin-bottom:2px;">
    <span>${label}</span><span>${done ? ms + 'ms' : '—'}</span>
  </div>
  <div style="height:6px;background:var(--casebook-border);border-radius:3px;overflow:hidden;">
    <div style="height:100%;width:${done ? barW : 0}%;background:${color};border-radius:3px;transition:${PRM ? 'none' : 'width 0.3s ease'};"></div>
  </div>
</div>`;
}

export function initDemo(root) {
  function setup(vp, isStatic) {
    const STEPS_DYNAMIC = [
      { label: 'DNS lookup',     ms: 80,   color: '#5b8dd9' },
      { label: 'TCP handshake',  ms: 120,  color: '#5b8dd9' },
      { label: 'API fetch',      ms: 820,  color: '#e07b39' },
      { label: 'DB query',       ms: 380,  color: '#e07b39' },
      { label: 'HTML render',    ms: 160,  color: '#59b37a' },
    ];
    const STEPS_STATIC = [
      { label: 'CDN cache hit',  ms: 18,  color: '#59b37a' },
      { label: 'HTML served',    ms: 45,  color: '#59b37a' },
      { label: 'API fetch',      ms: 0,   color: '#aaa', skipped: true },
      { label: 'DB query',       ms: 0,   color: '#aaa', skipped: true },
    ];

    const steps = isStatic ? STEPS_STATIC : STEPS_DYNAMIC;
    const totalMs = steps.filter(s => !s.skipped).reduce((a, b) => a + b.ms, 0);

    function drawSteps(done) {
      return `<div>${steps.map((s, i) => {
        if (s.skipped) return `<div style="margin-bottom:6px;opacity:0.35;font-size:11px;color:var(--casebook-ink-faint);display:flex;justify-content:space-between;"><span>↷ ${s.label}</span><span>skipped at build time</span></div>`;
        return stepRow(s.label, s.ms, s.color, done > i);
      }).join('')}</div>`;
    }

    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
  ${isStatic ? '✓ Static — pre-rendered at build; API/DB not on request path' : '✗ Server-rendered — full round-trip on every request'}
</p>
<div id="cbk-steps">${drawSteps(0)}</div>
<div style="display:flex;gap:12px;align-items:center;margin-top:10px;flex-wrap:wrap;">
  <button id="cbk-load" style="padding:6px 16px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:34px;">Load page</button>
  <span id="cbk-ttfb" style="font-size:12px;color:var(--casebook-ink-faint);"></span>
</div>
</div>`;

    let running = false;
    vp.querySelector('#cbk-load').addEventListener('click', async () => {
      if (running) return;
      running = true;
      const stepsEl = vp.querySelector('#cbk-steps');
      const ttfb = vp.querySelector('#cbk-ttfb');
      const btn = vp.querySelector('#cbk-load');
      btn.disabled = true;
      if (ttfb) ttfb.textContent = '';

      let cumulative = 0;
      for (let i = 0; i < steps.length; i++) {
        if (!steps[i].skipped) {
          await simulateAsync(PRM ? 0 : steps[i].ms * 0.6);
          cumulative += steps[i].ms;
        }
        if (stepsEl) stepsEl.innerHTML = drawSteps(i + 1);
      }

      if (ttfb) ttfb.textContent = `TTFB: ${totalMs}ms`;
      running = false;
      btn.disabled = false;
    });
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
