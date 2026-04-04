import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { Card } from '../ui/primitives';
import type { RecommendationItem } from './types';

export function RecommendedNextSteps({ items }: { items: RecommendationItem[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-brand-100/80 text-brand-600">
          <Compass size={13} />
        </div>
        <div>
          <h2
            className="text-[15px] font-bold leading-tight text-ink-900"
            style={{ letterSpacing: '-0.01em' }}
          >
            Proximos pasos
          </h2>
          <p className="text-[11px] text-ink-400">
            Acciones que empujan activacion y conversion.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl p-4 transition-all duration-150 hover:bg-white/30"
            style={{ border: '1px solid rgba(17,17,16,0.06)', background: 'rgba(17,17,16,0.02)' }}
          >
            <p className="text-[13px] font-semibold text-ink-800">{item.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{item.description}</p>
            <Link
              to={item.href}
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 transition-colors hover:text-brand-500"
            >
              {item.cta}
              <ArrowRight size={11} />
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}
