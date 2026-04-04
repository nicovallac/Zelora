import type { PropsWithChildren } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Channel, OrderStatus, Sentiment, Status, StockStatus } from '../../types';

/* ─────────────────────────────────────────────────────────────
   CARD  — floating lab panel
───────────────────────────────────────────────────────────── */
export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-3xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] border-r-[rgba(17,17,16,0.05)] bg-white/65 shadow-card backdrop-blur-md ${className}`}
      style={{ boxShadow: 'var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.70)' }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION TITLE  — editorial heading + subtitle
───────────────────────────────────────────────────────────── */
export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1.5">
      <h2
        className="text-2xl font-bold leading-tight tracking-tight text-ink-900"
        style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      {subtitle ? <p className="text-[13px] text-ink-400">{subtitle}</p> : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAG  — system chip label
───────────────────────────────────────────────────────────── */
export function Tag({ text, color }: { text: string; color?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        color ?? 'bg-ink-50 text-ink-500'
      }`}
      style={{ letterSpacing: '0.1em' }}
    >
      {text}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   KPI CARD  — metric stat panel
───────────────────────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
}

export function KpiCard({ label, value, sub, trend, trendText }: KpiCardProps) {
  return (
    <Card className="p-5 sm:p-6">
      <p className="lab-stat-label">{label}</p>
      <p className="lab-stat mt-3">{value}</p>
      <div className="mt-2.5 flex items-center gap-2">
        {sub && <p className="text-[11px] text-ink-400">{sub}</p>}
        {trend && trend !== 'neutral' && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              trend === 'up'
                ? 'bg-brand-100 text-brand-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trendText}
          </span>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   STATUS BADGES  — pill system indicators
───────────────────────────────────────────────────────────── */
const statusConfig: Record<Status, { label: string; className: string }> = {
  nuevo:      { label: 'Nuevo',      className: 'bg-blue-50/80 text-blue-600' },
  en_proceso: { label: 'En proceso', className: 'bg-amber-50/80 text-amber-600' },
  escalado:   { label: 'Escalado',   className: 'bg-orange-50/80 text-orange-600' },
  resuelto:   { label: 'Resuelto',   className: 'bg-brand-50/80 text-brand-600' },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${cfg.className}`}
      style={{ letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* Channel badges */
const fallbackChannelConfig = { label: 'Canal', className: 'bg-ink-100/70 text-ink-500' };
const channelConfig: Record<Channel | 'app' | 'app-chat', { label: string; className: string }> = {
  app:        { label: 'App Chat',  className: 'bg-violet-50/80 text-violet-600' },
  'app-chat': { label: 'App Chat',  className: 'bg-violet-50/80 text-violet-600' },
  web:        { label: 'Web',       className: 'bg-sky-50/80 text-sky-600' },
  whatsapp:   { label: 'WhatsApp',  className: 'bg-emerald-50/80 text-emerald-600' },
  instagram:  { label: 'Instagram', className: 'bg-fuchsia-50/80 text-fuchsia-600' },
  tiktok:     { label: 'TikTok',   className: 'bg-ink-100/70 text-ink-600' },
};

export function ChannelBadge({ channel }: { channel: Channel | string }) {
  const key = channel.toLowerCase();
  const cfg = channelConfig[key as keyof typeof channelConfig] ?? {
    ...fallbackChannelConfig,
    label: channel || fallbackChannelConfig.label,
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${cfg.className}`}
      style={{ letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* Sentiment badges */
const sentimentConfig: Record<Sentiment, { label: string; className: string }> = {
  positivo: { label: 'Positivo', className: 'bg-brand-50/80 text-brand-700' },
  neutro:   { label: 'Neutro',   className: 'bg-ink-100/70 text-ink-500' },
  negativo: { label: 'Negativo', className: 'bg-red-50/80 text-red-600' },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const cfg = sentimentConfig[sentiment];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${cfg.className}`}
      style={{ letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* Stock badges */
const stockConfig: Record<StockStatus, { label: string; className: string }> = {
  in_stock:      { label: 'En stock',   className: 'bg-brand-50/80 text-brand-700' },
  low_stock:     { label: 'Stock bajo', className: 'bg-amber-50/80 text-amber-600' },
  out_of_stock:  { label: 'Agotado',    className: 'bg-red-50/80 text-red-600' },
};

export function StockBadge({ status }: { status: StockStatus }) {
  const cfg = stockConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${cfg.className}`}
      style={{ letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* Order status badges */
const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  new:        { label: 'Nuevo',          className: 'bg-sky-50/80 text-sky-600' },
  paid:       { label: 'Pagado',         className: 'bg-violet-50/80 text-violet-600' },
  processing: { label: 'En preparacion', className: 'bg-amber-50/80 text-amber-600' },
  shipped:    { label: 'Enviado',        className: 'bg-cyan-50/80 text-cyan-600' },
  delivered:  { label: 'Entregado',      className: 'bg-brand-50/80 text-brand-700' },
  cancelled:  { label: 'Cancelado',      className: 'bg-red-50/80 text-red-600' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = orderStatusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${cfg.className}`}
      style={{ letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   SKELETON  — loading placeholder
───────────────────────────────────────────────────────────── */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-ink-200/60 ${className}`} />
  );
}

/* ─────────────────────────────────────────────────────────────
   BUTTON  — capsule system
───────────────────────────────────────────────────────────── */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-500 focus:ring-brand-300 shadow-card font-semibold',
  secondary:
    'bg-white/80 text-ink-700 border border-[rgba(17,17,16,0.12)] hover:bg-white hover:border-[rgba(17,17,16,0.18)] focus:ring-ink-200 shadow-card backdrop-blur-sm',
  ghost:
    'bg-transparent text-ink-600 hover:bg-[rgba(17,17,16,0.05)] focus:ring-ink-200',
  danger:
    'bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 focus:ring-red-200',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-3 py-1 text-[11px]',
  sm: 'px-4 py-1.5 text-[12px]',
  md: 'px-5 py-2 text-[13px]',
  lg: 'px-6 py-2.5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-40 disabled:cursor-not-allowed
        hover:-translate-y-px active:translate-y-0
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
