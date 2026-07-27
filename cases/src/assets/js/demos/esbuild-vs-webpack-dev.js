/**
 * demos/esbuild-vs-webpack-dev.js
 * Export: initDemo(root)
 * Broken (labeled "webpack pipeline"): "Run dev build" steps through a
 *         sequence of stages one at a time, in a single lane, mirroring a
 *         single-threaded JS process running a loader chain — each stage
 *         has to finish before the next starts.
 * Fixed (labeled "esbuild pipeline"): the same total module count is
 *         processed across several parallel lanes at once, and the whole
 *         pipeline has fewer, cheaper stages — mirroring native code with
 *         no loader-chain overhead and real multi-core parallelism.
 * All timings are simulated and illustrative of the *mechanism* (sequential
 * single-lane vs. parallel multi-lane, more stages vs. fewer), not a
 * benchmark of any real project — the prose says so explicitly.
 */

import { PRM } from './_demo-utils.js';

const WEBPACK_STAGES = [
  { label: 'Cold JS VM warm-up', ms: 700 },
  { label: 'Resolve loader chain (babel-loader → ts-loader → css-loader)', ms: 500 },
  { label: 'Parse + transform 400 modules (one loader stage at a time)', ms: 2600 },
  { label: 'Bundle & emit', ms: 400 },
];

const ESBUILD_LANES = 4; // simulated CPU cores working in parallel
const ESBUILD_PARSE_MS = 90;
const ESBUILD_EMIT_MS = 35;

function barRow(label, id) {
  return `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--casebook-ink-faint);margin-bottom:3px;">
        <span>${label}</span>
        <span id="${id}-t" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;"></span>
      </div>
      <div style="height:8px;border-radius:4px;background:var(--casebook-surface-2);overflow:hidden;">
        <div id="${id}" style="height:100%;width:0%;background:var(--casebook-accent);transition:width 0.25s linear;"></div>
      </div>
    </div>`;
}

function setupWebpack(vp) {
  vp.innerHTML = `
    <div style="padding:6px 4px;">
      <button id="cbk-evw-run" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:14px;">
        Run dev build (webpack)
      </button>
      <div id="cbk-evw-stages"></div>
      <p id="cbk-evw-total" style="font-size:12px;font-weight:600;margin:10px 0 0;color:var(--casebook-ink-faint);"></p>
    </div>`;
  const btn = vp.querySelector('#cbk-evw-run');
  const stagesEl = vp.querySelector('#cbk-evw-stages');
  const totalEl = vp.querySelector('#cbk-evw-total');
  if (!btn) return;

  btn.addEventListener('click', () => {
    btn.disabled = true;
    stagesEl.innerHTML = WEBPACK_STAGES.map((s, i) => barRow(s.label, `cbk-evw-bar${i}`)).join('');
    totalEl.textContent = '';
    const factor = PRM ? 0.02 : 1; // near-instant under reduced motion, real animation otherwise
    let elapsed = 0;
    let i = 0;

    function next() {
      if (i >= WEBPACK_STAGES.length) {
        totalEl.textContent = `Total: ~${elapsed}ms for 400 modules, single lane, ${WEBPACK_STAGES.length} sequential stages`;
        btn.disabled = false;
        return;
      }
      const stage = WEBPACK_STAGES[i];
      const bar = vp.querySelector(`#cbk-evw-bar${i}`);
      const t = vp.querySelector(`#cbk-evw-bar${i}-t`);
      if (bar) requestAnimationFrame(() => { bar.style.width = '100%'; });
      setTimeout(() => {
        elapsed += stage.ms;
        if (t) t.textContent = `+${stage.ms}ms`;
        i++;
        next();
      }, stage.ms * factor);
    }
    next();
  });
}

function setupEsbuild(vp) {
  vp.innerHTML = `
    <div style="padding:6px 4px;">
      <button id="cbk-evw-run" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:14px;">
        Run dev build (esbuild)
      </button>
      <div style="font-size:11px;color:var(--casebook-ink-faint);margin-bottom:6px;">Parse + transform + print — 400 modules across ${ESBUILD_LANES} parallel lanes</div>
      <div id="cbk-evw-lanes" style="display:grid;grid-template-columns:repeat(${ESBUILD_LANES},1fr);gap:6px;margin-bottom:10px;"></div>
      <div id="cbk-evw-stages"></div>
      <p id="cbk-evw-total" style="font-size:12px;font-weight:600;margin:10px 0 0;color:var(--casebook-accent);"></p>
    </div>`;
  const btn = vp.querySelector('#cbk-evw-run');
  const lanesEl = vp.querySelector('#cbk-evw-lanes');
  const stagesEl = vp.querySelector('#cbk-evw-stages');
  const totalEl = vp.querySelector('#cbk-evw-total');
  if (!btn) return;

  lanesEl.innerHTML = Array.from({ length: ESBUILD_LANES }, (_, i) => `
    <div style="height:24px;border-radius:4px;background:var(--casebook-surface-2);overflow:hidden;">
      <div id="cbk-evw-lane${i}" style="height:100%;width:0%;background:var(--casebook-accent);transition:width 0.15s linear;"></div>
    </div>`).join('');

  btn.addEventListener('click', () => {
    btn.disabled = true;
    stagesEl.innerHTML = barRow('Bundle & emit', 'cbk-evw-emit');
    totalEl.textContent = '';
    for (let i = 0; i < ESBUILD_LANES; i++) {
      const lane = vp.querySelector(`#cbk-evw-lane${i}`);
      if (lane) requestAnimationFrame(() => { lane.style.width = '100%'; });
    }
    const factor = PRM ? 0.02 : 1;

    setTimeout(() => {
      const emitBar = vp.querySelector('#cbk-evw-emit');
      const emitT = vp.querySelector('#cbk-evw-emit-t');
      if (emitBar) requestAnimationFrame(() => { emitBar.style.width = '100%'; });
      setTimeout(() => {
        if (emitT) emitT.textContent = `+${ESBUILD_EMIT_MS}ms`;
        const total = ESBUILD_PARSE_MS + ESBUILD_EMIT_MS;
        totalEl.textContent = `Total: ~${total}ms for 400 modules, ${ESBUILD_LANES} parallel lanes, 2 stages`;
        btn.disabled = false;
      }, ESBUILD_EMIT_MS * factor);
    }, ESBUILD_PARSE_MS * factor);
  });
}

export function initDemo(root) {
  const viewport = root.querySelector('#demo-viewport, .case-demo__viewport');
  const stateLabel = root.querySelector('.case-demo__state-label');
  const brokenBtn = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn = root.querySelector('[data-demo-state="fixed"]');

  function render(state) {
    if (viewport) {
      if (state === 'broken') setupWebpack(viewport);
      else setupEsbuild(viewport);
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
