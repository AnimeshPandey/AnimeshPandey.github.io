import { wireToggleDemo } from './_demo-utils.js';

function renderBroken(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ CI log — this is the entire failure record.</p>
      <div style="background:#1b1b1b;border-radius:6px;padding:12px 14px;font-family:ui-monospace,monospace;font-size:12px;line-height:1.6;color:#e5e5e5;">
        <div style="color:#f28b82;">1) checkout.spec.ts:47:9 › completes checkout with saved card</div>
        <div style="color:#9aa0a6;margin-top:6px;">TimeoutError: locator.click: Target closed</div>
        <div style="color:#9aa0a6;">waiting for locator('[data-testid="place-order"]')</div>
        <div style="color:#5f6368;margin-top:6px;">at checkout.spec.ts:47:26</div>
        <div style="color:#5f6368;">1 failed, 23 passed (1.4m)</div>
      </div>
      <p style="font-size:12px;color:var(--casebook-ink-muted);margin:12px 0 0;">Was it a crash? A redirect? An overlay? Slow render? Nothing here tells you — and it passes every time you re-run it locally.</p>
    </div>`;
}

function renderFixed(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Trace viewer — same failure, full timeline.</p>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
        <button type="button" class="pw-tab" data-tab="dom" style="padding:5px 11px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-surface-2);color:var(--casebook-ink);font-size:11px;cursor:pointer;">DOM snapshot</button>
        <button type="button" class="pw-tab" data-tab="net" style="padding:5px 11px;border-radius:6px;border:1px solid var(--casebook-border);background:transparent;color:var(--casebook-ink-muted);font-size:11px;cursor:pointer;">Network</button>
        <button type="button" class="pw-tab" data-tab="console" style="padding:5px 11px;border-radius:6px;border:1px solid var(--casebook-border);background:transparent;color:var(--casebook-ink-muted);font-size:11px;cursor:pointer;">Console</button>
      </div>
      <div id="pw-tab-body" style="min-height:150px;background:var(--casebook-surface-2);border-radius:6px;padding:12px 14px;font-size:12px;"></div>
    </div>`;

  const tabs = vp.querySelectorAll('.pw-tab');
  const body = vp.querySelector('#pw-tab-body');

  const panels = {
    dom: `
      <p style="margin:0 0 8px;color:var(--casebook-ink);font-weight:600;">Snapshot at click attempt, action #14</p>
      <div style="border:1px dashed var(--casebook-accent);border-radius:6px;padding:10px;position:relative;background:var(--casebook-bg);">
        <div style="background:#F4E3B2;color:#6B4E1A;font-size:11px;padding:6px 10px;border-radius:4px;margin-bottom:8px;">🍪 We use cookies — <u>Accept</u></div>
        <div style="opacity:.35;pointer-events:none;">
          <div style="font-size:12px;color:var(--casebook-ink-muted);">Order summary — $84.20</div>
          <button style="margin-top:8px;padding:6px 12px;font-size:11px;border-radius:5px;border:none;background:var(--casebook-accent);color:var(--casebook-bg);">Place order</button>
        </div>
        <div style="position:absolute;top:4px;right:6px;font-size:10px;color:#B2555D;">↖ click landed here, not on the button</div>
      </div>
      <p style="margin:10px 0 0;color:var(--casebook-ink-muted);">Root cause: the consent banner rendered on top of the order button and ate the click. Never appears in the log line.</p>`,
    net: `
      <p style="margin:0 0 8px;color:var(--casebook-ink);font-weight:600;">Requests around the failure</p>
      <div style="font-family:ui-monospace,monospace;font-size:11px;line-height:1.8;color:var(--casebook-ink-muted);">
        <div>GET /api/cart · 200 · 41ms</div>
        <div style="color:#A8721F;">GET /consent/banner.js · 200 · <strong>612ms</strong> (usual: ~270ms)</div>
        <div>POST /api/checkout/init · 200 · 88ms</div>
      </div>
      <p style="margin:10px 0 0;color:var(--casebook-ink-muted);">The consent script loaded 340ms slower than usual on this run — just slow enough for the banner to still be sliding in when the click fired.</p>`,
    console: `
      <p style="margin:0 0 8px;color:var(--casebook-ink);font-weight:600;">Console output</p>
      <div style="font-family:ui-monospace,monospace;font-size:11px;line-height:1.8;color:var(--casebook-ink-muted);">
        <div>[consent-sdk] banner mounted</div>
        <div style="color:#B2555D;">[app] click event target: DIV.consent-banner__accept (expected BUTTON#place-order)</div>
      </div>`,
  };

  function show(tab) {
    body.innerHTML = panels[tab];
    tabs.forEach((t) => {
      const active = t.dataset.tab === tab;
      t.style.background = active ? 'var(--casebook-surface-2)' : 'transparent';
      t.style.color = active ? 'var(--casebook-ink)' : 'var(--casebook-ink-muted)';
    });
  }

  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
  show('dom');
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken,
    renderFixed,
  });
}
