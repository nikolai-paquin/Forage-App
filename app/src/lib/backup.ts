// Backup & restore — a full, portable snapshot of a Forage library. The library
// (items + spaces) lives in IndexedDB; smaller config (filters, theme, sync, AI
// endpoint) lives in localStorage. A backup captures both so a restore — or a move
// to a new machine — is lossless. Plain JSON, so it stays inspectable by hand.
import { idbGet, idbSet } from './idb';

const PREFIX = 'forage.';
const IDB_ITEMS = 'items';
const IDB_SPACES = 'spaces';
const IDB_PROJECTS = 'projects';
const IDB_STORYBOARDS = 'storyboards';

export interface Backup {
  app: 'forage';
  version: 2;
  exportedAt: number;
  /** The library — items + spaces + collections + storyboards, from IndexedDB. */
  idb: { items: unknown[]; spaces: unknown[]; projects?: unknown[]; storyboards?: unknown[] };
  /** Config — every forage.* localStorage key. */
  local: Record<string, unknown>;
}

function snapshotLocal(): Record<string, unknown> {
  const local: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    const raw = localStorage.getItem(key);
    if (raw == null) continue;
    try {
      local[key] = JSON.parse(raw);
    } catch {
      local[key] = raw;
    }
  }
  return local;
}

export async function buildBackup(): Promise<Backup> {
  const [items, spaces, projects, storyboards] = await Promise.all([
    idbGet<unknown[]>(IDB_ITEMS),
    idbGet<unknown[]>(IDB_SPACES),
    idbGet<unknown[]>(IDB_PROJECTS),
    idbGet<unknown[]>(IDB_STORYBOARDS),
  ]);
  return {
    app: 'forage',
    version: 2,
    exportedAt: Date.now(),
    idb: {
      items: items ?? [],
      spaces: spaces ?? [],
      projects: projects ?? [],
      storyboards: storyboards ?? [],
    },
    local: snapshotLocal(),
  };
}

/** Trigger a download of the current library as a dated JSON file. */
export async function exportBackup() {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `forage-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  items: number;
}

/** Validate + restore a backup file, overwriting current state. Throws on bad input. */
export async function importBackup(file: File): Promise<ImportResult> {
  let parsed: Partial<Backup> & { data?: Record<string, unknown> };
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }
  if (!parsed || parsed.app !== 'forage') {
    throw new Error('That doesn’t look like a Forage backup.');
  }

  // Clear existing forage.* config so a restore is a clean replace, not a merge.
  const stale: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) stale.push(key);
  }
  stale.forEach((k) => localStorage.removeItem(k));

  let items: unknown[] = [];
  let spaces: unknown[] = [];
  let projects: unknown[] | undefined;
  let storyboards: unknown[] | undefined;

  if (parsed.version === 2 && parsed.idb && parsed.local) {
    items = parsed.idb.items ?? [];
    spaces = parsed.idb.spaces ?? [];
    projects = parsed.idb.projects;
    storyboards = parsed.idb.storyboards;
    for (const [key, value] of Object.entries(parsed.local)) {
      if (key.startsWith(PREFIX)) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }
  } else if (parsed.data) {
    // Legacy v1 backup: everything lived in localStorage, including the library.
    const data = parsed.data;
    items = (data['forage.items.v2'] as unknown[]) ?? [];
    spaces = (data['forage.spaces.v1'] as unknown[]) ?? [];
    for (const [key, value] of Object.entries(data)) {
      if (key === 'forage.items.v2' || key === 'forage.spaces.v1') continue;
      if (key.startsWith(PREFIX)) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }
  } else {
    throw new Error('That backup is missing its data.');
  }

  const writes = [idbSet(IDB_ITEMS, items), idbSet(IDB_SPACES, spaces)];
  if (projects !== undefined) writes.push(idbSet(IDB_PROJECTS, projects));
  if (storyboards !== undefined) writes.push(idbSet(IDB_STORYBOARDS, storyboards));
  await Promise.all(writes);
  return { items: Array.isArray(items) ? items.length : 0 };
}

/** Rough stats for the Data settings pane. */
export async function storageStats(): Promise<{ items: number; bytes: number }> {
  const [items, spaces] = await Promise.all([
    idbGet<unknown[]>(IDB_ITEMS),
    idbGet<unknown[]>(IDB_SPACES),
  ]);
  let bytes = JSON.stringify(items ?? []).length + JSON.stringify(spaces ?? []).length;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    bytes += key.length + (localStorage.getItem(key) ?? '').length;
  }
  return { items: Array.isArray(items) ? items.length : 0, bytes };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
