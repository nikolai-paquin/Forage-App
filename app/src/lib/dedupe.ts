// Duplicate detection for capture. Catching "you already saved this" keeps a
// library clean — the #1 annoyance of a save-everything tool.
import type { Item } from '../types';

const TRACKING = /^(utm_|fbclid$|gclid$|igshid$|si$|ref$|ref_src$|mc_)/i;

/** Canonical form of a URL so trivially-different links compare equal. */
export function normalizeUrl(url?: string): string {
  if (!url) return '';
  const raw = url.trim();
  try {
    const u = new URL(raw);
    u.hash = '';
    for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
    const host = u.host.replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    const query = u.searchParams.toString();
    return `${u.protocol}//${host}${path}${query ? `?${query}` : ''}`.toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

export interface DupeCandidate {
  url?: string;
  media?: string;
  code?: string;
}

/** Find a live (non-trashed) item that already represents this capture, if any. */
export function findDuplicate(items: Item[], candidate: DupeCandidate): Item | undefined {
  const url = normalizeUrl(candidate.url);
  const media = candidate.media?.trim();
  const code = candidate.code?.trim();
  if (!url && !media && !code) return undefined;
  return items.find((it) => {
    if (it.deletedAt) return false;
    if (url && it.url && normalizeUrl(it.url) === url) return true;
    if (media && it.media && it.media.trim() === media) return true;
    if (code && it.code && it.code.trim() === code) return true;
    return false;
  });
}
