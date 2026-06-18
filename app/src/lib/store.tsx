import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FilterEntry, Item, Project, TypeFilter, View } from '../types';
import { sampleItems, sampleProjects } from '../data/sample';
import { sourceLabel, uid } from './util';

const STORE_KEY = 'forage.items.v2';
const TYPES_KEY = 'forage.fileTypes.v1';
const SOURCES_KEY = 'forage.sources.v1';

const DEFAULT_TYPES: FilterEntry[] = [
  { value: 'image', label: 'Images', enabled: true },
  { value: 'video', label: 'Video', enabled: true },
  { value: 'link', label: 'Links', enabled: true },
  { value: 'gif', label: 'GIFs', enabled: true },
  { value: 'ai_asset', label: 'AI assets', enabled: true },
  { value: 'vector', label: 'Vectors', enabled: true },
  { value: 'code', label: 'Code', enabled: true },
];

const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_');

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* seed */
  }
  return fallback;
}

function deriveSources(items: Item[]): FilterEntry[] {
  const seen = new Set<string>();
  const out: FilterEntry[] = [];
  for (const it of items) {
    if (it.source && !seen.has(it.source)) {
      seen.add(it.source);
      out.push({ value: it.source, label: sourceLabel(it.source), enabled: true });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

interface NewItemInput {
  type: Item['type'];
  title: string;
  source?: string;
  url?: string;
  media?: string;
  code?: string;
  tags?: string[];
  projectIds?: string[];
}

interface ForageStore {
  items: Item[];
  projects: Project[]; // "Collections" in the UI
  view: View;
  query: string;
  typeFilter: TypeFilter;
  sourceFilter: string;
  fileTypes: FilterEntry[];
  sources: FilterEntry[];
  setView: (v: View) => void;
  setQuery: (q: string) => void;
  setTypeFilter: (t: TypeFilter) => void;
  setSourceFilter: (s: string) => void;
  addFileType: (label: string) => void;
  removeFileType: (value: string) => void;
  toggleFileType: (value: string) => void;
  addSource: (value: string) => void;
  removeSource: (value: string) => void;
  toggleSource: (value: string) => void;
  addItem: (input: NewItemInput) => Item;
  toggleFavorite: (id: string) => void;
  markSeen: (id: string) => void;
  assignToProject: (itemId: string, projectId: string) => void;
  removeFromProject: (itemId: string, projectId: string) => void;
  projectById: (id: string) => Project | undefined;
  itemById: (id: string) => Item | undefined;
  projectItemCount: (id: string) => number;
  /** Items for the current view after search + type filtering + sort. */
  visibleItems: Item[];
  unsortedCount: number;
}

const Ctx = createContext<ForageStore | null>(null);

function load(): Item[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Item[];
  } catch {
    /* seed */
  }
  return sampleItems;
}

export function ForageProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(load);
  const [projects] = useState<Project[]>(sampleProjects);
  const [view, setView] = useState<View>({ kind: 'library', tab: 'all' });
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [fileTypes, setFileTypes] = useState<FilterEntry[]>(() => loadJSON(TYPES_KEY, DEFAULT_TYPES));
  const [sources, setSources] = useState<FilterEntry[]>(() =>
    loadJSON(SOURCES_KEY, deriveSources(load())),
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(items));
    } catch {
      /* non-fatal */
    }
  }, [items]);
  useEffect(() => {
    try {
      localStorage.setItem(TYPES_KEY, JSON.stringify(fileTypes));
    } catch {
      /* non-fatal */
    }
  }, [fileTypes]);
  useEffect(() => {
    try {
      localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
    } catch {
      /* non-fatal */
    }
  }, [sources]);

  const store = useMemo<ForageStore>(() => {
    const projectById = (id: string) => projects.find((p) => p.id === id);
    const itemById = (id: string) => items.find((i) => i.id === id);

    let inView: Item[] = [];
    if (view.kind === 'library') {
      if (view.tab === 'all') inView = items;
      else if (view.tab === 'unsorted') inView = items.filter((i) => i.projectIds.length === 0);
      else if (view.tab === 'bookmarks') inView = items.filter((i) => i.type === 'link');
      else inView = []; // trash
    } else if (view.kind === 'collection') {
      inView = items.filter((i) => i.projectIds.includes(view.id));
    }

    const q = query.trim().toLowerCase();
    const visibleItems = inView
      .filter((it) => typeFilter === 'all' || it.type === typeFilter)
      .filter((it) => sourceFilter === 'all' || it.source === sourceFilter)
      .filter((it) => {
        if (!q) return true;
        const hay = [it.title, it.source, it.note, it.summary, ...it.tags]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return {
      items,
      projects,
      view,
      query,
      typeFilter,
      sourceFilter,
      fileTypes,
      sources,
      setView,
      setQuery,
      setTypeFilter,
      setSourceFilter,
      addFileType: (label) => {
        const v = slug(label);
        if (!label.trim()) return;
        setFileTypes((prev) =>
          prev.some((t) => t.value === v) ? prev : [...prev, { value: v, label: label.trim(), enabled: true }],
        );
      },
      removeFileType: (value) => setFileTypes((prev) => prev.filter((t) => t.value !== value)),
      toggleFileType: (value) =>
        setFileTypes((prev) => prev.map((t) => (t.value === value ? { ...t, enabled: !t.enabled } : t))),
      addSource: (value) => {
        const v = value.trim();
        if (!v) return;
        setSources((prev) =>
          prev.some((s) => s.value === v) ? prev : [...prev, { value: v, label: sourceLabel(v), enabled: true }],
        );
      },
      removeSource: (value) => setSources((prev) => prev.filter((s) => s.value !== value)),
      toggleSource: (value) =>
        setSources((prev) => prev.map((s) => (s.value === value ? { ...s, enabled: !s.enabled } : s))),
      projectById,
      itemById,
      projectItemCount: (id) => items.filter((i) => i.projectIds.includes(id)).length,
      visibleItems,
      unsortedCount: items.filter((i) => i.projectIds.length === 0).length,
      addItem: (input) => {
        const item: Item = {
          id: uid(),
          type: input.type,
          title: input.title || 'Untitled',
          source: input.source,
          url: input.url,
          media: input.media,
          code: input.code,
          ratio: input.type === 'link' ? 1.6 : 0.7 + Math.random() * 0.7,
          palette: ['#3b3b3b', '#9a9a9a', '#e6e6e6'],
          tags: input.tags ?? [],
          projectIds: input.projectIds ?? [],
          createdAt: Date.now(),
          lastSeenAt: Date.now(),
        };
        setItems((prev) => [item, ...prev]);
        if (item.source) {
          const src = item.source;
          setSources((prev) =>
            prev.some((s) => s.value === src)
              ? prev
              : [...prev, { value: src, label: sourceLabel(src), enabled: true }],
          );
        }
        return item;
      },
      toggleFavorite: (id) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i))),
      markSeen: (id) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, lastSeenAt: Date.now() } : i))),
      assignToProject: (itemId, projectId) =>
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId && !i.projectIds.includes(projectId)
              ? { ...i, projectIds: [...i.projectIds, projectId] }
              : i,
          ),
        ),
      removeFromProject: (itemId, projectId) =>
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, projectIds: i.projectIds.filter((p) => p !== projectId) }
              : i,
          ),
        ),
    };
  }, [items, projects, view, query, typeFilter, sourceFilter, fileTypes, sources]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useForage(): ForageStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useForage must be used within ForageProvider');
  return ctx;
}
