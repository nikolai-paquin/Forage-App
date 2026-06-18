import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { COLOR_SWATCHES, matchColor } from '../lib/color';
import { Folder, Search } from './icons';

const thumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

export function SearchOverlay({
  open,
  onClose,
  onOpenItem,
}: {
  open: boolean;
  onClose: () => void;
  onOpenItem: (i: Item) => void;
}) {
  const { items, projects, setView } = useForage();
  const [q, setQ] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setColor(null);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const query = q.trim().toLowerCase();
  const active = !!query || !!color;
  const itemHits = useMemo(() => {
    if (!active) return [];
    let hits = items.filter((it) => !it.deletedAt);
    if (query)
      hits = hits.filter((it) => [it.title, it.source, ...it.tags].join(' ').toLowerCase().includes(query));
    if (color) hits = hits.filter((it) => matchColor(it.palette, color));
    return hits.slice(0, 10);
  }, [items, query, color, active]);
  const collHits = useMemo(
    () => (query ? projects.filter((p) => p.name.toLowerCase().includes(query)) : []),
    [projects, query],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 440, damping: 32 }}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-elevated"
            style={{ boxShadow: 'var(--shadow-pop)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Search size={18} className="text-faint" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search collections, tags, saves…"
                className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
              />
              <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-faint">
                esc
              </span>
            </div>

            <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
              <span className="mr-1 text-[11px] text-faint">Color</span>
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c.word}
                  onClick={() => setColor(color === c.word ? null : c.word)}
                  title={c.word}
                  className={`h-5 w-5 rounded-full border transition ${
                    color === c.word
                      ? 'border-transparent ring-2 ring-[var(--ink)]'
                      : 'border-border hover:scale-110'
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>

            <div className="max-h-[52vh] overflow-auto border-t border-border">
              {!active && (
                <p className="px-4 py-8 text-center text-[13px] text-faint">Start typing, or pick a color…</p>
              )}
              {active && collHits.length === 0 && itemHits.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px] text-faint">No matches.</p>
              )}
              {collHits.length > 0 && (
                <div className="p-1.5">
                  <p className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-medium uppercase tracking-wider text-faint">
                    Collections
                  </p>
                  {collHits.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setView({ kind: 'collection', id: p.id });
                        onClose();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-ink transition hover:bg-surface-2"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
                        <Folder size={15} />
                      </span>
                      <span className="text-[13.5px]">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {itemHits.length > 0 && (
                <div className="p-1.5">
                  <p className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-medium uppercase tracking-wider text-faint">
                    Saves
                  </p>
                  {itemHits.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => {
                        onOpenItem(it);
                        onClose();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-ink transition hover:bg-surface-2"
                    >
                      <span className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        {thumb(it) && (
                          <img src={thumb(it)} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px]">{it.title}</span>
                        {it.source && (
                          <span className="block truncate text-[11.5px] text-faint">{it.source}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
