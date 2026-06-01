import { wireToggleDemo, PRM, simulateAsync } from './_demo-utils.js';

const RESULTS = {
  re:     ['react','redux','reflect-metadata','rehype'],
  reac:   ['react','react-dom','react-router','react-query'],
  react:  ['react','react-dom','react-router-dom','react-hook-form','react-testing-library'],
};

function resultList(query, reqId, isFinal) {
  const items = RESULTS[query] || [];
  const note = isFinal ? '' : ` <span style="color:#e05;font-size:10px;">(stale — req #${reqId})</span>`;
  return `<div>
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 6px;">"${query}" — ${items.length} results${note}</p>
${items.map(i => `<div style="padding:5px 8px;border-radius:4px;font-size:12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);margin-bottom:4px;">${i}</div>`).join('')}
</div>`;
}

export function initDemo(root) {
  function setup(vp, useAbort) {
    let reqId = 0;
    let controller = null;
    let log = [];
    const DELAYS = { re: PRM ? 0 : 900, reac: PRM ? 0 : 400, react: PRM ? 0 : 200 };

    vp.innerHTML = `<div style="padding:14px 16px;">
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 8px;">
  ${useAbort ? '✓ AbortController — only latest query shows' : '✗ No cancel — slow queries can overwrite fast ones'}
</p>
<p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">Type quickly: "re" → "reac" → "react" (or click buttons)</p>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
  ${['re','reac','react'].map(q => `<button class="cbk-srch" data-q="${q}" style="padding:5px 12px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;min-height:36px;color:var(--casebook-ink-muted);">"${q}"</button>`).join('')}
</div>
<div id="cbk-sr-results" style="min-height:80px;"></div>
<div id="cbk-sr-log" style="margin-top:8px;font-size:10px;color:var(--casebook-ink-faint);"></div>
</div>`;

    vp.querySelectorAll('.cbk-srch').forEach(btn => {
      btn.addEventListener('click', async () => {
        const q = btn.dataset.q;
        reqId++;
        const thisId = reqId;

        if (useAbort && controller) controller.abort();
        if (useAbort) controller = new AbortController();

        log.unshift(`#${thisId}: search "${q}" (${DELAYS[q]}ms)`);
        vp.querySelector('#cbk-sr-log').innerHTML = log.slice(0,3).join('<br>');

        await simulateAsync(DELAYS[q]);

        if (useAbort && controller && controller.signal.aborted) {
          log[0] = `#${thisId}: cancelled ("${q}")`;
          vp.querySelector('#cbk-sr-log').innerHTML = log.slice(0,3).join('<br>');
          return;
        }

        const isFinal = thisId === reqId;
        log[0] = `#${thisId}: done ("${q}")${isFinal ? '' : ' — STALE'}`;
        vp.querySelector('#cbk-sr-log').innerHTML = log.slice(0,3).join('<br>');
        const res = vp.querySelector('#cbk-sr-results');
        if (res) res.innerHTML = resultList(q, thisId, isFinal);
      });
    });
  }

  wireToggleDemo(root, {
    renderBroken: vp => setup(vp, false),
    renderFixed:  vp => setup(vp, true),
  });
}
