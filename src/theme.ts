// Hell-/Dunkelmodus: „auto“ folgt der Einstellung des Geräts.
export type Theme = 'auto' | 'light' | 'dark';

const KEY = 'bissfibel.theme';

export const THEME_LABEL: Record<Theme, string> = { auto: 'Automatisch', light: 'Hell', dark: 'Dunkel' };

export function nextTheme(t: Theme): Theme {
  return t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto';
}

export function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
  try {
    localStorage.setItem(KEY, t);
  } catch {
    // Speicher gesperrt (z. B. privater Modus): Auswahl gilt dann nur bis zum Neuladen.
  }
}
