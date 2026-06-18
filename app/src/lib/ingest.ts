import { detectFromInput } from './util';

export interface IngestPayload {
  type: 'image' | 'gif' | 'link' | 'code';
  title: string;
  url?: string;
  media?: string;
  source?: string;
  tags?: string[];
}

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/**
 * Reads a capture handed off via URL — from the browser extension
 * (?forage=<json>) or the PWA share target (?title&text&url) — turns it into a
 * save, then strips it from the address bar. Returns null if there's nothing.
 */
export function consumeShareUrl(): IngestPayload | null {
  const params = new URLSearchParams(window.location.search);
  let payload: IngestPayload | null = null;

  const raw = params.get('forage');
  if (raw) {
    try {
      payload = JSON.parse(decodeURIComponent(raw)) as IngestPayload;
    } catch {
      payload = null;
    }
  } else if (params.has('title') || params.has('text') || params.has('url')) {
    const title = params.get('title') ?? '';
    const text = params.get('text') ?? '';
    const url = params.get('url') ?? '';
    const link = url || text.match(/https?:\/\/\S+/)?.[0] || '';
    if (link) {
      const d = detectFromInput(link);
      payload = {
        type: d.type === 'gif' ? 'gif' : d.type === 'image' ? 'image' : 'link',
        title: title || d.title,
        url: /^https?:/i.test(link) ? link : undefined,
        media: d.type === 'image' || d.type === 'gif' ? link : undefined,
        source: hostOf(link) ?? d.source,
      };
    } else if (title || text) {
      payload = { type: 'link', title: (title || text).slice(0, 80), source: 'note' };
    }
  }

  if (payload) {
    // clean the URL so a refresh doesn't re-add
    window.history.replaceState(null, '', window.location.pathname);
  }
  return payload;
}
