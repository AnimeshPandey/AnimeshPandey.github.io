/**
 * Cloudflare Worker — magic link email sender
 * Environment variables required (set in Cloudflare dashboard):
 *   RESEND_API_KEY  — Resend.com API key
 *   SITE_URL        — e.g. "https://anmshpndy.com"
 *   JWT_SECRET      — any random string for signing tokens
 */

const ALLOWED_ORIGIN = 'https://anmshpndy.com';
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

async function generateToken(email, secret) {
  const payload = { email, exp: Date.now() + TOKEN_TTL_MS };
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return btoa(JSON.stringify({ payload: btoa(JSON.stringify(payload)), sig: b64 }));
}

export default {
  async fetch(request, env) {
    // CORS preflight
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

    let body;
    try { body = await request.json(); } catch { return new Response('Bad request', { status: 400 }); }

    const { email } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'Email send failed' }), {
        status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
    });
  },
};
