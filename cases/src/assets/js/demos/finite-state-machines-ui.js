import { wireToggleDemo } from './_demo-utils.js';

const BTN_STYLE = 'padding:6px 12px;border:1px solid var(--casebook-border);background:var(--casebook-surface);color:var(--casebook-ink);border-radius:6px;font-size:11px;min-height:32px;';

function controlsHtml() {
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;">
    <button data-ev="submit" class="cbk-fsm-btn" style="${BTN_STYLE}">Submit</button>
    <button data-ev="error" class="cbk-fsm-btn" style="${BTN_STYLE}">Server error</button>
    <button data-ev="success" class="cbk-fsm-btn" style="${BTN_STYLE}">Success</button>
    <button data-ev="reset" class="cbk-fsm-btn" style="${BTN_STYLE}">Reset</button>
  </div>`;
}

function badge(label, active, color) {
  return `<span style="display:inline-block;padding:3px 8px;border-radius:10px;font-size:10px;margin:0 4px 4px 0;background:${active ? color : 'var(--casebook-surface-2)'};color:${active ? '#fff' : 'var(--casebook-ink-faint)'};">${label}: ${active}</span>`;
}

function panelHtml(kind) {
  return {
    idle: '<div style="padding:8px;background:var(--casebook-surface-2);border-radius:6px;font-size:12px;color:var(--casebook-ink-faint);">Idle — form not yet submitted.</div>',
    submitting: '<div style="padding:8px;background:var(--casebook-surface-2);border-radius:6px;font-size:12px;">⏳ Submitting…</div>',
    error: '<div style="padding:8px;background:#B2555D;color:#fff;border-radius:6px;font-size:12px;">✕ Server error — try again</div>',
    success: '<div style="padding:8px;background:#3F7A5C;color:#fff;border-radius:6px;font-size:12px;">✓ Submitted successfully</div>',
  }[kind];
}

function setupBroken(vp) {
  const flags = { isSubmitting: false, hasError: false, isComplete: false };

  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">✗ Independent boolean flags — nothing clears the others</p>
      <div id="cbk-fsm-badges" style="margin-bottom:8px;"></div>
      <div id="cbk-fsm-panel" style="min-height:70px;margin-bottom:10px;display:flex;flex-direction:column;gap:6px;"></div>
      ${controlsHtml()}
    </div>`;

  const badges = vp.querySelector('#cbk-fsm-badges');
  const panel = vp.querySelector('#cbk-fsm-panel');

  function render() {
    badges.innerHTML =
      badge('isSubmitting', flags.isSubmitting, '#5B7FA6') +
      badge('hasError', flags.hasError, '#B2555D') +
      badge('isComplete', flags.isComplete, '#3F7A5C');

    let html = '';
    if (flags.isSubmitting) html += panelHtml('submitting');
    if (flags.hasError) html += panelHtml('error');
    if (flags.isComplete) html += panelHtml('success');
    panel.innerHTML = html || panelHtml('idle');
  }

  render();

  vp.querySelectorAll('.cbk-fsm-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ev = btn.dataset.ev;
      // Bug: each event only sets its own flag — nothing resets the others,
      // so isSubmitting + hasError + isComplete can all be true at once.
      if (ev === 'submit') flags.isSubmitting = true;
      if (ev === 'error') flags.hasError = true;
      if (ev === 'success') flags.isComplete = true;
      if (ev === 'reset') { flags.isSubmitting = false; flags.hasError = false; flags.isComplete = false; }
      render();
    });
  });
}

const TRANSITIONS = {
  idle: { submit: 'submitting' },
  submitting: { error: 'error', success: 'success' },
  error: { submit: 'submitting' },
  success: {},
};

function setupFixed(vp) {
  let state = 'idle';

  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">✓ Explicit finite states — exactly one active at a time</p>
      <p id="cbk-fsm-state" style="font-size:12px;font-weight:600;color:var(--casebook-ink);margin:0 0 8px;">State: idle</p>
      <div id="cbk-fsm-panel" style="min-height:70px;margin-bottom:10px;"></div>
      ${controlsHtml()}
    </div>`;

  const stateLabel = vp.querySelector('#cbk-fsm-state');
  const panel = vp.querySelector('#cbk-fsm-panel');

  function render() {
    stateLabel.textContent = 'State: ' + state;
    panel.innerHTML = panelHtml(state);
    vp.querySelectorAll('.cbk-fsm-btn').forEach((btn) => {
      const ev = btn.dataset.ev;
      const valid = ev === 'reset' ? state !== 'idle' : Boolean(TRANSITIONS[state] && TRANSITIONS[state][ev]);
      btn.disabled = !valid;
      btn.style.opacity = valid ? '1' : '0.4';
      btn.style.cursor = valid ? 'pointer' : 'not-allowed';
    });
  }

  render();

  vp.querySelectorAll('.cbk-fsm-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ev = btn.dataset.ev;
      if (ev === 'reset') {
        state = 'idle';
        render();
        return;
      }
      // Only a transition the current state actually declares can fire —
      // clicking "Success" while idle, or "Server error" while idle, does nothing.
      const next = TRANSITIONS[state] && TRANSITIONS[state][ev];
      if (next) {
        state = next;
        render();
      }
    });
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: setupBroken,
    renderFixed: setupFixed,
  });
}
