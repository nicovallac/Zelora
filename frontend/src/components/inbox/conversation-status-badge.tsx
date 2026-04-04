import type { InboxCommercialStatus } from './types';

const STATUS_STYLES: Record<InboxCommercialStatus, string> = {
  nuevo: 'bg-blue-100/80 text-blue-800',
  en_conversacion: 'bg-brand-100/80 text-brand-700',
  interesado: 'bg-violet-100/80 text-violet-800',
  esperando_respuesta: 'bg-amber-100/80 text-amber-800',
  escalado: 'bg-orange-100/80 text-orange-800',
  cerrado: 'bg-[rgba(17,17,16,0.06)] text-ink-700',
  venta_lograda: 'bg-emerald-100/80 text-emerald-800',
  perdido: 'bg-rose-100/80 text-rose-800',
};

const STATUS_LABELS: Record<InboxCommercialStatus, string> = {
  nuevo: 'Nuevo',
  en_conversacion: 'En conversacion',
  interesado: 'Interesado',
  esperando_respuesta: 'Esperando',
  escalado: 'Escalado',
  cerrado: 'Cerrado',
  venta_lograda: 'Venta lograda',
  perdido: 'Perdido',
};

export function ConversationStatusBadge({ status }: { status: InboxCommercialStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export { STATUS_LABELS as INBOX_STATUS_LABELS };
