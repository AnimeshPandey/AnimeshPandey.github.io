import { wireToggleDemo } from './_demo-utils.js';

export function initDemo(root) {
  function setup(vp, hashed) {
    const filename = hashed ? 'app.a3f8c1.js' : 'app.js';
    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
  ${hashed ? '✓ app.<hash>.js, cached forever, invalidated by renaming' : '✗ app.js, same name every deploy, short cache window'}
</p>
<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
  <button id="cbk-cc-load" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;white-space:nowrap;">Simulate page load</button>
  <button id="cbk-cc-deploy" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;white-space:nowrap;">Simulate deploy</button>
</div>
<div id="cbk-cc-log" style="font-size:12px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:90px;white-space:pre-line;">Click "Simulate page load" a few times, then "Simulate deploy."</div>
</div>`;

    let currentFile = filename;
    let visitCount = 0;
    let deployed = false;
    const log = vp.querySelector('#cbk-cc-log');
    const lines = [];

    function push(line) {
      lines.push(line);
      if (log) log.textContent = lines.slice(-6).join('\n');
    }

    vp.querySelector('#cbk-cc-load').addEventListener('click', () => {
      visitCount++;
      if (hashed) {
        if (visitCount === 1 || deployed) {
          push(`Visit ${visitCount}: GET ${currentFile} → 200 (network)`);
          deployed = false;
        } else {
          push(`Visit ${visitCount}: GET ${currentFile} → cached, 0 bytes over the wire`);
        }
      } else {
        if (deployed && visitCount > 1) {
          push(`Visit ${visitCount}: GET ${currentFile} → 200 (SERVED FROM CACHE — this is the OLD code, deploy already happened)`);
        } else {
          push(`Visit ${visitCount}: GET ${currentFile} → 200 (network, cache window still short)`);
        }
      }
    });

    vp.querySelector('#cbk-cc-deploy').addEventListener('click', () => {
      deployed = true;
      if (hashed) {
        currentFile = 'app.9c21be.js';
        push(`— Deploy shipped — new hashed filename: ${currentFile} —`);
      } else {
        push(`— Deploy shipped — filename unchanged (${currentFile}), old copy may still be cached —`);
      }
    });
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed: vp => setup(vp, true),
  });
}
