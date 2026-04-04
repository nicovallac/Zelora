import type { HealthEvent } from '../../data/whatsapp-management';

const STATUS_STYLES: Record<HealthEvent['status'], string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  disconnected: 'bg-red-500',
  requires_attention: 'bg-orange-500',
  warning: 'bg-amber-500',
};

export function HealthTimeline({ events }: { events: HealthEvent[] }) {
  return (
    <div className="rounded-[24px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-400">Health timeline</p>
      <h3 className="mt-1 text-lg font-bold text-ink-900">Cambios recientes</h3>
      <div className="mt-5 space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`mt-1 h-3 w-3 rounded-full ${STATUS_STYLES[event.status]}`} />
              {index < events.length - 1 && <div className="mt-1 w-px flex-1 bg-slate-200" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-ink-900">{event.title}</p>
              <p className="mt-1 text-xs text-ink-400">{new Date(event.timestamp).toLocaleString('es-CO')}</p>
              <p className="mt-1 text-xs text-ink-600">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
