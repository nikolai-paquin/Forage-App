// Font items: register a saved font so previews render in the real typeface.
// Two sources are supported — an uploaded font file (data URL, loaded via the
// FontFace API, fully offline) or a Google Fonts family (a stylesheet <link>).
import type { Item } from '../types';

const loaded = new Set<string>();
const linked = new Set<string>();

/** A CSS-safe quoted family name, e.g. `"Inter Display"`. */
export function fontStack(family: string | undefined): string {
  if (!family) return 'inherit';
  return `"${family.replace(/"/g, '')}", system-ui, sans-serif`;
}

/** Inject a Google Fonts stylesheet for a family (no-op if already added). */
function linkGoogleFont(family: string) {
  if (linked.has(family)) return;
  linked.add(family);
  const param = family.trim().replace(/\s+/g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${param}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

/** Register an uploaded font file from its data URL via the FontFace API. */
async function loadFontFace(family: string, dataUrl: string) {
  if (loaded.has(family)) return;
  loaded.add(family);
  try {
    const face = new FontFace(family, `url(${dataUrl})`);
    await face.load();
    (document.fonts as FontFaceSet).add(face);
  } catch {
    loaded.delete(family); // allow a retry later
  }
}

/** Ensure a single font item's typeface is available for rendering. */
export function ensureFont(item: Pick<Item, 'type' | 'fontFamily' | 'fontData' | 'fontUrl'>) {
  if (item.type !== 'font' || !item.fontFamily) return;
  if (item.fontData) void loadFontFace(item.fontFamily, item.fontData);
  else if (item.fontUrl !== undefined) linkGoogleFont(item.fontFamily);
}

/** Register every saved font up front so grids and details render correctly. */
export function ensureFonts(items: Item[]) {
  for (const it of items) if (it.type === 'font') ensureFont(it);
}
