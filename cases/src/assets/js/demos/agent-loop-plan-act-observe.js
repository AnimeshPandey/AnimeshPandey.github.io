import { wireToggleDemo, PRM } from './_demo-utils.js';

// Same physical triangle layout for both modes, so the contrast is visual:
// broken never reaches / never returns to OBSERVE, fixed cycles through all three.
const NODE_POS = {
  top: { left: '50%', top: '12%' },
  right: { left: '82%', top: '80%' },
  left: { left: '18%', top: '80%' },
};

function stageHtml(nodes, dotStart) {
  const nodeDivs = Object.entries(nodes).map(([key, n]) => `
    <div class="alpo-node" id="alpo-node-${key}" style="position:absolute;left:${NODE_POS[n.pos].left};top:${NODE_POS[n.pos].top};transform:translate(-50%,-50%);width:76px;height:76px;border-radius:50%;border:2px solid var(--casebook-border);background:var(--casebook-surface-2);display:flex;align-items:center;justify-content:center;text-align:center;font-size:10px;font-weight:700;letter-spacing:.03em;color:var(--casebook-ink-muted);transition:border-color 220ms,color 220ms,box-shadow 220ms;${n.disabled ? 'opacity:.4;border-style:dashed;' : ''}">${n.label}</div>`).join('');

  const dotPos = NODE_POS[dotStart];
  return `
    <div style="position:relative;height:190px;margin-bottom:6px;">
      <svg style="position:absolute;inset:0;width:100%;height:100%;" aria-hidden="true">
        <line x1="50%" y1="12%" x2="82%" y2="80%" stroke="var(--casebook-border)" stroke-width="1.5" />
        <line x1="82%" y1="80%" x2="18%" y2="80%" stroke="var(--casebook-border)" stroke-width="1.5" />
        <line x1="18%" y1="80%" x2="50%" y2="12%" stroke="var(--casebook-border)" stroke-width="1.5" stroke-dasharray="${nodes.left && nodes.left.disabled ? '4 4' : '0'}" />
      </svg>
      ${nodeDivs}
      <div id="alpo-dot" style="position:absolute;left:${dotPos.left};top:${dotPos.top};transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:var(--casebook-accent);box-shadow:0 0 0 4px color-mix(in srgb, var(--casebook-accent) 25%, transparent);transition:left ${PRM ? 0 : 650}ms ease,top ${PRM ? 0 : 650}ms ease;"></div>
    </div>`;
}

function setActive(vp, key, active) {
  const el = vp.querySelector(`#alpo-node-${key}`);
  if (!el) return;
  if (active) {
    el.style.borderColor = 'var(--casebook-accent)';
    el.style.color = 'var(--casebook-ink)';
    el.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--casebook-accent) 20%, transparent)';
  } else {
    el.style.borderColor = 'var(--casebook-border)';
    el.style.color = 'var(--casebook-ink-muted)';
    el.style.boxShadow = 'none';
  }
}

function moveDot(vp, pos) {
  const dot = vp.querySelector('#alpo-dot');
  if (!dot) return;
  dot.style.left = NODE_POS[pos].left;
  dot.style.top = NODE_POS[pos].top;
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, PRM ? Math.min(ms, 60) : ms));
}

function renderBroken(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">✗ One model call, one execution, no check — the loop never closes.</p>
      ${stageHtml({
        top: { label: 'MODEL CALL', pos: 'top' },
        right: { label: 'EXECUTE', pos: 'right' },
        left: { label: 'OBSERVE', pos: 'left', disabled: true },
      }, 'top')}
      <p id="alpo-broken-status" style="font-size:12px;color:var(--casebook-ink-muted);min-height:38px;margin:0 0 10px;">Ready — task: "restart the payments service."</p>
      <button id="alpo-broken-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">▶ Run agent</button>
    </div>`;

  const status = vp.querySelector('#alpo-broken-status');
  const btn = vp.querySelector('#alpo-broken-run');

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    setActive(vp, 'top', false); setActive(vp, 'right', false);
    moveDot(vp, 'top');
    status.textContent = 'Model call: "restart-service.sh payments" (wrong container — never checked).';
    await wait(300);
    setActive(vp, 'top', true);
    await wait(500);
    setActive(vp, 'top', false);
    moveDot(vp, 'right');
    await wait(650);
    setActive(vp, 'right', true);
    status.textContent = 'Executing… command exits 0.';
    await wait(600);
    status.innerHTML = 'Reported: <strong>"Done."</strong> <span style="color:#B2555D;">Payments is still down — nothing ever observed the real result.</span>';
    btn.disabled = false;
  });
}

function renderFixed(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">✓ Plan → act → observe, replanning on the real result until it's actually verified.</p>
      ${stageHtml({
        top: { label: 'PLAN', pos: 'top' },
        right: { label: 'ACT', pos: 'right' },
        left: { label: 'OBSERVE', pos: 'left' },
      }, 'top')}
      <p id="alpo-fixed-status" style="font-size:12px;color:var(--casebook-ink-muted);min-height:38px;margin:0 0 10px;">Ready — task: "restart the payments service."</p>
      <button id="alpo-fixed-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">▶ Run loop</button>
    </div>`;

  const status = vp.querySelector('#alpo-fixed-status');
  const btn = vp.querySelector('#alpo-fixed-run');

  const cycle = [
    { pos: 'top', node: 'top', text: 'Plan: restart the payments service.' },
    { pos: 'right', node: 'right', text: 'Act: run restart-service.sh payments.' },
    { pos: 'left', node: 'left', text: 'Observe: exit 0, but health check still failing — wrong container.' },
    { pos: 'top', node: 'top', text: 'Plan (replanned): target the correct container this time.' },
    { pos: 'right', node: 'right', text: 'Act: run restart-service.sh payments --container=prod-2.' },
    { pos: 'left', node: 'left', text: 'Observe: health check passing — service healthy.' },
  ];

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    ['top', 'right', 'left'].forEach((k) => setActive(vp, k, false));

    for (const step of cycle) {
      moveDot(vp, step.pos);
      await wait(PRM ? 60 : 350);
      ['top', 'right', 'left'].forEach((k) => setActive(vp, k, k === step.node));
      status.textContent = step.text;
      await wait(PRM ? 60 : 550);
    }

    ['top', 'right', 'left'].forEach((k) => setActive(vp, k, false));
    status.innerHTML = '<strong style="color:var(--casebook-accent);">Task complete</strong> — verified against a real observation, not the first guess.';
    btn.disabled = false;
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken,
    renderFixed,
  });
}
