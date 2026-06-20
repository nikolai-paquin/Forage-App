import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FontIcon, Palette, Plus, Upload } from './icons';

interface FabProps {
  onClick: () => void;
  onNewPalette: () => void;
  onNewFont: () => void;
}

const ACTIONS = (p: FabProps) => [
  { label: 'Add a save', icon: <Upload size={16} />, run: p.onClick },
  { label: 'New palette', icon: <Palette size={16} />, run: p.onNewPalette },
  { label: 'New font', icon: <FontIcon size={16} />, run: p.onNewFont },
];

export function Fab(props: FabProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2.5">
      <AnimatePresence>
        {open && (
          <>
            <button
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 -z-10 cursor-default"
            />
            {ACTIONS(props).map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => {
                  setOpen(false);
                  a.run();
                }}
                className="flex items-center gap-2 rounded-full border border-border bg-elevated py-2 pl-3 pr-3.5 text-[13px] font-medium text-ink"
                style={{ boxShadow: 'var(--shadow-pop)' }}
              >
                <span className="text-muted">{a.icon}</span>
                {a.label}
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Add to Forage (⌘N)"
        className="grid h-14 w-14 place-items-center rounded-full text-accent-ink"
        style={{ background: 'var(--ink)', boxShadow: 'var(--shadow-pop)' }}
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }}>
          <Plus size={24} />
        </motion.span>
      </motion.button>
    </div>
  );
}
