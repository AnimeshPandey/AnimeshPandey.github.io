/**
 * demos/error-boundary-recovery.js
 * Export: initDemo(root)
 *
 * Simulates a React error boundary wrapping a live-data widget, with and
 * without a working reset path. This is a vanilla-JS re-enactment of the
 * boundary's state machine (hasError + reset), not a real React runtime —
 * same approach as controlled-uncontrolled-inputs.js's reconciliation
 * simulation — so the demo can run standalone in this static site.
 */
import { wireToggleDemo } from './_demo-utils.js';

function widgetPanel(lastMount) {
  return `
    <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:12px;background:var(--casebook-surface-2);">
      <p style="font-size:12px;color:var(--casebook-ink-muted);margin:0 0 4px;">Live order feed</p>
      <p style="font-size:16px;font-weight:600;margin:0;">Last price: $128.40</p>
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:6px 0 0;">Mounted at ${lastMount}</p>
    </div>`;
}

function fallbackPanel({ withRetry, retryHandlerId }) {
  return `
    <div style="border:1px solid var(--casebook-critical, #b23b3b);border-radius:8px;padding:12px;background:rgba(178,59,59,0.08);">
      <p style="font-size:13px;font-weight:600;color:var(--casebook-critical, #b23b3b);margin:0 0 6px;">⚠ Something went wrong.</p>
      ${withRetry
        ? `<button id="${retryHandlerId}" style="padding:6px 12px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;">Try again</button>`
        : `<p style="font-size:12px;color:var(--casebook-ink-muted);margin:0;">No reset wired up — reload the page to see this widget again.</p>`}
    </div>`;
}

function renderBroken(vp) {
  // dataValid + crashed live only in this closure; once crashed is true,
  // nothing in this render path ever sets it back to false — mirrors a
  // boundary with hasError in state and no resetKeys/reset callback.
  let dataValid = true;
  let crashed = false;
  let stuckClicks = 0;

  function render() {
    vp.innerHTML = `
      <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0 0 10px;">No reset path — once caught, this stays caught.</p>
      ${crashed ? fallbackPanel({ withRetry: true, retryHandlerId: 'ebr-broken-retry' }) : widgetPanel(new Date().toLocaleTimeString())}
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        <button id="ebr-broken-crash" style="padding:6px 12px;background:var(--casebook-surface);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;">Push malformed update</button>
        <button id="ebr-broken-fix" style="padding:6px 12px;background:var(--casebook-surface);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;">Push valid update</button>
      </div>
      <p id="ebr-broken-note" style="font-size:11px;color:var(--casebook-ink-faint);margin-top:8px;min-height:14px;">${stuckClicks > 0 ? `Clicked Try again ${stuckClicks} time(s) — still stuck, nothing was wired to reset the boundary.` : ''}</p>
    `;
    vp.querySelector('#ebr-broken-crash').addEventListener('click', () => {
      dataValid = false;
      crashed = true; // boundary catches the render error, sets hasError
      render();
    });
    vp.querySelector('#ebr-broken-fix').addEventListener('click', () => {
      dataValid = true; // underlying condition is fine again...
      render(); // ...but crashed stays true regardless — no reset path reads dataValid
    });
    const retryBtn = vp.querySelector('#ebr-broken-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        stuckClicks += 1; // clickable, but not wired to clear hasError or remount
        render();
      });
    }
  }

  render();
}

function renderFixed(vp) {
  let dataValid = true;
  let crashed = false;

  function render() {
    vp.innerHTML = `
      <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0 0 10px;">Reset on retry — Try again attempts a genuine fresh mount.</p>
      ${crashed ? fallbackPanel({ withRetry: true, retryHandlerId: 'ebr-fixed-retry' }) : widgetPanel(new Date().toLocaleTimeString())}
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        <button id="ebr-fixed-crash" style="padding:6px 12px;background:var(--casebook-surface);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;">Push malformed update</button>
        <button id="ebr-fixed-fix" style="padding:6px 12px;background:var(--casebook-surface);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;">Push valid update</button>
      </div>
    `;
    vp.querySelector('#ebr-fixed-crash').addEventListener('click', () => {
      dataValid = false;
      crashed = true;
      render();
    });
    vp.querySelector('#ebr-fixed-fix').addEventListener('click', () => {
      dataValid = true;
      // Does NOT clear crashed by itself — matches real React: fixing the
      // upstream condition doesn't retroactively re-render a caught tree.
      render();
    });
    const retryBtn = vp.querySelector('#ebr-fixed-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        // resetErrorBoundary(): clear hasError and attempt a real re-render.
        crashed = false;
        if (!dataValid) {
          // Underlying cause is still active — the fresh attempt throws
          // again and gets re-caught. Correct behavior, not a bug.
          crashed = true;
        }
        render();
      });
    }
  }

  render();
}

export function initDemo(root) {
  wireToggleDemo(root, { renderBroken, renderFixed });
}
