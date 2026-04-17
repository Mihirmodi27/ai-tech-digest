import { useEffect } from 'react';

/**
 * Global keyboard shortcut handler.
 * Accepts a map of key → callback, plus deps array.
 */
export function useKeyboard(handlers, deps = []) {
  useEffect(() => {
    const handler = (e) => {
      // Don't capture when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const fn = handlers[e.key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, deps);
}
