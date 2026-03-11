import type { ActivityEvent } from '../../types/workspace';

export function ActivityItem({ event }: { event: ActivityEvent }) {
  return (
    <article className="rounded-lg border border-ink-100 bg-white p-3">
      <div className="flex items-center justify-between text-[11px] text-ink-400">
        <span>{event.channel}</span>
        <span>{new Date(event.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <p className="text-xs mt-1 text-ink-700">
        <span className="font-semibold">{event.actorName}</span> {event.action}
      </p>
      {event.relatedObject && <p className="text-[11px] text-ink-500 mt-1">Ref: {event.relatedObject}</p>}
    </article>
  );
}
