import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from './icons';

export interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export function FilterMenu({
  icon,
  options,
  value,
  onChange,
  neutral = false,
}: {
  icon?: React.ReactNode;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  neutral?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={current.label}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] transition sm:px-3 ${
          value !== 'all' && !neutral
            ? 'border-border-strong bg-surface-2 text-ink'
            : 'border-border bg-surface text-muted hover:text-ink'
        }`}
      >
        {icon}
        {/* phones: icon only (the active style flags a non-default filter);
            labels + chevron appear from sm up */}
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={14} className="hidden text-faint sm:block" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full z-40 mt-1.5 max-h-72 w-52 overflow-auto rounded-xl border border-border bg-elevated p-1.5"
            style={{ boxShadow: 'var(--shadow-pop)' }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition hover:bg-surface-2 ${
                  o.value === value ? 'text-ink' : 'text-muted'
                }`}
              >
                <span className="grid w-4 place-items-center text-faint">{o.icon}</span>
                <span className="flex-1">{o.label}</span>
                {o.value === value && (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ink)' }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
