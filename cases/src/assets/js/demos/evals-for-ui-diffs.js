/**
 * demos/evals-for-ui-diffs.js
 * Export: initDemo(root)
 *
 * Simulates shipping the same "make suggestions more concise" prompt
 * change two ways: blind (broken) vs. against a small fixed golden set
 * of 5 real past diffs (fixed). The golden set data below is static and
 * hand-authored to represent a believable regression, not fetched from
 * anywhere live.
 */
import { wireToggleDemo, simulateAsync, PRM } from './_demo-utils.js';

const GOLDEN_SET = [
  { id: 'diff-1', label: 'Missing alt on <img>', oldPass: true, newPass: true },
  { id: 'diff-2', label: 'Low-contrast button text', oldPass: true, newPass: true },
  { id: 'diff-3', label: 'Unlabeled icon button', oldPass: true, newPass: false },
  { id: 'diff-4', label: 'Ambiguous case — should suggest nothing', oldPass: true, newPass: true },
  { id: 'diff-5', label: 'Duplicate aria-label removal', oldPass: true, newPass: false },
];

function renderBroken(vp) {
  let shipped = false;
  let laterRevealed = false;

  function render() {
    const delay = PRM ? 0 : 500;
    vp.innerHTML = `
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✗ No eval gate — nothing checks the change before it's live.</p>
      <div style="padding:10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;margin-bottom:10px;">
        <p style="font-size:12px;margin:0;">Prompt change: <em>"make suggestions more concise"</em></p>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
        <button id="eud-broken-ship" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;" ${shipped ? 'disabled' : ''}>${shipped ? '✓ Shipped' : 'Ship prompt change'}</button>
        <button id="eud-broken-later" style="padding:7px 14px;background:var(--casebook-surface);color:var(--casebook-ink);border:1px solid var(--casebook-border);border-radius:6px;font-size:12px;cursor:pointer;" ${!shipped ? 'disabled' : ''}>Simulate: 2 weeks later</button>
      </div>
      <div id="eud-broken-result" style="font-size:12px;color:var(--casebook-ink-muted);min-height:40px;">
        ${laterRevealed
          ? '<strong style="color:var(--casebook-critical,#b23b3b);">⚠ 7 complaints filed: "suggestions have been kind of bad lately."</strong><br>No record of which inputs regressed or why — the only signal is the aggregate complaint count.'
          : shipped
            ? 'Live now. No scores, no comparison — quality is unknown until someone notices.'
            : ''}
      </div>
    `;
    vp.querySelector('#eud-broken-ship').addEventListener('click', async () => {
      shipped = true;
      render();
    });
    const laterBtn = vp.querySelector('#eud-broken-later');
    if (laterBtn) {
      laterBtn.addEventListener('click', async () => {
        laterBtn.disabled = true;
        await simulateAsync(delay);
        laterRevealed = true;
        render();
      });
    }
  }

  render();
}

function renderFixed(vp) {
  let ran = false;

  function resultsTable() {
    const rows = GOLDEN_SET.map((c) => {
      const regressed = c.oldPass && !c.newPass;
      return `<tr>
        <td style="padding:4px 8px;font-size:12px;">${c.label}</td>
        <td style="padding:4px 8px;font-size:12px;text-align:center;">${c.oldPass ? '✓' : '✗'}</td>
        <td style="padding:4px 8px;font-size:12px;text-align:center;${regressed ? 'color:var(--casebook-critical,#b23b3b);font-weight:600;' : ''}">${c.newPass ? '✓' : '✗'}${regressed ? ' ⚠' : ''}</td>
      </tr>`;
    }).join('');
    const regressedCount = GOLDEN_SET.filter((c) => c.oldPass && !c.newPass).length;
    return `
      <table style="width:100%;border-collapse:collapse;margin:10px 0;">
        <thead>
          <tr style="border-bottom:1px solid var(--casebook-border);">
            <th style="text-align:left;padding:4px 8px;font-size:11px;color:var(--casebook-ink-faint);">Golden-set case</th>
            <th style="padding:4px 8px;font-size:11px;color:var(--casebook-ink-faint);">Old prompt</th>
            <th style="padding:4px 8px;font-size:11px;color:var(--casebook-ink-faint);">New prompt</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:12px;font-weight:600;${regressedCount ? 'color:var(--casebook-critical,#b23b3b);' : 'color:var(--casebook-ink);'}margin:0;">
        ${regressedCount ? `⛔ Merge blocked — ${regressedCount} of ${GOLDEN_SET.length} cases regressed.` : '✓ All cases pass — safe to merge.'}
      </p>
    `;
  }

  function render() {
    vp.innerHTML = `
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">✓ Golden-set gate — the same change is scored before it ships.</p>
      <div style="padding:10px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;margin-bottom:10px;">
        <p style="font-size:12px;margin:0;">Prompt change: <em>"make suggestions more concise"</em></p>
      </div>
      <button id="eud-fixed-run" style="padding:7px 14px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:12px;cursor:pointer;">${ran ? 'Re-run golden-set eval' : 'Run golden-set eval'}</button>
      <div id="eud-fixed-result">${ran ? resultsTable() : ''}</div>
    `;
    vp.querySelector('#eud-fixed-run').addEventListener('click', async () => {
      const btn = vp.querySelector('#eud-fixed-run');
      btn.disabled = true;
      btn.textContent = 'Scoring 5 cases…';
      await simulateAsync(PRM ? 0 : 600);
      ran = true;
      render();
    });
  }

  render();
}

export function initDemo(root) {
  wireToggleDemo(root, { renderBroken, renderFixed });
}
