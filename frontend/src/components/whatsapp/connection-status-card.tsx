import { Activity, CheckCircle2, Link2Off, ShieldCheck, Smartphone } from 'lucide-react';
import type { WhatsAppConnection } from '../../data/whatsapp-management';
import { LimitStatusBadge } from './limit-status-badge';
import { QualityBadge } from './quality-badge';

const STATUS_STYLE: Record<WhatsAppConnection['connectionStatus'], string> = {
  not_connected: 'bg-[rgba(17,17,16,0.06)] text-ink-600',
  connecting: 'bg-sky-100 text-sky-700',
  connected: 'bg-emerald-100 text-emerald-700',
  degraded: 'bg-amber-100 text-amber-700',
  disconnected: 'bg-red-100 text-red-600',
  requires_attention: 'bg-orange-100 text-orange-700',
};

export function ConnectionStatusCard({ connection }: { connection: WhatsAppConnection }) {
  const kpis = [
    { label: 'Connected number', value: connection.displayPhoneNumber ?? 'Sin número', icon: Smartphone },
    { label: 'Webhook', value: connection.webhookStatus, icon: ShieldCheck },
    { label: 'Template sync', value: connection.templateSyncStatus, icon: CheckCircle2 },
    { label: 'Last webhook', value: connection.lastWebhookReceivedAt ? new Date(connection.lastWebhookReceivedAt).toLocaleString('es-CO') : '-', icon: Activity },
  ];

  return (
    <div className="rounded-[28px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-6 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-card">
              <Link2Off size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-400">WhatsApp Business</p>
              <h2 className="text-xl font-bold text-ink-900">{connection.verifiedName ?? 'Sin verificar'}</h2>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[connection.connectionStatus]}`}>
              {connection.connectionStatus.replaceAll('_', ' ')}
            </span>
            <QualityBadge value={connection.qualityStatus} />
            <LimitStatusBadge value={connection.messagingLimitStatus} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[440px]">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-ink-400">
                  <Icon size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-wide">{kpi.label}</span>
                </div>
                <p className="text-sm font-semibold text-ink-900">{kpi.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
