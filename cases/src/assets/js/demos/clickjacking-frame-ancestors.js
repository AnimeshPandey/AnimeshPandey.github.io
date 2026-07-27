/**
 * demos/clickjacking-frame-ancestors.js
 * Export: initDemo(root)
 * Both states stack two layers over the same decoy button:
 * Broken: the top layer is a real, functioning control (styled to look like
 *         a "Disable 2FA" button) at near-zero opacity — the browser still
 *         delivers clicks to it because it's topmost, even though the user
 *         only sees the decoy underneath. Clicking anywhere on the stack
 *         triggers the *hidden* control's handler.
 * Fixed:  the top layer represents a frame that failed to load because the
 *         target page sent frame-ancestors 'self' — it renders nothing and
 *         has pointer-events: none (an unloaded frame has nothing to
 *         receive a click), so the click falls straight through to the
 *         harmless decoy underneath.
 * Everything here is plain local DOM — no real iframe or cross-origin
 * request is involved, only the layering/opacity/click-target mechanics of
 * a real clickjacking attack are faithfully reproduced.
 */

function shell() {
  return `
    <div style="padding:6px 4px;">
      <label style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--casebook-ink-faint);margin-bottom:12px;cursor:pointer;">
        <input type="checkbox" id="cbk-cja-reveal"> Reveal hidden layer
      </label>
      <div id="cbk-cja-stack" style="position:relative;width:240px;max-width:100%;height:52px;">
        <button type="button" id="cbk-cja-decoy" tabindex="-1" style="position:absolute;inset:0;width:100%;height:100%;border:none;border-radius:8px;background:linear-gradient(135deg,#f5a623,#f76b1c);color:#fff;font-weight:700;font-size:13px;cursor:default;">
          🎁 Claim your free trial
        </button>
        <div id="cbk-cja-overlay" style="position:absolute;inset:0;border-radius:8px;"></div>
      </div>
      <p id="cbk-cja-log" style="font-size:11.5px;margin-top:12px;min-height:2.6em;color:var(--casebook-ink-faint);"></p>
    </div>`;
}

function setupBroken(vp) {
  vp.innerHTML = shell();
  const overlay = vp.querySelector('#cbk-cja-overlay');
  const reveal = vp.querySelector('#cbk-cja-reveal');
  const log = vp.querySelector('#cbk-cja-log');

  function paintOverlay() {
    const revealed = reveal.checked;
    overlay.innerHTML = `
      <button type="button" id="cbk-cja-hidden" tabindex="-1" style="position:absolute;inset:0;width:100%;height:100%;border:${revealed ? '2px dashed #c0392b' : 'none'};border-radius:8px;background:#c0392b;color:#fff;font-weight:700;font-size:13px;cursor:pointer;opacity:${revealed ? '0.85' : '0.04'};">
        Disable 2FA
      </button>`;
    const hidden = overlay.querySelector('#cbk-cja-hidden');
    if (hidden) {
      hidden.addEventListener('click', () => {
        log.textContent = '💥 Click landed on the hidden "Disable 2FA" button — not the visible decoy. 2FA disabled.';
        log.style.color = '#c0392b';
      });
    }
  }
  reveal.addEventListener('change', paintOverlay);
  paintOverlay();
}

function setupFixed(vp) {
  vp.innerHTML = shell();
  const overlay = vp.querySelector('#cbk-cja-overlay');
  const decoy = vp.querySelector('#cbk-cja-decoy');
  const reveal = vp.querySelector('#cbk-cja-reveal');
  const log = vp.querySelector('#cbk-cja-log');

  function paintOverlay() {
    const revealed = reveal.checked;
    // pointer-events: none because the frame never loaded — there is
    // nothing here to receive a click, which is exactly why the attack fails.
    overlay.style.pointerEvents = 'none';
    overlay.style.border = revealed ? '2px dashed var(--casebook-ink-faint)' : 'none';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.innerHTML = revealed
      ? `<span style="font-size:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--casebook-ink-faint);text-align:center;padding:4px;">frame blocked — empty</span>`
      : '';
  }
  reveal.addEventListener('change', paintOverlay);
  paintOverlay();

  decoy.addEventListener('click', () => {
    log.textContent = 'Decoy clicked — nothing else happened. Refused to display in a frame because an ancestor violates the following Content Security Policy directive: "frame-ancestors \'self\'".';
    log.style.color = 'var(--casebook-accent)';
  });
}

export function initDemo(root) {
  const viewport = root.querySelector('#demo-viewport, .case-demo__viewport');
  const stateLabel = root.querySelector('.case-demo__state-label');
  const brokenBtn = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn = root.querySelector('[data-demo-state="fixed"]');

  function render(state) {
    if (viewport) {
      if (state === 'broken') setupBroken(viewport);
      else setupFixed(viewport);
    }
    if (stateLabel) {
      const lbl = state === 'broken' ? brokenBtn : fixedBtn;
      if (lbl) stateLabel.textContent = 'Showing: ' + lbl.textContent.trim();
    }
    if (brokenBtn) brokenBtn.setAttribute('aria-pressed', state === 'broken' ? 'true' : 'false');
    if (fixedBtn) fixedBtn.setAttribute('aria-pressed', state === 'fixed' ? 'true' : 'false');
  }

  if (brokenBtn) brokenBtn.addEventListener('click', () => render('broken'));
  if (fixedBtn) fixedBtn.addEventListener('click', () => render('fixed'));
  render('fixed');
}
