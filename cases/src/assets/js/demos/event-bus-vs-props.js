/**
 * demos/event-bus-vs-props.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": simulates tracing the same stale-cart-total bug two
 * ways — via a global event bus with several independent emitters, and
 * via an explicit props chain with a single source. Clicking "Trace the
 * bug" reveals a simulated search log; no real event bus or component
 * tree runs behind this, it's an illustrative trace of the two workflows.
 */
import { wireToggleDemo } from './_demo-utils.js';

function shell(introText, buttonLabel) {
  return `
    <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      ${introText}
    </p>
    <button id="cbk-ebp-trace" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:10px;">${buttonLabel}</button>
    <div id="cbk-ebp-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:150px;white-space:pre-line;">Click above to trace the stale $42 total.</div>
  `;
}

function setupBroken(vp) {
  vp.innerHTML = shell(
    'Bug report: cart total shows $42, items add up to $38.',
    'Trace the bug (event bus)'
  );
  const log = vp.querySelector('#cbk-ebp-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-ebp-trace').addEventListener('click', () => {
    lines.length = 0;
    push('grep -r "cart:update" src/  →  11 matches across 11 files');
    push('  CouponPanel.js, ShippingEstimator.js, LoyaltyWidget.js,');
    push('  PromoBanner.js, GiftCardForm.js, TaxCalculator.js, ...');
    push('No file imports another. No call stack connects them.');
    push('Add console.trace() to all 11 emitters. Reproduce live.');
    push('...45 minutes later: CouponPanel and ShippingEstimator both');
    push('emit within the same tick — second one silently wins.');
    push('RESULT: found it, but only by instrumenting every suspect.');
  });
}

function setupFixed(vp) {
  vp.innerHTML = shell(
    'Bug report: cart total shows $42, items add up to $38.',
    'Trace the bug (props)'
  );
  const log = vp.querySelector('#cbk-ebp-log');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };

  vp.querySelector('#cbk-ebp-trace').addEventListener('click', () => {
    lines.length = 0;
    push('<Cart total={cartTotal} /> — "go to definition" on cartTotal');
    push('→ lands in CartTotalStore.compute(), the one write path.');
    push('compute() reads coupon, shipping, and tax as arguments —');
    push('no other file can set the total directly, only this function.');
    push('Read compute(): shipping recalculation ran after coupon');
    push('recalculation using a stale coupon value. One function,');
    push('one place to look, bug found by reading, not instrumenting.');
    push('RESULT: found it by following one variable to its source.');
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
