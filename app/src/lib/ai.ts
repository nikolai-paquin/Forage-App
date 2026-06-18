// Local "AI assist" heuristics. Pure client-side — structured so a real model
// (e.g. a Claude call) can replace suggestTags / generatePrompt later.
import type { Item } from '../types';
import { colorName } from './color';
import { sourceLabel } from './util';

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
