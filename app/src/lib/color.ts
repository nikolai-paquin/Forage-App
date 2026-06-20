// Color utilities for palette extraction, naming, and color search.

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h.split('').map((c) => c + c).join('')
      : h.padEnd(6, '0').slice(0, 6),
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

export function colorDist(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/** Nearest human color name for a hex. */
export function colorName(hex: string): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  if (l < 0.12) return 'black';
  if (l > 0.9 && s < 0.12) return 'white';
  if (s < 0.12) return 'grey';
  const bands: [number, string][] = [
    [16, 'red'],
    [45, 'orange'],
    [70, 'yellow'],
    [160, 'green'],
    [200, 'teal'],
    [255, 'blue'],
    [290, 'purple'],
    [335, 'pink'],
    [360, 'red'],
  ];
  for (const [max, n] of bands) if (h <= max) return n;
  return 'red';
}

/** Swatches shown in the color-search row. */
export const COLOR_SWATCHES: { word: string; hex: string }[] = [
  { word: 'red', hex: '#e0524a' },
  { word: 'orange', hex: '#e58a3c' },
  { word: 'yellow', hex: '#e8c84d' },
  { word: 'green', hex: '#6aa86b' },
  { word: 'blue', hex: '#4f7dc2' },
  { word: 'purple', hex: '#8a6fc2' },
  { word: 'pink', hex: '#d98ab0' },
  { word: 'warm', hex: '#c97a4a' },
  { word: 'dark', hex: '#222' },
  { word: 'light', hex: '#eee' },
];

/** Does a palette match a color word? Handles named hues + warm/cool/dark/light/neutral. */
export function matchColor(palette: string[], word: string): boolean {
  const w = word.toLowerCase();
  return palette.some((hex) => {
    const [h, s, l] = rgbToHsl(...hexToRgb(hex));
    switch (w) {
      case 'warm':
        return s > 0.18 && (h <= 70 || h >= 330);
      case 'cool':
        return s > 0.18 && h >= 150 && h <= 280;
      case 'dark':
        return l < 0.28;
      case 'light':
        return l > 0.82;
      case 'neutral':
        return s < 0.14;
      default:
        return colorName(hex) === w;
    }
  });
}

/** Measure an image's true aspect ratio (w/h) so it tiles without cropping. */
export function imageRatio(src: string): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Extract up to 5 dominant colors from an image URL (works for same-origin / data URLs). */
export function extractPalette(src: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = 64;
        const h = Math.max(1, Math.round((img.height / img.width) * 64)) || 64;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve([]);
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 125) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
          const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
          e.r += r;
          e.g += g;
          e.b += b;
          e.n++;
          buckets.set(key, e);
        }
        const sorted = [...buckets.values()].sort((a, b) => b.n - a.n);
        const out: string[] = [];
        for (const e of sorted) {
          const r = Math.round(e.r / e.n);
          const g = Math.round(e.g / e.n);
          const b = Math.round(e.b / e.n);
          const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
          if (out.every((o) => colorDist(o, hex) > 38)) out.push(hex);
          if (out.length >= 5) break;
        }
        resolve(out);
      } catch {
        resolve([]); // tainted canvas (cross-origin without CORS) — keep existing
      }
    };
    img.onerror = () => resolve([]);
    img.src = src;
  });
}
