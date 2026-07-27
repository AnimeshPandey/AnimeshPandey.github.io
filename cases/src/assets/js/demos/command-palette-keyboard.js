import { wireToggleDemo } from './_demo-utils.js';

const ITEMS = [
  'Open project settings',
  'Invite teammate',
  'Create new dashboard',
  'Toggle dark mode',
  'Go to billing',
  'Export data as CSV',
];

function renderBroken(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ Filters on type. Arrow keys, Enter, and Escape do nothing — only clicking works.</p>
      <input type="text" id="cpk-broken-input" placeholder="Type to filter…" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-bg);color:var(--casebook-ink);font-size:13px;margin-bottom:8px;">
      <ul id="cpk-broken-list" style="list-style:none;margin:0;padding:0;max-height:150px;overflow-y:auto;"></ul>
      <p id="cpk-broken-status" style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;min-height:16px;"></p>
    </div>`;

  const input = vp.querySelector('#cpk-broken-input');
  const list = vp.querySelector('#cpk-broken-list');
  const status = vp.querySelector('#cpk-broken-status');

  function render(filter) {
    const matches = ITEMS.filter((i) => i.toLowerCase().includes(filter.toLowerCase()));
    list.innerHTML = matches.map((m) =>
      `<li style="padding:7px 9px;font-size:12.5px;color:var(--casebook-ink);border-radius:5px;cursor:pointer;" data-item>${m}</li>`
    ).join('') || '<li style="padding:7px 9px;font-size:12px;color:var(--casebook-ink-faint);">No matches</li>';
    list.querySelectorAll('[data-item]').forEach((li) => {
      li.addEventListener('click', () => { status.textContent = `Selected via click: "${li.textContent}"`; });
      li.addEventListener('mouseenter', () => { li.style.background = 'var(--casebook-surface-2)'; });
      li.addEventListener('mouseleave', () => { li.style.background = 'transparent'; });
    });
  }

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      status.textContent = `"${e.key}" pressed — nothing happens. Only clicking selects a result.`;
    }
  });

  render('');
}

function renderFixed(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Type to filter, ↑↓ to move, Enter to select, Esc to close and restore focus. Tab stays trapped inside.</p>
      <button type="button" id="cpk-fixed-trigger" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">⌘K Open palette</button>
      <div id="cpk-fixed-panel" role="dialog" aria-modal="true" aria-label="Command palette" hidden style="margin-top:10px;border:1px solid var(--casebook-border);border-radius:8px;background:var(--casebook-bg);padding:10px;">
        <input type="text" id="cpk-fixed-input" role="combobox" aria-expanded="true" aria-controls="cpk-fixed-list" aria-autocomplete="list" placeholder="Type a command…" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-surface-2);color:var(--casebook-ink);font-size:13px;margin-bottom:8px;">
        <ul id="cpk-fixed-list" role="listbox" style="list-style:none;margin:0;padding:0;max-height:150px;overflow-y:auto;"></ul>
      </div>
      <p id="cpk-fixed-status" style="font-size:11px;color:var(--casebook-ink-faint);margin:8px 0 0;min-height:16px;"></p>
    </div>`;

  const trigger = vp.querySelector('#cpk-fixed-trigger');
  const panel = vp.querySelector('#cpk-fixed-panel');
  const input = vp.querySelector('#cpk-fixed-input');
  const list = vp.querySelector('#cpk-fixed-list');
  const status = vp.querySelector('#cpk-fixed-status');

  let matches = ITEMS.slice();
  let activeIndex = 0;
  let lastFocused = null;

  function renderList() {
    list.innerHTML = matches.map((m, i) =>
      `<li id="cpk-opt-${i}" role="option" aria-selected="${i === activeIndex}" style="padding:7px 9px;font-size:12.5px;color:var(--casebook-ink);border-radius:5px;background:${i === activeIndex ? 'var(--casebook-surface-2)' : 'transparent'};">${m}</li>`
    ).join('') || '<li style="padding:7px 9px;font-size:12px;color:var(--casebook-ink-faint);">No matches</li>';
    if (matches.length) input.setAttribute('aria-activedescendant', `cpk-opt-${activeIndex}`);
    else input.removeAttribute('aria-activedescendant');
  }

  function open() {
    lastFocused = document.activeElement;
    panel.hidden = false;
    matches = ITEMS.slice();
    activeIndex = 0;
    input.value = '';
    renderList();
    input.focus();
    status.textContent = '';
  }

  function close(reason) {
    panel.hidden = true;
    status.textContent = reason ? `${reason} — focus restored to trigger.` : '';
    (lastFocused || trigger).focus();
  }

  trigger.addEventListener('click', open);

  input.addEventListener('input', () => {
    matches = ITEMS.filter((i) => i.toLowerCase().includes(input.value.toLowerCase()));
    activeIndex = 0;
    renderList();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (matches.length) activeIndex = (activeIndex + 1) % matches.length;
      renderList();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (matches.length) activeIndex = (activeIndex - 1 + matches.length) % matches.length;
      renderList();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[activeIndex]) close(`Selected "${matches[activeIndex]}" via Enter`);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close('Closed via Escape');
    } else if (e.key === 'Tab') {
      // Focus trap: the palette only has one focusable element (the input),
      // so Tab and Shift+Tab both just keep focus on it rather than
      // escaping into the page behind the palette.
      e.preventDefault();
      input.focus();
    }
  });

  panel.hidden = true;
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken,
    renderFixed,
  });
}
