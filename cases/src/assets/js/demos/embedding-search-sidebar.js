import { wireToggleDemo, PRM } from './_demo-utils.js';

const DOCS = [
  { title: 'Resetting your password', tags: ['account', 'login', 'password'] },
  { title: 'Inviting teammates to a workspace', tags: ['team', 'invite', 'workspace'] },
  { title: 'Understanding billing cycles', tags: ['billing', 'invoice', 'plan'] },
  { title: 'Setting up two-factor authentication', tags: ['security', 'login', '2fa'] },
  { title: 'Exporting data to CSV', tags: ['export', 'data', 'csv'] },
  { title: 'Managing API keys', tags: ['api', 'developer', 'keys'] },
  { title: 'Customizing notification preferences', tags: ['notifications', 'settings'] },
  { title: 'Deleting your account', tags: ['account', 'delete', 'privacy'] },
];

function matchDocs(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  // Toy "semantic-ish" match: substring against title/tags, capped at 3.
  return DOCS.filter((d) => d.title.toLowerCase().includes(q) || d.tags.some((t) => t.includes(q))).slice(0, 3);
}

function resultsHtml(results, ms) {
  if (!results.length) {
    return `<p style="font-size:12px;color:var(--casebook-ink-faint);margin:6px 0 0;">No matches.</p>`;
  }
  const rows = results.map((d) => `<li style="font-size:12px;color:var(--casebook-ink);padding:4px 0;border-bottom:1px solid var(--casebook-border);">${d.title}</li>`).join('');
  return `<p style="font-size:11px;color:var(--casebook-ink-faint);margin:6px 0 4px;">${results.length} result(s) in ${ms}ms</p><ul style="list-style:none;margin:0;padding:0;">${rows}</ul>`;
}

function renderBroken(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ Every query round-trips to a server, even for this small fixed set of 8 docs.</p>
      <input id="es-input-broken" type="text" placeholder="Search docs… try 'password' or 'billing'" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-bg);color:var(--casebook-ink);font-size:13px;box-sizing:border-box;" />
      <div id="es-status-broken" style="font-size:11px;color:var(--casebook-ink-faint);margin-top:6px;min-height:14px;"></div>
      <div id="es-results-broken" style="margin-top:4px;min-height:20px;"></div>
    </div>`;

  const input = vp.querySelector('#es-input-broken');
  const status = vp.querySelector('#es-status-broken');
  const results = vp.querySelector('#es-results-broken');
  let debounceTimer = null;
  let requestId = 0;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value;
    const myId = ++requestId;
    status.textContent = query ? 'Waiting to send query…' : '';
    results.innerHTML = '';

    debounceTimer = setTimeout(() => {
      if (myId !== requestId) return;
      const start = performance.now();
      status.textContent = 'Round trip: embedding query on server, searching vector store…';
      const roundTrip = PRM ? 0 : 450 + Math.random() * 250;
      setTimeout(() => {
        if (myId !== requestId) return;
        const ms = Math.round(performance.now() - start);
        status.textContent = `Round trip complete — ${ms}ms network + server time`;
        results.innerHTML = resultsHtml(matchDocs(query), ms);
      }, roundTrip);
    }, PRM ? 0 : 250);
  });
}

function renderFixed(vp) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Model + doc vectors load once, then every query runs locally with zero network calls.</p>
      <div id="es-load-fixed">
        <div style="height:8px;border-radius:4px;background:var(--casebook-surface-2);overflow:hidden;margin-bottom:8px;">
          <div id="es-load-bar" style="height:100%;width:0%;background:var(--casebook-accent);transition:width 120ms linear;"></div>
        </div>
        <p id="es-load-status" style="font-size:12px;color:var(--casebook-ink-muted);margin:0;">Loading embedding model (≈25MB, quantized)…</p>
      </div>
      <div id="es-search-fixed" hidden>
        <input id="es-input-fixed" type="text" placeholder="Search docs… try 'password' or 'billing'" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--casebook-border);background:var(--casebook-bg);color:var(--casebook-ink);font-size:13px;box-sizing:border-box;" />
        <div id="es-status-fixed" style="font-size:11px;color:var(--casebook-ink-faint);margin-top:6px;min-height:14px;"></div>
        <div id="es-results-fixed" style="margin-top:4px;min-height:20px;"></div>
      </div>
    </div>`;

  const loadWrap = vp.querySelector('#es-load-fixed');
  const bar = vp.querySelector('#es-load-bar');
  const loadStatus = vp.querySelector('#es-load-status');
  const searchWrap = vp.querySelector('#es-search-fixed');

  let pct = 0;
  const loadDuration = PRM ? 0 : 1800;
  const step = PRM ? 100 : 40;
  const increment = 100 / (loadDuration / step || 1);

  function finishLoad() {
    loadStatus.textContent = 'Model loaded — searching locally now.';
    setTimeout(() => {
      loadWrap.hidden = true;
      searchWrap.hidden = false;
      wireSearch();
    }, PRM ? 0 : 300);
  }

  if (PRM) {
    bar.style.width = '100%';
    finishLoad();
  } else {
    const timer = setInterval(() => {
      pct = Math.min(100, pct + increment);
      bar.style.width = pct + '%';
      if (pct >= 100) {
        clearInterval(timer);
        finishLoad();
      }
    }, step);
  }

  function wireSearch() {
    const input = vp.querySelector('#es-input-fixed');
    const status = vp.querySelector('#es-status-fixed');
    const results = vp.querySelector('#es-results-fixed');

    input.addEventListener('input', () => {
      const query = input.value;
      const start = performance.now();
      if (!query) {
        status.textContent = '';
        results.innerHTML = '';
        return;
      }
      const found = matchDocs(query);
      const ms = Math.max(1, Math.round(performance.now() - start));
      status.textContent = `Local search complete — ${ms}ms, no network call`;
      results.innerHTML = resultsHtml(found, ms);
    });
  }
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken,
    renderFixed,
  });
}
