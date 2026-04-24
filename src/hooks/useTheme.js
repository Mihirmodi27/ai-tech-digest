import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('digest-theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('digest-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggle };
}
