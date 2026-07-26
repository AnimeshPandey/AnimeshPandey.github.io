/**
 * demos/focus-trap-modal.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": a real confirmation dialog with real focusable fields.
 * "broken" mode attaches no keydown handler — native Tab order is left to
 * carry focus wherever the DOM puts it next (a real page link sitting right
 * behind the dialog). "fixed" mode intercepts Tab/Shift+Tab at the dialog's
 * boundary and explicitly returns focus to the trigger on close. Every
 * focus change here is a real .focus() call / real browser Tab keypress,
 * not a simulated animation.
 */
import { wireToggleDemo } from './_demo-utils.js';

function shell() {
  return `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      Tab through the dialog with your keyboard. Try Tab from the Delete button, or Shift+Tab from the Name field.
    </div>
    <div style="position:relative;border:1px solid var(--casebook-border);border-radius:8px;padding:14px;background:var(--casebook-surface-2);min-height:170px;">
      <button id="cbk-ftm-trigger" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">Open "Delete project" dialog</button>

      <div id="cbk-ftm-dialog" role="dialog" aria-modal="true" aria-label="Delete project" hidden
           style="margin-top:12px;border:1px solid var(--casebook-accent);border-radius:8px;padding:12px;background:var(--casebook-bg);">
        <p style="font-size:12.5px;margin:0 0 8px;font-weight:600;">Delete project?</p>
        <label style="display:block;font-size:11.5px;margin-bottom:6px;">Project name
          <input id="cbk-ftm-name" type="text" placeholder="type project name to confirm" style="display:block;width:100%;box-sizing:border-box;margin-top:3px;padding:5px 7px;font-size:12px;border:1px solid var(--casebook-border);border-radius:5px;">
        </label>
        <label style="display:flex;gap:6px;align-items:center;font-size:11.5px;margin-bottom:10px;">
          <input id="cbk-ftm-checkbox" type="checkbox"> I understand this can't be undone
        </label>
        <button id="cbk-ftm-cancel" type="button" style="padding:6px 12px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:34px;">Cancel</button>
        <button id="cbk-ftm-delete" type="button" style="padding:6px 12px;background:#c0392b;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:34px;margin-left:8px;">Delete</button>
      </div>

      <a id="cbk-ftm-page-link" href="#" style="display:inline-block;margin-top:12px;font-size:12px;color:var(--casebook-ink-faint);">Page link (still live behind the dialog — the next stop in tab order once the dialog's fields run out)</a>
    </div>
    <div id="cbk-ftm-log" style="margin-top:10px;font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:70px;white-space:pre-line;">Open the dialog, then Tab to the end of it.</div>
  `;
}

function wireCommon(vp) {
  const trigger  = vp.querySelector('#cbk-ftm-trigger');
  const pageLink = vp.querySelector('#cbk-ftm-page-link');
  const dialog   = vp.querySelector('#cbk-ftm-dialog');
  const name     = vp.querySelector('#cbk-ftm-name');
  const checkbox = vp.querySelector('#cbk-ftm-checkbox');
  const cancel   = vp.querySelector('#cbk-ftm-cancel');
  const del      = vp.querySelector('#cbk-ftm-delete');
  const log      = vp.querySelector('#cbk-ftm-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  function openDialog() {
    dialog.hidden = false;
    name.focus();
    push('[open] dialog shown — focus moved to Name field');
  }

  trigger.addEventListener('click', () => { lines.length = 0; openDialog(); });
  pageLink.addEventListener('click', (e) => e.preventDefault());

  return { trigger, pageLink, dialog, name, checkbox, cancel, del, log, push, openDialog };
}

function setupBroken(vp) {
  vp.innerHTML = shell();
  const { pageLink, dialog, name, cancel, del, push } = wireCommon(vp);

  del.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      push('[Tab on Delete] no handler intercepts — native tab order takes over');
    }
  });
  pageLink.addEventListener('focus', () => {
    if (!dialog.hidden) push('RESULT: ✗ focus escaped onto a real page link still behind the dialog');
  });

  function closeDialog() {
    dialog.hidden = true;
    push('[close] dialog hidden — focus not explicitly returned');
    setTimeout(() => {
      const where = document.activeElement === document.body ? '<body> (browser default)' : (document.activeElement && document.activeElement.tagName) || 'unknown';
      push('RESULT: ✗ focus landed on ' + where + ', not the trigger button');
    }, 0);
  }
  cancel.addEventListener('click', closeDialog);
  del.addEventListener('click', closeDialog);
  void name;
}

function setupFixed(vp) {
  vp.innerHTML = shell();
  const { trigger, dialog, name, checkbox, cancel, del, push } = wireCommon(vp);
  const focusable = [name, checkbox, cancel, del];

  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const list = focusable.filter((el) => !el.disabled);
    const first = list[0];
    const last  = list[list.length - 1];
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
      push('[Tab on Delete] wrapped back to Name — focus stayed inside the dialog');
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
      push('[Shift+Tab on Name] wrapped to Delete — focus stayed inside the dialog');
    }
  });

  function closeDialog() {
    dialog.hidden = true;
    trigger.focus();
    push('[close] focus explicitly returned to the trigger button');
    push('RESULT: ✓ focus never left the dialog while open, and returned to the trigger on close');
  }
  cancel.addEventListener('click', closeDialog);
  del.addEventListener('click', closeDialog);
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
