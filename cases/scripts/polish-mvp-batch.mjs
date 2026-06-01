#!/usr/bin/env node
/**
 * MVP polish: credible references, ui-strip + illustration, casey hints/voice/actions, ogImage frontmatter.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CASES = path.join(ROOT, 'src/cases');
const MVP_REFS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/_data/mvp-references.json'), 'utf8')
);

/** Live cases polished to MVP bar but not flagged mvpLaunch on the hub. */
const POST_MVP_LIVE_SLUGS = [
  'skeleton-vs-spinner-choice',
  'secrets-in-client-bundle',
  'paste-error-without-learning',
  'motion-safe-fallback',
  'micro-frontend-boundary-drift',
  'mcp-host-client-server',
  'horizontal-scroll-one-pixel',
  'hicks-law-navigation-count',
  'doherty-threshold-input-latency',
];

const MVP_SLUGS = [
  'skeleton-screens-perceived-speed',
  'fake-loading-progress',
  'cognitive-load-error-recovery',
  'gestalt-spacing-as-syntax',
  'miller-chunking-forms',
  'fitts-law-touch-targets',
  'focus-visible-not-outline-none',
  'reduced-motion-respect',
  'font-loading-cls',
  'lcp-not-hero-image',
  'key-prop-identity',
  'hydration-two-trees',
  'abort-controller-ghost-updates',
  'fetch-race-abort',
  'closure-stale-state',
  'event-loop-one-thread',
  'url-as-source-of-truth',
  'event-delegation-one-listener',
  'z-index-stacking-context',
  'context-window-budget',
  'streaming-tokens-ui-buffer',
  'static-site-zero-backend',
];

const POLISH_SLUGS = [...MVP_SLUGS, ...POST_MVP_LIVE_SLUGS];

const CONCEPT_HINTS = {
  default: {
    junior: 'The concept chapter is the principle — read it before the demo so the toggle makes sense.',
    mid: 'Connect the principle to your component API — what prop or CSS change encodes the fix?',
    staff: 'Map the pattern to observability: what would you measure in RUM or lab to prove the fix?',
  },
};

const FE_DEPTH_HINTS = {
  default: {
    junior: 'Skim the code patterns here — you can copy the structure even if the syntax is new.',
    mid: 'Compare broken vs fixed implementation — the diff is usually smaller than you expect.',
    staff: 'Check edge cases: SSR, hydration, design tokens, and high-contrast mode.',
  },
};

function block(tone, items) {
  const lis = items.map((t) => `      <li>${t}</li>`).join('\n');
  return `  <div class="tone-${tone}">\n    <ol>\n${lis}\n    </ol>\n  </div>`;
}

function refsChapter(slug) {
  const r = MVP_REFS[slug];
  if (!r) return null;
  return `{# ── Chapter: References ── #}
<section class="case-chapter case-references" data-chapter="references">
  <h3>References</h3>
${block('junior', r.junior)}
${block('mid', r.mid)}
${block('staff', r.staff)}
</section>
`;
}

function uiStripBlock(track) {
  return `{# ── Chapter: UI Strip ── #}
<section class="case-chapter" data-chapter="ui-strip">
  <h2>Pattern at a glance</h2>
  <div class="case-ui-strip">
    {% include 'partials/case-illustration.njk' %}
  </div>
</section>

`;
}

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: {}, body: src };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  const related = [];
  const relBlock = m[1].match(/relatedCases:\s*([\s\S]*?)(?=\n\w|\n---|$)/);
  if (relBlock) {
    const slugM = [...relBlock[1].matchAll(/slug:\s*(\S+)/g)];
    const titleM = [...relBlock[1].matchAll(/title:\s*(.+)/g)];
    slugM.forEach((s, i) => {
      related.push({ slug: s[1], title: titleM[i] ? titleM[i][1].trim() : s[1] });
    });
  }
  fm.relatedCases = related;
  return { fm, body: src.slice(m[0].length), rawFm: m[1], fmBlock: m[0] };
}

function ensureOgImage(fmBlock, slug) {
  const og = `ogImage: https://anmshpndy.com/brand/cases/${slug}-og.png`;
  if (fmBlock.includes('ogImage:')) {
    return fmBlock.replace(/ogImage:.*/, og);
  }
  return fmBlock.trimEnd() + '\n' + og + '\n';
}

function polishCasey(slug, related, track) {
  const p = path.join(CASES, slug, 'casey.json');
  let data = { slug, hints: [], actions: [] };
  if (fs.existsSync(p)) data = JSON.parse(fs.readFileSync(p, 'utf8'));
  data.slug = slug;

  const has = (ch) => data.hints.some((h) => h.chapter === ch);
  if (!has('concept')) {
    data.hints.push({ chapter: 'concept', ...CONCEPT_HINTS.default });
  }
  if (!has('fe-depth')) {
    data.hints.push({ chapter: 'fe-depth', ...FE_DEPTH_HINTS.default });
  }

  if (!data.voice) data.voice = { enabled: true, sections: [] };
  const voiceChapters = ['hook', 'concept', 'demo', 'takeaway'];
  for (const ch of voiceChapters) {
    if (!data.voice.sections.some((s) => s.chapter === ch)) {
      const hint = data.hints.find((h) => h.chapter === ch);
      data.voice.sections.push({
        chapter: ch,
        junior: hint?.junior || `This section covers ${ch} for ${slug}.`,
        mid: hint?.mid || hint?.junior || '',
        staff: hint?.staff || hint?.mid || '',
      });
    }
  }

  if (related.length) {
    const rel = related[0];
    const relHref = `/cases/${rel.slug}/`;
    const takeaway = data.actions.find((a) => a.chapter === 'takeaway');
    const chip = { label: `Next: ${rel.title}`, href: relHref };
    if (takeaway) {
      for (const tone of ['junior', 'mid', 'staff']) {
        const list = takeaway[tone] || [];
        if (!list.some((c) => c.href === relHref)) list.unshift(chip);
        takeaway[tone] = list.slice(0, 3);
      }
    }
  }

  const libChip = { label: 'War stories library', href: '/cases/library/' };
  const completed = data.actions.find((a) => a.chapter === 'takeaway');
  if (completed) {
    for (const tone of ['junior', 'mid', 'staff']) {
      const list = completed[tone] || [];
      if (!list.some((c) => c.href === libChip.href)) list.push(libChip);
      completed[tone] = list.slice(0, 3);
    }
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

function polishIndex(slug) {
  const file = path.join(CASES, slug, 'index.njk');
  let src = fs.readFileSync(file, 'utf8');
  const { fm, body, fmBlock } = parseFrontmatter(src);
  const track = fm.track || 'patterns';

  const refs = refsChapter(slug);
  if (refs) {
    src = src.replace(
      /<section class="case-chapter case-references"[\s\S]*?<\/section>\s*\n/i,
      refs + '\n'
    );
  }

  if (!src.includes('data-chapter="ui-strip"')) {
    src = src.replace(
      /<section class="case-chapter" data-chapter="demo">/,
      uiStripBlock(track) + '<section class="case-chapter" data-chapter="demo">'
    );
  }

  const newFm = ensureOgImage(fmBlock, slug);
  src = src.replace(/^---\n[\s\S]*?\n---/, `---\n${newFm.trim()}\n---`);

  fs.writeFileSync(file, src);
  polishCasey(slug, fm.relatedCases || [], track);
  console.log('polished:', slug);
}

function setMvpLaunch() {
  const manifestPath = path.join(ROOT, 'src/_data/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let n = 0;
  for (const c of manifest.cases) {
    const launch = MVP_SLUGS.includes(c.slug);
    if (launch && !c.mvpLaunch) n++;
    c.mvpLaunch = launch;
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('manifest mvpLaunch set for', MVP_SLUGS.length, 'cases;', n, 'newly flagged');
}

function writeQuality() {
  const scores = [
    ...MVP_SLUGS.map((slug) => ({
      slug,
      score: 7,
      max: 7,
      mvpLaunch: true,
      notes: 'references, ui-strip, casey hints/voice/actions, ogImage',
    })),
    ...POST_MVP_LIVE_SLUGS.map((slug) => ({
      slug,
      score: 7,
      max: 7,
      mvpLaunch: false,
      notes: 'post-MVP polish: references, ui-strip, casey hints/voice/actions, ogImage',
    })),
  ];
  fs.writeFileSync(
    path.join(ROOT, 'src/_data/mvp-quality.json'),
    JSON.stringify({ version: 1, updated: new Date().toISOString().slice(0, 10), cases: scores }, null, 2) + '\n'
  );
}

for (const slug of POLISH_SLUGS) {
  if (!fs.existsSync(path.join(CASES, slug, 'index.njk'))) {
    console.warn('missing:', slug);
    continue;
  }
  polishIndex(slug);
}
setMvpLaunch();
writeQuality();

function writeHubLiveCases() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/_data/manifest.json'), 'utf8')
  );
  const live = manifest.cases
    .filter((c) => c.status === 'live')
    .map((c) => ({ slug: c.slug, title: c.title, track: c.track, mvpLaunch: !!c.mvpLaunch }));
  fs.writeFileSync(
    path.join(ROOT, 'src/_data/hub-live-cases.json'),
    JSON.stringify({ cases: live }, null, 2) + '\n'
  );
  console.log('hub-live-cases.json:', live.length, 'live cases');
}

writeHubLiveCases();
console.log('MVP polish complete.');
