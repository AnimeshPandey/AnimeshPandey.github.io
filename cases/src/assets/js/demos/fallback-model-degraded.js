/**
 * demos/fallback-model-degraded.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": both modes call the same simulateSummarizeRequest(),
 * which always rejects (standing in for a rate-limited/erroring model API
 * — no real network call is made, this is a self-contained demo).
 *
 * "Broken" mode's handler has no catch — the click sets a "Summarizing…"
 * loading state and awaits the rejecting promise with nothing downstream
 * of it, so the loading state is genuinely terminal, exactly the real bug
 * (this demo intercepts the unhandled rejection only to keep the browser
 * console clean, it does not add any handling the real broken code lacks).
 *
 * "Fixed" mode catches the same rejection, shows a retryable error state,
 * retries up to MAX_RETRIES with a visible backoff delay, and falls back
 * to showing the raw notes once retries are exhausted.
 */
import { wireToggleDemo } from './_demo-utils.js';

const NOTES = "Q3 roadmap sync: ship the export flow by the 15th, defer SSO to Q4, Priya to follow up with design on the empty states.";
const MAX_RETRIES = 2;

function simulateSummarizeRequest() {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('429 Too Many Requests')), 700);
  });
}

function shell() {
  return `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">
      <button id="cbk-fmd-run" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">Summarize</button>
      <button id="cbk-fmd-reset" type="button" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">Reset</button>
    </div>
    <div id="cbk-fmd-panel" style="border:1px solid var(--casebook-border);border-radius:8px;padding:14px;min-height:120px;font-size:13px;"></div>
  `;
}

function renderIdle(panel) {
  panel.innerHTML = `<p style="color:var(--casebook-ink-faint);margin:0;">Click "Summarize" to request an AI summary of a sample meeting note.</p>`;
}

function renderLoading(panel, label) {
  panel.innerHTML = `<p style="margin:0;display:flex;align-items:center;gap:8px;">
    <span style="width:14px;height:14px;border:2px solid var(--casebook-border);border-top-color:var(--casebook-accent);border-radius:50%;display:inline-block;animation:cbk-fmd-spin 0.8s linear infinite;"></span>
    ${label}
  </p>
  <style>@keyframes cbk-fmd-spin{to{transform:rotate(360deg)}}</style>`;
}

function runBroken(panel, runBtn) {
  runBtn.disabled = true;
  renderLoading(panel, 'Summarizing…');
  // No catch: mirrors the real bug exactly. This demo swallows the
  // rejection only so it doesn't spam the real browser console — the UI
  // itself receives no handling whatsoever, matching production.
  simulateSummarizeRequest()
    .then(() => {
      panel.innerHTML = `<p style="margin:0;">✓ Summary ready.</p>`;
      runBtn.disabled = false;
    })
    .catch(() => {
      // Deliberately does nothing — this is the bug. The loading state
      // above is the last thing the user ever sees for this click.
    });
}

async function runFixed(panel, runBtn) {
  runBtn.disabled = true;
  let attempt = 0;
  let lastError = null;

  while (attempt <= MAX_RETRIES) {
    renderLoading(
      panel,
      attempt === 0 ? 'Summarizing…' : `Retrying (attempt ${attempt + 1} of ${MAX_RETRIES + 1})…`
    );
    try {
      await simulateSummarizeRequest();
      panel.innerHTML = `<p style="margin:0;">✓ Summary ready.</p>`;
      runBtn.disabled = false;
      return;
    } catch (err) {
      lastError = err;
      attempt += 1;
      if (attempt <= MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 400)); // visible backoff delay
      }
    }
  }

  panel.innerHTML = `
    <p style="margin:0 0 8px;color:#c0392b;">⚠️ Couldn't generate a summary (${lastError.message}). Retries exhausted.</p>
    <div style="border:1px dashed var(--casebook-border);border-radius:6px;padding:10px;margin-bottom:8px;">
      <div style="font-size:11px;color:var(--casebook-ink-faint);margin-bottom:4px;">Fallback — raw notes:</div>
      <div>${NOTES}</div>
    </div>
    <button id="cbk-fmd-retry" type="button" style="padding:6px 12px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;">Retry</button>
  `;
  runBtn.disabled = false;
  panel.querySelector('#cbk-fmd-retry').addEventListener('click', () => runFixed(panel, runBtn));
}

function setup(vp, mode) {
  vp.innerHTML = shell();
  const panel = vp.querySelector('#cbk-fmd-panel');
  const runBtn = vp.querySelector('#cbk-fmd-run');
  const resetBtn = vp.querySelector('#cbk-fmd-reset');

  renderIdle(panel);

  runBtn.addEventListener('click', () => {
    if (mode === 'broken') runBroken(panel, runBtn);
    else runFixed(panel, runBtn);
  });
  resetBtn.addEventListener('click', () => {
    runBtn.disabled = false;
    renderIdle(panel);
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setup(vp, 'broken'),
    renderFixed: (vp) => setup(vp, 'fixed'),
  });
}
