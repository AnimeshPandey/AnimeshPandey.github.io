import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = fs.readFileSync(path.join(ROOT, 'cases/src/assets/js/casey-companion.js'), 'utf8');

const DAY = 86400000;

/**
 * casey-companion.js is DOM-heavy overall, but dueForReview()/
 * pickReviewDueSlug() are pure — no document access — so a minimal
 * sandbox (bare window, no document/localStorage needed) is enough to
 * load the module and exercise just those two functions, same approach
 * as casey-guide.test.mjs uses for CaseyGuide.
 */
function makeCompanion() {
  const win = {};
  const ctx = vm.createContext({
    window: win,
    document: { getElementById: () => null, addEventListener: () => {} },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  });
  vm.runInContext(SRC, ctx);
  return win.CaseyCompanion;
}

// dueForReview() runs inside the vm context, so its return value is an
// inner-realm Array — deepEqual/deepStrictEqual against an outer-realm []
// literal treats them as unequal despite identical contents (a
// vm.createContext quirk, not a real difference). Array.from() re-wraps
// the result in the current (outer) realm before comparing.
function due(companion, progress, now) {
  return Array.from(companion.dueForReview(progress, now));
}

describe('dueForReview', () => {
  it('is not due before the 7-day mark', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const progress = { 'case-a': { completedAt: new Date(now - 3 * DAY).toISOString() } };
    assert.deepEqual(due(companion, progress, now), []);
  });

  it('is due within the 1-day catch window right after 7 days', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const progress = { 'case-a': { completedAt: new Date(now - 7.5 * DAY).toISOString() } };
    assert.deepEqual(due(companion, progress, now), ['case-a']);
  });

  it('is no longer due once past the 7-day catch window (until the next interval)', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const progress = { 'case-a': { completedAt: new Date(now - 10 * DAY).toISOString() } };
    assert.deepEqual(due(companion, progress, now), []);
  });

  it('is due again at the 30-day mark', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const progress = { 'case-a': { completedAt: new Date(now - 30.5 * DAY).toISOString() } };
    assert.deepEqual(due(companion, progress, now), ['case-a']);
  });

  it('is due at the 90-day mark and drops off the ladder after', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const at90 = { 'case-a': { completedAt: new Date(now - 90.5 * DAY).toISOString() } };
    assert.deepEqual(due(companion, at90, now), ['case-a']);
    const at200 = { 'case-a': { completedAt: new Date(now - 200 * DAY).toISOString() } };
    assert.deepEqual(due(companion, at200, now), []);
  });

  it('ignores entries with no completedAt (in-progress, not-yet-completed cases)', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const progress = { 'case-a': { chapter: 'demo', pct: 0.4, at: now - 8 * DAY } };
    assert.deepEqual(due(companion, progress, now), []);
  });

  it('returns multiple due slugs when more than one qualifies', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const progress = {
      'case-a': { completedAt: new Date(now - 7.2 * DAY).toISOString() },
      'case-b': { completedAt: new Date(now - 30.1 * DAY).toISOString() },
      'case-c': { completedAt: new Date(now - 3 * DAY).toISOString() },
    };
    assert.deepEqual(due(companion, progress, now).sort(), ['case-a', 'case-b']);
  });

  it('handles an empty or missing caseProgress gracefully', () => {
    const companion = makeCompanion();
    assert.deepEqual(due(companion, {}, Date.now()), []);
    assert.deepEqual(due(companion, undefined, Date.now()), []);
  });
});

describe('pickReviewDueSlug', () => {
  it('returns null when nothing is due', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const progress = { 'case-a': { completedAt: new Date(now - 1 * DAY).toISOString() } };
    assert.equal(companion.pickReviewDueSlug(progress, { 'case-a': 'Case A' }, now), null);
  });

  it('returns the due slug when its title is known', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const progress = { 'case-a': { completedAt: new Date(now - 7.5 * DAY).toISOString() } };
    assert.equal(companion.pickReviewDueSlug(progress, { 'case-a': 'Case A' }, now), 'case-a');
  });

  it('skips a due slug whose title is unknown (e.g. an idea-status case no longer in the live-title map)', () => {
    const companion = makeCompanion();
    const now = Date.now();
    const progress = {
      'unknown-slug': { completedAt: new Date(now - 7.5 * DAY).toISOString() },
      'case-b': { completedAt: new Date(now - 30.5 * DAY).toISOString() },
    };
    assert.equal(companion.pickReviewDueSlug(progress, { 'case-b': 'Case B' }, now), 'case-b');
  });
});
