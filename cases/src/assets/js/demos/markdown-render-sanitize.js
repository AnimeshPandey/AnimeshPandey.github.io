/**
 * demos/markdown-render-sanitize.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": renders a fixed "model markdown reply" sample that
 * contains a hidden <img onload> payload (a stand-in for a customer's
 * pasted content the model faithfully quoted back). A tiny markdown-lite
 * converter turns it into HTML, preserving raw HTML in the source exactly
 * like real markdown parsers (marked/markdown-it) do by default — this
 * demo does not use a real markdown library, only a minimal converter
 * covering the sample text's own formatting, so the vulnerability is real
 * and observable. The image itself is a valid, tiny, always-succeeding
 * 1x1 transparent GIF data URI wired to `onload` rather than a broken
 * src wired to `onerror` (the more commonly cited real-world example,
 * mentioned in the case prose) — a valid image means the payload fires
 * with no failed network request and no browser-level console noise,
 * which matters for an automated no-console-errors check, and is if
 * anything a more realistic/stealthier real-world variant since it
 * never surfaces as a failed request in the Network tab either.
 *
 * "Broken" mode sets the converted HTML via innerHTML with no sanitization
 * — the payload's onload handler genuinely fires inside the demo's own
 * viewport (safely contained: it only flips a warning banner within this
 * page, nothing leaves the viewport or touches real cookies/storage).
 *
 * "Fixed" mode runs the same HTML through a small sanitize() pass before
 * setting it — a simplified stand-in for what a real library like
 * DOMPurify does (strip <script>/<style> tags, remove every on* attribute
 * and javascript:-scheme URL). The case's fe-depth chapter is explicit
 * that production code should ship the real, maintained library rather
 * than this simplified version — see index.njk.
 */
import { wireToggleDemo } from './_demo-utils.js';

const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const MODEL_REPLY = [
  'Thanks for the details! Quoting your original message for context:',
  '',
  `> Hi team, still no update on my order.<img src="${TRANSPARENT_GIF}" onload="window.__cbkMrsPayloadRan()"> Please advise.`,
  '',
  "**Next step:** we'll follow up within 24 hours.",
].join('\n');

/** Minimal markdown-lite converter: paragraphs, **bold**, and > blockquotes
 *  — passes any raw HTML already in the source straight through unchanged,
 *  matching real markdown parsers' default (documented) behavior. */
function markdownLiteToHtml(md) {
  const blocks = md.split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    if (lines.every((l) => l.startsWith('>'))) {
      const inner = lines.map((l) => l.replace(/^>\s?/, '')).join('<br>');
      return `<blockquote>${inner}</blockquote>`;
    }
    return `<p>${block}</p>`;
  });
  return blocks.join('\n').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/** Simplified sanitizer — demonstrates the mechanism (strip execution
 *  vectors, keep formatting). Not a substitute for a real, maintained
 *  library in production — see the case's fe-depth chapter. */
function sanitize(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:') || value.startsWith('data:text/html')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

function shell() {
  return `
    <div id="cbk-mrs-banner" style="padding:8px 12px;border-radius:6px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);font-size:12.5px;margin-bottom:10px;">Waiting for render…</div>
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin-bottom:6px;">Raw "model reply" (markdown source):</div>
    <pre style="font-size:11px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;padding:8px 10px;overflow-x:auto;white-space:pre-wrap;margin-bottom:12px;">${MODEL_REPLY.replace(/</g, '&lt;')}</pre>
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin-bottom:6px;">Rendered output:</div>
    <div id="cbk-mrs-render" style="border:1px solid var(--casebook-border);border-radius:6px;padding:10px 12px;font-size:13px;min-height:70px;"></div>
  `;
}

function setup(vp, mode) {
  vp.innerHTML = shell();
  const banner = vp.querySelector('#cbk-mrs-banner');
  const renderTarget = vp.querySelector('#cbk-mrs-render');

  let ran = false;
  window.__cbkMrsPayloadRan = () => {
    ran = true;
    banner.textContent = '⚠️ Payload executed — the img onload handler ran real JavaScript inside this page.';
    banner.style.background = '#c0392b';
    banner.style.color = '#fff';
    banner.style.borderColor = '#c0392b';
  };

  const rawHtml = markdownLiteToHtml(MODEL_REPLY);

  if (mode === 'broken') {
    banner.textContent = 'Rendering with no sanitization (dangerouslySetInnerHTML-equivalent)…';
    // Same mechanism as React's dangerouslySetInnerHTML: the browser parses
    // and executes whatever HTML is handed to it, including the payload.
    renderTarget.innerHTML = rawHtml;
    // onload fires once the (valid, always-succeeding) image finishes loading.
    if (!ran) {
      banner.textContent = 'Rendered — no script executed this pass (browser timing can vary); reset and try again.';
    }
  } else {
    banner.textContent = 'Sanitizing before render…';
    const safeHtml = sanitize(rawHtml);
    renderTarget.innerHTML = safeHtml;
    banner.textContent = '✓ Sanitized — the img/onload payload was stripped before this HTML ever reached the DOM. Formatting (bold, blockquote) is intact.';
    banner.style.background = 'var(--casebook-surface-2)';
    banner.style.color = 'var(--casebook-ink)';
    banner.style.borderColor = 'var(--casebook-border)';
  }
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setup(vp, 'broken'),
    renderFixed: (vp) => setup(vp, 'fixed'),
  });
}
