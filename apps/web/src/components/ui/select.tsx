'use client';
import { useEffect, useRef, useState } from 'react';
import { inputClass } from '@/lib/ui';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A custom-styled dropdown standing in for the browser's native `<select>`
 * (whose popup/option list can't be restyled at all — it always renders in
 * the OS's own UI, not the app's). Same value/onChange shape as a native
 * select, so call sites just swap the element.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  'aria-label': ariaLabel,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  'aria-label'?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const allOptions: SelectOption[] = placeholder
    ? [{ value: '', label: placeholder }, ...options]
    : options;
  const selectedIndex = allOptions.findIndex((o) => o.value === value);
  const selected = allOptions[selectedIndex];

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function openList() {
    setOpen(true);
    setHighlighted(Math.max(0, selectedIndex));
  }

  function selectOption(index: number) {
    const option = allOptions[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => Math.min(allOptions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectOption(highlighted);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${selected?.value ? '' : 'text-ink-muted'}`}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          aria-hidden="true"
          className="flex-none text-ink-muted"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-60 w-full min-w-max overflow-auto rounded-lg border border-border bg-paper-raised py-1 shadow-lg"
        >
          {allOptions.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => selectOption(index)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index === highlighted ? 'bg-accent-soft text-accent' : 'text-ink'
              } ${option.value === value ? 'font-medium' : ''}`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
