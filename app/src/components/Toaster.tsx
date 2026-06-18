import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onToast } from '../lib/toast';
import { CheckCircle2 } from './icons';

interface Toast {
  id: number;
  message: string;
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let n = 0;
    return onToast((message) => {
      const id = ++n;
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
    });
  }, []);

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
            className="flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-2 text-[13px] font-medium text-white"
            style={{ background: '#1b1c1f', boxShadow: 'var(--shadow-pop)' }}
          >
            <CheckCircle2 size={15} className="text-[#86b56a]" />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
