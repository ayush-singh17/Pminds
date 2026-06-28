import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export const useTheme = () => {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--bg', '#0A0F1E');
      root.style.setProperty('--surface', '#111827');
      root.style.setProperty('--border', '#1E293B');
      root.style.setProperty('--sidebar', '#0D1424');
      root.style.setProperty('--text-primary', '#F8FAFC');
      root.style.setProperty('--text-muted', '#94A3B8');
      root.style.setProperty('--input-bg', '#0A0F1E');
    } else {
      root.style.setProperty('--bg', '#F8FAFC');
      root.style.setProperty('--surface', '#FFFFFF');
      root.style.setProperty('--border', '#E2E8F0');
      root.style.setProperty('--sidebar', '#F1F5F9');
      root.style.setProperty('--text-primary', '#0F172A');
      root.style.setProperty('--text-muted', '#64748B');
      root.style.setProperty('--input-bg', '#F8FAFC');
    }
  }, [isDark]);

  return { isDark };
};
