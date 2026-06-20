// Forage AI backend — a tiny Cloudflare Worker that powers Auto-tag and
// Generate-prompt with a real Claude model. The API key lives here as a secret
// (ANTHROPIC_API_KEY), never in the browser. Deploy it, then paste the Worker
// URL into Forage → Settings → AI Usage.
//
//   npm i -g wrangler
//   wrangler secret put ANTHROPIC_API_KEY
//   wrangler deploy
//
// Contract (called by app/src/lib/ai.ts and lib/semantic.ts):
//   POST { task: 'tags' | 'prompt', item: {...} }  ->  { tags: string[] } | { prompt: string }
//   POST { task: 'embed', text: '...' }            ->  { vector: number[] }
//
// `embed` powers semantic search and uses Cloudflare Workers AI (no extra key) —
// add an `[ai] binding = "AI"` in wrangler.toml to enable it. Tags/prompt use Claude.

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

// Turn an image URL (or data: URL) into an Anthropic image content block, so the
// model can see the actual save. Claude fetches http(s) URLs itself; data URLs
// are passed through as base64. Returns null for anything it can't use.
function imageBlock(image) {
  if (typeof image !== 'string' || !image) return null;
  const data = image.match(/^data:([^;,]+);base64,(.*)$/);
  if (data) return { type: 'image', source: { type: 'base64', media_type: data[1], data: data[2] } };
  if (/^https?:\/\//i.test(image)) return { type: 'image', source: { type: 'url', url: image } };
  return null;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid JSON' }, 400);
    }

    const { task, item, text, image } = body || {};

    // --- Semantic embeddings (Cloudflare Workers AI) ---
    if (task === 'embed') {
      if (!env.AI) return json({ error: 'AI binding not configured' }, 500);
      if (typeof text !== 'string' || !text.trim()) return json({ error: 'expected { text }' }, 400);
      try {
        const out = await env.AI.run('@cf/baai/bge-small-en-v1.5', { text: text.slice(0, 2000) });
        const vector = out?.data?.[0];
        if (!Array.isArray(vector)) return json({ error: 'no embedding returned' }, 502);
        return json({ vector });
      } catch (e) {
        return json({ error: 'embed failed', detail: String(e) }, 502);
      }
    }

    // --- Tags / prompt (Claude) ---
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not set' }, 500);
    if ((task !== 'tags' && task !== 'prompt') || !item) {
      return json({ error: 'expected { task, item }' }, 400);
    }

    const context = JSON.stringify(item);
    const imgBlock = imageBlock(image);
    const system =
      task === 'tags'
        ? 'You tag visual inspiration for a designer. Look at the image (when provided) and reply with ONLY a JSON array of 4-6 short, lowercase, single-or-hyphenated tags that name the concrete subject, medium/style, palette, and mood of what is actually shown (e.g. ["pixel-art","isometric","island","autumn","vibrant"]). No prose, no code fences.'
        : 'You write vivid image-generation prompts. Look at the image (when provided) and reply with ONLY a single richly descriptive prompt (one or two sentences) capturing the actual subject, composition, style, palette, and mood you see. No prose, no preamble, no quotes.';

    // Vision when an image is supplied; the metadata is extra context.
    const content = [];
    if (imgBlock) content.push(imgBlock);
    content.push({
      type: 'text',
      text: imgBlock ? `Metadata for context: ${context}` : context,
    });

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
          messages: [{ role: 'user', content }],
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
