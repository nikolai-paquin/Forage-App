// Multiple libraries (workspaces). Each library namespaces the IndexedDB keys
// for items/spaces/projects/storyboards. The built-in 'default' library keeps
// the un-suffixed keys, so existing data becomes the default library for free.
import type { Library } from '../types';

export const LIBRARIES_KEY = 'forage.libraries.v1';
export const ACTIVE_LIB_KEY = 'forage.activeLibrary.v1';
export const DEFAULT_LIBRARY: Library = { id: 'default', name: 'My Library' };

export function getActiveLibrary(): string {
  try {
    return localStorage.getItem(ACTIVE_LIB_KEY) || 'default';
  } catch {
    return 'default';
  }
}

/** Namespace an IDB base key for a library ('default' keeps the bare key). */
export function libKey(base: string, lib: string = getActiveLibrary()): string {
  return lib === 'default' ? base : `${base}:${lib}`;
}
