import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import { toast } from '../lib/toast';
import { Close, Folder, Plus, Trash2 } from './icons';
import type { Item } from '../types';

export function BulkBar() {
  const {
    selectedIds,
    projects,
    itemById,
    clearSelection,
    assignSelectedTo,
    deleteSelectedForever,
    reinsertItem,
  } = useForage();
  const [menu, setMenu] = useState(false);

  const n = selectedIds.length;

  const deleteSelected = () => {
    const removed = selectedIds.map(itemById).filter(Boolean) as Item[];
    deleteSelectedForever();
    toast(`Deleted ${removed.length} save${removed.length > 1 ? 's' : ''}`, {
      undo: () => removed.forEach((it) => reinsertItem(it)),
    });
  };

  const btn =
    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-white/90 transition hover:bg-white/10';

  return (
    <AnimatePresence>
      {n > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="fixed bottom-6 left-1/2 z-40 flex items-center gap-1 rounded-full border border-white/10 px-2 py-1.5 text-white"
          style={{ background: '#1b1c1f', boxShadow: 'var(--shadow-pop)' }}
        >
          <span className="px-2.5 text-[13px] font-semibold tabular-nums">{n} selected</span>
          <span className="mx-1 h-5 w-px bg-white/15" />

          {
            <>
              <div className="relative">
                <button onClick={() => setMenu((v) => !v)} className={btn}>
                  <Folder size={15} /> Add to collection
                </button>
                <AnimatePresence>
                  {menu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute bottom-full left-0 mb-2 max-h-64 w-52 overflow-auto rounded-xl border border-white/10 bg-[#1b1c1f] p-1.5"
                      style={{ boxShadow: 'var(--shadow-pop)' }}
                    >
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            const c = n;
                            assignSelectedTo(p.id);
                            setMenu(false);
                            toast(`Added ${c} to ${p.name}`);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-white/85 transition hover:bg-white/10"
                        >
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                          {p.name}
                        </button>
                      ))}
                      <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-white/55 transition hover:bg-white/10">
                        <Plus size={14} /> New collection
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={deleteSelected} className={btn}>
                <Trash2 size={15} /> Delete
              </button>
            </>
          }

          <span className="mx-1 h-5 w-px bg-white/15" />
          <button
            onClick={clearSelection}
            className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10"
            title="Clear selection"
          >
            <Close size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
