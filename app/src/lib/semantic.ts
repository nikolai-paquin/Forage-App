// Semantic ("find by vibe") search. Embeddings come from the same backend Worker
// (task:'embed', via Cloudflare Workers AI — no extra key). Vectors are cached in
// localStorage keyed by a content hash, so we only re-embed an item when its text
// actually changes. All ranking math is pure + tested; the network is optional and
// degrades to keyword search when unavailable.
import type { Item } from '../types';
import { getAiEndpoint } from './ai';
import { colorName } from './color';
import { sourceLabel } from './util';

const INDEX_KEY = 'forage.embeddings.v1';

interface Entry {
  hash: string;
  vec: number[];
}
type Index = Record<string, Entry>;

/** The text we embed for an item — what it's "about". */
export function itemText(item: Item): string {
  return [
    item.title,
    item.type,
    item.source && sourceLabel(item.source),
    item.note,
    item.summary,
    item.ai?.prompt,
    item.tags.join(' '),
    item.palette.map(colorName).join(' '),
  ]
    .filter(Boolean)
    .join(' \n ')
    .trim();
}

/** Tiny, stable string hash (djb2) — detects when an item's text changed. */
export function hashText(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function loadIndex(): Index {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '{}') as Index;
  } catch {
    return {};
  }
}
function saveIndex(idx: Index) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
  } catch {
    /* over quota — drop silently, semantic is best-effort */
  }
}

async function embed(text: string, signal?: AbortSignal): Promise<number[] | null> {
  const endpoint = getAiEndpoint();
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'embed', text }),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { vector?: number[] };
    return Array.isArray(data.vector) ? data.vector : null;
  } catch {
    return null;
  }
}

/**
 * Bring the embedding index up to date for `items`, embedding at most `budget`
 * stale entries per call so we never block the UI. Returns how many were embedded.
 */
export async function indexItems(items: Item[], budget = 8): Promise<number> {
  if (!getAiEndpoint()) return 0;
  const idx = loadIndex();
  const live = new Set(items.map((i) => i.id));
  // prune embeddings for deleted items
  for (const id of Object.keys(idx)) if (!live.has(id)) delete idx[id];

  let done = 0;
  for (const item of items) {
    if (done >= budget) break;
    const text = itemText(item);
    const hash = hashText(text);
    if (idx[item.id]?.hash === hash) continue;
    const vec = await embed(text);
    if (vec) {
      idx[item.id] = { hash, vec };
      done++;
    }
  }
  if (done) saveIndex(idx);
  return done;
}

export interface SemanticHit {
  id: string;
  score: number;
}

/** Rank items against a free-text query. Empty result ⇒ no index / no endpoint. */
export async function semanticSearch(
  query: string,
  items: Item[],
  { min = 0.25, limit = 12 }: { min?: number; limit?: number } = {},
): Promise<SemanticHit[]> {
  if (!query.trim() || !getAiEndpoint()) return [];
  const qVec = await embed(query);
  if (!qVec) return [];
  const idx = loadIndex();
  const live = new Set(items.filter((i) => !i.deletedAt).map((i) => i.id));
  return Object.entries(idx)
    .filter(([id]) => live.has(id))
    .map(([id, e]) => ({ id, score: cosine(qVec, e.vec) }))
    .filter((h) => h.score >= min)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function clearIndex() {
  try {
    localStorage.removeItem(INDEX_KEY);
  } catch {
    /* ignore */
  }
}
