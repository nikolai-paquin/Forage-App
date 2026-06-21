import { AnimatePresence, motion } from 'framer-motion';
import { Close, Keyboard } from './icons';

interface Shortcut {
  keys: string[];
  label: string;
}
interface Group {
  title: string;
  items: Shortcut[];
}

const GROUPS: Group[] = [
  {
    title: 'General',
    items: [
      { keys: ['⌘', 'K'], label: 'Search & commands' },
      { keys: ['⌘', 'N'], label: 'Add a save' },
      { keys: ['?'], label: 'This shortcuts list' },
      { keys: ['Esc'], label: 'Close dialog or overlay' },
    ],
  },
  {
    title: 'Library grid',
    items: [
      { keys: ['←', '→', '↑', '↓'], label: 'Move focus between saves' },
      { keys: ['H', 'J', 'K', 'L'], label: 'Move focus (vim keys)' },
      { keys: ['Enter'], label: 'Open the focused save' },
      { keys: ['X', 'Space'], label: 'Select / deselect the focused save' },
    ],
  },
  {
    title: 'Viewer',
    items: [
      { keys: ['←', '→'], label: 'Previous / next save' },
      { keys: ['Esc'], label: 'Close the viewer' },
    ],
  },
  {
    title: 'Dialogs & moodboards',
    items: [
      { keys: ['⌘', 'Enter'], label: 'Save / submit a dialog' },
      { keys: ['Delete', 'Backspace'], label: 'Remove a selected drawing' },
    ],
  },
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] flex items-start justify-center px-4 pt-[12vh]"
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
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border-strong bg-elevated"
            style={{ boxShadow: 'var(--shadow-pop)' }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Keyboard size={16} /> Keyboard shortcuts
              </p>
              <button onClick={onClose} className="text-muted hover:text-ink">
                <Close size={16} />
              </button>
            </div>

            <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
                    {g.title}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {g.items.map((s) => (
                      <div key={s.label} className="flex items-center justify-between gap-3">
                        <span className="text-[13px] text-muted">{s.label}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {s.keys.map((k) => (
                            <kbd
                              key={k}
                              className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-surface px-1.5 font-mono text-[11px] text-ink"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
