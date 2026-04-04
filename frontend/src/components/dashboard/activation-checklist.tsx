import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Card } from '../ui/primitives';
import type { ChecklistItem } from './types';

const STATUS_CLASSES = {
  pending:     'bg-ink-100/60 text-ink-400',
  in_progress: 'bg-amber-100/70 text-amber-600',
  completed:   'bg-brand-200/70 text-brand-700',
} as const;

const STATUS_LABELS = {
  pending:     'Pendiente',
  in_progress: 'En progreso',
  completed:   'Listo',
} as const;

interface ActivationChecklistProps {
  items: ChecklistItem[];
  emphasized?: boolean;
  loading?: boolean;
}

export function ActivationChecklist({ items, emphasized = false, loading = false }: ActivationChecklistProps) {
  return (
    <Card className={`p-5 sm:p-6 ${emphasized ? 'border-brand-200/60' : ''}`}>
      <div>
        <p className="page-eyebrow">Checklist de activacion</p>
        <h2
          className="text-[17px] font-bold leading-tight text-ink-900"
          style={{ letterSpacing: '-0.01em' }}
        >
          Lo siguiente para poner a correr Zelora
        </h2>
        <p className="mt-1 text-[12px] text-ink-400">
          Prioriza acciones utiles antes de seguir configurando detalles.
        </p>
      </div>

      {loading ? (
        <div
          className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-4 text-[12px] text-ink-500"
          style={{ border: '1px solid rgba(17,17,16,0.07)', background: 'rgba(255,255,255,0.5)' }}
        >
          <Loader2 size={13} className="animate-spin" />
          Cargando estado de activacion...
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl p-4 transition-all duration-150 hover:bg-white/30"
              style={{ border: '1px solid rgba(17,17,16,0.07)', background: 'rgba(255,255,255,0.45)' }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' ? (
                      <CheckCircle2 size={14} className="shrink-0 text-brand-500" />
                    ) : (
                      <Circle size={14} className="shrink-0 text-ink-300" />
                    )}
                    <p className="text-[13px] font-semibold text-ink-800">{item.title}</p>
                  </div>
                  <p className="mt-1 pl-[22px] text-[11px] text-ink-400">{item.description}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase ${STATUS_CLASSES[item.status]}`}
                    style={{ letterSpacing: '0.1em' }}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>

                  {item.onAction ? (
                    <button
                      onClick={item.onAction}
                      disabled={item.actionLoading}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-ink-700 transition-all duration-150 hover:-translate-y-px hover:bg-white disabled:opacity-50"
                      style={{ border: '1px solid rgba(17,17,16,0.12)', background: 'rgba(255,255,255,0.75)' }}
                    >
                      {item.actionLoading ? <Loader2 size={11} className="animate-spin" /> : null}
                      {item.actionLabel ?? 'Actualizar'}
                    </button>
                  ) : null}

                  {item.href ? (
                    <Link
                      to={item.href}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-ink-700 transition-all duration-150 hover:-translate-y-px hover:bg-white"
                      style={{ border: '1px solid rgba(17,17,16,0.12)', background: 'rgba(255,255,255,0.75)' }}
                    >
                      {item.cta}
                      <ArrowRight size={11} />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
