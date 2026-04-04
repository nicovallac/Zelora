import { RefreshCw } from 'lucide-react';

export function ReconnectBanner({
  visible,
  onReconnect,
}: {
  visible: boolean;
  onReconnect: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-900">La conexión requiere atención</p>
          <p className="mt-1 text-xs text-brand-800">
            Hay señales de degradación en calidad o webhook. Revisa el estado y ejecuta una reconexión controlada si hace falta.
          </p>
        </div>
        <button
          onClick={onReconnect}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <RefreshCw size={14} />
          Reconnect
        </button>
      </div>
    </div>
  );
}
