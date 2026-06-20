const APP_URL = 'https://nikolai-paquin.github.io/Forage-App/';

function hostOf(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Hand a capture to the background worker, which enriches it and either opens
// the app or saves it silently to the sync endpoint.
async function send(payload, enrich) {
  try {
    await chrome.runtime.sendMessage({ type: 'capture', payload, enrich });
  } catch {
    /* worker may have closed the popup already */
  }
  window.close();
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  document.getElementById('title').textContent = tab?.title || '';
  document.getElementById('url').textContent = tab?.url || '';
  document.getElementById('open').href = APP_URL;

  document.getElementById('save').addEventListener('click', () => {
    send(
      { type: 'link', title: tab?.title || 'Saved page', url: tab?.url, source: hostOf(tab?.url || '') },
      tab?.id != null ? { kind: 'tab', tabId: tab.id } : null,
    );
  });

  const link = document.getElementById('link');
  const addLink = () => {
    const v = link.value.trim();
    if (!v) return;
    const isImg = /\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(v);
    const url = /^https?:/i.test(v) ? v : undefined;
    send(
      {
        type: isImg ? 'image' : 'link',
        title: hostOf(v) || v.slice(0, 60),
        url,
        media: isImg ? v : undefined,
        source: hostOf(v),
      },
      // Non-image links get enriched by fetching + parsing their meta tags.
      !isImg && url ? { kind: 'fetch', url } : null,
    );
  };
  document.getElementById('saveLink').addEventListener('click', addLink);
  link.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addLink();
  });
});

// ---- Settings panel (background save & sync) ----
const gear = document.getElementById('gear');
const settings = document.getElementById('settings');
const epEl = document.getElementById('endpoint');
const keyEl = document.getElementById('key');
const bgEl = document.getElementById('background');
const statusEl = document.getElementById('status');

gear.addEventListener('click', async () => {
  settings.classList.toggle('open');
  if (settings.classList.contains('open')) {
    try {
      const s = await chrome.runtime.sendMessage({ type: 'getSettings' });
      epEl.value = s?.endpoint || '';
      keyEl.value = s?.key || '';
      bgEl.checked = !!s?.background;
    } catch {
      /* ignore */
    }
  }
});

document.getElementById('saveSettings').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    type: 'setSettings',
    settings: { endpoint: epEl.value.trim(), key: keyEl.value.trim(), background: bgEl.checked },
  });
  statusEl.textContent = bgEl.checked
    ? 'Saved — captures now save in the background.'
    : 'Saved.';
  setTimeout(() => (statusEl.textContent = ''), 2000);
});
