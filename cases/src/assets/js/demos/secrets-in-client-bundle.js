import { wireToggleDemo } from './_demo-utils.js';

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken(vp) {
      vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">Fake API key visible in client bundle.</p>
<pre style="margin:0;padding:10px;background:#ffebee;border:1px solid #e57373;border-radius:6px;font-size:11px;overflow:auto;">const API_KEY = "sk_live_FAKE_EXPOSED_12345";
fetch("/api/data", { headers: { Authorization: API_KEY } });</pre>
<button type="button" style="margin-top:10px;padding:7px 14px;border-radius:6px;border:1px solid var(--casebook-border);cursor:pointer;">Call API</button>
<p style="font-size:11px;color:#b71c1c;margin-top:8px;">Anyone can read this in DevTools → Sources.</p></div>`;
    },
    renderFixed(vp) {
      vp.innerHTML = `<div style="padding:16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">Browser calls your serverless proxy — no secret in JS.</p>
<pre style="margin:0;padding:10px;background:#e8f5e9;border:1px solid #81c784;border-radius:6px;font-size:11px;overflow:auto;">fetch("/api/proxy/data"); // key lives server-side only</pre>
<button type="button" id="cbk-go" style="margin-top:10px;padding:7px 14px;border-radius:6px;border:1px solid var(--casebook-border);cursor:pointer;">Call proxy</button>
<p id="cbk-msg" style="font-size:11px;color:var(--casebook-ink-muted);margin-top:8px;"></p></div>`;
      vp.querySelector('#cbk-go').addEventListener('click', () => {
        vp.querySelector('#cbk-msg').textContent = '✓ Request routed via server — bundle contains no API_KEY.';
      });
    },
  });
}
