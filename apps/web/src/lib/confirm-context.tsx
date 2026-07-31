'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button, LinkButton } from '@/components/ui/button';

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `negative` for destructive actions (delete, archive); `accent` otherwise. */
  tone?: 'negative' | 'accent';
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    const resolved = typeof options === 'string' ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setPending({ ...resolved, resolve });
    });
  }, []);

  function settle(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  useEffect(() => {
    if (!pending) return;
    confirmButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') settle(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => settle(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-message"
            className="w-full max-w-sm rounded-[14px] border border-border bg-paper-raised p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {pending.title && (
              <h2 className="font-display text-lg italic text-ink">{pending.title}</h2>
            )}
            <p
              id="confirm-dialog-message"
              className={`text-sm text-ink-muted ${pending.title ? 'mt-1.5' : ''}`}
            >
              {pending.message}
            </p>
            <div className="mt-5 flex justify-end gap-4">
              <LinkButton onClick={() => settle(false)}>{pending.cancelLabel ?? 'Cancel'}</LinkButton>
              <Button
                ref={confirmButtonRef}
                variant={pending.tone === 'negative' ? 'negative' : 'primary'}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

/** Drop-in replacement for `window.confirm`, styled to match the app instead of the browser chrome. */
export function useConfirm() {
  return useContext(ConfirmContext);
}
