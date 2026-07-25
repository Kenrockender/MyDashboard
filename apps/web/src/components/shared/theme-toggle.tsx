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
      className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-hair text-ink-muted transition-colors hover:text-ink"
    >
      {theme === 'dark' ? (
        <SunIcon className="h-[17px] w-[17px]" />
      ) : (
        <MoonIcon className="h-[17px] w-[17px]" />
      )}
    </button>
  );
}
