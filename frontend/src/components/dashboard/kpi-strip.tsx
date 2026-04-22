import { MessageSquare, BarChart2, Clock, Sparkles } from 'lucide-react';

interface KpiItem {
  label: string;
  value: string | number;
  hint: string;
  tone: 'default' | 'brand' | 'danger' | 'success';
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TONE_STYLES = {
  default: {
    card: 'bg-white/65',
    iconWrap: 'bg-ink-100/60 text-ink-500',
    value: 'text-ink-900',
  },
  brand: {
    card: 'bg-white/65',
    iconWrap: 'bg-brand-100/70 text-brand-600',
    value: 'text-brand-700',
  },
  danger: {
    card: 'bg-red-50/50',
    iconWrap: 'bg-red-100/70 text-red-600',
    value: 'text-red-700',
  },
  success: {
    card: 'bg-white/65',
    iconWrap: 'bg-emerald-100/60 text-emerald-600',
    value: 'text-ink-900',
  },
};

function KpiCard({ label, value, hint, tone, icon: Icon }: KpiItem) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-200 ${styles.card}`}
      style={{
        border: tone === 'danger'
          ? '1px solid rgba(239,68,68,0.20)'
          : '1px solid rgba(255,255,255,0.55)',
        borderBottomColor: tone === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(17,17,16,0.08)',
        backdropFilter: 'blur(12px)',
        boxShadow: tone === 'danger'
          ? '0 1px 2px rgba(239,68,68,0.04), 0 4px 12px rgba(239,68,68,0.06)'
          : '0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}>
          <Icon size={14} />
        </div>
        {tone === 'danger' && Number(value) > 0 && (
          <span className="flex h-2 w-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 0 3px rgba(239,68,68,0.15)', marginTop: 2 }} />
        )}
      </div>
      <p
        className={`mt-3 text-[28px] font-bold leading-none ${styles.value}`}
        style={{ letterSpacing: '-0.03em' }}
      >
        {value}
      </p>
      <p
        className="mt-1.5 text-[10px] font-semibold uppercase text-ink-400"
        style={{ letterSpacing: '0.10em' }}
      >
        {label}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{hint}</p>
    </div>
  );
}

interface KpiStripProps {
  activeConversations: number;
  totalConversations: number;
  pendingConversations: number;
  opportunities: number;
}

export function KpiStrip({ activeConversations, totalConversations, pendingConversations, opportunities }: KpiStripProps) {
  const items: KpiItem[] = [
    {
      label: 'Activas ahora',
      value: activeConversations,
      hint: 'Conversaciones abiertas en este momento',
      tone: activeConversations > 0 ? 'brand' : 'default',
      icon: MessageSquare,
    },
    {
      label: 'Totales',
      value: totalConversations,
      hint: 'Volumen acumulado del periodo actual',
      tone: 'default',
      icon: BarChart2,
    },
    {
      label: 'Pendientes',
      value: pendingConversations,
      hint: pendingConversations > 0 ? 'Sin respuesta · revisar primero' : 'Todo al dia por ahora',
      tone: pendingConversations > 0 ? 'danger' : 'success',
      icon: Clock,
    },
    {
      label: 'Oportunidades',
      value: opportunities,
      hint: 'Leads detectados por el agente de IA',
      tone: opportunities > 0 ? 'brand' : 'default',
      icon: Sparkles,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}
