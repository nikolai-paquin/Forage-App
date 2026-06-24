// Capture preferences applied to every new save (Settings → Capture).
const DEFAULT_COLLECTION_KEY = 'forage.capture.defaultCollection';

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
