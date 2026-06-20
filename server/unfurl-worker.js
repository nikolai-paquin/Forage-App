// Forage unfurl + image proxy — a tiny Cloudflare Worker that gives the static
// app two server-side superpowers it can't do from the browser:
//
//   1. GET ?url=<page>  -> { title, description, image, author, siteName, type }
//      Link previews / bookmarks: reads OpenGraph/Twitter/oEmbed metadata.
//      (YouTube, Vimeo, etc. resolve via oEmbed for clean title + creator.)
//   2. GET ?img=<image> -> the image bytes, re-served with permissive CORS so
//      the app's <canvas> palette extraction works on cross-origin images.
//
// Deploy:
//   cd server && npx wrangler deploy -c wrangler.unfurl.toml
// then paste the Worker URL into Forage -> Settings -> AI Usage -> Link previews.
//
// Note: this is an open fetch proxy intended for personal use. It refuses
// non-http(s) and obvious private/loopback hosts, but don't expose it widely.

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });

const UA = 'Mozilla/5.0 (compatible; ForageBot/1.0; +https://github.com/nikolai-paquin/forage-app)';

function safeUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.local') ||
    /^(10|127)\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return null;
  }
  return u;
}

function youTubeId(u) {
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
  if (host.endsWith('youtube.com')) {
    const v = u.searchParams.get('v');
    if (v) return v;
    const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?]+)/);
    if (m) return m[1];
  }
  return null;
}

async function viaOEmbed(endpoint) {
  const res = await fetch(endpoint, { headers: { 'user-agent': UA } });
  if (!res.ok) return null;
  const d = await res.json();
  if (!d || !d.title) return null;
  return {
    title: d.title,
    author: d.author_name,
    image: d.thumbnail_url,
    siteName: d.provider_name,
    type: 'video',
  };
}

async function unfurlPage(u) {
  const res = await fetch(u.href, {
    headers: { 'user-agent': UA, accept: 'text/html,*/*' },
    redirect: 'follow',
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  const ct = res.headers.get('content-type') || '';
  if (ct.startsWith('image/')) return { url: u.href, image: u.href, type: 'image' };
  if (!ct.includes('html')) return { url: u.href };

  const meta = { url: res.url || u.href };
  let titleText = '';
  const set = (k, v) => {
    if (v && !meta[k]) meta[k] = v.trim();
  };

  const rewriter = new HTMLRewriter()
    .on('meta', {
      element(el) {
        const key = (el.getAttribute('property') || el.getAttribute('name') || '').toLowerCase();
        const c = el.getAttribute('content');
        if (!c) return;
        if (key === 'og:title' || key === 'twitter:title') set('title', c);
        else if (key === 'og:description' || key === 'twitter:description' || key === 'description')
          set('description', c);
        else if (key === 'og:image' || key === 'og:image:url' || key === 'twitter:image' || key === 'twitter:image:src')
          set('image', c);
        else if (key === 'og:site_name') set('siteName', c);
        else if (key === 'og:type') set('type', c);
        else if (key === 'author' || key === 'article:author') set('author', c);
      },
    })
    .on('title', { text(t) { titleText += t.text; } });

  await rewriter.transform(res).arrayBuffer();

  if (!meta.title && titleText.trim()) meta.title = titleText.trim();
  if (meta.image) {
    try {
      meta.image = new URL(meta.image, meta.url).href;
    } catch {
      /* leave as-is */
    }
  }
  return meta;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'GET') return json({ error: 'GET only' }, 405);

    const params = new URL(request.url).searchParams;
    const pageUrl = params.get('url');
    const imgUrl = params.get('img');

    // --- Image proxy (for cross-origin palette extraction) ---
    if (imgUrl) {
      const u = safeUrl(imgUrl);
      if (!u) return json({ error: 'bad img url' }, 400);
      try {
        const res = await fetch(u.href, {
          headers: { 'user-agent': UA },
          cf: { cacheTtl: 86400, cacheEverything: true },
        });
        if (!res.ok) return json({ error: 'fetch failed', status: res.status }, 502);
        return new Response(res.body, {
          headers: {
            'content-type': res.headers.get('content-type') || 'image/jpeg',
            'cache-control': 'public, max-age=86400',
            ...CORS,
          },
        });
      } catch (e) {
        return json({ error: 'img proxy failed', detail: String(e) }, 502);
      }
    }

    // --- Link unfurl ---
    if (pageUrl) {
      const u = safeUrl(pageUrl);
      if (!u) return json({ error: 'bad url' }, 400);
      try {
        const yt = youTubeId(u);
        if (yt) {
          const oe = await viaOEmbed(
            `https://www.youtube.com/oembed?url=https://youtu.be/${yt}&format=json`,
          );
          if (oe) return json(oe);
        }
        const meta = await unfurlPage(u);
        return json(meta);
      } catch (e) {
        return json({ error: 'unfurl failed', detail: String(e) }, 502);
      }
    }

    return json({ error: 'pass ?url= or ?img=' }, 400);
  },
};
