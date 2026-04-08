import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Square,
  List,
  GitBranch,
  Zap,
  ArrowUpRight,
  MessageCircle,
  Edit3,
  Plus,
  X,
  Bot,
  Sparkles,
  Minus,
  RotateCcw,
  Trash2,
  AlertTriangle,
  ImageIcon,
  Tags,
  Clock,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import type { FlowApiItem, FlowPayload } from '../services/api';

type FlowNodeType =
  | 'start'
  | 'message'
  | 'quickReply'
  | 'collect'
  | 'condition'
  | 'api'
  | 'delay'
  | 'tag'
  | 'media'
  | 'escalate'
  | 'ai_reply'
  | 'end';

interface FlowNode {
  id: string;
  tipo: FlowNodeType;
  label: string;
  contenido?: string;
  opciones?: string[];
  variable?: string;
  pregunta?: string;
  endpoint?: string;
  delayMs?: number;
  mediaType?: 'image' | 'pdf' | 'video';
  mediaUrl?: string;
  tagValue?: string;
  // Condition node
  operator?: string;
  conditionValue?: string;
  // Collect node
  inputType?: 'text' | 'number' | 'email' | 'phone' | 'option';
  // Escalate node
  reason?: string;
  x: number;
  y: number;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface Flow {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  canales: Array<'web' | 'whatsapp' | 'instagram' | 'tiktok' | 'app-chat'>;
  routerConfig: {
    triggerType: 'intent' | 'keyword' | 'hybrid' | 'manual';
    intent: string;
    keywords: string[];
    confidenceThreshold: number;
    fallbackAction: 'request_clarification' | 'escalate_to_human';
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
}

function backendNodeToUi(n: Record<string, unknown>, index: number): FlowNode {
  const TIPO_MAP: Record<string, FlowNodeType> = { question: 'collect', action: 'api' };
  const tipo = (TIPO_MAP[(n.tipo as string)] ?? (n.tipo as string)) as FlowNodeType;
  const d = (n.data as Record<string, unknown>) ?? {};

  // Unpack nested data fields into flat FlowNode fields
  const contenido = (d.text ?? d.message ?? n.contenido ?? '') as string;
  const opciones = (d.options ?? n.opciones ?? []) as string[];
  const variable = (d.variable ?? n.variable ?? '') as string;
  const pregunta = (d.text ?? n.pregunta ?? '') as string;
  const endpoint = ((d.payload as Record<string, unknown>)?.url ?? n.endpoint ?? '') as string;
  const delayMs = (d.delayMs ?? n.delayMs) as number | undefined;
  const mediaType = (d.mediaType ?? n.mediaType) as FlowNode['mediaType'];
  const mediaUrl = (d.mediaUrl ?? n.mediaUrl ?? '') as string;
  const tagValue = (d.tagValue ?? n.tagValue ?? '') as string;
  const operator = (d.operator ?? n.operator ?? 'eq') as string;
  const conditionValue = (d.value ?? n.conditionValue ?? '') as string;
  const reason = (d.reason ?? n.reason ?? '') as string;

  // Generate a display label from existing label or infer from content
  const fallbackLabel = NODE_TYPE_LABELS[tipo] ?? tipo;
  const label = ((n.label as string) || (contenido ? contenido.slice(0, 24) : '') || fallbackLabel) as string;

  // Auto-assign canvas position if missing
  const x = typeof n.x === 'number' && isFinite(n.x) ? (n.x as number) : 210;
  const y = typeof n.y === 'number' && isFinite(n.y) ? (n.y as number) : 40 + index * 120;

  return {
    id: n.id as string,
    tipo,
    label,
    contenido: contenido || undefined,
    opciones: opciones.length ? opciones : undefined,
    variable: variable || undefined,
    pregunta: pregunta || undefined,
    endpoint: endpoint || undefined,
    delayMs,
    mediaType,
    mediaUrl: mediaUrl || undefined,
    tagValue: tagValue || undefined,
    operator,
    conditionValue: conditionValue || undefined,
    reason: reason || undefined,
    x,
    y,
  };
}

function mapApiFlowToUi(flow: FlowApiItem): Flow {
  return {
    id: flow.id,
    nombre: flow.name,
    descripcion: flow.description,
    activo: flow.is_active,
    canales: ((flow.canales ?? [flow.channel || 'whatsapp']) as Flow['canales']),
    routerConfig: {
      triggerType: (flow.router_config?.triggerType as Flow['routerConfig']['triggerType']) ?? 'intent',
      intent: flow.router_config?.intent ?? 'unknown',
      keywords: flow.router_config?.keywords ?? [],
      confidenceThreshold: flow.router_config?.confidenceThreshold ?? 0.8,
      fallbackAction: (flow.router_config?.fallbackAction as Flow['routerConfig']['fallbackAction']) ?? 'request_clarification',
    },
    nodes: ((flow.nodes ?? []) as unknown as Record<string, unknown>[]).map(backendNodeToUi),
    edges: (flow.edges as unknown as FlowEdge[]) ?? [],
    createdAt: flow.created_at,
  };
}

function nodeToBackend(node: FlowNode): Record<string, unknown> {
  const base = { id: node.id, tipo: node.tipo, label: node.label, x: node.x, y: node.y };
  switch (node.tipo) {
    case 'message':
      return { ...base, data: { text: node.contenido ?? '' } };
    case 'quickReply':
      return { ...base, data: { text: node.contenido ?? '', options: node.opciones ?? [] } };
    case 'collect':
      return { ...base, data: { text: node.pregunta ?? '', variable: node.variable ?? '', input_type: node.inputType ?? 'text' } };
    case 'condition':
      return { ...base, data: { variable: node.variable ?? '', operator: node.operator ?? 'eq', value: node.conditionValue ?? '' } };
    case 'api':
      return { ...base, data: { action_type: 'webhook', payload: { url: node.endpoint ?? '' } } };
    case 'delay':
      return { ...base, data: { delayMs: node.delayMs ?? 3000 } };
    case 'media':
      return { ...base, data: { mediaType: node.mediaType ?? 'image', mediaUrl: node.mediaUrl ?? '' } };
    case 'tag':
      return { ...base, data: { tagValue: node.tagValue ?? '' } };
    case 'escalate':
      return { ...base, data: { text: node.contenido ?? '', reason: node.reason ?? 'flow_escalation' } };
    case 'end':
      return { ...base, data: { message: node.contenido ?? '' } };
    default:
      return { ...base, data: {} };
  }
}

function edgeToBackend(edge: FlowEdge): Record<string, unknown> {
  let condition = 'default';
  if (edge.label) {
    const lower = edge.label.toLowerCase().trim();
    if (lower === 'si' || lower === 'yes') condition = 'yes';
    else if (lower === 'no') condition = 'no';
    else condition = `option:${edge.label}`;
  }
  return { id: edge.id, source: edge.source, target: edge.target, data: { condition } };
}

function mapUiFlowToPayload(flow: Flow): FlowPayload {
  return {
    name: flow.nombre,
    description: flow.descripcion,
    nodes: flow.nodes.map(nodeToBackend),
    edges: flow.edges.map(edgeToBackend),
    is_active: flow.activo,
    trigger: flow.routerConfig.intent,
    channel: flow.canales[0] ?? 'whatsapp',
    router_config: {
      triggerType: flow.routerConfig.triggerType,
      intent: flow.routerConfig.intent,
      keywords: flow.routerConfig.keywords,
      confidenceThreshold: flow.routerConfig.confidenceThreshold,
      fallbackAction: flow.routerConfig.fallbackAction,
    },
    canales: flow.canales,
  };
}

const EXTERNAL_DATABASE_LOOKUP_ENDPOINT = '/api/channels/database/lookup-affiliate/';

const CHANNEL_OPTIONS: Array<{ id: 'web' | 'whatsapp' | 'instagram' | 'tiktok' | 'app-chat'; label: string; className: string }> = [
  { id: 'web', label: 'Web', className: 'bg-blue-100 text-blue-700' },
  { id: 'whatsapp', label: 'WhatsApp', className: 'bg-emerald-100 text-emerald-700' },
  { id: 'instagram', label: 'Instagram', className: 'bg-pink-100 text-pink-700' },
  { id: 'tiktok', label: 'TikTok', className: 'bg-[rgba(17,17,16,0.06)] text-ink-700' },
  { id: 'app-chat', label: 'App Chat', className: 'bg-violet-100 text-violet-700' },
];
void CHANNEL_OPTIONS;

const NODE_CONFIG: Record<FlowNodeType, { color: string; bg: string; border: string; icon: React.ReactNode; shape: 'circle' | 'rect' | 'diamond' }> = {
  start: { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', icon: <Play size={14} />, shape: 'circle' },
  message: { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300', icon: <MessageCircle size={14} />, shape: 'rect' },
  quickReply: { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300', icon: <List size={14} />, shape: 'rect' },
  collect: { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', icon: <Edit3 size={14} />, shape: 'rect' },
  condition: { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300', icon: <GitBranch size={14} />, shape: 'diamond' },
  api: { color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300', icon: <Zap size={14} />, shape: 'rect' },
  delay: { color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-300', icon: <Clock size={14} />, shape: 'rect' },
  media: { color: 'text-fuchsia-700', bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', icon: <ImageIcon size={14} />, shape: 'rect' },
  tag: { color: 'text-teal-700', bg: 'bg-teal-100', border: 'border-teal-300', icon: <Tags size={14} />, shape: 'rect' },
  escalate: { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', icon: <ArrowUpRight size={14} />, shape: 'rect' },
  ai_reply: { color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300', icon: <Sparkles size={14} />, shape: 'rect' },
  end: { color: 'text-ink-600', bg: 'bg-[rgba(17,17,16,0.06)]', border: 'border-[rgba(17,17,16,0.12)]', icon: <Square size={14} />, shape: 'circle' },
};

const NODE_TYPE_LABELS: Record<FlowNodeType, string> = {
  start: 'Inicio',
  message: 'Mensaje',
  quickReply: 'Resp. rápida',
  collect: 'Recoger dato',
  condition: 'Condición',
  api: 'API',
  delay: 'Pausa',
  media: 'Media',
  tag: 'Etiquetar',
  escalate: 'Escalar',
  ai_reply: 'IA',
  end: 'Fin',
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 72;
const CANVAS_W = 780;

/** Apply auto-layout to a Flow's nodes. Pure function — returns new nodes array. */
function autoLayoutNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const V_GAP = 110;
  const H_GAP = 36;
  const TOP_PAD = 48;

  const visibleNodes = nodes.filter((n) => String(n.tipo) !== '__meta__');
  if (visibleNodes.length === 0) return nodes;
  const visibleIds = new Set(visibleNodes.map((n) => n.id));

  const outEdges = new Map<string, Array<{ target: string; label?: string }>>();
  visibleNodes.forEach((n) => outEdges.set(n.id, []));
  edges.forEach((e) => {
    if (!visibleIds.has(e.source) || !visibleIds.has(e.target)) return;
    outEdges.get(e.source)!.push({ target: e.target, label: e.label });
  });
  outEdges.forEach((list) => {
    list.sort((a, b) => {
      const order = (l?: string) => { const s = (l ?? '').toLowerCase(); if (s === 'si' || s === 'yes') return 0; if (s === 'no') return 2; return 1; };
      return order(a.label) - order(b.label);
    });
  });

  const rank = new Map<string, number>();
  const startNode = visibleNodes.find((n) => n.tipo === 'start') ?? visibleNodes[0];
  const queue: Array<{ id: string; r: number }> = [{ id: startNode.id, r: 0 }];
  rank.set(startNode.id, 0);
  while (queue.length > 0) {
    const { id, r } = queue.shift()!;
    for (const { target } of outEdges.get(id) ?? []) {
      const newR = r + 1;
      if (!rank.has(target) || rank.get(target)! < newR) { rank.set(target, newR); queue.push({ id: target, r: newR }); }
    }
  }
  let maxRank = Math.max(0, ...rank.values());
  visibleNodes.forEach((n) => { if (!rank.has(n.id)) rank.set(n.id, ++maxRank); });

  const byRank = new Map<number, string[]>();
  rank.forEach((r, id) => { if (!byRank.has(r)) byRank.set(r, []); byRank.get(r)!.push(id); });

  const parentOrder = new Map<string, number>();
  parentOrder.set(startNode.id, 0);
  Array.from(byRank.entries()).sort((a, b) => a[0] - b[0]).forEach(([, ids]) => {
    ids.sort((a, b) => (parentOrder.get(a) ?? 999) - (parentOrder.get(b) ?? 999));
    ids.forEach((id, i) => {
      (outEdges.get(id) ?? []).forEach(({ target }, j) => {
        if (!parentOrder.has(target)) parentOrder.set(target, i * 100 + j);
      });
    });
  });

  const xPos = new Map<string, number>();
  const yPos = new Map<string, number>();
  Array.from(byRank.entries()).sort((a, b) => a[0] - b[0]).forEach(([r, ids]) => {
    const totalW = ids.length * NODE_WIDTH + (ids.length - 1) * H_GAP;
    const startX = Math.max(16, Math.round((CANVAS_W - totalW) / 2));
    ids.forEach((id, i) => { xPos.set(id, startX + i * (NODE_WIDTH + H_GAP)); yPos.set(id, TOP_PAD + r * (NODE_HEIGHT + V_GAP)); });
  });

  return nodes.map((n) =>
    xPos.has(n.id) ? { ...n, x: xPos.get(n.id)!, y: yPos.get(n.id)! } : n
  );
}

// Calculate node center for edge drawing
function nodeCenter(node: FlowNode) {
  return {
    x: node.x + NODE_WIDTH / 2,
    y: node.y + NODE_HEIGHT / 2,
  };
}

function FlowNodeCard({ node, isSelected, onClick, onPointerDown, onLinkStart, onLinkComplete }: {
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
  onPointerDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onLinkStart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onLinkComplete: () => void;
}) {
  const cfg = NODE_CONFIG[node.tipo];

  if (cfg.shape === 'circle') {
    return (
      <div
        onMouseDown={onPointerDown}
        onMouseUp={onLinkComplete}
        onClick={onClick}
        style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
        className={`absolute flex cursor-grab flex-col items-center justify-center overflow-visible rounded-full border-2 transition active:cursor-grabbing ${cfg.bg} ${cfg.border} ${isSelected ? 'ring-2 ring-brand-400 ring-offset-2' : 'hover:shadow-md'}`}
      >
        <div className={`${cfg.color} mb-0.5`}>{cfg.icon}</div>
        <p className={`text-xs font-bold ${cfg.color}`}>{node.label}</p>
        {node.tipo !== 'end' && (
          <button
            onMouseDown={onLinkStart}
            className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-brand-300 bg-white/70 backdrop-blur-sm text-brand-600 shadow-card transition hover:scale-110"
            title="Conectar con otro nodo"
          />
        )}
      </div>
    );
  }

  if (cfg.shape === 'diamond') {
    return (
      <div
        onMouseDown={onPointerDown}
        onMouseUp={onLinkComplete}
        onClick={onClick}
        style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
        className={`absolute cursor-grab active:cursor-grabbing ${isSelected ? 'ring-2 ring-brand-400 ring-offset-2 rounded-lg' : ''}`}
      >
        <div
          className={`absolute inset-0 rounded-lg border-2 ${cfg.bg} ${cfg.border}`}
          style={{ transform: 'rotate(6deg)' }}
        />
        <div className="relative flex h-full flex-col items-center justify-center gap-0.5">
          <div className={cfg.color}>{cfg.icon}</div>
          <p className={`text-xs font-bold ${cfg.color}`}>{node.label}</p>
          {node.tipo !== 'end' && (
            <button
              onMouseDown={onLinkStart}
              className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-brand-300 bg-white/70 backdrop-blur-sm text-brand-600 shadow-card transition hover:scale-110"
              title="Conectar con otro nodo"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseDown={onPointerDown}
      onMouseUp={onLinkComplete}
      onClick={onClick}
      style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
      className={`absolute cursor-grab overflow-visible rounded-xl border-2 p-3 transition active:cursor-grabbing ${cfg.bg} ${cfg.border} ${isSelected ? 'ring-2 ring-brand-400 ring-offset-2' : 'hover:shadow-md'}`}
    >
      <div className={`mb-1 flex items-center gap-1.5 ${cfg.color}`}>
        {cfg.icon}
        <p className="text-xs font-bold">{node.label}</p>
      </div>
      {node.contenido && (
        <p className="truncate text-[10px] text-ink-600">{node.contenido.slice(0, 40)}...</p>
      )}
      {node.opciones && (
        <div className="mt-1 flex flex-wrap gap-0.5">
          {node.opciones.slice(0, 2).map((o) => (
            <span key={o} className="rounded bg-white/70 px-1 py-0.5 text-[9px] font-semibold text-ink-600">{o}</span>
          ))}
          {node.opciones.length > 2 && (
            <span className="rounded bg-white/70 px-1 py-0.5 text-[9px] text-ink-400">+{node.opciones.length - 2}</span>
          )}
        </div>
      )}
      {node.variable && (
        <p className="text-[10px] text-ink-400">var: <span className="font-mono font-semibold">{node.variable}</span></p>
      )}
      {node.endpoint && (
        <p className="truncate text-[10px] font-mono text-ink-400">{node.endpoint}</p>
      )}
      {node.delayMs !== undefined && (
        <p className="text-[10px] text-ink-400">espera: {node.delayMs} ms</p>
      )}
      {node.mediaType && (
        <p className="truncate text-[10px] text-ink-400">{node.mediaType}: {node.mediaUrl ?? 'sin URL'}</p>
      )}
      {node.tagValue && (
        <p className="text-[10px] text-ink-400">tag: <span className="font-semibold">{node.tagValue}</span></p>
      )}
      {node.tipo !== 'end' && (
        <button
          onMouseDown={onLinkStart}
          className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-brand-300 bg-white/70 backdrop-blur-sm text-brand-600 shadow-card transition hover:scale-110"
          title="Conectar con otro nodo"
        />
      )}
    </div>
  );
}

// Mini chat simulation modal
function SimulationModal({ flow, onClose }: { flow: Flow; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([]);
  const [started, setStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const runRef = useRef(false);

  function getNodeById(id: string) {
    return flow.nodes.find((n) => n.id === id);
  }
  function getNextNodes(nodeId: string) {
    return flow.edges.filter((e) => e.source === nodeId).map((e) => getNodeById(e.target)).filter(Boolean);
  }

  function buildSequence() {
    const startNode = flow.nodes.find((n) => n.tipo === 'start');
    if (!startNode) return [] as { role: 'bot' | 'user'; text: string }[];
    const sequence: { role: 'bot' | 'user'; text: string }[] = [];
    let current = startNode;
    let depth = 0;
    while (current && depth < 8) {
      if (current.tipo === 'message') {
        sequence.push({ role: 'bot', text: current.contenido ?? current.label });
      } else if (current.tipo === 'quickReply') {
        sequence.push({ role: 'bot', text: `Opciones: ${(current.opciones ?? []).join(' | ')}` });
        if (current.opciones?.[0]) {
          sequence.push({ role: 'user', text: current.opciones[0] });
        }
      } else if (current.tipo === 'collect') {
        sequence.push({ role: 'bot', text: current.pregunta ?? `Ingresa ${current.variable}` });
        sequence.push({ role: 'user', text: `[${current.variable ?? 'dato'}]` });
      } else if (current.tipo === 'api') {
        sequence.push({ role: 'bot', text: `Consultando ${current.endpoint ?? 'sistema'}...` });
      } else if (current.tipo === 'delay') {
        sequence.push({ role: 'bot', text: `Esperando ${Math.round((current.delayMs ?? 3000) / 1000)} segundos...` });
      } else if (current.tipo === 'media') {
        sequence.push({ role: 'bot', text: `Enviando ${current.mediaType ?? 'archivo'}: ${current.mediaUrl ?? 'recurso adjunto'}` });
      } else if (current.tipo === 'tag') {
        sequence.push({ role: 'bot', text: `Etiqueta aplicada: ${current.tagValue ?? 'sin_tag'}` });
      } else if (current.tipo === 'end') {
        sequence.push({ role: 'bot', text: 'Conversación finalizada. ¡Hasta luego!' });
        break;
      }
      const nexts = getNextNodes(current.id);
      if (nexts.length === 0 || !nexts[0]) break;
      current = nexts[0] as FlowNode;
      depth++;
    }
    return sequence;
  }

  async function start() {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    setStarted(true);
    setMessages([]);
    setStep(0);
    setIsTyping(false);
    runRef.current = true;

    const sequence = buildSequence();
    for (const msg of sequence) {
      if (!runRef.current) return;
      if (msg.role === 'bot') {
        setIsTyping(true);
        await delay(650);
      }
      if (!runRef.current) return;
      setIsTyping(false);
      setMessages((prev) => [...prev, msg]);
      setStep((prev) => prev + 1);
      await delay(msg.role === 'bot' ? 500 : 350);
    }
  }

  function stop() {
    runRef.current = false;
    setIsTyping(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(17,17,16,0.45)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-96 rounded-2xl bg-white/70 backdrop-blur-sm shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-brand-600" />
            <h3 className="font-bold text-ink-900">Simulación: {flow.nombre}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[rgba(17,17,16,0.06)] transition">
            <X size={16} className="text-ink-400" />
          </button>
        </div>

        <div className="h-80 overflow-y-auto bg-[rgba(17,17,16,0.025)] p-4 space-y-3">
          {!started && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-400">
              <Play size={32} strokeWidth={1.5} />
              <p className="text-sm">Presiona Iniciar para simular el flujo</p>
            </div>
          )}
          {messages.slice(0, step).map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? '' : 'flex-row-reverse'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === 'bot'
                  ? 'rounded-br-sm bg-brand-500 text-white'
                  : 'rounded-bl-sm bg-white/70 backdrop-blur-sm border border-[rgba(17,17,16,0.09)] text-ink-800'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex flex-row-reverse">
              <div className="rounded-2xl rounded-br-sm bg-brand-500 px-3.5 py-2.5 text-sm text-white">
                escribiendo...
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-[rgba(17,17,16,0.06)] px-5 py-4">
          <button
            onClick={start}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition"
          >
            <Play size={14} /> {started ? 'Reiniciar' : 'Iniciar simulación'}
          </button>
          <button
            onClick={() => {
              stop();
              onClose();
            }}
            className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-[rgba(17,17,16,0.025)] transition"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CustomIntentsModal({
  intents,
  onClose,
  onCreated,
  onDeleted,
}: {
  intents: { id: string | null; value: string; label: string; is_custom: boolean; keywords?: string[] }[];
  onClose: () => void;
  onCreated: (intent: { id: string; value: string; label: string; is_custom: boolean; keywords: string[] }) => void;
  onDeleted: (id: string) => void;
}) {
  const { showError, showSuccess } = useNotification();
  const [label, setLabel] = useState('');
  const [keywords, setKeywords] = useState('');
  const [saving, setSaving] = useState(false);

  const customIntents = intents.filter((i) => i.is_custom);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimLabel = label.trim();
    if (!trimLabel) return;
    const kws = keywords.split(',').map((k) => k.trim()).filter(Boolean);
    if (kws.length === 0) return;
    setSaving(true);
    try {
      const name = trimLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const created = await api.createCustomIntent({ name, label: trimLabel, keywords: kws });
      onCreated(created);
      setLabel('');
      setKeywords('');
      showSuccess('Intención creada');
    } catch {
      showError('Intenciones', 'No se pudo crear la intención');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteCustomIntent(id);
      onDeleted(id);
      showSuccess('Intención eliminada');
    } catch {
      showError('Intenciones', 'No se pudo eliminar');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,17,16,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.07)] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-ink-900">Mis intenciones</h2>
            <p className="mt-0.5 text-[12px] text-ink-400">Define intenciones propias de tu negocio con palabras clave.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[rgba(17,17,16,0.06)] transition">
            <X size={15} className="text-ink-400" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Existing custom intents */}
          {customIntents.length > 0 && (
            <div className="divide-y divide-[rgba(17,17,16,0.05)] border-b border-[rgba(17,17,16,0.07)]">
              {customIntents.map((ci) => (
                <div key={ci.id} className="flex items-start justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink-800">{ci.label}</p>
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 ring-1 ring-brand-100">personalizada</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-400">{ci.value}</p>
                    {ci.keywords && ci.keywords.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {ci.keywords.map((kw) => (
                          <span key={kw} className="rounded-full bg-[rgba(17,17,16,0.05)] px-2 py-0.5 text-[10px] text-ink-600">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => ci.id && void handleDelete(ci.id)}
                    className="mt-0.5 shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Create new */}
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-4 px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-300">Nueva intención</p>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-700">Nombre visible</label>
              <input
                type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                placeholder="ej. Solicitar cotización, Consulta de garantía"
                className="w-full rounded-xl border border-[rgba(17,17,16,0.12)] px-4 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              {label.trim() && (
                <p className="mt-1 font-mono text-[10px] text-ink-400">
                  slug: {label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-700">
                Palabras clave <span className="font-normal text-ink-400">(separadas por coma)</span>
              </label>
              <input
                type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)}
                placeholder="cotización, quiero cotizar, cuánto cuesta un pedido"
                className="w-full rounded-xl border border-[rgba(17,17,16,0.12)] px-4 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-[11px] text-ink-400">Cuando el cliente escriba alguna de estas frases, se activa esta intención.</p>
            </div>
            <button
              type="submit" disabled={saving || !label.trim() || !keywords.trim()}
              className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
            >
              {saving ? 'Guardando...' : 'Crear intención'}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NewFlowModal({
  intents,
  onClose,
  onCreate,
}: {
  intents: { value: string; label: string }[];
  onClose: () => void;
  onCreate: (nombre: string, descripcion: string) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate(nombre.trim() || 'Nuevo flujo', descripcion.trim());
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,17,16,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-[rgba(17,17,16,0.07)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-900">Nuevo flujo</h2>
              <p className="mt-0.5 text-[12px] text-ink-400">El agente ejecutará este flujo cuando detecte la intención correcta.</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[rgba(17,17,16,0.06)] transition">
              <X size={15} className="text-ink-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-700">
              Nombre del flujo <span className="text-brand-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Consulta de pedido, Agendar cita, Onboarding"
              className="w-full rounded-xl border border-[rgba(17,17,16,0.12)] px-4 py-2.5 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-[11px] text-ink-400">Ponle un nombre claro que describa qué resuelve este flujo.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-700">Descripción <span className="text-ink-300">(opcional)</span></label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="ej. Guía al cliente para verificar el estado de su pedido sin necesidad de un agente humano."
              className="w-full resize-none rounded-xl border border-[rgba(17,17,16,0.12)] px-4 py-2.5 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 placeholder:text-ink-300"
            />
          </div>

          {intents.length > 0 && (
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-[12px] text-brand-800">
              <p className="font-semibold">¿Cuándo se activa este flujo?</p>
              <p className="mt-0.5 text-brand-700">El AI Router lo activará automáticamente cuando detecte la intención que configures en el paso siguiente. El cliente no sabrá que está siguiendo un flujo.</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-[rgba(17,17,16,0.1)] py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-[rgba(17,17,16,0.03)]"
            >
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Crear flujo
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function FlowBuilderPage() {
  const { showError, showSuccess, showInfo } = useNotification();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [activeFlowId, setActiveFlowId] = useState(flows[0]?.id ?? '');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingFlow, setSavingFlow] = useState(false);
  const [intents, setIntents] = useState<{ id: string | null; value: string; label: string; is_custom: boolean; keywords?: string[] }[]>([]);
  const [showIntentsModal, setShowIntentsModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'flows' | 'settings'>('flows');
  const [showNewFlowModal, setShowNewFlowModal] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasPlaneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [linking, setLinking] = useState<{ sourceId: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showDeleteNodeConfirm, setShowDeleteNodeConfirm] = useState(false);
  const [showDeleteFlowConfirm, setShowDeleteFlowConfirm] = useState(false);
  const [deleteFlowAcknowledge, setDeleteFlowAcknowledge] = useState(false);
  const [deleteFlowInput, setDeleteFlowInput] = useState('');

  const activeFlow = flows.find((f) => f.id === activeFlowId) ?? flows[0];
  const selectedNode = activeFlow?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadFlows() {
      try {
        const [flowData, intentData] = await Promise.allSettled([
          api.getFlows(),
          api.getFlowIntents(),
        ]);
        if (cancelled) return;
        if (flowData.status === 'fulfilled') {
          const mapped = flowData.value.map((f) => {
            const ui = mapApiFlowToUi(f);
            // Auto-layout flows loaded from DB (nodes have no saved canvas positions)
            return { ...ui, nodes: autoLayoutNodes(ui.nodes, ui.edges) };
          });
          setFlows(mapped);
          setActiveFlowId(mapped[0]?.id ?? '');
          setLoadError(null);
        } else {
          setFlows([]);
          setActiveFlowId('');
          setLoadError(flowData.reason instanceof Error ? flowData.reason.message : 'No se pudieron cargar los flujos');
        }
        if (intentData.status === 'fulfilled') {
          setIntents(intentData.value);
        }
      } catch (error) {
        if (cancelled) return;
        setFlows([]);
        setActiveFlowId('');
        setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los flujos');
      }
    }

    void loadFlows();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggleActive(flowId: string) {
    setFlows((prev) => prev.map((f) => f.id === flowId ? { ...f, activo: !f.activo } : f));
  }

  function updateActiveFlow(update: Partial<Flow>) {
    setFlows((prev) => prev.map((flow) => (flow.id === activeFlowId ? { ...flow, ...update } : flow)));
  }

  function updateRouterConfig(update: Partial<Flow['routerConfig']>) {
    if (!activeFlow) return;
    updateActiveFlow({
      routerConfig: {
        ...activeFlow.routerConfig,
        ...update,
      },
    });
  }

  function createBlankFlow(idSuffix: string): Flow {
    return {
      id: `flow-${idSuffix}`,
      nombre: 'Nuevo flujo',
      descripcion: 'Descripcion del flujo',
      activo: false,
      canales: ['whatsapp'],
      routerConfig: {
        triggerType: 'intent',
        intent: 'unknown',
        keywords: [],
        confidenceThreshold: 0.8,
        fallbackAction: 'request_clarification',
      },
      nodes: [
        { id: `n-start-${idSuffix}`, tipo: 'start', label: 'Inicio', x: 210, y: 30 },
        { id: `n-end-${idSuffix}`, tipo: 'end', label: 'Fin', x: 210, y: 160 },
      ],
      edges: [{ id: `e-${idSuffix}`, source: `n-start-${idSuffix}`, target: `n-end-${idSuffix}` }],
      createdAt: new Date().toISOString(),
    };
  }

  function handleNewFlow() {
    setShowNewFlowModal(true);
  }

  function handleCreateFlow(nombre: string, descripcion: string) {
    const f: Flow = {
      ...createBlankFlow(String(Date.now())),
      nombre,
      descripcion,
    };
    setFlows((prev) => [...prev, f]);
    setActiveFlowId(f.id);
    setShowNewFlowModal(false);
    setSidebarTab('settings');
    showSuccess('Flujo creado');
  }

  async function handleSaveFlow() {
    if (!activeFlow) return;
    setSavingFlow(true);
    try {
      if (activeFlow.id.startsWith('flow-')) {
        const created = await api.createFlow(mapUiFlowToPayload(activeFlow));
        const mapped = mapApiFlowToUi(created);
        setFlows((prev) => [mapped, ...prev.filter((flow) => flow.id !== activeFlow.id)]);
        setActiveFlowId(mapped.id);
      } else {
        const updated = await api.updateFlow(activeFlow.id, mapUiFlowToPayload(activeFlow));
        const mapped = mapApiFlowToUi(updated);
        setFlows((prev) => prev.map((flow) => (flow.id === mapped.id ? mapped : flow)));
      }
      setLoadError(null);
      showSuccess('Flujo guardado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el flujo';
      showError('Flows', message);
    } finally {
      setSavingFlow(false);
    }
  }

  function handleUpdateNode(update: Partial<FlowNode>) {
    if (!selectedNodeId) return;
    setFlows((prev) => prev.map((f) =>
      f.id === activeFlowId
        ? { ...f, nodes: f.nodes.map((n) => n.id === selectedNodeId ? { ...n, ...update } : n) }
        : f
    ));
  }

  function handleNodePointerDown(e: React.MouseEvent<HTMLDivElement>, nodeId: string) {
    if (!activeFlow || !canvasPlaneRef.current) return;
    const node = activeFlow.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const rect = canvasPlaneRef.current.getBoundingClientRect();
    setSelectedNodeId(nodeId);
    setDragging({
      nodeId,
      offsetX: (e.clientX - rect.left) / zoom - node.x,
      offsetY: (e.clientY - rect.top) / zoom - node.y,
    });
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!activeFlow || !canvasPlaneRef.current) return;
    const rect = canvasPlaneRef.current.getBoundingClientRect();
    if (dragging) {
      const nextX = Math.max(0, Math.min(CANVAS_W - NODE_WIDTH, (e.clientX - rect.left) / zoom - dragging.offsetX));
      const nextY = Math.max(0, Math.min(maxY - NODE_HEIGHT, (e.clientY - rect.top) / zoom - dragging.offsetY));
      setFlows((prev) =>
        prev.map((flow) =>
          flow.id === activeFlowId
            ? { ...flow, nodes: flow.nodes.map((node) => (node.id === dragging.nodeId ? { ...node, x: nextX, y: nextY } : node)) }
            : flow
        )
      );
    }
    if (linking) {
      setLinking((prev) =>
        prev ? { ...prev, x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom } : prev
      );
    }
  }

  function handleCanvasMouseUp() {
    if (dragging) {
      setDragging(null);
    }
    if (linking) {
      setLinking(null);
    }
  }

  function getDefaultBranchLabel(sourceNode: FlowNode) {
    if (!activeFlow) return undefined;
    const existingLabels = activeFlow.edges
      .filter((edge) => edge.source === sourceNode.id)
      .map((edge) => edge.label)
      .filter(Boolean) as string[];

    if (sourceNode.tipo === 'quickReply') {
      const candidate = (sourceNode.opciones ?? []).find((option) => !existingLabels.includes(option));
      return candidate;
    }
    if (sourceNode.tipo === 'condition') {
      const defaults = ['Si', 'No', 'Otro'];
      return defaults.find((option) => !existingLabels.includes(option)) ?? 'Ruta';
    }
    return undefined;
  }

  function handleLinkStart(e: React.MouseEvent<HTMLButtonElement>, sourceId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!activeFlow || !canvasPlaneRef.current) return;
    const sourceNode = activeFlow.nodes.find((node) => node.id === sourceId);
    if (!sourceNode) return;
    const center = nodeCenter(sourceNode);
    setLinking({ sourceId, x: center.x, y: center.y });
  }

  function handleLinkComplete(targetId: string) {
    if (!linking || linking.sourceId === targetId || !activeFlow) return;
    const sourceId = linking.sourceId;
    const duplicate = activeFlow.edges.some((edge) => edge.source === sourceId && edge.target === targetId);
    if (duplicate) {
      setLinking(null);
      showInfo('Estos nodos ya estan conectados');
      return;
    }
    const sourceNode = activeFlow.nodes.find((node) => node.id === sourceId);
    const label = sourceNode ? getDefaultBranchLabel(sourceNode) : 'Ruta';
    const edge: FlowEdge = { id: `e-${Date.now()}`, source: sourceId, target: targetId, label };
    setFlows((prev) =>
      prev.map((flow) => (flow.id === activeFlowId ? { ...flow, edges: [...flow.edges, edge] } : flow))
    );
    setSelectedNodeId(sourceId);
    setLinking(null);
    showSuccess('Conexion creada');
  }

  function handleExportJSON() {
    const json = JSON.stringify(activeFlow, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      showSuccess('Flow JSON copiado al portapapeles');
    }).catch(() => {
      showInfo('No se pudo copiar automáticamente');
    });
  }
  void handleExportJSON;

  function handleAddNodeType(tipo: FlowNodeType) {
    if (!activeFlow) return;
    const nodeId = `n-${tipo}-${Date.now()}`;
    const sourceNode =
      activeFlow.nodes.find((n) => n.id === selectedNodeId) ??
      [...activeFlow.nodes].reverse().find((n) => n.tipo !== 'end') ??
      activeFlow.nodes[activeFlow.nodes.length - 1];
    const newNode: FlowNode = {
      id: nodeId,
      tipo,
      label: NODE_TYPE_LABELS[tipo],
      x: 210,
      y: Math.max(40, maxY - 140),
      delayMs: tipo === 'delay' ? 3000 : undefined,
      mediaType: tipo === 'media' ? 'image' : undefined,
      mediaUrl: tipo === 'media' ? 'https://example.com/archivo.jpg' : undefined,
      tagValue: tipo === 'tag' ? 'lead_caliente' : undefined,
    };
    const newEdge: FlowEdge | null = sourceNode
      ? { id: `e-${Date.now()}`, source: sourceNode.id, target: nodeId }
      : null;
    setFlows((prev) =>
      prev.map((flow) =>
        flow.id === activeFlowId
          ? {
              ...flow,
              nodes: [...flow.nodes, newNode],
              edges: newEdge ? [...flow.edges, newEdge] : flow.edges,
            }
          : flow
      )
    );
    setSelectedNodeId(nodeId);
    showSuccess(`Nodo "${tipo}" agregado`);
  }

  function handleUpdateEdgeLabel(edgeId: string, label: string) {
    setFlows((prev) =>
      prev.map((flow) =>
        flow.id === activeFlowId
          ? { ...flow, edges: flow.edges.map((edge) => (edge.id === edgeId ? { ...edge, label } : edge)) }
          : flow
      )
    );
  }

  function handleDeleteEdge(edgeId: string) {
    setFlows((prev) =>
      prev.map((flow) =>
        flow.id === activeFlowId ? { ...flow, edges: flow.edges.filter((edge) => edge.id !== edgeId) } : flow
      )
    );
    showInfo('Conexion eliminada');
  }

  function getNodeLabel(nodeId: string) {
    return activeFlow?.nodes.find((node) => node.id === nodeId)?.label ?? nodeId;
  }

  function applyZoom(nextZoom: number) {
    setZoom(Math.max(0.5, Math.min(1.8, Number(nextZoom.toFixed(2)))));
  }

  function handleCanvasWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    applyZoom(zoom + delta);
  }

  function handleAutoLayout() {
    if (!activeFlow) return;
    setFlows((prev) =>
      prev.map((flow) =>
        flow.id !== activeFlowId ? flow
          : { ...flow, nodes: autoLayoutNodes(flow.nodes, flow.edges) }
      )
    );
    showSuccess('Layout ordenado');
  }

  function handleDeleteSelectedNode() {
    if (!selectedNodeId) return;
    const nodeId = selectedNodeId;
    setFlows((prev) =>
      prev.map((flow) =>
        flow.id === activeFlowId
          ? {
              ...flow,
              nodes: flow.nodes.filter((node) => node.id !== nodeId),
              edges: flow.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
            }
          : flow
      )
    );
    setSelectedNodeId(null);
    setShowDeleteNodeConfirm(false);
    showSuccess('Nodo eliminado');
  }

  function requestDeleteFlow() {
    setDeleteFlowAcknowledge(false);
    setDeleteFlowInput('');
    setShowDeleteFlowConfirm(true);
  }

  function handleDeleteFlow() {
    if (!activeFlow) return;
    if (!activeFlow.id.startsWith('flow-')) {
      void api.deleteFlow(activeFlow.id).catch(() => undefined);
    }
    const remaining = flows.filter((flow) => flow.id !== activeFlow.id);
    if (remaining.length === 0) {
      setFlows([]);
      setActiveFlowId('');
    } else {
      setFlows(remaining);
      setActiveFlowId(remaining[0].id);
    }
    setSelectedNodeId(null);
    setShowDeleteFlowConfirm(false);
    showSuccess('Flujo eliminado');
  }

  if (!activeFlow) {
    return (
      <div className="page-shell">
        <div className="page-stack">
          <div className="page-header-card">
            <h1 className="page-title">Flujos</h1>
            <p className="page-description">Construye conversaciones estructuradas que el AI Router activa según la intención del cliente.</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-[rgba(17,17,16,0.09)] bg-white/60 py-16 text-center shadow-card backdrop-blur-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <GitBranch size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">Sin flujos todavía</h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-400">
                Crea tu primer flujo para definir conversaciones estructuradas que el agente IA ejecutará de forma natural.
              </p>
            </div>
            <button
              onClick={handleNewFlow}
              className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600"
            >
              <Plus size={14} /> Crear primer flujo
            </button>
            {loadError && <p className="text-xs font-semibold text-red-600">{loadError}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Compute canvas height based on max node y
  const maxY = activeFlow ? Math.max(...activeFlow.nodes.map((n) => n.y + NODE_HEIGHT + 40), 400) : 400;

  return (
    <div className="page-shell">
      <div className="page-stack">
      <div className="page-header-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Flujos</h1>
            <p className="page-description">Conversaciones estructuradas que el agente ejecuta de forma natural.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleSaveFlow()}
              disabled={savingFlow}
              className="flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:opacity-50"
            >
              {savingFlow ? 'Guardando...' : 'Guardar flujo'}
            </button>
            <button
              onClick={() => setShowSimulation(true)}
              className="flex items-center gap-2 rounded-full border border-[rgba(17,17,16,0.09)] bg-white/70 px-4 py-2 text-xs font-semibold text-ink-700 backdrop-blur-sm transition hover:bg-white"
            >
              <Play size={12} /> Simular
            </button>
          </div>
        </div>
        {loadError && <p className="mt-2 text-xs font-semibold text-red-600">{loadError}</p>}
      </div>

      <div className="flex h-[calc(100dvh-13rem)] min-h-[620px] gap-0 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.07)] bg-white/65 shadow-card backdrop-blur-md xl:h-[calc(100dvh-12rem)]">

      {/* LEFT SIDEBAR */}
      <div className="flex min-h-0 w-64 flex-shrink-0 flex-col border-r border-[rgba(17,17,16,0.09)] bg-white/80 backdrop-blur-sm xl:w-72">
        {/* Tabs */}
        <div className="flex shrink-0 border-b border-[rgba(17,17,16,0.06)]">
          <button
            onClick={() => setSidebarTab('flows')}
            className={`flex-1 py-3 text-[11px] font-semibold transition ${sidebarTab === 'flows' ? 'border-b-2 border-brand-400 text-brand-600' : 'text-ink-400 hover:text-ink-700'}`}
          >
            Flujos
          </button>
          <button
            onClick={() => setSidebarTab('settings')}
            className={`flex-1 py-3 text-[11px] font-semibold transition ${sidebarTab === 'settings' ? 'border-b-2 border-brand-400 text-brand-600' : 'text-ink-400 hover:text-ink-700'}`}
          >
            Configurar
          </button>
        </div>

        {/* Flows list */}
        {sidebarTab === 'flows' && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 p-3">
              <button
                onClick={handleNewFlow}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 px-3 py-2.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
              >
                <Plus size={13} /> Nuevo flujo
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {flows.map((f) => {
                const isActive = activeFlowId === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => { setActiveFlowId(f.id); setSelectedNodeId(null); setSidebarTab('settings'); }}
                    className={`w-full border-b border-[rgba(17,17,16,0.05)] px-4 py-3.5 text-left transition ${isActive ? 'bg-brand-50' : 'hover:bg-[rgba(17,17,16,0.025)]'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[13px] font-semibold ${isActive ? 'text-brand-700' : 'text-ink-800'}`}>{f.nombre}</p>
                        <p className="mt-0.5 truncate text-[11px] text-ink-400">{f.descripcion}</p>
                      </div>
                      <div className="mt-1 flex shrink-0 flex-col items-end gap-1">
                        <div className={`h-1.5 w-1.5 rounded-full ${f.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] text-ink-300">{f.nodes.length} nodos</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {f.routerConfig.triggerType !== 'manual' && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 ring-1 ring-brand-100">
                          {intents.find((i) => i.value === f.routerConfig.intent)?.label ?? f.routerConfig.intent}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings tab */}
        {sidebarTab === 'settings' && activeFlow && (
          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-[rgba(17,17,16,0.05)]">
            <div className="space-y-3 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-300">General</p>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-500">Nombre</label>
                <input
                  type="text" value={activeFlow.nombre}
                  onChange={(e) => updateActiveFlow({ nombre: e.target.value })}
                  className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-500">Descripción</label>
                <textarea
                  value={activeFlow.descripcion} rows={2}
                  onChange={(e) => updateActiveFlow({ descripcion: e.target.value })}
                  className="w-full resize-none rounded-lg border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2 text-sm text-ink-800 outline-none focus:border-brand-400"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-ink-500">Estado</span>
                <button
                  onClick={() => handleToggleActive(activeFlowId)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${activeFlow.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-[rgba(17,17,16,0.06)] text-ink-400'}`}
                >
                  {activeFlow.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bot size={12} className="text-brand-600" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600">AI Router</p>
                </div>
                <button
                  onClick={() => setShowIntentsModal(true)}
                  className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-600 transition hover:bg-brand-100"
                >
                  <Plus size={10} /> Mis intenciones
                </button>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-500">Activación</label>
                <select
                  value={activeFlow.routerConfig.triggerType}
                  onChange={(e) => updateRouterConfig({ triggerType: e.target.value as Flow['routerConfig']['triggerType'] })}
                  className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="intent">Por intención</option>
                  <option value="keyword">Por palabra clave</option>
                  <option value="hybrid">Híbrido</option>
                  <option value="manual">Manual (solo API)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-500">Intención detectada</label>
                <select
                  value={activeFlow.routerConfig.intent}
                  onChange={(e) => updateRouterConfig({ intent: e.target.value })}
                  className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  {intents.length > 0 ? (
                    <>
                      {intents.filter((i) => !i.is_custom).map((i) => (
                        <option key={i.value} value={i.value}>{i.label}</option>
                      ))}
                      {intents.some((i) => i.is_custom) && (
                        <optgroup label="── Mis intenciones ──">
                          {intents.filter((i) => i.is_custom).map((i) => (
                            <option key={i.value} value={i.value}>{i.label}</option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    <option value={activeFlow.routerConfig.intent}>{activeFlow.routerConfig.intent}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-500">Keywords</label>
                <input type="text"
                  value={activeFlow.routerConfig.keywords.join(', ')}
                  onChange={(e) => updateRouterConfig({ keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
                  placeholder="subsidio, certificado..."
                  className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink-500">
                  <span>Confianza mínima</span>
                  <span className="font-bold text-brand-600">{Math.round(activeFlow.routerConfig.confidenceThreshold * 100)}%</span>
                </label>
                <input type="range" min="0.5" max="0.99" step="0.01"
                  value={activeFlow.routerConfig.confidenceThreshold}
                  onChange={(e) => updateRouterConfig({ confidenceThreshold: Number(e.target.value) })}
                  className="w-full accent-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-500">Si no hay confianza</label>
                <select
                  value={activeFlow.routerConfig.fallbackAction}
                  onChange={(e) => updateRouterConfig({ fallbackAction: e.target.value as Flow['routerConfig']['fallbackAction'] })}
                  className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  <option value="request_clarification">Pedir aclaración</option>
                  <option value="escalate_to_human">Escalar a humano</option>
                </select>
              </div>
              <div className="rounded-xl bg-brand-50 px-3 py-2.5 text-[11px] leading-relaxed text-brand-800">
                {(() => {
                const matched = intents.find((i) => i.value === activeFlow.routerConfig.intent);
                return <>Activa este flujo cuando detecte <span className="font-semibold">{matched?.label ?? activeFlow.routerConfig.intent}</span>{matched?.is_custom && <span className="ml-1 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">tuya</span>} con al menos <span className="font-semibold">{Math.round(activeFlow.routerConfig.confidenceThreshold * 100)}%</span> de confianza.</>;
              })()}
              </div>
            </div>

            <div className="p-4">
              <button onClick={requestDeleteFlow}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100"
              >
                <Trash2 size={12} /> Eliminar este flujo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CENTER — Canvas */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[rgba(17,17,16,0.02)]" style={{ backgroundImage: 'radial-gradient(circle, rgba(17,17,16,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        {/* Toolbar */}
        <div className="shrink-0 border-b border-[rgba(17,17,16,0.07)] bg-white/80 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Node palette — grouped */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-ink-300">Agregar</span>
              {(['message', 'quickReply', 'collect'] as FlowNodeType[]).map((tipo) => {
                const cfg = NODE_CONFIG[tipo];
                return (
                  <button key={tipo} onClick={() => handleAddNodeType(tipo)} title={`Agregar ${NODE_TYPE_LABELS[tipo]}`}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition hover:opacity-80 ${cfg.bg} ${cfg.border} ${cfg.color}`}
                  >
                    {cfg.icon} {NODE_TYPE_LABELS[tipo]}
                  </button>
                );
              })}
              <span className="mx-1 h-4 w-px bg-[rgba(17,17,16,0.1)]" />
              {(['condition', 'api'] as FlowNodeType[]).map((tipo) => {
                const cfg = NODE_CONFIG[tipo];
                return (
                  <button key={tipo} onClick={() => handleAddNodeType(tipo)} title={`Agregar ${NODE_TYPE_LABELS[tipo]}`}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition hover:opacity-80 ${cfg.bg} ${cfg.border} ${cfg.color}`}
                  >
                    {cfg.icon} {NODE_TYPE_LABELS[tipo]}
                  </button>
                );
              })}
              <span className="mx-1 h-4 w-px bg-[rgba(17,17,16,0.1)]" />
              {(['delay', 'media', 'tag', 'escalate', 'end'] as FlowNodeType[]).map((tipo) => {
                const cfg = NODE_CONFIG[tipo];
                return (
                  <button key={tipo} onClick={() => handleAddNodeType(tipo)} title={NODE_TYPE_LABELS[tipo]}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition hover:opacity-80 ${cfg.bg} ${cfg.border} ${cfg.color}`}
                  >
                    {cfg.icon}
                  </button>
                );
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View controls */}
            <div className="flex items-center gap-1 rounded-xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] px-2 py-1">
              <button onClick={() => applyZoom(zoom - 0.1)} className="rounded-md p-1 text-ink-500 hover:bg-white hover:shadow-sm transition" title="Zoom out"><Minus size={12} /></button>
              <span className="min-w-[36px] text-center text-[11px] font-semibold text-ink-600">{Math.round(zoom * 100)}%</span>
              <button onClick={() => applyZoom(zoom + 0.1)} className="rounded-md p-1 text-ink-500 hover:bg-white hover:shadow-sm transition" title="Zoom in"><Plus size={12} /></button>
              <button onClick={() => applyZoom(1)} className="rounded-md p-1 text-ink-400 hover:bg-white hover:shadow-sm transition" title="Resetear zoom"><RotateCcw size={12} /></button>
            </div>

            <button onClick={handleAutoLayout}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(17,17,16,0.08)] bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:bg-white"
            >
              <Sparkles size={12} /> Ordenar
            </button>
          </div>
        </div>

        {/* Scrollable canvas */}
        <div
          className="flex-1 overflow-auto p-6"
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleCanvasWheel}
        >
          {activeFlow && (
            <div className="relative mx-auto" style={{ width: CANVAS_W * zoom, height: maxY * zoom }}>
              <div
                ref={canvasPlaneRef}
                className="relative origin-top-left"
                style={{ width: CANVAS_W, height: maxY, transform: `scale(${zoom})` }}
              >
              {/* SVG edges */}
              <svg
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
              >
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                  </marker>
                </defs>
                {activeFlow.edges.map((edge) => {
                  const src = activeFlow.nodes.find((n) => n.id === edge.source);
                  const tgt = activeFlow.nodes.find((n) => n.id === edge.target);
                  if (!src || !tgt) return null;
                  const s = nodeCenter(src);
                  const t = nodeCenter(tgt);
                  const midY = (s.y + t.y) / 2;
                  const path = `M${s.x},${s.y} C${s.x},${midY} ${t.x},${midY} ${t.x},${t.y}`;
                  const labelX = (s.x + t.x) / 2;
                  const labelY = midY;
                  return (
                    <g key={edge.id}>
                      <path
                        d={path}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        markerEnd="url(#arrowhead)"
                      />
                      {edge.label && (
                        <text x={labelX} y={labelY - 4} textAnchor="middle" fontSize={10} fill="#64748b" fontWeight="600">
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                {linking && (() => {
                  const src = activeFlow.nodes.find((node) => node.id === linking.sourceId);
                  if (!src) return null;
                  const s = nodeCenter(src);
                  const t = { x: linking.x, y: linking.y };
                  const midY = (s.y + t.y) / 2;
                  const path = `M${s.x},${s.y} C${s.x},${midY} ${t.x},${midY} ${t.x},${t.y}`;
                  return (
                    <path
                      d={path}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      opacity={0.85}
                    />
                  );
                })()}
              </svg>

              {/* Nodes */}
              {activeFlow.nodes.map((node) => (
                <FlowNodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                  onLinkStart={(e) => handleLinkStart(e, node.id)}
                  onLinkComplete={() => handleLinkComplete(node.id)}
                />
              ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Node properties */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex min-w-[272px] max-w-[300px] flex-shrink-0 flex-col overflow-hidden border-l border-[rgba(17,17,16,0.09)] bg-white/80 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${NODE_CONFIG[selectedNode.tipo].bg}`}>
                  <span className={NODE_CONFIG[selectedNode.tipo].color}>{NODE_CONFIG[selectedNode.tipo].icon}</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">{NODE_TYPE_LABELS[selectedNode.tipo]}</p>
                  <p className="text-sm font-bold text-ink-900 leading-tight">{selectedNode.label}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNodeId(null)} className="rounded-lg p-1.5 hover:bg-[rgba(17,17,16,0.06)] transition">
                <X size={14} className="text-ink-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-4">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Etiqueta</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => handleUpdateNode({ label: e.target.value })}
                  className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </div>

              {selectedNode.tipo === 'message' && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Contenido</label>
                  <textarea
                    value={selectedNode.contenido ?? ''}
                    onChange={(e) => handleUpdateNode({ contenido: e.target.value })}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400 placeholder:text-ink-300"
                    placeholder="Mensaje que enviará el bot..."
                  />
                </div>
              )}

              {selectedNode.tipo === 'quickReply' && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Texto del mensaje</label>
                  <textarea
                    value={selectedNode.contenido ?? ''}
                    onChange={(e) => handleUpdateNode({ contenido: e.target.value })}
                    rows={3}
                    className="mb-3 w-full resize-none rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400 placeholder:text-ink-300"
                    placeholder="¿Cuál es tu consulta? Elige una opción:"
                  />
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Opciones</label>
                  <div className="space-y-2">
                    {(selectedNode.opciones ?? []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const opts = [...(selectedNode.opciones ?? [])];
                            opts[i] = e.target.value;
                            handleUpdateNode({ opciones: opts });
                          }}
                          className="flex-1 rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-1.5 text-xs outline-none focus:border-brand-400"
                        />
                        <button
                          onClick={() => handleUpdateNode({ opciones: (selectedNode.opciones ?? []).filter((_, j) => j !== i) })}
                          className="rounded p-1 hover:bg-red-50 text-red-400 hover:text-red-600 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleUpdateNode({ opciones: [...(selectedNode.opciones ?? []), ''] })}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
                    >
                      <Plus size={12} /> Agregar opción
                    </button>
                  </div>
                </div>
              )}

              {selectedNode.tipo === 'collect' && (
                <>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Pregunta</label>
                    <textarea
                      value={selectedNode.pregunta ?? ''}
                      onChange={(e) => handleUpdateNode({ pregunta: e.target.value })}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                      placeholder="¿Cuál es tu número de cédula?"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Variable</label>
                    <input
                      type="text"
                      value={selectedNode.variable ?? ''}
                      onChange={(e) => handleUpdateNode({ variable: e.target.value })}
                      className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm font-mono outline-none focus:border-brand-400"
                      placeholder="cedula"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Tipo de entrada</label>
                    <select
                      value={selectedNode.inputType ?? 'text'}
                      onChange={(e) => handleUpdateNode({ inputType: e.target.value as FlowNode['inputType'] })}
                      className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                    >
                      <option value="text">Texto libre</option>
                      <option value="number">Número</option>
                      <option value="email">Email</option>
                      <option value="phone">Teléfono</option>
                      <option value="option">Opción (valida contra lista)</option>
                    </select>
                  </div>
                </>
              )}

              {selectedNode.tipo === 'api' && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Endpoint</label>
                  <input
                    type="text"
                    value={selectedNode.endpoint ?? ''}
                    onChange={(e) => handleUpdateNode({ endpoint: e.target.value })}
                    className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm font-mono outline-none focus:border-brand-400"
                    placeholder="/api/resource"
                  />
                  <button
                    onClick={() => handleUpdateNode({ endpoint: EXTERNAL_DATABASE_LOOKUP_ENDPOINT, label: 'Consultar base externa' })}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                  >
                    <Zap size={11} /> Usar lookup de base externa
                  </button>
                  <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">
                    Este endpoint ejecuta una consulta controlada por documento. Antes agrega un nodo <span className="font-semibold">collect</span> con la variable <span className="font-mono">cedula</span>.
                  </div>
                </div>
              )}

              {selectedNode.tipo === 'delay' && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Espera (ms)</label>
                  <input
                    type="number"
                    value={selectedNode.delayMs ?? 3000}
                    onChange={(e) => handleUpdateNode({ delayMs: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                  />
                </div>
              )}

              {selectedNode.tipo === 'media' && (
                <>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Tipo de media</label>
                    <select
                      value={selectedNode.mediaType ?? 'image'}
                      onChange={(e) => handleUpdateNode({ mediaType: e.target.value as 'image' | 'pdf' | 'video' })}
                      className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                    >
                      <option value="image">image</option>
                      <option value="pdf">pdf</option>
                      <option value="video">video</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">URL</label>
                    <input
                      type="text"
                      value={selectedNode.mediaUrl ?? ''}
                      onChange={(e) => handleUpdateNode({ mediaUrl: e.target.value })}
                      className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                    />
                  </div>
                </>
              )}

              {selectedNode.tipo === 'tag' && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Nombre de tag</label>
                  <input
                    type="text"
                    value={selectedNode.tagValue ?? ''}
                    onChange={(e) => handleUpdateNode({ tagValue: e.target.value })}
                    className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                  />
                </div>
              )}

              {selectedNode.tipo === 'condition' && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Variable a evaluar</label>
                    <input
                      type="text"
                      value={selectedNode.variable ?? ''}
                      onChange={(e) => handleUpdateNode({ variable: e.target.value })}
                      className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm font-mono outline-none focus:border-brand-400"
                      placeholder="nombre_variable"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Operador</label>
                    <select
                      value={selectedNode.operator ?? 'eq'}
                      onChange={(e) => handleUpdateNode({ operator: e.target.value })}
                      className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                    >
                      <option value="eq">Es igual a</option>
                      <option value="neq">Es distinto de</option>
                      <option value="contains">Contiene</option>
                      <option value="not_contains">No contiene</option>
                      <option value="starts_with">Empieza con</option>
                      <option value="in">Está en (separado por comas)</option>
                      <option value="gt">Mayor que</option>
                      <option value="lt">Menor que</option>
                      <option value="regex">Regex</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Valor</label>
                    <input
                      type="text"
                      value={selectedNode.conditionValue ?? ''}
                      onChange={(e) => handleUpdateNode({ conditionValue: e.target.value })}
                      className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                      placeholder="valor esperado"
                    />
                  </div>
                  <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-[11px] leading-relaxed text-orange-800">
                    Conecta la rama <span className="font-semibold">Si</span> y <span className="font-semibold">No</span> a los nodos destino.
                  </div>
                </div>
              )}

              {selectedNode.tipo === 'escalate' && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Mensaje antes de escalar</label>
                    <textarea
                      value={selectedNode.contenido ?? ''}
                      onChange={(e) => handleUpdateNode({ contenido: e.target.value })}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400 placeholder:text-ink-300"
                      placeholder="Un agente te atenderá en breve..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Motivo de escalamiento</label>
                    <input
                      type="text"
                      value={selectedNode.reason ?? 'flow_escalation'}
                      onChange={(e) => handleUpdateNode({ reason: e.target.value })}
                      className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                      placeholder="flow_escalation"
                    />
                  </div>
                </div>
              )}

              {(selectedNode.tipo === 'end') && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Mensaje de cierre</label>
                  <textarea
                    value={selectedNode.contenido ?? ''}
                    onChange={(e) => handleUpdateNode({ contenido: e.target.value })}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400 placeholder:text-ink-300"
                    placeholder="¡Gracias! Fue un placer ayudarte."
                  />
                </div>
              )}

              <div className="rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-[11px] leading-relaxed text-brand-800">
                <span className="font-semibold">Voz natural:</span> el AI Router envuelve cada respuesta con la voz de tu marca. El cliente no percibe un script rígido.
              </div>

              {selectedNode.tipo !== 'end' && (
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Conexiones salientes</label>
                  <div className="space-y-2">
                    {activeFlow?.edges.filter((edge) => edge.source === selectedNode.id).map((edge) => (
                      <div key={edge.id} className="rounded-lg border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-2">
                        <p className="mb-1 text-[10px] font-semibold text-ink-400">Destino: {getNodeLabel(edge.target)}</p>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={edge.label ?? ''}
                            onChange={(e) => handleUpdateEdgeLabel(edge.id, e.target.value)}
                            placeholder="Etiqueta de conexion"
                            className="w-full rounded-md border border-[rgba(17,17,16,0.09)] px-2 py-1.5 text-xs outline-none focus:border-brand-400"
                          />
                          <button
                            onClick={() => handleDeleteEdge(edge.id)}
                            className="rounded-md bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-200"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                    {activeFlow?.edges.filter((edge) => edge.source === selectedNode.id).length === 0 && (
                      <p className="rounded-lg border border-dashed border-[rgba(17,17,16,0.12)] px-3 py-2 text-xs text-ink-400">
                        Crea una conexion arrastrando el punto lateral del nodo.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => showSuccess('Nodo guardado')}
                className="w-full rounded-full bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition"
              >
                Guardar nodo
              </button>
              <button
                onClick={() => setShowDeleteNodeConfirm(true)}
                className="w-full rounded-xl bg-red-100 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-200 transition"
              >
                Eliminar nodo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom intents modal */}
      <AnimatePresence>
        {showIntentsModal && (
          <CustomIntentsModal
            intents={intents}
            onClose={() => setShowIntentsModal(false)}
            onCreated={(ci) => setIntents((prev) => [...prev, ci])}
            onDeleted={(id) => setIntents((prev) => prev.filter((i) => i.id !== id))}
          />
        )}
      </AnimatePresence>

      {/* New flow modal */}
      <AnimatePresence>
        {showNewFlowModal && (
          <NewFlowModal
            intents={intents}
            onClose={() => setShowNewFlowModal(false)}
            onCreate={handleCreateFlow}
          />
        )}
      </AnimatePresence>

      {/* Simulation modal */}
      <AnimatePresence>
        {showSimulation && activeFlow && (
          <SimulationModal flow={activeFlow} onClose={() => setShowSimulation(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteNodeConfirm && selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(17,17,16,0.45)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white/70 backdrop-blur-sm p-5 shadow-2xl"
            >
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                <p className="text-sm font-bold text-ink-900">Eliminar nodo</p>
              </div>
              <p className="text-sm text-ink-600">
                Se eliminara el nodo <span className="font-semibold text-ink-900">{selectedNode.label}</span> y sus conexiones.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowDeleteNodeConfirm(false)}
                  className="flex-1 rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-[rgba(17,17,16,0.025)]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteSelectedNode}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteFlowConfirm && activeFlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(17,17,16,0.45)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-white/70 backdrop-blur-sm p-5 shadow-2xl"
            >
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                <p className="text-sm font-bold text-ink-900">Eliminar flujo (doble verificacion)</p>
              </div>
              <p className="text-sm text-ink-600">
                Esta accion elimina el flujo <span className="font-semibold text-ink-900">{activeFlow.nombre}</span> y no se puede deshacer.
              </p>

              <label className="mt-4 flex items-start gap-2 rounded-lg border border-[rgba(17,17,16,0.09)] p-3 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={deleteFlowAcknowledge}
                  onChange={(e) => setDeleteFlowAcknowledge(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Entiendo que esta eliminacion es permanente.</span>
              </label>

              <div className="mt-3">
                <label className="mb-1 block text-xs font-semibold text-ink-400">Escribe el nombre del flujo para confirmar</label>
                <input
                  type="text"
                  value={deleteFlowInput}
                  onChange={(e) => setDeleteFlowInput(e.target.value)}
                  placeholder={activeFlow.nombre}
                  className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-red-400"
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowDeleteFlowConfirm(false)}
                  className="flex-1 rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-[rgba(17,17,16,0.025)]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteFlow}
                  disabled={!deleteFlowAcknowledge || deleteFlowInput !== activeFlow.nombre}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                >
                  Eliminar flujo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
