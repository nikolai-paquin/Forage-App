import { useSyncExternalStore } from 'react';
import { applyColorTheme, getColorTheme } from './colorTheme';

const KEY = 'forage.theme';

// Single source of truth = the `dark` class on <html>. All useTheme() callers
// subscribe to the same store, so toggling from anywhere (TopBar, Settings,
// command palette) keeps every instance — and the color-theme vars — in sync.
const listeners = new Set<() => void>();
const isDark = () => document.documentElement.classList.contains('dark');

function setDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  // Re-apply the active color theme for the new mode so its tinted vars stay in
  // step with the base light/dark theme.
  applyColorTheme(getColorTheme(), dark);
  try {
    localStorage.setItem(KEY, dark ? 'dark' : 'light');
  } catch {
    /* non-fatal */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return { dark, toggle: () => setDark(!isDark()) };
}
