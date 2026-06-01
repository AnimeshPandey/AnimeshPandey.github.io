import { wireToggleDemo } from './_demo-utils.js';

function codeBox(title, code, highlight) {
  const bg = highlight ? 'color-mix(in srgb, var(--casebook-accent) 8%, var(--casebook-surface-2))' : 'var(--casebook-surface-2)';
  const border = highlight ? 'var(--casebook-accent)' : 'var(--casebook-border)';
  return `<div style="flex:1;min-width:0;">
  <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--casebook-ink-faint);margin:0 0 4px;">${title}</p>
  <pre style="margin:0;padding:10px;background:${bg};border:1px solid ${border};border-radius:6px;font-size:11px;color:var(--casebook-ink);white-space:pre-wrap;word-break:break-all;line-height:1.5;"><code>${code}</code></pre>
</div>`;
}

export function initDemo(root) {
  function renderBroken(vp) {
    const server = `&lt;button class="btn dark"&gt;\n  Theme toggle\n&lt;/button&gt;`;
    const client = `&lt;button class="btn"&gt;\n  Theme toggle\n&lt;/button&gt;`;
    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">Server and client render different markup — hydration mismatch.</p>
<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
  ${codeBox('Server HTML', server, false)}
  ${codeBox('Client renders', client, true)}
</div>
<button id="cbk-hydrate" style="padding:7px 16px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;color:var(--casebook-ink-muted);">Hydrate →</button>
<div id="cbk-result" style="margin-top:10px;"></div>
</div>`;
    vp.querySelector('#cbk-hydrate').addEventListener('click', () => {
      vp.querySelector('#cbk-result').innerHTML = `<div style="padding:8px 12px;background:color-mix(in srgb,#e05 8%,var(--casebook-surface-2));border:1px solid #e05;border-radius:6px;font-size:12px;color:var(--casebook-ink);">
  ✗ Hydration mismatch: client tree diverged from server HTML. React discards server HTML and re-renders client-side.
</div>`;
    });
  }

  function renderFixed(vp) {
    const both = `&lt;button class="btn dark"&gt;\n  Theme toggle\n&lt;/button&gt;`;
    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">Server and client render identical markup — hydration succeeds.</p>
<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
  ${codeBox('Server HTML', both, false)}
  ${codeBox('Client renders', both, false)}
</div>
<button id="cbk-hydrate" style="padding:7px 16px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;color:var(--casebook-ink-muted);">Hydrate →</button>
<div id="cbk-result" style="margin-top:10px;"></div>
</div>`;
    vp.querySelector('#cbk-hydrate').addEventListener('click', () => {
      vp.querySelector('#cbk-result').innerHTML = `<div style="padding:8px 12px;background:color-mix(in srgb,#0a5 8%,var(--casebook-surface-2));border:1px solid #0a5;border-radius:6px;font-size:12px;color:var(--casebook-ink);">
  ✓ Hydration successful — React attaches event listeners to existing DOM without re-rendering.
</div>`;
    });
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
