'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/icons';

type Variant = 'success' | 'error' | 'info';

type ToastInput = { variant?: Variant; title: string; description?: string };
type ToastItem = ToastInput & { id: number; variant: Variant };

const DURATION = 4400;

const ToastContext = createContext<{ push: (toast: ToastInput) => void } | undefined>(undefined);

const look: Record<Variant, { icon: IconName; tile: string }> = {
  success: { icon: 'check', tile: 'from-brand-400 to-brand-600 shadow-[0_6px_14px_-4px_rgb(16_185_129/0.7)]' },
  error: { icon: 'x', tile: 'from-rose-400 to-rose-600 shadow-[0_6px_14px_-4px_rgb(244_63_94/0.7)]' },
  info: { icon: 'info', tile: 'from-sky-400 to-sky-600 shadow-[0_6px_14px_-4px_rgb(14_165_233/0.7)]' },
};

/**
 * Lightweight toast system for confirming actions ("Customer added"). Calm
 * by design: glass card, one clear message, auto-dismiss with a visible
 * countdown bar, never blocks the page.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = ++counter.current;
      setToasts((current) => [...current.slice(-2), { ...toast, id, variant: toast.variant ?? 'success' }]);
      window.setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2.5"
      >
        {toasts.map((toast) => {
          const style = look[toast.variant];
          return (
            <div
              key={toast.id}
              role={toast.variant === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto relative animate-toast-in overflow-hidden rounded-2xl border border-line bg-surface/90 shadow-pop backdrop-blur-xl"
            >
              <div className="flex items-start gap-3 p-4">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-b text-white ${style.tile}`}
                >
                  <Icon name={style.icon} className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-ink">{toast.title}</p>
                  {toast.description && <p className="mt-0.5 text-[13px] leading-5 text-ink-3">{toast.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="-mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-lg text-ink-4 transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-brand-400 to-teal-500"
                style={{ animation: `rf-shrink ${DURATION}ms linear forwards` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

/**
 * Fires a success toast every time a form action reports success. `state`
 * comes from useFormState, so each submission is a fresh object.
 */
export function useActionToast(state: { success?: boolean }, message: { title: string; description?: string }) {
  const { push } = useToast();
  const messageRef = useRef(message);
  messageRef.current = message;

  useEffect(() => {
    if (state.success) push({ variant: 'success', ...messageRef.current });
  }, [state, push]);
}
