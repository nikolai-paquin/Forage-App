// Backup & restore — a full, portable snapshot of everything Forage keeps in
// localStorage. The whole point: a browser cache wipe should never lose a library.
//
// The file is plain JSON so it can be inspected, diffed, or migrated by hand.

const PREFIX = 'forage.';

export interface Backup {
  app: 'forage';
  version: 1;
  exportedAt: number;
  /** Every forage.* localStorage key, with its parsed value. */
  data: Record<string, unknown>;
}

/** Snapshot every forage.* key currently in localStorage. */
export function buildBackup(): Backup {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    const raw = localStorage.getItem(key);
    if (raw == null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw; // keep non-JSON values verbatim
    }
  }
  return { app: 'forage', version: 1, exportedAt: Date.now(), data };
}

/** Trigger a download of the current library as a dated JSON file. */
export function exportBackup() {
  const backup = buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `forage-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  keys: number;
  items: number;
}

/** Validate + restore a backup file, overwriting current state. Throws on bad input. */
export async function importBackup(file: File): Promise<ImportResult> {
  const text = await file.text();
  let parsed: Backup;
  try {
    parsed = JSON.parse(text) as Backup;
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }
  if (!parsed || parsed.app !== 'forage' || typeof parsed.data !== 'object') {
    throw new Error('That doesn’t look like a Forage backup.');
  }
  // Clear existing forage.* keys first so a restore is a clean replace, not a merge.
  const stale: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) stale.push(key);
  }
  stale.forEach((k) => localStorage.removeItem(k));

  let keys = 0;
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!key.startsWith(PREFIX)) continue;
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    keys++;
  }
  const items = Array.isArray((parsed.data as Record<string, unknown>)['forage.items.v2'])
    ? (parsed.data['forage.items.v2'] as unknown[]).length
    : 0;
  return { keys, items };
}

/** Rough stats for the Data settings pane. */
export function storageStats(): { items: number; bytes: number } {
  let bytes = 0;
  let items = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    const raw = localStorage.getItem(key) ?? '';
    bytes += key.length + raw.length;
    if (key === 'forage.items.v2') {
      try {
        items = (JSON.parse(raw) as unknown[]).length;
      } catch {
        /* ignore */
      }
    }
  }
  return { items, bytes };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
