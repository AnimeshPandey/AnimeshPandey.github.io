import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = fs.readFileSync(path.join(ROOT, 'cases/src/assets/js/casebook-search.js'), 'utf8');

const FIXTURE_INDEX = {
  cases: [
    { type: 'case', slug: 'flex-min-width-zero', title: 'flex: min-width: 0 Saves Dashboards', track: 'css-layout', principle: 'Flexbox', tier: 'free', status: 'idea', url: null },
    { type: 'case', slug: 'capture-vs-bubble', title: 'Capture vs Bubble: Who Wins?', track: 'browser-dom', principle: 'Event phases', tier: 'free', status: 'idea', url: null },
    { type: 'case', slug: 'key-prop-identity', title: 'Keys Are Identity, Not Index', track: 'react', principle: 'Reconciliation', tier: 'free', status: 'live', url: '/cases/key-prop-identity/' },
  ],
  library: [
    { type: 'library', slug: 'some-flexbox-article', title: 'Deep dive into Flexbox layout', company: 'Example Co', track: 'css-layout', url: 'https://example.com/flexbox', mapsToSlug: null },
  ],
};

function makeSandbox(fetchImpl) {
  const win = {};
  const ctx = vm.createContext({
    window: win,
    fetch: fetchImpl,
  });
  vm.runInContext(SRC, ctx);
  return win.CasebookSearch;
}

function fetchResolving(data) {
  return () => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
}

describe('CasebookSearch', () => {
  it('exposes search() and loadIndex() on window.CasebookSearch', () => {
    const api = makeSandbox(fetchResolving(FIXTURE_INDEX));
    assert.equal(typeof api.search, 'function');
    assert.equal(typeof api.loadIndex, 'function');
  });

  it('empty or whitespace query resolves to an empty array without fetching', async () => {
    let fetchCalled = false;
    const api = makeSandbox(() => { fetchCalled = true; return fetchResolving(FIXTURE_INDEX)(); });
    const results = await api.search('   ');
    // results is an array from inside the vm context — compare by length,
    // not deepEqual against an outer-realm [] literal (vm.createContext
    // gives inner-realm arrays a different identity than outer-realm ones,
    // which deepEqual/deepStrictEqual treats as unequal despite both being
    // empty arrays).
    assert.equal(results.length, 0);
    assert.equal(fetchCalled, false);
  });

  it('finds a case by exact title substring', async () => {
    const api = makeSandbox(fetchResolving(FIXTURE_INDEX));
    const results = await api.search('flexbox');
    const slugs = results.map((r) => r.doc.slug);
    assert.ok(slugs.includes('flex-min-width-zero'));
  });

  it('ranks an exact title match above a partial match', async () => {
    const api = makeSandbox(fetchResolving(FIXTURE_INDEX));
    const results = await api.search('capture vs bubble: who wins?');
    assert.equal(results[0].doc.slug, 'capture-vs-bubble');
  });

  it('ranks a live case above an idea-status case when their scores would otherwise tie', async () => {
    // Both docs match only on track (same track string, same length —
    // identical score contribution), isolating the live-case tiebreak bonus.
    const tieIndex = {
      cases: [
        { type: 'case', slug: 'idea-one', title: 'Something Unrelated', track: 'testing-quality', principle: 'X', tier: 'free', status: 'idea', url: null },
        { type: 'case', slug: 'live-one', title: 'Something Else Unrelated', track: 'testing-quality', principle: 'Y', tier: 'free', status: 'live', url: '/cases/live-one/' },
      ],
      library: [],
    };
    const api = makeSandbox(fetchResolving(tieIndex));
    const results = await api.search('testing-quality');
    assert.equal(results.length, 2);
    assert.equal(results[0].doc.slug, 'live-one');
  });

  it('matches case-insensitively', async () => {
    const api = makeSandbox(fetchResolving(FIXTURE_INDEX));
    const lower = await api.search('bubble');
    const upper = await api.search('BUBBLE');
    assert.deepEqual(lower.map((r) => r.doc.slug), upper.map((r) => r.doc.slug));
  });

  it('finds library entries too, not just cases', async () => {
    const api = makeSandbox(fetchResolving(FIXTURE_INDEX));
    const results = await api.search('deep dive');
    assert.ok(results.some((r) => r.doc.type === 'library' && r.doc.slug === 'some-flexbox-article'));
  });

  it('returns no results for a query matching nothing', async () => {
    const api = makeSandbox(fetchResolving(FIXTURE_INDEX));
    const results = await api.search('xyznonexistentquery');
    assert.equal(results.length, 0);
  });

  it('respects the limit option', async () => {
    const bigIndex = {
      cases: Array.from({ length: 30 }, (_, i) => ({
        type: 'case', slug: `test-${i}`, title: `Test Case ${i}`, track: 'react', principle: 'Testing', tier: 'free', status: 'idea', url: null,
      })),
      library: [],
    };
    const api = makeSandbox(fetchResolving(bigIndex));
    const results = await api.search('test', { limit: 5 });
    assert.equal(results.length, 5);
  });

  it('gracefully returns empty results when fetch fails', async () => {
    const api = makeSandbox(() => Promise.reject(new Error('network down')));
    const results = await api.search('flexbox');
    assert.equal(results.length, 0);
  });

  it('gracefully returns empty results when the response is not ok', async () => {
    const api = makeSandbox(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }));
    const results = await api.search('flexbox');
    assert.equal(results.length, 0);
  });

  it('only fetches the index once across multiple searches', async () => {
    let fetchCount = 0;
    const api = makeSandbox(() => { fetchCount++; return fetchResolving(FIXTURE_INDEX)(); });
    await api.search('flexbox');
    await api.search('react');
    assert.equal(fetchCount, 1);
  });
});
