import { wireToggleDemo } from './_demo-utils.js';

const PROPOSED_ACTION = {
  tool: 'deploy_config_change',
  params: { flag: 'checkout-v2-rollout', from: '45%', to: '0%' },
};

function renderBroken(vp) {
  vp.innerHTML = `
    <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      The agent decides and executes in the same step.
    </p>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
      <button id="cbk-appr-propose" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;">Agent proposes an action</button>
    </div>
    <div id="cbk-appr-log" style="font-size:12px;font-family:var(--casebook-mono, monospace);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:70px;white-space:pre-line;">Click to have the agent propose an action.</div>
  `;
  vp.querySelector('#cbk-appr-propose').addEventListener('click', () => {
    const log = vp.querySelector('#cbk-appr-log');
    log.style.color = 'var(--casebook-critical, #b23b3b)';
    log.textContent =
      `Proposing: ${PROPOSED_ACTION.tool}(${PROPOSED_ACTION.params.flag}: ${PROPOSED_ACTION.params.from} → ${PROPOSED_ACTION.params.to})\n` +
      `EXECUTED IMMEDIATELY — no review step. Live now.`;
  });
}

function renderFixed(vp) {
  let state = 'idle'; // idle | pending | approved | rejected

  function render() {
    vp.innerHTML = `
      <p style="font-size:12px;color:var(--casebook-ink-faint);margin:0 0 10px;">
        The proposal sits in a pending-approval state until a human decides.
      </p>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
        <button id="cbk-appr-propose2" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;" ${state !== 'idle' ? 'disabled' : ''}>Agent proposes an action</button>
        <button id="cbk-appr-approve" style="padding:7px 14px;background:var(--casebook-surface);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;" ${state !== 'pending' ? 'disabled' : ''}>Approve</button>
        <button id="cbk-appr-reject" style="padding:7px 14px;background:var(--casebook-surface);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;" ${state !== 'pending' ? 'disabled' : ''}>Reject</button>
      </div>
      <div id="cbk-appr-log2" style="font-size:12px;font-family:var(--casebook-mono, monospace);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:70px;white-space:pre-line;">
        ${state === 'idle' ? 'Click to have the agent propose an action.' : ''}
        ${state === 'pending' ? `PENDING APPROVAL:\n${PROPOSED_ACTION.tool}(${PROPOSED_ACTION.params.flag}: ${PROPOSED_ACTION.params.from} → ${PROPOSED_ACTION.params.to})\nNot executed yet.` : ''}
        ${state === 'approved' ? `Approved — ${PROPOSED_ACTION.tool}(${PROPOSED_ACTION.params.flag}: ${PROPOSED_ACTION.params.from} → ${PROPOSED_ACTION.params.to}) executed now.` : ''}
        ${state === 'rejected' ? 'Rejected — action cancelled, nothing executed.' : ''}
      </div>
    `;
    vp.querySelector('#cbk-appr-propose2').addEventListener('click', () => { state = 'pending'; render(); });
    const approveBtn = vp.querySelector('#cbk-appr-approve');
    const rejectBtn = vp.querySelector('#cbk-appr-reject');
    if (approveBtn) approveBtn.addEventListener('click', () => { state = 'approved'; render(); });
    if (rejectBtn) rejectBtn.addEventListener('click', () => { state = 'rejected'; render(); });
  }

  render();
}

export function initDemo(root) {
  wireToggleDemo(root, { renderBroken, renderFixed });
}
