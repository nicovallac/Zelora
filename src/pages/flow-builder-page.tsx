import { useState, useRef } from 'react';
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
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { mockFlows } from '../data/mock';
import type { FlowNodeType } from '../data/mock';
import { useNotification } from '../contexts/NotificationContext';

interface FlowNode {
  id: string;
  tipo: FlowNodeType;
  label: string;
  contenido?: string;
  opciones?: string[];
  variable?: string;
  pregunta?: string;
  endpoint?: string;
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
  canal: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
}

const NODE_CONFIG: Record<FlowNodeType, { color: string; bg: string; border: string; icon: React.ReactNode; shape: 'circle' | 'rect' | 'diamond' }> = {
  start: { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', icon: <Play size={14} />, shape: 'circle' },
  message: { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300', icon: <MessageCircle size={14} />, shape: 'rect' },
  quickReply: { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300', icon: <List size={14} />, shape: 'rect' },
  collect: { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300', icon: <Edit3 size={14} />, shape: 'rect' },
  condition: { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300', icon: <GitBranch size={14} />, shape: 'diamond' },
  api: { color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300', icon: <Zap size={14} />, shape: 'rect' },
  escalate: { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', icon: <ArrowUpRight size={14} />, shape: 'rect' },
  end: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', icon: <Square size={14} />, shape: 'circle' },
};

const NODE_TYPES_LIST: FlowNodeType[] = ['message', 'quickReply', 'collect', 'condition', 'api', 'escalate', 'end'];
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

function FlowNodeCard({ node, isSelected, onClick }: {
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cfg = NODE_CONFIG[node.tipo];

  if (cfg.shape === 'circle') {
    return (
      <div
        onClick={onClick}
        style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
        className={`absolute flex cursor-pointer flex-col items-center justify-center rounded-full border-2 transition ${cfg.bg} ${cfg.border} ${isSelected ? 'ring-2 ring-brand-400 ring-offset-2' : 'hover:shadow-md'}`}
      >
        <div className={`${cfg.color} mb-0.5`}>{cfg.icon}</div>
        <p className={`text-xs font-bold ${cfg.color}`}>{node.label}</p>
      </div>
    );
  }

  if (cfg.shape === 'diamond') {
    return (
      <div
        onClick={onClick}
        style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
        className={`absolute cursor-pointer ${isSelected ? 'ring-2 ring-brand-400 ring-offset-2 rounded-lg' : ''}`}
      >
        <div
          className={`absolute inset-0 rounded-lg border-2 ${cfg.bg} ${cfg.border}`}
          style={{ transform: 'rotate(6deg)' }}
        />
        <div className="relative flex h-full flex-col items-center justify-center gap-0.5">
          <div className={cfg.color}>{cfg.icon}</div>
          <p className={`text-xs font-bold ${cfg.color}`}>{node.label}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
      className={`absolute cursor-pointer rounded-xl border-2 p-3 transition ${cfg.bg} ${cfg.border} ${isSelected ? 'ring-2 ring-brand-400 ring-offset-2' : 'hover:shadow-md'}`}
    >
      <div className={`mb-1 flex items-center gap-1.5 ${cfg.color}`}>
        {cfg.icon}
        <p className="text-xs font-bold">{node.label}</p>
      </div>
      {node.contenido && (
        <p className="truncate text-[10px] text-slate-600">{node.contenido.slice(0, 40)}...</p>
      )}
      {node.opciones && (
        <div className="mt-1 flex flex-wrap gap-0.5">
          {node.opciones.slice(0, 2).map((o) => (
            <span key={o} className="rounded bg-white/70 px-1 py-0.5 text-[9px] font-semibold text-slate-600">{o}</span>
          ))}
          {node.opciones.length > 2 && (
            <span className="rounded bg-white/70 px-1 py-0.5 text-[9px] text-slate-400">+{node.opciones.length - 2}</span>
          )}
        </div>
      )}
      {node.variable && (
        <p className="text-[10px] text-slate-500">var: <span className="font-mono font-semibold">{node.variable}</span></p>
      )}
      {node.endpoint && (
        <p className="truncate text-[10px] font-mono text-slate-500">{node.endpoint}</p>
      )}
    </div>
  );
}

// Mini chat simulation modal
function SimulationModal({ flow, onClose }: { flow: Flow; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([]);
  const [started, setStarted] = useState(false);

  function getNodeById(id: string) {
    return flow.nodes.find((n) => n.id === id);
  }
  function getNextNodes(nodeId: string) {
    return flow.edges.filter((e) => e.source === nodeId).map((e) => getNodeById(e.target)).filter(Boolean);
  }

  function start() {
    setStarted(true);
    setMessages([]);
    setStep(0);
    const startNode = flow.nodes.find((n) => n.tipo === 'start');
    if (!startNode) return;
    // Play through first few nodes
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
      } else if (current.tipo === 'end') {
        sequence.push({ role: 'bot', text: 'Conversación finalizada. ¡Hasta luego!' });
        break;
      }
      const nexts = getNextNodes(current.id);
      if (nexts.length === 0 || !nexts[0]) break;
      current = nexts[0] as FlowNode;
      depth++;
    }
    setMessages(sequence);
    setStep(sequence.length);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-96 rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-brand-600" />
            <h3 className="font-bold text-slate-900">Simulación: {flow.nombre}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="h-80 overflow-y-auto bg-slate-50 p-4 space-y-3">
          {!started && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <Play size={32} strokeWidth={1.5} />
              <p className="text-sm">Presiona Iniciar para simular el flujo</p>
            </div>
          )}
          {messages.slice(0, step).map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? '' : 'flex-row-reverse'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === 'bot'
                  ? 'rounded-br-sm bg-brand-600 text-white'
                  : 'rounded-bl-sm bg-white border border-slate-200 text-slate-800'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
          <button
            onClick={start}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
          >
            <Play size={14} /> {started ? 'Reiniciar' : 'Iniciar simulación'}
          </button>
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FlowBuilderPage() {
  const { showSuccess, showInfo } = useNotification();
  const [flows, setFlows] = useState<Flow[]>(mockFlows as unknown as Flow[]);
  const [activeFlowId, setActiveFlowId] = useState(flows[0]?.id ?? '');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activeFlow = flows.find((f) => f.id === activeFlowId) ?? flows[0];
  const selectedNode = activeFlow?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  function handleToggleActive(flowId: string) {
    setFlows((prev) => prev.map((f) => f.id === flowId ? { ...f, activo: !f.activo } : f));
  }

  function handleNewFlow() {
    const f: Flow = {
      id: `flow-${Date.now()}`,
      nombre: 'Nuevo flujo',
      descripcion: 'Descripción del flujo',
      activo: false,
      canal: 'whatsapp',
      nodes: [
        { id: 'n-start', tipo: 'start', label: 'Inicio', x: 210, y: 30 },
        { id: 'n-end', tipo: 'end', label: 'Fin', x: 210, y: 160 },
      ],
      edges: [{ id: 'e-1', source: 'n-start', target: 'n-end' }],
      createdAt: new Date().toISOString(),
    };
    setFlows((prev) => [...prev, f]);
    setActiveFlowId(f.id);
    showSuccess('Nuevo flujo creado');
  }

  function handleUpdateNode(update: Partial<FlowNode>) {
    if (!selectedNodeId) return;
    setFlows((prev) => prev.map((f) =>
      f.id === activeFlowId
        ? { ...f, nodes: f.nodes.map((n) => n.id === selectedNodeId ? { ...n, ...update } : n) }
        : f
    ));
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
    showInfo(`Arrastra el nodo "${tipo}" al canvas`);
  }

  // Compute canvas height based on max node y
  const maxY = activeFlow ? Math.max(...activeFlow.nodes.map((n) => n.y + NODE_HEIGHT + 40), 400) : 400;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* LEFT SIDEBAR — Flow list */}
      <div className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Flujos</h2>
            <button
              onClick={handleNewFlow}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
            >
              <Plus size={12} /> Nuevo
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {flows.map((f) => (
            <button
              key={f.id}
              onClick={() => { setActiveFlowId(f.id); setSelectedNodeId(null); }}
              className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                activeFlowId === f.id ? 'border-l-2 border-l-brand-400 bg-brand-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900 truncate">{f.nombre}</p>
                <div
                  className={`ml-1 h-2 w-2 rounded-full flex-shrink-0 ${f.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  title={f.activo ? 'Activo' : 'Inactivo'}
                />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">{f.descripcion}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${f.canal === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {f.canal}
                </span>
                <span className="text-[10px] text-slate-400">{f.nodes.length} nodos</span>
              </div>
            </button>
          ))}
        </div>

        {/* Flow properties */}
        {activeFlow && (
          <div className="border-t border-slate-100 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Propiedades</p>
            <div>
              <label className="mb-0.5 block text-[10px] font-semibold text-slate-500">Nombre</label>
              <input
                type="text"
                value={activeFlow.nombre}
                onChange={(e) => setFlows((prev) => prev.map((f) => f.id === activeFlowId ? { ...f, nombre: e.target.value } : f))}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-brand-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Estado</span>
              <button
                onClick={() => handleToggleActive(activeFlowId)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeFlow.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {activeFlow.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CENTER — Canvas */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-50">
        {/* Canvas toolbar */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
          <p className="text-xs font-semibold text-slate-500">Agregar nodo:</p>
          {NODE_TYPES_LIST.map((tipo) => {
            const cfg = NODE_CONFIG[tipo];
            return (
              <button
                key={tipo}
                onClick={() => handleAddNodeType(tipo)}
                title={tipo}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${cfg.bg} ${cfg.border} ${cfg.color} hover:opacity-80`}
              >
                {cfg.icon} {tipo}
              </button>
            );
          })}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowSimulation(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition"
            >
              <Play size={12} /> Simular
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Scrollable canvas */}
        <div className="flex-1 overflow-auto p-6" ref={canvasRef}>
          {activeFlow && (
            <div className="relative mx-auto" style={{ width: CANVAS_W, height: maxY }}>
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
              </svg>

              {/* Nodes */}
              {activeFlow.nodes.map((node) => (
                <FlowNodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Node properties */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div>
                <div className={`mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${NODE_CONFIG[selectedNode.tipo].bg} ${NODE_CONFIG[selectedNode.tipo].color}`}>
                  {NODE_CONFIG[selectedNode.tipo].icon} {selectedNode.tipo}
                </div>
                <p className="text-sm font-bold text-slate-900">{selectedNode.label}</p>
              </div>
              <button onClick={() => setSelectedNodeId(null)} className="rounded-lg p-1 hover:bg-slate-100 transition">
                <X size={14} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-4">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Etiqueta</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => handleUpdateNode({ label: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </div>

              {selectedNode.tipo === 'message' && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Contenido</label>
                  <textarea
                    value={selectedNode.contenido ?? ''}
                    onChange={(e) => handleUpdateNode({ contenido: e.target.value })}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 placeholder-slate-300"
                    placeholder="Mensaje que enviará el bot..."
                  />
                </div>
              )}

              {selectedNode.tipo === 'quickReply' && (
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Opciones</label>
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
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-brand-400"
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
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pregunta</label>
                    <input
                      type="text"
                      value={selectedNode.pregunta ?? ''}
                      onChange={(e) => handleUpdateNode({ pregunta: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                      placeholder="¿Cuál es tu cédula?"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Variable</label>
                    <input
                      type="text"
                      value={selectedNode.variable ?? ''}
                      onChange={(e) => handleUpdateNode({ variable: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:border-brand-400"
                      placeholder="cedula"
                    />
                  </div>
                </>
              )}

              {selectedNode.tipo === 'api' && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Endpoint</label>
                  <input
                    type="text"
                    value={selectedNode.endpoint ?? ''}
                    onChange={(e) => handleUpdateNode({ endpoint: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:border-brand-400"
                    placeholder="/api/resource"
                  />
                </div>
              )}

              <button
                onClick={() => showSuccess('Nodo guardado')}
                className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
              >
                Guardar nodo
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
    </div>
  );
}
