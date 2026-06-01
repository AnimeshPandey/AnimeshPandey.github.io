import { wireToggleDemo } from './_demo-utils.js';

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken(vp) {
      vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">700ms delay before any feedback (feels broken).</p>
<input id="cbk-in" type="text" placeholder="Type here…" style="width:100%;padding:8px 10px;border:1px solid var(--casebook-border);border-radius:6px;font-size:13px;">
<p id="cbk-out" style="margin-top:8px;font-size:12px;color:var(--casebook-ink-muted);min-height:1.2em;"></p></div>`;
      const input = vp.querySelector('#cbk-in');
      const out = vp.querySelector('#cbk-out');
      let t;
      input.addEventListener('input', () => {
        clearTimeout(t);
        out.textContent = '…';
        t = setTimeout(() => { out.textContent = 'Echo: ' + input.value; }, 700);
      });
    },
    renderFixed(vp) {
      vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">Instant keystroke echo + 200ms debounced search label.</p>
<input id="cbk-in" type="text" placeholder="Type here…" style="width:100%;padding:8px 10px;border:1px solid var(--casebook-border);border-radius:6px;font-size:13px;">
<p id="cbk-echo" style="margin-top:6px;font-size:12px;color:var(--casebook-ink);"></p>
<p id="cbk-out" style="margin-top:4px;font-size:11px;color:var(--casebook-ink-faint);min-height:1.2em;"></p></div>`;
      const input = vp.querySelector('#cbk-in');
      const echo = vp.querySelector('#cbk-echo');
      const out = vp.querySelector('#cbk-out');
      let t;
      input.addEventListener('input', () => {
        echo.textContent = input.value ? 'You typed: ' + input.value : '';
        clearTimeout(t);
        out.textContent = 'Searching…';
        t = setTimeout(() => { out.textContent = input.value ? 'Results for "' + input.value + '"' : ''; }, 200);
      });
    },
  });
}
