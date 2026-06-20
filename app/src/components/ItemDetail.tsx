import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { suggestTagsAsync, generatePromptAsync, aiEnabled } from '../lib/ai';
import { extractPalette } from '../lib/color';
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
  Loader,
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
};

const thumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

function Media({ item }: { item: Item }) {
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
    trashItem,
    setDerivedFrom,
    outputsOf,
  } = useForage();
  const [linking, setLinking] = useState(false);
  const [busy, setBusy] = useState<null | 'tags' | 'prompt'>(null);
  const [collectOpen, setCollectOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const usingModel = aiEnabled();

  // Resolve the LIVE item from the store — the `item` prop is a snapshot taken
  // when the tile was clicked, so edits (tags, prompt, palette, collections)
  // wouldn't otherwise appear here.
  const live = item ? itemById(item.id) ?? item : null;

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
    if (p.length) updateItem(live.id, { palette: p });
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
              <span className="mr-2 text-[13px] tabular-nums text-white/50">100%</span>
              <input type="range" min={50} max={150} defaultValue={100} className="mr-3 h-1 w-28 accent-white" />
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
                  trashItem(item.id);
                  onClose();
                }}
                className={iconBtn}
                title="Move to Trash"
              >
                <Trash2 size={17} />
              </button>
              <button onClick={onClose} className={iconBtn} title="Close"><Close size={18} /></button>
            </div>
          </div>

          {/* body */}
          <div className="flex min-h-0 flex-1">
            <div className="relative grid min-w-0 flex-1 place-items-center p-8">
              <Media item={item} />
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
            <aside className="w-[360px] shrink-0 overflow-auto border-l border-white/10 bg-[#141416] p-5">
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
                {thumb(item) ? (
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
                  <span
                    key={`${c}-${i}`}
                    title={c}
                    className="h-5 w-5 rounded-full ring-1 ring-white/15"
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

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] text-white/45">
                    <Sparkle size={13} /> Image Prompt
                    {usingModel && <span className="text-white/30">· model</span>}
                  </p>
                  {live.ai?.prompt ? (
                    <>
                      <p className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-[12.5px] leading-relaxed text-white/80">
                        {live.ai.prompt}
                      </p>
                      <button
                        disabled={busy === 'prompt'}
                        onClick={async () => {
                          setBusy('prompt');
                          const prompt = await generatePromptAsync(live);
                          updateItem(live.id, {
                            ai: {
                              prompt,
                              model: usingModel ? 'forage-remote' : 'forage-local',
                              sourceRefId: live.ai?.sourceRefId,
                            },
                          });
                          setBusy(null);
                        }}
                        className="mt-1.5 text-[12px] text-white/45 transition hover:text-white disabled:opacity-50"
                      >
                        {busy === 'prompt' ? 'Regenerating…' : 'Regenerate'}
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={busy === 'prompt'}
                      onClick={async () => {
                        setBusy('prompt');
                        const prompt = await generatePromptAsync(live);
                        updateItem(live.id, {
                          ai: { prompt, model: usingModel ? 'forage-remote' : 'forage-local' },
                        });
                        setBusy(null);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] text-white/70 transition hover:text-white disabled:opacity-50"
                    >
                      {busy === 'prompt' ? (
                        <Loader size={13} className="animate-spin" />
                      ) : (
                        <Sparkle size={13} />
                      )}
                      {busy === 'prompt' ? 'Generating…' : 'Generate prompt'}
                    </button>
                  )}
                </div>

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
                    <button
                      disabled={busy === 'tags'}
                      onClick={async () => {
                        setBusy('tags');
                        const tags = await suggestTagsAsync(live);
                        tags.forEach((t) => addTag(live.id, t));
                        setBusy(null);
                      }}
                      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-white/60 hover:text-white disabled:opacity-50"
                    >
                      {busy === 'tags' ? (
                        <Loader size={11} className="animate-spin" />
                      ) : (
                        <Sparkle size={11} />
                      )}
                      {busy === 'tags' ? 'Tagging…' : 'Auto-tag'}
                    </button>
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
