/**
 * demos/capture-vs-bubble.js
 * Export: initDemo(root, { demoType })
 * Broken (bubble, the addEventListener default): click order is Inner, Middle, Outer.
 * Fixed (capture: true): click order is Outer, Middle, Inner — the "click outside to
 * close" pattern real component libraries use so an inner stopPropagation() can't hide
 * the click from an outer listener.
 */
import { wireToggleDemo } from '../demos/_demo-utils.js';

const BOX_STYLE = (depth) => `
  padding: ${28 - depth * 8}px;
  border: 2px solid var(--casebook-border);
  border-radius: 8px;
  background: var(--casebook-bg);
  cursor: pointer;
  transition: background-color 0.15s ease;
`;

function template() {
  return `
    <div style="display:flex;gap:16px;">
      <div id="cvb-outer" style="${BOX_STYLE(0)}" data-box="Outer">
        Outer
        <div id="cvb-middle" style="${BOX_STYLE(1)}" data-box="Middle">
          Middle
          <div id="cvb-inner" style="${BOX_STYLE(2)}" data-box="Inner">
            Inner — click me
          </div>
        </div>
      </div>
      <div style="flex:1;min-width:160px;">
        <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 6px;">Fire order (last click):</p>
        <ol id="cvb-log" style="margin:0;padding-left:18px;font-family:var(--mono,monospace);font-size:12px;line-height:1.6;"></ol>
      </div>
    </div>
  `;
}

function flash(el) {
  if (!el) return;
  el.style.backgroundColor = 'var(--casebook-accent-soft, #f2ede4)';
  setTimeout(() => { el.style.backgroundColor = ''; }, 220);
}

function wireBoxes(viewport, useCapture) {
  const outer = viewport.querySelector('#cvb-outer');
  const middle = viewport.querySelector('#cvb-middle');
  const inner = viewport.querySelector('#cvb-inner');
  const log = viewport.querySelector('#cvb-log');
  const cleanups = [];

  // Clears the log exactly once per click, before any box listener runs.
  // Registered on `viewport` — an ancestor of all three boxes — in the
  // capture phase, so it fires before Outer's own capture-phase listener
  // regardless of which mode the boxes themselves are wired in. A naive
  // "clear when el === e.target" inside each box's own handler is wrong:
  // in capture mode the target fires LAST (Outer, then Middle, then
  // Inner), so clearing there wipes out the entries the earlier listeners
  // just appended.
  const clearHandler = () => { log.innerHTML = ''; };
  viewport.addEventListener('click', clearHandler, { capture: true });
  cleanups.push(() => viewport.removeEventListener('click', clearHandler, { capture: true }));

  [outer, middle, inner].forEach((el) => {
    const handler = (e) => {
      const li = document.createElement('li');
      li.textContent = `${el.dataset.box} (phase ${e.eventPhase === 1 ? 'capture' : e.eventPhase === 3 ? 'bubble' : 'target'})`;
      log.appendChild(li);
      flash(el);
    };
    el.addEventListener('click', handler, { capture: useCapture });
    cleanups.push(() => el.removeEventListener('click', handler, { capture: useCapture }));
  });

  return () => cleanups.forEach((fn) => fn());
}

export function initDemo(root) {
  let unwire = null;

  wireToggleDemo(root, {
    // "broken" = bubble (the addEventListener default) — inner fires first
    renderBroken(viewport) {
      if (unwire) unwire();
      viewport.innerHTML = template();
      unwire = wireBoxes(viewport, false);
    },
    // "fixed" = capture: true — outer fires first, matching real "click outside" widgets
    renderFixed(viewport) {
      if (unwire) unwire();
      viewport.innerHTML = template();
      unwire = wireBoxes(viewport, true);
    },
    defaultState: 'fixed',
  });
}
