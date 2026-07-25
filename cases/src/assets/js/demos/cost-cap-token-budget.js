import { wireToggleDemo, PRM } from './_demo-utils.js';

function renderMeter(vp, capped) {
  const CAP = 2.0; // dollars
  const WARN = 1.4; // dollars — switch to cheaper model at this point
  let timer = null;

  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
        ${capped ? '✓ Live cost meter — downgrades model, then hard-stops at budget' : '✗ No cost signal — retry loop runs with nothing visible'}
      </p>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
        <span id="cbk-cost-val" style="font-size:22px;font-weight:700;color:var(--casebook-ink);">$0.00</span>
        ${capped ? '<span id="cbk-model-badge" style="font-size:11px;padding:3px 9px;border-radius:10px;background:var(--casebook-surface-2);color:var(--casebook-ink-muted);">gpt-4-class</span>' : ''}
      </div>
      ${capped ? '<div style="height:8px;border-radius:4px;background:var(--casebook-surface-2);overflow:hidden;margin-bottom:10px;"><div id="cbk-cost-bar" style="height:100%;width:0%;background:var(--casebook-accent);transition:width 150ms linear, background 200ms;"></div></div>' : ''}
      <p id="cbk-cost-status" style="font-size:12px;color:var(--casebook-ink-muted);min-height:36px;margin:0 0 10px;">Ready — agent about to retry a failing tool call.</p>
      <button id="cbk-cost-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">▶ Simulate session</button>
    </div>`;

  const valEl = vp.querySelector('#cbk-cost-val');
  const statusEl = vp.querySelector('#cbk-cost-status');
  const badgeEl = vp.querySelector('#cbk-model-badge');
  const barEl = vp.querySelector('#cbk-cost-bar');
  const btn = vp.querySelector('#cbk-cost-run');

  btn.addEventListener('click', () => {
    clearInterval(timer);
    btn.disabled = true;

    let cost = 0;
    let turn = 0;
    let downgraded = false;

    valEl.textContent = '$0.00';
    if (badgeEl) badgeEl.textContent = 'gpt-4-class';
    if (barEl) {
      barEl.style.width = '0%';
      barEl.style.background = 'var(--casebook-accent)';
    }
    statusEl.textContent = 'Agent retrying a failing tool call…';

    const tick = () => {
      turn++;
      // Each retry re-sends the growing failure history, so per-turn cost climbs.
      const perTurn = capped && downgraded ? 0.015 + turn * 0.001 : 0.03 + turn * 0.004;
      cost += perTurn;
      valEl.textContent = '$' + cost.toFixed(2);

      if (capped) {
        const pct = Math.min(100, (cost / CAP) * 100);
        barEl.style.width = pct + '%';

        if (!downgraded && cost >= WARN) {
          downgraded = true;
          badgeEl.textContent = 'cheaper-fallback';
          barEl.style.background = '#A8721F';
        }

        if (cost >= CAP) {
          barEl.style.background = '#B2555D';
          statusEl.textContent = `Session budget reached at retry ${turn} — further tool calls blocked. Start a new session to continue.`;
          clearInterval(timer);
          btn.disabled = false;
          return;
        }
        statusEl.textContent = `Retry ${turn} — tool call still failing, re-sent with growing context.`;
      } else {
        statusEl.textContent = turn >= 60
          ? `Retry ${turn} — still running, unnoticed. This kept going another 15+ minutes before anyone saw the bill.`
          : `Retry ${turn} — tool call still failing, re-sent with growing context. No signal anywhere that this is costing anything.`;
        if (turn >= 60) {
          clearInterval(timer);
          btn.disabled = false;
          return;
        }
      }
    };

    timer = setInterval(tick, PRM ? 0 : 90);
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => renderMeter(vp, false),
    renderFixed: (vp) => renderMeter(vp, true),
  });
}
