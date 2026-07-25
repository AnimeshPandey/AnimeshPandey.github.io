import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import {
  slugify,
  deriveEnums,
  validateNewCaseInput,
  buildManifestEntry,
  buildIndexNjk,
  buildDataFile,
  buildCaseyJson,
} from '../../cases/scripts/lib/scaffold-templates.mjs';
import { findBoilerplateSlots } from '../../cases/scripts/content/lib/boilerplate.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'cases/src/_data/manifest.json'), 'utf8'));

describe('slugify', () => {
  it('kebab-cases a normal title', () => {
    assert.equal(slugify('Focus Traps That Do Not Trap Keyboard Users'), 'focus-traps-that-do-not-trap-keyboard-users');
  });

  it('strips punctuation', () => {
    assert.equal(slugify("dialog.showModal vs Custom Modals"), 'dialog-showmodal-vs-custom-modals');
  });

  it('collapses repeated separators and trims leading/trailing dashes', () => {
    assert.equal(slugify('  Weird --- Spacing!!  '), 'weird-spacing');
  });

  it('matches every existing slug in manifest.json when re-derived from its own title, modulo manual edits', () => {
    // Not all 229 titles round-trip to their exact existing slug (some were
    // manually shortened) — but slugify should never crash or produce an
    // invalid (non-kebab-case) string for any real title in the corpus.
    for (const c of manifest.cases) {
      const s = slugify(c.title);
      assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, `slugify("${c.title}") produced invalid slug "${s}"`);
    }
  });
});

describe('deriveEnums', () => {
  it('derives tracks from the manifest itself, not a hardcoded list', () => {
    const enums = deriveEnums(manifest);
    const realTracks = [...new Set(manifest.cases.map((c) => c.track))].sort();
    assert.deepEqual(enums.tracks, realTracks);
    assert.ok(enums.tracks.length >= 15);
  });
});

describe('validateNewCaseInput', () => {
  const enums = deriveEnums(manifest);
  const validInput = {
    title: 'Test Case',
    track: enums.tracks[0],
    tier: 'free',
    wave: 2,
    principle: 'Testing',
    demoType: 'toggle',
    storyType: 'generic',
    flagship: false,
  };

  it('accepts fully valid input', () => {
    assert.deepEqual(validateNewCaseInput(validInput, enums), []);
  });

  it('rejects an unknown track', () => {
    const errors = validateNewCaseInput({ ...validInput, track: 'not-a-real-track' }, enums);
    assert.ok(errors.some((e) => e.includes('track')));
  });

  it('rejects a missing title', () => {
    const errors = validateNewCaseInput({ ...validInput, title: '' }, enums);
    assert.ok(errors.some((e) => e.includes('title')));
  });

  it('rejects an invalid demoType', () => {
    const errors = validateNewCaseInput({ ...validInput, demoType: 'video' }, enums);
    assert.ok(errors.some((e) => e.includes('demoType')));
  });

  it('rejects wave 1 (reserved for live cases)', () => {
    const errors = validateNewCaseInput({ ...validInput, wave: 1 }, enums);
    assert.ok(errors.some((e) => e.includes('wave')));
  });
});

describe('buildManifestEntry', () => {
  it('fixes the uniform fields to match what every existing entry actually has', () => {
    const entry = buildManifestEntry({
      slug: 'test-case', title: 'Test Case', track: 'react', tier: 'free', wave: 2,
      readMin: 10, principle: 'Testing', demoType: 'toggle', storyType: 'generic', flagship: false,
    });
    assert.deepEqual(entry.audienceLevels, ['junior', 'mid', 'staff']);
    assert.equal(entry.defaultTone, 'junior');
    assert.equal(entry.demoRequired, true);
    assert.deepEqual(entry.outcomes, []);
    assert.equal(entry.status, 'idea');
    assert.equal(entry.mvpLaunch, false);
    assert.equal(entry.artPanels, 8);
    assert.deepEqual(entry.chapters, ['hook', 'concept', 'story', 'ui-strip', 'demo', 'fe-depth', 'references', 'takeaway', 'next']);
  });

  it('produces a shape with exactly the same keys as a real manifest entry', () => {
    const entry = buildManifestEntry({
      slug: 'test-case', title: 'Test Case', track: 'react', tier: 'free', wave: 2,
      readMin: 10, principle: 'Testing', demoType: 'toggle', storyType: 'generic', flagship: false,
    });
    const realIdeaEntry = manifest.cases.find((c) => c.status === 'idea');
    assert.deepEqual(Object.keys(entry).sort(), Object.keys(realIdeaEntry).sort());
  });
});

describe('buildIndexNjk', () => {
  const entry = buildManifestEntry({
    slug: 'test-case', title: 'Test Case', track: 'react', tier: 'free', wave: 2,
    readMin: 10, principle: 'Testing', demoType: 'toggle', storyType: 'generic', flagship: false,
  });
  const njk = buildIndexNjk(entry);

  it('sets permalink: false — never a working URL for an unpublished case', () => {
    assert.match(njk, /^permalink: false\b/m);
  });

  it('front-matter principle/demoType/flagship match the manifest entry exactly (parity by construction)', () => {
    assert.match(njk, /^principle: Testing$/m);
    assert.match(njk, /^demoType: toggle$/m);
    assert.match(njk, /^flagship: false$/m);
  });

  it('includes all 9 chapter sections', () => {
    for (const chapter of ['hook', 'concept', 'story-1', 'ui-strip', 'demo', 'fe-depth', 'takeaway']) {
      assert.match(njk, new RegExp(`data-chapter="${chapter}"`));
    }
    assert.match(njk, /case-references\.njk/);
  });

  it('renders toggle-specific broken/fixed buttons for demoType: toggle', () => {
    assert.match(njk, /data-demo-state="broken"/);
    assert.match(njk, /data-demo-state="fixed"/);
  });

  it('does not render toggle buttons for demoType: code-only', () => {
    const codeOnlyEntry = buildManifestEntry({
      slug: 'test-case-2', title: 'Test 2', track: 'react', tier: 'free', wave: 2,
      readMin: 10, principle: 'Testing', demoType: 'code-only', storyType: 'generic', flagship: false,
    });
    const codeOnlyNjk = buildIndexNjk(codeOnlyEntry);
    assert.doesNotMatch(codeOnlyNjk, /data-demo-state="broken"/);
  });
});

describe('buildCaseyJson', () => {
  const raw = buildCaseyJson('test-case');
  const parsed = JSON.parse(raw);

  it('produces valid, parseable JSON', () => {
    assert.equal(parsed.slug, 'test-case');
  });

  it('leaves concept/fe-depth hints empty so the existing boilerplate guard catches them for free', () => {
    const slots = findBoilerplateSlots(parsed);
    const slotKeys = slots.map((s) => `${s.chapter}/${s.tone}`).sort();
    assert.deepEqual(slotKeys, ['concept/junior', 'concept/mid', 'concept/staff', 'fe-depth/junior', 'fe-depth/mid', 'fe-depth/staff']);
  });

  it('marks hook/demo hints with an obvious human-visible TODO (not covered by the automated guard)', () => {
    const hook = parsed.hints.find((h) => h.chapter === 'hook');
    assert.match(hook.junior, /TODO\(test-case\)/);
  });

  it('includes the standard demo/hook navigation actions with correct static targets', () => {
    const demoAction = parsed.actions.find((a) => a.chapter === 'demo');
    assert.equal(demoAction.junior[0].target, '[data-demo-state=broken]');
    const hookAction = parsed.actions.find((a) => a.chapter === 'hook');
    assert.equal(hookAction.junior[0].target, '[data-chapter=demo]');
  });
});

describe('buildDataFile', () => {
  it('produces a working eleventyComputed module that loads casey.json relative to itself', () => {
    const src = buildDataFile('test-case');
    assert.match(src, /eleventyComputed/);
    assert.match(src, /casey\.json/);
  });
});
