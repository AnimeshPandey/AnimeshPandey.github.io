import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { caseNav, liveCases, liveCaseCount } = require(path.join(ROOT, 'cases/lib/case-navigation.js'));

describe('case-navigation', () => {
  it('exports live case count', () => {
    assert.ok(liveCaseCount >= 31);
    assert.equal(liveCases.length, liveCaseCount);
  });

  it('returns null for unknown slug', () => {
    assert.equal(caseNav('not-a-real-slug-xyz'), null);
  });

  it('returns nav for flagship case', () => {
    const nav = caseNav('abort-controller-ghost-updates');
    assert.ok(nav);
    assert.equal(nav.current.slug, 'abort-controller-ghost-updates');
    assert.ok(nav.next);
    assert.equal(nav.trackIndex, 1);
    assert.ok(nav.trackTotal >= 1);
    assert.ok(nav.liveTotal === liveCaseCount);
    assert.match(nav.trackLabel, /Javascript/i);
  });

  it('next in track differs from current when multiple in track', () => {
    const multiTrack = liveCases.filter((c) => c.track === 'javascript');
    if (multiTrack.length < 2) return;
    const nav = caseNav(multiTrack[0].slug);
    assert.notEqual(nav.next.slug, nav.current.slug);
    assert.equal(
      liveCases.filter((c) => c.track === multiTrack[0].track).findIndex((c) => c.slug === nav.next.slug),
      1
    );
  });

  it('wraps next when last in track', () => {
    const byTrack = {};
    for (const c of liveCases) {
      if (!byTrack[c.track]) byTrack[c.track] = [];
      byTrack[c.track].push(c);
    }
    const track = Object.keys(byTrack).find((t) => byTrack[t].length === 1);
    if (!track) return;
    const nav = caseNav(byTrack[track][0].slug);
    assert.ok(nav.next);
    assert.notEqual(nav.next.slug, nav.current.slug);
  });

  it('every live case has next and valid href', () => {
    for (const c of liveCases) {
      const nav = caseNav(c.slug);
      assert.ok(nav, c.slug);
      assert.ok(nav.next, `${c.slug} next`);
      assert.match(nav.next.href, /^\/[a-z0-9-]+\/$/);
    }
  });
});
