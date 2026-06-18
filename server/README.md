# Forage backends

Two small, independent [Cloudflare Workers](https://workers.cloudflare.com/) that
unlock Forage's optional online features. Both are free-tier friendly and deploy in
a minute. Neither is required — Forage works fully offline without them.

- **`worker.js`** — AI: **Auto-tag**, **Generate prompt** (Claude), and **embeddings**
  for semantic search (Cloudflare Workers AI). → Settings → AI Usage.
- **`sync-worker.js`** — **Cross-device sync** via Workers KV. → Settings → Sync.

---

## AI Worker (`worker.js`)

Real AI-powered **Auto-tag** / **Generate prompt** (backed by Claude) plus
**semantic-search embeddings**. Your Anthropic API key lives here as a secret — it
is never shipped to the browser. Defaults to the fast, cheap
**`claude-haiku-4-5-20251001`** (override with the `MODEL` var in `wrangler.toml`);
embeddings use `@cf/baai/bge-small-en-v1.5` via the `AI` binding.

```bash
npm i -g wrangler
cd server

wrangler login
wrangler secret put ANTHROPIC_API_KEY   # paste your key when prompted
wrangler deploy
```

Wrangler prints a URL like `https://forage-ai.<you>.workers.dev`. Paste it into
**Forage → Settings → AI Usage → Model endpoint URL** and save.

### How it's called

```
POST /  { "task": "tags" | "prompt", "item": { title, type, source, note, summary, tags, palette } }
        → { "tags": ["editorial", "muted-palette", ...] }
        → { "prompt": "A sun-bleached editorial spread ..." }

POST /  { "task": "embed", "text": "..." }
        → { "vector": [0.013, -0.21, ...] }   // used by semantic search
```

If the endpoint is unreachable or errors, Forage silently falls back to on-device
heuristics (and keyword search), so the app keeps working either way.

---

## Sync Worker (`sync-worker.js`)

Stores one library blob per **sync key** in Workers KV. The sync key (generated in
the app) is the bearer token — whoever holds it can read/write that library. No
accounts, no database.

```bash
cd server
wrangler kv namespace create FORAGE
# paste the printed id into wrangler.sync.toml, then:
wrangler deploy --config wrangler.sync.toml
```

Paste the deployed URL and your sync key into **Forage → Settings → Sync** on each
device. The app pushes on change and pulls periodically; merges are per-item
last-write-wins on `updatedAt`, with soft-deletes as tombstones, so an edit on one
device and a delete on another both survive a round-trip.

```
GET  /:key  → 200 snapshot JSON | 404 (nothing stored yet)
PUT  /:key  → 204               (body is the snapshot JSON)
```

---

## Other hosts

Both handlers are standard `fetch(request, env)` Workers and port easily to Vercel
Edge, Deno Deploy, or Netlify Functions — read the body, do the work, return the
same JSON shapes.
