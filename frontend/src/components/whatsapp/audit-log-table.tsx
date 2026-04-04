import type { AuditEvent } from '../../data/whatsapp-management';

export function AuditLogTable({ events }: { events: AuditEvent[] }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md shadow-card">
      <table className="w-full text-sm">
        <thead className="border-b border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)]">
          <tr>
            {['Timestamp', 'Actor', 'Event type', 'Description', 'Related object'].map((header) => (
              <th key={header} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-ink-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(17,17,16,0.06)]">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-[rgba(17,17,16,0.025)] transition">
              <td className="px-4 py-3 text-xs text-ink-400">{new Date(event.timestamp).toLocaleString('es-CO')}</td>
              <td className="px-4 py-3 text-xs font-semibold text-ink-900">{event.actor}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-[rgba(17,17,16,0.06)] px-2.5 py-1 text-[10px] font-bold text-ink-700">{event.eventType}</span>
              </td>
              <td className="px-4 py-3 text-xs text-ink-600">{event.description}</td>
              <td className="px-4 py-3 font-mono text-[11px] text-ink-400">{event.relatedObject}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
