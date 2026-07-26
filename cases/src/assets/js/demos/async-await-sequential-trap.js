/**
 * demos/async-await-sequential-trap.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": runs two simulated, independent "API calls" (plain
 * setTimeout delays, no real network) either sequentially (await, await)
 * or concurrently (Promise.all) and renders a real, measured timing
 * waterfall from performance.now() — not a hard-coded illustration.
 */
import { wireToggleDemo, PRM } from './_demo-utils.js';

const USER_MS = PRM ? 40 : 700;
const SETTINGS_MS = PRM ? 60 : 900;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shell(modeLabel, codeSnippet) {
  return `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">${modeLabel}</div>
    <pre style="font-size:11px;font-family:var(--casebook-mono, monospace);background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;padding:8px 10px;margin:0 0 10px;overflow-x:auto;">${codeSnippet}</pre>
    <button id="cbk-async-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;margin-bottom:12px;">Run page load</button>
    <div id="cbk-async-track" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;"></div>
    <div id="cbk-async-total" style="font-size:12px;color:var(--casebook-ink-faint);font-family:var(--casebook-mono, monospace);">Click "Run page load" to measure.</div>
  `;
}

function renderBar(track, label, startMs, endMs, totalScale) {
  const row = document.createElement('div');
  row.style.cssText = 'font-size:11px;color:var(--casebook-ink-faint);';
  const leftPct = (startMs / totalScale) * 100;
  const widthPct = Math.max(((endMs - startMs) / totalScale) * 100, 2);
  row.innerHTML = `
    <div style="margin-bottom:2px;">${label}: ${Math.round(startMs)}ms – ${Math.round(endMs)}ms</div>
    <div style="position:relative;height:14px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:4px;">
      <div style="position:absolute;top:0;bottom:0;left:${leftPct}%;width:${widthPct}%;background:var(--casebook-accent);border-radius:4px;"></div>
    </div>
  `;
  track.appendChild(row);
}

function setupBroken(vp) {
  vp.innerHTML = shell(
    '✗ Sequential — fetchSettings does not start until fetchUser resolves',
    'const user = await fetchUser();      // waits\nconst settings = await fetchSettings(); // starts only after user resolves'
  );
  const track = vp.querySelector('#cbk-async-track');
  const total = vp.querySelector('#cbk-async-total');

  vp.querySelector('#cbk-async-run').addEventListener('click', async () => {
    const btn = vp.querySelector('#cbk-async-run');
    btn.disabled = true;
    track.innerHTML = '';
    total.textContent = 'Running…';

    const t0 = performance.now();
    const userStart = performance.now() - t0;
    await delay(USER_MS);
    const userEnd = performance.now() - t0;

    const settingsStart = performance.now() - t0;
    await delay(SETTINGS_MS);
    const settingsEnd = performance.now() - t0;

    const totalMs = performance.now() - t0;
    const scale = totalMs;
    renderBar(track, 'fetchUser', userStart, userEnd, scale);
    renderBar(track, 'fetchSettings', settingsStart, settingsEnd, scale);
    total.textContent = `Total: ${Math.round(totalMs)}ms (measured) — roughly USER + SETTINGS added together`;
    btn.disabled = false;
  });
}

function setupFixed(vp) {
  vp.innerHTML = shell(
    '✓ Concurrent — both calls start in the same tick',
    'const [user, settings] = await Promise.all([\n  fetchUser(),\n  fetchSettings(),\n]); // both start immediately'
  );
  const track = vp.querySelector('#cbk-async-track');
  const total = vp.querySelector('#cbk-async-total');

  vp.querySelector('#cbk-async-run').addEventListener('click', async () => {
    const btn = vp.querySelector('#cbk-async-run');
    btn.disabled = true;
    track.innerHTML = '';
    total.textContent = 'Running…';

    const t0 = performance.now();
    const userStart = performance.now() - t0;
    const settingsStart = performance.now() - t0;
    const userPromise = delay(USER_MS).then(() => performance.now() - t0);
    const settingsPromise = delay(SETTINGS_MS).then(() => performance.now() - t0);
    const [userEnd, settingsEnd] = await Promise.all([userPromise, settingsPromise]);

    const totalMs = performance.now() - t0;
    const scale = totalMs;
    renderBar(track, 'fetchUser', userStart, userEnd, scale);
    renderBar(track, 'fetchSettings', settingsStart, settingsEnd, scale);
    total.textContent = `Total: ${Math.round(totalMs)}ms (measured) — roughly max(USER, SETTINGS), not the sum`;
    btn.disabled = false;
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
