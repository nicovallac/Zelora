import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, CalendarRange, Lightbulb, TrendingUp } from 'lucide-react';
import { KpiCard } from '../components/ui/primitives';
import { hourStats, metricsTimeline, mockConversations } from '../data/mock';
import type { Channel, Conversation } from '../types';

type RangeKey = 'hoy' | '7d' | '30d' | '90d';
type ChannelTab = 'all' | Channel;

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; factor: number }> = [
  { key: 'hoy', label: 'Hoy', factor: 0.15 },
  { key: '7d', label: '7 dias', factor: 1 },
  { key: '30d', label: '30 dias', factor: 4.1 },
  { key: '90d', label: '90 dias', factor: 12.4 },
];

const CHANNEL_OPTIONS: Array<{ key: ChannelTab; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'web', label: 'Web' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
];

function getFilteredConversations(channel: ChannelTab): Conversation[] {
  if (channel === 'all') return mockConversations;
  return mockConversations.filter((conv) => conv.channel === channel);
}

export function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>('30d');
  const [channel, setChannel] = useState<ChannelTab>('all');
  const factor = RANGE_OPTIONS.find((r) => r.key === range)?.factor ?? 1;

  const conversations = useMemo(() => getFilteredConversations(channel), [channel]);

  const kpis = useMemo(() => {
    const totalBase = conversations.length;
    const total = Math.round(totalBase * factor * 120);
    const previous = Math.max(Math.round(total * 0.86), 1);
    const growth = Math.round(((total - previous) / previous) * 100);

    const autoBase = conversations.filter(
      (c) => c.status === 'resuelto' && !c.messages.some((m) => m.role === 'agent')
    ).length;
    const escalatedBase = conversations.filter((c) => c.status === 'escalado').length;
    const negativeBase = conversations.filter((c) => c.sentiment === 'negativo').length;

    const automation = totalBase > 0 ? Math.round((autoBase / totalBase) * 100) : 0;
    const escalation = totalBase > 0 ? Math.round((escalatedBase / totalBase) * 100) : 0;
    const negative = totalBase > 0 ? Math.round((negativeBase / totalBase) * 100) : 0;

    return { total, growth, automation, escalation, negative };
  }, [conversations, factor]);

  const trendData = useMemo(() => {
    return metricsTimeline.map((d) => {
      const base =
        channel === 'all'
          ? d.web + d.whatsapp + d.instagram + d.tiktok
          : d[channel];
      return {
        fecha: d.fecha,
        actual: Math.round(base * factor),
        previo: Math.round(base * factor * 0.86),
      };
    });
  }, [channel, factor]);

  const topIntents = useMemo(() => {
    const map = new Map<string, number>();
    conversations.forEach((c) => {
      map.set(c.intent, (map.get(c.intent) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([intent, count]) => ({ intent, count: Math.round(count * factor * 40) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [conversations, factor]);

  const heatmap = useMemo(() => {
    return hourStats.map((h) => ({
      hora: h.hora,
      total: Math.round(h.total * (channel === 'all' ? 1 : 0.8) * factor),
    }));
  }, [channel, factor]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>
            <p className="mt-1 text-sm text-ink-600">
              Vista estrategica e historica para decisiones de crecimiento.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <BarChart3 size={14} />
            Comparativo por periodos
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-indigo-100 bg-white p-3 text-xs text-ink-600">
          <Lightbulb size={14} className="mt-0.5 text-indigo-500" />
          <p>
            Diferencia clave: <span className="font-semibold">Dashboard</span> es operativo en tiempo real.
            <span className="font-semibold"> Analytics</span> es analisis de tendencias, comparativos y planeacion.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {CHANNEL_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setChannel(option.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                channel === option.key
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setRange(option.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                range === option.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <CalendarRange size={12} />
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Conversaciones periodo"
          value={kpis.total.toLocaleString()}
          trend={kpis.growth >= 0 ? 'up' : 'down'}
          trendText={`${kpis.growth >= 0 ? '+' : ''}${kpis.growth}% vs periodo anterior`}
        />
        <KpiCard label="Automatizacion" value={`${kpis.automation}%`} sub="resueltas sin asesor humano" />
        <KpiCard label="Escalamiento" value={`${kpis.escalation}%`} sub="derivadas para gestion manual" />
        <KpiCard label="Sentimiento negativo" value={`${kpis.negative}%`} sub="oportunidad de mejora" />
        <KpiCard label="Canal analizado" value={CHANNEL_OPTIONS.find((c) => c.key === channel)?.label ?? 'Todos'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-900">Tendencia historica y comparativo</h2>
          <p className="mt-1 text-xs text-ink-500">Actual vs periodo anterior equivalente</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -20, right: 6, top: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2ff" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="previo" stroke="#94a3b8" fill="#e2e8f0" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" stroke="#4f46e5" fill="url(#actualGradient)" strokeWidth={2.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink-900">Top intenciones del periodo</h2>
          <div className="mt-4 space-y-2">
            {topIntents.map((row) => (
              <div key={row.intent} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-ink-800">{row.intent}</p>
                <p className="text-xs text-ink-500">{row.count.toLocaleString()} conversaciones</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink-900">Horarios pico historicos</h2>
          <p className="mt-1 text-xs text-ink-500">Analisis para planear turnos y cobertura</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmap}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-ink-900">Recomendaciones estrategicas</h2>
          <div className="mt-4 space-y-2">
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
              Si el canal seleccionado mantiene esta tendencia, aumenta capacidad en horarios de 9am a 11am.
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
              Mantener automatizacion por encima de 70% reduce costo operativo y mejora SLA.
            </div>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800">
              Priorizar campañas sobre las 2 intenciones top puede aumentar conversion entre 8% y 12%.
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <TrendingUp size={13} />
              Uso sugerido
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Usa esta vista para decisiones semanales/mensuales. Para gestionar casos activos usa Dashboard e Inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
