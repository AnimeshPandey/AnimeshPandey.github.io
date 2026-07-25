import { wireToggleDemo } from './_demo-utils.js';

const SOURCE_LINES = [
  { code: 'function formatPrice(cents) {', kind: 'ctx' },
  { code: '  if (cents == null) return —;', kind: 'removed' },
  { code: '  return $(cents / 100).toFixed(2);', kind: 'ctx' },
  { code: '}', kind: 'ctx' },
];

function renderBroken(vp) {
  vp.innerHTML = `
    <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      Suggestion applied straight to the file — no diff, no confirmation.
    </p>
    <pre style="font-size:12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;padding:10px;margin:0 0 12px;overflow-x:auto;"><code>function formatPrice(cents) {
  return ${(cents / 100).toFixed(2)};
}</code></pre>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
      <button id="cbk-diff-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;">Render price while still loading</button>
    </div>
    <div id="cbk-diff-result" style="font-size:13px;padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:20px;">Price: <span id="cbk-diff-price">—</span></div>
  `;
  vp.querySelector('#cbk-diff-run').addEventListener('click', () => {
    const cents = null; // still loading
    const price = cents == null ? undefined : (cents / 100).toFixed(2);
    vp.querySelector('#cbk-diff-price').textContent = '$' + price; // "$undefined", the real bug
    vp.querySelector('#cbk-diff-result').style.color = 'var(--casebook-critical, #b23b3b)';
  });
}

function renderFixed(vp) {
  let decided = null;

  function renderDiff() {
    const lines = SOURCE_LINES.map((l) => {
      const bg = l.kind === 'removed' && decided !== 'accepted'
        ? 'background:rgba(178,59,59,0.12);text-decoration:line-through;color:var(--casebook-critical, #b23b3b);'
        : '';
      const marker = l.kind === 'removed' ? (decided === 'accepted' ? '  ' : '- ') : '  ';
      return `<div style="${bg}padding:1px 4px;">${marker}${l.code}</div>`;
    }).join('');
    return `<pre style="font-size:12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;padding:10px;margin:0 0 12px;overflow-x:auto;font-family:var(--casebook-mono,monospace);"><code>${lines}</code></pre>`;
  }

  function render() {
    vp.innerHTML = `
      <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0 0 10px;">
        Suggestion proposes a diff — nothing merges until you decide.
      </p>
      ${renderDiff()}
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
        <button id="cbk-diff-reject" style="padding:7px 14px;background:var(--casebook-surface);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;" ${decided ? 'disabled' : ''}>Reject (keep the guard)</button>
        <button id="cbk-diff-accept" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;" ${decided ? 'disabled' : ''}>Accept</button>
      </div>
      <div id="cbk-diff-result" style="font-size:13px;padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:20px;">
        ${decided === 'accepted' ? 'Accepted — guard removed. Price while loading: <strong style="color:var(--casebook-critical,#b23b3b);">$undefined</strong>' : decided === 'rejected' ? 'Rejected — guard kept. Price while loading: <strong>—</strong>' : 'Waiting for a decision…'}
      </div>
    `;
    vp.querySelector('#cbk-diff-accept').addEventListener('click', () => { decided = 'accepted'; render(); });
    vp.querySelector('#cbk-diff-reject').addEventListener('click', () => { decided = 'rejected'; render(); });
  }

  render();
}

export function initDemo(root) {
  wireToggleDemo(root, { renderBroken, renderFixed });
}
