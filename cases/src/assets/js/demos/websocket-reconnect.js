import { wireToggleDemo } from './_demo-utils.js';

function fmtTime(ms) {
  return (ms / 1000).toFixed(2) + 's';
}

function setup(vp, backoff) {
  vp.innerHTML = `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      ${backoff ? '✓ Exponential backoff + jitter' : '✗ Immediate retry, no delay'}
    </p>
    <button id="cbk-ws-disconnect" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Simulate disconnect</button>
    <button id="cbk-ws-reset" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;">Reset</button>
    <div id="cbk-ws-log" style="font-size:12px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:110px;white-space:pre-line;">Click "Simulate disconnect" a few times.</div>
  `;

  const log = vp.querySelector('#cbk-ws-log');
  const lines = [];
  let attempt = 0;
  let startedAt = null;
  let timer = null;

  function push(line) {
    lines.push(line);
    if (log) log.textContent = lines.slice(-8).join('\n');
  }

  function delayFor(n) {
    if (!backoff) return 0;
    const cap = 8000;
    const exp = Math.min(cap, 500 * Math.pow(2, n));
    return Math.random() * exp; // full jitter: uniform between 0 and the exponential cap
  }

  function scheduleReconnect() {
    attempt++;
    const delay = delayFor(attempt - 1);
    const elapsed = startedAt ? Date.now() - startedAt : 0;
    push(`t=${fmtTime(elapsed)}  attempt ${attempt} scheduled, waiting ${fmtTime(delay)}…`);
    clearTimeout(timer);
    timer = setTimeout(() => {
      const now = Date.now() - startedAt;
      push(`t=${fmtTime(now)}  attempt ${attempt} fired`);
    }, delay);
  }

  vp.querySelector('#cbk-ws-disconnect').addEventListener('click', () => {
    if (!startedAt) startedAt = Date.now();
    push('— disconnected —');
    scheduleReconnect();
  });

  vp.querySelector('#cbk-ws-reset').addEventListener('click', () => {
    clearTimeout(timer);
    attempt = 0;
    startedAt = null;
    lines.length = 0;
    if (log) log.textContent = 'Click "Simulate disconnect" a few times.';
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setup(vp, false),
    renderFixed: (vp) => setup(vp, true),
  });
}
