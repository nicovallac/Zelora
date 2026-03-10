import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Users, Clock, TrendingUp, AlertTriangle,
  CheckCircle, ArrowRight, Wifi, WifiOff, Phone, Mail,
  Instagram, Send, Globe, Zap, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { mockConversations, agentPerformance, hourStats } from '../data/mock';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const liveMetrics = [
  { label: 'Conversaciones activas', value: 23, delta: '+3', color: 'brand', icon: MessageSquare },
  { label: 'En cola', value: 7, delta: '+1', color: 'amber', icon: Clock },
  { label: 'Agentes conectados', value: 4, delta: '0', color: 'emerald', icon: Users },
  { label: 'Resueltas hoy', value: 148, delta: '+12', color: 'sky', icon: CheckCircle },
];

const channelStatus = [
  { name: 'WhatsApp', icon: Phone, status: 'online', conversations: 14, color: 'emerald' },
  { name: 'Instagram', icon: Instagram, status: 'online', conversations: 5, color: 'pink' },
  { name: 'Web Chat', icon: Globe, status: 'online', conversations: 4, color: 'sky' },
  { name: 'Email', icon: Mail, status: 'degraded', conversations: 0, color: 'amber' },
  { name: 'Telegram', icon: Send, status: 'offline', conversations: 0, color: 'ink' },
];

const recentAlerts = [
  { id: 1, type: 'escalation', message: 'María Fernanda — PQRS sin respuesta hace 47 min', severity: 'high', time: 'hace 5 min' },
  { id: 2, type: 'sla', message: 'SLA en riesgo: 3 conversaciones superan 30 min', severity: 'medium', time: 'hace 12 min' },
  { id: 3, type: 'queue', message: 'Cola WhatsApp supera umbral (7 en espera)', severity: 'medium', time: 'hace 18 min' },
  { id: 4, type: 'resolved', message: 'Tasa de resolución IA: 78% en última hora', severity: 'info', time: 'hace 22 min' },
];

const todayHighlights = [
  { label: 'Tasa resolución IA', value: '74%', target: '70%', ok: true },
  { label: 'Tiempo promedio', value: '3m 42s', target: '<5min', ok: true },
  { label: 'Satisfacción CSAT', value: '91%', target: '85%', ok: true },
  { label: 'Escalaciones', value: '12%', target: '<10%', ok: false },
];

// hourStats uses { hora, total } — map to chart-friendly shape
const chartData = hourStats.slice(6, 22).map(h => ({
  hora: h.hora,
  conversaciones: h.total,
  resueltas: Math.round(h.total * 0.72),
}));

// Suppress unused import warning for TrendingUp (kept for potential use)
void TrendingUp;

export default function DashboardPage() {
  const { agent } = useAuth();
  const { connected } = useWebSocket('/ws/inbox');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const urgentConversations = mockConversations
    .filter(c => c.status === 'escalado' || c.status === 'en_proceso')
    .slice(0, 4)
    .map(c => ({
      ...c,
      userName: `${c.user.nombre} ${c.user.apellido}`,
    }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Centro de Mando</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Bienvenido, {agent?.nombre?.split(' ')[0]}. Hoy es un buen día para atender.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Tiempo real activo' : 'Desconectado'}
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-800 px-3 py-1.5 border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Live metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {liveMetrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-xl border border-ink-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-ink-500 font-medium">{m.label}</p>
                <p className="text-3xl font-bold text-ink-900 mt-1">{m.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                m.color === 'brand' ? 'bg-brand-100 text-brand-600' :
                m.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                m.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                'bg-sky-100 text-sky-600'
              }`}>
                <m.icon size={18} />
              </div>
            </div>
            <p className={`text-xs mt-2 font-medium ${
              m.delta.startsWith('+') ? 'text-emerald-600' : m.delta === '0' ? 'text-ink-400' : 'text-red-500'
            }`}>
              {m.delta} vs hora anterior
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-ink-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-ink-800 text-sm">Actividad del día</h2>
              <p className="text-xs text-ink-400">Conversaciones por hora</p>
            </div>
            <span className="text-xs text-ink-400">Hoy</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="hora" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="conversaciones" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} name="Entrantes" />
              <Area type="monotone" dataKey="resueltas" stroke="#10b981" fill="#d1fae5" strokeWidth={2} name="Resueltas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel status */}
        <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm">
          <h2 className="font-semibold text-ink-800 text-sm mb-4">Estado de canales</h2>
          <div className="space-y-3">
            {channelStatus.map(ch => (
              <div key={ch.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    ch.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                    ch.color === 'pink' ? 'bg-pink-50 text-pink-600' :
                    ch.color === 'sky' ? 'bg-sky-50 text-sky-600' :
                    ch.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                    'bg-ink-50 text-ink-400'
                  }`}>
                    <ch.icon size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink-800">{ch.name}</p>
                    <p className="text-xs text-ink-400">
                      {ch.conversations > 0 ? `${ch.conversations} activas` : 'Sin actividad'}
                    </p>
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${
                  ch.status === 'online' ? 'bg-emerald-400' :
                  ch.status === 'degraded' ? 'bg-amber-400' :
                  'bg-ink-300'
                }`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-800 text-sm">Alertas recientes</h2>
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <div className="space-y-3">
            {recentAlerts.map(alert => (
              <div key={alert.id} className={`p-3 rounded-lg border text-xs ${
                alert.severity === 'high' ? 'bg-red-50 border-red-100 text-red-700' :
                alert.severity === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                'bg-sky-50 border-sky-100 text-sky-700'
              }`}>
                <p className="font-medium leading-snug">{alert.message}</p>
                <p className="mt-1 opacity-70">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent conversations */}
        <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-800 text-sm">Requieren atención</h2>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{urgentConversations.length}</span>
          </div>
          <div className="space-y-2">
            {urgentConversations.map(conv => (
              <div key={conv.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-ink-50 cursor-pointer group transition-colors">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
                  {conv.userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink-800 truncate">{conv.userName}</p>
                  <p className="text-xs text-ink-400 truncate">{conv.lastMessage}</p>
                </div>
                <ArrowRight size={13} className="text-ink-300 group-hover:text-brand-500 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Today highlights */}
        <div className="bg-white rounded-xl border border-ink-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-800 text-sm">Objetivos de hoy</h2>
            <Zap size={15} className="text-brand-500" />
          </div>
          <div className="space-y-4">
            {todayHighlights.map(h => (
              <div key={h.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-ink-600">{h.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-ink-800">{h.value}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${h.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${h.ok ? 'bg-emerald-400' : 'bg-red-400'}`}
                      style={{ width: h.ok ? '85%' : '60%' }} />
                  </div>
                  <span className="text-xs text-ink-400">objetivo {h.target}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Agent performance quick view */}
          <div className="mt-5 pt-4 border-t border-ink-100">
            <p className="text-xs font-medium text-ink-600 mb-3">Top agentes hoy</p>
            {agentPerformance.slice(0, 3).map(ag => (
              <div key={ag.nombre} className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-700 truncate">{ag.nombre.split(' ')[0]}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width: `${ag.satisfaccion}%` }} />
                  </div>
                  <span className="text-xs text-ink-500 w-8 text-right">{ag.satisfaccion}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
