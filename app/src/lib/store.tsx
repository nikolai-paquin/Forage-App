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

const STORE_KEY = 'forage.items.v1';

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
  projects: Project[];
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
  projectById: (id: string) => Project | undefined;
  itemById: (id: string) => Item | undefined;
  /** Items in the current view, after search + type filtering. */
  visibleItems: Item[];
  basketCount: number;
}

const Ctx = createContext<ForageStore | null>(null);

function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Item[];
  } catch {
    /* fall through to seed */
  }
  return sampleItems;
}

export function ForageProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(loadItems);
  const [projects] = useState<Project[]>(sampleProjects);
  const [view, setView] = useState<View>({ kind: 'library' });
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  // Local-first persistence (stands in for the SQLite source of truth).
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / disabled — non-fatal in the prototype */
    }
  }, [items]);

  const store = useMemo<ForageStore>(() => {
    const projectById = (id: string) => projects.find((p) => p.id === id);
    const itemById = (id: string) => items.find((i) => i.id === id);

    const inView = items.filter((it) => {
      if (view.kind === 'basket') return it.projectIds.length === 0;
      if (view.kind === 'project') return it.projectIds.includes(view.projectId);
      return true; // library
    });

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
      visibleItems,
      basketCount: items.filter((i) => i.projectIds.length === 0).length,
      addItem: (input) => {
        const item: Item = {
          id: uid(),
          type: input.type,
          title: input.title || 'Untitled',
          source: input.source,
          url: input.url,
          media: input.media,
          code: input.code,
          ratio: input.type === 'link' ? 1.9 : 0.85 + Math.random() * 0.5,
          palette: ['#c2603f', '#e9e2d4', '#2c2622'],
          tags: input.tags ?? [],
          projectIds: input.projectIds ?? [],
          createdAt: Date.now(),
          lastSeenAt: Date.now(),
        };
        setItems((prev) => [item, ...prev]);
        return item;
      },
      toggleFavorite: (id) =>
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i)),
        ),
      markSeen: (id) =>
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, lastSeenAt: Date.now() } : i)),
        ),
      assignToProject: (itemId, projectId) =>
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId && !i.projectIds.includes(projectId)
              ? { ...i, projectIds: [...i.projectIds, projectId] }
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
