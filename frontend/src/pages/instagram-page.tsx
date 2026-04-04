import { useState } from 'react';
import { Send, Target, ArrowUpRight } from 'lucide-react';
import { mockConversations } from '../data/mock';
import { SentimentBadge } from '../components/ui/primitives';
import type { Conversation } from '../types';

type Filter = 'all' | 'unread' | 'escalated';

const igConversations: Conversation[] = [
  mockConversations[2], // instagram, PQRS, negativo
  {
    id: 'ig-2',
    channel: 'instagram',
    status: 'resuelto',
    user: { id: 'ig2u', nombre: 'Daniela', apellido: 'Saenz Mora', telefono: '@danisaenz', email: 'dani@gmail.com', cedula: '1.070.234.567', tipoAfiliado: 'trabajador' },
    intent: 'Subsidio familiar',
    sentiment: 'positivo',
    assignedAgent: undefined,
    createdAt: '2026-03-09T09:00:00Z',
    lastMessageAt: '2026-03-09T09:08:00Z',
    lastMessage: 'Gracias, perfecto!',
    messages: [
      { id: 'igm1', role: 'user', content: '¿Me pueden ayudar con el subsidio familiar? Acabo de ver su publicación.', timestamp: '2026-03-09T09:00:00Z' },
      { id: 'igm2', role: 'bot', content: '¡Hola Daniela! Con gusto te ayudamos. Para consultar tu subsidio, necesito tu número de cédula.', timestamp: '2026-03-09T09:00:10Z' },
      { id: 'igm3', role: 'user', content: '1.070.234.567', timestamp: '2026-03-09T09:01:00Z' },
      { id: 'igm4', role: 'bot', content: '✅ Tu subsidio de marzo está programado para el 20 de marzo. ¿Algo más?', timestamp: '2026-03-09T09:01:10Z' },
      { id: 'igm5', role: 'user', content: 'Gracias, perfecto!', timestamp: '2026-03-09T09:08:00Z' },
    ],
    timeline: [],
  },
  {
    id: 'ig-3',
    channel: 'instagram',
    status: 'nuevo',
    user: { id: 'ig3u', nombre: 'Luisa', apellido: 'Arbelaez', telefono: '@luisaarbelaez', email: 'luisa@gmail.com', cedula: '1.090.345.678', tipoAfiliado: 'independiente' },
    intent: 'Información general',
    sentiment: 'neutro',
    assignedAgent: undefined,
    createdAt: '2026-03-09T11:00:00Z',
    lastMessageAt: '2026-03-09T11:01:00Z',
    lastMessage: 'Hola, ¿cómo me afilio?',
    messages: [
      { id: 'igm6', role: 'user', content: 'Hola, ¿cómo me afilio como independiente?', timestamp: '2026-03-09T11:00:00Z' },
      { id: 'igm7', role: 'bot', content: 'Hola Luisa! El proceso de afiliación como independiente es sencillo. ¿Quieres que te explique los pasos o prefieres que un asesor te guíe?', timestamp: '2026-03-09T11:00:08Z' },
    ],
    timeline: [],
  },
];

function getInitials(nombre: string, apellido: string) {
  return `${nombre[0]}${apellido[0]}`.toUpperCase();
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const FILTER_LABELS: Record<Filter, string> = { all: 'Todos', unread: 'Sin leer', escalated: 'Escalados' };

export function InstagramPage() {
  const [activeId, setActiveId] = useState('c3');
  const [filter, setFilter] = useState<Filter>('all');
  const [inputVal, setInputVal] = useState('');

  const filtered = igConversations.filter((c) => {
    if (filter === 'unread') return c.status === 'nuevo';
    if (filter === 'escalated') return c.status === 'escalado' || c.status === 'en_proceso';
    return true;
  });

  const active = igConversations.find((c) => c.id === activeId) ?? igConversations[0];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm text-pink-800">
        <strong>Simulador Instagram DM:</strong> Gestión de mensajes directos con clasificación automática de intención y sentimiento.
      </div>

      <div className="overflow-hidden rounded-2xl border border-[rgba(17,17,16,0.09)] shadow-card" style={{ height: '620px' }}>
        <div className="flex h-full">
          {/* Left panel */}
          <div className="flex w-72 flex-shrink-0 flex-col border-r border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm">
            {/* Instagram header */}
            <div className="flex items-center gap-3 px-4 py-4" style={{ background: 'linear-gradient(135deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">CF</div>
              <div>
                <p className="text-sm font-bold text-white">comfaguajira</p>
                <p className="text-xs text-white/80">Mensajes directos</p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1 border-b border-[rgba(17,17,16,0.06)] px-3 py-2">
              {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                    filter === f ? 'bg-pink-100 text-pink-700' : 'text-ink-400 hover:bg-[rgba(17,17,16,0.06)]'
                  }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`flex w-full items-start gap-3 border-b border-[rgba(17,17,16,0.04)] px-4 py-3 text-left transition hover:bg-[rgba(17,17,16,0.025)] ${isActive ? 'bg-pink-50' : ''}`}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' }}
                    >
                      {getInitials(conv.user.nombre, conv.user.apellido)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {conv.user.telefono.startsWith('@') ? conv.user.telefono : conv.user.nombre}
                        </p>
                        <p className="text-[10px] text-ink-400">{formatTime(conv.lastMessageAt)}</p>
                      </div>
                      <p className="truncate text-xs text-ink-400">{conv.lastMessage}</p>
                      <div className="mt-1">
                        <SentimentBadge sentiment={conv.sentiment} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main panel */}
          <div className="flex flex-1 flex-col bg-white/70 backdrop-blur-sm">
            {/* Contact header */}
            <div className="flex items-center gap-3 border-b border-[rgba(17,17,16,0.06)] px-4 py-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' }}
              >
                {getInitials(active.user.nombre, active.user.apellido)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-ink-900">
                  {active.user.telefono.startsWith('@') ? active.user.telefono : `${active.user.nombre} ${active.user.apellido}`}
                </p>
                <div className="flex items-center gap-2">
                  <SentimentBadge sentiment={active.sentiment} />
                  <span className="text-xs text-ink-400">{active.intent}</span>
                </div>
              </div>
            </div>

            {/* Intent detection banner */}
            <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
              <Target size={15} />
              <span>
                <strong>Intención detectada: {active.intent}</strong> · Confianza 87% ·{' '}
                <span className={active.sentiment === 'negativo' ? 'font-semibold text-red-600' : active.sentiment === 'positivo' ? 'font-semibold text-emerald-600' : ''}>
                  Sentimiento {active.sentiment}
                </span>
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-[rgba(17,17,16,0.025)] p-4">
              {active.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  {msg.role === 'user' && (
                    <div
                      className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' }}
                    >
                      {getInitials(active.user.nombre, active.user.apellido)}
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'rounded-tl-sm bg-white/70 backdrop-blur-sm text-ink-800 shadow-card border border-[rgba(17,17,16,0.06)]'
                        : msg.role === 'agent'
                        ? 'rounded-tr-sm bg-emerald-100 text-emerald-900'
                        : 'rounded-tr-sm text-white'
                    }`}
                    style={msg.role === 'bot' ? { background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' } : {}}
                  >
                    {msg.role === 'agent' && <p className="mb-0.5 text-[10px] font-bold text-emerald-700">Asesor: {active.assignedAgent}</p>}
                    <p>{msg.content}</p>
                    <p className={`mt-1 text-right text-[10px] ${msg.role !== 'user' ? 'text-white/70' : 'text-ink-400'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action bar */}
            <div className="border-t border-[rgba(17,17,16,0.06)] bg-white/70 backdrop-blur-sm p-3">
              <div className="mb-2 flex gap-2">
                <button className="flex items-center gap-1.5 rounded-xl bg-pink-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-pink-600">
                  Responder con IA
                </button>
                <button className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-100">
                  <ArrowUpRight size={12} /> Escalar a asesor
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  className="flex-1 bg-transparent text-sm text-ink-800 placeholder:text-ink-400 outline-none"
                />
                <button
                  disabled={!inputVal.trim()}
                  onClick={() => setInputVal('')}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' }}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Right panel - contact info */}
          <div className="hidden w-56 flex-shrink-0 flex-col gap-4 overflow-y-auto border-l border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-4 xl:flex">
            <div>
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' }}
              >
                {getInitials(active.user.nombre, active.user.apellido)}
              </div>
              <p className="mt-2 text-center text-sm font-bold text-ink-900">
                {active.user.nombre} {active.user.apellido}
              </p>
              <p className="text-center text-xs text-ink-400">{active.user.telefono}</p>
            </div>

            <div className="rounded-xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] p-3 text-xs space-y-2">
              <p className="font-semibold text-ink-700">Información</p>
              <div>
                <span className="text-ink-400">Tipo afiliado: </span>
                <span className="font-medium capitalize text-ink-800">{active.user.tipoAfiliado}</span>
              </div>
              <div>
                <span className="text-ink-400">Intención: </span>
                <span className="font-medium text-ink-800">{active.intent}</span>
              </div>
              <div>
                <span className="text-ink-400">Estado: </span>
                <span className="font-medium capitalize text-ink-800">{active.status.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink-700">Sentimiento</p>
              <SentimentBadge sentiment={active.sentiment} />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-ink-700">Historial de intenciones</p>
              <div className="rounded-lg border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] p-2 text-xs text-ink-600">
                <p>• {active.intent}</p>
                <p className="text-ink-400">Conversación actual</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
