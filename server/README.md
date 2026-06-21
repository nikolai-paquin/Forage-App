# Forage backends

Two small, independent [Cloudflare Workers](https://workers.cloudflare.com/) that
unlock Forage's optional online features. Both are free-tier friendly and deploy in
a minute. Neither is required — Forage works fully offline without them.

- **`worker.js`** — AI: **Auto-tag**, **Generate prompt** (Claude), and **embeddings**
  for semantic search (Cloudflare Workers AI). → Settings → AI Usage.
- **`sync-worker.js`** — **Cross-device sync** via Workers KV. → Settings → Sync.
- **`share-worker.js`** — **Read-only collection sharing** via Workers KV: publish a
  public snapshot of a collection and get a link. → a collection's Share button.
- **`unfurl-worker.js`** — **Link previews + image proxy**: real page titles,
  descriptions, and preview images for bookmarks; reliable YouTube titles/creators;
  and cross-origin palette extraction. → Settings → AI Usage → Link previews.

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

## Share Worker (`share-worker.js`)

Publishes a public, **read-only** snapshot of a collection under a random id, so
you can send anyone a link. Unlike sync keys, share ids are public — whoever has
the link can read the snapshot (shares expire after 180 days).

```bash
cd server
wrangler kv namespace create FORAGE_SHARES
# paste the printed id into wrangler.share.toml, then:
wrangler deploy --config wrangler.share.toml
```

Paste the deployed URL into a collection's **Share** dialog. The app POSTs the
snapshot, gets back an id, and builds a self-contained link (the worker's read
URL is embedded in the link's hash, so recipients need no setup).

```
POST /       body = snapshot JSON  → 200 { id }
GET  /:id                          → 200 snapshot JSON | 404
```

POST is unauthenticated, so deploy it for your own use and don't advertise the
URL (or add your own auth/Access in front of it).

---

## Unfurl Worker (`unfurl-worker.js`)

Gives the static app two things it can't do from the browser (CORS): reading other
sites' metadata, and reading pixels from cross-origin images. No API key or binding.

```bash
cd server
wrangler deploy -c wrangler.unfurl.toml
```

Paste the printed URL into **Forage → Settings → AI Usage → Link previews**. With it
set, saved links unfurl into rich bookmarks (title · description · preview), YouTube
saves get dependable titles + creators, and the eyedropper/palette works on images
hosted elsewhere.

```
GET /?url=<page>   → { title, description, image, author, siteName, type }
GET /?img=<image>  → the image bytes, re-served with permissive CORS
```

It refuses non-http(s) and private/loopback hosts, but it is still an open fetch
proxy — deploy it for your own use, don't advertise the URL.

---

## Other hosts

All handlers are standard `fetch(request, env)` Workers and port easily to Vercel
Edge, Deno Deploy, or Netlify Functions — read the body, do the work, return the
same JSON shapes.
