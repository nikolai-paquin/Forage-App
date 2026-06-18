import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Item } from '../types';
import { Basket, Grid, Home, Layers, Moon, Plus, Search, Sparkle, Sun } from './icons';

interface Cmd {
  id: string;
  group: string;
  label: string;
  sub?: string;
  icon: ReactNode;
  thumb?: string;
  keywords: string;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onOpenItem,
  onCapture,
}: {
  open: boolean;
  onClose: () => void;
  onOpenItem: (i: Item) => void;
  onCapture: () => void;
}) {
  const { items, projects, storyboards, setView } = useForage();
  const { dark, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const go = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const commands = useMemo<Cmd[]>(() => {
    const list: Cmd[] = [
      {
        id: 'a-capture',
        group: 'Actions',
        label: 'Forage something new',
        icon: <Plus width={16} height={16} />,
        keywords: 'add new capture forage save link image',
        run: go(onCapture),
      },
      {
        id: 'a-theme',
        group: 'Actions',
        label: dark ? 'Switch to light' : 'Switch to dark',
        icon: dark ? <Sun width={16} height={16} /> : <Moon width={16} height={16} />,
        keywords: 'theme dark light mode appearance',
        run: go(toggle),
      },
      {
        id: 'n-home',
        group: 'Go to',
        label: 'Home',
        icon: <Home width={16} height={16} />,
        keywords: 'home dashboard start',
        run: go(() => setView({ kind: 'home' })),
      },
      {
        id: 'n-library',
        group: 'Go to',
        label: 'Library',
        icon: <Grid width={16} height={16} />,
        keywords: 'library everything all grid',
        run: go(() => setView({ kind: 'library' })),
      },
      {
        id: 'n-basket',
        group: 'Go to',
        label: 'Basket',
        icon: <Basket width={16} height={16} />,
        keywords: 'basket inbox unsorted',
        run: go(() => setView({ kind: 'basket' })),
      },
      ...projects.map((p) => ({
        id: `p-${p.id}`,
        group: 'Projects',
        label: p.name,
        sub: p.brief,
        icon: (
          <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
        ),
        keywords: `project ${p.name} ${p.brief}`,
        run: go(() => setView({ kind: 'project', projectId: p.id })),
      })),
      ...storyboards.map((s) => ({
        id: `s-${s.id}`,
        group: 'Storyboards',
        label: s.title,
        icon: <Layers width={16} height={16} />,
        keywords: `storyboard sequence ${s.title}`,
        run: go(() => setView({ kind: 'storyboard', storyboardId: s.id })),
      })),
      ...items.map((it) => ({
        id: `i-${it.id}`,
        group: 'Finds',
        label: it.title,
        sub: it.source,
        icon: <Sparkle width={16} height={16} />,
        thumb: it.type === 'video' ? it.poster : it.media,
        keywords: `${it.title} ${it.source ?? ''} ${it.tags.join(' ')}`,
        run: go(() => onOpenItem(it)),
      })),
    ];
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, projects, storyboards, dark]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Curated default: actions + nav + projects + a few recent finds.
      const base = commands.filter((c) => c.group !== 'Finds');
      const finds = commands.filter((c) => c.group === 'Finds').slice(0, 4);
      return [...base, ...finds];
    }
    return commands
      .filter((c) => (c.label + ' ' + c.keywords).toLowerCase().includes(q))
      .slice(0, 24);
  }, [commands, query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    document.getElementById(`cmd-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastGroup = '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onKeyDown={onKey}
            className="glass relative w-full max-w-xl overflow-hidden rounded-2xl"
            style={{ boxShadow: 'var(--shadow-pop)' }}
          >
            <div className="noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light" />
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <Search width={17} height={17} className="text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search finds, projects, actions…"
                className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
              />
              <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-faint">
                ESC
              </span>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-auto p-1.5">
              {results.length === 0 && (
                <p className="px-3 py-8 text-center text-[13px] text-muted">No matches.</p>
              )}
              {results.map((c, i) => {
                const showGroup = c.group !== lastGroup;
                lastGroup = c.group;
                return (
                  <div key={c.id}>
                    {showGroup && (
                      <p className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-medium uppercase tracking-wider text-faint">
                        {c.group}
                      </p>
                    )}
                    <button
                      id={`cmd-${i}`}
                      onMouseMove={() => setActive(i)}
                      onClick={() => c.run()}
                      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                        i === active ? 'bg-accent text-accent-ink' : 'text-ink'
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg ${
                          i === active ? 'bg-black/10' : 'bg-surface-2'
                        }`}
                      >
                        {c.thumb ? (
                          <img src={c.thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          c.icon
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px]">{c.label}</span>
                        {c.sub && (
                          <span
                            className={`block truncate text-[11.5px] ${
                              i === active ? 'text-accent-ink/70' : 'text-faint'
                            }`}
                          >
                            {c.sub}
                          </span>
                        )}
                      </span>
                      {i === active && <span className="text-[11px] opacity-70">↵</span>}
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
