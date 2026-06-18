import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePwaInstall } from '../lib/pwa';
import { Camera, Command, Download, Search, Sparkle } from './icons';

const SEEN_KEY = 'forage.onboarded.v1';

const TIPS = [
  {
    icon: <Camera size={16} />,
    title: 'Capture anything',
    body: 'Paste a URL or image, drag files onto the window, or use the browser extension and mobile share sheet.',
  },
  {
    icon: <Command size={16} />,
    title: 'Command palette',
    body: 'Press ⌘K to search every save by title, note, tag, or text — and jump anywhere or run a command.',
  },
  {
    icon: <Sparkle size={16} />,
    title: 'Make it make sense',
    body: 'Auto-tag saves, group them into collections, and arrange them freely on infinite Spaces.',
  },
];

/** First-run welcome. Shows once, then never again (localStorage flag). */
export function Onboarding({ onCapture }: { onCapture: () => void }) {
  const [open, setOpen] = useState(false);
  const { canInstall, promptInstall } = usePwaInstall();

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={dismiss} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-elevated p-7"
            style={{ boxShadow: 'var(--shadow-pop)' }}
          >
            <div className="mb-1 flex items-center gap-2 text-faint">
              <Search size={16} />
              <span className="text-[12px] font-medium uppercase tracking-wider">Welcome to Forage</span>
            </div>
            <h2 className="text-[24px] font-semibold tracking-tight text-ink">
              Gather what inspires you.
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
              Forage keeps your collected images, links, and ideas in one calm place — and helps you
              find them when they matter. Here’s the gist:
            </p>

            <div className="mt-5 flex flex-col gap-3.5">
              {TIPS.map((t) => (
                <div key={t.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink">
                    {t.icon}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-medium text-ink">{t.title}</p>
                    <p className="text-[12.5px] leading-relaxed text-muted">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <button
                onClick={() => {
                  dismiss();
                  onCapture();
                }}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
                style={{ background: 'var(--ink)' }}
              >
                <Camera size={14} /> Make your first save
              </button>
              {canInstall && (
                <button
                  onClick={() => {
                    promptInstall();
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-surface-2"
                >
                  <Download size={14} /> Install app
                </button>
              )}
              <button
                onClick={dismiss}
                className="ml-auto text-[13px] text-muted transition hover:text-ink"
              >
                Skip
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
