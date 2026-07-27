/**
 * demos/design-system-major-version.js
 * Export: initDemo(root)
 * Broken: shipping v3 as a hard cutover — clicking "Ship v3.0.0" flips every
 *         simulated app to the real v3 API at once. Apps still passing the
 *         old prop name break immediately; only apps that had already
 *         updated survive.
 * Fixed:  shipping v3 with a compatibility shim active by default — every
 *         app keeps running the instant v3 ships, whether or not it's
 *         updated its prop names yet. "Run codemod on next app" migrates
 *         one app at a time off the deprecated prop, tracked by a real
 *         per-app counter, not a timer.
 */

const APPS = ['Checkout', 'Billing', 'Admin', 'Onboarding', 'Search', 'Profile', 'Notifications', 'Reports'];
// Apps still passing the deprecated `size="small"` prop when v3 ships.
// The other 2 (Search, Reports) already use `size="sm"` and are unaffected either way.
const ON_OLD_PROP = new Set(['Checkout', 'Billing', 'Admin', 'Onboarding', 'Profile', 'Notifications']);

function tileHTML(app, state) {
  // state: 'old' (shim/pre-cutover, fine) | 'broken' | 'migrated' | 'native'
  const styles = {
    old:      { bg: 'var(--casebook-surface-2)', border: 'var(--casebook-border)', icon: '🟡', label: 'shim active — size="small" accepted' },
    broken:   { bg: 'color-mix(in srgb, red 12%, var(--casebook-surface-2))', border: '#c0392b', icon: '💥', label: 'TypeError: unsupported size="small"' },
    migrated: { bg: 'color-mix(in srgb, var(--casebook-accent) 12%, var(--casebook-surface-2))', border: 'var(--casebook-accent)', icon: '✅', label: 'migrated — size="sm" natively' },
    native:   { bg: 'color-mix(in srgb, var(--casebook-accent) 12%, var(--casebook-surface-2))', border: 'var(--casebook-accent)', icon: '✅', label: 'already v3-ready — size="sm"' },
  }[state];
  return `
    <div style="background:${styles.bg};border:1px solid ${styles.border};border-radius:6px;padding:8px 10px;font-size:11.5px;">
      <div style="font-weight:600;margin-bottom:2px;">${styles.icon} ${app}</div>
      <div style="color:var(--casebook-ink-faint);line-height:1.4;">${styles.label}</div>
    </div>`;
}

function grid(states) {
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">${
    APPS.map((a) => tileHTML(a, states[a])).join('')
  }</div>`;
}

function setupBroken(vp) {
  const states = {};
  APPS.forEach((a) => { states[a] = ON_OLD_PROP.has(a) ? 'old' : 'native'; });
  let shipped = false;

  function paint() {
    const downCount = Object.values(states).filter((s) => s === 'broken').length;
    vp.innerHTML = `
      <div style="padding:6px 4px;">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
          <button id="cbk-dsv-ship" type="button" ${shipped ? 'disabled' : ''} style="padding:7px 14px;background:${shipped ? 'var(--casebook-border)' : 'var(--casebook-accent)'};color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:${shipped ? 'default' : 'pointer'};min-height:36px;">
            ${shipped ? 'v3.0.0 shipped' : 'Ship v3.0.0 (hard cutover)'}
          </button>
          <span style="font-size:11.5px;color:${downCount ? '#c0392b' : 'var(--casebook-ink-faint)'};font-weight:${downCount ? '600' : '400'};">
            ${shipped ? `${downCount} of ${APPS.length} apps down` : 'All apps running v2 API'}
          </span>
        </div>
        ${grid(states)}
      </div>`;
    const btn = vp.querySelector('#cbk-dsv-ship');
    if (btn && !shipped) {
      btn.addEventListener('click', () => {
        shipped = true;
        APPS.forEach((a) => { if (states[a] === 'old') states[a] = 'broken'; });
        paint();
      });
    }
  }
  paint();
}

function setupFixed(vp) {
  const states = {};
  APPS.forEach((a) => { states[a] = ON_OLD_PROP.has(a) ? 'old' : 'native'; });
  const migrationOrder = APPS.filter((a) => ON_OLD_PROP.has(a));
  let migratedCount = 0;

  function paint() {
    const total = migrationOrder.length;
    const done = migratedCount >= total;
    vp.innerHTML = `
      <div style="padding:6px 4px;">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
          <button id="cbk-dsv-codemod" type="button" ${done ? 'disabled' : ''} style="padding:7px 14px;background:${done ? 'var(--casebook-border)' : 'var(--casebook-accent)'};color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:${done ? 'default' : 'pointer'};min-height:36px;">
            ${done ? 'All apps migrated' : 'Run codemod on next app'}
          </button>
          <span style="font-size:11.5px;color:var(--casebook-ink-faint);">
            Migrated: ${migratedCount}/${total} apps — shim usage: ${total - migratedCount}
          </span>
        </div>
        ${grid(states)}
      </div>`;
    const btn = vp.querySelector('#cbk-dsv-codemod');
    if (btn && !done) {
      btn.addEventListener('click', () => {
        const next = migrationOrder[migratedCount];
        if (next) states[next] = 'migrated';
        migratedCount++;
        paint();
      });
    }
  }
  paint();
}

export function initDemo(root) {
  const viewport = root.querySelector('#demo-viewport, .case-demo__viewport');
  const stateLabel = root.querySelector('.case-demo__state-label');
  const brokenBtn = root.querySelector('[data-demo-state="broken"]');
  const fixedBtn = root.querySelector('[data-demo-state="fixed"]');

  function render(state) {
    if (viewport) {
      if (state === 'broken') setupBroken(viewport);
      else setupFixed(viewport);
    }
    if (stateLabel) {
      const lbl = state === 'broken' ? brokenBtn : fixedBtn;
      if (lbl) stateLabel.textContent = 'Showing: ' + lbl.textContent.trim();
    }
    if (brokenBtn) brokenBtn.setAttribute('aria-pressed', state === 'broken' ? 'true' : 'false');
    if (fixedBtn) fixedBtn.setAttribute('aria-pressed', state === 'fixed' ? 'true' : 'false');
  }

  if (brokenBtn) brokenBtn.addEventListener('click', () => render('broken'));
  if (fixedBtn) fixedBtn.addEventListener('click', () => render('fixed'));
  render('fixed');
}
