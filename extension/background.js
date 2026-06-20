// Forage browser extension — background service worker.
//
// Captures the page / image / link / selection you're looking at and either:
//   • opens the Forage web app with the save (default), or
//   • saves it silently in the background by pushing to your Sync endpoint
//     (Settings → "Save in background"), so no tab opens.
//
// Either way the save is enriched first: whole-page/image saves read the page's
// own OpenGraph/meta tags; link/URL saves fetch the target and parse its meta —
// so links land as rich bookmarks without the server-side unfurl proxy.
const APP_URL = 'https://nikolai-paquin.github.io/Forage-App/';

function hostOf(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

// ---- Settings (sync endpoint/key + background-save toggle) ----
const DEFAULT_SETTINGS = { endpoint: '', key: '', background: false };
const getSettings = () =>
  new Promise((resolve) => chrome.storage.local.get(DEFAULT_SETTINGS, resolve));
const setSettings = (s) => new Promise((resolve) => chrome.storage.local.set(s, resolve));

// ---- Page metadata (read in-page via scripting) ----
function readPageMeta() {
  const pick = (sel) => document.querySelector(sel)?.getAttribute('content')?.trim() || '';
  const meta = {
    title:
      pick('meta[property="og:title"]') || pick('meta[name="twitter:title"]') || document.title || '',
    description:
      pick('meta[property="og:description"]') ||
      pick('meta[name="description"]') ||
      pick('meta[name="twitter:description"]') ||
      '',
    image:
      pick('meta[property="og:image"]') ||
      pick('meta[property="og:image:url"]') ||
      pick('meta[name="twitter:image"]') ||
      pick('meta[name="twitter:image:src"]') ||
      '',
    author:
      pick('meta[property="og:site_name"]') ||
      pick('meta[name="author"]') ||
      pick('meta[property="article:author"]') ||
      '',
  };
  if (meta.image) {
    try {
      meta.image = new URL(meta.image, location.href).href;
    } catch {
      /* leave as-is */
    }
  }
  return meta;
}

async function readTabMeta(tabId) {
  if (tabId == null || !chrome.scripting) return {};
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId }, func: readPageMeta });
    return res?.result || {};
  } catch {
    return {};
  }
}

// ---- Page metadata for a URL we don't have open (fetch + parse) ----
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));
}

function tagAttr(tag, name) {
  const m =
    tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"', 'i')) ||
    tag.match(new RegExp(name + "\\s*=\\s*'([^']*)'", 'i'));
  return m ? m[1] : '';
}

function metaFromHtml(html, baseUrl) {
  const head = html.slice(0, 600000); // metadata lives in <head>; cap regex work
  const meta = {};
  const setIf = (k, v) => {
    if (v && !meta[k]) meta[k] = decodeEntities(v).trim();
  };
  for (const tag of head.match(/<meta\b[^>]*>/gi) || []) {
    const key = (tagAttr(tag, 'property') || tagAttr(tag, 'name')).toLowerCase();
    if (!key) continue;
    const c = tagAttr(tag, 'content');
    if (!c) continue;
    if (key === 'og:title' || key === 'twitter:title') setIf('title', c);
    else if (key === 'og:description' || key === 'description' || key === 'twitter:description')
      setIf('description', c);
    else if (
      key === 'og:image' ||
      key === 'og:image:url' ||
      key === 'twitter:image' ||
      key === 'twitter:image:src'
    )
      setIf('image', c);
    else if (key === 'og:site_name' || key === 'author' || key === 'article:author')
      setIf('author', c);
  }
  if (!meta.title) {
    const t = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (t) meta.title = decodeEntities(t[1]).trim();
  }
  if (meta.image) {
    try {
      meta.image = new URL(meta.image, baseUrl).href;
    } catch {
      /* leave as-is */
    }
  }
  return meta;
}

async function fetchMeta(url) {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'text/html,*/*' } });
    clearTimeout(to);
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !/html/i.test(ct)) return {};
    return metaFromHtml(await res.text(), res.url || url);
  } catch {
    return {};
  }
}

// ---- Saving ----
function uid() {
  return 's_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function payloadToItem(p) {
  const now = Date.now();
  return {
    id: uid(),
    type: p.type || 'link',
    title: p.title || 'Saved',
    source: p.source,
    author: p.author,
    url: p.url,
    media: p.media,
    poster: p.poster,
    summary: p.summary,
    ratio: p.ratio ?? (p.type === 'link' ? 1.6 : 1),
    palette: ['#3b3b3b', '#9a9a9a', '#e6e6e6'],
    tags: p.tags || [],
    projectIds: [],
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now,
  };
}

function openForage(payload) {
  const target = APP_URL + '?forage=' + encodeURIComponent(JSON.stringify(payload));
  chrome.tabs.query({}, (tabs) => {
    const existing = tabs.find((t) => t.url && t.url.startsWith(APP_URL));
    if (existing && existing.id != null) {
      chrome.tabs.update(existing.id, { url: target, active: true });
      if (existing.windowId != null) chrome.windows.update(existing.windowId, { focused: true });
    } else {
      chrome.tabs.create({ url: target });
    }
  });
}

// GET the library snapshot, append the new item, PUT it back. Last-write-wins on
// the app side reconciles any concurrent edits.
async function saveViaSync(payload, s) {
  const base = s.endpoint.replace(/\/+$/, '');
  const url = `${base}/${encodeURIComponent(s.key)}`;
  let snap = null;
  try {
    const r = await fetch(url);
    if (r.ok) snap = await r.json();
  } catch {
    /* none yet / offline */
  }
  if (!snap || typeof snap !== 'object' || !Array.isArray(snap.items)) {
    snap = { v: 1, updatedAt: Date.now(), items: [], spaces: [] };
  }
  if (!Array.isArray(snap.spaces)) snap.spaces = [];
  const item = payloadToItem(payload);
  const dup = snap.items.find(
    (i) => (item.url && i.url === item.url) || (item.media && i.media === item.media),
  );
  if (!dup) snap.items.unshift(item);
  snap.updatedAt = Date.now();
  try {
    const p = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(snap),
    });
    return p.ok;
  } catch {
    return false;
  }
}

function flashBadge(ok) {
  try {
    chrome.action.setBadgeBackgroundColor({ color: ok ? '#16a34a' : '#dc2626' });
    chrome.action.setBadgeText({ text: ok ? '✓' : '!' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2200);
  } catch {
    /* badge is best-effort */
  }
}

async function save(payload) {
  const s = await getSettings();
  if (s.background && s.endpoint && s.key) {
    const ok = await saveViaSync(payload, s);
    flashBadge(ok);
    if (!ok) openForage(payload); // fall back to a tab if the push failed
    return { ok, background: true };
  }
  openForage(payload);
  return { ok: true, background: false };
}

// Enrich a payload with page metadata, then save.
//   enrich = { kind: 'tab', tabId } | { kind: 'fetch', url } | null
async function capture(payload, enrich) {
  let meta = {};
  if (enrich?.kind === 'tab') meta = await readTabMeta(enrich.tabId);
  else if (enrich?.kind === 'fetch' && enrich.url) meta = await fetchMeta(enrich.url);
  const enriched = {
    ...payload,
    title: meta.title || payload.title,
    summary: payload.summary || meta.description || undefined,
    media: payload.media || meta.image || undefined,
    author: payload.author || meta.author || undefined,
  };
  return save(enriched);
}

// ---- Context menus ----
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'forage-image', title: 'Forage this image', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'forage-link', title: 'Forage this link', contexts: ['link'] });
    chrome.contextMenus.create({ id: 'forage-page', title: 'Forage this page', contexts: ['page'] });
    chrome.contextMenus.create({ id: 'forage-selection', title: 'Forage selection', contexts: ['selection'] });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const pageUrl = info.pageUrl || (tab && tab.url) || '';
  const title = (tab && tab.title) || 'Saved from web';
  const tabId = tab && tab.id;
  switch (info.menuItemId) {
    case 'forage-image':
      // Keep the image as media; borrow title/description from the host page.
      capture(
        { type: 'image', title, url: pageUrl, media: info.srcUrl, source: hostOf(pageUrl) },
        { kind: 'tab', tabId },
      );
      break;
    case 'forage-link':
      capture(
        { type: 'link', title: hostOf(info.linkUrl) || 'Link', url: info.linkUrl, source: hostOf(info.linkUrl) },
        { kind: 'fetch', url: info.linkUrl },
      );
      break;
    case 'forage-selection':
      capture(
        { type: 'link', title: (info.selectionText || '').slice(0, 80), url: pageUrl, source: hostOf(pageUrl), tags: ['highlight'] },
        null,
      );
      break;
    default:
      capture({ type: 'link', title, url: pageUrl, source: hostOf(pageUrl) }, { kind: 'tab', tabId });
  }
});

// ---- Messages from the popup ----
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'getSettings') {
    getSettings().then(sendResponse);
    return true;
  }
  if (msg?.type === 'setSettings') {
    setSettings(msg.settings || {}).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === 'capture') {
    capture(msg.payload || {}, msg.enrich || null)
      .then((res) => sendResponse(res))
      .catch(() => sendResponse({ ok: false, background: false }));
    return true;
  }
  return false;
});
