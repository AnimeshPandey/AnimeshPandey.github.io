import { wireToggleDemo } from './_demo-utils.js';

function flow(active) {
  const steps = ['Host (AI app)', 'Client (adapter)', 'Server (your tools)'];
  return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px;">${steps.map((s, i) => {
    const on = i <= active;
    return `<div style="padding:8px 12px;border-radius:6px;font-size:11px;border:1px solid ${on ? 'var(--casebook-accent)' : 'var(--casebook-border)'};background:${on ? 'color-mix(in srgb, var(--casebook-accent) 12%, var(--casebook-surface))' : 'var(--casebook-surface-2)'};">${s}</div>${i < 2 ? '<span aria-hidden="true">→</span>' : ''}`;
  }).join('')}</div>`;
}

export function initDemo(root) {
  let step = 0;
  let timer;
  wireToggleDemo(root, {
    renderBroken(vp) {
      clearInterval(timer);
      vp.innerHTML = `<div style="padding:8px;"><p style="font-size:11px;padding:0 12px;color:var(--casebook-ink-faint);">Unclear roles — tool call path ambiguous.</p>${flow(1)}<p style="font-size:12px;padding:0 12px;color:var(--casebook-ink-muted);">Where does your code live?</p></div>`;
    },
    renderFixed(vp) {
      vp.innerHTML = `<div style="padding:8px;"><p style="font-size:11px;padding:0 12px;color:var(--casebook-ink-faint);">Tool call animates Host → Client → Server → back.</p><div id="cbk-flow">${flow(0)}</div></div>`;
      const el = vp.querySelector('#cbk-flow');
      step = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        step = (step + 1) % 4;
        el.innerHTML = flow(step === 3 ? 2 : step);
      }, 900);
    },
  });
}
