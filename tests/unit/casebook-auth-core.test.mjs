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

  it('makeToken is stable for same email', () => {
    const a = core.makeToken('test@example.com');
    const b = core.makeToken('test@example.com');
    assert.equal(a, b);
    assert.ok(a.length > 8);
  });

  it('parseToken accepts valid token', () => {
    const token = core.makeToken('reader@casebook.dev');
    const parsed = core.parseToken(token);
    assert.deepEqual(parsed, { email: 'reader@casebook.dev' });
  });

  it('parseToken rejects tampered token', () => {
    const token = core.makeToken('a@b.co');
    const bad = token.slice(0, -2) + 'xx';
    assert.equal(core.parseToken(bad), null);
  });

  it('parseToken rejects garbage', () => {
    assert.equal(core.parseToken(''), null);
    assert.equal(core.parseToken('not-valid!!!'), null);
  });

  it('tokens survive URL encoding roundtrip', () => {
    const token = core.makeToken('encode@test.io');
    const encoded = encodeURIComponent(token);
    assert.deepEqual(core.parseToken(decodeURIComponent(encoded)), { email: 'encode@test.io' });
  });
});
