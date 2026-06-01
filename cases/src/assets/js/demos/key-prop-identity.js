import { wireToggleDemo, PRM, simulateAsync } from './_demo-utils.js';

const ITEMS = [
  { id: 'a1', label: 'Abort controllers',  color: '#5b8dd9' },
  { id: 'b2', label: 'CSS stacking ctx',   color: '#e07b39' },
  { id: 'c3', label: 'Font loading CLS',   color: '#59b37a' },
  { id: 'd4', label: 'Key prop identity',  color: '#c45aed' },
  { id: 'e5', label: 'Skeleton screens',   color: '#d4a017' },
];

function listHTML(items) {
  return items.map(item => `
<div id="item-${item.id}" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);margin-bottom:6px;">
  <span style="width:10px;height:10px;border-radius:50%;background:${item.color};flex-shrink:0;"></span>
  <span style="font-size:13px;">${item.label}</span>
</div>`).join('');
}

async function flashAll(vp) {
  const els = vp.querySelectorAll('[id^="item-"]');
  els.forEach(el => { el.style.outline = '2px solid var(--casebook-accent)'; el.style.background = 'color-mix(in srgb, var(--casebook-accent) 12%, var(--casebook-surface-2))'; });
  await simulateAsync(300);
  els.forEach(el => { el.style.outline = ''; el.style.background = 'var(--casebook-surface-2)'; });
}

async function flashChanged(vp, oldOrder, newOrder) {
  for (let i = 0; i < newOrder.length; i++) {
    if (newOrder[i].id !== oldOrder[i].id) {
      const el = vp.querySelector('#item-' + newOrder[i].id);
      if (el) {
        el.style.outline = '2px solid var(--casebook-accent)';
        el.style.background = 'color-mix(in srgb, var(--casebook-accent) 12%, var(--casebook-surface-2))';
        await simulateAsync(250);
        el.style.outline = '';
        el.style.background = 'var(--casebook-surface-2)';
      }
    }
  }
}

export function initDemo(root) {
  function setup(vp, useStableKey) {
    let order = [...ITEMS];
    let sorting = false;

    function draw() {
      const list = vp.querySelector('#cbk-list');
      if (list) list.innerHTML = listHTML(order);
    }

    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
  ${useStableKey ? '✓ Stable ID key — only moved items flash' : '✗ Index key — all items flash on every sort'}
</p>
<div id="cbk-list">${listHTML(order)}</div>
<button id="cbk-sort" style="margin-top:10px;padding:6px 16px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;color:var(--casebook-ink-muted);">Sort A→Z</button>
</div>`;

    vp.querySelector('#cbk-sort').addEventListener('click', async () => {
      if (sorting) return;
      sorting = true;
      const prev = [...order];
      order = [...order].sort((a, b) => a.label.localeCompare(b.label));
      if (PRM || useStableKey) {
        draw();
        if (!PRM && useStableKey) await flashChanged(vp, prev, order);
      } else {
        draw();
        await flashAll(vp);
      }
      sorting = false;
    });
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
