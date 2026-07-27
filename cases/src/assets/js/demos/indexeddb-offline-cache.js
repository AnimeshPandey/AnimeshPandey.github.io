/**
 * demos/indexeddb-offline-cache.js
 * Export: initDemo(root, { demoType })
 * demoType "toggle": "Load projects" simulates a network fetch (with a
 * short delay) into an in-memory array. "Simulate reload" wipes the
 * in-memory array, exactly what a real page reload does to JS state,
 * and re-renders from whatever each mode considers its source of truth.
 * "broken" mode has no source of truth but the network: reload always
 * starts empty and must refetch, and if "Go offline" is checked that
 * refetch fails outright. "fixed" mode writes every successful fetch
 * into a *real* IndexedDB object store (genuine indexedDB.open/put/
 * getAll calls, not a simulated log) and reads that back first on
 * reload, instantly and regardless of the offline toggle, then
 * revalidates over the (simulated) network in the background.
 */
import { wireToggleDemo, simulateAsync } from './_demo-utils.js';

const DB_NAME = 'cbk-idb-offline-cache-demo';
const STORE = 'projects';
const SEED = [
  { id: 1, name: 'Q3 rebrand', status: 'In review' },
  { id: 2, name: 'Checkout redesign', status: 'In progress' },
  { id: 3, name: 'API v2 migration', status: 'Blocked' },
];

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not available in this browser'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

async function idbPutAll(items) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(STORE);
    for (const item of items) store.put(item);
  });
  db.close();
}

async function idbGetAll() {
  const db = await openDb();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

function shell(mode) {
  return `
    <div style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
      ${mode === 'broken'
    ? '✗ State lives only in a JS variable — nothing survives a reload.'
    : '✓ Every load also writes into a real IndexedDB object store — reload reads that back first.'}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
      <button id="cbk-idb-load" type="button" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">Load projects</button>
      <button id="cbk-idb-reload" type="button" style="padding:7px 14px;background:var(--casebook-surface-2);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;">Simulate reload</button>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;">
        <input id="cbk-idb-offline" type="checkbox"> Go offline
      </label>
    </div>
    <ul id="cbk-idb-list" style="list-style:none;margin:0 0 10px;padding:0;min-height:60px;font-size:12.5px;"></ul>
    <div id="cbk-idb-log" style="font-size:11.5px;font-family:var(--casebook-mono, monospace);color:var(--casebook-ink-faint);padding:8px 10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;min-height:70px;white-space:pre-line;">Click "Load projects" to fetch the list.</div>
  `;
}

function renderList(vp, items) {
  const list = vp.querySelector('#cbk-idb-list');
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<li style="color:var(--casebook-ink-faint);">(no projects loaded)</li>';
    return;
  }
  list.innerHTML = items
    .map((p) => `<li style="padding:4px 0;border-bottom:1px solid var(--casebook-border);">${p.name} — <span style="color:var(--casebook-ink-faint);">${p.status}</span></li>`)
    .join('');
}

function setupBroken(vp) {
  vp.innerHTML = shell('broken');
  let memory = [];
  const log = vp.querySelector('#cbk-idb-log');
  const offline = vp.querySelector('#cbk-idb-offline');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };
  renderList(vp, memory);

  async function fetchProjects() {
    push('[fetch] GET /api/projects ...');
    await simulateAsync(400);
    if (offline.checked) {
      push('RESULT: ✗ network request failed (offline) — no fallback, list stays empty');
      return;
    }
    memory = SEED.slice();
    renderList(vp, memory);
    push('RESULT: ✓ fetched ' + memory.length + ' projects into memory');
  }

  vp.querySelector('#cbk-idb-load').addEventListener('click', () => { lines.length = 0; fetchProjects(); });
  vp.querySelector('#cbk-idb-reload').addEventListener('click', () => {
    lines.length = 0;
    memory = [];
    renderList(vp, memory);
    push('[reload] JS memory cleared — exactly like a real page reload — nothing left to show');
    fetchProjects();
  });
}

function setupFixed(vp) {
  vp.innerHTML = shell('fixed');
  let memory = [];
  const log = vp.querySelector('#cbk-idb-log');
  const offline = vp.querySelector('#cbk-idb-offline');
  const lines = [];
  const push = (l) => { lines.push(l); log.textContent = lines.join('\n'); };
  renderList(vp, memory);

  async function loadFromNetwork(background) {
    if (!background) push('[fetch] GET /api/projects ...');
    await simulateAsync(400);
    if (offline.checked) {
      push(background
        ? 'RESULT: revalidation failed (offline) — cached data from IndexedDB stays on screen'
        : 'RESULT: ✗ network failed (offline), nothing to fetch yet');
      return;
    }
    memory = SEED.slice();
    renderList(vp, memory);
    try {
      await idbPutAll(memory);
      push((background ? '[revalidate]' : '[fetch]') + ' ✓ got ' + memory.length + ' projects, wrote read model to IndexedDB');
    } catch (err) {
      push('IndexedDB write failed: ' + err.message);
    }
  }

  vp.querySelector('#cbk-idb-load').addEventListener('click', () => { lines.length = 0; loadFromNetwork(false); });

  vp.querySelector('#cbk-idb-reload').addEventListener('click', async () => {
    lines.length = 0;
    memory = [];
    renderList(vp, memory);
    push('[reload] JS memory cleared — exactly like a real page reload');
    try {
      const cached = await idbGetAll();
      if (cached.length) {
        memory = cached;
        renderList(vp, memory);
        push('RESULT: ✓ read ' + cached.length + ' projects back from IndexedDB instantly (real indexedDB.getAll())');
        push('[revalidate] fetching fresh data in the background ...');
        await loadFromNetwork(true);
      } else {
        push('IndexedDB read model is empty — click "Load projects" first');
      }
    } catch (err) {
      push('IndexedDB read failed: ' + err.message);
    }
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setupBroken(vp),
    renderFixed: (vp) => setupFixed(vp),
  });
}
