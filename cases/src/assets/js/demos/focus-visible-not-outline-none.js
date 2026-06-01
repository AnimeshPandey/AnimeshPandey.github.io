import { wireToggleDemo } from './_demo-utils.js';

const ITEMS = [
  { tag: 'button', text: 'Save draft' },
  { tag: 'a',      text: 'View docs', href: '#' },
  { tag: 'button', text: 'Cancel' },
  { tag: 'a',      text: 'Learn more', href: '#' },
  { tag: 'button', text: 'Submit' },
];

function makeEl(item, mode) {
  const base = `padding:8px 16px;margin:4px;border-radius:6px;font-size:13px;cursor:pointer;min-height:36px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);color:var(--casebook-ink);text-decoration:none;display:inline-flex;align-items:center;`;
  const focusStyle = mode === 'broken'
    ? `outline:none;`
    : `/* :focus-visible handled by injected <style> */`;
  if (item.tag === 'button') {
    return `<button style="${base}${focusStyle}">${item.text}</button>`;
  }
  return `<a href="${item.href || '#'}" style="${base}${focusStyle}">${item.text}</a>`;
}

export function initDemo(root) {
  function renderBroken(vp) {
    vp.innerHTML = `
<style>.cbk-fv-broken:focus{outline:none!important;}</style>
<div style="padding:16px;">
  <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">Tab through these — can you tell where focus is?</p>
  <div>${ITEMS.map(i => makeEl(i, 'broken')).map(h => h.replace('<button ', '<button class="cbk-fv-broken" ').replace('<a ', '<a class="cbk-fv-broken" ')).join('')}</div>
  <p style="font-size:11px;color:var(--casebook-accent);margin:10px 0 0;">No visible focus ring — keyboard users are lost.</p>
</div>`;
  }

  function renderFixed(vp) {
    vp.innerHTML = `
<style>.cbk-fv-fixed:focus-visible{outline:2px solid var(--casebook-accent);outline-offset:3px;border-radius:6px;}</style>
<div style="padding:16px;">
  <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">Tab through — ring appears for keyboard, hidden for mouse.</p>
  <div>${ITEMS.map(i => makeEl(i, 'fixed')).map(h => h.replace('<button ', '<button class="cbk-fv-fixed" ').replace('<a ', '<a class="cbk-fv-fixed" ')).join('')}</div>
  <p style="font-size:11px;color:var(--casebook-ink-faint);margin:10px 0 0;">Click with mouse → no ring. Tab → ring appears.</p>
</div>`;
  }

  wireToggleDemo(root, { renderBroken, renderFixed });
}
