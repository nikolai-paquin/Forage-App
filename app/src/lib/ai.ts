// "AI assist" for tags and prompts. Two tiers:
//   1. Local heuristics (instant, offline, always available) — suggestTags / generatePrompt.
//   2. A real model, when the user points Forage at a backend endpoint (see /server).
//      The API key lives in that endpoint, never in this client.
// The async wrappers try the endpoint and fall back to heuristics on any failure,
// so the UI stays responsive whether or not a backend is configured.
import type { Item } from '../types';
import { colorName } from './color';
import { sourceLabel } from './util';

const ENDPOINT_KEY = 'forage.ai.endpoint';

export function getAiEndpoint(): string {
  try {
    return localStorage.getItem(ENDPOINT_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setAiEndpoint(url: string) {
  try {
    const v = url.trim();
    if (v) localStorage.setItem(ENDPOINT_KEY, v);
    else localStorage.removeItem(ENDPOINT_KEY);
  } catch {
    /* non-fatal */
  }
}

export function aiEnabled(): boolean {
  return !!getAiEndpoint();
}

/** Trim an item down to just what the model needs (no media blobs). */
function itemContext(item: Item) {
  return {
    title: item.title,
    type: item.type,
    source: item.source ? sourceLabel(item.source) : undefined,
    note: item.note,
    summary: item.summary,
    tags: item.tags,
    palette: item.palette.map(colorName),
  };
}

async function callBackend(task: 'tags' | 'prompt', item: Item, signal?: AbortSignal) {
  const endpoint = getAiEndpoint();
  if (!endpoint) throw new Error('no endpoint');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ task, item: itemContext(item) }),
    signal,
  });
  if (!res.ok) throw new Error(`backend ${res.status}`);
  return res.json() as Promise<{ tags?: string[]; prompt?: string }>;
}

/** Suggest tags via the configured model, falling back to local heuristics. */
export async function suggestTagsAsync(item: Item, signal?: AbortSignal): Promise<string[]> {
  if (aiEnabled()) {
    try {
      const out = await callBackend('tags', item, signal);
      if (out.tags?.length) {
        const have = new Set(item.tags.map((t) => t.toLowerCase()));
        const clean = out.tags
          .map((t) => String(t).trim().toLowerCase())
          .filter((t) => t && !have.has(t));
        if (clean.length) return [...new Set(clean)].slice(0, 6);
      }
    } catch {
      /* fall through to heuristics */
    }
  }
  return suggestTags(item);
}

/** Compose a prompt via the configured model, falling back to local heuristics. */
export async function generatePromptAsync(item: Item, signal?: AbortSignal): Promise<string> {
  if (aiEnabled()) {
    try {
      const out = await callBackend('prompt', item, signal);
      if (out.prompt?.trim()) return out.prompt.trim();
    } catch {
      /* fall through to heuristics */
    }
  }
  return generatePrompt(item);
}

const STOP = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'design', 'designs',
  'poster', 'study', 'ref', 'refs', 'a', 'an', 'of', 'to', 'in', 'on',
]);

const KEYWORDS: [RegExp, string][] = [
  [/type|font|serif|letter|grotesk/i, 'typography'],
  [/grain|analog|film|35mm/i, 'analog'],
  [/brutal/i, 'brutalist'],
  [/grid|layout|editorial/i, 'editorial'],
  [/colou?r|palette|riso/i, 'color'],
  [/motion|kinetic/i, 'motion'],
  [/\bai\b|diffusion|prompt|generat/i, 'ai'],
  [/logo|mark|brand/i, 'branding'],
  [/poster/i, 'poster'],
  [/texture|concrete/i, 'texture'],
  [/\bui\b|interface|product/i, 'ui'],
];

/** Suggest tags from a save's title, notes, source, type, and palette. */
export function suggestTags(item: Item): string[] {
  const out = new Set<string>();
  const text = [item.title, item.note, ...item.tags].filter(Boolean).join(' ');
  for (const [re, tag] of KEYWORDS) if (re.test(text)) out.add(tag);

  item.title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .forEach((w) => {
      if (w.length > 3 && !STOP.has(w)) out.add(w);
    });

  if (item.source && item.source !== 'upload')
    out.add(sourceLabel(item.source).toLowerCase().replace(/\s+/g, '-'));
  if (item.palette[0]) out.add(colorName(item.palette[0]));

  item.tags.forEach((t) => out.delete(t.toLowerCase()));
  return [...out].slice(0, 6);
}

const STYLE_BY_TYPE: Record<string, string> = {
  image: 'editorial photography',
  ai_asset: 'AI-generated artwork',
  vector: 'clean vector illustration',
  video: 'cinematic motion design',
  gif: 'looping animation',
  link: 'modern web design',
  code: 'refined UI concept',
};

/** Compose a descriptive image prompt from a save's metadata. */
export function generatePrompt(item: Item): string {
  const colors = Array.from(new Set(item.palette.map(colorName))).slice(0, 3).join(', ');
  const descriptors = item.tags.slice(0, 4).join(', ');
  const style = STYLE_BY_TYPE[item.type] ?? 'design';
  return [
    item.title,
    descriptors,
    colors && `${colors} palette`,
    style,
    'balanced composition, high detail, refined',
  ]
    .filter(Boolean)
    .join(', ');
}
