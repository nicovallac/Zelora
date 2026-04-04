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
    nodes: (flow.nodes as unknown as FlowNode[]) ?? [],
    edges: (flow.edges as unknown as FlowEdge[]) ?? [],
    createdAt: flow.created_at,
  };
}

function mapUiFlowToPayload(flow: Flow): FlowPayload {
  return {
    name: flow.nombre,
    description: flow.descripcion,
    nodes: flow.nodes as unknown as Record<string, unknown>[],
    edges: flow.edges as unknown as Record<string, unknown>[],
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

const ROUTER_INTENT_OPTIONS = [
  'check_subsidy',
  'request_certificate',
  'book_appointment',
  'buy_intent',
  'complaint',
  'support_request',
  'campaign_response',
  'unknown',
] as const;

const CHANNEL_OPTIONS: Array<{ id: 'web' | 'whatsapp' | 'instagram' | 'tiktok' | 'app-chat'; label: string; className: string }> = [
  { id: 'web', label: 'Web', className: 'bg-blue-100 text-blue-700' },
  { id: 'whatsapp', label: 'WhatsApp', className: 'bg-emerald-100 text-emerald-700' },
  { id: 'instagram', label: 'Instagram', className: 'bg-pink-100 text-pink-700' },
  { id: 'tiktok', label: 'TikTok', className: 'bg-[rgba(17,17,16,0.06)] text-ink-700' },
  { id: 'app-chat', label: 'App Chat', className: 'bg-violet-100 text-violet-700' },
];

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
  end: { color: 'text-ink-600', bg: 'bg-[rgba(17,17,16,0.06)]', border: 'border-[rgba(17,17,16,0.12)]', icon: <Square size={14} />, shape: 'circle' },
};

const NODE_TYPES_LIST: FlowNodeType[] = ['message', 'quickReply', 'collect', 'condition', 'api', 'delay', 'media', 'tag', 'escalate', 'end'];
const NODE_WIDTH = 180;
const NODE_HEIGHT = 72;
const CANVAS_W = 600;

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

export function FlowBuilderPage() {
  const { showError, showSuccess, showInfo } = useNotification();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [activeFlowId, setActiveFlowId] = useState(flows[0]?.id ?? '');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingFlow, setSavingFlow] = useState(false);
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
  const routerPreview = activeFlow
    ? {
        intent: activeFlow.routerConfig.intent,
        confidence: activeFlow.routerConfig.confidenceThreshold,
        risk_level: 'low',
        policy_status: 'allowed',
        route: 'trigger_flow',
        target: activeFlow.id,
        flow_name: activeFlow.nombre,
        channel_scope: activeFlow.canales,
        trigger_type: activeFlow.routerConfig.triggerType,
        keywords: activeFlow.routerConfig.keywords,
        fallback_action: activeFlow.routerConfig.fallbackAction,
        final_action: 'start_flow',
      }
    : null;

  useEffect(() => {
    let cancelled = false;

    async function loadFlows() {
      try {
        const data = await api.getFlows();
        if (cancelled) return;
        const mapped = data.map(mapApiFlowToUi);
        setFlows(mapped);
        setActiveFlowId(mapped[0]?.id ?? '');
        setLoadError(null);
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
    const f: Flow = createBlankFlow(String(Date.now()));
    setFlows((prev) => [...prev, f]);
    setActiveFlowId(f.id);
    showSuccess('Nuevo flujo creado');
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
      label:
        tipo === 'quickReply'
          ? 'Opciones'
          : tipo === 'message'
            ? 'Mensaje'
            : tipo === 'delay'
              ? 'Espera'
              : tipo === 'media'
                ? 'Media'
                : tipo === 'tag'
                  ? 'Tag'
                  : tipo,
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

  function toggleFlowChannel(channelId: Flow['canales'][number]) {
    if (!activeFlow) return;
    const current = activeFlow.canales ?? [];
    let next = current.includes(channelId)
      ? current.filter((c) => c !== channelId)
      : [...current, channelId];
    if (next.length === 0) next = ['whatsapp'];
    setFlows((prev) => prev.map((f) => (f.id === activeFlowId ? { ...f, canales: next as Flow['canales'] } : f)));
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
    const nodeMap = new Map(activeFlow.nodes.map((node) => [node.id, node]));
    const indegree = new Map<string, number>(activeFlow.nodes.map((node) => [node.id, 0]));
    const outgoing = new Map<string, string[]>();

    activeFlow.edges.forEach((edge) => {
      if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return;
      indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
      outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
    });

    const roots = activeFlow.nodes
      .filter((node) => (indegree.get(node.id) ?? 0) === 0)
      .map((node) => node.id);
    const queue = roots.length > 0 ? [...roots] : [activeFlow.nodes[0]?.id].filter(Boolean) as string[];
    const depth = new Map<string, number>();

    queue.forEach((nodeId) => depth.set(nodeId, 0));
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDepth = depth.get(current) ?? 0;
      (outgoing.get(current) ?? []).forEach((targetId) => {
        const nextDepth = currentDepth + 1;
        if (!depth.has(targetId) || nextDepth > (depth.get(targetId) ?? 0)) {
          depth.set(targetId, nextDepth);
          queue.push(targetId);
        }
      });
    }

    let fallbackDepth = Math.max(0, ...Array.from(depth.values()));
    activeFlow.nodes.forEach((node) => {
      if (!depth.has(node.id)) {
        fallbackDepth += 1;
        depth.set(node.id, fallbackDepth);
      }
    });

    const levels = new Map<number, FlowNode[]>();
    activeFlow.nodes.forEach((node) => {
      const d = depth.get(node.id) ?? 0;
      levels.set(d, [...(levels.get(d) ?? []), node]);
    });

    const horizontalGap = 44;
    const verticalGap = 62;
    const topPadding = 32;
    const updatedById = new Map<string, FlowNode>();

    Array.from(levels.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([level, nodes]) => {
        const totalWidth = nodes.length * NODE_WIDTH + Math.max(0, nodes.length - 1) * horizontalGap;
        const startX = Math.max(8, Math.floor((CANVAS_W - totalWidth) / 2));
        nodes.forEach((node, index) => {
          updatedById.set(node.id, {
            ...node,
            x: startX + index * (NODE_WIDTH + horizontalGap),
            y: topPadding + level * (NODE_HEIGHT + verticalGap),
          });
        });
      });

    setFlows((prev) =>
      prev.map((flow) =>
        flow.id === activeFlowId
          ? { ...flow, nodes: flow.nodes.map((node) => updatedById.get(node.id) ?? node) }
          : flow
      )
    );
    showSuccess('Layout ordenado automaticamente');
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
          <p className="page-description">
            Diseña flujos operativos, configura su disparador del router y mantenlos listos para ejecución real.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-8 text-center shadow-card">
          <h2 className="text-lg font-bold text-ink-900">No hay flujos creados</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-400">
            Esta cuenta arranca sin flujos precargados. Crea uno nuevo para empezar.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={handleNewFlow}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
            >
              Crear flujo vacio
            </button>
          </div>
          {loadError && <p className="mt-3 text-xs font-semibold text-red-600">{loadError}</p>}
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">Flujos</h1>
            <p className="page-description">
              Editor visual unificado para construir conversaciones, integrar APIs y definir el contrato de entrada del AI Router.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSimulation(true)}
              className="rounded-lg border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-ink-600 transition hover:bg-[rgba(17,17,16,0.025)]"
            >
              Probar simulacion
            </button>
          </div>
        </div>
        {loadError && <p className="mt-3 text-xs font-semibold text-red-600">{loadError}</p>}
      </div>

      <div className="min-h-0 flex h-[calc(100dvh-13rem)] min-h-[620px] gap-0 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.07)] bg-white/65 backdrop-blur-md shadow-card xl:h-[calc(100dvh-12rem)]">
      {/* LEFT SIDEBAR — Flow list */}
      <div className="flex min-h-0 w-[17rem] flex-shrink-0 flex-col border-r border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm xl:w-[18.5rem]">
        <div className="border-b border-[rgba(17,17,16,0.06)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-ink-900">Flujos</h2>
            <button
              onClick={handleNewFlow}
              className="flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition"
            >
              <Plus size={12} /> Nuevo
            </button>
          </div>
        </div>
        <div className="min-h-[180px] max-h-[36%] overflow-y-auto border-b border-[rgba(17,17,16,0.06)]">
          {flows.map((f) => (
            <button
              key={f.id}
              onClick={() => { setActiveFlowId(f.id); setSelectedNodeId(null); }}
              className={`w-full border-b border-[rgba(17,17,16,0.06)] px-4 py-3 text-left transition hover:bg-[rgba(17,17,16,0.025)] ${
                activeFlowId === f.id ? 'border-l-2 border-l-brand-400 bg-brand-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900 truncate">{f.nombre}</p>
                <div
                  className={`ml-1 h-2 w-2 rounded-full flex-shrink-0 ${f.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  title={f.activo ? 'Activo' : 'Inactivo'}
                />
              </div>
              <p className="mt-0.5 truncate text-xs text-ink-400">{f.descripcion}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {f.canales.slice(0, 2).map((channelId) => {
                    const channel = CHANNEL_OPTIONS.find((opt) => opt.id === channelId);
                    return (
                      <span key={channelId} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${channel?.className ?? 'bg-[rgba(17,17,16,0.06)] text-ink-600'}`}>
                        {channel?.label ?? channelId}
                      </span>
                    );
                  })}
                  {f.canales.length > 2 && (
                    <span className="rounded-full bg-[rgba(17,17,16,0.06)] px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                      +{f.canales.length - 2}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-ink-400">{f.nodes.length} nodos</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="rounded-full bg-[rgba(17,17,16,0.06)] px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                  Router: {f.routerConfig.triggerType}
                </span>
                {f.routerConfig.triggerType !== 'manual' && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                    {f.routerConfig.intent}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Flow properties */}
        {activeFlow && (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Propiedades</p>
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold text-ink-400">Nombre</label>
              <input
                type="text"
                value={activeFlow.nombre}
                onChange={(e) => updateActiveFlow({ nombre: e.target.value })}
                className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-2.5 py-1.5 text-xs text-ink-800 outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold text-ink-400">Descripción</label>
              <textarea
                value={activeFlow.descripcion}
                onChange={(e) => updateActiveFlow({ descripcion: e.target.value })}
                rows={2}
                className="w-full resize-none rounded-lg border border-[rgba(17,17,16,0.09)] px-2.5 py-1.5 text-xs text-ink-800 outline-none focus:border-brand-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-600">Estado</span>
              <button
                onClick={() => handleToggleActive(activeFlowId)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeFlow.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-[rgba(17,17,16,0.06)] text-ink-400'
                }`}
              >
                {activeFlow.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
            <button
              onClick={() => void handleSaveFlow()}
              disabled={savingFlow}
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {savingFlow ? 'Guardando...' : 'Guardar flujo'}
            </button>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-400">Canales disponibles</label>
              <div className="flex flex-wrap gap-1.5">
                {CHANNEL_OPTIONS.map((channel) => {
                  const selected = activeFlow.canales.includes(channel.id);
                  return (
                    <button
                      key={channel.id}
                      onClick={() => toggleFlowChannel(channel.id)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                        selected ? channel.className : 'bg-[rgba(17,17,16,0.06)] text-ink-400 hover:bg-[rgba(17,17,16,0.08)]'
                      }`}
                    >
                      {channel.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <details className="rounded-xl border border-brand-100 bg-brand-50/50 p-3" open>
              <summary className="mb-2 flex cursor-pointer list-none items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                  <Bot size={12} />
                  AI Router trigger
                </p>
                <span className="text-[10px] font-semibold text-brand-700">Configurar</span>
              </summary>
              <div className="space-y-2.5">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-ink-400">Modo de activación</label>
                  <select
                    value={activeFlow.routerConfig.triggerType}
                    onChange={(e) => updateRouterConfig({ triggerType: e.target.value as Flow['routerConfig']['triggerType'] })}
                    className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
                  >
                    <option value="intent">Intent</option>
                    <option value="keyword">Keyword</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-ink-400">Intent principal</label>
                  <select
                    value={activeFlow.routerConfig.intent}
                    onChange={(e) => updateRouterConfig({ intent: e.target.value })}
                    className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
                  >
                    {ROUTER_INTENT_OPTIONS.map((intent) => (
                      <option key={intent} value={intent}>{intent}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-ink-400">Keywords</label>
                  <input
                    type="text"
                    value={activeFlow.routerConfig.keywords.join(', ')}
                    onChange={(e) =>
                      updateRouterConfig({
                        keywords: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                      })
                    }
                    placeholder="subsidio, certificado, pqrs"
                    className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-ink-400">
                    Umbral de confianza ({Math.round(activeFlow.routerConfig.confidenceThreshold * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={activeFlow.routerConfig.confidenceThreshold}
                    onChange={(e) => updateRouterConfig({ confidenceThreshold: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-ink-400">Fallback del router</label>
                  <select
                    value={activeFlow.routerConfig.fallbackAction}
                    onChange={(e) => updateRouterConfig({ fallbackAction: e.target.value as Flow['routerConfig']['fallbackAction'] })}
                    className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-2.5 py-1.5 text-xs outline-none focus:border-brand-400"
                  >
                    <option value="request_clarification">Request clarification</option>
                    <option value="escalate_to_human">Escalate to human</option>
                  </select>
                </div>
                <div className="rounded-lg border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Resumen</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-700">
                    El AI Router podrá activar este flujo cuando detecte <span className="font-semibold">{activeFlow.routerConfig.intent}</span>
                    {' '}con confianza mínima de <span className="font-semibold">{Math.round(activeFlow.routerConfig.confidenceThreshold * 100)}%</span>.
                  </p>
                </div>
                {routerPreview && (
                  <details className="rounded-lg border border-[rgba(17,17,16,0.09)] bg-ink-900 px-3 py-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">AI Router preview</p>
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          void navigator.clipboard.writeText(JSON.stringify(routerPreview, null, 2));
                          showSuccess('Router preview copiado');
                        }}
                        className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:bg-slate-800"
                      >
                        Copiar JSON
                      </button>
                    </summary>
                    <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-emerald-200">
                      {JSON.stringify(routerPreview, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </details>
            <button
              onClick={requestDeleteFlow}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200"
            >
              <Trash2 size={12} /> Eliminar flujo
            </button>
          </div>
        )}
      </div>

      {/* CENTER — Canvas */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[rgba(17,17,16,0.025)]">
        {/* Canvas toolbar */}
        <div className="border-b border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Nodos</p>
              <div className="flex flex-wrap gap-1">
                {NODE_TYPES_LIST.map((tipo) => {
                  const cfg = NODE_CONFIG[tipo];
                  return (
                    <button
                      key={tipo}
                      onClick={() => handleAddNodeType(tipo)}
                      title={tipo}
                      className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${cfg.bg} ${cfg.border} ${cfg.color} hover:opacity-80`}
                    >
                      {cfg.icon} {tipo}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-2 py-1.5">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Vista</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => applyZoom(zoom - 0.1)}
                  className="rounded-lg bg-white/70 backdrop-blur-sm px-2 py-1 text-xs font-semibold text-ink-600 shadow-card hover:bg-[rgba(17,17,16,0.06)]"
                  title="Zoom out"
                >
                  <Minus size={12} />
                </button>
                <button
                  onClick={() => applyZoom(1)}
                  className="rounded-lg bg-white/70 backdrop-blur-sm px-2 py-1 text-xs font-semibold text-ink-600 shadow-card hover:bg-[rgba(17,17,16,0.06)]"
                  title="Reset zoom"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={() => applyZoom(zoom + 0.1)}
                  className="rounded-lg bg-white/70 backdrop-blur-sm px-2 py-1 text-xs font-semibold text-ink-600 shadow-card hover:bg-[rgba(17,17,16,0.06)]"
                  title="Zoom in"
                >
                  <Plus size={12} />
                </button>
                <span className="rounded-md bg-white/70 backdrop-blur-sm px-2 py-1 text-xs font-semibold text-ink-600 shadow-card">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-2 py-1.5">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Acciones</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleAutoLayout}
                  className="flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                >
                  <Sparkles size={12} /> Layout
                </button>
                <button
                  onClick={() => setShowSimulation(true)}
                  className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                >
                  <Play size={12} /> Simular
                </button>
                <button
                  onClick={handleExportJSON}
                  className="rounded-lg bg-white/70 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-ink-600 shadow-card hover:bg-[rgba(17,17,16,0.06)]"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-ink-400">Tip: usa Ctrl + rueda para zoom con mouse.</p>
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
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex min-w-[280px] max-w-[320px] flex-shrink-0 flex-col overflow-hidden border-l border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] p-4">
              <div>
                <div className={`mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${NODE_CONFIG[selectedNode.tipo].bg} ${NODE_CONFIG[selectedNode.tipo].color}`}>
                  {NODE_CONFIG[selectedNode.tipo].icon} {selectedNode.tipo}
                </div>
                <p className="text-sm font-bold text-ink-900">{selectedNode.label}</p>
              </div>
              <button onClick={() => setSelectedNodeId(null)} className="rounded-lg p-1 hover:bg-[rgba(17,17,16,0.06)] transition">
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
                    <input
                      type="text"
                      value={selectedNode.pregunta ?? ''}
                      onChange={(e) => handleUpdateNode({ pregunta: e.target.value })}
                      className="w-full rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                      placeholder="¿Cuál es tu cédula?"
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
