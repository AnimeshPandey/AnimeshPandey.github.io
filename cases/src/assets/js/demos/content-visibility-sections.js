import { wireToggleDemo, PRM } from './_demo-utils.js';

const SECTION_TITLES = [
  'Getting started', 'Installation', 'Configuration', 'Authentication',
  'Data fetching', 'Error handling', 'Deployment', 'Troubleshooting',
];

const FILLER =
  'Representative filler standing in for real documentation prose — the point of this demo ' +
  'is the layout behavior around each section, not the copy itself.';

const JUMP_TOLERANCE_PX = 20;

function buildSections() {
  return SECTION_TITLES.map((title, i) => `
    <section data-idx="${i}" style="content-visibility:auto;padding:14px 16px;border-bottom:1px solid var(--casebook-border);box-sizing:border-box;">
      <h4 style="margin:0 0 8px;font-size:13px;color:var(--casebook-ink);">${i + 1}. ${title}</h4>
      <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:var(--casebook-ink-muted);">${FILLER}</p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:var(--casebook-ink-muted);">${FILLER}</p>
    </section>`).join('');
}

function setup(vp, useContain) {
  vp.innerHTML = `
    <div style="padding:14px 16px;">
      <p style="font-size:11px;color:var(--casebook-ink-faint);margin:0 0 10px;">
        ${useContain
          ? '✓ content-visibility: auto + contain-intrinsic-size — reserved space, no jump'
          : '✗ content-visibility: auto alone — off-screen sections collapse to near-zero height'}
      </p>
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
        <button id="cbk-cv-scroll" style="padding:6px 12px;background:var(--casebook-accent);color:var(--casebook-bg);border:none;border-radius:6px;font-size:11px;cursor:pointer;min-height:32px;">▶ Auto-scroll</button>
        <span id="cbk-cv-jumps" style="font-size:11px;color:var(--casebook-ink-faint);">Layout jumps detected: 0</span>
      </div>
      <div id="cbk-cv-scroller" style="height:200px;overflow-y:auto;border:1px solid var(--casebook-border);border-radius:6px;background:var(--casebook-surface-2);" tabindex="0" aria-label="Scrollable 8-section mini page — content-visibility: auto applied to each section">${buildSections()}</div>
    </div>`;

  const scroller = vp.querySelector('#cbk-cv-scroller');
  const jumpsEl = vp.querySelector('#cbk-cv-jumps');
  const btn = vp.querySelector('#cbk-cv-scroll');

  // Each <section> above has real content-visibility: auto applied (inspect
  // via DevTools) — browsers vary in exactly when their async relevancy
  // check fires, so the collapse/reserve timing that produces the visible
  // jump is driven explicitly here via IntersectionObserver against the
  // scroller, reproducing the documented spec behavior deterministically:
  // off-screen sections collapse toward zero height with no
  // contain-intrinsic-size, or hold a reserved placeholder height (the
  // section's own real measured height, matching what
  // contain-intrinsic-size: auto converges to) with it.
  const sections = Array.from(scroller.querySelectorAll('section'));
  const realHeight = new Map(sections.map((sec) => [sec, sec.getBoundingClientRect().height]));

  let jumps = 0;

  function recordTransition(fromHeight, toHeight) {
    if (Math.abs(toHeight - fromHeight) > JUMP_TOLERANCE_PX) {
      jumps++;
      jumpsEl.textContent = `Layout jumps detected: ${jumps}`;
      jumpsEl.style.color = '#B2555D';
      scroller.style.boxShadow = 'inset 0 0 0 2px #B2555D';
      setTimeout(() => { scroller.style.boxShadow = 'none'; }, 180);
    }
  }

  function collapse(sec) {
    if (sec.dataset.collapsed === '1') return;
    sec.dataset.collapsed = '1';
    const before = realHeight.get(sec);
    const after = useContain ? before : 0;
    recordTransition(before, after);
    sec.style.height = after + 'px';
    sec.style.overflow = 'hidden';
    sec.style.paddingTop = '0px';
    sec.style.paddingBottom = '0px';
  }
  function reveal(sec) {
    if (sec.dataset.collapsed !== '1') return;
    sec.dataset.collapsed = '0';
    const before = useContain ? realHeight.get(sec) : 0;
    const after = realHeight.get(sec);
    recordTransition(before, after);
    sec.style.height = '';
    sec.style.overflow = '';
    sec.style.paddingTop = '';
    sec.style.paddingBottom = '';
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target);
        else collapse(entry.target);
      }
    },
    { root: scroller, threshold: 0 }
  );
  sections.forEach((sec) => io.observe(sec));

  let rafId = null;

  btn.addEventListener('click', () => {
    if (rafId) cancelAnimationFrame(rafId);
    jumps = 0;
    jumpsEl.textContent = 'Layout jumps detected: 0';
    jumpsEl.style.color = '';
    scroller.scrollTop = 0;

    const target = scroller.scrollHeight - scroller.clientHeight;
    if (PRM) {
      scroller.scrollTop = target;
      return;
    }
    const start = performance.now();
    const duration = 2400;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      scroller.scrollTop = t * target;
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
      }
    }
    rafId = requestAnimationFrame(step);
  });
}

export function initDemo(root) {
  wireToggleDemo(root, {
    renderBroken: (vp) => setup(vp, false),
    renderFixed: (vp) => setup(vp, true),
  });
}
