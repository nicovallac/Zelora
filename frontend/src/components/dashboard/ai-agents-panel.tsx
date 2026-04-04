import { ShoppingCart, Megaphone, Settings2, Zap, Clock, TrendingUp, Lock } from 'lucide-react';

interface AgentStat {
  label: string;
  value: string;
}

interface AIAgentCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  name: string;
  role: string;
  description: string;
  status: 'active' | 'soon';
  stats: AgentStat[];
  badge?: string;
}

function AIAgentCard({ icon: Icon, color, bgColor, name, role, description, status, stats, badge }: AIAgentCardProps) {
  const isActive = status === 'active';

  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-5 transition-all duration-200 ${
        isActive
          ? 'border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 shadow-card backdrop-blur-md'
          : 'border-[rgba(255,255,255,0.40)] border-b-[rgba(17,17,16,0.05)] bg-white/35 backdrop-blur-sm'
      }`}
    >
      {/* Soon overlay */}
      {!isActive && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl" style={{ background: 'rgba(236,234,228,0.65)', backdropFilter: 'blur(2px)' }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-200/60">
            <Lock size={14} className="text-ink-400" />
          </div>
          <p className="mt-2 text-[12px] font-bold text-ink-500">Próximamente</p>
          <p className="mt-0.5 text-[11px] text-ink-400">En desarrollo</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-card"
          style={{ background: bgColor }}
        >
          <Icon size={16} className={color} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-ink-900">{name}</p>
            {badge && (
              <span className="rounded-full bg-brand-100/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-600">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-ink-400">{role}</p>
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' : 'bg-ink-300'}`}
          />
          <span className={`text-[10px] font-semibold ${isActive ? 'text-emerald-600' : 'text-ink-400'}`}>
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-[12px] leading-relaxed text-ink-400">{description}</p>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl px-3 py-2.5"
            style={{ background: 'rgba(17,17,16,0.03)', border: '1px solid rgba(17,17,16,0.06)' }}
          >
            <p className="text-[18px] font-bold leading-none tracking-tight text-ink-900" style={{ letterSpacing: '-0.02em' }}>
              {stat.value}
            </p>
            <p className="mt-1 text-[10px] text-ink-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AIAgentsPanelProps {
  conversationsHandled: number;
  opportunitiesDetected: number;
  avgResponseTime: string;
  conversationsResolved: number;
}

export function AIAgentsPanel({
  conversationsHandled,
  opportunitiesDetected,
  avgResponseTime,
  conversationsResolved,
}: AIAgentsPanelProps) {
  const agents: AIAgentCardProps[] = [
    {
      icon: ShoppingCart,
      color: 'text-brand-600',
      bgColor: '#ede9fe',
      name: 'Sales Agent',
      role: 'Agente de ventas',
      description: 'Detecta intención de compra, responde objeciones, cierra ventas y hace seguimiento en cada conversación.',
      status: 'active',
      badge: 'Live',
      stats: [
        { label: 'Conversaciones', value: conversationsHandled > 0 ? String(conversationsHandled) : '—' },
        { label: 'Oportunidades', value: opportunitiesDetected > 0 ? String(opportunitiesDetected) : '—' },
        { label: 'Resueltas', value: conversationsResolved > 0 ? String(conversationsResolved) : '—' },
        { label: 'T. respuesta', value: avgResponseTime },
      ],
    },
    {
      icon: Megaphone,
      color: 'text-amber-600',
      bgColor: '#fef3c7',
      name: 'Marketing Agent',
      role: 'Agente de marketing',
      description: 'Lanza campañas, segmenta audiencias, califica leads y optimiza mensajes para maximizar conversión.',
      status: 'soon',
      stats: [
        { label: 'Campañas', value: '—' },
        { label: 'Leads calificados', value: '—' },
        { label: 'Tasa apertura', value: '—' },
        { label: 'Conversiones', value: '—' },
      ],
    },
    {
      icon: Settings2,
      color: 'text-sky-600',
      bgColor: '#e0f2fe',
      name: 'Operations Agent',
      role: 'Agente de operaciones',
      description: 'Procesa pedidos, controla stock, gestiona incidencias y coordina el fulfillment sin intervención manual.',
      status: 'soon',
      stats: [
        { label: 'Pedidos procesados', value: '—' },
        { label: 'Alertas de stock', value: '—' },
        { label: 'Incidencias', value: '—' },
        { label: 'SLA cumplido', value: '—' },
      ],
    },
  ];

  return (
    <div
      className="rounded-3xl border p-5"
      style={{ border: '1px solid rgba(17,17,16,0.08)', background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(12px)' }}
    >
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-100/80">
            <Zap size={13} className="text-brand-600" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink-900" style={{ letterSpacing: '-0.01em' }}>
              Tus agentes de IA
            </p>
            <p className="text-[11px] text-ink-400">1 activo · 2 en desarrollo</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-brand-50/80 px-3 py-1">
          <Clock size={10} className="text-brand-500" />
          <span className="text-[10px] font-semibold text-brand-600">Trabajando ahora</span>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <AIAgentCard key={agent.name} {...agent} />
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-4 flex items-center gap-1.5 border-t border-[rgba(17,17,16,0.05)] pt-3">
        <TrendingUp size={11} className="text-ink-400" />
        <p className="text-[11px] text-ink-400">
          Los agentes trabajan en paralelo con tu equipo humano. El Sales Agent ya esta activo en tu inbox.
        </p>
      </div>
    </div>
  );
}
