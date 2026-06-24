import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { itemInProject } from '../lib/util';
import { ensureFont, fontStack } from '../lib/fonts';
import { toast } from '../lib/toast';
import { Camera, Check, Close } from './icons';

const imageThumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

/** A grid tile preview for a save — image, font glyph, palette, or title. */
function TilePreview({ item }: { item: Item }) {
  useEffect(() => {
    if (item.type === 'font') ensureFont(item);
  }, [item]);
  const img = imageThumb(item);
  if (img) return <img src={img} alt="" className="h-full w-full object-cover" />;
  if (item.type === 'font')
    return (
      <span
        className="grid h-full w-full place-items-center text-[34px] leading-none text-ink"
        style={{ fontFamily: fontStack(item.fontFamily) }}
      >
        Ag
      </span>
    );
  if (item.type === 'palette' && item.palette?.length)
    return (
      <span className="flex h-full w-full">
        {item.palette.slice(0, 5).map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </span>
    );
  return (
    <span className="grid h-full w-full place-items-center px-1.5 text-center text-[10px] leading-tight text-faint">
      {item.title}
    </span>
  );
}

/** Pick existing saves to add to a collection — a grid of recent saves not
 *  already in it, with a fallback to capturing something new. */
export function AddToCollectionDialog({
  projectId,
  onClose,
  onCapture,
}: {
  projectId: string;
  onClose: () => void;
  onCapture: () => void;
}) {
  const { items, projects, projectById, assignToProject } = useForage();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [src, setSrc] = useState('recent');
  const project = projectById(projectId);

  const pool = useMemo(() => {
    const live = items.filter((i) => !i.deletedAt && !(project && itemInProject(i, project)));
    if (src === 'unfiltered') return live.filter((i) => !projects.some((p) => itemInProject(i, p)));
    if (src !== 'recent') {
      const p = projects.find((pr) => pr.id === src);
      return p ? live.filter((i) => itemInProject(i, p)) : [];
    }
    return [...live].sort((a, b) => b.createdAt - a.createdAt).slice(0, 80);
  }, [items, projects, project, src]);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = () => {
    picked.forEach((id) => assignToProject(id, projectId));
    toast(`Added ${picked.size} to ${project?.name ?? 'collection'}`);
    onClose();
  };

  const sources = [
    { id: 'recent', label: 'Recently added' },
    { id: 'unfiltered', label: 'Unfiltered' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="relative flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-elevated"
          style={{ boxShadow: 'var(--shadow-pop)' }}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-[14px] font-semibold">
              Add to {project?.name ?? 'collection'}
            </p>
            <button onClick={onClose} className="text-muted hover:text-ink">
              <Close size={16} />
            </button>
          </div>

          {/* source selector */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5">
            {sources.map((s) => (
              <button
                key={s.id}
                onClick={() => setSrc(s.id)}
                className={`rounded-full px-3 py-1 text-[12.5px] transition ${
                  src === s.id ? 'bg-ink text-accent-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
            {projects
              .filter((p) => p.id !== projectId)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSrc(p.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] transition ${
                    src === p.id ? 'bg-ink text-accent-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: p.color }} /> {p.name}
                </button>
              ))}
          </div>

          {/* grid */}
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {pool.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <p className="text-[13px] text-faint">Nothing here to add.</p>
                <button
                  onClick={onCapture}
                  className="mt-4 flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-accent-ink transition hover:opacity-90"
                >
                  <Camera size={15} /> Capture something new
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {pool.map((i) => {
                  const on = picked.has(i.id);
                  return (
                    <button
                      key={i.id}
                      onClick={() => toggle(i.id)}
                      title={i.title}
                      className={`relative aspect-square overflow-hidden rounded-lg border bg-surface-2 transition ${
                        on ? 'border-ink ring-2 ring-ink' : 'border-border hover:-translate-y-0.5'
                      }`}
                    >
                      <TilePreview item={i} />
                      {on && (
                        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-accent-ink">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <button
              onClick={onCapture}
              className="flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
            >
              <Camera size={14} /> Capture new
            </button>
            <button
              onClick={add}
              disabled={picked.size === 0}
              className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-accent-ink transition hover:opacity-90 disabled:opacity-40"
            >
              <Check size={15} /> Add{picked.size ? ` ${picked.size}` : ''}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
