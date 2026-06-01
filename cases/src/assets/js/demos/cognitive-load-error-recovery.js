import { wireToggleDemo } from './_demo-utils.js';

const FIELDS = [
  { id: 'f-name',    type: 'text',  label: 'Full name',     placeholder: 'Your name',         val: 'Jane',              errMsg: 'Name is required.' },
  { id: 'f-email',   type: 'email', label: 'Email',         placeholder: 'you@example.com',   val: 'not-an-email',      errMsg: 'Enter a valid email.' },
  { id: 'f-confirm', type: 'email', label: 'Confirm email', placeholder: 'Repeat email',      val: 'different@email',   errMsg: 'Emails do not match.' },
];

function inputHTML(f, retain) {
  return `<div id="${f.id}-wrap" style="margin-bottom:12px;">
  <label for="${f.id}" style="display:block;font-size:12px;font-weight:600;color:var(--casebook-ink-muted);margin-bottom:3px;">${f.label}</label>
  <input id="${f.id}" type="${f.type}" placeholder="${f.placeholder}" value="${retain ? f.val : ''}"
    style="width:100%;box-sizing:border-box;padding:7px 10px;border:1px solid var(--casebook-border);border-radius:6px;background:var(--casebook-surface);color:var(--casebook-ink);font-size:13px;outline:none;">
  <p id="${f.id}-err" role="alert" style="font-size:11px;color:var(--casebook-accent);margin:3px 0 0;min-height:14px;"></p>
</div>`;
}

export function initDemo(root) {
  function renderBroken(vp) {
    vp.innerHTML = `<div style="padding:14px 16px;">
  <div id="cbk-banner" role="alert" style="display:none;padding:8px 12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;margin-bottom:12px;"></div>
  ${FIELDS.map(f => inputHTML(f, false)).join('')}
  <button id="cbk-sub" style="padding:8px 18px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:13px;cursor:pointer;min-height:36px;">Submit</button>
</div>`;
    vp.querySelector('#cbk-sub').addEventListener('click', () => {
      vp.querySelectorAll('input').forEach(i => { i.value = ''; });
      const b = vp.querySelector('#cbk-banner');
      b.style.display = 'block';
      b.textContent = 'Error: 3 fields are invalid. Check the form and try again.';
    });
  }

  function renderFixed(vp) {
    vp.innerHTML = `<div style="padding:14px 16px;">
  <p id="cbk-summary" role="alert" style="font-size:12px;color:var(--casebook-accent);margin:0 0 10px;display:none;"></p>
  ${FIELDS.map(f => inputHTML(f, true)).join('')}
  <button id="cbk-sub" style="padding:8px 18px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:13px;cursor:pointer;min-height:36px;">Submit</button>
</div>`;

    vp.querySelector('#cbk-sub').addEventListener('click', () => {
      let errCount = 0, firstErr = null;

      FIELDS.forEach(f => {
        const inp = vp.querySelector('#' + f.id);
        const errEl = vp.querySelector('#' + f.id + '-err');
        const val = inp.value.trim();
        let msg = '';
        if (f.id === 'f-name' && !val) msg = f.errMsg;
        if (f.id === 'f-email' && !val.includes('@')) msg = f.errMsg;
        if (f.id === 'f-confirm') {
          const email = vp.querySelector('#f-email').value;
          if (val !== email) msg = f.errMsg;
        }
        errEl.textContent = msg;
        inp.style.borderColor = msg ? 'var(--casebook-accent)' : 'var(--casebook-border)';
        if (msg) { errCount++; if (!firstErr) firstErr = inp; }
      });

      const sum = vp.querySelector('#cbk-summary');
      if (errCount) {
        sum.style.display = 'block';
        sum.textContent = errCount + ' error' + (errCount > 1 ? 's' : '') + ' — see below';
        firstErr && firstErr.focus();
      } else {
        sum.style.display = 'none';
      }
    });
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
