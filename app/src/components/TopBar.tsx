import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { View } from '../types';
import {
  ChevronsUpDown,
  Compass,
  Film,
  Frame,
  Grid,
  LibraryIcon,
  Moon,
  Search,
  Settings,
  Sun,
} from './icons';

type Mode = 'library' | 'collections' | 'moodboards' | 'storyboards';

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
  { id: 'library', label: 'Library', icon: <LibraryIcon size={15} /> },
  { id: 'collections', label: 'Collections', icon: <Grid size={15} /> },
  { id: 'moodboards', label: 'Moodboards', icon: <Frame size={15} /> },
  { id: 'storyboards', label: 'Storyboards', icon: <Film size={15} /> },
];

function modeOf(view: View): Mode {
  if (view.kind === 'collections' || view.kind === 'collection') return 'collections';
  if (view.kind === 'spaces' || view.kind === 'space') return 'moodboards';
  if (view.kind === 'storyboards' || view.kind === 'storyboard') return 'storyboards';
  return 'library';
}

export function TopBar({
  onSearch,
  onSettings,
  onResurface,
}: {
  onSearch: () => void;
  onSettings: () => void;
  onResurface: () => void;
}) {
  const { view, setView } = useForage();
  const { dark, toggle } = useTheme();
  const active = modeOf(view);

  const goto = (m: Mode) => {
    if (m === 'library') setView({ kind: 'library', tab: 'all' });
    else if (m === 'collections') setView({ kind: 'collections' });
    else if (m === 'moodboards') setView({ kind: 'spaces' });
    else setView({ kind: 'storyboards' });
  };

  const iconBtn =
    'grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink';

  return (
    <header
      data-tauri-drag-region
      className="topbar flex items-center justify-between px-5 py-3.5"
    >
      {/* Left: workspace */}
      <div className="topbar-left flex w-[220px] items-center gap-2.5">
        <span
          className="grid h-8 w-8 place-items-center rounded-[9px] text-accent-ink"
          style={{ background: 'var(--ink)' }}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
            <path d="M12 3c0 5-2.4 7.6-6 9 3.6 1.4 6 4 6 9 0-5 2.4-7.6 6-9-3.6-1.4-6-4-6-9Z" />
          </svg>
        </span>
        <button className="flex items-center gap-1 text-[15px] font-medium tracking-tight text-ink">
          Library
          <ChevronsUpDown size={14} className="text-faint" />
        </button>
      </div>

      {/* Center: segmented pill */}
      <nav
        className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-1"
        style={{ boxShadow: 'var(--shadow-bar)' }}
      >
        {MODES.map((m) => {
          const isActive = active === m.id;
          return (
            <button
              key={m.id}
              onClick={() => goto(m.id)}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors ${
                isActive ? 'text-accent-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 -z-0 rounded-full"
                  style={{ background: 'var(--ink)' }}
                  transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                />
              )}
              {isActive && <span className="relative z-[1]">{m.icon}</span>}
              <span className="relative z-[1]">{m.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: search + actions */}
      <div className="flex w-[220px] items-center justify-end gap-1">
        <button
          onClick={onSearch}
          className="mr-1 flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-3 pr-2 text-[13px] text-muted transition hover:text-ink"
        >
          <Search size={14} />
          Search
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-faint">
            ⌘K
          </span>
        </button>
        <button onClick={onResurface} className={iconBtn} title="Resurface">
          <Compass size={18} />
        </button>
        <button onClick={toggle} className={iconBtn} title="Theme">
          <motion.span
            key={dark ? 'm' : 's'}
            initial={{ rotate: -30, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="inline-flex"
          >
            {dark ? <Moon size={18} /> : <Sun size={18} />}
          </motion.span>
        </button>
        <button onClick={onSettings} className={iconBtn} title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
