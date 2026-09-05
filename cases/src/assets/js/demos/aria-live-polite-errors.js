/**
 * demos/aria-live-polite-errors.js
 * Export: initDemo(root)
 *
 * A static demo can't literally run a screen reader, so this simulates
 * one: a "What a screen reader hears" transcript log next to the form,
 * driven by whether the error container is actually wired as a live
 * region. Broken mode renders an identical visual error but never logs
 * an announcement; fixed mode's error container is aria-live="polite"
 * from the start, and every error write also appends to the transcript.
 */
import { wireToggleDemo } from './_demo-utils.js';

function formMarkup({ errorId, liveAttrs }) {
  return `
    <label for="alp-email" style="font-size:12px;color:var(--casebook-ink-muted);display:block;margin-bottom:4px;">Email</label>
    <input id="alp-email" type="text" placeholder="you@example.com" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-bg);color:var(--casebook-ink);font-size:13px;box-sizing:border-box;" />
    <p id="${errorId}" ${liveAttrs} style="font-size:12px;color:var(--casebook-critical, #b23b3b);margin:6px 0 0;min-height:16px;"></p>
    <button id="${errorId}-submit" style="margin-top:10px;padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;">Submit</button>
  `;
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function renderBroken(vp) {
  const log = [];

  function render() {
    vp.innerHTML = `
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ Error text has no aria-live or role — visible, but never announced.</p>
      ${formMarkup({ errorId: 'alp-broken-error', liveAttrs: '' })}
      <div style="margin-top:14px;padding:10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;">
        <p style="font-size:11px;color:var(--casebook-ink-muted);margin:0 0 6px;font-weight:600;">🔈 What a screen reader hears</p>
        <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0;">${log.length ? log.join('<br>') : '(nothing — submit with a bad email to try it)'}</p>
      </div>
    `;
    const input = vp.querySelector('#alp-email');
    vp.querySelector('#alp-broken-error-submit').addEventListener('click', () => {
      const error = vp.querySelector('#alp-broken-error');
      if (!isValidEmail(input.value)) {
        error.textContent = 'Please enter a valid email address.';
        // No aria-live/role on this element — the update is real, but
        // nothing tells assistive tech to notice or announce it.
        log.push('🔇 (nothing announced — error has no live-region attribute)');
      } else {
        error.textContent = '';
        log.push('✓ Submitted successfully.');
      }
      render();
    });
  }

  render();
}

function renderFixed(vp) {
  const log = [];

  function render() {
    vp.innerHTML = `
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Error container is aria-live="polite" from first render — announced automatically.</p>
      ${formMarkup({ errorId: 'alp-fixed-error', liveAttrs: 'aria-live="polite"' })}
      <div style="margin-top:14px;padding:10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;">
        <p style="font-size:11px;color:var(--casebook-ink-muted);margin:0 0 6px;font-weight:600;">🔈 What a screen reader hears</p>
        <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0;">${log.length ? log.join('<br>') : '(submit with a bad email to try it)'}</p>
      </div>
    `;
    const input = vp.querySelector('#alp-email');
    vp.querySelector('#alp-fixed-error-submit').addEventListener('click', () => {
      const error = vp.querySelector('#alp-fixed-error');
      if (!isValidEmail(input.value)) {
        const msg = 'Please enter a valid email address.';
        error.textContent = msg;
        // aria-live="polite" was already on this element before the
        // mutation — the change is picked up and announced automatically.
        log.push('🔊 Announced: "' + msg + '"');
      } else {
        error.textContent = '';
        log.push('✓ Submitted successfully.');
      }
      render();
    });
  }

  render();
}

export function initDemo(root) {
  wireToggleDemo(root, { renderBroken, renderFixed });
}
