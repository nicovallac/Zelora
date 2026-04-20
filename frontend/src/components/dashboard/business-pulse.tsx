import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AlertTriangle, Clock, CheckCircle2, MessageSquare, ArrowUpRight, Zap } from 'lucide-react';
import { Card, GradientCard } from '../ui/primitives';

interface Conv {
  id: string;
  status: string;
  channel: string;
  createdAt: string;
}

interface BusinessPulseProps {
  conversations: Conv[];
  pendingCount: number;
  escalatedCount: number;
  activeCount: number;
  resolvedCount: number;
  avgResponseTime: string;
}

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#10b981',
  web:      '#0ea5e9',
  instagram:'#a855f7',
  'app-chat':'#8b5cf6',
  app:      '#8b5cf6',
};

const STATUS_COLORS = {
  active:   '#8b5cf6',
  pending:  '#f59e0b',
  escalated:'#ef4444',
  resolved: '#10b981',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#e8e6e1] bg-white p-3 shadow-float text-[11px]">
      <p className="mb-1.5 font-semibold text-ink-700">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-500">{p.name}:</span>
          <span className="font-semibold text-ink-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function BusinessPulse({
  conversations,
  pendingCount,
  escalatedCount,
  activeCount,
  resolvedCount,
  avgResponseTime,
}: BusinessPulseProps) {

  /* ── 7-day volume trend ───────────────────────────────── */
  const trendData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toDateString();
      const dayConvs = conversations.filter((c) => new Date(c.createdAt).toDateString() === ds);
      return {
        day: DAY_ABBR[d.getDay()],
        Total: dayConvs.length,
        Pendientes: dayConvs.filter((c) => c.status === 'nuevo').length,
        Resueltas: dayConvs.filter((c) => c.status === 'resuelto').length,
      };
    });
  }, [conversations]);

  const hasVolumeData = trendData.some((d) => d.Total > 0);

  /* ── Status donut ─────────────────────────────────────── */
  const donutData = useMemo(() => {
    const total = activeCount + pendingCount + escalatedCount + resolvedCount;
    if (total === 0) return [{ name: 'Sin datos', value: 1, color: '#e8e6e1' }];
    return [
      activeCount   > 0 && { name: 'Activas',    value: activeCount,   color: STATUS_COLORS.active },
      pendingCount  > 0 && { name: 'Pendientes', value: pendingCount,  color: STATUS_COLORS.pending },
      escalatedCount > 0 && { name: 'Escaladas', value: escalatedCount,color: STATUS_COLORS.escalated },
      resolvedCount > 0 && { name: 'Resueltas',  value: resolvedCount, color: STATUS_COLORS.resolved },
    ].filter(Boolean) as Array<{ name: string; value: number; color: string }>;
  }, [activeCount, pendingCount, escalatedCount, resolvedCount]);

  const totalConvs = activeCount + pendingCount + escalatedCount + resolvedCount;

  /* ── Channel breakdown ────────────────────────────────── */
  const channelData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of conversations) {
      const ch = c.channel.toLowerCase();
      counts[ch] = (counts[ch] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([ch, count]) => ({ ch, count, color: CHANNEL_COLORS[ch] ?? '#6e6b60' }));
  }, [conversations]);

  const resolutionRate = totalConvs > 0 ? Math.round((resolvedCount / totalConvs) * 100) : 0;
  const urgencyLevel: 'high' | 'medium' | 'ok' =
    escalatedCount > 0 ? 'high' : pendingCount > 3 ? 'medium' : 'ok';

  return (
    <div className="flex flex-col gap-3">

      {/* ── Urgency banner ─────────────────────────────────── */}
      {urgencyLevel !== 'ok' && (
        <Link to="/inbox" className="block">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all hover:opacity-90 cursor-pointer"
            style={
              urgencyLevel === 'high'
                ? { background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }
                : { background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }
            }
          >
            <AlertTriangle
              size={14}
              className={urgencyLevel === 'high' ? 'text-red-500' : 'text-amber-500'}
            />
            <span className="flex-1 text-[12px] font-medium" style={{ color: urgencyLevel === 'high' ? '#dc2626' : '#b45309' }}>
              {urgencyLevel === 'high'
                ? `${escalatedCount} conversación${escalatedCount > 1 ? 'es' : ''} escalada${escalatedCount > 1 ? 's' : ''} — necesitan atención inmediata`
                : `${pendingCount} conversación${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''} sin responder`}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: urgencyLevel === 'high' ? '#dc2626' : '#b45309' }}>
              Ver inbox <ArrowUpRight size={11} />
            </span>
          </div>
        </Link>
      )}

      {/* ── Main charts row ─────────────────────────────────── */}
      <div className="grid gap-3 xl:grid-cols-[1fr_280px]">

        {/* Volume trend */}
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Actividad conversacional</p>
              <p className="mt-0.5 text-[13px] font-semibold text-ink-700">Últimos 7 días</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1.5 text-ink-400">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS.active }} />
                Total
              </span>
              <span className="flex items-center gap-1.5 text-ink-400">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS.pending }} />
                Pendientes
              </span>
              <span className="flex items-center gap-1.5 text-ink-400">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS.resolved }} />
                Resueltas
              </span>
            </div>
          </div>

          {hasVolumeData ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#919188', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#919188', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Total"      stroke="#8b5cf6" strokeWidth={2} fill="url(#gradTotal)"   dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="Pendientes" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gradPending)" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} strokeDasharray="4 2" />
                <Area type="monotone" dataKey="Resueltas"  stroke="#10b981" strokeWidth={1.5} fill="url(#gradResolved)" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[160px] flex-col items-center justify-center gap-3 rounded-2xl" style={{ background: 'rgba(139,92,246,0.03)', border: '1px dashed rgba(139,92,246,0.15)' }}>
              <div className="flex items-center justify-center rounded-2xl p-3" style={{ background: 'rgba(139,92,246,0.08)' }}>
                <MessageSquare size={18} style={{ color: '#8b5cf6' }} />
              </div>
              <div className="text-center">
                <p className="text-[12px] font-semibold text-ink-600">Sin actividad aún</p>
                <p className="mt-0.5 text-[11px] text-ink-400">Las conversaciones aparecerán aquí en tiempo real</p>
              </div>
            </div>
          )}
        </Card>

        {/* Status donut + channel breakdown */}
        <div className="flex flex-col gap-3">

          {/* Donut */}
          <Card className="flex-1 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Estado actual</p>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <PieChart width={80} height={80}>
                  <Pie
                    data={donutData}
                    cx={36}
                    cy={36}
                    innerRadius={26}
                    outerRadius={38}
                    paddingAngle={totalConvs > 0 ? 2 : 0}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[14px] font-bold leading-none text-ink-900">{totalConvs}</span>
                  <span className="text-[8px] font-semibold text-ink-400">total</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                {[
                  { label: 'Activas',    value: activeCount,    color: STATUS_COLORS.active },
                  { label: 'Pendientes', value: pendingCount,   color: STATUS_COLORS.pending },
                  { label: 'Escaladas',  value: escalatedCount, color: STATUS_COLORS.escalated },
                  { label: 'Resueltas',  value: resolvedCount,  color: STATUS_COLORS.resolved },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-ink-500">{label}</span>
                    <span className="text-[11px] font-bold text-ink-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Channel breakdown */}
          <Card className="p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Por canal</p>
            {channelData.length > 0 ? (
              <div className="flex flex-col gap-2">
                {channelData.map(({ ch, count, color }) => {
                  const pct = totalConvs > 0 ? Math.round((count / totalConvs) * 100) : 0;
                  return (
                    <div key={ch}>
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="text-[11px] font-medium capitalize text-ink-600">{ch}</span>
                        <span className="text-[11px] font-bold text-ink-800">{count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full" style={{ background: '#f0ede8' }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 4)}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-ink-400">Sin conversaciones aún</p>
            )}
          </Card>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        <GradientCard gradient={pendingCount > 0 ? 'purple' : 'green'} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Pendientes</p>
              <p className="mt-1.5 text-[28px] font-bold leading-none" style={{ color: pendingCount > 0 ? '#b45309' : '#059669', letterSpacing: '-0.03em' }}>
                {pendingCount}
              </p>
              <p className="mt-1 text-[11px] text-ink-500">
                {pendingCount > 0 ? 'Sin respuesta aún' : 'Todo al día'}
              </p>
            </div>
            <div className="rounded-xl p-2" style={{ background: pendingCount > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)' }}>
              <AlertTriangle size={14} style={{ color: pendingCount > 0 ? '#b45309' : '#059669' }} />
            </div>
          </div>
        </GradientCard>

        <GradientCard gradient="green" className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Resueltas</p>
              <p className="mt-1.5 text-[28px] font-bold leading-none text-ink-900" style={{ letterSpacing: '-0.03em' }}>
                {resolvedCount}
              </p>
              <p className="mt-1 text-[11px] text-ink-500">{resolutionRate}% tasa de resolución</p>
            </div>
            <div className="rounded-xl p-2" style={{ background: 'rgba(16,185,129,0.10)' }}>
              <CheckCircle2 size={14} style={{ color: '#059669' }} />
            </div>
          </div>
        </GradientCard>

        <GradientCard gradient="blue" className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">T. respuesta</p>
              <p className="mt-1.5 text-[28px] font-bold leading-none text-ink-900" style={{ letterSpacing: '-0.03em' }}>
                {avgResponseTime}
              </p>
              <p className="mt-1 text-[11px] text-ink-500">Tiempo promedio</p>
            </div>
            <div className="rounded-xl p-2" style={{ background: 'rgba(139,92,246,0.10)' }}>
              <Clock size={14} style={{ color: '#7c3aed' }} />
            </div>
          </div>
        </GradientCard>

        <GradientCard gradient="blue" className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">Activas ahora</p>
              <p className="mt-1.5 text-[28px] font-bold leading-none text-ink-900" style={{ letterSpacing: '-0.03em' }}>
                {activeCount}
              </p>
              <p className="mt-1 text-[11px] text-ink-500">En proceso</p>
            </div>
            <div className="rounded-xl p-2" style={{ background: 'rgba(139,92,246,0.10)' }}>
              <Zap size={14} style={{ color: '#7c3aed' }} />
            </div>
          </div>
        </GradientCard>

      </div>
    </div>
  );
}
