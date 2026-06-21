import { useState } from 'react';
import { useForage } from '../lib/store';
import type { Item, Kit } from '../types';
import { fontStack } from '../lib/fonts';
import { extractPalette } from '../lib/color';
import { copyHex, copyText } from '../lib/util';
import { toast } from '../lib/toast';
import {
  ArrowLeft,
  Close,
  Copy,
  FontIcon,
  Image as ImageIcon,
  ImageDown,
  Palette,
  Pipette,
  Plus,
  Trash2,
} from './icons';

const thumb = (i?: Item) => (i ? (i.type === 'video' ? i.poster : i.media) : undefined);
const IMAGE_TYPES = new Set(['image', 'ai_asset', 'gif', 'vector', 'video']);

/** Build a single CSS block for the whole kit — palette vars + font imports. */
function kitToCss(kit: Kit, fonts: Item[]): string {
  const slug =
    kit.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'kit';
  const vars = kit.colors.map((c, i) => `  --${slug}-${i + 1}: ${c.toUpperCase()};`).join('\n');
  const imports = fonts
    .filter((f) => f.fontUrl !== undefined && !f.fontData)
    .map((f) => {
      const fam = (f.fontFamily || f.title).trim().replace(/\s+/g, '+');
      return `@import url('https://fonts.googleapis.com/css2?family=${fam}:wght@400;700&display=swap');`;
    })
    .join('\n');
  const families = fonts
    .map((f) => `  --${slug}-font-${(f.fontFamily || f.title).toLowerCase().replace(/\s+/g, '-')}: "${f.fontFamily || f.title}";`)
    .join('\n');
  return [imports, `:root {`, [vars, families].filter(Boolean).join('\n'), `}`]
    .filter(Boolean)
    .join('\n');
}

function Picker({
  items,
  empty,
  onPick,
  onClose,
  render,
}: {
  items: Item[];
  empty: string;
  onPick: (id: string) => void;
  onClose: () => void;
  render: (i: Item) => React.ReactNode;
}) {
  return (
    <>
      <button aria-hidden tabIndex={-1} onClick={onClose} className="fixed inset-0 z-10 cursor-default" />
      <div className="absolute left-0 z-20 mt-2 max-h-72 w-64 overflow-auto rounded-xl border border-border bg-elevated p-1.5 shadow-[var(--shadow-pop)]">
        {items.length === 0 ? (
          <p className="px-2.5 py-2 text-[12.5px] text-faint">{empty}</p>
        ) : (
          items.map((i) => (
            <button
              key={i.id}
              onClick={() => {
                onPick(i.id);
                onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-2"
            >
              {render(i)}
            </button>
          ))
        )}
      </div>
    </>
  );
}

export function KitView() {
  const { view, kitById, items, itemById, updateKit, deleteKit, setView } = useForage();
  const [addingFont, setAddingFont] = useState(false);
  const [addingImage, setAddingImage] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (view.kind !== 'kit') return null;
  const kit = kitById(view.id);
  if (!kit) return null;

  const fonts = kit.fontItemIds.map((id) => itemById(id)).filter(Boolean) as Item[];
  const images = kit.imageItemIds.map((id) => itemById(id)).filter(Boolean) as Item[];
  const fontChoices = items.filter((i) => i.type === 'font' && !kit.fontItemIds.includes(i.id));
  const imageChoices = items.filter(
    (i) => IMAGE_TYPES.has(i.type) && thumb(i) && !kit.imageItemIds.includes(i.id),
  );

  const setColor = (i: number, hex: string) =>
    updateKit(kit.id, { colors: kit.colors.map((c, j) => (j === i ? hex : c)) });
  const addColor = () => updateKit(kit.id, { colors: [...kit.colors, '#888888'] });
  const removeColor = (i: number) =>
    updateKit(kit.id, { colors: kit.colors.filter((_, j) => j !== i) });

  const eyedrop = async () => {
    const ED = (
      window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }
    ).EyeDropper;
    if (!ED) return toast('Your browser has no eyedropper — try Chrome.');
    try {
      const { sRGBHex } = await new ED().open();
      updateKit(kit.id, { colors: [...kit.colors, sRGBHex] });
    } catch {
      /* cancelled */
    }
  };

  // Extract from a freshly uploaded file — a local data URL, so it always works
  // (no cross-origin/CORS limits like library images hosted elsewhere).
  const extractFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const p = await extractPalette(String(reader.result));
      if (p.length) {
        updateKit(kit.id, { colors: [...new Set([...kit.colors, ...p])] });
        toast(`Added ${p.length} colors`);
      } else {
        toast("Couldn't read colors from that image.");
      }
    };
    reader.readAsDataURL(file);
  };

  const extractFromImage = async (item: Item) => {
    const src = thumb(item);
    if (!src) {
      toast('That save has no image to read colors from.');
      return;
    }
    const p = await extractPalette(src);
    if (p.length) {
      updateKit(kit.id, { colors: [...new Set([...kit.colors, ...p])] });
      toast(`Added ${p.length} colors`);
    } else {
      toast(
        "Couldn't read that image — it's hosted on another site. Set an image proxy in Settings → Link previews, or use the eyedropper.",
      );
    }
  };

  const exportCss = () => {
    copyText(kitToCss(kit, fonts));
    toast('Copied kit CSS');
  };

  return (
    <div className="px-5 pb-32">
      <button
        onClick={() => setView({ kind: 'kits' })}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
      >
        <ArrowLeft size={15} /> Kits
      </button>

      <div className="mb-8 flex items-start gap-3">
        <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
          <Palette size={18} />
        </span>
        <input
          value={kit.name}
          onChange={(e) => updateKit(kit.id, { name: e.target.value })}
          placeholder="Kit name"
          className="min-w-0 flex-1 bg-transparent text-[26px] font-semibold tracking-tight text-ink outline-none placeholder:text-faint"
        />
        <button
          onClick={exportCss}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] text-ink transition hover:bg-surface-2"
        >
          <Copy size={14} /> Export CSS
        </button>
        {confirmDel ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => deleteKit(kit.id)}
              className="rounded-full bg-red-500 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="rounded-full border border-border px-3 py-1.5 text-[13px] text-ink transition hover:bg-surface-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            title="Delete kit"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-red-500"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Palette */}
      <Section title="Palette">
        <div className="flex flex-wrap items-center gap-2">
          {kit.colors.map((c, i) => (
            <div key={i} className="group/sw relative">
              <button
                onClick={() => copyHex(c)}
                title={`${c.toUpperCase()} — click to copy`}
                className="h-16 w-16 rounded-xl ring-1 ring-border transition hover:scale-105"
                style={{ background: c }}
              />
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(c) ? c : '#888888'}
                onChange={(e) => setColor(i, e.target.value)}
                title="Edit color"
                className="absolute inset-0 h-16 w-16 cursor-pointer opacity-0"
              />
              <button
                onClick={() => removeColor(i)}
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-accent-ink opacity-0 transition group-hover/sw:opacity-100"
              >
                <Close size={11} />
              </button>
              <p className="mt-1 text-center text-[10px] uppercase text-faint">{c.replace('#', '')}</p>
            </div>
          ))}
          <button
            onClick={addColor}
            title="Add color"
            className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={eyedrop} className={pillBtn}>
            <Pipette size={13} /> Eyedropper
          </button>
          <label className={`${pillBtn} cursor-pointer`}>
            <ImageDown size={13} /> From a file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) extractFromFile(f);
                e.target.value = '';
              }}
            />
          </label>
          {imageChoices.length + images.length > 0 && (
            <ImageExtract images={[...images, ...imageChoices]} onExtract={extractFromImage} />
          )}
        </div>
      </Section>

      {/* Fonts */}
      <Section title="Fonts">
        <div className="flex flex-wrap gap-3">
          {fonts.map((f) => (
            <div
              key={f.id}
              className="group/f relative w-44 rounded-xl border border-border bg-surface p-3"
            >
              <p className="truncate text-[28px] leading-none text-ink" style={{ fontFamily: fontStack(f.fontFamily) }}>
                Ag
              </p>
              <p className="mt-2 truncate text-[12.5px] font-medium text-ink">{f.title}</p>
              <p className="truncate text-[12px] text-muted" style={{ fontFamily: fontStack(f.fontFamily) }}>
                {f.sample || 'The quick brown fox'}
              </p>
              <button
                onClick={() =>
                  updateKit(kit.id, { fontItemIds: kit.fontItemIds.filter((id) => id !== f.id) })
                }
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-muted opacity-0 transition group-hover/f:opacity-100 hover:text-red-500"
              >
                <Close size={12} />
              </button>
            </div>
          ))}
          <div className="relative">
            <button
              onClick={() => setAddingFont((v) => !v)}
              className="flex h-[104px] w-44 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
            >
              <FontIcon size={18} />
              <span className="text-[12.5px]">Add font</span>
            </button>
            {addingFont && (
              <Picker
                items={fontChoices}
                empty="No saved fonts yet — add some from the + menu."
                onPick={(id) => updateKit(kit.id, { fontItemIds: [...kit.fontItemIds, id] })}
                onClose={() => setAddingFont(false)}
                render={(i) => (
                  <>
                    <span className="text-[20px] leading-none text-ink" style={{ fontFamily: fontStack(i.fontFamily) }}>
                      Ag
                    </span>
                    <span className="truncate text-[13px] text-ink">{i.title}</span>
                  </>
                )}
              />
            )}
          </div>
        </div>
      </Section>

      {/* Reference images */}
      <Section title="Reference images">
        <div className="flex flex-wrap gap-3">
          {images.map((im) => (
            <div key={im.id} className="group/i relative h-28 w-28 overflow-hidden rounded-xl border border-border bg-surface-2">
              <img src={thumb(im)} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() =>
                  updateKit(kit.id, { imageItemIds: kit.imageItemIds.filter((id) => id !== im.id) })
                }
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-white opacity-0 transition group-hover/i:opacity-100 hover:bg-red-500"
              >
                <Close size={12} />
              </button>
            </div>
          ))}
          <div className="relative">
            <button
              onClick={() => setAddingImage((v) => !v)}
              className="flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong text-muted transition hover:border-ink hover:text-ink"
            >
              <ImageIcon size={18} />
              <span className="text-[12px]">Add image</span>
            </button>
            {addingImage && (
              <Picker
                items={imageChoices}
                empty="No images to add."
                onPick={(id) => updateKit(kit.id, { imageItemIds: [...kit.imageItemIds, id] })}
                onClose={() => setAddingImage(false)}
                render={(i) => (
                  <>
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-surface-2">
                      {thumb(i) && <img src={thumb(i)} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <span className="truncate text-[13px] text-ink">{i.title}</span>
                  </>
                )}
              />
            )}
          </div>
        </div>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <textarea
          value={kit.notes ?? ''}
          onChange={(e) => updateKit(kit.id, { notes: e.target.value })}
          placeholder="Direction, usage rules, where this kit applies…"
          rows={3}
          className="w-full max-w-2xl resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
        />
      </Section>
    </div>
  );
}

const pillBtn =
  'flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-ink transition hover:bg-surface-2';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-9">
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-faint">{title}</h3>
      {children}
    </div>
  );
}

function ImageExtract({
  images,
  onExtract,
}: {
  images: Item[];
  onExtract: (i: Item) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className={pillBtn}>
        <Palette size={13} /> Extract from image
      </button>
      {open && (
        <Picker
          items={images}
          empty="No images in your library."
          onPick={(id) => {
            const it = images.find((i) => i.id === id);
            if (it) onExtract(it);
          }}
          onClose={() => setOpen(false)}
          render={(i) => (
            <>
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-surface-2">
                {thumb(i) && <img src={thumb(i)} alt="" className="h-full w-full object-cover" />}
              </span>
              <span className="truncate text-[13px] text-ink">{i.title}</span>
            </>
          )}
        />
      )}
    </div>
  );
}
