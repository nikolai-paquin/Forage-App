// Link previews + image proxy, powered by the optional Forage unfurl Worker
// (server/unfurl-worker.js). The endpoint URL is stored locally; when it's not
// set, callers fall back to client-only behavior. Kept dependency-free so other
// libs (color.ts, util.ts) can import it without cycles.

const ENDPOINT_KEY = 'forage.unfurl.endpoint';

export function getUnfurlEndpoint(): string {
  try {
    return localStorage.getItem(ENDPOINT_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setUnfurlEndpoint(url: string) {
  try {
    const v = url.trim();
    if (v) localStorage.setItem(ENDPOINT_KEY, v);
    else localStorage.removeItem(ENDPOINT_KEY);
  } catch {
    /* non-fatal */
  }
}

export function unfurlEnabled(): boolean {
  return !!getUnfurlEndpoint();
}

export interface UnfurlMeta {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  siteName?: string;
  type?: string;
}

/** Fetch OpenGraph/oEmbed metadata for a page URL via the Worker (null if unset/failed). */
export async function unfurl(url: string, signal?: AbortSignal): Promise<UnfurlMeta | null> {
  const ep = getUnfurlEndpoint();
  if (!ep || !url) return null;
  try {
    const res = await fetch(`${ep}?url=${encodeURIComponent(url)}`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as UnfurlMeta & { error?: string };
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Route a cross-origin image through the proxy so a <canvas> can read its pixels
 * (palette extraction). Data/blob/relative/same-origin URLs pass through as-is,
 * as does everything when no endpoint is configured.
 */
export function proxiedImage(src: string): string {
  const ep = getUnfurlEndpoint();
  if (!ep || !src || !/^https?:\/\//i.test(src)) return src;
  try {
    if (new URL(src).origin === location.origin) return src;
  } catch {
    return src;
  }
  return `${ep}?img=${encodeURIComponent(src)}`;
}
