import { getUnfurlEndpoint } from './unfurl';
import { toast } from './toast';
import type { Item, Project } from '../types';

export const uid = () =>
  's_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/** Platform-aware modifier label for keyboard hints (⌘ on Apple, Ctrl elsewhere). */
export const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test((navigator as Navigator).platform || navigator.userAgent);
export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';

/** Copy text to the clipboard (with a legacy fallback). */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      /* give up silently */
    }
    ta.remove();
  }
}

/** Copy a hex color to the clipboard and confirm with a toast. */
export async function copyHex(hex: string) {
  const value = hex.toUpperCase();
  await copyText(value);
  toast(`Copied ${value}`);
}

/** A save belongs to a collection if it was added manually or matches an auto-tag. */
export function itemInProject(item: Item, project: Project): boolean {
  if (item.projectIds.includes(project.id)) return true;
  const at = project.autoTags;
  return !!(at && at.length && at.some((t) => item.tags.includes(t)));
}

const SOURCE_LABELS: Record<string, string> = {
  'youtube.com': 'YouTube',
  'x.com': 'X',
  'twitter.com': 'X',
  'pinterest.com': 'Pinterest',
  'vimeo.com': 'Vimeo',
  'dribbble.com': 'Dribbble',
  'behance.net': 'Behance',
  'instagram.com': 'Instagram',
  'unsplash.com': 'Unsplash',
  'cargo.site': 'Cargo',
  'fontsinuse.com': 'Fonts in Use',
  upload: 'Upload',
  gist: 'Gist',
  paste: 'Paste',
  note: 'Note',
  Flora: 'Flora (AI)',
};

/** Friendly label for a save's source (domain or tool). */
export function sourceLabel(source?: string): string {
  if (!source) return 'Unknown';
  if (SOURCE_LABELS[source]) return SOURCE_LABELS[source];
  const base = source.replace(/^www\./, '').split('.')[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}

export interface Detected {
  type: 'link' | 'image' | 'gif' | 'code' | 'video' | 'audio';
  title: string;
  source?: string;
  url?: string;
  /** Media URL (image/gif/video preview). */
  media?: string;
  /** Poster thumbnail (video). */
  poster?: string;
  /** Known aspect ratio (w/h), e.g. 16:9 for video thumbnails. */
  ratio?: number;
}

/** Extract a YouTube video id from any of its URL shapes. */
export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch {
    /* not a url */
  }
  return null;
}

/**
 * Fetch a YouTube video's real title + creator. Prefers the unfurl Worker
 * (server-side oEmbed, no CORS), then YouTube's first-party endpoint, then a
 * CORS-friendly fallback; null if all fail.
 */
export async function fetchYouTubeMeta(
  url: string,
): Promise<{ title: string; author?: string } | null> {
  const ep = getUnfurlEndpoint();
  const endpoints = [
    ...(ep ? [`${ep}?url=${encodeURIComponent(url)}`] : []),
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
  ];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const data = (await res.json()) as { title?: string; author?: string; author_name?: string };
      if (data?.title) return { title: data.title, author: data.author ?? data.author_name };
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Guess an item type, title, and any embeddable media from pasted text or a URL. */
export function detectFromInput(raw: string): Detected {
  const text = raw.trim();
  const isUrl = /^https?:\/\//i.test(text);
  if (isUrl) {
    const yt = youTubeId(text);
    if (yt) {
      return {
        type: 'video',
        title: 'YouTube video',
        source: 'youtube.com',
        url: text,
        // hqdefault always exists; object-cover trims its 4:3 letterbox to a clean 16:9.
        poster: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`,
        // Slightly taller than 16:9 to leave room for the logo + title footer.
        ratio: 1.4,
      };
    }
    let host = '';
    try {
      host = new URL(text).hostname.replace(/^www\./, '');
    } catch {
      host = 'link';
    }
    if (/\.(png|jpe?g|webp|avif)(\?|$)/i.test(text))
      return { type: 'image', title: 'Pasted image', source: host, url: text, media: text };
    if (/\.gif(\?|$)/i.test(text))
      return { type: 'gif', title: 'Pasted GIF', source: host, url: text, media: text };
    if (/\.(mp3|wav|ogg|m4a|flac|aac)(\?|$)/i.test(text))
      return { type: 'audio', title: 'Audio track', source: host, url: text, media: text, ratio: 1.5 };
    return { type: 'link', title: host, source: host, url: text };
  }
  if (/[{};=>]|function |const |=>/.test(text) && text.length > 12)
    return { type: 'code', title: 'Pasted snippet', source: 'paste' };
  return { type: 'link', title: text.slice(0, 60) || 'Untitled', source: 'note' };
}
