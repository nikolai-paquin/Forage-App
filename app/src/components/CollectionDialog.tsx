import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import { Folder, Hash } from './icons';

export function CollectionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createProject } = useForage();
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setTags('');
      setTimeout(() => nameRef.current?.focus(), 40);
    }
  }, [open]);

  const create = () => {
    if (!name.trim()) return;
    const autoTags = tags
      .split(/[,\n]/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);
    createProject(name, autoTags);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-strong bg-elevated"
            style={{ boxShadow: 'var(--shadow-pop)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) create();
              if (e.key === 'Escape') onClose();
            }}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Folder size={15} className="text-muted" />
              <p className="text-[14px] font-semibold text-ink">New collection</p>
            </div>

            <div className="flex flex-col gap-4 p-4">
              <div>
                <label className="mb-1.5 block text-[12px] text-muted">Name</label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) create();
                  }}
                  placeholder="e.g. Game art references"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] text-muted">
                  <Hash size={12} /> Auto-tags <span className="text-faint">(optional)</span>
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="pixel-art, isometric, ui"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
                />
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-faint">
                  Any save tagged with one of these is gathered into this collection automatically —
                  on top of anything you add by hand.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-border px-4 py-2.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={create}
                disabled={!name.trim()}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-accent-ink disabled:opacity-40"
                style={{ background: 'var(--ink)' }}
              >
                Create
                <span className="rounded bg-black/15 px-1 text-[10px] opacity-80">⌘↵</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
