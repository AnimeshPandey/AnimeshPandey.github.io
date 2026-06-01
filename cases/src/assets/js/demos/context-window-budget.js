import { wireToggleDemo, PRM, simulateAsync } from './_demo-utils.js';

function meterHTML(used, total, label) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  const color = pct > 80 ? '#e05' : pct > 60 ? '#e07b39' : 'var(--casebook-accent)';
  return `<div style="margin-bottom:10px;">
  <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--casebook-ink-faint);margin-bottom:4px;">
    <span>${label}</span><span>${used.toLocaleString()} / ${total.toLocaleString()} tokens (${pct}%)</span>
  </div>
  <div style="height:8px;background:var(--casebook-border);border-radius:4px;overflow:hidden;">
    <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:${PRM ? 'none' : 'width 0.3s ease'};"></div>
  </div>
</div>`;
}

const MESSAGES = [
  { role: 'user',      text: 'Here is our entire 5MB codebase: [dump]…' },
  { role: 'assistant', text: 'I see the code. What should I do with it?' },
  { role: 'user',      text: 'Now here are all 200 previous support tickets…' },
  { role: 'assistant', text: 'That is a lot of context.' },
  { role: 'user',      text: 'And the full changelog since 2019…' },
];

export function initDemo(root) {
  function setup(vp, curated) {
    let msgCount = 0;
    let tokensUsed = curated ? 800 : 800;
    const TOTAL = 16000;

    function addMsg(msg, tokens) {
      msgCount++;
      const msgEl = vp.querySelector('#cbk-msgs');
      if (!msgEl) return;
      const div = document.createElement('div');
      div.style.cssText = `padding:6px 10px;border-radius:6px;font-size:12px;margin-bottom:4px;max-width:85%;${msg.role === 'user' ? 'align-self:flex-end;background:var(--casebook-accent);color:var(--casebook-bg);' : 'align-self:flex-start;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);color:var(--casebook-ink);'}`;
      div.textContent = msg.text;
      msgEl.appendChild(div);
      msgEl.scrollTop = msgEl.scrollHeight;

      tokensUsed += tokens;
      const meter = vp.querySelector('#cbk-meter');
      if (meter) meter.innerHTML = meterHTML(tokensUsed, TOTAL, 'Context window');

      if (tokensUsed > TOTAL * 0.95) {
        const warn = vp.querySelector('#cbk-warn');
        if (warn) { warn.style.display = 'block'; warn.textContent = '✗ Context limit exceeded — request will fail.'; }
      }
    }

    const tokenCosts = curated ? [200, 80, 200, 80, 200] : [4200, 80, 3800, 80, 5600];

    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">
  ${curated ? '✓ Curated context — targeted files only (~5% of codebase)' : '✗ File dump — entire codebase in context on every turn'}
</p>
<div id="cbk-meter">${meterHTML(tokensUsed, TOTAL, 'Context window')}</div>
<div id="cbk-msgs" style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto;margin-bottom:8px;"></div>
<div id="cbk-warn" style="display:none;font-size:11px;color:#e05;padding:6px 10px;background:color-mix(in srgb,#e05 8%,var(--casebook-surface-2));border:1px solid #e05;border-radius:6px;margin-bottom:8px;"></div>
<button id="cbk-add-msg" style="padding:6px 14px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:34px;color:var(--casebook-ink-muted);">Add next message</button>
</div>`;

    vp.querySelector('#cbk-add-msg').addEventListener('click', async () => {
      if (msgCount >= MESSAGES.length) return;
      const msg = MESSAGES[msgCount];
      addMsg(msg, tokenCosts[msgCount]);
    });
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
