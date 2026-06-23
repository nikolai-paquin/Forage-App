// Render a collection grid or a moodboard canvas to a single shareable PNG.
// Pure client-side <canvas>. Images are routed through the image proxy (when
// configured) so cross-origin saves don't taint the canvas; anything that still
// taints is caught and reported rather than throwing.
import type { Item, Space } from '../types';
import { proxiedImage } from './unfurl';
import { toast } from './toast';

const thumb = (i?: Item) => (i ? (i.type === 'video' ? i.poster : i.media) : undefined);

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = proxiedImage(src);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Cover-fit draw: fill the box, cropping overflow (like object-fit: cover). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.width / img.height;
  const br = w / h;
  let sw = img.width;
  let sh = img.height;
  let sx = 0;
  let sy = 0;
  if (ir > br) {
    sw = img.height * br;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / br;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function download(canvas: HTMLCanvasElement, name: string) {
  try {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch {
    toast("Couldn't render the image — some saves may be unavailable right now.");
  }
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'forage';

/** Draw a non-image save as a labelled card (palette swatches, link/code/etc.). */
function drawCard(ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, w: number, h: number) {
  if (item.type === 'palette' && item.palette.length) {
    const bw = w / item.palette.length;
    item.palette.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(x + i * bw, y, Math.ceil(bw), h);
    });
    return;
  }
  // Generic card: soft background + centered title.
  ctx.fillStyle = '#ece9e3';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#6b6b6b';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = (item.title || item.source || item.type).slice(0, 22);
  ctx.fillText(label, x + w / 2, y + h / 2);
}

export interface CollectionExportOpts {
  title: string;
  subtitle?: string;
  items: Item[];
}

/** Render a collection as a titled grid PNG and download it. */
export async function exportCollectionImage({ title, subtitle, items }: CollectionExportOpts) {
  const cols = items.length <= 4 ? 2 : items.length <= 9 ? 3 : 4;
  const cell = 320;
  const gap = 16;
  const pad = 48;
  const headerH = 130;
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const w = pad * 2 + cols * cell + (cols - 1) * gap;
  const h = headerH + pad + rows * cell + (rows - 1) * gap + pad;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // background
  ctx.fillStyle = '#faf9f6';
  ctx.fillRect(0, 0, w, h);

  // header
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 44px system-ui, sans-serif';
  ctx.fillText(title.slice(0, 48), pad, pad + 44);
  ctx.fillStyle = '#8a8a8a';
  ctx.font = '400 22px system-ui, sans-serif';
  ctx.fillText(subtitle || `${items.length} saves`, pad, pad + 80);
  // watermark
  ctx.fillStyle = '#b7b3aa';
  ctx.textAlign = 'right';
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillText('forage', w - pad, pad + 44);
  ctx.textAlign = 'left';

  const loaded = await Promise.all(items.map((it) => (thumb(it) ? loadImage(thumb(it)!) : Promise.resolve(null))));

  items.forEach((it, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = pad + c * (cell + gap);
    const y = headerH + pad + r * (cell + gap);
    ctx.save();
    roundRect(ctx, x, y, cell, cell, 18);
    ctx.clip();
    const img = loaded[i];
    if (img) drawCover(ctx, img, x, y, cell, cell);
    else drawCard(ctx, it, x, y, cell, cell);
    ctx.restore();
  });

  download(canvas, slug(title));
}

/** Render a moodboard (space) as a single PNG, preserving element positions. */
export async function exportMoodboardImage(space: Space, resolveItem: (id: string) => Item | undefined) {
  const els = space.elements;
  const drawings = space.drawings ?? [];
  if (!els.length && !drawings.length) {
    toast('This moodboard is empty.');
    return;
  }

  // bounding box across elements + drawings
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const e of els) {
    grow(e.x, e.y);
    grow(e.x + e.w, e.y + (e.h ?? e.w * 0.75));
  }
  for (const d of drawings) for (const p of d.points) grow(p.x, p.y);

  const margin = 60;
  minX -= margin;
  minY -= margin;
  maxX += margin;
  maxY += margin;
  const bw = maxX - minX;
  const bh = maxY - minY;

  const target = 1800;
  const scale = Math.min(2, target / bw);
  const w = Math.round(bw * scale);
  const h = Math.round(bh * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#f4f2ee';
  ctx.fillRect(0, 0, w, h);

  const tx = (x: number) => (x - minX) * scale;
  const ty = (y: number) => (y - minY) * scale;

  // images first (by z-order), then notes, so notes read on top
  const sorted = [...els].sort((a, b) => a.z - b.z);
  const imgEls = sorted.filter((e) => e.kind === 'item');
  const loaded = await Promise.all(
    imgEls.map((e) => {
      const it = e.itemId ? resolveItem(e.itemId) : undefined;
      const src = thumb(it);
      return src ? loadImage(src) : Promise.resolve(null);
    }),
  );

  sorted.forEach((e) => {
    const x = tx(e.x);
    const y = ty(e.y);
    const ew = e.w * scale;
    const eh = (e.h ?? e.w * 0.75) * scale;
    if (e.kind === 'item') {
      const img = loaded[imgEls.indexOf(e)];
      const it = e.itemId ? resolveItem(e.itemId) : undefined;
      ctx.save();
      roundRect(ctx, x, y, ew, eh, 10 * scale);
      ctx.clip();
      // A readable image draws as-is; one we can't read (cross-origin without
      // CORS) falls back to a labelled card so the export is never blank.
      if (img) drawCover(ctx, img, x, y, ew, eh);
      else if (it) drawCard(ctx, it, x, y, ew, eh);
      else {
        ctx.fillStyle = '#e0ddd6';
        ctx.fillRect(x, y, ew, eh);
      }
      ctx.restore();
    } else {
      // note
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 16 * scale;
      ctx.shadowOffsetY = 4 * scale;
      ctx.fillStyle = e.color || '#ffffff';
      roundRect(ctx, x, y, ew, eh, 6 * scale);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#222';
      ctx.font = `400 ${15 * scale}px system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      wrapText(ctx, e.text || '', x + 14 * scale, y + 12 * scale, ew - 28 * scale, 21 * scale);
    }
  });

  // drawings on top
  for (const d of drawings) {
    if (d.points.length < 2) continue;
    ctx.strokeStyle = d.color;
    ctx.lineWidth = Math.max(1, d.width * scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx(d.points[0].x), ty(d.points[0].y));
    for (const p of d.points.slice(1)) ctx.lineTo(tx(p.x), ty(p.y));
    ctx.stroke();
  }

  download(canvas, slug(space.name));
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}
