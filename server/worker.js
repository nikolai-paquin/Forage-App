// Forage AI backend — a tiny Cloudflare Worker that powers Auto-tag and
// Generate-prompt with a real Claude model. The API key lives here as a secret
// (ANTHROPIC_API_KEY), never in the browser. Deploy it, then paste the Worker
// URL into Forage → Settings → AI Usage.
//
//   npm i -g wrangler
//   wrangler secret put ANTHROPIC_API_KEY
//   wrangler deploy
//
// Contract (called by app/src/lib/ai.ts):
//   POST { task: 'tags' | 'prompt', item: { title, type, source, note, summary, tags, palette } }
//   ->   { tags: string[] }   |   { prompt: string }

const MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not set' }, 500);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid JSON' }, 400);
    }

    const { task, item } = body || {};
    if ((task !== 'tags' && task !== 'prompt') || !item) {
      return json({ error: 'expected { task, item }' }, 400);
    }

    const context = JSON.stringify(item);
    const system =
      task === 'tags'
        ? 'You tag visual inspiration for a designer. Given a saved item, reply with ONLY a JSON array of 3-6 short, lowercase, single-or-hyphenated tags (e.g. ["editorial","muted-palette","typography"]). No prose, no code fences.'
        : 'You write vivid image-generation prompts. Given a saved item, reply with ONLY a single richly descriptive prompt (one or two sentences) capturing its subject, style, palette, and mood. No prose, no preamble, no quotes.';

    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: env.MODEL || MODEL,
          max_tokens: 300,
          system,
          messages: [{ role: 'user', content: context }],
        }),
      });
    } catch (e) {
      return json({ error: 'upstream fetch failed', detail: String(e) }, 502);
    }

    if (!res.ok) {
      return json({ error: 'anthropic error', status: res.status, detail: await res.text() }, 502);
    }

    const data = await res.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    if (task === 'tags') {
      let tags = [];
      try {
        const match = text.match(/\[[\s\S]*\]/);
        tags = JSON.parse(match ? match[0] : text);
      } catch {
        // Fallback: split a comma/line separated reply.
        tags = text.split(/[,\n]/).map((t) => t.replace(/["#\[\]]/g, '').trim());
      }
      tags = (Array.isArray(tags) ? tags : [])
        .map((t) => String(t).toLowerCase().trim())
        .filter(Boolean)
        .slice(0, 6);
      return json({ tags });
    }

    return json({ prompt: text.replace(/^["']|["']$/g, '') });
  },
};
