import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export const useTheme = () => {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      body.classList.remove('light');
      body.classList.add('dark');
      root.style.setProperty('--bg', '#000000');
      root.style.setProperty('--surface', '#111827');
      root.style.setProperty('--border', '#1E293B');
      root.style.setProperty('--sidebar', '#0D1424');
      root.style.setProperty('--text-primary', '#e2e2d6');
      root.style.setProperty('--text-muted', '#94A3B8');
      root.style.setProperty('--input-bg', '#000000');
    } else {
      body.classList.remove('dark');
      body.classList.add('light');
      root.style.setProperty('--bg', '#e2e2d6');
      root.style.setProperty('--surface', '#d8d8cc');
      root.style.setProperty('--border', '#c8c8bc');
      root.style.setProperty('--sidebar', '#d4d4c8');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-muted', '#555550');
      root.style.setProperty('--input-bg', '#e8e8dc');
    }
  }, [isDark]);

  return { isDark };
};
