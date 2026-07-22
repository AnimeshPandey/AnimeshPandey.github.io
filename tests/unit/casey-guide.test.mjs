import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GUIDE_SRC = fs.readFileSync(
  path.join(ROOT, 'cases/src/assets/js/casey-guide.js'),
  'utf8'
);

/** Spin up a sandboxed CaseyGuide with controlled localStorage and guide lines. */
function makeGuide(storageData = {}, guideLines = null, companionState = null) {
  const ls = {};
  Object.assign(ls, storageData);
  const mockWindow = { CaseyGuide: null, __GUIDE_LINES: guideLines };
  if (companionState) {
    mockWindow.CaseyCompanion = { getState: () => companionState };
  }
  const ctx = vm.createContext({
    window: mockWindow,
    localStorage: { getItem: (k) => ls[k] ?? null, setItem: (k, v) => { ls[k] = v; } },
    document: { dispatchEvent: () => {} },
  });
  vm.runInContext(GUIDE_SRC, ctx);
  return mockWindow.CaseyGuide;
}

const LINES = {
  hub: {
    first_visit:   [{ pose: 'wave',      line: 'Welcome!' }],
    return_low:    [{ pose: 'idle',      line: 'Back! {completed} done.' }],
    return_high:   [{ pose: 'proud',     line: 'High achiever — {completed}.' }],
    return_streak: [{ pose: 'celebrate', line: 'Streak of {streak}!' }],
    zero_results:  [{ pose: 'curious',   line: 'Nothing here.' }],
  },
  case: {
    start:     [{ pose: 'point',     line: "Let's go!" }],
    completed: [{ pose: 'celebrate', line: 'You nailed it!' }],
  },
  library: {
    visit: [{ pose: 'read', line: 'Great reads.' }],
  },
};

function storageFor(casesCompleted = [], caseProgress = null) {
  const val = caseProgress
    ? JSON.stringify({ caseProgress })
    : JSON.stringify({ casesCompleted });
  return { 'casebook-companion-v1': val };
}

describe('CaseyGuide', () => {
  it('returns null when __GUIDE_LINES is missing', () => {
    const g = makeGuide({}, null);
    assert.equal(g.suggest('hub'), null);
  });

  it('hub first_visit for zero completions', () => {
    const g = makeGuide({}, LINES);
    const r = g.suggest('hub');
    assert.ok(r, 'should return a suggestion');
    assert.equal(r.pose, 'wave');
    assert.equal(r.line, 'Welcome!');
  });

  it('hub return_low interpolates {completed}', () => {
    const g = makeGuide(storageFor(['a', 'b']), LINES);
    const r = g.suggest('hub');
    assert.equal(r.pose, 'idle');
    assert.ok(r.line.includes('2'), `expected "2" in "${r.line}"`);
  });

  it('hub return_high for >= 10 completions', () => {
    const completed = Array.from({ length: 10 }, (_, i) => `case-${i}`);
    const g = makeGuide(storageFor(completed), LINES);
    const r = g.suggest('hub');
    assert.equal(r.pose, 'proud');
    assert.ok(r.line.includes('10'));
  });

  it('hub return_streak for >= 3 recent completions', () => {
    const cp = {};
    for (let i = 0; i < 3; i++) {
      cp[`case-${i}`] = { completedAt: new Date().toISOString() };
    }
    const g = makeGuide(storageFor([], cp), LINES);
    const r = g.suggest('hub');
    assert.equal(r.pose, 'celebrate');
    assert.ok(r.line.includes('3'));
  });

  it('hub-zero returns curious pose', () => {
    const g = makeGuide({}, LINES);
    assert.equal(g.suggest('hub-zero')?.pose, 'curious');
  });

  it('case-start returns point pose', () => {
    const g = makeGuide({}, LINES);
    assert.equal(g.suggest('case-start')?.pose, 'point');
  });

  it('case-completed returns celebrate pose', () => {
    const g = makeGuide({}, LINES);
    assert.equal(g.suggest('case-completed')?.pose, 'celebrate');
  });

  it('library returns read pose', () => {
    const g = makeGuide({}, LINES);
    assert.equal(g.suggest('library')?.pose, 'read');
  });

  it('unknown context returns null', () => {
    const g = makeGuide({}, LINES);
    assert.equal(g.suggest('not-a-real-context'), null);
  });

  it('getProgress returns correct completedCount via legacy shape', () => {
    const g = makeGuide(storageFor(['a', 'b', 'c']), LINES);
    const p = g.getProgress();
    assert.equal(p.completedCount, 3);
    // firstVisit only inspects caseProgress (new shape); legacy casesCompleted is ignored here
    assert.equal(p.firstVisit, true);
  });

  it('getProgress returns correct completedCount via new caseProgress shape', () => {
    const cp = { 'case-a': { completedAt: '2026-01-01T00:00:00Z' } };
    const g = makeGuide(storageFor([], cp), LINES);
    const p = g.getProgress();
    assert.equal(p.completedCount, 1);
  });

  it('getProgress shows firstVisit=true for empty storage', () => {
    const g = makeGuide({}, LINES);
    assert.equal(g.getProgress().firstVisit, true);
  });

  it('prefers new caseProgress count over legacy casesCompleted', () => {
    // Both present; new shape should win as long as count > 0
    const val = JSON.stringify({
      casesCompleted: ['old'],
      caseProgress: {
        'new-a': { completedAt: new Date().toISOString() },
        'new-b': { completedAt: new Date().toISOString() },
      },
    });
    const g = makeGuide({ 'casebook-companion-v1': val }, LINES);
    assert.equal(g.getProgress().completedCount, 2);
  });

  it('reads progress via window.CaseyCompanion.getState() when available, not raw localStorage', () => {
    // Stale/empty localStorage should be ignored once CaseyCompanion (and
    // therefore CasebookProgressStore, which may be backend-synced) is
    // present — this is the seam a future account-sync adapter relies on.
    const staleStorage = storageFor(['a']);
    const freshCompanionState = { caseProgress: {
      x: { completedAt: new Date().toISOString() },
      y: { completedAt: new Date().toISOString() },
      z: { completedAt: new Date().toISOString() },
    } };
    const g = makeGuide(staleStorage, LINES, freshCompanionState);
    assert.equal(g.getProgress().completedCount, 3);
  });
});
