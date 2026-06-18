// Cross-device sync. Pragmatic, account-free model: a long random "sync key"
// acts as a bearer token for a single library blob stored in a Cloudflare KV
// Worker (see /server/sync-worker.js). Merging is per-item last-write-wins on
// `updatedAt`, with soft-deletes (deletedAt) acting as tombstones — so an edit
// on one device and a delete on another both survive a round-trip.
import type { Item, Space } from './../types';

const ENDPOINT_KEY = 'forage.sync.endpoint';
const KEY_KEY = 'forage.sync.key';
const AUTO_KEY = 'forage.sync.auto';
const LAST_KEY = 'forage.sync.lastAt';

export interface SyncSnapshot {
  v: 1;
  updatedAt: number;
  items: Item[];
  spaces: Space[];
}

const ls = {
  get(k: string) {
    try {
      return localStorage.getItem(k) ?? '';
    } catch {
      return '';
    }
  },
  set(k: string, v: string) {
    try {
      if (v) localStorage.setItem(k, v);
      else localStorage.removeItem(k);
    } catch {
      /* non-fatal */
    }
  },
};

export const getSyncEndpoint = () => ls.get(ENDPOINT_KEY).trim();
export const setSyncEndpoint = (v: string) => ls.set(ENDPOINT_KEY, v.trim());
export const getSyncKey = () => ls.get(KEY_KEY).trim();
export const setSyncKey = (v: string) => ls.set(KEY_KEY, v.trim());
export const getAutoSync = () => ls.get(AUTO_KEY) === '1';
export const setAutoSync = (on: boolean) => ls.set(AUTO_KEY, on ? '1' : '');
export const getLastSyncedAt = () => Number(ls.get(LAST_KEY)) || 0;
export const setLastSyncedAt = (t: number) => ls.set(LAST_KEY, String(t));

export const syncConfigured = () => !!getSyncEndpoint() && !!getSyncKey();

/** Generate a fresh, hard-to-guess sync key. */
export function generateSyncKey(): string {
  const bytes = new Uint8Array(18);
  (globalThis.crypto ?? ({} as Crypto)).getRandomValues?.(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `fk_${hex}`;
}

/** Merge two timestamped lists by id, newest `updatedAt` wins. Pure + tested. */
export function mergeById<T extends { id: string; updatedAt?: number; createdAt: number }>(
  local: T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>();
  const stamp = (x: T) => x.updatedAt ?? x.createdAt ?? 0;
  for (const it of local) map.set(it.id, it);
  for (const it of remote) {
    const cur = map.get(it.id);
    if (!cur || stamp(it) >= stamp(cur)) map.set(it.id, it);
  }
  return [...map.values()];
}

export function mergeSnapshots(
  local: SyncSnapshot,
  remote: SyncSnapshot,
): SyncSnapshot {
  return {
    v: 1,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    items: mergeById(local.items, remote.items),
    spaces: mergeById(local.spaces, remote.spaces),
  };
}

function endpointUrl(): string {
  const base = getSyncEndpoint().replace(/\/+$/, '');
  return `${base}/${encodeURIComponent(getSyncKey())}`;
}

/** Fetch the remote snapshot, or null if none stored yet. Throws on transport error. */
export async function pullSnapshot(signal?: AbortSignal): Promise<SyncSnapshot | null> {
  if (!syncConfigured()) throw new Error('sync not configured');
  const res = await fetch(endpointUrl(), { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`pull failed (${res.status})`);
  const data = (await res.json()) as SyncSnapshot;
  if (!data || !Array.isArray(data.items)) return null;
  return data;
}

export async function pushSnapshot(snap: SyncSnapshot, signal?: AbortSignal): Promise<void> {
  if (!syncConfigured()) throw new Error('sync not configured');
  const res = await fetch(endpointUrl(), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(snap),
    signal,
  });
  if (!res.ok) throw new Error(`push failed (${res.status})`);
}
