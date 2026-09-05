/**
 * demos/aesthetic-usability-effect.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": both modes run the exact same saveSettings() function
 * with the exact same 900ms unannounced delay and the exact same success
 * message — the ONLY difference between "broken" (rough) and "fixed"
 * (polished) is inline CSS on the shell markup. This is deliberate: the
 * case's whole point is that identical functionality reads differently
 * depending on visual polish, so the JS behavior must be provably
 * identical between the two toggle states, only renderShell()'s styling
 * branches on mode.
 */
import { wireToggleDemo } from './_demo-utils.js';

const SAVE_DELAY_MS = 900;

/** Identical in both modes — no branching on visual treatment here. */
function saveSettings() {
  return new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));
}

function roughShell() {
  return `
    <div style="background:#f0f0f0;padding:10px;font-family:Arial,sans-serif;">
      <label style="display:block;font-size:12px;margin-bottom:2px;">Display name</label>
      <input id="cbk-aue-name" type="text" value="Priya Shah" style="width:100%;padding:3px;border:1px solid #999;margin-bottom:8px;font-size:13px;box-sizing:border-box;">
      <label style="display:block;font-size:12px;margin-bottom:2px;">Email notifications</label>
      <select id="cbk-aue-notif" style="width:100%;padding:3px;border:1px solid #999;margin-bottom:10px;font-size:13px;box-sizing:border-box;">
        <option>All activity</option>
        <option selected>Mentions only</option>
        <option>None</option>
      </select>
      <button id="cbk-aue-save" type="button" style="padding:4px 10px;background:#ddd;border:1px solid #999;font-size:12px;cursor:pointer;">Save</button>
      <span id="cbk-aue-status" style="font-size:11px;margin-left:8px;color:#333;"></span>
    </div>
  `;
}

function polishedShell() {
  return `
    <div style="background:var(--casebook-surface-2);padding:20px;border-radius:12px;">
      <label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:6px;color:var(--casebook-ink);">Display name</label>
      <input id="cbk-aue-name" type="text" value="Priya Shah" style="width:100%;padding:9px 12px;border:1px solid var(--casebook-border);border-radius:8px;margin-bottom:16px;font-size:13.5px;box-sizing:border-box;background:var(--casebook-bg);color:var(--casebook-ink);">
      <label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:6px;color:var(--casebook-ink);">Email notifications</label>
      <select id="cbk-aue-notif" style="width:100%;padding:9px 12px;border:1px solid var(--casebook-border);border-radius:8px;margin-bottom:18px;font-size:13.5px;box-sizing:border-box;background:var(--casebook-bg);color:var(--casebook-ink);">
        <option>All activity</option>
        <option selected>Mentions only</option>
        <option>None</option>
      </select>
      <button id="cbk-aue-save" type="button" style="padding:9px 18px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;min-height:36px;">Save changes</button>
      <span id="cbk-aue-status" style="font-size:12px;margin-left:10px;color:var(--casebook-ink-faint);"></span>
    </div>
  `;
}

function setup(vp, mode) {
  vp.innerHTML = mode === 'broken' ? roughShell() : polishedShell();
  const btn = vp.querySelector('#cbk-aue-save');
  const status = vp.querySelector('#cbk-aue-status');

  btn.addEventListener('click', () => {
    // Identical call, identical delay, identical outcome in both modes —
    // no loading indicator either way, matching the case's premise that
    // the friction itself (an unannounced delay) is unchanged.
    btn.disabled = true;
    saveSettings().then(() => {
      status.textContent = mode === 'broken' ? 'saved.' : '✓ Saved';
      btn.disabled = false;
    });
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setup(vp, 'broken'),
    renderFixed: (vp) => setup(vp, 'fixed'),
  });
}
