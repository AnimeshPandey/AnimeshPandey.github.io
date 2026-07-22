import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const modulePath = path.join(ROOT, 'cases/src/assets/js/casebook-progress-store.js');

describe('casebook-progress-store', () => {
  // Fresh require each test — the module is a singleton with mutable
  // adapter state, and Node's require cache would otherwise leak
  // setAdapter() calls across tests.
  function freshStore() {
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
  }

  it('defaults to the localStorage adapter (no-op outside a browser)', () => {
    const store = freshStore();
    // No global `localStorage` in Node — get/set/remove degrade to
    // no-ops rather than throwing, matching real private-mode behavior.
    assert.equal(store.get('anything'), null);
    assert.equal(store.set('anything', 'x'), false);
    store.remove('anything'); // must not throw
  });

  it('setAdapter swaps the backing store', () => {
    const store = freshStore();
    const memory = {};
    const customAdapter = {
      get: (key) => (key in memory ? memory[key] : null),
      set: (key, value) => { memory[key] = value; return true; },
      remove: (key) => { delete memory[key]; },
    };

    const accepted = store.setAdapter(customAdapter);
    assert.equal(accepted, true);

    assert.equal(store.set('casebook-companion-v1', '{"tone":"staff"}'), true);
    assert.equal(store.get('casebook-companion-v1'), '{"tone":"staff"}');
    store.remove('casebook-companion-v1');
    assert.equal(store.get('casebook-companion-v1'), null);
  });

  it('rejects an adapter missing a required method', () => {
    const store = freshStore();
    const before = store.get('x');
    const accepted = store.setAdapter({ get: () => 'nope' }); // no set/remove
    assert.equal(accepted, false);
    // Still on the default adapter — behavior unchanged.
    assert.equal(store.get('x'), before);
  });

  it('resetAdapter restores the default localStorage adapter', () => {
    const store = freshStore();
    store.setAdapter({
      get: () => 'custom-value',
      set: () => true,
      remove: () => {},
    });
    assert.equal(store.get('x'), 'custom-value');

    store.resetAdapter();
    assert.equal(store.get('x'), null); // back to the no-localStorage-in-Node default
  });
});
