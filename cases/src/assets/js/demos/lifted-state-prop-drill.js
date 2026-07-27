/**
 * demos/lifted-state-prop-drill.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": renders a 5-level component tree (Dashboard > Layout >
 * Sidebar > NavPanel > UserBadge) as stacked "file" cards, each showing its
 * current prop signature. Clicking "Ship: add notification badge" simulates
 * landing a new deep feature. In "broken" (prop drilling) mode the new prop
 * has to be threaded through every intermediate component's signature, so
 * all 5 cards flash as edited. In "fixed" (composition) mode only the owner
 * (Dashboard) and the consumer (UserBadge) change — Layout/Sidebar/NavPanel
 * just render {children} and never see the new prop, so they stay
 * untouched. The "files touched" count is the concrete, countable
 * difference between the two.
 */
import { wireToggleDemo } from './_demo-utils.js';

const CHAIN = ['Dashboard', 'Layout', 'Sidebar', 'NavPanel', 'UserBadge'];

function baseSig(name, mode) {
  if (name === 'Dashboard') {
    return mode === 'broken'
      ? 'function Dashboard() {\n  return <Layout user={currentUser} />\n}'
      : 'function Dashboard() {\n  return <Layout>\n    <Sidebar>\n      <NavPanel>\n        <UserBadge user={currentUser} />\n      </NavPanel>\n    </Sidebar>\n  </Layout>\n}';
  }
  if (name === 'UserBadge') {
    return 'function UserBadge({ user }) {\n  return <Avatar name={user.name} />\n}';
  }
  // Layout / Sidebar / NavPanel
  return mode === 'broken'
    ? `function ${name}({ user, children }) {\n  return <div>{children}</div> // + forwards "user" down\n}`
    : `function ${name}({ children }) {\n  return <div>{children}</div>\n}`;
}

function afterSig(name, mode) {
  if (mode === 'fixed') {
    if (name === 'Dashboard') {
      return 'function Dashboard() {\n  return <Layout>\n    <Sidebar>\n      <NavPanel>\n        <UserBadge user={currentUser} notificationCount={n} />\n      </NavPanel>\n    </Sidebar>\n  </Layout>\n}';
    }
    if (name === 'UserBadge') {
      return 'function UserBadge({ user, notificationCount }) {\n  return <Avatar name={user.name} badge={notificationCount} />\n}';
    }
    return baseSig(name, mode); // unchanged
  }
  // broken: every component's signature changes to add + forward notificationCount
  if (name === 'Dashboard') {
    return 'function Dashboard() {\n  return <Layout user={currentUser} notificationCount={n} />\n}';
  }
  if (name === 'UserBadge') {
    return 'function UserBadge({ user, notificationCount }) {\n  return <Avatar name={user.name} badge={notificationCount} />\n}';
  }
  return `function ${name}({ user, notificationCount, children }) {\n  return <div>{children}</div> // + forwards "user" AND "notificationCount"\n}`;
}

function shell() {
  return `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
      <button id="cbk-pd-ship" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">Ship: add notification badge</button>
      <button id="cbk-pd-reset" type="button" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">Reset</button>
    </div>
    <div id="cbk-pd-tree" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;"></div>
    <div id="cbk-pd-summary" style="font-size:12px;font-weight:600;margin-bottom:8px;"></div>
    <div id="cbk-pd-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:40px;white-space:pre-line;">Click "Ship" to land the feature and see which components change.</div>
  `;
}

function cardHtml(name, sig, touched) {
  const border = touched ? 'var(--casebook-accent)' : 'var(--casebook-border)';
  const badge = touched
    ? '<span style="font-size:10px;font-weight:700;color:var(--casebook-accent);">✏️ edited</span>'
    : '<span style="font-size:10px;color:var(--casebook-ink-faint);">— unchanged —</span>';
  return `
    <div style="border:1px solid ${border};border-radius:8px;padding:8px 10px;background:var(--casebook-bg);transition:border-color .2s;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <strong style="font-size:12px;">${name}.jsx</strong>
        ${badge}
      </div>
      <pre style="margin:0;font-size:10.5px;line-height:1.4;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);white-space:pre-wrap;">${sig}</pre>
    </div>
  `;
}

function setup(vp, mode) {
  vp.innerHTML = shell();
  const treeEl = vp.querySelector('#cbk-pd-tree');
  const summaryEl = vp.querySelector('#cbk-pd-summary');
  const log = vp.querySelector('#cbk-pd-log');
  let shipped = false;

  function render() {
    treeEl.innerHTML = CHAIN.map((name) => {
      const sig = shipped ? afterSig(name, mode) : baseSig(name, mode);
      const touched = shipped && sig !== baseSig(name, mode);
      return cardHtml(name, sig, touched);
    }).join('');
    if (shipped) {
      const touchedCount = CHAIN.filter((name) => afterSig(name, mode) !== baseSig(name, mode)).length;
      summaryEl.textContent = `${touchedCount} of ${CHAIN.length} files touched to ship this feature`;
      log.textContent = mode === 'broken'
        ? 'RESULT: the notification-count prop had to be threaded through every layout component just to reach UserBadge.'
        : 'RESULT: Layout, Sidebar, and NavPanel never learned notificationCount exists — only the owner and the consumer changed.';
    } else {
      summaryEl.textContent = '';
      log.textContent = 'Click "Ship" to land the feature and see which components change.';
    }
  }

  vp.querySelector('#cbk-pd-ship').addEventListener('click', () => { shipped = true; render(); });
  vp.querySelector('#cbk-pd-reset').addEventListener('click', () => { shipped = false; render(); });

  render();
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setup(vp, 'broken'),
    renderFixed: (vp) => setup(vp, 'fixed'),
  });
}
