// Open a URL in the user's real browser.
//
// On the web this is just window.open. Inside the Tauri desktop app the
// WKWebView swallows normal navigations to external sites (the link looks
// dead — that's the bug we're fixing), so we route through the opener plugin
// which hands the URL to the OS to open in the default browser.

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

/** True when running inside the Tauri desktop shell. */
const isTauri = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

/** Open an http(s) link in the default browser, from web or desktop. */
export async function openExternal(url?: string | null): Promise<void> {
  if (!url) return;
  if (isTauri()) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
      return;
    } catch {
      /* plugin missing or failed — fall back to a normal window open */
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
