import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item } from '../types';
import { COLOR_SWATCHES, matchColor } from '../lib/color';
import { aiEnabled } from '../lib/ai';
import { semanticSearch, type SemanticHit } from '../lib/semantic';
import {
  Bookmark,
  Camera,
  Clock,
  CornerDownLeft,
  Database,
  Folder,
  Film,
  Layers,
  LibraryIcon,
  Moon,
  Search,
  Settings,
  Sun,
} from './icons';

const thumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

/** A runnable command. `keywords` widen what the query matches against. */
interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
}

export interface PaletteActions {
  capture: () => void;
  settings: () => void;
  resurface: () => void;
  exportBackup: () => void;
  toggleTheme: () => void;
  newSpace: () => void;
}

export function SearchOverlay({
  open,
  onClose,
  onOpenItem,
  actions,
  dark,
}: {
  open: boolean;
  onClose: () => void;
  onOpenItem: (i: Item) => void;
  actions: PaletteActions;
  dark: boolean;
}) {
  const { items, projects, setView } = useForage();
  const [q, setQ] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setColor(null);
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const query = q.trim().toLowerCase();

  const go = (v: Parameters<typeof setView>[0]) => () => {
    setView(v);
    onClose();
  };
  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const commands = useMemo<Command[]>(
    () => [
      { id: 'capture', label: 'New capture', hint: '⌘N', icon: <Camera size={15} />, keywords: 'add save create forage new', run: act(actions.capture) },
      { id: 'lib', label: 'Go to Library', icon: <LibraryIcon size={15} />, keywords: 'all home', run: go({ kind: 'library', tab: 'all' }) },
      { id: 'bookmarks', label: 'Go to Bookmarks', icon: <Bookmark size={15} />, run: go({ kind: 'library', tab: 'bookmarks' }) },
      { id: 'collections', label: 'Go to Collections', icon: <Folder size={15} />, keywords: 'projects', run: go({ kind: 'collections' }) },
      { id: 'spaces', label: 'Go to Moodboards', icon: <Layers size={15} />, keywords: 'canvas board space', run: go({ kind: 'spaces' }) },
      { id: 'newspace', label: 'New moodboard', icon: <Layers size={15} />, keywords: 'canvas board space create', run: act(actions.newSpace) },
      { id: 'storyboards', label: 'Go to Storyboards', icon: <Film size={15} />, keywords: 'frames sequence', run: go({ kind: 'storyboards' }) },
      { id: 'resurface', label: 'Resurface saves', icon: <Clock size={15} />, keywords: 'rediscover old', run: act(actions.resurface) },
      { id: 'theme', label: dark ? 'Switch to light theme' : 'Switch to dark theme', icon: dark ? <Sun size={15} /> : <Moon size={15} />, keywords: 'dark light appearance', run: act(actions.toggleTheme) },
      { id: 'export', label: 'Export backup', icon: <Database size={15} />, keywords: 'download json save data', run: act(actions.exportBackup) },
      { id: 'settings', label: 'Open settings', icon: <Settings size={15} />, keywords: 'preferences', run: act(actions.settings) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actions, dark],
  );

  const cmdHits = useMemo(() => {
    if (color) return [];
    if (!query) return commands.slice(0, 6); // default palette
    return commands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(query));
  }, [commands, query, color]);

  const collHits = useMemo(
    () => (query && !color ? projects.filter((p) => p.name.toLowerCase().includes(query)) : []),
    [projects, query, color],
  );

  // Semantic ("find by vibe") results, when an AI endpoint is configured. Debounced;
  // keyword results show instantly and semantic refines/extends them.
  const [semantic, setSemantic] = useState<SemanticHit[]>([]);
  const semanticOn = aiEnabled();
  useEffect(() => {
    if (!open || !semanticOn || !query.trim()) {
      setSemantic([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const hits = await semanticSearch(query, items, { limit: 12 });
      if (!cancelled) setSemantic(hits);
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open, semanticOn, items]);

  const itemHits = useMemo(() => {
    if (!query && !color) return [];
    const live = items.filter((it) => !it.deletedAt);
    const colorOk = (it: Item) => !color || matchColor(it.palette, color);
    const keywordOk = (it: Item) =>
      !query ||
      [it.title, it.source, it.note, it.summary, it.url, it.code, it.ai?.prompt, ...it.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);

    if (semantic.length) {
      const byId = new Map(live.map((it) => [it.id, it]));
      const seen = new Set<string>();
      const out: Item[] = [];
      for (const h of semantic) {
        const it = byId.get(h.id);
        if (it && colorOk(it)) {
          out.push(it);
          seen.add(it.id);
        }
      }
      for (const it of live) if (!seen.has(it.id) && colorOk(it) && keywordOk(it)) out.push(it);
      return out.slice(0, 12);
    }
    return live.filter((it) => colorOk(it) && keywordOk(it)).slice(0, 12);
  }, [items, query, color, semantic]);

  // Flat list of runnable rows, in render order — drives keyboard navigation.
  const flat = useMemo(
    () => [
      ...cmdHits.map((c) => ({ kind: 'command' as const, run: c.run })),
      ...collHits.map((p) => ({ kind: 'collection' as const, run: go({ kind: 'collection', id: p.id }) })),
      ...itemHits.map((it) => ({ kind: 'item' as const, run: () => { onOpenItem(it); onClose(); } })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cmdHits, collHits, itemHits],
  );

  useEffect(() => setSel(0), [q, color]);
  useEffect(() => {
    listRef.current?.querySelector('[data-sel="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flat[sel]?.run();
    }
  };

  // running offsets so each section knows its position in the flat list
  const collOffset = cmdHits.length;
  const itemOffset = cmdHits.length + collHits.length;
  const empty = flat.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 440, damping: 32 }}
            onKeyDown={onKeyDown}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-elevated"
            style={{ boxShadow: 'var(--shadow-pop)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Search size={18} className="text-faint" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search saves, jump to a view, or run a command…"
                className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
              />
              <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-faint">
                esc
              </span>
            </div>

            <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
              <span className="mr-1 text-[11px] text-faint">Color</span>
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c.word}
                  onClick={() => setColor(color === c.word ? null : c.word)}
                  title={c.word}
                  className={`h-5 w-5 rounded-full border transition ${
                    color === c.word
                      ? 'border-transparent ring-2 ring-[var(--ink)]'
                      : 'border-border hover:scale-110'
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-auto border-t border-border">
              {empty && (
                <p className="px-4 py-8 text-center text-[13px] text-faint">No matches.</p>
              )}

              {cmdHits.length > 0 && (
                <Section title={query ? 'Commands' : 'Jump to'}>
                  {cmdHits.map((c, i) => (
                    <Row key={c.id} selected={sel === i} onSelect={() => setSel(i)} onRun={c.run}>
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
                        {c.icon}
                      </span>
                      <span className="flex-1 truncate text-[13.5px] text-ink">{c.label}</span>
                      {c.hint && <span className="font-mono text-[10.5px] text-faint">{c.hint}</span>}
                    </Row>
                  ))}
                </Section>
              )}

              {collHits.length > 0 && (
                <Section title="Collections">
                  {collHits.map((p, i) => (
                    <Row
                      key={p.id}
                      selected={sel === collOffset + i}
                      onSelect={() => setSel(collOffset + i)}
                      onRun={go({ kind: 'collection', id: p.id })}
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
                        <Folder size={15} />
                      </span>
                      <span className="flex-1 truncate text-[13.5px] text-ink">{p.name}</span>
                    </Row>
                  ))}
                </Section>
              )}

              {itemHits.length > 0 && (
                <Section title={semantic.length ? 'Saves · by meaning' : 'Saves'}>
                  {itemHits.map((it, i) => (
                    <Row
                      key={it.id}
                      selected={sel === itemOffset + i}
                      onSelect={() => setSel(itemOffset + i)}
                      onRun={() => {
                        onOpenItem(it);
                        onClose();
                      }}
                    >
                      <span className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        {thumb(it) && <img src={thumb(it)} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-ink">{it.title}</span>
                        {it.source && (
                          <span className="block truncate text-[11.5px] text-faint">{it.source}</span>
                        )}
                      </span>
                    </Row>
                  ))}
                </Section>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-faint">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <Kbd>
                  <CornerDownLeft size={11} />
                </Kbd>
                open
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-1.5">
      <p className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-medium uppercase tracking-wider text-faint">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({
  selected,
  onSelect,
  onRun,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  onRun: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      data-sel={selected}
      onMouseMove={onSelect}
      onClick={onRun}
      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
        selected ? 'bg-surface-2' : ''
      }`}
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border px-1 font-mono">
      {children}
    </span>
  );
}
