import { wireToggleDemo, PRM } from './_demo-utils.js';

const STREAM_TEXT = 'Skeleton screens improve perceived performance by giving the brain a layout prediction. The key insight is that users tolerate waiting when they can see progress — but a blank void with a spinner provides no such signal. By rendering placeholder shapes that match the expected content geometry, you reduce the cognitive cost of waiting.';

export function initDemo(root) {
  function setup(vp, buffered) {
    let streaming = false;

    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">
  ${buffered ? '✓ Buffered — rAF flush at 60fps, smooth rendering' : '✗ Unbuffered — every token triggers a DOM write'}
</p>
<div id="cbk-stream-out" style="min-height:80px;padding:10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:13px;color:var(--casebook-ink);line-height:1.5;margin-bottom:8px;word-break:break-word;white-space:pre-wrap;"></div>
<div style="display:flex;gap:8px;align-items:center;">
  <button id="cbk-start-stream" style="padding:6px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:34px;">▶ Start stream</button>
  <span id="cbk-frame-info" style="font-size:11px;color:var(--casebook-ink-faint);"></span>
</div>
</div>`;

    vp.querySelector('#cbk-start-stream').addEventListener('click', () => {
      if (streaming) return;
      streaming = true;
      const out = vp.querySelector('#cbk-stream-out');
      const info = vp.querySelector('#cbk-frame-info');
      const btn = vp.querySelector('#cbk-start-stream');
      out.textContent = '';
      btn.disabled = true;

      const words = STREAM_TEXT.split(' ');
      let i = 0;
      let domWrites = 0;
      let rafCalls = 0;
      let buffer = '';

      if (PRM || !buffered) {
        // Unbuffered or PRM: simple interval, one DOM write per token
        const iv = setInterval(() => {
          if (i >= words.length) {
            clearInterval(iv);
            if (info) info.textContent = `Done — ${domWrites} DOM writes`;
            streaming = false;
            btn.disabled = false;
            return;
          }
          out.textContent += (i > 0 ? ' ' : '') + words[i];
          domWrites++;
          i++;
          if (info) info.textContent = `Token ${i}/${words.length} — DOM writes: ${domWrites}`;
        }, PRM ? 0 : 40);
      } else {
        // Buffered: accumulate tokens, flush via rAF
        const TOKEN_INTERVAL = 16; // ms between tokens (faster than rAF)
        const iv = setInterval(() => {
          if (i >= words.length) { clearInterval(iv); return; }
          buffer += (i > 0 ? ' ' : '') + words[i];
          i++;
        }, TOKEN_INTERVAL);

        function flush() {
          if (buffer) {
            out.textContent += buffer;
            buffer = '';
            domWrites++;
            rafCalls++;
          }
          if (i < words.length || buffer) {
            if (info) info.textContent = `Token ${i}/${words.length} — DOM writes: ${domWrites} (rAF: ${rafCalls})`;
            requestAnimationFrame(flush);
          } else {
            if (info) info.textContent = `Done — ${domWrites} DOM writes vs ${words.length} tokens`;
            streaming = false;
            btn.disabled = false;
          }
        }
        requestAnimationFrame(flush);
      }
    });
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
