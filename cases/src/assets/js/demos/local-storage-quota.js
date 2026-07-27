/**
 * demos/local-storage-quota.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": "Add draft entry" appends a small string to an array
 * written to a real, namespaced localStorage key (cleared on reset/unmount
 * so the demo never leaves data behind). To make the failure reachable in
 * a few clicks instead of megabytes, the quota check itself is a small
 * simulated threshold standing in for the browser's real ~5-10MB per-origin
 * cap — the surrounding read/write plumbing is real localStorage. In
 * "broken" mode, the write past the simulated quota throws and nothing
 * catches it (shown via a console-style log line, not a real uncaught
 * exception — this demo module itself never lets an error escape to the
 * real browser console). In "fixed" mode the same throw is caught, the
 * oldest entry is evicted to make room, and the write is retried.
 */
import { wireToggleDemo } from './_demo-utils.js';

const KEY = 'cbk-lsq-demo-entries';
const SIMULATED_QUOTA = 260; // characters — stands in for the real ~5-10MB per-origin cap
const ENTRY_TEXT = 'Draft note: "remember to follow up on the Q3 numbers..."';

function readEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function sizeOf(entries) {
  return JSON.stringify(entries).length;
}

/** Mimics localStorage.setItem's real contract: throws synchronously over quota. */
function writeEntries(entries) {
  if (sizeOf(entries) > SIMULATED_QUOTA) {
    throw new DOMException(
      "Failed to execute 'setItem' on 'Storage': Setting the value of 'notes-app:drafts' exceeded the quota.",
      'QuotaExceededError'
    );
  }
  localStorage.setItem(KEY, JSON.stringify(entries));
}

function shell() {
  return `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
      <button id="cbk-lsq-add" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">Add draft entry</button>
      <button id="cbk-lsq-reset" type="button" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">Reset</button>
    </div>
    <div id="cbk-lsq-bar-wrap" style="height:8px;border-radius:4px;background:var(--casebook-surface-2);overflow:hidden;margin-bottom:6px;">
      <div id="cbk-lsq-bar" style="height:100%;width:0%;background:var(--casebook-accent);transition:width .2s;"></div>
    </div>
    <div id="cbk-lsq-status" style="font-size:11.5px;color:var(--casebook-ink-faint);margin-bottom:10px;">0 entries · Draft saved ✓</div>
    <div id="cbk-lsq-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:90px;white-space:pre-line;">Click "Add draft entry" — this demo uses a small simulated quota (${SIMULATED_QUOTA} chars) so you can hit it in a few clicks.</div>
  `;
}

function setup(vp, mode) {
  vp.innerHTML = shell();
  localStorage.removeItem(KEY);
  let entries = [];
  let dead = false; // broken mode: once it crashes, autosave stops updating, matching the real bug

  const bar = vp.querySelector('#cbk-lsq-bar');
  const status = vp.querySelector('#cbk-lsq-status');
  const log = vp.querySelector('#cbk-lsq-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  function renderBar() {
    const pct = Math.min(100, Math.round((sizeOf(entries) / SIMULATED_QUOTA) * 100));
    bar.style.width = pct + '%';
    bar.style.background = pct >= 100 ? '#c0392b' : 'var(--casebook-accent)';
  }

  function addBroken() {
    if (dead) {
      push('(autosave already crashed — clicks no longer save anything, exactly like production)');
      return;
    }
    const next = [...entries, ENTRY_TEXT + ' #' + (entries.length + 1)];
    try {
      writeEntries(next); // real localStorage.setItem underneath, once under quota
      entries = next;
      renderBar();
      status.textContent = entries.length + ' entries · Draft saved ✓';
      push('[setItem] wrote ' + entries.length + ' entries (' + sizeOf(entries) + '/' + SIMULATED_QUOTA + ' chars)');
    } catch (err) {
      // Nothing in the real broken code catches this — we intercept only to
      // keep it out of the actual browser console and show what an
      // uncaught exception would have looked like.
      dead = true;
      renderBar();
      status.textContent = entries.length + ' entries · (autosave silently stopped — no error shown to the user)';
      push('Uncaught ' + err.name + ': ' + err.message);
      push('RESULT: ✗ the handler threw before it could update the "Draft saved" UI — every click after this does nothing, silently.');
    }
  }

  function addFixed() {
    const next = [...entries, ENTRY_TEXT + ' #' + (entries.length + 1)];
    try {
      writeEntries(next);
      entries = next;
      renderBar();
      status.textContent = entries.length + ' entries · Draft saved ✓';
      push('[setItem] wrote ' + entries.length + ' entries (' + sizeOf(entries) + '/' + SIMULATED_QUOTA + ' chars)');
    } catch (err) {
      // Caught: evict the oldest entry and retry once.
      push('Caught ' + err.name + ': ' + err.message);
      const evicted = entries[0];
      const retry = [...entries.slice(1), ENTRY_TEXT + ' #' + (entries.length + 1)];
      try {
        writeEntries(retry);
        entries = retry;
        renderBar();
        status.textContent = entries.length + ' entries · Draft saved ✓ (evicted oldest entry to make room)';
        push('[evict] dropped oldest entry ("' + evicted.slice(0, 24) + '…"), retried — ' + sizeOf(entries) + '/' + SIMULATED_QUOTA + ' chars');
        push('RESULT: ✓ autosave kept working — the user never sees a failed save.');
      } catch (err2) {
        status.textContent = entries.length + ' entries · Draft saved ✓ (storage full even after eviction)';
        push('Still over quota after evicting one entry — falling back to in-memory for this write.');
      }
    }
  }

  vp.querySelector('#cbk-lsq-add').addEventListener('click', () => {
    mode === 'broken' ? addBroken() : addFixed();
  });
  vp.querySelector('#cbk-lsq-reset').addEventListener('click', () => {
    entries = [];
    dead = false;
    lines.length = 0;
    localStorage.removeItem(KEY);
    renderBar();
    status.textContent = '0 entries · Draft saved ✓';
    log.textContent = 'Click "Add draft entry" — this demo uses a small simulated quota (' + SIMULATED_QUOTA + ' chars) so you can hit it in a few clicks.';
  });

  renderBar();
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setup(vp, 'broken'),
    renderFixed: (vp) => setup(vp, 'fixed'),
  });
}
