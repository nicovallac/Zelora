import { RefreshCw } from 'lucide-react';
import type { SyncStatus, TemplateInfo } from '../../data/whatsapp-management';

const STATUS_STYLES: Record<SyncStatus, string> = {
  synced: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-sky-100 text-sky-700',
  failed: 'bg-red-100 text-red-600',
  never: 'bg-[rgba(17,17,16,0.06)] text-ink-400',
};

export function TemplateSyncCard({
  status,
  lastSyncAt,
  templates,
  onSync,
}: {
  status: SyncStatus;
  lastSyncAt: string | null;
  templates: TemplateInfo[];
  onSync: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-400">Templates</p>
          <h3 className="mt-1 text-lg font-bold text-ink-900">Template sync</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}>{status}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Template count</p>
          <p className="mt-1 text-xl font-bold text-ink-900">{templates.length}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Approved</p>
          <p className="mt-1 text-xl font-bold text-ink-900">{templates.filter((item) => item.status === 'approved').length}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Last sync</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">
            {lastSyncAt ? new Date(lastSyncAt).toLocaleString('es-CO') : '-'}
          </p>
        </div>
      </div>
      <button
        onClick={onSync}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]"
      >
        <RefreshCw size={14} />
        Sync templates
      </button>
    </div>
  );
}
