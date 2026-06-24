import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { extractPalette } from '../lib/color';
import { ensureFont, fontStack } from '../lib/fonts';
import { copyHex, copyText } from '../lib/util';
import {
  paletteToCss,
  paletteToTailwind,
  paletteToJson,
  downloadPaletteImage,
  fontToCss,
} from '../lib/export';
import { toast } from '../lib/toast';

function TagAdder({ onAdd }: { onAdd: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState('');
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-dashed border-white/20 px-2.5 py-1 text-[12px] text-white/50 hover:text-white"
      >
        + Add
      </button>
    );
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && v.trim()) {
          onAdd(v);
          setV('');
        }
        if (e.key === 'Escape') setOpen(false);
      }}
      onBlur={() => setOpen(false)}
      placeholder="tag…"
      className="w-24 rounded-full bg-white/10 px-2.5 py-1 text-[12px] text-white outline-none placeholder:text-white/30"
    />
  );
}
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Close,
  Copy,
  Download,
  ExternalLink,
  Folder,
  Hash,
  Info,
  Music,
  Pipette,
  Plus,
  Sparkle,
  Trash2,
} from './icons';

function SourcePicker({
  items,
  excludeId,
  onPick,
  onClose,
}: {
  items: Item[];
  excludeId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div
        className="relative max-h-[72vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-elevated text-ink"
        style={{ boxShadow: 'var(--shadow-pop)' }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-[14px] font-semibold">Link the source inspiration</p>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <Close size={16} />
          </button>
        </div>
        <div className="grid max-h-[60vh] grid-cols-3 gap-2.5 overflow-auto p-4 sm:grid-cols-4">
          {items
            .filter((i) => i.id !== excludeId && !i.deletedAt)
            .map((i) => {
              const src = i.type === 'video' ? i.poster : i.media;
              return (
                <button
                  key={i.id}
                  onClick={() => onPick(i.id)}
                  title={i.title}
                  className="aspect-square overflow-hidden rounded-lg border border-border bg-surface-2 transition hover:-translate-y-0.5"
                >
                  {src ? (
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full place-items-center px-1 text-center text-[10px] text-faint">
                      {i.title}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

const EXT: Record<Item['type'], string> = {
  image: 'JPEG',
  ai_asset: 'PNG',
  video: 'MP4',
  gif: 'GIF',
  vector: 'SVG',
  link: 'LINK',
  code: 'CODE',
  audio: 'AUDIO',
  palette: 'PALETTE',
  font: 'FONT',
};

const thumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

function PaletteView({ item }: { item: Item }) {
  const colors = item.palette.length ? item.palette : ['#e6e6e6'];
  return (
    <div className="w-full max-w-3xl">
      <div className="flex overflow-hidden rounded-2xl shadow-2xl">
        {colors.map((c, i) => (
          <button
            key={`${c}-${i}`}
            onClick={() => copyHex(c)}
            title={`${c.toUpperCase()} — click to copy`}
            className="group/sw relative flex h-64 flex-1 flex-col items-center justify-end pb-5 transition-[flex] hover:flex-[1.4]"
            style={{ background: c }}
          >
            <span className="flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[12px] font-medium uppercase tracking-wide text-white opacity-0 backdrop-blur-md transition group-hover/sw:opacity-100">
              <Copy size={11} /> {c.replace('#', '')}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-[12.5px] text-white/45">
        Click a swatch to copy its hex code.
      </p>
    </div>
  );
}

function FontView({ item }: { item: Item }) {
  const sample = item.sample || 'The quick brown fox jumps over the lazy dog';
  return (
    <div className="w-full max-w-3xl text-white" style={{ fontFamily: fontStack(item.fontFamily) }}>
      <p className="text-[clamp(56px,12vw,120px)] leading-none">Ag</p>
      <p className="mt-6 text-[clamp(22px,4vw,40px)] leading-tight">{sample}</p>
      <p className="mt-6 text-[clamp(15px,2vw,22px)] leading-snug text-white/70">
        ABCDEFGHIJKLMNOPQRSTUVWXYZ
        <br />
        abcdefghijklmnopqrstuvwxyz 0123456789
      </p>
    </div>
  );
}

function Media({ item }: { item: Item }) {
  if (item.type === 'palette') return <PaletteView item={item} />;
  if (item.type === 'font') return <FontView item={item} />;
  if (item.type === 'video')
    return (
      <video
        src={item.media}
        poster={item.poster}
        controls
        autoPlay
        muted
        loop
        playsInline
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    );
  if (item.type === 'code')
    return (
      <pre className="max-h-full max-w-full overflow-auto rounded-lg bg-[#0e0f12] p-6 font-mono text-[13px] leading-relaxed text-[#c9cdd6] shadow-2xl">
        <code>{item.code}</code>
      </pre>
    );
  if (item.type === 'audio')
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl bg-gradient-to-br from-[#26262f] to-[#383844] p-10 shadow-2xl">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white/10 text-white">
          <Music size={34} />
        </div>
        <p className="text-center text-[15px] font-medium text-white">{item.title}</p>
        <audio src={item.media} controls autoPlay className="w-full" />
      </div>
    );
  if (thumb(item))
    return (
      <img
        src={thumb(item)}
        alt={item.title}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    );
  return (
    <div className="grid aspect-video w-2/3 place-items-center rounded-lg bg-white/5 text-white/40">
      <ExternalLink size={28} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] text-white/45">{label}</p>
      {children}
    </div>
  );
}

const iconBtn =
  'grid h-9 w-9 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white';

const exportBtn =
  'flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white';

function ExportPanel({ item }: { item: Item }) {
  const copy = (text: string, label: string) => {
    copyText(text);
    toast(`Copied ${label}`);
  };
  return (
    <div className="border-t border-white/10 pt-4">
      <p className="mb-2 flex items-center gap-1.5 text-[12px] text-white/45">
        <Download size={13} /> Export
      </p>
      <div className="flex flex-wrap gap-1.5">
        {item.type === 'palette' ? (
          <>
            <button className={exportBtn} onClick={() => copy(paletteToCss(item), 'CSS variables')}>
              <Copy size={12} /> CSS
            </button>
            <button className={exportBtn} onClick={() => copy(paletteToTailwind(item), 'Tailwind config')}>
              <Copy size={12} /> Tailwind
            </button>
            <button className={exportBtn} onClick={() => copy(paletteToJson(item), 'JSON')}>
              <Copy size={12} /> JSON
            </button>
            <button className={exportBtn} onClick={() => downloadPaletteImage(item)}>
              <Download size={12} /> PNG
            </button>
          </>
        ) : (
          <button className={exportBtn} onClick={() => copy(fontToCss(item), 'font CSS')}>
            <Copy size={12} /> Copy CSS
          </button>
        )}
      </div>
    </div>
  );
}

export function ItemDetail({
  item,
  onClose,
  onOpen,
}: {
  item: Item | null;
  onClose: () => void;
  onOpen: (i: Item) => void;
}) {
  const {
    visibleItems,
    items,
    itemById,
    projectById,
    projects,
    assignToProject,
    removeFromProject,
    updateItem,
    addTag,
    removeTag,
    deleteForever,
    reinsertItem,
    setDerivedFrom,
    outputsOf,
  } = useForage();
  const [linking, setLinking] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Resolve the LIVE item from the store — the `item` prop is a snapshot taken
  // when the tile was clicked, so edits (tags, prompt, palette, collections)
  // wouldn't otherwise appear here.
  const live = item ? itemById(item.id) ?? item : null;

  // Register a saved typeface so its preview renders in the real font.
  useEffect(() => {
    if (live?.type === 'font') ensureFont(live);
  }, [live?.id, live?.fontFamily, live?.fontData, live?.fontUrl]);

  const list = visibleItems.length ? visibleItems : item ? [item] : [];
  const idx = item ? list.findIndex((i) => i.id === item.id) : -1;
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  const sourceId = live ? live.derivedFrom ?? live.ai?.sourceRefId : undefined;
  const srcItem = sourceId ? itemById(sourceId) : undefined;
  const outputs = live ? outputsOf(live.id).filter((o) => o.id !== live.id) : [];

  // Native eyedropper: sample any pixel on screen and add it to the palette.
  // Works regardless of image CORS (canvas extraction fails on cross-origin URLs).
  const pickColor = async () => {
    if (!live) return;
    const ED = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } })
      .EyeDropper;
    if (ED) {
      try {
        const { sRGBHex } = await new ED().open();
        updateItem(live.id, { palette: [sRGBHex, ...live.palette.filter((c) => c !== sRGBHex)].slice(0, 5) });
      } catch {
        /* cancelled */
      }
      return;
    }
    const m = live.type === 'video' ? live.poster : live.media;
    if (!m) return;
    const p = await extractPalette(m);
    if (p.length)
      updateItem(live.id, {
        palette: [...p, ...live.palette.filter((c) => !p.includes(c))].slice(0, 5),
      });
    else toast("Couldn't read colors — this image is hosted elsewhere (try Chrome's eyedropper).");
  };

  return (
    <AnimatePresence>
      {item && live && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0b] text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' && prev) onOpen(prev);
            if (e.key === 'ArrowRight' && next) onOpen(next);
            if (e.key === 'Escape') onClose();
          }}
          tabIndex={-1}
        >
          {/* top toolbar */}
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/15">
                <ArrowLeft size={17} />
              </button>
              {idx >= 0 && (
                <span className="tnum text-[13px] text-white/50">
                  {idx + 1} / {list.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={pickColor} className={iconBtn} title="Pick a color (eyedropper)">
                <Pipette size={17} />
              </button>
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer" className={iconBtn} title="Open source">
                  <ExternalLink size={17} />
                </a>
              )}
              <a
                href={item.media ?? item.url ?? '#'}
                download={item.title}
                target="_blank"
                rel="noreferrer"
                className={iconBtn}
                title="Download"
              >
                <Download size={17} />
              </a>
              <button
                onClick={() => {
                  const deleted = live;
                  deleteForever(item.id);
                  onClose();
                  toast('Deleted', { undo: () => reinsertItem(deleted), sound: 'trash' });
                }}
                className={iconBtn}
                title="Delete"
              >
                <Trash2 size={17} />
              </button>
              <button onClick={onClose} className={iconBtn} title="Close"><Close size={18} /></button>
            </div>
          </div>

          {/* body */}
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="relative grid min-w-0 flex-1 place-items-center p-4 md:p-8">
              <Media item={live} />
              {prev && (
                <button
                  onClick={() => onOpen(prev)}
                  className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {next && (
                <button
                  onClick={() => onOpen(next)}
                  className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>

            {/* details panel */}
            <aside className="max-h-[48vh] w-full shrink-0 overflow-auto border-t border-white/10 bg-[#141416] p-5 md:max-h-none md:w-[360px] md:border-l md:border-t-0">
              <div className="relative mb-4 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold">Details</h2>
                <button
                  onClick={() => setInfoOpen((v) => !v)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
                  title="Item info"
                >
                  <Info size={16} />
                </button>
                {infoOpen && (
                  <button
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setInfoOpen(false)}
                    className="fixed inset-0 z-0 cursor-default"
                  />
                )}
                {infoOpen && (
                  <div className="absolute right-0 top-9 z-10 w-60 rounded-xl border border-white/10 bg-[#1c1c1f] p-3 text-[12px] shadow-2xl">
                    <dl className="flex flex-col gap-1.5">
                      <div className="flex justify-between gap-3">
                        <dt className="text-white/40">Type</dt>
                        <dd className="text-white/85">{EXT[live.type]}</dd>
                      </div>
                      {live.source && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-white/40">Source</dt>
                          <dd className="truncate text-white/85">{live.source}</dd>
                        </div>
                      )}
                      {live.author && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-white/40">Creator</dt>
                          <dd className="truncate text-white/85">{live.author}</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-3">
                        <dt className="text-white/40">Saved</dt>
                        <dd className="text-white/85">{new Date(live.createdAt).toLocaleDateString()}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-white/40">Ratio</dt>
                        <dd className="text-white/85">{live.ratio.toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-white/40">Tags</dt>
                        <dd className="text-white/85">{live.tags.length}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>

              <div className="relative mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                {live.type === 'palette' ? (
                  <div className="flex h-28 w-full">
                    {(live.palette.length ? live.palette : ['#e6e6e6']).map((c, i) => (
                      <span key={`${c}-${i}`} className="flex-1" style={{ background: c }} />
                    ))}
                  </div>
                ) : live.type === 'font' ? (
                  <div
                    className="grid h-28 place-items-center text-[44px] text-white"
                    style={{ fontFamily: fontStack(live.fontFamily) }}
                  >
                    Ag
                  </div>
                ) : thumb(item) ? (
                  <img src={thumb(item)} alt="" className="max-h-52 w-full object-contain" />
                ) : (
                  <div className="grid h-40 place-items-center text-white/30">{EXT[item.type]}</div>
                )}
                <span className="absolute right-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md">
                  {EXT[item.type]}
                </span>
              </div>

              <div className="mb-5 flex items-center gap-2">
                {live.palette.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    onClick={() => copyHex(c)}
                    title={`${c.toUpperCase()} — click to copy`}
                    className="h-5 w-5 rounded-full ring-1 ring-white/15 transition hover:scale-110"
                    style={{ background: c }}
                  />
                ))}
                <button
                  onClick={pickColor}
                  title="Pick a color (eyedropper)"
                  className="grid h-5 w-5 place-items-center rounded-full text-white/40 hover:text-white"
                >
                  <Pipette size={12} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <Field label="Name">
                  <input
                    key={`name-${item.id}`}
                    defaultValue={item.title}
                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13.5px] text-white outline-none focus:border-white/25"
                  />
                </Field>
                {live.type === 'font' && (
                  <Field label="Sample text">
                    <input
                      key={`sample-${item.id}`}
                      defaultValue={live.sample ?? ''}
                      onChange={(e) => updateItem(item.id, { sample: e.target.value })}
                      placeholder="The quick brown fox…"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13.5px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
                    />
                  </Field>
                )}
                {(live.author || live.type === 'link' || live.type === 'video') && (
                  <Field label="Creator">
                    <input
                      key={`author-${item.id}-${!!live.author}`}
                      defaultValue={live.author ?? ''}
                      onChange={(e) => updateItem(item.id, { author: e.target.value })}
                      placeholder="Channel, author, or site"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13.5px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
                    />
                  </Field>
                )}
                <Field label="URL">
                  <input
                    key={`url-${item.id}`}
                    defaultValue={item.url ?? ''}
                    onChange={(e) => updateItem(item.id, { url: e.target.value })}
                    placeholder="https://…"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13.5px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
                  />
                </Field>
                {(live.summary || live.type === 'link') && (
                  <Field label="Description">
                    <textarea
                      key={`summary-${item.id}-${!!live.summary}`}
                      defaultValue={live.summary ?? ''}
                      onChange={(e) => updateItem(item.id, { summary: e.target.value })}
                      placeholder="Page description…"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13.5px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
                    />
                  </Field>
                )}
                <Field label="Note">
                  <textarea
                    key={`note-${item.id}`}
                    defaultValue={item.note ?? ''}
                    onChange={(e) => updateItem(item.id, { note: e.target.value })}
                    placeholder="Add a note…"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13.5px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
                  />
                </Field>

                {(live.type === 'palette' || live.type === 'font') && (
                  <ExportPanel item={live} />
                )}

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] text-white/45">
                    <Folder size={13} /> Collections
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {live.projectIds.map((pid) => {
                      const p = projectById(pid);
                      if (!p) return null;
                      return (
                        <span key={pid} className="flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[12px] text-white/85">
                          <Folder size={12} /> {p.name}
                          <button onClick={() => removeFromProject(live.id, pid)} className="text-white/40 hover:text-white">
                            <Close size={12} />
                          </button>
                        </span>
                      );
                    })}
                    <div className="relative">
                      <button
                        onClick={() => setCollectOpen((v) => !v)}
                        className="rounded-full border border-dashed border-white/20 px-2.5 py-1 text-[12px] text-white/50 hover:text-white"
                      >
                        + Add
                      </button>
                      {collectOpen && (
                        <button
                          aria-hidden
                          tabIndex={-1}
                          onClick={() => setCollectOpen(false)}
                          className="fixed inset-0 z-0 cursor-default"
                        />
                      )}
                      {collectOpen && (
                        <div className="absolute right-0 z-10 mt-1.5 max-h-56 w-52 overflow-auto rounded-xl border border-white/10 bg-[#1c1c1f] p-1 shadow-2xl">
                          {projects.filter((p) => !live.projectIds.includes(p.id)).length === 0 ? (
                            <p className="px-2.5 py-2 text-[12px] text-white/40">
                              In every collection already.
                            </p>
                          ) : (
                            projects
                              .filter((p) => !live.projectIds.includes(p.id))
                              .map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    assignToProject(live.id, p.id);
                                    setCollectOpen(false);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-white/85 transition hover:bg-white/10"
                                >
                                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                                  <span className="truncate">{p.name}</span>
                                </button>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] text-white/45">
                    <Hash size={13} /> Tags
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {live.tags.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[12px] text-white/85"
                      >
                        #{t}
                        <button onClick={() => removeTag(live.id, t)} className="text-white/40 hover:text-white">
                          <Close size={11} />
                        </button>
                      </span>
                    ))}
                    <TagAdder onAdd={(t) => addTag(live.id, t)} />
                  </div>
                </div>

                {(live.type === 'ai_asset' || srcItem) && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="mb-1 flex items-center gap-1.5 text-[12px] text-white/45">
                      <Sparkle size={13} /> Derived from
                    </p>
                    <p className="mb-2 text-[11px] leading-relaxed text-white/30">
                      Link the reference this was made from, to trace your input→output history.
                    </p>
                    {srcItem ? (
                      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-1.5 pr-2">
                        <button onClick={() => onOpen(srcItem)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white/10">
                            {thumb(srcItem) && <img src={thumb(srcItem)} alt="" className="h-full w-full object-cover" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] text-white">{srcItem.title}</span>
                            <span className="block text-[11px] text-white/40">the inspiration</span>
                          </span>
                        </button>
                        <button onClick={() => setDerivedFrom(live.id, undefined)} className="text-white/40 hover:text-white">
                          <Close size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setLinking(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-[13px] text-white/55 hover:text-white"
                      >
                        <Plus size={13} /> Link a source
                      </button>
                    )}
                  </div>
                )}

                {outputs.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-[12px] text-white/45">
                      <Sparkle size={13} /> Made from this
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {outputs.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => onOpen(o)}
                          title={o.title}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10 transition hover:-translate-y-0.5"
                        >
                          {thumb(o) ? (
                            <img src={thumb(o)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="grid h-full place-items-center px-1 text-center text-[9px] text-white/50">{o.title}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {linking && (
            <SourcePicker
              items={items}
              excludeId={item.id}
              onPick={(id) => {
                setDerivedFrom(item.id, id);
                setLinking(false);
              }}
              onClose={() => setLinking(false)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
