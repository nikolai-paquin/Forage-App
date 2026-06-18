// Forage browser extension — context menus that hand a capture to the web app.
// Change APP_URL if you self-host Forage elsewhere.
const APP_URL = 'https://nikolai-paquin.github.io/Forage-App/';

function hostOf(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function openForage(payload) {
  const url = APP_URL + '?forage=' + encodeURIComponent(JSON.stringify(payload));
  chrome.tabs.create({ url });
}

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
  switch (info.menuItemId) {
    case 'forage-image':
      openForage({ type: 'image', title, url: pageUrl, media: info.srcUrl, source: hostOf(pageUrl) });
      break;
    case 'forage-link':
      openForage({ type: 'link', title: hostOf(info.linkUrl) || 'Link', url: info.linkUrl, source: hostOf(info.linkUrl) });
      break;
    case 'forage-selection':
      openForage({ type: 'link', title: (info.selectionText || '').slice(0, 80), url: pageUrl, source: hostOf(pageUrl), tags: ['highlight'] });
      break;
    default:
      openForage({ type: 'link', title, url: pageUrl, source: hostOf(pageUrl) });
  }
});
