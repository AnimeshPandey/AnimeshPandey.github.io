/**
 * demos/container-queries-component.js
 * Export: initDemo(root)
 * Broken: a card whose flex-direction switch is a real @media rule — checks
 *         the page's actual browser viewport, so it's unaffected by the
 *         slider that resizes the card's own containing box.
 * Fixed:  the same card, but the switch is a real @container rule against a
 *         containment context set on the slider-controlled wrapper — so the
 *         card restacks live as the box crosses the 300px threshold.
 * Both states run genuine, live CSS (@media / @container), not a JS-faked
 * toggle — this is the actual evaluation-context difference the case is about.
 */

function cardMarkup(mode) {
  return `
    <style>
      .cbk-cq-card {
        display: flex;
        gap: 10px;
        border: 1px solid var(--casebook-border);
        border-radius: 8px;
        background: var(--casebook-bg);
        overflow: hidden;
      }
      .cbk-cq-card__media {
        flex: 0 0 60px;
        height: 60px;
        border-radius: 6px;
        background: linear-gradient(135deg, var(--casebook-accent), var(--casebook-border));
      }
      .cbk-cq-card__body { padding: 10px; min-width: 0; }
      .cbk-cq-card__body h4 { margin: 0 0 4px; font-size: 13px; }
      .cbk-cq-card__body p { margin: 0 0 8px; font-size: 12px; color: var(--casebook-ink-faint); }
      .cbk-cq-card__body button {
        font-size: 11px; padding: 4px 8px; border-radius: 5px;
        border: 1px solid var(--casebook-border); background: var(--casebook-surface-2);
        color: var(--casebook-ink); cursor: default;
      }
      /* Broken: real @media rule — checks the document viewport, ignores the slider */
      .cbk-cq-card--media { flex-direction: column; }
      @media (min-width: 300px) {
        .cbk-cq-card--media { flex-direction: row; }
      }
      /* Fixed: real @container rule — checks the slider-controlled wrapper below */
      #cbk-cq-wrap[data-mode="container"] {
        container-type: inline-size;
        container-name: cbk-cq;
      }
      .cbk-cq-card--container { flex-direction: column; }
      @container cbk-cq (min-width: 300px) {
        .cbk-cq-card--container { flex-direction: row; }
      }
    </style>
    <div style="padding:6px 4px;">
      <label for="cbk-cq-range" style="display:block;font-size:12px;color:var(--casebook-ink-faint);margin-bottom:6px;">
        Container width: <strong id="cbk-cq-width-label">340px</strong>
      </label>
      <input id="cbk-cq-range" type="range" min="160" max="420" value="340" style="width:100%;">
      <div id="cbk-cq-wrap" data-mode="${mode}" style="margin-top:14px;width:340px;max-width:100%;padding:10px;border:2px dashed var(--casebook-border);border-radius:8px;background:var(--casebook-surface-2);">
        <article class="cbk-cq-card cbk-cq-card--${mode}">
          <div class="cbk-cq-card__media" aria-hidden="true"></div>
          <div class="cbk-cq-card__body">
            <h4>Wireless Headphones</h4>
            <p>Noise-cancelling, 30-hour battery.</p>
            <button type="button" tabindex="-1">Add to cart</button>
          </div>
        </article>
      </div>
      <p id="cbk-cq-status" style="font-size:11.5px;color:var(--casebook-ink-faint);margin-top:10px;min-height:2.6em;"></p>
    </div>`;
}

function wire(vp, mode) {
  vp.innerHTML = cardMarkup(mode);
  const range = vp.querySelector('#cbk-cq-range');
  const wrap = vp.querySelector('#cbk-cq-wrap');
  const label = vp.querySelector('#cbk-cq-width-label');
  const status = vp.querySelector('#cbk-cq-status');
  if (!range || !wrap) return;

  function update() {
    const w = range.value;
    wrap.style.width = w + 'px';
    if (label) label.textContent = w + 'px';
    if (status) {
      status.textContent = mode === 'media'
        ? 'This card’s CSS uses @media (min-width: 300px) — that checks the page’s viewport, not this box, so the layout never changes here.'
        : 'This card’s CSS uses @container cbk-cq (min-width: 300px) — that checks this box’s own width, so it restacks once you cross 300px.';
    }
  }

  range.addEventListener('input', update);
  update();
}

export function initDemo(root) {
  const viewport = root.querySelector('#demo-viewport, .case-demo__viewport');
  const stateLabel = root.querySelector('.case-demo__state-label');
  const brokenBtn = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn = root.querySelector('[data-demo-state="fixed"]');

  function render(state) {
    if (viewport) wire(viewport, state === 'broken' ? 'media' : 'container');
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
