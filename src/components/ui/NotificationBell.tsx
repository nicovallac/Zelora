import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import type { ToastType } from '../../contexts/NotificationContext';

function timeAgo(id: string): string {
  // id is a UUID; we just show "ahora" since toasts are ephemeral
  // In a real app you'd store timestamps — for now derive a rough time from position
  void id;
  return 'ahora';
}

const DOT_COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export function NotificationBell() {
  const { toasts, dismiss } = useNotification();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const count = toasts.length;

  function clearAll() {
    toasts.forEach((t) => dismiss(t.id));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        title="Notificaciones"
      >
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-xs font-bold text-slate-800">Notificaciones</p>
            {count > 0 && (
              <button
                onClick={clearAll}
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <Bell size={24} className="text-slate-300" />
                <p className="text-xs text-slate-400">No hay notificaciones</p>
              </div>
            ) : (
              toasts.map((toast) => (
                <div
                  key={toast.id}
                  className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 last:border-b-0 hover:bg-slate-50 transition"
                >
                  <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${DOT_COLORS[toast.type]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{toast.title}</p>
                    {toast.message && (
                      <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">{toast.message}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(toast.id)}</p>
                  </div>
                  <button
                    onClick={() => dismiss(toast.id)}
                    className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition text-xs"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
