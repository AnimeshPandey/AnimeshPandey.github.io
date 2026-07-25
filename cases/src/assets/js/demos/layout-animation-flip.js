import { wireToggleDemo, PRM } from './_demo-utils.js';

const ITEM_COUNT = 6;
const COLORS = ['#BF5A32', '#3F7A5C', '#A8721F', '#5B7FA6', '#8A5A9C', '#B2555D'];

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function renderList(vp, order, useFlip) {
  vp.innerHTML = `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      ${useFlip ? '✓ FLIP — animates only transform' : '✗ Direct top animation — forces layout every frame'}
    </p>
    <button id="cbk-flip-shuffle" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:12px;">Shuffle</button>
    <div id="cbk-flip-list" style="position:relative;height:${ITEM_COUNT * 34}px;"></div>
  `;
  const list = vp.querySelector('#cbk-flip-list');

  function draw(currentOrder, animate) {
    const items = currentOrder.map((n, idx) => {
      let el = list.querySelector('[data-n="' + n + '"]');
      const first = el ? el.getBoundingClientRect() : null;
      if (!el) {
        el = document.createElement('div');
        el.dataset.n = n;
        el.textContent = 'Item ' + n;
        el.style.cssText =
          'position:absolute;left:0;width:100%;height:28px;line-height:28px;padding-left:10px;' +
          'border-radius:5px;color:#fff;font-size:12px;box-sizing:border-box;' +
          'background:' + COLORS[n % COLORS.length] + ';';
        list.appendChild(el);
      }
      return { el, idx, first };
    });

    items.forEach(({ el, idx, first }) => {
      const top = idx * 34;
      if (!animate || PRM) {
        el.style.transition = 'none';
        el.style.top = top + 'px';
        return;
      }
      if (useFlip) {
        // Last: jump straight to the new position.
        el.style.transition = 'none';
        el.style.top = top + 'px';
        const last = el.getBoundingClientRect();
        const dy = (first ? first.top : last.top) - last.top;
        if (dy !== 0) {
          // Invert: fake the old position with a transform, no transition.
          el.style.transform = 'translateY(' + dy + 'px)';
          // Play: next frame, remove the transform with a transition — only ever animates transform.
          requestAnimationFrame(() => {
            el.style.transition = 'transform 320ms ease';
            el.style.transform = 'translateY(0)';
          });
        }
      } else {
        // Broken: animate the layout-affecting `top` property directly.
        el.style.transition = 'top 320ms ease';
        el.style.top = top + 'px';
      }
    });
  }

  draw(order, false);
  vp.querySelector('#cbk-flip-shuffle').addEventListener('click', () => {
    order = shuffle(order);
    draw(order, true);
  });
}

export function initDemo(root) {
  const initialOrder = Array.from({ length: ITEM_COUNT }, (_, i) => i);
  wireToggleDemo(root, {
    renderBroken: (vp) => renderList(vp, initialOrder, false),
    renderFixed: (vp) => renderList(vp, initialOrder, true),
  });
}
