// Turn saved palettes and fonts into things you can paste into real design
// work — CSS variables, Tailwind config, JSON, a PNG swatch sheet, or a
// ready-to-use @import / font-family snippet.
import type { Item } from '../types';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'palette';

export function paletteToCss(item: Item): string {
  const name = slug(item.title);
  const lines = item.palette.map((c, i) => `  --${name}-${i + 1}: ${c.toUpperCase()};`);
  return `:root {\n${lines.join('\n')}\n}`;
}

export function paletteToTailwind(item: Item): string {
  const name = slug(item.title).replace(/-/g, '');
  const entries = item.palette
    .map((c, i) => `      '${(i + 1) * 100}': '${c.toUpperCase()}',`)
    .join('\n');
  return `// tailwind.config.js → theme.extend.colors\n${name}: {\n${entries}\n}`;
}

export function paletteToJson(item: Item): string {
  return JSON.stringify(
    { name: item.title, colors: item.palette.map((c) => c.toUpperCase()) },
    null,
    2,
  );
}

/** Render the palette to a labelled PNG and trigger a download. */
export function downloadPaletteImage(item: Item) {
  const colors = item.palette.length ? item.palette : ['#e6e6e6'];
  const swatchW = 220;
  const w = swatchW * colors.length;
  const h = 320;
  const labelH = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * swatchW, 0, swatchW, h - labelH);
    // label strip
    ctx.fillStyle = '#fff';
    ctx.fillRect(i * swatchW, h - labelH, swatchW, labelH);
    ctx.fillStyle = '#111';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.toUpperCase(), i * swatchW + swatchW / 2, h - labelH / 2);
  });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(item.title)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export function fontToCss(item: Item): string {
  const family = item.fontFamily || item.title;
  if (item.fontUrl !== undefined && !item.fontData) {
    const param = family.trim().replace(/\s+/g, '+');
    return (
      `@import url('https://fonts.googleapis.com/css2?family=${param}:wght@400;700&display=swap');\n\n` +
      `font-family: "${family}", sans-serif;`
    );
  }
  // Uploaded font — the user hosts the file themselves; give them the scaffold.
  return (
    `@font-face {\n` +
    `  font-family: "${family}";\n` +
    `  src: url('${family.replace(/\s+/g, '-').toLowerCase()}.woff2') format('woff2');\n` +
    `}\n\n` +
    `font-family: "${family}", sans-serif;`
  );
}
