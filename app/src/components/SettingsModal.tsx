import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../lib/theme';
import {
  Camera,
  Close,
  Database,
  Download,
  Hash,
  Info,
  LibraryIcon,
  Palette,
  Sparkle,
  User,
  Volume2,
} from './icons';

const NAV = [
  { id: 'account', label: 'Account', icon: <User size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'libraries', label: 'Libraries', icon: <LibraryIcon size={16} /> },
  { id: 'ai', label: 'AI Usage', icon: <Sparkle size={16} /> },
  { id: 'tags', label: 'Tags', icon: <Hash size={16} /> },
  { id: 'capture', label: 'Capture', icon: <Camera size={16} /> },
  { id: 'sound', label: 'Sound', icon: <Volume2 size={16} /> },
  { id: 'updates', label: 'Updates', icon: <Download size={16} /> },
  { id: 'data', label: 'Data', icon: <Database size={16} /> },
  { id: 'about', label: 'About', icon: <Info size={16} /> },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 text-[14px]">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState('account');
  const { dark, toggle } = useTheme();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="relative grid h-[560px] w-full max-w-3xl grid-cols-[220px_1fr] overflow-hidden rounded-2xl border border-border bg-elevated"
            style={{ boxShadow: 'var(--shadow-pop)' }}
          >
            {/* left nav */}
            <div className="border-r border-border bg-surface p-3">
              <p className="px-2.5 pb-2 pt-1 text-[12px] font-semibold uppercase tracking-wider text-faint">
                Settings
              </p>
              <div className="flex flex-col gap-0.5">
                {NAV.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setActive(n.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] transition ${
                      active === n.id ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {n.icon}
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* content */}
            <div className="relative overflow-auto p-7">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <Close size={16} />
              </button>

              {active === 'appearance' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Appearance</h2>
                  <div className="mt-6 flex items-center justify-between border-b border-border py-3 text-[14px]">
                    <span className="text-muted">Theme</span>
                    <button
                      onClick={toggle}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-ink"
                    >
                      {dark ? 'Dark' : 'Light'}
                    </button>
                  </div>
                </>
              ) : active === 'account' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Account</h2>
                  <div className="mt-6">
                    <Row label="Plan" value="Free trial" />
                    <Row label="Trial" value="14 days left" />
                  </div>
                  <div className="mt-6 flex items-start gap-2 text-[13.5px] text-muted">
                    <Info size={16} className="mt-0.5 shrink-0" />
                    <p>
                      You're signed out. Sign back in to sync your AI usage and manage your
                      subscription. Your library stays on this Mac either way.
                    </p>
                  </div>
                  <button
                    className="mt-5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
                    style={{ background: 'var(--ink)' }}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight capitalize">{active}</h2>
                  <p className="mt-3 text-[14px] text-muted">Coming soon.</p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
