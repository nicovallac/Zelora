import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  FileText,
  Sparkles,
  ArrowUpRight,
  CheckCircle,
  StickyNote,
  Bot,
  Target,
  User,
  Send,
  RefreshCw,
  Clock,
  ToggleLeft,
  ToggleRight,
  Phone,
  Instagram,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { mockConversations, mockQAScores, mockCopilotSuggestions } from '../data/mock';
import { StatusBadge, SentimentBadge, Skeleton } from '../components/ui/primitives';
import type { Channel, Status, Conversation, TimelineEvent, Message } from '../types';
import { api } from '../services/api';
import type { ConvListItem, ConvDetail } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useWebSocket } from '../hooks/useWebSocket';

const CHANNEL_META: Record<string, { bg: string; color: string; border: string; label: string }> = {
  whatsapp: { bg: '#DCFCE7', color: '#16A34A', border: '#16A34A', label: 'WhatsApp' },
  instagram: { bg: 'linear-gradient(135deg,#833AB4,#FD1D1D,#FCB045)', color: '#fff', border: '#FD1D1D', label: 'Instagram' },
  web: { bg: '#E0F2FE', color: '#0284C7', border: '#0284C7', label: 'Web Chat' },
  tiktok: { bg: '#000', color: '#FE2C55', border: '#FE2C55', label: 'TikTok' },
  todos: { bg: '#F1F5F9', color: '#64748B', border: '#64748B', label: 'Todos' },
};

const CHANNEL_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  whatsapp: Phone,
  instagram: Instagram,
  web: Globe,
  tiktok: MessageSquare,
};

type ChannelFilter = 'todos' | Channel;
type StatusFilter = 'todos' | Status;
type MobileView = 'conversaciones' | 'chat' | 'ficha';

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function getInitials(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
}

// SLA elapsed time badge
function SlaTimerBadge({ lastMessageAt }: { lastMessageAt: string }) {
  const now = new Date();
  const last = new Date(lastMessageAt);
  const diffMs = now.getTime() - last.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 5) {
    return (
      <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
        <Clock size={8} /> {diffMin}m
      </span>
    );
  }
  if (diffMin < 15) {
    return (
      <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
        <Clock size={8} /> {diffMin}m
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-600">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      {diffMin}m
    </span>
  );
}

// QA Score badge
function QAScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-emerald-100 text-emerald-700' : score >= 65 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${color}`}>
      QA: {score}/100
    </span>
  );
}

function TimelineIcon({ tipo }: { tipo: TimelineEvent['tipo'] }) {
  const props = { size: 13 };
  switch (tipo) {
    case 'bot_start':
      return <Bot {...props} className="text-blue-500" />;
    case 'intent_detected':
      return <Target {...props} className="text-violet-500" />;
    case 'escalated':
      return <ArrowUpRight {...props} className="text-orange-500" />;
    case 'agent_reply':
      return <User {...props} className="text-emerald-500" />;
    case 'resolved':
      return <CheckCircle {...props} className="text-emerald-600" />;
    case 'note':
      return <StickyNote {...props} className="text-amber-500" />;
  }
}

const CHANNEL_TABS: { key: ChannelFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'web', label: 'Web' },
  { key: 'tiktok', label: 'TikTok' },
];

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'nuevo', label: 'Nuevo' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'escalado', label: 'Escalado' },
  { key: 'resuelto', label: 'Resuelto' },
];

// Map API ConvListItem → Conversation (local type)
function apiConvToLocal(c: ConvListItem): Conversation {
  return {
    id: c.id,
    channel: (c.canal as Channel) ?? 'web',
    status: (c.estado as Status) ?? 'nuevo',
    intent: c.intent ?? 'Consulta general',
    sentiment: (c.sentimiento as Conversation['sentiment']) ?? 'neutro',
    assignedAgent: c.agent_nombre,
    createdAt: c.created_at,
    lastMessageAt: c.last_message_at,
    lastMessage: '',
    messages: [],
    timeline: [],
    user: {
      id: c.user?.id ?? '',
      nombre: c.user?.nombre ?? 'Desconocido',
      apellido: c.user?.apellido ?? '',
      telefono: c.user?.telefono ?? '',
      email: c.user?.email ?? '',
      cedula: c.user?.cedula ?? '',
      tipoAfiliado: (c.user?.tipo_afiliado as Conversation['user']['tipoAfiliado']) ?? 'trabajador',
    },
  };
}

function apiDetailToLocal(d: ConvDetail, base: Conversation): Conversation {
  return {
    ...base,
    messages: d.messages.map((m) => ({
      id: m.id,
      role: m.role as Message['role'],
      content: m.content,
      timestamp: m.timestamp,
    })),
    timeline: d.timeline.map((t) => ({
      id: t.id,
      tipo: (t.tipo as TimelineEvent['tipo']) ?? 'note',
      descripcion: t.descripcion,
      timestamp: t.timestamp,
    })),
    lastMessage: d.messages[d.messages.length - 1]?.content ?? '',
  };
}

function ConversationListItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const meta = CHANNEL_META[conv.channel] ?? CHANNEL_META['web'];
  const ChannelIcon = CHANNEL_ICON[conv.channel] ?? MessageSquare;
  return (
    <button
      onClick={onClick}
      className={`relative flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
        isActive ? 'bg-brand-50' : ''
      }`}
    >
      {/* Channel color bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
        style={{ background: meta.border }}
      />
      {/* Avatar with channel badge */}
      <div className="relative flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
          {getInitials(conv.user.nombre, conv.user.apellido)}
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full"
          style={{ background: meta.bg, color: meta.color }}
        >
          <ChannelIcon size={9} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-semibold text-slate-900">
            {conv.user.nombre} {conv.user.apellido}
          </p>
          <div className="flex flex-shrink-0 items-center gap-1">
            <SlaTimerBadge lastMessageAt={conv.lastMessageAt} />
            <p className="text-[10px] text-slate-400">{formatTime(conv.lastMessageAt)}</p>
          </div>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="truncate text-xs text-slate-500">{conv.intent}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-400">{conv.lastMessage}</p>
        <div className="mt-1">
          <StatusBadge status={conv.status} />
        </div>
      </div>
    </button>
  );
}

// AI Copilot Panel
function CopilotPanel({
  intent,
  onInsert,
  disabled = false,
}: {
  intent: string;
  onInsert: (text: string) => void;
  disabled?: boolean;
}) {
  const { showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(
    mockCopilotSuggestions[intent] ?? mockCopilotSuggestions['default'] ?? []
  );

  // Update suggestions when intent changes
  useEffect(() => {
    setSuggestions(mockCopilotSuggestions[intent] ?? mockCopilotSuggestions['default'] ?? []);
  }, [intent]);

  function handleRegenerate() {
    setLoading(true);
    setTimeout(() => {
      // Rotate suggestions order to simulate regeneration
      setSuggestions((prev) => [...prev.slice(1), prev[0]]);
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="border-t border-slate-100 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-violet-500" />
          <p className="text-xs font-bold text-slate-700">Copiloto IA</p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={loading || disabled}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 transition disabled:opacity-50"
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Regenerar
        </button>
      </div>
      <p className="mb-2 text-[10px] text-slate-400">Sugerencias basadas en la intención detectada</p>
      <div className="space-y-2">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => {
              if (disabled) return;
              onInsert(sug);
              showSuccess('Sugerencia insertada');
            }}
            disabled={disabled}
            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left text-xs text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="line-clamp-2 leading-snug">{sug}</p>
          </button>
        ))}
      </div>
      {disabled && (
        <p className="mt-2 text-[10px] font-semibold text-amber-600">
          Copiloto deshabilitado porque el Agente de Ventas esta desactivado.
        </p>
      )}
    </div>
  );
}

export function InboxPage() {
  const { showSuccess, showError, showInfo } = useNotification();
  const { lastMessage, connected } = useWebSocket('/ws/inbox');

  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [usingApi, setUsingApi] = useState(false);

  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('todos');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(mockConversations[0].id);
  const [replyVal, setReplyVal] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('conversaciones');
  const [salesAgentAutomatic, setSalesAgentAutomatic] = useState(true);
  const autoReplyTracker = useRef<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load: try API, fall back to mock
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setListLoading(true);
      try {
        const data = await api.getConversations();
        if (cancelled) return;
        const mapped = data.map(apiConvToLocal);
        setConversations(mapped);
        setUsingApi(true);
        if (mapped.length > 0) setActiveId(mapped[0].id);
      } catch {
        // Fall back to mock data (already default)
        setUsingApi(false);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  // When activeId changes: if using API, fetch detail
  useEffect(() => {
    if (!usingApi) return;
    let cancelled = false;
    async function loadDetail() {
      setDetailLoading(true);
      try {
        const detail = await api.getConversation(activeId);
        if (cancelled) return;
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? apiDetailToLocal(detail, c) : c))
        );
      } catch {
        // keep existing data
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    void loadDetail();
    return () => { cancelled = true; };
  }, [activeId, usingApi]);

  // Auto-scroll on active conversation messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, conversations]);

  // Automatic sales agent: responds to the latest user message
  useEffect(() => {
    if (!salesAgentAutomatic) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv || conv.messages.length === 0) return;

    const lastMsg = conv.messages[conv.messages.length - 1];
    if (lastMsg.role !== 'user') return;

    const key = `${conv.id}:${lastMsg.id}`;
    if (autoReplyTracker.current.has(key)) return;
    autoReplyTracker.current.add(key);

    setShowTyping(true);
    const timer = setTimeout(() => {
      const suggestions = mockCopilotSuggestions[conv.intent] ?? mockCopilotSuggestions['default'] ?? [];
      const autoText =
        suggestions[0] ??
        'Gracias por tu mensaje. Soy el Agente de Ventas y ya estoy gestionando tu solicitud automaticamente.';

      const botMsg: Message = {
        id: `auto-${Date.now()}`,
        role: 'bot',
        content: autoText,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id ? { ...c, messages: [...c.messages, botMsg], lastMessage: autoText } : c
        )
      );
      setShowTyping(false);
      showInfo('Agente de Ventas (auto)', 'Respuesta automatica enviada');
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeId, conversations, salesAgentAutomatic, showInfo]);

  // WebSocket event handling
  useEffect(() => {
    if (!lastMessage) return;
    const evt = lastMessage as { event?: string; conversation_id?: string; status?: string };
    if (evt.event === 'new_message') {
      showInfo('Nuevo mensaje en conversación');
    } else if (evt.event === 'status_changed' && evt.conversation_id && evt.status) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === evt.conversation_id ? { ...c, status: evt.status as Status } : c
        )
      );
    }
  }, [lastMessage, showInfo]);

  const filtered = conversations.filter((c) => {
    if (channelFilter !== 'todos' && c.channel !== channelFilter) return false;
    if (statusFilter !== 'todos' && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.user.nombre.toLowerCase().includes(q) ||
        c.user.apellido.toLowerCase().includes(q) ||
        c.intent.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const active =
    conversations.find((c) => c.id === activeId) ?? conversations[0] ?? mockConversations[0];

  const qaScore = mockQAScores[active.id];
  const pendientes = conversations.filter((c) => c.status === 'nuevo' || c.status === 'en_proceso').length;
  const escaladas = conversations.filter((c) => c.status === 'escalado').length;

  // Send message handler
  const handleSend = useCallback(async () => {
    if (salesAgentAutomatic) {
      showInfo('Modo automatico activo', 'El Agente de Ventas esta atendiendo la conversacion automaticamente.');
      return;
    }
    if (!replyVal.trim()) return;
    const content = replyVal.trim();
    setReplyVal('');
    setSendingMsg(true);

    // Optimistic update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'agent',
      content,
      timestamp: new Date().toISOString(),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, tempMsg], lastMessage: content }
          : c
      )
    );

    try {
      await api.sendMessage(activeId, content);
      showSuccess('Mensaje enviado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar';
      showError('Error', msg);
      // Rollback optimistic update
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: c.messages.filter((m) => m.id !== tempMsg.id) }
            : c
        )
      );
      setReplyVal(content);
    } finally {
      setSendingMsg(false);
    }
  }, [activeId, replyVal, salesAgentAutomatic, showSuccess, showError, showInfo]);

  // Enter key sends message
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey && replyVal.trim()) {
      void handleSend();
    }
  }

  // Escalate handler
  const handleEscalate = useCallback(async () => {
    try {
      await api.escalate(activeId);
      const now = new Date().toISOString();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                status: 'escalado' as Status,
                timeline: [
                  ...c.timeline,
                  {
                    id: `e-${Date.now()}`,
                    tipo: 'escalated' as TimelineEvent['tipo'],
                    descripcion: 'Conversación escalada por el asesor',
                    timestamp: now,
                  },
                ],
              }
            : c
        )
      );
      showSuccess('Conversación escalada');
    } catch {
      // Demo: apply locally anyway
      const now = new Date().toISOString();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                status: 'escalado' as Status,
                timeline: [
                  ...c.timeline,
                  {
                    id: `e-${Date.now()}`,
                    tipo: 'escalated' as TimelineEvent['tipo'],
                    descripcion: 'Conversación escalada por el asesor',
                    timestamp: now,
                  },
                ],
              }
            : c
        )
      );
      showSuccess('Conversación escalada');
    }
  }, [activeId, showSuccess]);

  // Resolve handler
  const handleResolve = useCallback(async () => {
    try {
      await api.resolve(activeId);
      const now = new Date().toISOString();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                status: 'resuelto' as Status,
                timeline: [
                  ...c.timeline,
                  {
                    id: `r-${Date.now()}`,
                    tipo: 'resolved' as TimelineEvent['tipo'],
                    descripcion: 'Conversación resuelta por el asesor',
                    timestamp: now,
                  },
                ],
              }
            : c
        )
      );
      showSuccess('Conversación resuelta');
    } catch {
      // Demo: apply locally anyway
      const now = new Date().toISOString();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                status: 'resuelto' as Status,
                timeline: [
                  ...c.timeline,
                  {
                    id: `r-${Date.now()}`,
                    tipo: 'resolved' as TimelineEvent['tipo'],
                    descripcion: 'Conversación resuelta por el asesor',
                    timestamp: now,
                  },
                ],
              }
            : c
        )
      );
      showSuccess('Conversación resuelta');
    }
  }, [activeId, showSuccess]);

  // IA response handler — improved: uses copilot suggestions
  const handleIA = useCallback(() => {
    if (salesAgentAutomatic) {
      showInfo('Modo automatico activo', 'La IA de ventas ya esta respondiendo automaticamente.');
      return;
    }
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      const suggestions = mockCopilotSuggestions[active.intent] ?? mockCopilotSuggestions['default'] ?? [];
      const iaResponse = suggestions[0] ?? 'Estoy consultando la información para ayudarle mejor. Un momento por favor.';
      const iaMsg: Message = {
        id: `ia-${Date.now()}`,
        role: 'bot',
        content: iaResponse,
        timestamp: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, iaMsg], lastMessage: iaResponse }
            : c
        )
      );
      showSuccess('Respuesta IA generada');
    }, 1500);
  }, [active.intent, activeId, salesAgentAutomatic, showSuccess, showInfo]);

  return (
    <div className="space-y-4 px-3 pb-4 pt-4 sm:px-4 sm:pt-5 lg:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operacion Omnicanal</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-900">Inbox Unificado</h1>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => setSalesAgentAutomatic((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                salesAgentAutomatic
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Cambiar modo del Agente de Ventas"
            >
              {salesAgentAutomatic ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
              Agente de Ventas: {salesAgentAutomatic ? 'Automatico' : 'Manual'}
            </button>
            <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
              Pendientes: {pendientes}
            </span>
            <span className="rounded-lg bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
              Escaladas: {escaladas}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { label: 'Hub', to: '/omnichannel' },
              { label: 'Demo Web', to: '/demo-web' },
              { label: 'WhatsApp', to: '/whatsapp' },
              { label: 'Instagram', to: '/instagram' },
              { label: 'TikTok', to: '/tiktok' },
              { label: 'App Chat', to: '/app-chat' },
              { label: 'Analytics', to: '/analytics' },
            ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm lg:hidden">
        {[
          { key: 'conversaciones', label: 'Conversaciones' },
          { key: 'chat', label: 'Chat' },
          { key: 'ficha', label: 'Ficha' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setMobileView(item.key as MobileView)}
            className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
              mobileView === item.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1">
            {CHANNEL_TABS.map((t) => {
              const meta = CHANNEL_META[t.key] ?? CHANNEL_META['todos'];
              const isActive = channelFilter === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setChannelFilter(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.key !== 'todos' && (
                    <span
                      className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: meta.border }}
                    />
                  )}
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === t.key
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 lg:ml-auto">
            <button
              onClick={() => setSalesAgentAutomatic((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                salesAgentAutomatic
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } sm:hidden`}
            >
              {salesAgentAutomatic ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
              {salesAgentAutomatic ? 'Auto ON' : 'Manual ON'}
            </button>
            {/* WS connection indicator */}
            <div
              className="flex items-center gap-1.5"
              title={connected ? 'Tiempo real conectado' : 'Tiempo real desconectado'}
            >
              <div
                className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`}
              />
              <span className="text-[10px] font-semibold text-slate-400">
                {connected ? 'En vivo' : 'Offline'}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 lg:w-auto lg:flex-none">
              <Search size={13} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder-slate-400 lg:w-40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-220px)] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* LEFT: Conversation list */}
        <div
          className={`${
            mobileView === 'conversaciones' ? 'flex' : 'hidden'
          } flex-col border-b border-slate-200 bg-white lg:flex lg:border-b-0 lg:border-r`}
        >
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="text-xs font-semibold text-slate-500">
              {listLoading ? '...' : `${filtered.length} conversaciones`}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 border-b border-slate-100 px-4 py-3">
                    <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">Sin resultados</div>
            ) : (
              filtered.map((conv) => (
                <ConversationListItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeId}
                  onClick={() => {
                    setActiveId(conv.id);
                    setMobileView('chat');
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* MIDDLE: Active conversation */}
        <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} min-h-[60vh] flex-col bg-slate-50 lg:flex lg:min-h-0`}>
          {/* Header */}
          {(() => {
            const meta = CHANNEL_META[active.channel] ?? CHANNEL_META['web'];
            const ChannelIcon = CHANNEL_ICON[active.channel] ?? MessageSquare;
            return (
              <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                <div className="relative flex-shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {getInitials(active.user.nombre, active.user.apellido)}
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <ChannelIcon size={10} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {active.user.nombre} {active.user.apellido}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      <ChannelIcon size={9} />
                      {meta.label}
                    </span>
                    <StatusBadge status={active.status} />
                    {active.assignedAgent && (
                      <span className="text-xs text-slate-500">· {active.assignedAgent}</span>
                    )}
                    {active.status === 'resuelto' && qaScore !== undefined && (
                      <QAScoreBadge score={qaScore} />
                    )}
                  </div>
                </div>
                <p className="flex-shrink-0 text-xs text-slate-400">{formatDate(active.createdAt)}</p>
              </div>
            );
          })()}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
            {detailLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                    <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                    <Skeleton className={`h-14 rounded-2xl ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
                  </div>
                ))}
              </div>
            ) : (
              active.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? '' : 'flex-row-reverse'}`}
                >
                  {msg.role === 'user' && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                      {getInitials(active.user.nombre, active.user.apellido)}
                    </div>
                  )}
                  {msg.role === 'bot' && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100">
                      <Bot size={13} className="text-brand-600" />
                    </div>
                  )}
                  {msg.role === 'agent' && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <User size={13} className="text-emerald-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'rounded-bl-sm bg-white text-slate-800 shadow-sm border border-slate-100'
                        : msg.role === 'bot'
                        ? 'rounded-br-sm bg-brand-600 text-white'
                        : 'rounded-br-sm bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {msg.role === 'agent' && (
                      <p className="mb-0.5 text-[10px] font-bold text-emerald-700">
                        Asesor: {active.assignedAgent ?? 'Tú'}
                      </p>
                    )}
                    <p className="leading-snug">{msg.content}</p>
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        msg.role === 'user'
                          ? 'text-slate-400'
                          : msg.role === 'agent'
                          ? 'text-emerald-600'
                          : 'text-white/60'
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* IA typing indicator */}
            {showTyping && (
              <div className="flex items-end gap-2 flex-row-reverse">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100">
                  <Bot size={13} className="text-brand-600" />
                </div>
                <div className="rounded-2xl rounded-br-sm bg-brand-600 px-4 py-3">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action bar */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <input
                type="text"
                value={replyVal}
                onChange={(e) => setReplyVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={salesAgentAutomatic ? 'Modo automatico activo: el agente responde solo' : 'Escribe una respuesta manual...'}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                disabled={sendingMsg || salesAgentAutomatic}
              />
              <button
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition disabled:opacity-40"
                disabled={!replyVal.trim() || sendingMsg || salesAgentAutomatic}
                onClick={() => void handleSend()}
              >
                <Send size={13} />
              </button>
            </div>
            {salesAgentAutomatic && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                El Agente de Ventas esta en modo automatico y gestiona toda la conversacion.
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition">
                <FileText size={11} /> Plantilla
              </button>
              <button
                onClick={handleIA}
                disabled={showTyping || salesAgentAutomatic}
                className="flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-200 transition disabled:opacity-50"
              >
                <Sparkles size={11} /> IA
              </button>
              <button
                onClick={() => void handleEscalate()}
                className="flex items-center gap-1 rounded-lg bg-orange-100 px-2.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-200 transition"
              >
                <ArrowUpRight size={11} /> Escalar
              </button>
              <button
                onClick={() => void handleResolve()}
                className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition"
              >
                <CheckCircle size={11} /> Resolver
              </button>
              <button className="flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200 transition">
                <StickyNote size={11} /> Nota
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: User profile + timeline + AI Copilot */}
        <div
          className={`${
            mobileView === 'ficha' ? 'flex' : 'hidden'
          } flex-col gap-0 overflow-y-auto border-t border-slate-200 bg-white lg:flex lg:border-l lg:border-t-0`}
        >
          {/* User profile */}
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {getInitials(active.user.nombre, active.user.apellido)}
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  {active.user.nombre} {active.user.apellido}
                </p>
                <p className="text-xs capitalize text-slate-500">{active.user.tipoAfiliado}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="w-16 flex-shrink-0 font-semibold text-slate-500">Cédula</span>
                <span className="text-slate-700">{active.user.cedula}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-16 flex-shrink-0 font-semibold text-slate-500">Teléfono</span>
                <span className="text-slate-700">{active.user.telefono}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-16 flex-shrink-0 font-semibold text-slate-500">Email</span>
                <span className="truncate text-slate-700">{active.user.email}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <SentimentBadge sentiment={active.sentiment} />
              <StatusBadge status={active.status} />
            </div>
          </div>

          {/* Timeline */}
          <div className="p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Línea de tiempo
            </p>
            <div className="space-y-3">
              {active.timeline.map((event, idx) => (
                <div key={event.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                      <TimelineIcon tipo={event.tipo} />
                    </div>
                    {idx < active.timeline.length - 1 && (
                      <div
                        className="mt-1 w-px flex-1 bg-slate-100"
                        style={{ minHeight: 16 }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 pb-3">
                    <p className="text-xs leading-snug text-slate-700">{event.descripcion}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Copilot panel */}
          <CopilotPanel
            intent={active.intent}
            onInsert={(text) => setReplyVal(text)}
            disabled={salesAgentAutomatic}
          />
        </div>
      </div>
    </div>
  );
}
