/**
 * demos/fe-mastery-agent-l2.js
 * Export: initDemo(root)
 *
 * Static bar-chart comparison of a support-triage team's weekly
 * engineering-time split before ("hand-rolled/stuck") and after
 * ("hosted platform/graduated") migrating orchestration to a managed
 * agent platform. Numbers are illustrative, chosen to be a believable
 * real-world split, not measured data.
 */
import { wireToggleDemo } from './_demo-utils.js';

const CATEGORIES = [
  { key: 'logic', label: 'Agent logic (prompt, tools, triage rules)', color: 'var(--casebook-accent)' },
  { key: 'retries', label: 'Debugging retries', color: 'var(--casebook-critical, #b23b3b)' },
  { key: 'persistence', label: 'Lost-state / persistence bugs', color: 'var(--casebook-critical, #b23b3b)' },
  { key: 'observability', label: 'Figuring out what a stuck run is doing', color: '#c98a2c' },
  { key: 'scaling', label: 'Worker-pool / queue firefighting', color: '#c98a2c' },
];

const HAND_ROLLED = { logic: 15, retries: 30, persistence: 25, observability: 20, scaling: 10 };
const HOSTED = { logic: 70, retries: 5, persistence: 5, observability: 10, scaling: 10 };

function bars(data, title) {
  const rows = CATEGORIES.map((c) => `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--casebook-ink-muted);margin-bottom:2px;">
        <span>${c.label}</span><span>${data[c.key]}%</span>
      </div>
      <div style="background:var(--casebook-border);border-radius:4px;height:10px;overflow:hidden;">
        <div style="width:${data[c.key]}%;background:${c.color};height:100%;"></div>
      </div>
    </div>`).join('');
  return `
    <p style="font-size:12px;font-weight:600;margin:0 0 10px;">${title}</p>
    ${rows}
  `;
}

function renderBroken(vp) {
  vp.innerHTML = `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 12px;">✗ Hand-rolled loop — orchestration debugging eats most of the week.</p>
    ${bars(HAND_ROLLED, "This team's last week")}
    <p style="font-size:12px;color:var(--casebook-ink-muted);margin-top:10px;">Only 15% of the week went into the agent's actual triage logic. The rest went into infrastructure this team never intended to become experts in.</p>
  `;
}

function renderFixed(vp) {
  vp.innerHTML = `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 12px;">✓ Hosted platform — orchestration is the platform's job now.</p>
    ${bars(HOSTED, "Same team's week, after graduating")}
    <p style="font-size:12px;color:var(--casebook-ink-muted);margin-top:10px;">70% of the week went into the agent's actual decisions and tools — persistence, retries, observability, and scaling stopped being this team's weekly problem.</p>
  `;
}

export function initDemo(root) {
  wireToggleDemo(root, { renderBroken, renderFixed });
}
