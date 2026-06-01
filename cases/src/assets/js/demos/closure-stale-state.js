import { wireToggleDemo } from './_demo-utils.js';

export function initDemo(root) {
  function setup(vp, useRef) {
    let stateRef = { count: 0 };  // mutable ref — always current
    let closureCount = 0;         // captured at handler creation — stale
    let log = [];

    function draw() {
      const disp = vp.querySelector('#cbk-count');
      const logEl = vp.querySelector('#cbk-log');
      if (disp) disp.textContent = useRef ? stateRef.count : closureCount;
      if (logEl) logEl.innerHTML = log.slice(0, 5).join('<br>');
    }

    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 12px;">
  ${useRef ? '✓ Functional update — always reads current count' : '✗ Stale closure — captures initial 0'}
</p>
<div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;">
  <div style="text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;color:var(--casebook-ink-faint);">Count</p>
    <p id="cbk-count" style="margin:0;font-size:32px;font-weight:700;color:var(--casebook-ink);">0</p>
  </div>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <button id="cbk-inc" style="padding:7px 16px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:13px;cursor:pointer;min-height:36px;">+1</button>
    <button id="cbk-reset" style="padding:5px 12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;color:var(--casebook-ink-muted);">Reset</button>
  </div>
</div>
<div id="cbk-log" style="font-size:11px;color:var(--casebook-ink-faint);max-height:80px;overflow-y:auto;"></div>
</div>`;

    // Wire buttons after initial render
    const capturedBase = 0;  // closure captures this

    vp.querySelector('#cbk-inc').addEventListener('click', () => {
      if (useRef) {
        stateRef.count += 1;
        log.unshift(`+1 → ${stateRef.count} (from ref: ${stateRef.count - 1} + 1)`);
      } else {
        // Stale closure: always adds 1 to the captured 0
        const next = capturedBase + 1;
        log.unshift(`+1 → ${next} (stale: 0 + 1 every time)`);
        closureCount = next;
      }
      draw();
    });

    vp.querySelector('#cbk-reset').addEventListener('click', () => {
      stateRef.count = 0;
      closureCount = 0;
      log = [];
      draw();
    });

    draw();
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
