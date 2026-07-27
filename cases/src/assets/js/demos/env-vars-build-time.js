/**
 * demos/env-vars-build-time.js
 * Export: initDemo(root)
 * Broken: the API URL is a build-time constant baked into "the bundle" when
 *         it was built against the staging env var. Switching "Deployed to"
 *         only changes a label — the constant the code actually holds never
 *         changes, so production silently keeps talking to staging.
 * Fixed:  the same bundle instead fetches /config.json at boot. Switching
 *         "Deployed to" simulates redeploying that one bundle with a
 *         different config.json next to it — the API URL the app resolves
 *         updates correctly for whichever environment it's running in.
 * Build ID stays identical across every switch in both modes — the point is
 * that it's the same code either way; only whether it produces the right
 * backend differs. No real network involved — config.json is simulated
 * client-side (this project has no backend to deploy to).
 */

const BUILD_ID = 'a1b2c3d';
const URLS = {
  staging: 'https://staging.api.example.com',
  production: 'https://api.example.com',
};

function shell(bodyHTML) {
  return `
    <div style="padding:6px 4px;">
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--casebook-ink-faint);margin-bottom:8px;">
        Build ID: ${BUILD_ID} — dist/app.${BUILD_ID}.js (unchanged across deploys)
      </div>
      ${bodyHTML}
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;">
        <span style="font-size:11.5px;color:var(--casebook-ink-faint);">Deployed to:</span>
        <button type="button" data-env="staging" class="cbk-evb-env" style="padding:5px 10px;border-radius:5px;border:1px solid var(--casebook-border);background:var(--casebook-surface-2);color:var(--casebook-ink);font-size:11.5px;cursor:pointer;">Staging</button>
        <button type="button" data-env="production" class="cbk-evb-env" style="padding:5px 10px;border-radius:5px;border:1px solid var(--casebook-border);background:var(--casebook-surface-2);color:var(--casebook-ink);font-size:11.5px;cursor:pointer;">Production</button>
      </div>
    </div>`;
}

function setupBroken(vp) {
  // The value was frozen in at "build time" against staging and never changes.
  const bakedUrl = URLS.staging;
  let currentEnv = 'staging';

  function paint() {
    const mismatch = currentEnv === 'production';
    vp.innerHTML = shell(`
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;padding:10px;margin-bottom:6px;">
        const API_URL = "${bakedUrl}"; <span style="color:var(--casebook-ink-faint);">// baked in at build time</span>
      </div>
      <p style="font-size:11.5px;margin:0;color:${mismatch ? '#c0392b' : 'var(--casebook-ink-faint)'};font-weight:${mismatch ? '600' : '400'};">
        ${mismatch
          ? `⚠️ Running in production, but this build still talks to ${bakedUrl} — wrong backend.`
          : `Currently talking to ${bakedUrl} (matches this environment by coincidence).`}
      </p>`);
    vp.querySelectorAll('.cbk-evb-env').forEach((btn) => {
      btn.style.outline = btn.dataset.env === currentEnv ? '2px solid var(--casebook-accent)' : 'none';
      btn.addEventListener('click', () => { currentEnv = btn.dataset.env; paint(); });
    });
  }
  paint();
}

function setupFixed(vp) {
  let currentEnv = 'staging';
  let resolvedUrl = URLS[currentEnv];
  let fetching = false;

  function paint() {
    vp.innerHTML = shell(`
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;background:var(--casebook-surface-2);border:1px solid var(--casebook-border);border-radius:6px;padding:10px;margin-bottom:6px;">
        const API_URL = await fetch('/config.json').then(r =&gt; r.json()).then(c =&gt; c.apiUrl);
      </div>
      <p style="font-size:11.5px;margin:0;color:${fetching ? 'var(--casebook-ink-faint)' : 'var(--casebook-accent)'};font-weight:${fetching ? '400' : '600'};">
        ${fetching ? 'Fetching /config.json…' : `✓ Correct backend for this environment: ${resolvedUrl}`}
      </p>`);
    vp.querySelectorAll('.cbk-evb-env').forEach((btn) => {
      btn.style.outline = btn.dataset.env === currentEnv ? '2px solid var(--casebook-accent)' : 'none';
      btn.addEventListener('click', () => {
        currentEnv = btn.dataset.env;
        fetching = true;
        paint();
        setTimeout(() => {
          resolvedUrl = URLS[currentEnv];
          fetching = false;
          paint();
        }, 250);
      });
    });
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
