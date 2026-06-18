import { useEffect, useState } from 'react';

const KEY = 'forage.theme';

export function useTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light');
    } catch {
      /* non-fatal */
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
