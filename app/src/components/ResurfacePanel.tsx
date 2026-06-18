import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { Clock, Compass } from './icons';
import { timeAgo } from '../lib/util';

const thumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

export function ResurfacePanel({
  open,
  onClose,
  onOpenItem,
}: {
  open: boolean;
  onClose: () => void;
  onOpenItem: (i: Item) => void;
}) {
  const { resurfaceList, markSeen, projectById } = useForage();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 440, damping: 32 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-elevated"
            style={{ boxShadow: 'var(--shadow-pop)' }}
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
              <Compass size={17} className="text-ink" />
              <div>
                <p className="text-[14px] font-semibold text-ink">Resurface</p>
                <p className="text-[12px] text-muted">Things worth a second look.</p>
              </div>
            </div>

            <div className="max-h-[56vh] overflow-auto p-1.5">
              {resurfaceList.length === 0 && (
                <p className="px-3 py-8 text-center text-[13px] text-faint">Nothing to resurface yet.</p>
              )}
              {resurfaceList.map((it) => {
                const proj = it.projectIds.map((p) => projectById(p)?.name).filter(Boolean)[0];
                return (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-surface-2"
                  >
                    <button
                      onClick={() => {
                        onOpenItem(it);
                        onClose();
                      }}
                      className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2"
                    >
                      {thumb(it) && <img src={thumb(it)} alt="" className="h-full w-full object-cover" />}
                    </button>
                    <button
                      onClick={() => {
                        onOpenItem(it);
                        onClose();
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-[13.5px] text-ink">{it.title}</span>
                      <span className="flex items-center gap-1 text-[11.5px] text-faint">
                        <Clock size={11} /> last seen {timeAgo(it.lastSeenAt)}
                        {proj ? ` · ${proj}` : ''}
                      </span>
                    </button>
                    <button
                      onClick={() => markSeen(it.id)}
                      className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[12px] text-muted transition hover:text-ink"
                      title="Mark as seen so it stops resurfacing"
                    >
                      Tuck away
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
