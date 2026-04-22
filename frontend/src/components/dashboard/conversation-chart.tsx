import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Conversation {
  id: string;
  status: string;
  createdAt: string;
}

type Period = 'today' | '7d' | 'month';

const DAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function generateChartData(conversations: Conversation[], period: Period) {
  const now = new Date();

  if (period === 'today') {
    return Array.from({ length: 24 }, (_, hour) => {
      const bucket = conversations.filter((c) => {
        const d = new Date(c.createdAt);
        return d.toDateString() === now.toDateString() && d.getHours() === hour;
      });
      return {
        label: hour % 4 === 0 ? `${hour}h` : '',
        fullLabel: `${hour}:00`,
        total: bucket.length,
        resueltas: bucket.filter((c) => c.status === 'resuelto').length,
      };
    });
  }

  const days = period === '7d' ? 7 : 30;

  return Array.from({ length: days }, (_, i) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (days - 1 - i));
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const bucket = conversations.filter((c) => {
      const d = new Date(c.createdAt);
      return d >= day && d < nextDay;
    });

    let label: string;
    if (period === '7d') {
      label = DAY_NAMES_ES[day.getDay()];
    } else {
      label = i % 5 === 0 ? `${day.getDate()}` : '';
    }

    return {
      label,
      fullLabel: day.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
      total: bucket.length,
      resueltas: bucket.filter((c) => c.status === 'resuelto').length,
    };
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.find((p) => p.dataKey === 'total')?.value ?? 0;
  const resueltas = payload.find((p) => p.dataKey === 'resueltas')?.value ?? 0;
  return (
    <div
      className="rounded-2xl px-3.5 py-3 text-[12px]"
      style={{
        background: 'rgba(255,255,255,0.96)',
        border: '1px solid rgba(17,17,16,0.08)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase text-ink-400" style={{ letterSpacing: '0.1em' }}>
        {label}
      </p>
      <p className="font-semibold text-ink-900">
        {total} <span className="font-normal text-ink-400">totales</span>
      </p>
      {resueltas > 0 && (
        <p className="text-brand-600">
          {resueltas} <span className="font-normal text-ink-400">resueltas</span>
        </p>
      )}
    </div>
  );
}

interface ConversationChartProps {
  conversations: Conversation[];
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: 'month', label: 'Mes' },
];

export function ConversationChart({ conversations }: ConversationChartProps) {
  const [period, setPeriod] = useState<Period>('7d');

  const data = useMemo(() => generateChartData(conversations, period), [conversations, period]);

  const totalInPeriod = data.reduce((sum, d) => sum + d.total, 0);
  const resolvedInPeriod = data.reduce((sum, d) => sum + d.resueltas, 0);

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-semibold uppercase text-ink-400"
            style={{ letterSpacing: '0.14em' }}
          >
            Actividad
          </p>
          <h2
            className="mt-0.5 text-[17px] font-bold text-ink-900"
            style={{ letterSpacing: '-0.018em' }}
          >
            Conversaciones
          </h2>
        </div>

        {/* Period toggle */}
        <div
          className="flex rounded-xl p-0.5"
          style={{ background: 'rgba(17,17,16,0.05)', border: '1px solid rgba(17,17,16,0.06)' }}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                period === opt.value
                  ? 'bg-white text-ink-900 shadow-card'
                  : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary pills */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          <span className="text-[11px] text-ink-400">
            <span className="font-semibold text-ink-800">{totalInPeriod}</span> totales
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand-200" />
          <span className="text-[11px] text-ink-400">
            <span className="font-semibold text-ink-800">{resolvedInPeriod}</span> resueltas
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5 flex-1" style={{ minHeight: 180 }}>
        {totalInPeriod === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-2xl" style={{ background: 'rgba(17,17,16,0.02)', border: '1px dashed rgba(17,17,16,0.08)' }}>
            <p className="text-[13px] font-semibold text-ink-500">Sin actividad en este periodo</p>
            <p className="mt-1 text-[11px] text-ink-400">Las conversaciones apareceran aqui cuando lleguen</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradResueltas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(17,17,16,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9a9789', fontFamily: 'Space Grotesk, sans-serif' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9a9789', fontFamily: 'Space Grotesk, sans-serif' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.15)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#gradTotal)"
                dot={false}
                activeDot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="resueltas"
                stroke="#c4b5fd"
                strokeWidth={1.5}
                fill="url(#gradResueltas)"
                dot={false}
                activeDot={{ r: 3, fill: '#c4b5fd', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
