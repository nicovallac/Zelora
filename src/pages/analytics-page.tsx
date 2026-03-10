import { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { Brain, TrendingUp, ChevronDown, Download, FileDown, FileText, Mail } from 'lucide-react';
import { KpiCard } from '../components/ui/primitives';
import { metricsTimeline, intentStats, hourStats, agentPerformance } from '../data/mock';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotification } from '../contexts/NotificationContext';

type DateRange = 'hoy' | '7dias' | '30dias' | '90dias';

const DATE_TABS: { key: DateRange; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7dias', label: '7 días' },
  { key: '30dias', label: '30 días' },
  { key: '90dias', label: '90 días' },
];

const CHANNEL_COLORS: Record<string, string> = {
  web: '#2563eb',
  whatsapp: '#25D366',
  instagram: '#E1306C',
  tiktok: '#000000',
};

const PIE_COLORS = ['#2563eb', '#25D366', '#E1306C', '#6b7280'];

const pieData = [
  { name: 'WhatsApp', value: 3110 },
  { name: 'Web', value: 2280 },
  { name: 'Instagram', value: 1890 },
  { name: 'TikTok', value: 1130 },
];

// Tag cloud color rotation
const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-slate-100 text-slate-600',
];

// Build predictive data: last 7 days real + 7 days projection
function buildPredictiveData() {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const real = metricsTimeline.map((d) => ({
    dia: d.fecha,
    real: d.web + d.whatsapp + d.instagram + d.tiktok,
    proyeccion: null as number | null,
  }));
  const lastReal = real[real.length - 1]?.real ?? 1260;
  const projected = days.map((dia, i) => ({
    dia: `${dia}+${i + 1}`,
    real: null as number | null,
    proyeccion: Math.round(lastReal * (1 + 0.35 * ((i + 1) / 7)) * (0.9 + Math.random() * 0.2)),
  }));
  return [...real, ...projected];
}

const predictiveData = buildPredictiveData();
const peakDay = predictiveData.reduce(
  (best, d) => (d.proyeccion ?? 0) > (best.proyeccion ?? 0) ? d : best,
  predictiveData[0]
);

const qaDistribution = [
  { label: 'Excelente (85-100)', pct: 45, color: 'bg-emerald-500' },
  { label: 'Buena (65-84)', pct: 38, color: 'bg-amber-500' },
  { label: 'Regular (< 65)', pct: 17, color: 'bg-red-500' },
];

export function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>('7dias');
  const [exportOpen, setExportOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { connected } = useWebSocket('/ws/inbox');
  const { showSuccess } = useNotification();

  // Close export dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build comparison data: add prev period = current * 0.85
  const metricsWithComparison = metricsTimeline.map((d) => ({
    ...d,
    web_prev: compareMode ? Math.round(d.web * 0.85) : undefined,
    whatsapp_prev: compareMode ? Math.round(d.whatsapp * 0.85) : undefined,
    instagram_prev: compareMode ? Math.round(d.instagram * 0.85) : undefined,
    tiktok_prev: compareMode ? Math.round(d.tiktok * 0.85) : undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Analítico</h1>
            {/* Real-time indicator */}
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm" title={connected ? 'Tiempo real: conectado' : 'Tiempo real: desconectado'}>
              <span className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-[10px] font-semibold text-slate-500">
                {connected ? 'En vivo' : 'Sin conexión'}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500">Vista ejecutiva para equipo interno COMFAGUAJIRA</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Comparison toggle */}
          <button
            onClick={() => setCompareMode((v) => !v)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              compareMode
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Comparar con periodo anterior
          </button>

          {/* Export button */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <Download size={12} />
              Exportar
              <ChevronDown size={12} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                {[
                  { icon: FileDown, label: 'Descargar CSV', msg: 'Exportación CSV iniciada' },
                  { icon: FileText, label: 'Descargar PDF', msg: 'Exportación PDF iniciada' },
                  { icon: Mail, label: 'Enviar por email', msg: 'Reporte enviado por email' },
                ].map(({ icon: Icon, label, msg }) => (
                  <button
                    key={label}
                    onClick={() => { showSuccess(msg); setExportOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Icon size={14} className="text-slate-400" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date range tabs */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {DATE_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setRange(t.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  range === t.key ? 'bg-brand-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1 - KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Conversaciones totales" value="12.842" sub="vs periodo anterior" trend="up" trendText="↑ 8%" />
        <KpiCard label="Automatización" value="74%" sub="sin intervención humana" trend="up" trendText="↑ 3%" />
        <KpiCard label="Escalamiento" value="19%" sub="requirieron asesor" trend="down" trendText="↓ 2%" />
        <KpiCard label="Satisfacción CSAT" value="91%" sub="afiliados satisfechos" trend="up" trendText="↑ 1%" />
      </div>

      {/* Row 2 - Channel charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 font-bold text-slate-900">
            Conversaciones por canal (semana)
            {compareMode && <span className="ml-2 text-xs font-normal text-slate-400">vs periodo anterior</span>}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsWithComparison} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="web" name="Web" fill={CHANNEL_COLORS.web} radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="whatsapp" name="WhatsApp" fill={CHANNEL_COLORS.whatsapp} stackId="a" />
                <Bar dataKey="instagram" name="Instagram" fill={CHANNEL_COLORS.instagram} stackId="a" />
                <Bar dataKey="tiktok" name="TikTok" fill={CHANNEL_COLORS.tiktok} radius={[4, 4, 0, 0]} stackId="a" />
                {compareMode && <Bar dataKey="web_prev" name="Web (anterior)" fill="#93c5fd" radius={[4, 4, 0, 0]} stackId="b" opacity={0.6} />}
                {compareMode && <Bar dataKey="whatsapp_prev" name="WhatsApp (anterior)" fill="#86efac" stackId="b" opacity={0.6} />}
                {compareMode && <Bar dataKey="instagram_prev" name="Instagram (anterior)" fill="#f9a8d4" stackId="b" opacity={0.6} />}
                {compareMode && <Bar dataKey="tiktok_prev" name="TikTok (anterior)" fill="#94a3b8" radius={[4, 4, 0, 0]} stackId="b" opacity={0.6} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 font-bold text-slate-900">Distribución de canales</p>
          <div className="flex items-center gap-6">
            <div className="h-56 w-56 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  <span className="text-sm text-slate-500">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 - Intents + Hours */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 font-bold text-slate-900">Intenciones frecuentes</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intentStats} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={130} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" name="Conversaciones" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 font-bold text-slate-900">Horarios pico</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourStats}>
                <defs>
                  <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hora" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="total" name="Conversaciones" stroke="#2563eb" strokeWidth={2} fill="url(#hourGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4 - Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Intents table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-bold text-slate-900">Motivos de contacto</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Intención</th>
                  <th className="px-5 py-3 text-right">Conversaciones</th>
                  <th className="px-5 py-3 text-right">%</th>
                  <th className="px-5 py-3">Distribución</th>
                </tr>
              </thead>
              <tbody>
                {intentStats.map((intent) => (
                  <tr key={intent.nombre} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-sm text-slate-900">{intent.nombre}</td>
                    <td className="px-5 py-3 text-right text-sm font-medium text-slate-700">
                      {intent.count.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-slate-500">{intent.porcentaje}%</td>
                    <td className="px-5 py-3">
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-brand-500"
                          style={{ width: `${intent.porcentaje}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent performance table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-bold text-slate-900">Desempeño de asesores</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Asesor</th>
                  <th className="px-5 py-3 text-right">Convs.</th>
                  <th className="px-5 py-3 text-right">Resueltas</th>
                  <th className="px-5 py-3 text-right">T. Prom.</th>
                  <th className="px-5 py-3 text-right">CSAT</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map((agent) => (
                  <tr key={agent.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                          {agent.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{agent.nombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-slate-700">{agent.conversaciones}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-700">{agent.resueltas}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-700">{agent.tiempoPromedio}</td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`text-sm font-bold ${
                          agent.satisfaccion >= 95
                            ? 'text-emerald-600'
                            : agent.satisfaccion >= 90
                            ? 'text-blue-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {agent.satisfaccion}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 5 — Topic Clustering (full width) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <Brain size={18} className="text-violet-600" />
          <p className="font-bold text-slate-900">Temas emergentes detectados por IA</p>
        </div>
        <p className="mb-5 text-xs text-slate-500">Últimas 24h — análisis automático de conversaciones</p>
        <div className="flex flex-wrap items-center gap-3">
          {intentStats.map((intent, i) => {
            const rank = i; // 0 = largest
            const sizeClass = rank < 2 ? 'text-lg px-4 py-2' : rank < 5 ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';
            const colorClass = TAG_COLORS[i % TAG_COLORS.length];
            return (
              <span
                key={intent.nombre}
                className={`cursor-default rounded-full font-semibold transition hover:opacity-80 ${sizeClass} ${colorClass}`}
              >
                {intent.nombre} <span className="opacity-70">({intent.count.toLocaleString()})</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Row 6 — Predictive analytics + QA distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Predictive chart (2/3 width) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-600" />
            <p className="font-bold text-slate-900">Proyección próximos 7 días</p>
          </div>
          <p className="mb-4 text-xs text-slate-500">Basada en patrones históricos</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictiveData}>
                <defs>
                  <linearGradient id="realGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {peakDay && (
                  <ReferenceLine
                    x={peakDay.dia}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: 'Pico esperado', position: 'insideTopRight', fontSize: 10, fill: '#d97706' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="real"
                  name="Real (últimos 7 días)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="proyeccion"
                  name="Proyección"
                  stroke="#93c5fd"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5">
            <span className="text-sm">⚠️</span>
            <p className="text-xs text-amber-800">
              Se espera incremento del <strong>35%</strong> en consultas de subsidio la próxima semana (semana de pago)
            </p>
          </div>
        </div>

        {/* QA distribution (1/3 width) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-1 font-bold text-slate-900">Distribución calidad de conversaciones</p>
          <p className="mb-4 text-xs text-slate-500">Score QA promedio del periodo</p>
          <div className="space-y-4">
            {qaDistribution.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">{item.label}</span>
                  <span className="text-xs font-bold text-slate-900">{item.pct}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-3 rounded-full transition-all ${item.color}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Promedio general</span>
              <span className="font-bold text-slate-900">78.4 / 100</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Conversaciones evaluadas</span>
              <span className="font-bold text-slate-900">3.240</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Meta mensual</span>
              <span className="font-bold text-emerald-600">80 / 100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
