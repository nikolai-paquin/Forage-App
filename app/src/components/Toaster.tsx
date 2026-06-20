import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onToast } from '../lib/toast';
import { playAction } from '../lib/sound';
import { CheckCircle2, RotateCcw } from './icons';

interface Toast {
  id: number;
  message: string;
  undo?: () => void;
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let n = 0;
    return onToast((message, opts) => {
      const id = ++n;
      playAction();
      setToasts((prev) => [...prev, { id, message, undo: opts?.undo }]);
      // Undo toasts linger so there's time to click; plain ones are brief.
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), opts?.undo ? 6000 : 2600);
    });
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[70] flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 460, damping: 32 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 py-2 pl-3.5 pr-2 text-[13px] font-medium text-white"
            style={{ background: '#1b1c1f', boxShadow: 'var(--shadow-pop)' }}
          >
            <CheckCircle2 size={15} className="text-[#86b56a]" />
            <span className="pr-1">{t.message}</span>
            {t.undo && (
              <button
                onClick={() => {
                  t.undo?.();
                  dismiss(t.id);
                }}
                className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white transition hover:bg-white/20"
              >
                <RotateCcw size={12} /> Undo
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
