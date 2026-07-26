import { wireToggleDemo, PRM } from './_demo-utils.js';

const LOADED_NAME = 'Jordan Rivera';

function renderBroken(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ No value attribute until data loads — uncontrolled, then forced controlled mid-flight.</p>
      <label style="font-size:12px;color:var(--casebook-ink-muted);display:block;margin-bottom:4px;">Name</label>
      <input id="cui-input-broken" type="text" placeholder="Type before the profile loads…" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-bg);color:var(--casebook-ink);font-size:13px;box-sizing:border-box;" />
      <button id="cui-load-broken" style="margin-top:10px;padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">▶ Load profile (simulate fetch)</button>
      <p id="cui-status-broken" style="font-size:12px;color:var(--casebook-ink-muted);margin-top:10px;min-height:34px;">Try typing your own name now, before clicking load.</p>
    </div>`;

  const input = vp.querySelector('#cui-input-broken');
  const btn = vp.querySelector('#cui-load-broken');
  const status = vp.querySelector('#cui-status-broken');

  btn.addEventListener('click', () => {
    btn.disabled = true;
    const typedBefore = input.value;
    status.textContent = 'Fetching profile…';
    const delay = PRM ? 0 : 900;
    setTimeout(() => {
      // Mimic React: value prop flips from undefined to a real string,
      // and the DOM node gets forcibly reconciled to it.
      input.value = LOADED_NAME;
      // Built with textContent (not innerHTML) since typedBefore is raw
      // user-typed input reflected back into the page.
      status.textContent = typedBefore
        ? `⚠ Warning: A component is changing an uncontrolled input to be controlled. Your typed text ("${typedBefore}") was overwritten — nothing was tracking it as state.`
        : `⚠ Warning: A component is changing an uncontrolled input to be controlled (value went from undefined to "${LOADED_NAME}").`;
      btn.disabled = false;
    }, delay);
  });
}

function renderFixed(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ value defaults to '' on the very first render — controlled from the start, never flips.</p>
      <label style="font-size:12px;color:var(--casebook-ink-muted);display:block;margin-bottom:4px;">Name</label>
      <input id="cui-input-fixed" type="text" value="" placeholder="Type before the profile loads…" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-bg);color:var(--casebook-ink);font-size:13px;box-sizing:border-box;" />
      <button id="cui-load-fixed" style="margin-top:10px;padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">▶ Load profile (simulate fetch)</button>
      <p id="cui-status-fixed" style="font-size:12px;color:var(--casebook-ink-muted);margin-top:10px;min-height:34px;">Try typing your own name now, before clicking load.</p>
    </div>`;

  const input = vp.querySelector('#cui-input-fixed');
  const btn = vp.querySelector('#cui-load-fixed');
  const status = vp.querySelector('#cui-status-fixed');
  let userEdited = false;

  input.addEventListener('input', () => {
    userEdited = true;
  });

  btn.addEventListener('click', () => {
    btn.disabled = true;
    status.textContent = 'Fetching profile…';
    const delay = PRM ? 0 : 900;
    setTimeout(() => {
      if (userEdited) {
        status.textContent = `Profile loaded — kept your typed value ("${input.value}"). value was controlled state the whole time, so nothing overwrote it unexpectedly.`;
      } else {
        input.value = LOADED_NAME;
        status.textContent = `Profile loaded — value was already a controlled string ('') on every render, so this is a normal state update. No warning.`;
      }
      btn.disabled = false;
    }, delay);
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken,
    renderFixed,
  });
}
