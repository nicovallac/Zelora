import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextValue {
  toasts: Toast[];
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'DISMISS'; id: string };

const MAX_TOASTS = 5;

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case 'ADD': {
      const next = [action.toast, ...state];
      return next.slice(0, MAX_TOASTS);
    }
    case 'DISMISS':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = crypto.randomUUID();
      const toast: Toast = { id, type, title, message, duration };
      dispatch({ type: 'ADD', toast });
      setTimeout(() => dispatch({ type: 'DISMISS', id }), duration);
    },
    []
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => addToast('success', title, message),
    [addToast]
  );
  const showError = useCallback(
    (title: string, message?: string) => addToast('error', title, message),
    [addToast]
  );
  const showWarning = useCallback(
    (title: string, message?: string) => addToast('warning', title, message),
    [addToast]
  );
  const showInfo = useCallback(
    (title: string, message?: string) => addToast('info', title, message),
    [addToast]
  );
  const dismiss = useCallback(
    (id: string) => dispatch({ type: 'DISMISS', id }),
    []
  );

  return (
    <NotificationContext.Provider
      value={{ toasts, showSuccess, showError, showWarning, showInfo, dismiss }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
