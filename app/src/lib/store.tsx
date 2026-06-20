import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  FilterEntry,
  Item,
  Project,
  SortBy,
  Space,
  SpaceElement,
  Storyboard,
  StoryFrame,
  TypeFilter,
  View,
} from '../types';
import { sampleItems, sampleProjects } from '../data/sample';
import { fetchYouTubeMeta, itemInProject, sourceLabel, uid } from './util';
import { unfurl, unfurlEnabled } from './unfurl';
import { extractPalette } from './color';
import { idbGet, idbSet } from './idb';
import { findDuplicate, type DupeCandidate } from './dedupe';
import {
  getAutoSync,
  getLastSyncedAt,
  getSyncEndpoint,
  getSyncKey,
  mergeById,
  mergeSnapshots,
  pullSnapshot,
  pushSnapshot,
  setAutoSync,
  setLastSyncedAt,
  setSyncEndpoint,
  setSyncKey,
  syncConfigured,
} from './sync';

export interface SyncCfg {
  endpoint: string;
  key: string;
  auto: boolean;
}

const STORE_KEY = 'forage.items.v2'; // legacy localStorage key, migrated into IDB
const TYPES_KEY = 'forage.fileTypes.v1';
const SOURCES_KEY = 'forage.sources.v1';
const SPACES_KEY = 'forage.spaces.v1'; // legacy localStorage key, migrated into IDB
const IDB_ITEMS = 'items';
const IDB_SPACES = 'spaces';
const IDB_PROJECTS = 'projects';
const IDB_STORYBOARDS = 'storyboards';

const DEFAULT_TYPES: FilterEntry[] = [
  { value: 'image', label: 'Images', enabled: true },
  { value: 'video', label: 'Video', enabled: true },
  { value: 'link', label: 'Links', enabled: true },
  { value: 'gif', label: 'GIFs', enabled: true },
  { value: 'ai_asset', label: 'AI assets', enabled: true },
  { value: 'vector', label: 'Vectors', enabled: true },
  { value: 'code', label: 'Code', enabled: true },
  { value: 'audio', label: 'Audio', enabled: true },
];

/** Merge stored filter entries with defaults so new built-in types appear on upgrade. */
function mergeTypes(stored: FilterEntry[]): FilterEntry[] {
  const have = new Set(stored.map((t) => t.value));
  return [...stored, ...DEFAULT_TYPES.filter((d) => !have.has(d.value))];
}

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
  author?: string;
  url?: string;
  media?: string;
  poster?: string;
  ratio?: number;
  code?: string;
  summary?: string;
  tags?: string[];
  projectIds?: string[];
}

interface ForageStore {
  items: Item[];
  projects: Project[];
  view: View;
  query: string;
  typeFilter: TypeFilter;
  sourceFilter: string;
  tagFilter: string;
  sortBy: SortBy;
  fileTypes: FilterEntry[];
  sources: FilterEntry[];
  selectedIds: string[];
  /** True once the library has loaded from IndexedDB (avoids a first-paint flash). */
  hydrated: boolean;
  /** Keyboard-navigation cursor in the current grid. */
  focusedId?: string;
  setFocusedId: (id?: string) => void;
  clearLibrary: () => void;
  setView: (v: View) => void;
  setQuery: (q: string) => void;
  setTypeFilter: (t: TypeFilter) => void;
  setSourceFilter: (s: string) => void;
  setTagFilter: (t: string) => void;
  setSortBy: (s: SortBy) => void;
  removeTagEverywhere: (tag: string) => void;
  addFileType: (label: string) => void;
  removeFileType: (value: string) => void;
  toggleFileType: (value: string) => void;
  addSource: (value: string) => void;
  removeSource: (value: string) => void;
  toggleSource: (value: string) => void;
  addItem: (input: NewItemInput) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  toggleFavorite: (id: string) => void;
  markSeen: (id: string) => void;
  assignToProject: (itemId: string, projectId: string) => void;
  removeFromProject: (itemId: string, projectId: string) => void;
  addTag: (itemId: string, tag: string) => void;
  removeTag: (itemId: string, tag: string) => void;
  setDerivedFrom: (itemId: string, sourceId?: string) => void;
  outputsOf: (itemId: string) => Item[];
  resurfaceList: Item[];
  // trash
  trashItem: (id: string) => void;
  restoreItem: (id: string) => void;
  deleteForever: (id: string) => void;
  emptyTrash: () => void;
  // selection + bulk
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  trashSelected: () => void;
  assignSelectedTo: (projectId: string) => void;
  restoreSelected: () => void;
  deleteSelectedForever: () => void;
  projectById: (id: string) => Project | undefined;
  createProject: (name: string, autoTags?: string[]) => void;
  deleteProject: (id: string) => void;
  itemById: (id: string) => Item | undefined;
  findDuplicate: (c: DupeCandidate) => Item | undefined;
  projectItemCount: (id: string) => number;
  visibleItems: Item[];
  unsortedCount: number;
  trashCount: number;
  // spaces
  spaces: Space[];
  spaceById: (id: string) => Space | undefined;
  createSpace: () => void;
  renameSpace: (id: string, name: string) => void;
  deleteSpace: (id: string) => void;
  addSpaceElement: (spaceId: string, el: SpaceElement) => void;
  updateSpaceElement: (spaceId: string, elId: string, patch: Partial<SpaceElement>) => void;
  removeSpaceElement: (spaceId: string, elId: string) => void;
  // storyboards
  storyboards: Storyboard[];
  storyboardById: (id: string) => Storyboard | undefined;
  createStoryboard: () => void;
  renameStoryboard: (id: string, name: string) => void;
  deleteStoryboard: (id: string) => void;
  addFrame: (boardId: string, frame: StoryFrame) => void;
  updateFrame: (boardId: string, frameId: string, patch: Partial<StoryFrame>) => void;
  removeFrame: (boardId: string, frameId: string) => void;
  moveFrame: (boardId: string, frameId: string, dir: -1 | 1) => void;
  // sync
  syncCfg: SyncCfg;
  syncBusy: boolean;
  lastSyncedAt: number;
  updateSyncCfg: (patch: Partial<SyncCfg>) => void;
  syncNow: () => Promise<void>;
}

const Ctx = createContext<ForageStore | null>(null);

/** One-time migration of legacy localStorage JSON into the new IDB store. */
function migrateLegacy<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as T;
    localStorage.removeItem(key);
    return parsed;
  } catch {
    return undefined;
  }
}

export function ForageProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<View>({ kind: 'library', tab: 'all' });
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [fileTypes, setFileTypes] = useState<FilterEntry[]>(() =>
    mergeTypes(loadJSON(TYPES_KEY, DEFAULT_TYPES)),
  );
  const [sources, setSources] = useState<FilterEntry[]>(() =>
    loadJSON(SOURCES_KEY, deriveSources(sampleItems)),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [syncCfg, setSyncCfg] = useState<SyncCfg>(() => ({
    endpoint: getSyncEndpoint(),
    key: getSyncKey(),
    auto: getAutoSync(),
  }));
  const [syncBusy, setSyncBusy] = useState(false);
  const [lastSyncedAt, setLastSyncedState] = useState<number>(() => getLastSyncedAt());

  // Hydrate the library from IndexedDB once (migrating any legacy localStorage
  // data, and seeding samples only on a genuine first run).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loadedItems = await idbGet<Item[]>(IDB_ITEMS);
      if (loadedItems === undefined) {
        loadedItems = migrateLegacy<Item[]>(STORE_KEY) ?? sampleItems;
      }
      let loadedSpaces = await idbGet<Space[]>(IDB_SPACES);
      if (loadedSpaces === undefined) {
        loadedSpaces = migrateLegacy<Space[]>(SPACES_KEY) ?? [];
      }
      let loadedProjects = await idbGet<Project[]>(IDB_PROJECTS);
      if (loadedProjects === undefined) loadedProjects = sampleProjects;
      const loadedStoryboards = (await idbGet<Storyboard[]>(IDB_STORYBOARDS)) ?? [];
      if (cancelled) return;
      setItems(loadedItems);
      setSpaces(loadedSpaces);
      setProjects(loadedProjects);
      setStoryboards(loadedStoryboards);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the library to IndexedDB (only after hydration, so we never clobber
  // stored data with the empty initial state).
  useEffect(() => {
    if (!hydrated) return;
    idbSet(IDB_ITEMS, items).catch(() => {});
  }, [items, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    idbSet(IDB_SPACES, spaces).catch(() => {});
  }, [spaces, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    idbSet(IDB_PROJECTS, projects).catch(() => {});
  }, [projects, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    idbSet(IDB_STORYBOARDS, storyboards).catch(() => {});
  }, [storyboards, hydrated]);

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
  // selection is per-view
  useEffect(() => setSelectedIds([]), [view]);

  // Auto-sync: debounced push when local data changes.
  useEffect(() => {
    if (!hydrated || !syncCfg.auto || !syncConfigured()) return;
    const t = setTimeout(() => {
      pushSnapshot({ v: 1, updatedAt: Date.now(), items, spaces })
        .then(() => {
          const n = Date.now();
          setLastSyncedAt(n);
          setLastSyncedState(n);
        })
        .catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, [items, spaces, syncCfg, hydrated]);

  // Auto-sync: pull + merge on mount/config change, then periodically.
  useEffect(() => {
    if (!hydrated || !syncCfg.auto || !syncConfigured()) return;
    let cancelled = false;
    const doPull = async () => {
      try {
        const remote = await pullSnapshot();
        if (cancelled || !remote) return;
        setItems((prev) => mergeById(prev, remote.items));
        setSpaces((prev) => mergeById(prev, remote.spaces));
      } catch {
        /* offline — try again next tick */
      }
    };
    doPull();
    const iv = setInterval(doPull, 30000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [syncCfg, hydrated]);

  const patchSpace = (spaceId: string, fn: (s: Space) => Space) =>
    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...fn(s), updatedAt: Date.now() } : s)),
    );

  const patchBoard = (boardId: string, fn: (b: Storyboard) => Storyboard) =>
    setStoryboards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...fn(b), updatedAt: Date.now() } : b)),
    );

  const patch = (id: string, fn: (i: Item) => Item) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...fn(i), updatedAt: Date.now() } : i)));

  const registerSource = (src?: string) => {
    if (!src) return;
    setSources((prev) =>
      prev.some((s) => s.value === src)
        ? prev
        : [...prev, { value: src, label: sourceLabel(src), enabled: true }],
    );
  };

  const store = useMemo<ForageStore>(() => {
    const projectById = (id: string) => projects.find((p) => p.id === id);
    const itemById = (id: string) => items.find((i) => i.id === id);

    let inView: Item[] = [];
    if (view.kind === 'library') {
      if (view.tab === 'trash') inView = items.filter((i) => i.deletedAt);
      else {
        const live = items.filter((i) => !i.deletedAt);
        if (view.tab === 'all') inView = live;
        else if (view.tab === 'unsorted') inView = live.filter((i) => i.projectIds.length === 0);
        else inView = live.filter((i) => i.type === 'link');
      }
    } else if (view.kind === 'collection') {
      const p = projectById(view.id);
      inView = p ? items.filter((i) => !i.deletedAt && itemInProject(i, p)) : [];
    }

    const q = query.trim().toLowerCase();
    const visibleItems = inView
      .filter((it) => typeFilter === 'all' || it.type === typeFilter)
      .filter((it) => sourceFilter === 'all' || it.source === sourceFilter)
      .filter((it) => tagFilter === 'all' || it.tags.includes(tagFilter))
      .filter((it) => {
        if (!q) return true;
        const hay = [it.title, it.source, it.note, it.summary, it.url, it.code, it.ai?.prompt, ...it.tags]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return a.createdAt - b.createdAt;
          case 'name':
            return a.title.localeCompare(b.title);
          case 'type':
            return a.type.localeCompare(b.type) || b.createdAt - a.createdAt;
          default:
            return (b.deletedAt ?? b.createdAt) - (a.deletedAt ?? a.createdAt);
        }
      });

    return {
      items,
      projects,
      view,
      query,
      typeFilter,
      sourceFilter,
      tagFilter,
      sortBy,
      fileTypes,
      sources,
      selectedIds,
      hydrated,
      focusedId,
      setFocusedId,
      clearLibrary: () => {
        setItems([]);
        setSpaces([]);
        setStoryboards([]);
        setSelectedIds([]);
        setFocusedId(undefined);
      },
      setView,
      setQuery,
      setTypeFilter,
      setSourceFilter,
      setTagFilter,
      setSortBy,
      removeTagEverywhere: (tag) =>
        setItems((prev) => prev.map((i) => ({ ...i, tags: i.tags.filter((t) => t !== tag) }))),
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
        registerSource(v);
      },
      removeSource: (value) => setSources((prev) => prev.filter((s) => s.value !== value)),
      toggleSource: (value) =>
        setSources((prev) => prev.map((s) => (s.value === value ? { ...s, enabled: !s.enabled } : s))),
      addItem: (input) => {
        const item: Item = {
          id: uid(),
          type: input.type,
          title: input.title || 'Untitled',
          source: input.source,
          author: input.author,
          url: input.url,
          media: input.media,
          poster: input.poster,
          code: input.code,
          summary: input.summary,
          ratio: input.ratio ?? (input.type === 'link' ? 1.6 : 0.7 + Math.random() * 0.7),
          palette: ['#3b3b3b', '#9a9a9a', '#e6e6e6'],
          tags: input.tags ?? [],
          projectIds: input.projectIds ?? [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastSeenAt: Date.now(),
        };
        setItems((prev) => [item, ...prev]);
        registerSource(item.source);
        // Enrich a YouTube save with its real video title + creator (async, best-effort).
        if (item.type === 'video' && item.source === 'youtube.com' && item.url) {
          fetchYouTubeMeta(item.url).then((meta) => {
            if (meta?.title)
              patch(item.id, (i) => ({ ...i, title: meta.title, author: meta.author ?? i.author }));
          });
        }
        // Enrich a saved link with its real page title, description, and preview
        // image via the unfurl proxy — unless it already arrived enriched (e.g.
        // from the browser extension, which reads the page's meta tags directly).
        if (item.type === 'link' && item.url && unfurlEnabled() && (!item.summary || !item.media)) {
          unfurl(item.url).then((m) => {
            if (!m) return;
            patch(item.id, (i) => ({
              ...i,
              title: m.title?.trim() || i.title,
              summary: m.description?.trim() || i.summary,
              media: m.image || i.media,
              author: m.author || i.author,
            }));
            if (m.image) extractPalette(m.image).then((p) => p.length && patch(item.id, (i) => ({ ...i, palette: p })));
          });
        }
        return item;
      },
      updateItem: (id, p) => patch(id, (i) => ({ ...i, ...p })),
      toggleFavorite: (id) => patch(id, (i) => ({ ...i, favorite: !i.favorite })),
      markSeen: (id) => patch(id, (i) => ({ ...i, lastSeenAt: Date.now() })),
      assignToProject: (itemId, projectId) =>
        patch(itemId, (i) =>
          i.projectIds.includes(projectId) ? i : { ...i, projectIds: [...i.projectIds, projectId] },
        ),
      removeFromProject: (itemId, projectId) =>
        patch(itemId, (i) => ({ ...i, projectIds: i.projectIds.filter((p) => p !== projectId) })),
      addTag: (itemId, tag) =>
        patch(itemId, (i) =>
          i.tags.includes(tag) || !tag.trim() ? i : { ...i, tags: [...i.tags, tag.trim()] },
        ),
      removeTag: (itemId, tag) => patch(itemId, (i) => ({ ...i, tags: i.tags.filter((t) => t !== tag) })),
      setDerivedFrom: (itemId, sourceId) => patch(itemId, (i) => ({ ...i, derivedFrom: sourceId })),
      outputsOf: (itemId) =>
        items.filter(
          (i) => !i.deletedAt && (i.derivedFrom === itemId || i.ai?.sourceRefId === itemId),
        ),
      resurfaceList: [...items]
        .filter((i) => !i.deletedAt)
        .sort((a, b) => a.lastSeenAt - b.lastSeenAt)
        .slice(0, 6),
      trashItem: (id) => patch(id, (i) => ({ ...i, deletedAt: Date.now() })),
      restoreItem: (id) => patch(id, (i) => ({ ...i, deletedAt: undefined })),
      deleteForever: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      emptyTrash: () => setItems((prev) => prev.filter((i) => !i.deletedAt)),
      toggleSelect: (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      clearSelection: () => setSelectedIds([]),
      trashSelected: () => {
        const ids = new Set(selectedIds);
        const now = Date.now();
        setItems((prev) =>
          prev.map((i) => (ids.has(i.id) ? { ...i, deletedAt: now, updatedAt: now } : i)),
        );
        setSelectedIds([]);
      },
      assignSelectedTo: (projectId) => {
        const ids = new Set(selectedIds);
        const now = Date.now();
        setItems((prev) =>
          prev.map((i) =>
            ids.has(i.id) && !i.projectIds.includes(projectId)
              ? { ...i, projectIds: [...i.projectIds, projectId], updatedAt: now }
              : i,
          ),
        );
        setSelectedIds([]);
      },
      restoreSelected: () => {
        const ids = new Set(selectedIds);
        const now = Date.now();
        setItems((prev) =>
          prev.map((i) => (ids.has(i.id) ? { ...i, deletedAt: undefined, updatedAt: now } : i)),
        );
        setSelectedIds([]);
      },
      deleteSelectedForever: () => {
        const ids = new Set(selectedIds);
        setItems((prev) => prev.filter((i) => !ids.has(i.id)));
        setSelectedIds([]);
      },
      projectById,
      createProject: (name, autoTags) => {
        const tags = (autoTags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean);
        const palette = ['#e8927c', '#7cb5e8', '#9ad29a', '#d29ad2', '#e8d27c', '#7ce8cf'];
        const p: Project = {
          id: uid(),
          name: name.trim() || 'Untitled collection',
          brief: '',
          color: palette[Math.floor(Math.random() * palette.length)],
          status: 'active',
          autoTags: tags.length ? [...new Set(tags)] : undefined,
        };
        setProjects((prev) => [p, ...prev]);
        setView({ kind: 'collection', id: p.id });
      },
      deleteProject: (id) => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setItems((prev) =>
          prev.map((i) =>
            i.projectIds.includes(id)
              ? { ...i, projectIds: i.projectIds.filter((p) => p !== id), updatedAt: Date.now() }
              : i,
          ),
        );
        setView({ kind: 'collections' });
      },
      itemById,
      findDuplicate: (c) => findDuplicate(items, c),
      projectItemCount: (id) => {
        const p = projectById(id);
        return p ? items.filter((i) => !i.deletedAt && itemInProject(i, p)).length : 0;
      },
      visibleItems,
      unsortedCount: items.filter((i) => !i.deletedAt && i.projectIds.length === 0).length,
      trashCount: items.filter((i) => i.deletedAt).length,
      spaces,
      spaceById: (id) => spaces.find((s) => s.id === id),
      createSpace: () => {
        const s: Space = {
          id: uid(),
          name: 'Untitled moodboard',
          elements: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSpaces((prev) => [s, ...prev]);
        setView({ kind: 'space', id: s.id });
      },
      renameSpace: (id, name) => patchSpace(id, (s) => ({ ...s, name })),
      deleteSpace: (id) => {
        setSpaces((prev) => prev.filter((s) => s.id !== id));
        setView({ kind: 'spaces' });
      },
      addSpaceElement: (spaceId, el) =>
        patchSpace(spaceId, (s) => ({ ...s, elements: [...s.elements, el] })),
      updateSpaceElement: (spaceId, elId, p) =>
        patchSpace(spaceId, (s) => ({
          ...s,
          elements: s.elements.map((e) => (e.id === elId ? { ...e, ...p } : e)),
        })),
      removeSpaceElement: (spaceId, elId) =>
        patchSpace(spaceId, (s) => ({ ...s, elements: s.elements.filter((e) => e.id !== elId) })),

      storyboards,
      storyboardById: (id) => storyboards.find((b) => b.id === id),
      createStoryboard: () => {
        const b: Storyboard = {
          id: uid(),
          name: 'Untitled storyboard',
          frames: [],
          createdAt: Date.now(),
        };
        setStoryboards((prev) => [b, ...prev]);
        setView({ kind: 'storyboard', id: b.id });
      },
      renameStoryboard: (id, name) => patchBoard(id, (b) => ({ ...b, name })),
      deleteStoryboard: (id) => {
        setStoryboards((prev) => prev.filter((b) => b.id !== id));
        setView({ kind: 'storyboards' });
      },
      addFrame: (boardId, frame) =>
        patchBoard(boardId, (b) => ({ ...b, frames: [...b.frames, frame] })),
      updateFrame: (boardId, frameId, p) =>
        patchBoard(boardId, (b) => ({
          ...b,
          frames: b.frames.map((f) => (f.id === frameId ? { ...f, ...p } : f)),
        })),
      removeFrame: (boardId, frameId) =>
        patchBoard(boardId, (b) => ({ ...b, frames: b.frames.filter((f) => f.id !== frameId) })),
      moveFrame: (boardId, frameId, dir) =>
        patchBoard(boardId, (b) => {
          const i = b.frames.findIndex((f) => f.id === frameId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= b.frames.length) return b;
          const frames = [...b.frames];
          [frames[i], frames[j]] = [frames[j], frames[i]];
          return { ...b, frames };
        }),
      syncCfg,
      syncBusy,
      lastSyncedAt,
      updateSyncCfg: (p) => {
        const next = { ...syncCfg, ...p };
        if (p.endpoint !== undefined) setSyncEndpoint(p.endpoint);
        if (p.key !== undefined) setSyncKey(p.key);
        if (p.auto !== undefined) setAutoSync(p.auto);
        setSyncCfg(next);
      },
      syncNow: async () => {
        if (!syncConfigured() || syncBusy) return;
        setSyncBusy(true);
        try {
          const remote = await pullSnapshot();
          let mergedItems = items;
          let mergedSpaces = spaces;
          if (remote) {
            const merged = mergeSnapshots(
              { v: 1, updatedAt: Date.now(), items, spaces },
              remote,
            );
            mergedItems = merged.items;
            mergedSpaces = merged.spaces;
            setItems(mergedItems);
            setSpaces(mergedSpaces);
          }
          await pushSnapshot({ v: 1, updatedAt: Date.now(), items: mergedItems, spaces: mergedSpaces });
          const t = Date.now();
          setLastSyncedAt(t);
          setLastSyncedState(t);
        } finally {
          setSyncBusy(false);
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, projects, view, query, typeFilter, sourceFilter, tagFilter, sortBy, fileTypes, sources, selectedIds, focusedId, hydrated, spaces, storyboards, syncCfg, syncBusy, lastSyncedAt]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useForage(): ForageStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useForage must be used within ForageProvider');
  return ctx;
}
