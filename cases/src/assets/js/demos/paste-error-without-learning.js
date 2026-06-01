import { wireToggleDemo } from './_demo-utils.js';

const ERR = 'TypeError: Cannot read properties of undefined (reading "map") at List.tsx:42';

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken(vp) {
      vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">Paste raw error only → generic fix.</p>
<textarea readonly style="width:100%;height:56px;font-size:11px;padding:8px;border:1px solid var(--casebook-border);border-radius:6px;">${ERR}</textarea>
<div style="margin-top:8px;padding:10px;background:var(--casebook-surface-2);border-radius:6px;font-size:12px;">AI: "Try optional chaining: data?.map(...)"</div></div>`;
    },
    renderFixed(vp) {
      vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">Add one-sentence hypothesis → teaching answer.</p>
<textarea readonly style="width:100%;height:56px;font-size:11px;padding:8px;border:1px solid var(--casebook-border);border-radius:6px;">${ERR}\n\nHypothesis: items is undefined because fetch returned before setState.</textarea>
<div style="margin-top:8px;padding:10px;background:var(--casebook-surface-2);border-radius:6px;font-size:12px;">AI: "You're right — guard with default [] or loading state so .map never runs on undefined."</div></div>`;
    },
  });
}
