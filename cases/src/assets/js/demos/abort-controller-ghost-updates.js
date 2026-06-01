import { wireToggleDemo, PRM, simulateAsync } from './_demo-utils.js';

const USERS = [
  { id: 1, name: 'Alice Chen',   role: 'Frontend Engineer',  avatar: 'AC' },
  { id: 2, name: 'Bob Tanaka',   role: 'Product Manager',    avatar: 'BT' },
  { id: 3, name: 'Cara Wilson',  role: 'Staff Engineer',     avatar: 'CW' },
];

function profileCard(user, reqId) {
  return `<div style="padding:12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:8px;">
  <div style="display:flex;gap:10px;align-items:center;">
    <div style="width:36px;height:36px;border-radius:50%;background:var(--casebook-accent);color:var(--casebook-bg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${user.avatar}</div>
    <div>
      <p style="margin:0;font-size:13px;font-weight:600;">${user.name}</p>
      <p style="margin:2px 0 0;font-size:11px;color:var(--casebook-ink-faint);">${user.role}</p>
    </div>
  </div>
  <p style="font-size:10px;color:var(--casebook-ink-faint);margin:8px 0 0;border-top:1px solid var(--casebook-border);padding-top:6px;">Request #${reqId}</p>
</div>`;
}

export function initDemo(root) {
  function setup(vp, useAbort) {
    let reqCount = 0;
    let controller = null;
    let log = [];

    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
  ${useAbort ? '✓ AbortController — only latest request updates UI' : '✗ No cancel — any request can overwrite the UI'}
</p>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
  ${USERS.map(u => `<button class="cbk-load-user" data-uid="${u.id}" style="padding:5px 12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;color:var(--casebook-ink-muted);">Load ${u.name.split(' ')[0]}</button>`).join('')}
</div>
<div id="cbk-profile" style="min-height:80px;"></div>
<div id="cbk-log" style="margin-top:10px;font-size:11px;color:var(--casebook-ink-faint);max-height:80px;overflow-y:auto;"></div>
</div>`;

    vp.querySelectorAll('.cbk-load-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = parseInt(btn.dataset.uid, 10);
        const user = USERS.find(u => u.id === uid);
        reqCount++;
        const thisReq = reqCount;

        if (useAbort && controller) { controller.abort(); }
        if (useAbort) controller = new AbortController();

        log.unshift(`#${thisReq}: Loading ${user.name}…`);
        vp.querySelector('#cbk-log').innerHTML = log.slice(0,4).join('<br>');

        const delay = PRM ? 0 : (200 + Math.random() * 600);
        await simulateAsync(delay);

        if (useAbort && controller && controller.signal.aborted) {
          log[0] = `#${thisReq}: Cancelled (${user.name})`;
          vp.querySelector('#cbk-log').innerHTML = log.slice(0,4).join('<br>');
          return;
        }

        log[0] = `#${thisReq}: Showed ${user.name}`;
        vp.querySelector('#cbk-log').innerHTML = log.slice(0,4).join('<br>');
        const profile = vp.querySelector('#cbk-profile');
        if (profile) profile.innerHTML = profileCard(user, thisReq);
      });
    });
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
