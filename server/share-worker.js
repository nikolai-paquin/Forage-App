// Forage read-only share backend — a tiny Cloudflare Worker that stores a
// public, read-only snapshot of a collection in Workers KV under a random id.
// Unlike sync (where the key is a secret), share ids are public: anyone with
// the link can read the snapshot. Posting requires no auth, so put this behind
// a closed deployment if you don't want open writes.
//
//   wrangler kv namespace create FORAGE_SHARES
//   # put the printed id into wrangler.share.toml, then:
//   wrangler deploy --config wrangler.share.toml
//
// Paste the deployed URL into Forage → a collection's Share dialog.
//
// API:
//   POST /        body = snapshot JSON  -> 200 { id }
//   GET  /:id                           -> 200 snapshot JSON | 404

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const ID_RE = /^[A-Za-z0-9_-]{6,40}$/;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB ceiling per share
const TTL_SECONDS = 60 * 60 * 24 * 180; // expire shares after 180 days

function newId() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (!env.FORAGE_SHARES) {
      return new Response('KV namespace FORAGE_SHARES not bound', { status: 500, headers: CORS });
    }

    const path = new URL(request.url).pathname.replace(/^\/+|\/+$/g, '');

    if (request.method === 'POST' && path === '') {
      const body = await request.text();
      if (body.length > MAX_BYTES) {
        return new Response('share too large', { status: 413, headers: CORS });
      }
      try {
        JSON.parse(body);
      } catch {
        return new Response('invalid JSON', { status: 400, headers: CORS });
      }
      const id = newId();
      await env.FORAGE_SHARES.put(`share:${id}`, body, { expirationTtl: TTL_SECONDS });
      return new Response(JSON.stringify({ id }), {
        status: 200,
        headers: { 'content-type': 'application/json', ...CORS },
      });
    }

    if (request.method === 'GET' && ID_RE.test(path)) {
      const body = await env.FORAGE_SHARES.get(`share:${path}`);
      if (body == null) return new Response('not found', { status: 404, headers: CORS });
      return new Response(body, {
        status: 200,
        headers: { 'content-type': 'application/json', ...CORS },
      });
    }

    return new Response('not found', { status: 404, headers: CORS });
  },
};
