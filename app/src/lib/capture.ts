// Capture preferences applied to every new save (Settings → Capture).
const DEFAULT_COLLECTION_KEY = 'forage.capture.defaultCollection';
const AUTOTAG_KEY = 'forage.capture.autotag';

export function getDefaultCollection(): string {
  try {
    return localStorage.getItem(DEFAULT_COLLECTION_KEY) || '';
  } catch {
    return '';
  }
}
export function setDefaultCollection(id: string) {
  try {
    if (id) localStorage.setItem(DEFAULT_COLLECTION_KEY, id);
    else localStorage.removeItem(DEFAULT_COLLECTION_KEY);
  } catch {
    /* non-fatal */
  }
}
export function getAutoTagOnSave(): boolean {
  try {
    return localStorage.getItem(AUTOTAG_KEY) === '1';
  } catch {
    return false;
  }
}
export function setAutoTagOnSave(on: boolean) {
  try {
    if (on) localStorage.setItem(AUTOTAG_KEY, '1');
    else localStorage.removeItem(AUTOTAG_KEY);
  } catch {
    /* non-fatal */
  }
}
