import { wireToggleDemo, PRM } from './_demo-utils.js';

function setup(vp, eager) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 12px;">
        ${eager
          ? '✓ Hero: loading="eager" fetchpriority="high" — starts immediately, scheduled first'
          : '✗ Hero: loading="lazy" — fetch waits for layout + intersection check'}
      </p>
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--casebook-ink-muted);margin-bottom:4px;">
          <span>Hero image (above the fold)</span>
          <span id="cbk-lcp-hero-time" style="font-weight:600;color:var(--casebook-ink);"></span>
        </div>
        <div style="position:relative;height:16px;background:var(--casebook-surface-2);border-radius:4px;overflow:hidden;">
          <div id="cbk-lcp-hero-bar" style="height:100%;width:0%;background:${eager ? 'var(--casebook-accent)' : '#B2555D'};"></div>
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;color:var(--casebook-ink-muted);margin-bottom:4px;">Below-fold images (still lazy either way)</div>
        <div style="position:relative;height:10px;background:var(--casebook-surface-2);border-radius:4px;overflow:hidden;">
          <div id="cbk-lcp-below-bar" style="height:100%;width:0%;background:var(--casebook-ink-faint);"></div>
        </div>
      </div>
      <p id="cbk-lcp-status" style="font-size:12px;color:var(--casebook-ink-muted);min-height:34px;margin:0 0 10px;">Ready.</p>
      <button id="cbk-lcp-run" style="padding:6px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:34px;">▶ Load page</button>
    </div>`;

  const heroBar = vp.querySelector('#cbk-lcp-hero-bar');
  const heroTime = vp.querySelector('#cbk-lcp-hero-time');
  const belowBar = vp.querySelector('#cbk-lcp-below-bar');
  const status = vp.querySelector('#cbk-lcp-status');
  const btn = vp.querySelector('#cbk-lcp-run');

  // Illustrative timings, not measured: lazy delays fetch start until after
  // layout + intersection check, and loses the network queue to eager
  // requests that started sooner.
  const HERO_START = eager ? 60 : 1150;
  const HERO_DURATION = eager ? 700 : 900;
  const BELOW_START = 1150;
  const BELOW_DURATION = 500;
  const timers = [];

  btn.addEventListener('click', () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    btn.disabled = true;
    heroBar.style.transition = 'none';
    heroBar.style.width = '0%';
    belowBar.style.transition = 'none';
    belowBar.style.width = '0%';
    heroTime.textContent = '';
    status.textContent = 'Page starts loading…';

    const scale = PRM ? 0 : 1;

    timers.push(setTimeout(() => {
      status.textContent = eager
        ? 'Hero request sent immediately, high priority.'
        : 'Waiting for layout + intersection check before the hero request starts…';
    }, 20 * scale));

    timers.push(setTimeout(() => {
      heroBar.style.transition = `width ${HERO_DURATION * scale}ms linear`;
      heroBar.style.width = '100%';
      if (!eager) status.textContent = 'Hero request finally starts, behind the queue.';
    }, HERO_START * scale));

    timers.push(setTimeout(() => {
      const lcpSeconds = ((HERO_START + HERO_DURATION) / 1000).toFixed(2);
      heroTime.textContent = lcpSeconds + 's — LCP';
      status.textContent = `LCP fires at ${lcpSeconds}s.`;
    }, (HERO_START + HERO_DURATION) * scale));

    timers.push(setTimeout(() => {
      belowBar.style.transition = `width ${BELOW_DURATION * scale}ms linear`;
      belowBar.style.width = '100%';
    }, BELOW_START * scale));

    const doneAt = Math.max(HERO_START + HERO_DURATION, BELOW_START + BELOW_DURATION) * scale + 100;
    timers.push(setTimeout(() => {
      btn.disabled = false;
    }, doneAt));
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setup(vp, false),
    renderFixed: (vp) => setup(vp, true),
  });
}
