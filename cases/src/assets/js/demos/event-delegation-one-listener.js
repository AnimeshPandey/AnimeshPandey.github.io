import { wireToggleDemo, PRM, simulateAsync } from './_demo-utils.js';

export function initDemo(root) {
  function setup(vp, delegated) {
    let count = 0;
    let lastClicked = null;

    function makeList(n) {
      return Array.from({ length: n }, (_, i) =>
        `<li data-item="${i + 1}" style="padding:6px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:4px;cursor:pointer;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
          <span>Row ${i + 1}</span>
          ${delegated ? '' : `<span style="font-size:10px;color:var(--casebook-accent);">listener</span>`}
        </li>`
      ).join('');
    }

    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">
  ${delegated ? '✓ One listener on parent — O(1) regardless of row count' : '✗ Per-row listener — O(n) listeners'}
</p>
<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
  <button id="cbk-add10" style="padding:5px 12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:32px;color:var(--casebook-ink-muted);">+ Add 10 rows</button>
  <span id="cbk-listener-badge" style="font-size:11px;color:var(--casebook-ink-faint);">Listeners: <strong id="cbk-lcount">0</strong></span>
</div>
<ul id="cbk-list" style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;max-height:160px;overflow-y:auto;"></ul>
<p id="cbk-clicked" style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;"></p>
</div>`;

    const list = vp.querySelector('#cbk-list');
    const lcount = vp.querySelector('#cbk-lcount');
    let listenerCount = 0;

    function addRows(n) {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        count++;
        const li = document.createElement('li');
        li.dataset.item = count;
        li.style.cssText = 'padding:6px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:4px;cursor:pointer;font-size:12px;display:flex;justify-content:space-between;align-items:center;';
        li.innerHTML = `<span>Row ${count}</span>`;
        if (!delegated) {
          li.innerHTML += `<span style="font-size:10px;color:var(--casebook-accent);">listener</span>`;
          li.addEventListener('click', () => {
            vp.querySelector('#cbk-clicked').textContent = 'Clicked: Row ' + li.dataset.item;
          });
          listenerCount++;
          if (lcount) lcount.textContent = listenerCount;
        }
        frag.appendChild(li);
      }
      list.appendChild(frag);
    }

    if (delegated) {
      listenerCount = 1;
      if (lcount) lcount.textContent = '1';
      list.addEventListener('click', e => {
        const li = e.target.closest('[data-item]');
        if (li) vp.querySelector('#cbk-clicked').textContent = 'Clicked: Row ' + li.dataset.item;
      });
    }

    vp.querySelector('#cbk-add10').addEventListener('click', async () => {
      addRows(10);
    });

    addRows(10);
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
