import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item } from '../types';

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
  Pipette,
  Sparkle,
  Trash2,
} from './icons';

const EXT: Record<Item['type'], string> = {
  image: 'JPEG',
  ai_asset: 'PNG',
  video: 'MP4',
  gif: 'GIF',
  vector: 'SVG',
  link: 'LINK',
  code: 'CODE',
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
  const { visibleItems, projectById, removeFromProject, updateItem, addTag, removeTag, trashItem } =
    useForage();

  const list = visibleItems.length ? visibleItems : item ? [item] : [];
  const idx = item ? list.findIndex((i) => i.id === item.id) : -1;
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  return (
    <AnimatePresence>
      {item && (
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
              <button className={iconBtn} title="Pick colour"><Pipette size={17} /></button>
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
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold">Details</h2>
                <Info size={16} className="text-white/40" />
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

              <div className="mb-5 flex gap-2">
                {item.palette.map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full ring-1 ring-white/15" style={{ background: c }} />
                ))}
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
                <Field label="URL">
                  <input
                    key={`url-${item.id}`}
                    defaultValue={item.url ?? ''}
                    onChange={(e) => updateItem(item.id, { url: e.target.value })}
                    placeholder="https://…"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13.5px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
                  />
                </Field>
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
                  </p>
                  {item.ai ? (
                    <p className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-[12.5px] leading-relaxed text-white/80">
                      {item.ai.prompt}
                    </p>
                  ) : (
                    <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] text-white/70 transition hover:text-white">
                      Generate prompt
                    </button>
                  )}
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] text-white/45">
                    <Folder size={13} /> Collections
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.projectIds.map((pid) => {
                      const p = projectById(pid);
                      if (!p) return null;
                      return (
                        <span key={pid} className="flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[12px] text-white/85">
                          <Folder size={12} /> {p.name}
                          <button onClick={() => removeFromProject(item.id, pid)} className="text-white/40 hover:text-white">
                            <Close size={12} />
                          </button>
                        </span>
                      );
                    })}
                    <button className="rounded-full border border-dashed border-white/20 px-2.5 py-1 text-[12px] text-white/50 hover:text-white">+ Add</button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] text-white/45">
                    <Hash size={13} /> Tags
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[12px] text-white/85"
                      >
                        #{t}
                        <button onClick={() => removeTag(item.id, t)} className="text-white/40 hover:text-white">
                          <Close size={11} />
                        </button>
                      </span>
                    ))}
                    <TagAdder onAdd={(t) => addTag(item.id, t)} />
                    <button className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-white/60 hover:text-white">Auto-tag</button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
