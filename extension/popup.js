const APP_URL = 'https://nikolai-paquin.github.io/Forage-App/';

function hostOf(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Injected into the page to read OpenGraph/meta tags for a rich bookmark.
function readPageMeta() {
  const pick = (sel) => document.querySelector(sel)?.getAttribute('content')?.trim() || '';
  const meta = {
    title:
      pick('meta[property="og:title"]') ||
      pick('meta[name="twitter:title"]') ||
      document.title ||
      '',
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

async function readMeta(tabId) {
  if (tabId == null || !chrome.scripting) return {};
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId }, func: readPageMeta });
    return res?.result || {};
  } catch {
    return {};
  }
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
    window.close();
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  document.getElementById('title').textContent = tab?.title || '';
  document.getElementById('url').textContent = tab?.url || '';
  document.getElementById('open').href = APP_URL;

  document.getElementById('save').addEventListener('click', async () => {
    const meta = await readMeta(tab?.id);
    openForage({
      type: 'link',
      title: meta.title || tab?.title || 'Saved page',
      url: tab?.url,
      media: meta.image || undefined,
      summary: meta.description || undefined,
      author: meta.author || undefined,
      source: hostOf(tab?.url || ''),
    });
  });

  const link = document.getElementById('link');
  const addLink = () => {
    const v = link.value.trim();
    if (!v) return;
    const isImg = /\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(v);
    openForage({
      type: isImg ? 'image' : 'link',
      title: hostOf(v) || v.slice(0, 60),
      url: /^https?:/i.test(v) ? v : undefined,
      media: isImg ? v : undefined,
      source: hostOf(v),
    });
  };
  document.getElementById('saveLink').addEventListener('click', addLink);
  link.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addLink();
  });
});
