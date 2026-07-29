'use client';
import { useEffect, useRef, useState } from 'react';
import { useOverdueIncome } from '@/hooks/use-notifications';
import { BellIcon } from './icons';
import { NotificationList } from './notification-list';

export function NotificationBell() {
  const { data } = useOverdueIncome();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const count = data?.entries.length ?? 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `${count} overdue income notification${count === 1 ? '' : 's'}` : 'Notifications'}
        className="relative inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-hair text-ink-muted transition-colors hover:text-ink"
      >
        <BellIcon className="h-[17px] w-[17px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 font-mono text-[9px] text-paper">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-80 max-w-[90vw] overflow-hidden rounded-[14px] border border-border bg-paper-raised shadow-lg">
          <NotificationList entries={data?.entries ?? []} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
