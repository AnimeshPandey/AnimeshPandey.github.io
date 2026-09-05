/**
 * demos/anchoring-first-number.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": renders the same 3 pricing tiers (identical prices,
 * features, and "Most popular" highlight on Pro) in both modes — the only
 * difference is left-to-right order. "Broken" = ascending (cheapest-first,
 * the un-examined default). "Fixed" = descending (priciest-first, anchors
 * the reader high before they reach the Pro tier).
 */
import { wireToggleDemo } from './_demo-utils.js';

const TIERS = [
  { name: 'Basic', price: 9, features: ['1 project', 'Community support'] },
  { name: 'Pro', price: 29, features: ['Unlimited projects', 'Priority support', 'Team seats'], popular: true },
  { name: 'Enterprise', price: 99, features: ['Everything in Pro', 'SSO', 'Dedicated account manager'] },
];

function card(tier) {
  const border = tier.popular ? '2px solid var(--casebook-accent)' : '1px solid var(--casebook-border)';
  return `
    <div style="flex:1;min-width:130px;border:${border};border-radius:10px;padding:14px;position:relative;background:var(--casebook-bg);">
      ${tier.popular ? '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--casebook-accent);color:var(--casebook-bg);font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;">MOST POPULAR</div>' : ''}
      <div style="font-size:12.5px;font-weight:700;margin-bottom:4px;">${tier.name}</div>
      <div style="font-size:22px;font-weight:700;margin-bottom:8px;">$${tier.price}<span style="font-size:11px;font-weight:400;color:var(--casebook-ink-faint);">/mo</span></div>
      <ul style="margin:0;padding-left:16px;font-size:11.5px;color:var(--casebook-ink-faint);line-height:1.6;">
        ${tier.features.map((f) => `<li>${f}</li>`).join('')}
      </ul>
    </div>
  `;
}

function setup(vp, mode) {
  const ordered = mode === 'broken' ? TIERS : [...TIERS].reverse();
  vp.innerHTML = `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin-bottom:10px;">
      ${mode === 'broken' ? 'Ordered cheapest → most expensive' : 'Ordered most expensive → cheapest'}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      ${ordered.map(card).join('')}
    </div>
  `;
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setup(vp, 'broken'),
    renderFixed: (vp) => setup(vp, 'fixed'),
  });
}
