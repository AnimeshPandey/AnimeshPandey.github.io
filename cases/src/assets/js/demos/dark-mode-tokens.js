import { wireToggleDemo } from './_demo-utils.js';

function renderBroken(vp) {
  let dark = false;
  let cardCount = 2;
  const missingCards = new Set(); // indices where the override was "forgotten"

  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ Hardcoded colors + one dark-mode override rule per component.</p>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button type="button" id="dmt-broken-theme" style="padding:6px 12px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-surface-2);color:var(--casebook-ink);font-size:11px;cursor:pointer;">🌙 Toggle dark mode</button>
        <button type="button" id="dmt-broken-add" style="padding:6px 12px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-surface-2);color:var(--casebook-ink);font-size:11px;cursor:pointer;">+ Add card</button>
      </div>
      <div id="dmt-broken-cards"></div>
      <p id="dmt-broken-status" style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;">2 override rules written so far.</p>
    </div>`;

  const cardsEl = vp.querySelector('#dmt-broken-cards');
  const status = vp.querySelector('#dmt-broken-status');

  function render() {
    let html = '';
    for (let i = 0; i < cardCount; i++) {
      // Every 3rd card added "forgets" the override — the realistic failure mode:
      // someone adds a component and doesn't know/remember it needs its own dark rule.
      const forgotten = i >= 2 && (i - 2) % 3 === 0;
      if (forgotten) missingCards.add(i);
      const bg = dark && !forgotten ? '#1e1e1e' : '#ffffff';
      const border = dark && !forgotten ? '#3a3a3a' : '#e2e2e2';
      const ink = dark && !forgotten ? '#ececec' : '#111111';
      html += `<div style="background:${bg};border:1px solid ${border};color:${ink};border-radius:8px;padding:10px 12px;font-size:12px;margin-bottom:6px;">
        Card ${i + 1}${forgotten ? ' <span style="color:#B2555D;font-weight:600;">— override missing, still light!</span>' : ''}
      </div>`;
    }
    cardsEl.innerHTML = html;
    const missing = [...missingCards].filter((i) => i < cardCount).length;
    status.textContent = `${cardCount} override rule(s) needed. ${missing ? missing + ' component(s) never got one — still broken in dark mode.' : ''}`;
  }

  vp.querySelector('#dmt-broken-theme').addEventListener('click', () => { dark = !dark; render(); });
  vp.querySelector('#dmt-broken-add').addEventListener('click', () => { cardCount++; render(); });

  render();
}

function renderFixed(vp) {
  let dark = false;
  let cardCount = 2;

  vp.innerHTML = `
    <div style="padding:14px 16px;--dmt-surface:#ffffff;--dmt-border:#e2e2e2;--dmt-ink:#111111;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Every card references the same tokens — redefined once at the root.</p>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button type="button" id="dmt-fixed-theme" style="padding:6px 12px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-surface-2);color:var(--casebook-ink);font-size:11px;cursor:pointer;">🌙 Toggle dark mode</button>
        <button type="button" id="dmt-fixed-add" style="padding:6px 12px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-surface-2);color:var(--casebook-ink);font-size:11px;cursor:pointer;">+ Add card</button>
      </div>
      <div id="dmt-fixed-root" style="--dmt-surface:#ffffff;--dmt-border:#e2e2e2;--dmt-ink:#111111;">
        <div id="dmt-fixed-cards"></div>
      </div>
      <p id="dmt-fixed-status" style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;">1 token block, redefined once. New cards theme automatically.</p>
    </div>`;

  const rootEl = vp.querySelector('#dmt-fixed-root');
  const cardsEl = vp.querySelector('#dmt-fixed-cards');
  const status = vp.querySelector('#dmt-fixed-status');

  function applyTheme() {
    if (dark) {
      rootEl.style.setProperty('--dmt-surface', '#1e1e1e');
      rootEl.style.setProperty('--dmt-border', '#3a3a3a');
      rootEl.style.setProperty('--dmt-ink', '#ececec');
    } else {
      rootEl.style.setProperty('--dmt-surface', '#ffffff');
      rootEl.style.setProperty('--dmt-border', '#e2e2e2');
      rootEl.style.setProperty('--dmt-ink', '#111111');
    }
  }

  function render() {
    let html = '';
    for (let i = 0; i < cardCount; i++) {
      html += `<div style="background:var(--dmt-surface);border:1px solid var(--dmt-border);color:var(--dmt-ink);border-radius:8px;padding:10px 12px;font-size:12px;margin-bottom:6px;">Card ${i + 1}</div>`;
    }
    cardsEl.innerHTML = html;
    status.textContent = `1 token block, redefined once. ${cardCount} card(s) all themed correctly — zero component code changed.`;
  }

  vp.querySelector('#dmt-fixed-theme').addEventListener('click', () => { dark = !dark; applyTheme(); });
  vp.querySelector('#dmt-fixed-add').addEventListener('click', () => { cardCount++; render(); });

  applyTheme();
  render();
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken,
    renderFixed,
  });
}
