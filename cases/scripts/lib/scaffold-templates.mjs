/**
 * scaffold-templates.mjs — pure template-generation functions for
 * cases/scripts/scaffold-case.mjs. No file I/O here (that lives in the
 * CLI itself) so every function here is unit-testable in isolation.
 */

const CHAPTERS = ['hook', 'concept', 'story', 'ui-strip', 'demo', 'fe-depth', 'references', 'takeaway', 'next'];
const DEMO_TYPES = ['toggle', 'animation', 'code-only'];
const STORY_TYPES = ['generic', 'war-story'];
const TIERS = ['free', 'pro'];
const WAVES = [2, 3, 4]; // wave 1 is live; scaffolded cases always start in an upcoming wave

/** kebab-case a title into a slug, matching the convention used by every existing slug in manifest.json. */
export function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Derives valid enum values from the manifest itself, so they can never drift from what the site actually uses. */
export function deriveEnums(manifest) {
  const cases = manifest.cases ?? [];
  const tracks = [...new Set(cases.map((c) => c.track))].sort();
  return {
    tracks,
    tiers: TIERS,
    demoTypes: DEMO_TYPES,
    storyTypes: STORY_TYPES,
    waves: WAVES,
  };
}

export function validateNewCaseInput(input, enums) {
  const errors = [];
  if (!input.title || !input.title.trim()) errors.push('title is required');
  if (!enums.tracks.includes(input.track)) {
    errors.push(`track "${input.track}" is not one of the existing tracks: ${enums.tracks.join(', ')}`);
  }
  if (!enums.tiers.includes(input.tier)) errors.push(`tier must be one of: ${enums.tiers.join(', ')}`);
  if (!enums.demoTypes.includes(input.demoType)) errors.push(`demoType must be one of: ${enums.demoTypes.join(', ')}`);
  if (!enums.storyTypes.includes(input.storyType)) errors.push(`storyType must be one of: ${enums.storyTypes.join(', ')}`);
  if (!enums.waves.includes(input.wave)) errors.push(`wave must be one of: ${enums.waves.join(', ')}`);
  if (!input.principle || !input.principle.trim()) errors.push('principle is required');
  return errors;
}

/**
 * Builds a new manifest.json case entry. Fields not exposed as scaffold
 * prompts (audienceLevels, defaultTone, demoRequired, outcomes, chapters,
 * artPanels) are uniform across all 229 existing entries — verified
 * during this session's audit — so they're fixed constants here, not
 * user input, and can't be typo'd into a one-off inconsistent shape.
 */
export function buildManifestEntry({ slug, title, track, tier, wave, readMin, principle, demoType, storyType, flagship }) {
  return {
    slug,
    title,
    track,
    tier,
    wave,
    readMin: readMin ?? 10,
    principle,
    demoType,
    demoRequired: true,
    storyType,
    referenceKeys: [],
    audienceLevels: ['junior', 'mid', 'staff'],
    defaultTone: 'junior',
    flagship: Boolean(flagship),
    priority: 'medium',
    chapters: CHAPTERS,
    artPanels: 8,
    status: 'idea',
    outcomes: [],
    mvpLaunch: false,
  };
}

function toneBlock(chapter, tone, slug) {
  return `  <div class="tone-${tone}">
    <p>TODO(${slug}): ${chapter}/${tone} copy.</p>
  </div>`;
}

/**
 * Generates the front-matter + body skeleton for a case's index.njk.
 *
 * permalink is deliberately `false` — a real permalink makes Eleventy
 * build and deploy this page regardless of manifest.json's `status`
 * field (verified: the publish workflow only flips `status`, it never
 * touches a case's own front-matter). A scaffolded, unpublished case
 * must not be reachable by any URL until it goes through the real
 * confirm-publish.py gate, which is expected to flip this line.
 */
export function buildIndexNjk(entry) {
  const { slug, title, track, readMin, flagship, demoType, principle } = entry;
  const frontMatter = `---
layout: layouts/case-layout.njk
permalink: false # DO NOT change by hand — flip only via confirm-publish.py at real publish time
title: "${title}"
description: "TODO(${slug}): one-sentence description for SEO/social."
slug: ${slug}
track: ${track}
readMin: ${readMin}
flagship: ${flagship}
demoType: ${demoType}
principle: ${principle}
schemaType: Article
relatedCases: []
ogImage: https://anmshpndy.com/brand/cases/${slug}-og.png
---`;

  const demoButtons =
    demoType === 'toggle'
      ? `        <div class="case-demo__controls" role="group" aria-label="Demo controls">
          <button type="button" class="case-demo__btn" data-demo-state="broken" aria-pressed="false">
            TODO: broken-state label
          </button>
          <button type="button" class="case-demo__btn" data-demo-state="fixed" aria-pressed="true">
            TODO: fixed-state label
          </button>
        </div>
        <p class="case-demo__state-label" aria-live="polite">Showing: TODO fixed-state label</p>
        <div class="case-demo__viewport" id="demo-viewport" style="min-height:160px;"></div>`
      : `        <div class="case-demo__viewport" id="demo-viewport" style="min-height:160px;"></div>`;

  const body = `
{# ── Chapter: Hook ── #}
<section class="case-chapter" data-chapter="hook">
  <h2>TODO(${slug}): hook headline</h2>
${['junior', 'mid', 'staff'].map((t) => toneBlock('hook', t, slug)).join('\n')}
</section>

{# ── Chapter: Concept ── #}
<section class="case-chapter" data-chapter="concept">
  <h2>TODO(${slug}): concept headline</h2>
${['junior', 'mid', 'staff'].map((t) => toneBlock('concept', t, slug)).join('\n')}
</section>

{# ── Chapter: Story ── #}
<section class="case-chapter" data-chapter="story-1">
  <h2>TODO(${slug}): story headline</h2>
${['junior', 'mid', 'staff'].map((t) => toneBlock('story', t, slug)).join('\n')}
</section>

{# ── Chapter: UI strip ── #}
<section class="case-chapter" data-chapter="ui-strip">
  <h2>Pattern at a glance</h2>
  <div class="case-ui-strip">
    <p class="case-ui-strip__label">TODO(${slug}): annotated before/after label</p>
  </div>
</section>

<section class="case-chapter" data-chapter="demo">
  <h2>TODO(${slug}): demo headline</h2>
${['junior', 'mid', 'staff'].map((t) => toneBlock('demo', t, slug)).join('\n')}

  <section class="case-demo"
           aria-label="TODO(${slug}): demo aria-label"
           data-required="true"
           data-demo-type="${demoType}"
           data-demo-slug="${slug}">

    <div class="case-demo__header">
      <span class="case-demo__title">⚡ Interactive demo</span>
    </div>

    <div class="case-demo__body">
      <noscript>
        <div class="case-demo__noscript">
          <p><strong>Demo requires JavaScript.</strong> TODO(${slug}): noscript summary.</p>
        </div>
      </noscript>

      <div class="case-demo__interactive" hidden>
${demoButtons}
      </div>
    </div>
  </section>
</section>

{# ── Chapter: FE Depth ── #}
<section class="case-chapter" data-chapter="fe-depth">
  <h2>TODO(${slug}): fe-depth headline</h2>
${['junior', 'mid', 'staff'].map((t) => toneBlock('fe-depth', t, slug)).join('\n')}
</section>

{# ── Chapter: References ── #}
{# Renders automatically from mvp-references.json[slug] if an entry exists — #}
{# add one there with real, human-verified links; do not fabricate URLs. #}
{% include 'partials/case-references.njk' %}

{# ── Chapter: Takeaway ── #}
<section class="case-chapter" data-chapter="takeaway">
  <h2>Remember</h2>
  <div class="case-takeaway">
    <h3>Key takeaways</h3>
    <ul>
      <li>
        <div class="tone-junior">TODO(${slug}): takeaway 1, junior.</div>
        <div class="tone-mid">TODO(${slug}): takeaway 1, mid.</div>
        <div class="tone-staff">TODO(${slug}): takeaway 1, staff.</div>
      </li>
    </ul>
  </div>
</section>
`;

  return `${frontMatter}\n${body}`;
}

/** Every existing case's directory-data file is functionally identical — just loads its own casey.json. */
export function buildDataFile(slug) {
  return `const path = require('path');
const fs   = require('fs');

module.exports = {
  eleventyComputed: {
    caseyData(data) {
      const jsonPath = path.join(__dirname, 'casey.json');
      try {
        return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (_) {
        return {};
      }
    },
  },
};
`;
}

/**
 * Builds a scaffolded casey.json. hook/demo hints get an obvious human-
 * visible TODO marker (findBoilerplateSlots() only checks concept/
 * fe-depth, so hook/demo need a marker a person will actually notice).
 * concept/fe-depth hints are left as genuinely empty strings — matching
 * exactly what findBoilerplateSlots() (cases/scripts/content/lib/
 * boilerplate.mjs) already treats as "needs a draft", so a scaffolded
 * case is automatically caught by the existing guard with zero new code
 * required, and is honestly marked incomplete rather than carrying
 * decoy boilerplate text the way the pre-audit 165 slots did.
 */
export function buildCaseyJson(slug) {
  const hintChapter = (chapter, guarded) => ({
    chapter,
    junior: guarded ? '' : `TODO(${slug}): ${chapter}/junior hint`,
    mid: guarded ? '' : `TODO(${slug}): ${chapter}/mid hint`,
    staff: guarded ? '' : `TODO(${slug}): ${chapter}/staff hint`,
  });

  const data = {
    slug,
    hints: [
      hintChapter('hook', false),
      hintChapter('demo', false),
      hintChapter('concept', true),
      hintChapter('fe-depth', true),
    ],
    anecdotes: [],
    voice: {
      enabled: true,
      sections: [
        { chapter: 'hook', junior: `TODO(${slug}): hook voice, junior.`, mid: '', staff: '' },
        { chapter: 'concept', junior: 'The concept chapter is the principle. Read it before the demo so the toggle makes sense.', mid: '', staff: '' },
        { chapter: 'demo', junior: `TODO(${slug}): demo voice, junior.`, mid: '', staff: '' },
        { chapter: 'takeaway', junior: `This section covers takeaway for ${slug}.`, mid: '', staff: '' },
      ],
    },
    actions: [
      {
        chapter: 'demo',
        junior: [
          { label: 'Try broken', target: '[data-demo-state=broken]' },
          { label: 'Try fixed', target: '[data-demo-state=fixed]' },
        ],
        mid: [
          { label: 'Toggle broken', target: '[data-demo-state=broken]' },
          { label: 'Toggle fixed', target: '[data-demo-state=fixed]' },
        ],
        staff: [
          { label: 'Broken state', target: '[data-demo-state=broken]' },
          { label: 'Fixed state', target: '[data-demo-state=fixed]' },
        ],
      },
      {
        chapter: 'hook',
        junior: [{ label: 'Jump to demo', target: '[data-chapter=demo]' }],
        mid: [{ label: 'Skip to demo', target: '[data-chapter=demo]' }],
        staff: [{ label: 'Demo chapter', target: '[data-chapter=demo]' }],
      },
      {
        chapter: 'takeaway',
        junior: [
          { label: `TODO(${slug}): next case link`, href: null },
          { label: 'Back to all cases', href: '/cases/' },
          { label: 'Reading library', href: '/cases/library/' },
        ],
        mid: [
          { label: `TODO(${slug}): next case link`, href: null },
          { label: 'Hub', href: '/cases/' },
          { label: 'Library', href: '/cases/library/' },
        ],
        staff: [
          { label: `TODO(${slug}): next case link`, href: null },
          { label: 'Case hub', href: '/cases/' },
          { label: 'War stories', href: '/cases/library/' },
        ],
      },
    ],
  };
  return JSON.stringify(data, null, 2) + '\n';
}
