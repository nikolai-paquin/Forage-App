# Forage AI backend

A ~90-line [Cloudflare Worker](https://workers.cloudflare.com/) that gives Forage
real AI-powered **Auto-tag** and **Generate prompt**, backed by Claude. Your
Anthropic API key lives here as a secret — it is never shipped to the browser.

By default it's free-tier friendly and uses **`claude-haiku-4-5-20251001`** (fast
and cheap); switch to a stronger model via the `MODEL` var in `wrangler.toml`.

## Deploy

```bash
npm i -g wrangler
cd server

wrangler login
wrangler secret put ANTHROPIC_API_KEY   # paste your key when prompted
wrangler deploy
```

Wrangler prints a URL like `https://forage-ai.<you>.workers.dev`. Paste it into
**Forage → Settings → AI Usage → Model endpoint URL** and save.

## How it's called

```
POST /
{ "task": "tags" | "prompt",
  "item": { "title", "type", "source", "note", "summary", "tags", "palette" } }

→ { "tags": ["editorial", "muted-palette", ...] }   // task: tags
→ { "prompt": "A sun-bleached editorial spread ..." } // task: prompt
```

If the endpoint is unreachable or errors, Forage silently falls back to its
on-device heuristics, so the app keeps working either way.

## Other hosts

The handler is a standard `fetch(request, env)` and ports easily to Vercel Edge,
Deno Deploy, or Netlify Functions — read the body, call the Anthropic Messages
API with your key, return the same JSON shape.
