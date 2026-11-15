/**
 * yore-tw Worker: static site from ./dist-site (the ASSETS binding) plus one small API.
 *
 *   POST /api/feedback   a private message from a player to the author (game in-page dialog, contact page).
 *                        Body (JSON): { game, lang, msg, contact?, page?, meta? }. Stored in the FEEDBACK KV
 *                        namespace; nothing is shown publicly. Replies 202 {ok:true,id}.
 *   GET  /api/feedback?token=…   the author's inbox: newest first, as JSON. Needs the ADMIN_TOKEN secret.
 *
 * Bindings (wrangler.jsonc): ASSETS (static files), FEEDBACK (KV). Secrets: ADMIN_TOKEN, optional TURNSTILE_SECRET.
 * Without the KV binding the endpoint answers 503 and the dialog tells the player to use e-mail instead.
 */

const MAX_MSG = 2000, MAX_CONTACT = 120, MAX_META = 600;
const RATE_LIMIT = 5;            // messages per client per hour
const KEEP_DAYS = 180;           // messages expire from KV after this

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/feedback') return feedback(request, env, url);
    if (url.pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};

async function feedback(request, env, url) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
  if (request.method === 'GET') return inbox(env, url);
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (!env.FEEDBACK) return json({ error: 'unconfigured' }, 503, request);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, request); }
  if (typeof body !== 'object' || body === null) return json({ error: 'bad body' }, 400, request);
  if (body.hp) return json({ ok: true, id: 'ignored' }, 202, request); // honeypot field: bots fill it, people never see it
  const msg = clip(body.msg, MAX_MSG);
  if (!msg || msg.length < 2) return json({ error: 'empty' }, 400, request);

  // optional Turnstile check: only when the secret is set and the client sent a token
  if (env.TURNSTILE_SECRET && body.turnstile) {
    const ok = await verifyTurnstile(env.TURNSTILE_SECRET, body.turnstile, request.headers.get('CF-Connecting-IP'));
    if (!ok) return json({ error: 'turnstile' }, 403, request);
  }

  // per-client rate limit: a hashed IP, counted per hour in KV
  const ip = request.headers.get('CF-Connecting-IP') || '0';
  const bucket = `rate:${await sha256(ip)}:${Math.floor(Date.now() / 3600000)}`;
  const used = Number((await env.FEEDBACK.get(bucket)) || 0);
  if (used >= RATE_LIMIT) return json({ error: 'rate' }, 429, request);
  await env.FEEDBACK.put(bucket, String(used + 1), { expirationTtl: 3600 });

  const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;
  const entry = {
    id,
    at: new Date().toISOString(),
    game: clip(body.game, 40) || 'site',
    lang: clip(body.lang, 8) || '',
    page: clip(body.page, 300) || request.headers.get('Referer') || '',
    msg,
    contact: clip(body.contact, MAX_CONTACT) || '',
    meta: clip(typeof body.meta === 'string' ? body.meta : JSON.stringify(body.meta || {}), MAX_META),
    ua: clip(request.headers.get('User-Agent'), 200) || '',
    country: request.headers.get('CF-IPCountry') || '',
  };
  await env.FEEDBACK.put(`msg:${id}`, JSON.stringify(entry), { expirationTtl: KEEP_DAYS * 86400 });
  return json({ ok: true, id }, 202, request);
}

/** The author's inbox: GET /api/feedback?token=…&limit=50 — newest first. */
async function inbox(env, url) {
  if (!env.FEEDBACK || !env.ADMIN_TOKEN) return json({ error: 'unconfigured' }, 503);
  const token = url.searchParams.get('token') || '';
  if (!token || !timingSafeEqual(token, env.ADMIN_TOKEN)) return json({ error: 'forbidden' }, 403);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 50));
  const list = await env.FEEDBACK.list({ prefix: 'msg:', limit: 1000 });
  const keys = list.keys.map(k => k.name).sort().reverse().slice(0, limit); // ids start with an ISO timestamp, so the sort is by time
  const items = await Promise.all(keys.map(async k => { const v = await env.FEEDBACK.get(k); return v ? JSON.parse(v) : null; }));
  return json({ count: list.keys.length, items: items.filter(Boolean) }, 200, null, { 'Cache-Control': 'no-store' });
}

async function verifyTurnstile(secret, token, ip) {
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip || undefined }),
    });
    const j = await r.json();
    return !!j.success;
  } catch { return false; }
}

function clip(v, n) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }
async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
/** Same-origin in production; the artifact copy and local previews post from other origins, so answer them too. */
function cors(request) {
  const origin = request && request.headers.get('Origin');
  return origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } : {};
}
function json(obj, status = 200, request = null, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(request), ...extra } });
}
