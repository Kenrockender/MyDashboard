'use client';

import { useSyncExternalStore } from 'react';
import { SunIcon, MoonIcon } from './icons';

type Theme = 'light' | 'dark';

function getSnapshot(): Theme {
  const stored = window.localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

function subscribe(callback: () => void) {
  window.addEventListener('theme-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('theme-change', callback);
    window.removeEventListener('storage', callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    window.dispatchEvent(new Event('theme-change'));
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-ink-muted hover:text-ink"
    >
      {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
