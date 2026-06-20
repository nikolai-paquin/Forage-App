export const uid = () =>
  's_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

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
  type: 'link' | 'image' | 'gif' | 'code' | 'video';
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
        ratio: 16 / 9,
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
    return { type: 'link', title: host, source: host, url: text };
  }
  if (/[{};=>]|function |const |=>/.test(text) && text.length > 12)
    return { type: 'code', title: 'Pasted snippet', source: 'paste' };
  return { type: 'link', title: text.slice(0, 60) || 'Untitled', source: 'note' };
}
