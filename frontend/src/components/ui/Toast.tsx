import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import type { Toast, ToastType } from '../../contexts/NotificationContext';

interface ToastConfig {
  bg: string;
  border: string;
  text: string;
  iconColor: string;
  bar: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CONFIG: Record<ToastType, ToastConfig> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    iconColor: 'text-emerald-500',
    bar: 'bg-emerald-400',
    Icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-500',
    bar: 'bg-red-400',
    Icon: XCircle,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    iconColor: 'text-amber-500',
    bar: 'bg-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-500',
    bar: 'bg-blue-400',
    Icon: Info,
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useNotification();
  const cfg = CONFIG[toast.type];
  const duration = toast.duration ?? 4000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-2xl border shadow-card ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-3 p-4">
        <cfg.Icon size={18} className={`mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold leading-snug ${cfg.text}`}>{toast.title}</p>
          {toast.message && (
            <p className={`mt-0.5 text-xs leading-snug opacity-80 ${cfg.text}`}>{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => dismiss(toast.id)}
          className={`flex-shrink-0 rounded-full p-0.5 transition hover:opacity-70 ${cfg.text}`}
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts } = useNotification();

  return (
    <div className="fixed bottom-20 right-3 z-[9999] flex flex-col gap-2 lg:bottom-4 lg:right-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
