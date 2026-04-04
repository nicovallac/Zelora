import { Activity, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import type { WebhookDiagnostic, WebhookStatus } from '../../data/whatsapp-management';

const STATUS_META: Record<WebhookStatus, { icon: typeof ShieldCheck; style: string }> = {
  verified: { icon: ShieldCheck, style: 'bg-emerald-100 text-emerald-700' },
  pending: { icon: Activity, style: 'bg-sky-100 text-sky-700' },
  failed: { icon: ShieldX, style: 'bg-red-100 text-red-600' },
  stale: { icon: ShieldAlert, style: 'bg-amber-100 text-amber-700' },
};

export function WebhookHealthCard({
  status,
  endpoint,
  lastWebhookReceivedAt,
  diagnostics,
}: {
  status: WebhookStatus;
  endpoint: string;
  lastWebhookReceivedAt: string | null;
  diagnostics: WebhookDiagnostic[];
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <div className="rounded-[24px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-400">Webhook</p>
          <h3 className="mt-1 text-lg font-bold text-ink-900">Estado y diagnóstico</h3>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${meta.style}`}>
          <Icon size={13} />
          {status}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Endpoint</p>
          <p className="mt-1 break-all font-mono text-xs text-ink-700">{endpoint}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Last webhook received</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">
            {lastWebhookReceivedAt ? new Date(lastWebhookReceivedAt).toLocaleString('es-CO') : '-'}
          </p>
        </div>
        <div className="space-y-2">
          {diagnostics.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3">
              <p className="text-sm font-semibold text-ink-900">{item.title}</p>
              <p className="mt-1 text-xs text-ink-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
