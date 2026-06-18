const APP_URL = 'https://nikolai-paquin.github.io/Forage-App/';

function hostOf(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  document.getElementById('title').textContent = tab?.title || '';
  document.getElementById('url').textContent = tab?.url || '';
  document.getElementById('open').href = APP_URL;
  document.getElementById('save').addEventListener('click', () => {
    const payload = {
      type: 'link',
      title: tab?.title || 'Saved page',
      url: tab?.url,
      source: hostOf(tab?.url || ''),
    };
    chrome.tabs.create({ url: APP_URL + '?forage=' + encodeURIComponent(JSON.stringify(payload)) });
    window.close();
  });
});
