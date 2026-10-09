'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@/lib/brand';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = STORAGE_KEYS.theme;

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  // Briefly enable cross-fading on every surface so the switch feels
  // intentional rather than a hard flip (see .theme-transition in globals.css).
  root.classList.add('theme-transition');
  root.classList.toggle('dark', theme === 'dark');
  window.setTimeout(() => root.classList.remove('theme-transition'), 300);
}

/**
 * Dark is the product's default look. The initial theme is resolved
 * synchronously before paint by an inline script in the root layout (see
 * THEME_BOOTSTRAP_SCRIPT), so there is no flash of the wrong theme. This
 * provider keeps React state in sync with whatever that script applied to
 * <html>, and persists an explicit choice (the toggle) to localStorage.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Matches the default; the effect below corrects it for anyone who chose light.
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // On mount, read back whatever the inline bootstrap script already
    // applied to <html class="dark"> so React state matches the DOM
    // instead of forcing a re-render/flash.
    const isDark = document.documentElement.classList.contains('dark');
    setThemeState(isDark ? 'dark' : 'light');
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyThemeClass(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore (private browsing / storage disabled) — theme just won't
      // persist across reloads, which is a reasonable degradation.
    }
  };

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Inline script source, inlined directly in the root layout's <head> (not
 * loaded as a separate component) so it runs before first paint and avoids
 * a flash of the wrong theme. Dark by default; the only thing that switches
 * it to light is an explicit choice stored by the theme toggle (this also
 * means storage being unavailable still yields dark, not a broken state).
 */
export const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  var theme = 'dark';
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    if (stored === 'light' || stored === 'dark') theme = stored;
  } catch (e) {}
  if (theme === 'dark') document.documentElement.classList.add('dark');
})();
`;
