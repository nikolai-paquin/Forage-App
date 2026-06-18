import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Item, Project, TypeFilter, View } from '../types';
import { sampleItems, sampleProjects } from '../data/sample';
import { uid } from './util';

const STORE_KEY = 'forage.items.v2';

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
  setView: (v: View) => void;
  setQuery: (q: string) => void;
  setTypeFilter: (t: TypeFilter) => void;
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

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(items));
    } catch {
      /* non-fatal */
    }
  }, [items]);

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
      setView,
      setQuery,
      setTypeFilter,
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
  }, [items, projects, view, query, typeFilter]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useForage(): ForageStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useForage must be used within ForageProvider');
  return ctx;
}
