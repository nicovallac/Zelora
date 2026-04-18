import type { PropsWithChildren } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Channel, OrderStatus, Sentiment, Status, StockStatus } from '../../types';

/* ─────────────────────────────────────────────────────────────
   CARD  — light glass panel
───────────────────────────────────────────────────────────── */
export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.82)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION TITLE
───────────────────────────────────────────────────────────── */
export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-2xl font-bold leading-tight tracking-tight text-ink-900" style={{ letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      {subtitle ? <p className="text-[13px] text-ink-500">{subtitle}</p> : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAG
───────────────────────────────────────────────────────────── */
export function Tag({ text, color }: { text: string; color?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        color ?? 'bg-black/6 text-ink-500'
      }`}
      style={{ letterSpacing: '0.1em' }}
    >
      {text}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   KPI CARD
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
        {sub && <p className="text-[11px] text-ink-500">{sub}</p>}
        {trend && trend !== 'neutral' && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              trend === 'up'
                ? 'bg-brand-500/15 text-brand-600'
                : 'bg-red-500/10 text-red-600'
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
   STATUS BADGES
───────────────────────────────────────────────────────────── */
const statusConfig: Record<Status, { label: string; bg: string; color: string }> = {
  nuevo:      { label: 'Nuevo',      bg: 'rgba(59,130,246,0.10)',  color: '#1d4ed8' },
  en_proceso: { label: 'En proceso', bg: 'rgba(245,158,11,0.10)',  color: '#b45309' },
  escalado:   { label: 'Escalado',   bg: 'rgba(249,115,22,0.10)',  color: '#c2410c' },
  resuelto:   { label: 'Resuelto',   bg: 'rgba(139,92,246,0.10)',  color: '#7c3aed' },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
      style={{ background: cfg.bg, color: cfg.color, letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* Channel badges */
const fallbackChannelConfig = { bg: 'rgba(0,0,0,0.06)', color: '#4a4840' };
const channelConfig: Record<Channel | 'app' | 'app-chat', { label: string; bg: string; color: string }> = {
  app:        { label: 'App Chat',  bg: 'rgba(139,92,246,0.10)', color: '#7c3aed' },
  'app-chat': { label: 'App Chat',  bg: 'rgba(139,92,246,0.10)', color: '#7c3aed' },
  web:        { label: 'Web',       bg: 'rgba(14,165,233,0.10)',  color: '#0284c7' },
  whatsapp:   { label: 'WhatsApp',  bg: 'rgba(16,185,129,0.10)', color: '#059669' },
  instagram:  { label: 'Instagram', bg: 'rgba(217,70,239,0.10)', color: '#a21caf' },
  tiktok:     { label: 'TikTok',   bg: 'rgba(0,0,0,0.06)',       color: '#302e28' },
};

export function ChannelBadge({ channel }: { channel: Channel | string }) {
  const key = channel.toLowerCase();
  const cfg = channelConfig[key as keyof typeof channelConfig] ?? {
    ...fallbackChannelConfig,
    label: channel || 'Canal',
  };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
      style={{ background: cfg.bg, color: cfg.color, letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* Sentiment badges */
const sentimentConfig: Record<Sentiment, { label: string; bg: string; color: string }> = {
  positivo: { label: 'Positivo', bg: 'rgba(139,92,246,0.10)', color: '#7c3aed' },
  neutro:   { label: 'Neutro',   bg: 'rgba(0,0,0,0.06)',      color: '#6e6b60' },
  negativo: { label: 'Negativo', bg: 'rgba(239,68,68,0.10)',   color: '#dc2626' },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const cfg = sentimentConfig[sentiment];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
      style={{ background: cfg.bg, color: cfg.color, letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* Stock badges */
const stockConfig: Record<StockStatus, { label: string; bg: string; color: string }> = {
  in_stock:     { label: 'En stock',   bg: 'rgba(16,185,129,0.10)', color: '#059669' },
  low_stock:    { label: 'Stock bajo', bg: 'rgba(245,158,11,0.10)', color: '#b45309' },
  out_of_stock: { label: 'Agotado',    bg: 'rgba(239,68,68,0.10)',  color: '#dc2626' },
};

export function StockBadge({ status }: { status: StockStatus }) {
  const cfg = stockConfig[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
      style={{ background: cfg.bg, color: cfg.color, letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* Order status badges */
const orderStatusConfig: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  new:        { label: 'Nuevo',          bg: 'rgba(14,165,233,0.10)',  color: '#0284c7' },
  paid:       { label: 'Pagado',         bg: 'rgba(139,92,246,0.10)',  color: '#7c3aed' },
  processing: { label: 'En preparacion', bg: 'rgba(245,158,11,0.10)',  color: '#b45309' },
  shipped:    { label: 'Enviado',        bg: 'rgba(6,182,212,0.10)',   color: '#0e7490' },
  delivered:  { label: 'Entregado',      bg: 'rgba(16,185,129,0.10)', color: '#059669' },
  cancelled:  { label: 'Cancelado',      bg: 'rgba(239,68,68,0.10)',  color: '#dc2626' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = orderStatusConfig[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
      style={{ background: cfg.bg, color: cfg.color, letterSpacing: '0.08em' }}
    >
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────────── */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: 'rgba(0,0,0,0.07)' }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   BUTTON
───────────────────────────────────────────────────────────── */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties & { className: string }> = {
  primary: {
    className: 'text-white font-semibold',
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    boxShadow: '0 0 0 1px rgba(139,92,246,0.40) inset, 0 4px 14px rgba(109,40,217,0.25)',
  },
  secondary: {
    className: 'text-ink-700 font-semibold',
    background: 'rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  ghost: {
    className: 'text-ink-600 font-medium',
    background: 'transparent',
  },
  danger: {
    className: 'text-red-600 font-semibold',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.15)',
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-3 py-1 text-[11px]',
  sm: 'px-4 py-1.5 text-[12px]',
  md: 'px-5 py-2 text-[13px]',
  lg: 'px-6 py-2.5 text-sm',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, style, ...props }: ButtonProps) {
  const { className: variantClass, ...variantStyle } = variantStyles[variant];
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1
        disabled:opacity-40 disabled:cursor-not-allowed
        hover:-translate-y-px active:translate-y-0
        ${variantClass} ${sizeClasses[size]} ${className}`}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
