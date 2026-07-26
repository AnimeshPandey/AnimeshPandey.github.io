import { wireToggleDemo, PRM } from './_demo-utils.js';

const AGENTS = [
  { name: 'Billing Agent', skills: ['invoice-lookup'], auth: 'API key' },
  { name: 'Refunds Agent', skills: ['refund-processing', 'ticket-lookup'], auth: 'OAuth2 Bearer' },
  { name: 'Scheduling Agent', skills: ['callback-scheduling'], auth: 'API key' },
];

const HELD_CREDENTIAL = 'OAuth2 Bearer';
const TASK_SKILL = 'refund-processing';

function agentListHtml(highlightName) {
  return AGENTS.map((a) => {
    const active = a.name === highlightName;
    return `<div style="padding:8px 10px;border-radius:6px;margin-bottom:6px;background:${active ? 'var(--casebook-surface-2)' : 'transparent'};border:1px solid var(--casebook-border);">
      <div style="font-size:12px;font-weight:600;color:var(--casebook-ink);">${a.name}</div>
      <div style="font-size:11px;color:var(--casebook-ink-faint);">skills: ${a.skills.join(', ')} · auth: ${a.auth}</div>
    </div>`;
  }).join('');
}

function renderBroken(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ Routes by matching the task's keywords to an agent's name — no card fetched, nothing verified.</p>
      <p style="font-size:13px;color:var(--casebook-ink);margin:0 0 10px;">Task: "Process a refund for order #4471"</p>
      <button id="a2a-run-broken" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">▶ Route refund request</button>
      <div id="a2a-log-broken" style="margin-top:12px;font-size:12px;color:var(--casebook-ink-muted);min-height:70px;"></div>
    </div>`;

  const btn = vp.querySelector('#a2a-run-broken');
  const log = vp.querySelector('#a2a-log-broken');

  btn.addEventListener('click', () => {
    btn.disabled = true;
    log.innerHTML = `<p style="margin:0 0 6px;">Matching keyword "refund" → "billing"… routing to <strong>Billing Agent</strong> (name match, no card checked).</p>`;

    const delay = PRM ? 0 : 700;
    setTimeout(() => {
      log.innerHTML += `<p style="margin:0 0 6px;color:var(--casebook-ink);">Sending task to Billing Agent…</p>`;
      const delay2 = PRM ? 0 : 700;
      setTimeout(() => {
        log.innerHTML += `<p style="margin:0;color:#B2555D;">✗ Billing Agent declined — its actual skills are <code>invoice-lookup</code> (read-only). Task never processed. UI still shows "Submitted".</p>`;
        btn.disabled = false;
      }, delay2);
    }, delay);
  });
}

function renderFixed(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Fetches every connected agent's Agent Card first, then matches skill and auth before routing.</p>
      <p style="font-size:13px;color:var(--casebook-ink);margin:0 0 10px;">Task: "Process a refund for order #4471" — held credential: ${HELD_CREDENTIAL}</p>
      <button id="a2a-run-fixed" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">▶ Route refund request</button>
      <div id="a2a-cards-fixed" style="margin-top:12px;"></div>
      <div id="a2a-log-fixed" style="margin-top:8px;font-size:12px;color:var(--casebook-ink-muted);min-height:40px;"></div>
    </div>`;

  const btn = vp.querySelector('#a2a-run-fixed');
  const cardsEl = vp.querySelector('#a2a-cards-fixed');
  const log = vp.querySelector('#a2a-log-fixed');

  btn.addEventListener('click', () => {
    btn.disabled = true;
    cardsEl.innerHTML = '';
    log.innerHTML = `<p style="margin:0;">Fetching /.well-known/agent-card.json from 3 connected agents…</p>`;

    const delay = PRM ? 0 : 800;
    setTimeout(() => {
      cardsEl.innerHTML = agentListHtml(null);
      log.innerHTML = `<p style="margin:0 0 6px;">Agent Cards received. Matching skill <code>${TASK_SKILL}</code>…</p>`;

      const delay2 = PRM ? 0 : 700;
      setTimeout(() => {
        const match = AGENTS.find((a) => a.skills.includes(TASK_SKILL));
        cardsEl.innerHTML = agentListHtml(match.name);
        const authOk = match.auth === HELD_CREDENTIAL;
        log.innerHTML += `<p style="margin:0 0 6px;">Skill match: <strong>${match.name}</strong> declares <code>${TASK_SKILL}</code> ✓</p>`;

        const delay3 = PRM ? 0 : 600;
        setTimeout(() => {
          log.innerHTML += `<p style="margin:0;color:${authOk ? '#3E8E5C' : '#B2555D'};">${authOk ? '✓' : '✗'} Auth check: orchestrator holds ${HELD_CREDENTIAL} → ${match.name} requires ${match.auth} — ${authOk ? 'match, routing task.' : 'mismatch, blocked.'}</p>`;
          btn.disabled = false;
        }, delay3);
      }, delay2);
    }, delay);
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken,
    renderFixed,
  });
}
