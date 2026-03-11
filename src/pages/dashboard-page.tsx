import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Globe,
  Instagram,
  MessageSquare,
  Phone,
  RefreshCw,
  UserCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { agentPerformance, metricsTimeline, mockConversations } from '../data/mock';
import type { Channel, Conversation } from '../types';

type ChannelTab = 'all' | Channel;

const CHANNEL_META: Record<Channel, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; className: string }> = {
  web: { label: 'Web', icon: Globe, className: 'bg-blue-100 text-blue-700' },
  whatsapp: { label: 'WhatsApp', icon: Phone, className: 'bg-emerald-100 text-emerald-700' },
  instagram: { label: 'Instagram', icon: Instagram, className: 'bg-pink-100 text-pink-700' },
  tiktok: { label: 'TikTok', icon: MessageSquare, className: 'bg-slate-100 text-slate-700' },
};

const NOW = new Date('2026-03-11T12:00:00Z');

function avgFirstResponseSeconds(conversations: Conversation[]) {
  const samples = conversations
    .map((conv) => {
      const firstUser = conv.messages.find((m) => m.role === 'user');
      if (!firstUser) return null;
      const firstReply = conv.messages.find(
        (m) => (m.role === 'bot' || m.role === 'agent') && new Date(m.timestamp) >= new Date(firstUser.timestamp)
      );
      if (!firstReply) return null;
      return (new Date(firstReply.timestamp).getTime() - new Date(firstUser.timestamp).getTime()) / 1000;
    })
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (samples.length === 0) return 0;
  return Math.round(samples.reduce((acc, v) => acc + v, 0) / samples.length);
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function conversationAtRisk(conv: Conversation) {
  if (conv.status !== 'en_proceso' && conv.status !== 'escalado') return false;
  const diffMin = (NOW.getTime() - new Date(conv.lastMessageAt).getTime()) / 60000;
  return diffMin > 30;
}

export default function DashboardPage() {
  const { agent } = useAuth();
  const { connected } = useWebSocket('/ws/inbox');
  const [activeTab, setActiveTab] = useState<ChannelTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const conversations = useMemo(
    () => (activeTab === 'all' ? mockConversations : mockConversations.filter((c) => c.channel === activeTab)),
    [activeTab]
  );

  const channelTabs = useMemo(() => {
    const available = Array.from(new Set(mockConversations.map((c) => c.channel)));
    return ['all', ...available] as ChannelTab[];
  }, []);

  const kpis = useMemo(() => {
    const total = conversations.length;
    const resolved = conversations.filter((c) => c.status === 'resuelto').length;
    const escalated = conversations.filter((c) => c.status === 'escalado').length;
    const autoResolved = conversations.filter(
      (c) => c.status === 'resuelto' && !c.messages.some((m) => m.role === 'agent')
    ).length;
    const negative = conversations.filter((c) => c.sentiment === 'negativo').length;
    const atRisk = conversations.filter(conversationAtRisk).length;
    const firstResponse = avgFirstResponseSeconds(conversations);
    const automationRate = total > 0 ? Math.round((autoResolved / total) * 100) : 0;
    const escalationRate = total > 0 ? Math.round((escalated / total) * 100) : 0;
    const negativeRate = total > 0 ? Math.round((negative / total) * 100) : 0;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, automationRate, escalationRate, negativeRate, firstResponse, atRisk, resolutionRate };
  }, [conversations]);

  const trends = useMemo(() => {
    return metricsTimeline.map((d) => ({
      fecha: d.fecha,
      valor:
        activeTab === 'all'
          ? d.web + d.whatsapp + d.instagram + d.tiktok
          : d[activeTab],
    }));
  }, [activeTab]);

  const topIntents = useMemo(() => {
    const map = new Map<string, number>();
    conversations.forEach((c) => map.set(c.intent, (map.get(c.intent) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([intent, total]) => ({ intent, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [conversations]);

  const priorityQueue = useMemo(
    () =>
      conversations
        .filter((c) => c.status === 'escalado' || c.status === 'en_proceso' || c.sentiment === 'negativo')
        .slice(0, 6),
    [conversations]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Dashboard Ejecutivo</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Vista operativa en tiempo real para gestionar conversaciones y SLA. Usuario: {agent?.nombre?.split(' ')[0] ?? 'Equipo'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Tiempo real' : 'Sin conexion'}
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {channelTabs.map((tab) => {
          const selected = activeTab === tab;
          const count = tab === 'all' ? mockConversations.length : mockConversations.filter((c) => c.channel === tab).length;
          const meta = tab !== 'all' ? CHANNEL_META[tab] : null;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                selected ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {meta ? <meta.icon size={13} /> : <MessageSquare size={13} />}
              {meta?.label ?? 'Todos'}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Conversaciones', value: kpis.total, icon: MessageSquare, style: 'bg-blue-100 text-blue-700' },
          { label: 'Automatizacion', value: `${kpis.automationRate}%`, icon: Bot, style: 'bg-emerald-100 text-emerald-700' },
          { label: 'Escalamiento', value: `${kpis.escalationRate}%`, icon: UserCheck, style: 'bg-amber-100 text-amber-700' },
          { label: '1ra respuesta', value: formatDuration(kpis.firstResponse), icon: Clock3, style: 'bg-violet-100 text-violet-700' },
          { label: 'Sentimiento negativo', value: `${kpis.negativeRate}%`, icon: AlertTriangle, style: 'bg-red-100 text-red-700' },
          { label: 'SLA en riesgo', value: kpis.atRisk, icon: CheckCircle2, style: 'bg-slate-100 text-slate-700' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-500">{item.label}</p>
              <div className={`rounded-lg p-2 ${item.style}`}>
                <item.icon size={14} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-800">Tendencia semanal del canal</h2>
              <p className="text-xs text-ink-400">
                {activeTab === 'all' ? 'Suma de todos los canales' : `Canal: ${CHANNEL_META[activeTab].label}`}
              </p>
            </div>
            <span className="text-xs text-ink-400">7 dias</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={trends} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="valor" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={2.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Top intenciones</h2>
          <div className="space-y-2">
            {topIntents.length === 0 && <p className="text-xs text-ink-400">Sin datos para este canal.</p>}
            {topIntents.map((row) => (
              <div key={row.intent} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                <p className="text-xs font-medium text-ink-800">{row.intent}</p>
                <p className="mt-0.5 text-xs text-ink-500">{row.total} conversaciones</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-800">Bandeja prioritaria</h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{priorityQueue.length}</span>
          </div>
          <div className="space-y-2">
            {priorityQueue.length === 0 && <p className="text-xs text-ink-400">Sin conversaciones críticas en este canal.</p>}
            {priorityQueue.map((conv) => {
              const meta = CHANNEL_META[conv.channel];
              const userName = `${conv.user.nombre} ${conv.user.apellido}`;
              return (
                <div key={conv.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink-800">{userName}</p>
                    <p className="truncate text-xs text-ink-500">{conv.lastMessage}</p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">{conv.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Rendimiento asesores</h2>
          <div className="space-y-3">
            {agentPerformance.slice(0, 4).map((ag) => (
              <div key={ag.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-700">{ag.nombre}</span>
                  <span className="text-xs font-semibold text-ink-500">{ag.satisfaccion}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${ag.satisfaccion}%` }} />
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2.5 text-xs text-emerald-700">
              Resolucion total actual: <span className="font-semibold">{kpis.resolutionRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
