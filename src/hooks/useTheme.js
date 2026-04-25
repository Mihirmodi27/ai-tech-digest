import { useState, useEffect } from 'react';

const ORDER = ['dark', 'light', 'creative'];

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('digest-theme');
    return ORDER.includes(stored) ? stored : 'dark';
  });

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('light', theme === 'light');
    html.classList.toggle('creative', theme === 'creative');
    localStorage.setItem('digest-theme', theme);
  }, [theme]);

  const toggle = () =>
    setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]);

  return { theme, toggle };
}
