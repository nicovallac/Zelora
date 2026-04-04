import { Card } from '../ui/primitives';
import type { SummaryItem } from './types';

export function OperationalSummary({ items }: { items: SummaryItem[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <div>
        <h2
          className="text-[15px] font-bold leading-tight text-ink-900"
          style={{ letterSpacing: '-0.01em' }}
        >
          Resumen operativo
        </h2>
        <p className="mt-0.5 text-[11px] text-ink-400">
          Lo mas util del dia sin perderte en graficos ni paneles pesados.
        </p>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl p-4"
            style={{ border: '1px solid rgba(17,17,16,0.06)', background: 'rgba(17,17,16,0.025)' }}
          >
            <p className="lab-stat-label">{item.label}</p>
            <p className="lab-stat mt-2.5">{item.value}</p>
            <p className="mt-1.5 text-[11px] text-ink-400">{item.hint}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
