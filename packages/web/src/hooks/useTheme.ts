import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('lg-theme');
  if (stored === 'light' || stored === 'dark')
    return stored;
  return getSystemTheme();
}

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getInitialTheme);

  const applyTheme = useCallback((t: Theme) => {
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (!localStorage.getItem('lg-theme')) {
        setCurrentTheme(getSystemTheme());
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem('lg-theme', t);
    setCurrentTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }, [currentTheme, setTheme]);

  return { theme: currentTheme, setTheme, toggleTheme };
}
