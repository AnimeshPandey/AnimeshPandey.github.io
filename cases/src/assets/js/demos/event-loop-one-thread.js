import { wireToggleDemo, PRM, simulateAsync } from './_demo-utils.js';

export function initDemo(root) {
  function setup(vp, yielding) {
    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
  ${yielding ? '✓ Chunked with setTimeout — input stays responsive' : '✗ Synchronous loop — blocks main thread'}
</p>
<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
  <input id="cbk-el-input" type="text" placeholder="Type while task runs…"
    style="flex:1;min-width:120px;padding:7px 10px;border:1px solid var(--casebook-border);border-radius:6px;background:var(--casebook-surface);color:var(--casebook-ink);font-size:13px;">
  <button id="cbk-el-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;white-space:nowrap;">Run heavy task</button>
</div>
<div id="cbk-el-status" style="font-size:12px;color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:36px;">Idle — click "Run heavy task"</div>
</div>`;

    const CHUNKS = 40;
    const CHUNK_WORK = 5; // ms per chunk for synchronous sim

    vp.querySelector('#cbk-el-run').addEventListener('click', async () => {
      const status = vp.querySelector('#cbk-el-status');
      const btn = vp.querySelector('#cbk-el-run');
      btn.disabled = true;

      if (yielding) {
        for (let i = 0; i < CHUNKS; i++) {
          await simulateAsync(PRM ? 0 : 16); // yield per chunk
          if (status) status.textContent = `Chunk ${i + 1}/${CHUNKS} — thread free between chunks`;
        }
        if (status) status.textContent = '✓ Done — input was responsive throughout';
      } else {
        if (status) status.textContent = '⏳ Thread BLOCKED — try typing in the input…';
        // Synchronous busy work
        const end = Date.now() + (PRM ? 0 : 1800);
        while (Date.now() < end) { /* busy wait */ }
        if (status) status.textContent = '✗ Done — input was frozen for ~1.8s';
      }

      btn.disabled = false;
    });
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
