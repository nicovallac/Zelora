import { Zap, MessageSquare, Target, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AgentPerformanceProps {
  conversationsHandled: number;
  opportunitiesDetected: number;
  conversationsResolved: number;
  avgResponseTime: string;
  handoffs: number;
  avgConfidencePct: number;
  periodDays: number;
}

interface StatRowProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}

function StatRow({ icon: Icon, label, value, sub }: StatRowProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: 'rgba(17,17,16,0.025)', border: '1px solid rgba(17,17,16,0.05)' }}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100/60 text-brand-600">
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase text-ink-400" style={{ letterSpacing: '0.10em' }}>
          {label}
        </p>
        {sub && <p className="text-[10px] text-ink-300">{sub}</p>}
      </div>
      <p
        className="shrink-0 text-[20px] font-bold text-ink-900"
        style={{ letterSpacing: '-0.025em' }}
      >
        {value}
      </p>
    </div>
  );
}

export function AgentPerformance({
  conversationsHandled,
  opportunitiesDetected,
  conversationsResolved,
  avgResponseTime,
  handoffs,
  avgConfidencePct,
  periodDays,
}: AgentPerformanceProps) {
  return (
    <div
      className="flex flex-col rounded-3xl p-5 sm:p-6"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(255,255,255,0.55)',
        borderBottomColor: 'rgba(17,17,16,0.08)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 6px 18px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: '#ede9fe', boxShadow: '0 1px 3px rgba(124,58,237,0.15)' }}
          >
            <Zap size={16} className="text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-bold text-ink-900" style={{ letterSpacing: '-0.01em' }}>
                Sales Agent
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase text-brand-600"
                style={{ background: 'rgba(124,58,237,0.10)', letterSpacing: '0.10em' }}
              >
                Live
              </span>
            </div>
            <p className="text-[11px] text-ink-400">
              Últimos {periodDays > 0 ? `${periodDays} días` : 'datos disponibles'}
            </p>
          </div>
        </div>

        {/* Active indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-emerald-500"
            style={{ boxShadow: '0 0 0 3px rgba(16,185,129,0.15)' }}
          />
          <span className="text-[10px] font-semibold text-emerald-600">Activo</span>
        </div>
      </div>

      {/* Confidence badge */}
      {avgConfidencePct > 0 && (
        <div
          className="mt-4 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(139,92,246,0.03) 100%)', border: '1px solid rgba(124,58,237,0.10)' }}
        >
          <p className="text-[10px] font-semibold uppercase text-brand-500" style={{ letterSpacing: '0.12em' }}>
            Confianza promedio
          </p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-[28px] font-bold text-brand-700" style={{ letterSpacing: '-0.03em' }}>
              {Math.round(avgConfidencePct)}%
            </p>
            <p className="mb-1 text-[11px] text-brand-500">de precisión en respuestas</p>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-700"
              style={{ width: `${Math.min(100, avgConfidencePct)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 flex flex-col gap-2">
        <StatRow
          icon={MessageSquare}
          label="Conversaciones"
          value={conversationsHandled > 0 ? conversationsHandled : '—'}
        />
        <StatRow
          icon={Target}
          label="Oportunidades"
          value={opportunitiesDetected > 0 ? opportunitiesDetected : '—'}
          sub="leads calificados"
        />
        <StatRow
          icon={CheckCircle2}
          label="Resueltas"
          value={conversationsResolved > 0 ? conversationsResolved : '—'}
          sub="sin intervención"
        />
        <StatRow
          icon={Clock}
          label="T. respuesta"
          value={avgResponseTime}
          sub="tiempo promedio"
        />
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4">
        <div
          className="flex items-center justify-between border-t pt-3"
          style={{ borderColor: 'rgba(17,17,16,0.06)' }}
        >
          <p className="text-[11px] text-ink-400">
            {handoffs > 0 ? `${handoffs} derivaciones a humano` : 'Operando sin interrupciones'}
          </p>
          <Link
            to="/admin/organizations"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-500"
          >
            Ver ajustes
            <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
