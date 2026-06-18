import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Frame, Item, Project, Storyboard, TypeFilter, View } from '../types';
import { sampleItems, sampleProjects, sampleStoryboards } from '../data/sample';
import { uid } from './util';

const STORE_KEY = 'forage.items.v1';
const SB_KEY = 'forage.storyboards.v1';

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
  storyboards: Storyboard[];
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
  storyboardById: (id: string) => Storyboard | undefined;
  reorderFrames: (storyboardId: string, frames: Frame[]) => void;
  addFrame: (storyboardId: string, itemId: string) => void;
  removeFrame: (storyboardId: string, frameId: string) => void;
  updateFrameBeat: (storyboardId: string, frameId: string, beat: string) => void;
  /** Items in the current view, after search + type filtering. */
  visibleItems: Item[];
  basketCount: number;
}

const Ctx = createContext<ForageStore | null>(null);

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* fall through to seed */
  }
  return fallback;
}

export function ForageProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(() => loadJSON(STORE_KEY, sampleItems));
  const [projects] = useState<Project[]>(sampleProjects);
  const [storyboards, setStoryboards] = useState<Storyboard[]>(() =>
    loadJSON(SB_KEY, sampleStoryboards),
  );
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

  useEffect(() => {
    try {
      localStorage.setItem(SB_KEY, JSON.stringify(storyboards));
    } catch {
      /* non-fatal */
    }
  }, [storyboards]);

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
      storyboards,
      view,
      query,
      typeFilter,
      setView,
      setQuery,
      setTypeFilter,
      projectById,
      itemById,
      storyboardById: (id) => storyboards.find((s) => s.id === id),
      visibleItems,
      basketCount: items.filter((i) => i.projectIds.length === 0).length,
      reorderFrames: (sbId, frames) =>
        setStoryboards((prev) =>
          prev.map((s) => (s.id === sbId ? { ...s, frames } : s)),
        ),
      addFrame: (sbId, itemId) =>
        setStoryboards((prev) =>
          prev.map((s) =>
            s.id === sbId
              ? { ...s, frames: [...s.frames, { id: uid(), itemId, beat: '' }] }
              : s,
          ),
        ),
      removeFrame: (sbId, frameId) =>
        setStoryboards((prev) =>
          prev.map((s) =>
            s.id === sbId ? { ...s, frames: s.frames.filter((f) => f.id !== frameId) } : s,
          ),
        ),
      updateFrameBeat: (sbId, frameId, beat) =>
        setStoryboards((prev) =>
          prev.map((s) =>
            s.id === sbId
              ? { ...s, frames: s.frames.map((f) => (f.id === frameId ? { ...f, beat } : f)) }
              : s,
          ),
        ),
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
  }, [items, projects, storyboards, view, query, typeFilter]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useForage(): ForageStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useForage must be used within ForageProvider');
  return ctx;
}
