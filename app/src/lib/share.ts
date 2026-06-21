// Read-only sharing. Publish a snapshot of a collection to a tiny Cloudflare
// Worker (see /server/share-worker.js) and get back a short id. The share URL
// embeds the worker's GET url in its hash, so a recipient needs no setup — the
// viewer just fetches it. Shares are public to anyone who has the link.
import type { Item } from '../types';

const ENDPOINT_KEY = 'forage.share.endpoint';

export const getShareEndpoint = () => {
  try {
    return (localStorage.getItem(ENDPOINT_KEY) ?? '').trim();
  } catch {
    return '';
  }
};
export const setShareEndpoint = (v: string) => {
  try {
    if (v.trim()) localStorage.setItem(ENDPOINT_KEY, v.trim());
    else localStorage.removeItem(ENDPOINT_KEY);
  } catch {
    /* non-fatal */
  }
};
export const shareConfigured = () => !!getShareEndpoint();

/** The read-only display fields we publish — no private notes or AI prompts. */
export interface SharedItem {
  id: string;
  type: Item['type'];
  title: string;
  source?: string;
  author?: string;
  url?: string;
  media?: string;
  poster?: string;
  code?: string;
  language?: string;
  ratio: number;
  palette: string[];
  tags: string[];
  summary?: string;
  fontFamily?: string;
  fontData?: string;
  fontUrl?: string;
  sample?: string;
}

export interface SharePayload {
  v: 1;
  kind: 'collection';
  title: string;
  brief?: string;
  exportedAt: number;
  items: SharedItem[];
}

export function toSharedItem(i: Item): SharedItem {
  return {
    id: i.id,
    type: i.type,
    title: i.title,
    source: i.source,
    author: i.author,
    url: i.url,
    media: i.media,
    poster: i.poster,
    code: i.code,
    language: i.language,
    ratio: i.ratio,
    palette: i.palette,
    tags: i.tags,
    summary: i.summary,
    fontFamily: i.fontFamily,
    fontData: i.fontData,
    fontUrl: i.fontUrl,
    sample: i.sample,
  };
}

const base = () => getShareEndpoint().replace(/\/+$/, '');

/** Publish a payload; resolves to the share id. Throws on transport error. */
export async function publishShare(payload: SharePayload): Promise<string> {
  if (!shareConfigured()) throw new Error('Sharing isn’t set up yet.');
  const res = await fetch(base(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 413) throw new Error('This collection is too large to share.');
  if (!res.ok) throw new Error(`Publish failed (${res.status}).`);
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error('Share server returned no id.');
  return data.id;
}

/** Fetch a published share directly from a GET url (used by the viewer). */
export async function fetchShareByUrl(url: string): Promise<SharePayload | null> {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Couldn’t load share (${res.status}).`);
  const data = (await res.json()) as SharePayload;
  if (!data || !Array.isArray(data.items)) return null;
  return data;
}

/** A self-contained share URL — the recipient needs no configuration. */
export function shareUrl(id: string): string {
  const getUrl = `${base()}/${encodeURIComponent(id)}`;
  return `${location.origin}${location.pathname}#share=${encodeURIComponent(getUrl)}`;
}

/** If the current URL is a share link, the GET url to fetch; else null. */
export function shareUrlFromHash(): string | null {
  const m = /[#&]share=([^&]+)/.exec(location.hash);
  return m ? decodeURIComponent(m[1]) : null;
}
