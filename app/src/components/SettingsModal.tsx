import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../lib/theme';
import { useForage } from '../lib/store';
import type { FilterEntry } from '../types';
import {
  Camera,
  Close,
  Database,
  Download,
  Filter,
  Hash,
  Info,
  LibraryIcon,
  Palette,
  Plus,
  Sparkle,
  User,
  Volume2,
} from './icons';

const NAV = [
  { id: 'account', label: 'Account', icon: <User size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'filters', label: 'Filters', icon: <Filter size={16} /> },
  { id: 'libraries', label: 'Libraries', icon: <LibraryIcon size={16} /> },
  { id: 'ai', label: 'AI Usage', icon: <Sparkle size={16} /> },
  { id: 'tags', label: 'Tags', icon: <Hash size={16} /> },
  { id: 'capture', label: 'Capture', icon: <Camera size={16} /> },
  { id: 'sound', label: 'Sound', icon: <Volume2 size={16} /> },
  { id: 'updates', label: 'Updates', icon: <Download size={16} /> },
  { id: 'data', label: 'Data', icon: <Database size={16} /> },
  { id: 'about', label: 'About', icon: <Info size={16} /> },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors"
      style={{ background: on ? 'var(--ink)' : 'var(--border-strong)' }}
    >
      <motion.span
        className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white"
        animate={{ left: on ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  );
}

function ManagedList({
  title,
  hint,
  entries,
  onToggle,
  onRemove,
  onAdd,
  placeholder,
}: {
  title: string;
  hint: string;
  entries: FilterEntry[];
  onToggle: (v: string) => void;
  onRemove: (v: string) => void;
  onAdd: (label: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    if (draft.trim()) {
      onAdd(draft);
      setDraft('');
    }
  };
  return (
    <section className="mb-8">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        <span className="text-[12px] text-faint">{entries.filter((e) => e.enabled).length} shown</span>
      </div>
      <p className="mb-3 text-[12.5px] text-muted">{hint}</p>
      <div className="overflow-hidden rounded-xl border border-border">
        {entries.length === 0 && (
          <p className="px-3 py-4 text-[13px] text-faint">None yet — add one below.</p>
        )}
        {entries.map((e, i) => (
          <div
            key={e.value}
            className={`flex items-center gap-3 px-3 py-2 ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <span className={`flex-1 text-[13.5px] ${e.enabled ? 'text-ink' : 'text-faint line-through'}`}>
              {e.label}
            </span>
            <Toggle on={e.enabled} onClick={() => onToggle(e.value)} />
            <button
              onClick={() => onRemove(e.value)}
              className="grid h-7 w-7 place-items-center rounded-md text-faint transition hover:bg-surface-2 hover:text-ink"
              title="Remove"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-ink outline-none placeholder:text-faint focus:border-border-strong"
        />
        <button
          onClick={submit}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium text-accent-ink"
          style={{ background: 'var(--ink)' }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </section>
  );
}

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
  const {
    fileTypes,
    sources,
    addFileType,
    removeFileType,
    toggleFileType,
    addSource,
    removeSource,
    toggleSource,
  } = useForage();

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

              {active === 'filters' ? (
                <>
                  <h2 className="text-[24px] font-semibold tracking-tight">Filters</h2>
                  <p className="mt-2 mb-6 max-w-md text-[13.5px] text-muted">
                    Choose which file types and sources appear in the Library filter menus. Toggle to
                    hide, remove to delete, or add your own.
                  </p>
                  <ManagedList
                    title="File types"
                    hint="The asset types you collect."
                    entries={fileTypes}
                    onToggle={toggleFileType}
                    onRemove={removeFileType}
                    onAdd={addFileType}
                    placeholder="Add a file type (e.g. Audio)"
                  />
                  <ManagedList
                    title="Sources"
                    hint="Where your saves come from. New sources are added automatically as you forage."
                    entries={sources}
                    onToggle={toggleSource}
                    onRemove={removeSource}
                    onAdd={addSource}
                    placeholder="Add a source (e.g. behance.net)"
                  />
                </>
              ) : active === 'appearance' ? (
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
