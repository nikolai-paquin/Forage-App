// Forage sync backend — a tiny Cloudflare Worker that stores one library blob per
// "sync key" in Workers KV. The sync key (generated in the app) is the bearer
// token: whoever holds it can read/write that library. No accounts, no database.
//
//   wrangler kv namespace create FORAGE
//   # put the printed id into wrangler.sync.toml, then:
//   wrangler deploy --config wrangler.sync.toml
//
// Paste the deployed URL + your sync key into Forage → Settings → Sync.
//
// API:
//   GET  /:key  -> 200 snapshot JSON | 404 (nothing stored yet)
//   PUT  /:key  -> 204 (body is the snapshot JSON)

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, PUT, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

// Reject absurd keys / payloads up front.
const KEY_RE = /^[A-Za-z0-9_-]{12,128}$/;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB ceiling per library

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (!env.FORAGE) {
      return new Response('KV namespace FORAGE not bound', { status: 500, headers: CORS });
    }

    const key = decodeURIComponent(new URL(request.url).pathname.replace(/^\/+/, ''));
    if (!KEY_RE.test(key)) {
      return new Response('bad sync key', { status: 400, headers: CORS });
    }
    const kvKey = `lib:${key}`;

    if (request.method === 'GET') {
      const body = await env.FORAGE.get(kvKey);
      if (body == null) return new Response('not found', { status: 404, headers: CORS });
      return new Response(body, {
        status: 200,
        headers: { 'content-type': 'application/json', ...CORS },
      });
    }

    if (request.method === 'PUT') {
      const body = await request.text();
      if (body.length > MAX_BYTES) {
        return new Response('library too large', { status: 413, headers: CORS });
      }
      try {
        JSON.parse(body); // validate it's JSON before persisting
      } catch {
        return new Response('invalid JSON', { status: 400, headers: CORS });
      }
      await env.FORAGE.put(kvKey, body);
      return new Response(null, { status: 204, headers: CORS });
    }

    return new Response('method not allowed', { status: 405, headers: CORS });
  },
};
