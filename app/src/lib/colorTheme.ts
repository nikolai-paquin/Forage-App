// Optional color themes — recolor the app's background + accent, like Slack
// themes. Applied as inline CSS-variable overrides on <html>, with light/dark
// variants, so they cooperate with the existing light/dark system.
const KEY = 'forage.colorTheme';

const PROPS = [
  '--canvas',
  '--surface',
  '--surface-2',
  '--accent',
  '--accent-2',
  '--accent-bright',
  '--accent-ink',
  '--accent-soft',
] as const;

type Vars = Partial<Record<(typeof PROPS)[number], string>>;

export interface ColorTheme {
  id: string;
  name: string;
  swatch: string; // preview dot
  light: Vars;
  dark: Vars;
}

// Note: we deliberately don't override --accent-ink. Primary CTAs use var(--ink)
// (monochrome, theme-independent), so --accent-ink keeps its base value and stays
// readable on ink in both light and dark modes. Color themes only tint backgrounds
// and the soft accent surfaces.
const accent = (c: string, soft: string): Vars => ({
  '--accent': c,
  '--accent-2': c,
  '--accent-bright': c,
  '--accent-soft': soft,
});

export const COLOR_THEMES: ColorTheme[] = [
  { id: 'classic', name: 'Classic', swatch: '#16171b', light: {}, dark: {} },
  {
    id: 'warm',
    name: 'Warm Paper',
    swatch: '#b85c3c',
    light: { '--canvas': '#f4efe6', '--surface': '#fcf9f3', '--surface-2': '#ece4d6', ...accent('#b85c3c', 'rgba(184,92,60,0.10)') },
    dark: { '--canvas': '#14110c', '--surface': '#1c1813', '--surface-2': '#261f17', ...accent('#d8794f', 'rgba(216,121,79,0.16)') },
  },
  {
    id: 'sage',
    name: 'Sage',
    swatch: '#4f7d57',
    light: { '--canvas': '#eef1ec', '--surface': '#fbfcfa', '--surface-2': '#e2e8df', ...accent('#4f7d57', 'rgba(79,125,87,0.10)') },
    dark: { '--canvas': '#0d0f0d', '--surface': '#161915', '--surface-2': '#1f231d', ...accent('#6fa676', 'rgba(111,166,118,0.16)') },
  },
  {
    id: 'sky',
    name: 'Sky',
    swatch: '#4f6fc2',
    light: { '--canvas': '#eef1f6', '--surface': '#fbfcff', '--surface-2': '#e1e7f0', ...accent('#4f6fc2', 'rgba(79,111,194,0.10)') },
    dark: { '--canvas': '#0c0e12', '--surface': '#15171c', '--surface-2': '#1e2228', ...accent('#6f8fe0', 'rgba(111,143,224,0.16)') },
  },
  {
    id: 'lilac',
    name: 'Lilac',
    swatch: '#7a5cc2',
    light: { '--canvas': '#f2eef6', '--surface': '#fdfbff', '--surface-2': '#e8e1f0', ...accent('#7a5cc2', 'rgba(122,92,194,0.10)') },
    dark: { '--canvas': '#0f0d12', '--surface': '#18151c', '--surface-2': '#221d28', ...accent('#9f82d9', 'rgba(159,130,217,0.16)') },
  },
  {
    id: 'rose',
    name: 'Rose',
    swatch: '#c24f6f',
    light: { '--canvas': '#f6eef0', '--surface': '#fffbfc', '--surface-2': '#f0e1e6', ...accent('#c24f6f', 'rgba(194,79,111,0.10)') },
    dark: { '--canvas': '#120d0f', '--surface': '#1c1518', '--surface-2': '#281d22', ...accent('#e07f9b', 'rgba(224,127,155,0.16)') },
  },
];

export function getColorTheme(): string {
  try {
    return localStorage.getItem(KEY) || 'classic';
  } catch {
    return 'classic';
  }
}

export function setColorTheme(id: string) {
  try {
    if (id && id !== 'classic') localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    /* non-fatal */
  }
}

/** Apply a theme's variables for the current light/dark mode (or clear them). */
export function applyColorTheme(id: string, dark: boolean) {
  const root = document.documentElement;
  const theme = COLOR_THEMES.find((t) => t.id === id);
  const vars = theme && theme.id !== 'classic' ? (dark ? theme.dark : theme.light) : null;
  for (const p of PROPS) {
    if (vars && vars[p]) root.style.setProperty(p, vars[p]!);
    else root.style.removeProperty(p);
  }
}
