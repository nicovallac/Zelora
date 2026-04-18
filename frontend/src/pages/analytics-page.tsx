import { useEffect, useMemo, useState } from 'react';
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
import { PageHeader } from '../components/ui/page-header';
import { api } from '../services/api';
import type { ChannelMetric, HourlyMetricApiItem, IntentMetric, MetricsOverview, MetricsSnapshotApiItem } from '../services/api';

type RangeKey = 'hoy' | '7d' | '30d' | '90d';
type ChannelTab = 'all' | 'web' | 'app' | 'whatsapp' | 'instagram' | 'tiktok' | 'telegram' | 'email';

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; days: number }> = [
  { key: 'hoy', label: 'Hoy', days: 1 },
  { key: '7d', label: '7 dias', days: 7 },
  { key: '30d', label: '30 dias', days: 30 },
  { key: '90d', label: '90 dias', days: 90 },
];

const CHANNEL_OPTIONS: Array<{ key: ChannelTab; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'web', label: 'Web' },
  { key: 'app', label: 'App Chat' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'email', label: 'Email' },
  { key: 'tiktok', label: 'TikTok' },
];

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeChannel(channel: string): ChannelTab {
  const key = (channel || '').toLowerCase();
  if (key.includes('whatsapp')) return 'whatsapp';
  if (key.includes('instagram')) return 'instagram';
  if (key.includes('telegram')) return 'telegram';
  if (key.includes('email')) return 'email';
  if (key.includes('tiktok')) return 'tiktok';
  if (key.includes('app')) return 'app';
  if (key.includes('web')) return 'web';
  return 'web';
}

function parseHourLabel(value: string): string {
  const date = new Date(value);
  if (!Number.isNaN(+date)) return `${String(date.getHours()).padStart(2, '0')}:00`;
  return value;
}

export function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>(() => {
    const saved = localStorage.getItem('zelora_analytics_range') as RangeKey | null;
    return saved && ['hoy', '7d', '30d', '90d'].includes(saved) ? saved : '30d';
  });
  const [channel, setChannel] = useState<ChannelTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<(MetricsOverview & Record<string, unknown>) | null>(null);
  const [channels, setChannels] = useState<ChannelMetric[]>([]);
  const [intents, setIntents] = useState<IntentMetric[]>([]);
  const [hourly, setHourly] = useState<HourlyMetricApiItem[]>([]);
  const [snapshots, setSnapshots] = useState<MetricsSnapshotApiItem[]>([]);

  const days = RANGE_OPTIONS.find((option) => option.key === range)?.days ?? 30;

  useEffect(() => {
    void loadAnalytics();
  }, [days]);

  async function loadAnalytics() {
    setLoading(true);
    setError(null);
    const [overviewResult, channelsResult, intentsResult, hourlyResult, snapshotsResult] = await Promise.allSettled([
      api.getMetricsOverview(days),
      api.getMetricsChannels(days),
      api.getMetricsIntents(days),
      api.getMetricsHourly(Math.max(days, 7)),
      api.getMetricsSnapshots(),
    ]);

    const failedCount = [overviewResult, channelsResult, intentsResult, hourlyResult, snapshotsResult]
      .filter((item) => item.status === 'rejected').length;

    setOverview(overviewResult.status === 'fulfilled' ? overviewResult.value : null);
    setChannels(channelsResult.status === 'fulfilled' ? channelsResult.value.channels : []);
    setIntents(intentsResult.status === 'fulfilled' ? intentsResult.value : []);
    setHourly(hourlyResult.status === 'fulfilled' ? hourlyResult.value.data : []);
    setSnapshots(snapshotsResult.status === 'fulfilled' ? snapshotsResult.value : []);

    if (failedCount > 0) {
      setError('Se cargaron datos parciales de analytics. Algunos modulos no respondieron.');
    }
    setLoading(false);
  }

  const selectedChannelMetrics = useMemo(() => {
    if (channel === 'all') return channels;
    return channels.filter((item) => normalizeChannel(item.canal) === channel);
  }, [channel, channels]);

  const trendData = useMemo(() => {
    const today = new Date();
    const sinceDate = new Date(today);
    sinceDate.setDate(today.getDate() - days + 1);
    const byDate = new Map<string, number>();

    snapshots.forEach((snapshot) => {
      const dateOnly = snapshot.date;
      const snapshotDate = new Date(`${dateOnly}T00:00:00`);
      if (snapshotDate < sinceDate) return;
      if (channel !== 'all' && normalizeChannel(snapshot.canal) !== channel) return;
      byDate.set(dateOnly, (byDate.get(dateOnly) || 0) + toNumber(snapshot.total_conversations));
    });

    const currentPeriod = Array.from(byDate.entries())
      .sort((a, b) => +new Date(a[0]) - +new Date(b[0]))
      .map(([date, total]) => ({ date, total }));

    if (currentPeriod.length === 0) return [];

    const previousMap = new Map<string, number>();
    const prevSince = new Date(sinceDate);
    prevSince.setDate(prevSince.getDate() - days);
    const prevUntil = new Date(sinceDate);
    prevUntil.setDate(prevUntil.getDate() - 1);

    snapshots.forEach((snapshot) => {
      const snapshotDate = new Date(`${snapshot.date}T00:00:00`);
      if (snapshotDate < prevSince || snapshotDate > prevUntil) return;
      if (channel !== 'all' && normalizeChannel(snapshot.canal) !== channel) return;
      previousMap.set(snapshot.date, (previousMap.get(snapshot.date) || 0) + toNumber(snapshot.total_conversations));
    });

    const previousSeries = Array.from(previousMap.values());
    return currentPeriod.map((item, idx) => ({
      fecha: item.date.slice(5),
      actual: item.total,
      previo: previousSeries[idx] ?? Math.round(item.total * 0.86),
    }));
  }, [channel, days, snapshots]);

  const kpis = useMemo(() => {
    const trendCurrent = trendData.reduce((sum, item) => sum + item.actual, 0);
    const trendPrevious = Math.max(1, trendData.reduce((sum, item) => sum + item.previo, 0));
    const growth = trendData.length > 0 ? Math.round(((trendCurrent - trendPrevious) / trendPrevious) * 100) : 0;

    const channelTotal = selectedChannelMetrics.reduce((sum, item) => sum + toNumber(item.total), 0);
    const channelEscalated = selectedChannelMetrics.reduce(
      (sum, item) => sum + toNumber(item.escalated_sum ?? item.escaladas),
      0,
    );
    const channelAi = selectedChannelMetrics.reduce(
      (sum, item) => sum + toNumber(item.ai_handled_sum ?? item.automatizadas),
      0,
    );

    const total = channel === 'all'
      ? toNumber(overview?.total_conversaciones ?? trendCurrent)
      : channelTotal;
    const automation = channelTotal > 0 && channel !== 'all'
      ? Math.round((channelAi / channelTotal) * 100)
      : Math.round(toNumber(overview?.automatizacion_pct));
    const escalation = channelTotal > 0 && channel !== 'all'
      ? Math.round((channelEscalated / channelTotal) * 100)
      : Math.round(toNumber(overview?.escalamiento_pct));
    const cvr = toNumber(overview?.cvr);
    const aov = toNumber(overview?.aov);
    const naturalness = toNumber(overview?.naturalness_score);
    const brandFit = toNumber(overview?.brand_fit_score);
    const replyRateRaw = overview ? Number(overview.reply_rate) : NaN;
    const replyRate = Number.isFinite(replyRateRaw) ? replyRateRaw : null;

    return { total, growth, automation, escalation, cvr, aov, naturalness, brandFit, replyRate };
  }, [channel, overview, selectedChannelMetrics, trendData]);

  const topIntents = useMemo(() => {
    return intents
      .map((row) => ({ intent: row.nombre, count: toNumber(row.count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [intents]);

  const heatmap = useMemo(() => {
    return hourly.map((item) => ({
      hora: parseHourLabel(item.hour),
      total: Math.max(0, Math.round(toNumber(item.count))),
    }));
  }, [hourly]);

  return (
    <div className="page-shell">
      <div className="page-stack">
        <PageHeader
          eyebrow="Analitica conversacional"
          title="Analytics"
          description="Vista historica para analizar tendencias, comparativos y decisiones de crecimiento."
          meta={(
            <div className="flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 backdrop-blur-sm">
              <BarChart3 size={14} />
              Comparativo por periodos
            </div>
          )}
        >
          <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-white/70 p-3 text-xs text-ink-600 backdrop-blur-sm">
            <Lightbulb size={14} className="mt-0.5 text-indigo-500" />
            <p>
              Diferencia clave: <span className="font-semibold">Dashboard</span> es operativo en tiempo real.
              <span className="font-semibold"> Analytics</span> es analisis de tendencias, comparativos y planeacion.
            </p>
          </div>
        </PageHeader>

        <div className="page-section-card py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 p-1 backdrop-blur-sm">
              {CHANNEL_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setChannel(option.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    channel === option.key
                      ? 'bg-brand-500 text-white'
                      : 'text-ink-600 hover:bg-[rgba(17,17,16,0.06)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 p-1 backdrop-blur-sm">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => { setRange(option.key); localStorage.setItem('zelora_analytics_range', option.key); }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    range === option.key
                      ? 'bg-brand-500 text-white'
                      : 'text-ink-600 hover:bg-[rgba(17,17,16,0.06)]'
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Conversaciones periodo"
            value={kpis.total.toLocaleString()}
            trend={kpis.growth >= 0 ? 'up' : 'down'}
            trendText={`${kpis.growth >= 0 ? '+' : ''}${kpis.growth}% vs periodo anterior`}
          />
          <KpiCard label="CVR" value={`${kpis.cvr.toFixed(1)}%`} sub="conversion de conversaciones a ordenes" />
          <KpiCard label="AOV" value={`$${kpis.aov.toFixed(2)}`} sub="ticket promedio de pedidos conversacionales" />
          <KpiCard
            label={kpis.replyRate !== null ? 'Reply rate' : 'Automatizacion'}
            value={`${(kpis.replyRate ?? kpis.automation).toFixed(1)}%`}
            sub={kpis.replyRate !== null ? 'conversaciones con respuesta del bot' : 'resueltas sin asesor humano'}
          />
          <KpiCard label="Naturalidad / Brand fit" value={`${kpis.naturalness.toFixed(2)} / ${kpis.brandFit.toFixed(2)}`} sub={`Escalamiento ${kpis.escalation}%`} />
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-700">
            {error}
          </div>
        ) : null}

        {!loading && kpis.total === 0 && (
          <div className="rounded-2xl border border-dashed border-[rgba(17,17,16,0.09)] bg-white/70 p-8 text-center shadow-card backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-ink-900">Sin datos aun</h2>
            <p className="mt-2 text-sm text-ink-400">
              Analytics empezara a poblarse cuando entren conversaciones reales desde Web o WhatsApp.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-4 shadow-card backdrop-blur-sm sm:p-5 lg:col-span-2">
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

          <div className="rounded-xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-5 shadow-card backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-ink-900">Top intenciones del periodo</h2>
            <div className="mt-4 space-y-2">
              {topIntents.length === 0 && (
                <div className="rounded-lg border border-dashed border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-3 text-xs text-ink-400">
                  Sin intenciones registradas todavia.
                </div>
              )}
              {topIntents.map((row) => (
                <div key={row.intent} className="rounded-lg border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] p-3">
                  <p className="text-xs font-semibold text-ink-800">{row.intent}</p>
                  <p className="text-xs text-ink-500">{row.count.toLocaleString()} conversaciones</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-5 shadow-card backdrop-blur-sm">
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

          <div className="rounded-xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-5 shadow-card backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-ink-900">Recomendaciones estrategicas</h2>
            <div className="mt-4 space-y-2">
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                Si la tasa de escalamiento sube, revisa reglas de handoff y claridad de CTA en las respuestas.
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
                Si el CVR baja y el volumen sube, prioriza intentos con mayor probabilidad de compra.
              </div>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800">
                Naturalidad y Brand fit deberian mantenerse estables para sostener conversion en el tiempo.
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-700">
                <TrendingUp size={13} />
                Uso sugerido
              </div>
              <p className="mt-1 text-xs text-ink-600">
                Usa esta vista para decisiones semanales/mensuales. Para gestionar casos activos usa Dashboard e Inbox.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
