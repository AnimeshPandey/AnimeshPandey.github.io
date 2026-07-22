/**
 * Cloudflare Worker — magic link email sender + verifier
 * Environment variables required (set in Cloudflare dashboard):
 *   RESEND_API_KEY  — Resend.com API key
 *   SITE_URL        — e.g. "https://anmshpndy.com"
 *   JWT_SECRET      — any random string for signing tokens
 *
 * Token verification MUST stay server-side. JWT_SECRET never leaves this
 * worker — a client-side implementation of verifyToken would have to ship
 * the secret to the browser to check the signature, which defeats the
 * signature's entire purpose (anyone could then forge a token for any
 * email). The site's own client code calls POST /verify below instead of
 * parsing tokens itself — see cases/src/assets/js/casebook-auth.js.
 */

const ALLOWED_ORIGIN = 'https://anmshpndy.com';
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function json(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign(
      { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
      extraHeaders,
    ),
  });
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

export async function generateToken(email, secret) {
  const payload = { email, exp: Date.now() + TOKEN_TTL_MS };
  const key = await hmacKey(secret);
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return btoa(JSON.stringify({ payload: btoa(JSON.stringify(payload)), sig: b64 }));
}

/** Returns { email } on a valid, unexpired, correctly-signed token, or null. */
export async function verifyToken(token, secret) {
  let envelope;
  try {
    envelope = JSON.parse(atob(token));
  } catch {
    return null;
  }
  if (!envelope || typeof envelope.payload !== 'string' || typeof envelope.sig !== 'string') return null;

  const key = await hmacKey(secret);
  let data;
  try {
    data = new TextEncoder().encode(atob(envelope.payload));
  } catch {
    return null;
  }
  let sigBytes;
  try {
    sigBytes = Uint8Array.from(atob(envelope.sig), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }

  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
  if (!valid) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(data));
  } catch {
    return null;
  }
  if (!payload.email || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;

  return { email: payload.email };
}

async function handleSend(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid email' }, 400); }

  const { email } = body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400);
  }

  const token = await generateToken(email, env.JWT_SECRET);
  const magicLink = `${env.SITE_URL}/cases/account/?token=${encodeURIComponent(token)}`;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Casey <casey@anmshpndy.com>',
      to: [email],
      subject: 'Your Frontend Casebook sign-in link',
      html: `<p>Click below to sign in to The Frontend Casebook:</p>
             <p><a href="${magicLink}" style="background:#4E7A68;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Sign in to Casebook</a></p>
             <p style="color:#888;font-size:12px;">Link expires in 15 minutes. If you didn't request this, ignore this email.</p>`,
    }),
  });

  if (!emailRes.ok) {
    return json({ error: 'Email send failed' }, 500);
  }

  return json({ success: true }, 200);
}

async function handleVerify(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ valid: false }, 400); }

  const { token } = body;
  if (!token) return json({ valid: false }, 400);

  const result = await verifyToken(token, env.JWT_SECRET);
  if (!result) return json({ valid: false }, 200);

  return json({ valid: true, email: result.email }, 200);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const path = new URL(request.url).pathname;
    if (path === '/verify') return handleVerify(request, env);
    return handleSend(request, env);
  },
};
