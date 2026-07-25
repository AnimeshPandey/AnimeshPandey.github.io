/**
 * demos/csv-export-main-thread.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": runs a REAL CPU-bound CSV-row-building workload, timed
 * to run for a fixed budget of wall-clock time, either directly on the main
 * thread or inside an actual Web Worker (constructed from an inline Blob
 * URL so this demo needs no separate worker file). A heartbeat counter
 * outside the toggled render, driven by its own setInterval, proves
 * whether the main thread stayed responsive during the export.
 */
import { wireToggleDemo, PRM } from './_demo-utils.js';

const BUDGET_MS = 1100;
const HEARTBEAT_MS = 100;

// Same busy-work shape run on whichever thread is under test: build fake
// CSV row strings in a batch loop, checking elapsed time between batches.
function runCsvWork(budgetMs, onProgress) {
  const start = performance.now();
  let rows = 0;
  let lastReport = start;
  while (performance.now() - start < budgetMs) {
    for (let i = 0; i < 3000; i++) {
      // eslint-disable-next-line no-unused-vars
      const line = rows + ',row-' + rows + ',' + (rows * 1.37).toFixed(2);
      rows++;
    }
    const now = performance.now();
    if (onProgress && now - lastReport > 120) {
      onProgress(rows, now - start);
      lastReport = now;
    }
  }
  return { rows, elapsed: performance.now() - start };
}

const WORKER_SRC = `
self.onmessage = function (e) {
  const budgetMs = e.data.budgetMs;
  const start = performance.now();
  let rows = 0;
  let lastReport = start;
  while (performance.now() - start < budgetMs) {
    for (let i = 0; i < 3000; i++) {
      const line = rows + ',row-' + rows + ',' + (rows * 1.37).toFixed(2);
      rows++;
    }
    const now = performance.now();
    if (now - lastReport > 120) {
      self.postMessage({ type: 'progress', rows, elapsed: now - start });
      lastReport = now;
    }
  }
  self.postMessage({ type: 'done', rows, elapsed: performance.now() - start });
};
`;

function heartbeatMarkup() {
  return `<span id="cbk-heartbeat-dot" aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--casebook-accent);margin-right:6px;"></span>Main thread heartbeat: <strong id="cbk-heartbeat-count">0</strong> <span style="color:var(--casebook-ink-faint);">(ticks ~10x/sec while the main thread is free)</span>`;
}

function setupBroken(vp) {
  vp.innerHTML = `
    <div style="font-size:12px;margin:0 0 10px;">${heartbeatMarkup()}</div>
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ Building the CSV synchronously on the main thread</div>
    <button id="cbk-csv-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Export rows to CSV</button>
    <div id="cbk-csv-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:90px;white-space:pre-line;">Click "Export rows to CSV" — watch the heartbeat above while it runs.</div>
  `;
  const log = vp.querySelector('#cbk-csv-log');
  const btn = vp.querySelector('#cbk-csv-run');
  const countEl = () => vp.querySelector('#cbk-heartbeat-count');

  btn.addEventListener('click', () => {
    btn.disabled = true;
    const heartbeatBefore = Number(countEl()?.textContent || 0);
    log.textContent = 'Running synchronously on the main thread...';
    // Yield one frame so the "running" message can paint before we block.
    requestAnimationFrame(() => {
      const { rows, elapsed } = runCsvWork(BUDGET_MS);
      const heartbeatAfter = Number(countEl()?.textContent || 0);
      const ticks = heartbeatAfter - heartbeatBefore;
      const expected = Math.round(elapsed / HEARTBEAT_MS);
      log.textContent =
        `Built ${rows.toLocaleString()} CSV rows in ${Math.round(elapsed)}ms.\n` +
        `Heartbeat ticks during export: ${ticks} (expected ~${expected} if the main thread were free).\n` +
        (ticks === 0 ? 'The main thread was fully blocked — nothing else could run.' : '');
      btn.disabled = false;
    });
  });
}

function setupFixed(vp) {
  vp.innerHTML = `
    <div style="font-size:12px;margin:0 0 10px;">${heartbeatMarkup()}</div>
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Building the CSV inside a Web Worker</div>
    <button id="cbk-csv-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Export rows to CSV</button>
    <button id="cbk-csv-cancel" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;" disabled>Cancel export</button>
    <div id="cbk-csv-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:90px;white-space:pre-line;">Click "Export rows to CSV" — watch the heartbeat above while it runs.</div>
  `;
  const log = vp.querySelector('#cbk-csv-log');
  const runBtn = vp.querySelector('#cbk-csv-run');
  const cancelBtn = vp.querySelector('#cbk-csv-cancel');
  const countEl = () => vp.querySelector('#cbk-heartbeat-count');
  let worker = null;
  let blobUrl = null;

  function cleanup() {
    if (worker) { worker.terminate(); worker = null; }
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    runBtn.disabled = false;
    cancelBtn.disabled = true;
  }

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    cancelBtn.disabled = false;
    const heartbeatBefore = Number(countEl()?.textContent || 0);
    log.textContent = '[worker] started...';

    const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
    blobUrl = URL.createObjectURL(blob);
    worker = new Worker(blobUrl);

    worker.onmessage = (e) => {
      const { type, rows, elapsed } = e.data;
      if (type === 'progress') {
        log.textContent = `[worker] processing… ${rows.toLocaleString()} rows so far (${Math.round(elapsed)}ms elapsed)`;
      } else if (type === 'done') {
        const heartbeatAfter = Number(countEl()?.textContent || 0);
        const ticks = heartbeatAfter - heartbeatBefore;
        const expected = Math.round(elapsed / HEARTBEAT_MS);
        log.textContent =
          `[worker] done — ${rows.toLocaleString()} CSV rows in ${Math.round(elapsed)}ms.\n` +
          `Heartbeat ticks during export: ${ticks} (expected ~${expected}).\n` +
          (ticks > 0 ? 'The main thread stayed responsive the whole time.' : '');
        cleanup();
      }
    };
    worker.postMessage({ budgetMs: BUDGET_MS });
  });

  cancelBtn.addEventListener('click', () => {
    log.textContent += '\n[main] worker.terminate() called — export cancelled.';
    cleanup();
  });

  // Expose cleanup so switching away from this state stops any running worker.
  vp.__cbkCleanup = cleanup;
}

export function initDemo(root) {
  let heartbeatCount = 0;
  const timer = setInterval(() => {
    heartbeatCount++;
    const el = root.querySelector('#cbk-heartbeat-count');
    if (el) el.textContent = String(heartbeatCount);
    if (!PRM) {
      const dot = root.querySelector('#cbk-heartbeat-dot');
      if (dot) dot.style.opacity = heartbeatCount % 2 === 0 ? '1' : '0.35';
    }
  }, HEARTBEAT_MS);

  wireToggleDemo(root, {
    renderBroken: (vp) => {
      const prevCleanup = vp.__cbkCleanup;
      if (prevCleanup) prevCleanup();
      setupBroken(vp);
    },
    renderFixed: (vp) => {
      const prevCleanup = vp.__cbkCleanup;
      if (prevCleanup) prevCleanup();
      setupFixed(vp);
    },
  });

  // Best-effort: stop the heartbeat if the page/section is torn down.
  // (No explicit teardown hook exists in demo-loader.js today, so this
  // interval simply lives for the page's lifetime, matching every other
  // demo module's setInterval-based simulations in this codebase.)
  void timer;
}
