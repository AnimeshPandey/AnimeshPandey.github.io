/**
 * demos/ai-widget-third-party.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": simulates (entirely client-side, no real network call)
 * what a third-party AI widget script can read from a mock page and send
 * to its own backend, comparing a direct <script> embed (full DOM/cookie
 * access) against a sandboxed iframe fed only an explicit field allowlist.
 */
import { wireToggleDemo } from './_demo-utils.js';

const MOCK_PAGE = {
  name: 'Jordan Lee',
  email: 'jordan.lee@example.com',
  plan: 'Enterprise — $48k ARR',
  note: 'Card declined 3x, possible fraud — escalate to risk team',
};
const MOCK_COOKIE = 'session_id=8f2c...a91; analytics_id=an-77213';

function shellMarkup(bannerText, bannerGood) {
  return `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      ${bannerGood ? '✓' : '✗'} ${bannerText}
    </div>
    <div style="border:1px solid var(--casebook-border);border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;background:var(--casebook-surface-2);">
      <strong>Mock page DOM</strong>
      <div style="margin-top:6px;line-height:1.5;">
        Name: ${MOCK_PAGE.name}<br>
        Email: ${MOCK_PAGE.email}<br>
        Plan: ${MOCK_PAGE.plan}<br>
        Internal note: <em>${MOCK_PAGE.note}</em>
      </div>
    </div>
    <button id="cbk-widget-load" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">Load AI widget</button>
    <button id="cbk-widget-reset" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;margin-left:8px;">Reset</button>
    <div id="cbk-widget-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:110px;white-space:pre-line;">Click "Load AI widget" to simulate the embed.</div>
  `;
}

function setupBroken(vp) {
  vp.innerHTML = shellMarkup('Widget script tag runs directly in the page', false);
  const log = vp.querySelector('#cbk-widget-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-widget-load').addEventListener('click', () => {
    lines.length = 0;
    push('[widget.js] loaded in page origin — has document.* access');
    push(`[widget.js] reading document.body.innerText…`);
    push(`  → captured: "${MOCK_PAGE.name}", "${MOCK_PAGE.email}", "${MOCK_PAGE.plan}"`);
    push(`  → captured: "${MOCK_PAGE.note}"`);
    push('[widget.js] reading document.cookie…');
    push(`  → ${MOCK_COOKIE}`);
    push('[widget.js] POST https://vendor-ai-widget.example.com/context');
    push('  body: { pageText: "...full DOM text...", cookies: "session_id=...; analytics_id=..." }');
  });
  vp.querySelector('#cbk-widget-reset').addEventListener('click', () => {
    lines.length = 0;
    log.textContent = 'Click "Load AI widget" to simulate the embed.';
  });
}

function setupFixed(vp) {
  vp.innerHTML = shellMarkup('Widget confined to a sandboxed iframe', true);
  const log = vp.querySelector('#cbk-widget-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-widget-load').addEventListener('click', () => {
    lines.length = 0;
    push('[host page] <iframe sandbox="allow-scripts" src="https://widget.vendor.com/embed.html">');
    push('[widget.js] running inside sandboxed frame — no allow-same-origin');
    push('  → document.cookie: "" (opaque origin, no cookies readable)');
    push('  → window.parent.document: blocked (cross-origin)');
    push(`[host page] postMessage({ firstName: "${MOCK_PAGE.name.split(' ')[0]}", plan: "Enterprise" }) → widget frame`);
    push('  (email, full name, and internal note deliberately not sent)');
    push('[widget.js] POST https://vendor-ai-widget.example.com/context');
    push('  body: { firstName: "Jordan", plan: "Enterprise" }');
  });
  vp.querySelector('#cbk-widget-reset').addEventListener('click', () => {
    lines.length = 0;
    log.textContent = 'Click "Load AI widget" to simulate the embed.';
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
