/**
 * demos/debug-coach-socratic.js
 * Export: initDemo(root)
 * Broken: a scripted chat that hands back a full fix in a single assistant
 *         turn — no diagnostic steps for the user to perform.
 * Fixed:  a scripted chat that asks guiding questions first, and only
 *         reaches the fix after the user has walked expected-vs-actual,
 *         traced the data source, and confirmed the timing issue.
 * Both are click-through scripts (no live model call — this project has no
 * API keys wired into demos), but the two transcripts are real, distinct
 * conversations, not a static before/after image.
 */

const BROKEN_SCRIPT = [
  { from: 'user', text: "TypeError: Cannot read properties of undefined (reading 'map') — here's my component, just fix it." },
  { from: 'assistant', text: "Add a fallback: change items.map(...) to items?.map(...), or default the prop to []. Here's the diff. Done." },
];

const FIXED_SCRIPT = [
  { from: 'user', text: "TypeError: Cannot read properties of undefined (reading 'map') — here's my component." },
  { from: 'assistant', text: 'Before I point at a fix — what did you expect "items" to be at that line, and what did you actually get?' },
  { from: 'user', text: 'I expected an array. It was undefined.' },
  { from: 'assistant', text: 'Where does "items" come from — a prop, an API response, local state?' },
  { from: 'user', text: 'A prop, passed down from the parent.' },
  { from: 'assistant', text: 'Does the parent render this component before that data has finished loading?' },
  { from: 'user', text: '...yes. Before the fetch resolves.' },
  { from: 'assistant', text: "That's the bug — you're rendering while items is still undefined. So: how would you guard for that state?" },
];

function setup(vp, script, mode) {
  let i = 0;
  vp.innerHTML = `
    <div style="padding:6px 4px;">
      <div id="cbk-dc-log" style="display:flex;flex-direction:column;gap:8px;min-height:170px;margin-bottom:12px;" aria-live="polite"></div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button id="cbk-dc-next" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">
          ${mode === 'broken' ? 'Paste stack trace' : 'Send stack trace'}
        </button>
        <span id="cbk-dc-status" style="font-size:11.5px;color:var(--casebook-ink-faint);"></span>
      </div>
    </div>`;

  const log = vp.querySelector('#cbk-dc-log');
  const btn = vp.querySelector('#cbk-dc-next');
  const status = vp.querySelector('#cbk-dc-status');
  if (!log || !btn) return;

  function bubble(turn) {
    const el = document.createElement('div');
    const isUser = turn.from === 'user';
    el.style.cssText = `align-self:${isUser ? 'flex-end' : 'flex-start'};max-width:88%;padding:8px 12px;border-radius:10px;font-size:12.5px;line-height:1.45;border:1px solid var(--casebook-border);background:${isUser ? 'var(--casebook-accent)' : 'var(--casebook-surface-2)'};color:${isUser ? 'var(--casebook-bg)' : 'var(--casebook-ink)'};`;
    el.textContent = turn.text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  function step() {
    if (i >= script.length) return;
    bubble(script[i]);
    i++;
    const done = i >= script.length;

    if (mode === 'broken') {
      status.textContent = done ? 'Fix handed over in 1 turn. Diagnostic steps performed by the user: 0.' : '';
    } else {
      const assistantTurnsShown = script.slice(0, i).filter((t) => t.from === 'assistant').length;
      status.textContent = `Guiding questions answered: ${done ? assistantTurnsShown - 1 : assistantTurnsShown}`;
    }

    if (done) {
      btn.disabled = true;
      btn.textContent = mode === 'broken' ? 'Fix applied' : 'Diagnosis complete';
    } else {
      btn.textContent = 'Next';
    }
  }

  btn.addEventListener('click', step);
}

export function initDemo(root) {
  const viewport = root.querySelector('#demo-viewport, .case-demo__viewport');
  const stateLabel = root.querySelector('.case-demo__state-label');
  const brokenBtn = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn = root.querySelector('[data-demo-state="fixed"]');

  function render(state) {
    if (viewport) setup(viewport, state === 'broken' ? BROKEN_SCRIPT : FIXED_SCRIPT, state);
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
