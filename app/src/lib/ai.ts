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

/** The visual to hand a vision model, when the item has one. */
function imageForAI(item: Item): string | undefined {
  if (item.type === 'image' || item.type === 'gif' || item.type === 'ai_asset') return item.media;
  if (item.type === 'video') return item.poster ?? item.media;
  if (item.type === 'link') return item.media; // OpenGraph preview
  return undefined;
}

async function callBackend(task: 'tags' | 'prompt', item: Item, signal?: AbortSignal) {
  const endpoint = getAiEndpoint();
  if (!endpoint) throw new Error('no endpoint');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ task, item: itemContext(item), image: imageForAI(item) }),
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
  // generic capture/file noise — these described nothing about the actual save
  'pasted', 'image', 'images', 'untitled', 'saved', 'screenshot', 'img', 'photo',
  'photos', 'file', 'copy', 'thumbnail', 'preview', 'www', 'com', 'net', 'org',
  'http', 'https', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'pinimg', 'video',
]);

const DEFAULT_PALETTE = '#3b3b3b,#9a9a9a,#e6e6e6';
/** True only when an item has a real (extracted) palette, not the gray placeholder. */
function hasRealPalette(item: Item): boolean {
  return item.palette.length > 0 && item.palette.join(',').toLowerCase() !== DEFAULT_PALETTE;
}

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

/**
 * Local fallback tags from a save's title, notes, source, type, and palette.
 * Note: this is text-only — it cannot see the image. For tags that describe the
 * actual picture, configure the AI endpoint (a vision model). Kept honest here:
 * we drop generic file/capture noise and the gray placeholder palette so it
 * never emits things like "pasted", "image", or "grey" for an unread image.
 */
export function suggestTags(item: Item): string[] {
  const out = new Set<string>();
  const text = [item.title, item.note, item.summary, ...item.tags].filter(Boolean).join(' ');
  for (const [re, tag] of KEYWORDS) if (re.test(text)) out.add(tag);

  item.title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .forEach((w) => {
      if (w.length > 3 && !STOP.has(w)) out.add(w);
    });

  if (item.source && item.source !== 'upload' && !/pinimg|gstatic|cdn/.test(item.source)) {
    const s = sourceLabel(item.source).toLowerCase().replace(/\s+/g, '-');
    if (s.length > 2 && !STOP.has(s)) out.add(s);
  }
  if (hasRealPalette(item)) out.add(colorName(item.palette[0]));

  item.tags.forEach((t) => out.delete(t.toLowerCase()));
  return [...out].filter((t) => t.length > 1 && !STOP.has(t)).slice(0, 6);
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

/**
 * Local fallback prompt from a save's metadata (text-only — it can't see the
 * image; configure the AI endpoint for an image-aware prompt). Skips the generic
 * title and gray placeholder palette so it doesn't read like "Pasted image, grey".
 */
export function generatePrompt(item: Item): string {
  const colors = hasRealPalette(item)
    ? Array.from(new Set(item.palette.map(colorName))).slice(0, 3).join(', ')
    : '';
  const descriptors = item.tags.filter((t) => !STOP.has(t.toLowerCase())).slice(0, 4).join(', ');
  const style = STYLE_BY_TYPE[item.type] ?? 'design';
  const title = /^(pasted|untitled|saved|screenshot|image)\b/i.test(item.title.trim())
    ? ''
    : item.title;
  return [
    title,
    descriptors,
    colors && `${colors} palette`,
    style,
    'balanced composition, high detail',
  ]
    .filter(Boolean)
    .join(', ');
}
