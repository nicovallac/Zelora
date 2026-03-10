import type { PropsWithChildren } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Channel, Status, Sentiment } from '../../types';

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

export function Tag({ text, color = 'bg-slate-100 text-slate-700' }: { text: string; color?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{text}</span>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
}

export function KpiCard({ label, value, sub, trend, trendText }: KpiCardProps) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
        {trend && trend !== 'neutral' && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              trend === 'up' ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendText}
          </span>
        )}
      </div>
    </Card>
  );
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  nuevo: { label: 'Nuevo', className: 'bg-blue-100 text-blue-800' },
  en_proceso: { label: 'En proceso', className: 'bg-amber-100 text-amber-800' },
  escalado: { label: 'Escalado', className: 'bg-orange-100 text-orange-800' },
  resuelto: { label: 'Resuelto', className: 'bg-emerald-100 text-emerald-800' },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const channelConfig: Record<Channel, { label: string; className: string }> = {
  web: { label: 'Web', className: 'bg-blue-100 text-blue-800' },
  whatsapp: { label: 'WhatsApp', className: 'bg-green-100 text-green-800' },
  instagram: { label: 'Instagram', className: 'bg-pink-100 text-pink-800' },
  tiktok: { label: 'TikTok', className: 'bg-slate-100 text-slate-800' },
};

export function ChannelBadge({ channel }: { channel: Channel }) {
  const cfg = channelConfig[channel];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const sentimentConfig: Record<Sentiment, { label: string; className: string }> = {
  positivo: { label: 'Positivo', className: 'bg-emerald-100 text-emerald-800' },
  neutro: { label: 'Neutro', className: 'bg-slate-100 text-slate-700' },
  negativo: { label: 'Negativo', className: 'bg-red-100 text-red-800' },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const cfg = sentimentConfig[sentiment];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
