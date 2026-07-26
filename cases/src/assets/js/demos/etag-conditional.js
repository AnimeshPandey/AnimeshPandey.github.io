/**
 * demos/etag-conditional.js
 * Export: initDemo(root)
 * Broken: every simulated poll sends a plain GET and gets a full body back,
 *         regardless of whether the underlying data changed.
 * Fixed:  after the first poll, every request sends If-None-Match with the
 *         last-seen ETag; the simulated server replies 304 with a 0-byte
 *         body whenever the data version hasn't advanced.
 * The "server" here is simulated client-side (no real network — this
 * project has no backend to poll), but the request/response cycle and the
 * byte-transfer accounting it drives are modeled on the real HTTP protocol.
 */

const BODY_SIZE = 2400; // bytes — simulated JSON payload size

function setup(vp, conditional) {
  let etag = null;
  let pollCount = 0;
  let totalBytes = 0;
  let dataVersion = 0;

  vp.innerHTML = `
    <div style="padding:6px 4px;">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
        <button id="cbk-etag-poll" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">
          Poll /api/summary
        </button>
        <span id="cbk-etag-total" style="font-size:11.5px;color:var(--casebook-ink-faint);">Total transferred: 0 B across 0 polls</span>
      </div>
      <div id="cbk-etag-log" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.6;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;padding:10px;max-height:180px;overflow-y:auto;white-space:pre-wrap;"></div>
    </div>`;

  const btn = vp.querySelector('#cbk-etag-poll');
  const log = vp.querySelector('#cbk-etag-log');
  const totalEl = vp.querySelector('#cbk-etag-total');
  if (!btn || !log) return;

  function line(text) {
    const p = document.createElement('div');
    p.textContent = text;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }

  btn.addEventListener('click', () => {
    pollCount++;
    // Simulated backend: the underlying data actually changes every 4th poll.
    if (pollCount === 1 || pollCount % 4 === 0) dataVersion++;
    const currentEtag = 'W/"v' + dataVersion + '"';

    if (!conditional) {
      line(`GET /api/summary`);
      line(`  → 200 OK — ${BODY_SIZE} B body`);
      totalBytes += BODY_SIZE;
    } else if (etag && etag === currentEtag) {
      line(`GET /api/summary`);
      line(`  If-None-Match: ${etag}`);
      line(`  → 304 Not Modified — 0 B body`);
    } else {
      line(`GET /api/summary${etag ? `\n  If-None-Match: ${etag}` : ''}`);
      line(`  → 200 OK — ETag: ${currentEtag} — ${BODY_SIZE} B body`);
      totalBytes += BODY_SIZE;
    }
    etag = currentEtag;

    if (totalEl) {
      totalEl.textContent = `Total transferred: ${(totalBytes / 1000).toFixed(1)} KB across ${pollCount} poll${pollCount === 1 ? '' : 's'}`;
    }
  });
}

export function initDemo(root) {
  const viewport = root.querySelector('#demo-viewport, .case-demo__viewport');
  const stateLabel = root.querySelector('.case-demo__state-label');
  const brokenBtn = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn = root.querySelector('[data-demo-state="fixed"]');

  function render(state) {
    if (viewport) setup(viewport, state === 'fixed');
    if (stateLabel) {
      const lbl = state === 'broken' ? brokenBtn : fixedBtn;
      if (lbl) stateLabel.textContent = 'Showing: ' + lbl.textContent.trim();
    }
    if (brokenBtn) brokenBtn.setAttribute('aria-pressed', state === 'broken' ? 'true' : 'false');
    if (fixedBtn) fixedBtn.setAttribute('aria-pressed', state === 'fixed' ? 'true' : 'false');
  }

  if (brokenBtn) brokenBtn.addEventListener('click', () => render('broken'));
  if (fixedBtn) fixedBtn.addEventListener('click', () => render('fixed'));
  render('fixed');
}
