import { useEffect, useState } from 'react';
import { applyColorTheme, getColorTheme } from './colorTheme';

const KEY = 'forage.theme';

export function useTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    // Re-apply the active color theme for the new light/dark mode so its tinted
    // background/accent vars stay in sync with the base theme (otherwise the
    // inline vars stick to the previous mode and the UI looks broken).
    applyColorTheme(getColorTheme(), dark);
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light');
    } catch {
      /* non-fatal */
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
