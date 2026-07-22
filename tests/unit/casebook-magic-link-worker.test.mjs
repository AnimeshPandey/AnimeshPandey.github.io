import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, verifyToken } from '../../workers/magic-link/index.js';

const SECRET = 'test-secret-do-not-use-in-prod';

describe('casebook-magic-link worker token signing', () => {
  it('generates a token that verifies back to the same email', async () => {
    const token = await generateToken('reader@casebook.dev', SECRET);
    const result = await verifyToken(token, SECRET);
    assert.deepEqual(result, { email: 'reader@casebook.dev' });
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await generateToken('a@b.co', SECRET);
    const result = await verifyToken(token, 'wrong-secret');
    assert.equal(result, null);
  });

  it('rejects a tampered token', async () => {
    const token = await generateToken('a@b.co', SECRET);
    const tampered = token.slice(0, -4) + 'xxxx';
    const result = await verifyToken(tampered, SECRET);
    assert.equal(result, null);
  });

  it('rejects garbage input', async () => {
    assert.equal(await verifyToken('', SECRET), null);
    assert.equal(await verifyToken('not-valid-base64!!!', SECRET), null);
  });

  it('rejects an expired token', async () => {
    // Forge an already-expired envelope using the same signing scheme
    // generateToken uses, to test the expiry check independent of the
    // TTL constant.
    const payload = { email: 'expired@test.io', exp: Date.now() - 1000 };
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const data = new TextEncoder().encode(JSON.stringify(payload));
    const sig = await crypto.subtle.sign('HMAC', key, data);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
    const token = btoa(JSON.stringify({ payload: btoa(JSON.stringify(payload)), sig: b64 }));

    const result = await verifyToken(token, SECRET);
    assert.equal(result, null);
  });

  it('a forged client-side token (no real signature) is rejected', async () => {
    // Simulates what the removed client-side makeToken() used to produce —
    // this is the exact forgery path the server-side verify fix closes.
    const forged = btoa(JSON.stringify({ payload: btoa(JSON.stringify({ email: 'attacker@evil.com', exp: Date.now() + 999999 })), sig: 'not-a-real-signature' }));
    const result = await verifyToken(forged, SECRET);
    assert.equal(result, null);
  });

  it('rejects a well-formed envelope whose payload field is not valid base64, without throwing', async () => {
    // envelope.sig decodes fine (atob('AAAA') is valid) but envelope.payload
    // does not — this must resolve to null like every other malformed input,
    // not reject with an uncaught InvalidCharacterError.
    const malformed = btoa(JSON.stringify({ payload: 'not-valid-base64!!!', sig: 'AAAA' }));
    const result = await verifyToken(malformed, SECRET);
    assert.equal(result, null);
  });
});
