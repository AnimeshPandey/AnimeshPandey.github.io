import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const core = require(path.join(ROOT, 'cases/lib/casebook-auth-core.js'));

describe('casebook-auth-core', () => {
  it('normalizes email', () => {
    assert.equal(core.normalizeEmail('  Foo@Bar.COM '), 'foo@bar.com');
  });

  it('normalizes missing/non-string input to an empty string', () => {
    assert.equal(core.normalizeEmail(undefined), '');
    assert.equal(core.normalizeEmail(null), '');
  });

  it('exposes AUTH_KEY for the localStorage key', () => {
    assert.equal(typeof core.AUTH_KEY, 'string');
    assert.ok(core.AUTH_KEY.length > 0);
  });

  // Regression guard: makeToken/parseToken used to live here as a public
  // salt + non-cryptographic hash — forgeable from the browser console for
  // any email, with no relationship to the real signed token the magic-link
  // worker issues. Token generation and verification now live server-side
  // only, in workers/magic-link/index.js (see
  // tests/unit/casebook-magic-link-worker.test.mjs) — this module must
  // never grow them back.
  it('does not expose client-side token generation or verification', () => {
    assert.equal(core.makeToken, undefined);
    assert.equal(core.parseToken, undefined);
  });
});
