import { useMemo, useState } from 'react';
import { ArrowRight, BrainCircuit, MessageSquareText, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { WorkspaceAgentType } from '../types/workspace';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { KPIStatCard } from '../components/workspace/kpi-stat-card';
import { PriorityBadge } from '../components/workspace/priority-badge';

type ChatMsg = { id: string; role: 'user' | 'agent'; text: string };

const AGENT_TOPICS: Record<'sales' | 'marketing' | 'operations', string[]> = {
  sales: ['Seguimiento de leads', 'Objeciones de precio', 'Cierre de oportunidad'],
  marketing: ['Tendencias detectadas', 'Campanas recomendadas', 'Segmentos prioritarios'],
  operations: ['Stock y SLA', 'Riesgos operativos', 'Acciones de reposicion'],
};

function agentCardTone(type: WorkspaceAgentType) {
  if (type === 'sales') return 'border-emerald-200 bg-emerald-50/50';
  if (type === 'marketing') return 'border-violet-200 bg-violet-50/50';
  if (type === 'operations') return 'border-sky-200 bg-sky-50/50';
  return 'border-ink-200 bg-white';
}

function mockAgentReply(type: WorkspaceAgentType, topic: string, question: string) {
  if (type === 'sales') {
    return `En ${topic.toLowerCase()}, mi recomendacion es priorizar leads en decision stage y ejecutar follow-up en menos de 2 horas. Sobre "${question}", puedo crear una tarea de cierre ahora.`;
  }
  if (type === 'marketing') {
    return `Para ${topic.toLowerCase()}, detecto oportunidad de mejora en conversion y mensaje. Sobre "${question}", sugiero test A/B y activar secuencia de retargeting en el segmento con mayor intencion.`;
  }
  if (type === 'operations') {
    return `En ${topic.toLowerCase()}, el foco es proteger SLA y disponibilidad. Sobre "${question}", puedo disparar alerta de stock y tarea de reposicion prioritaria.`;
  }
  return 'Puedo ayudarte con ese punto dentro del workspace.';
}

export function WorkspaceDashboardPage() {
  const navigate = useNavigate();
  const { agents, kpis, insights, tasks } = useWorkspace();
  const aiAgents = agents.filter((agent) => agent.type === 'sales' || agent.type === 'marketing' || agent.type === 'operations');

  const [activeAgent, setActiveAgent] = useState<(typeof aiAgents)[number] | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const selectedTopics = useMemo(() => {
    if (!activeAgent) return [];
    return AGENT_TOPICS[activeAgent.type as 'sales' | 'marketing' | 'operations'] || [];
  }, [activeAgent]);

  const openAgentChat = (agent: (typeof aiAgents)[number]) => {
    const initialTopic = AGENT_TOPICS[agent.type as 'sales' | 'marketing' | 'operations'][0];
    setActiveAgent(agent);
    setActiveTopic(initialTopic);
    setMessages([
      {
        id: `m_${Date.now()}`,
        role: 'agent',
        text: `Soy ${agent.name}. Podemos trabajar ${initialTopic.toLowerCase()} ahora mismo. ¿Que necesitas?`,
      },
    ]);
    setPrompt('');
  };

  const sendMessage = () => {
    const text = prompt.trim();
    if (!text || !activeAgent || !activeTopic) return;
    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: 'user', text };
    const reply: ChatMsg = {
      id: `a_${Date.now() + 1}`,
      role: 'agent',
      text: mockAgentReply(activeAgent.type, activeTopic, text),
    };
    setMessages((prev) => [...prev, userMsg, reply]);
    setPrompt('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
        <p className="text-xs uppercase tracking-wide text-ink-500 font-semibold">AI Workspace</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 mt-1">Overview</h1>
        <p className="text-sm text-ink-500 mt-2">
          Vista central del equipo de agentes IA: Sales, Marketing y Operations.
        </p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <KPIStatCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} />
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2">
            <BrainCircuit size={17} className="text-brand-600" />
            AI Agent Cards
          </h2>
          <button
            onClick={() => navigate('/workspace/insights')}
            className="inline-flex items-center text-xs font-semibold text-brand-700"
          >
            Ver insights
            <ArrowRight size={13} className="ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {aiAgents.map((agent) => {
            const agentInsights = insights.filter((insight) => insight.sourceAgent === agent.type).slice(0, 2);
            const openTasks = tasks.filter((task) => task.assignedTo === agent.type && task.status !== 'resolved');

            return (
              <article key={agent.id} className={`rounded-xl border p-4 ${agentCardTone(agent.type)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-ink-900">{agent.name}</p>
                    <p className="text-xs text-ink-600 mt-1">{agent.persona}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-ink-700 border border-ink-200">
                    {agent.kpiLabel}: {agent.kpiValue}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white border border-ink-200 p-2">
                    <p className="text-[11px] text-ink-500">Open tasks</p>
                    <p className="text-sm font-semibold text-ink-900">{openTasks.length}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-ink-200 p-2">
                    <p className="text-[11px] text-ink-500">Insights today</p>
                    <p className="text-sm font-semibold text-ink-900">{agentInsights.length}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-wide text-ink-500 font-semibold">Capabilities</p>
                  <div className="mt-1 space-y-1">
                    {agent.responsibilities.map((item) => (
                      <p key={item} className="text-xs text-ink-700">
                        • {item}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-ink-200 bg-white p-3">
                  <p className="text-[11px] uppercase tracking-wide text-ink-500 font-semibold">Latest insights</p>
                  <div className="mt-2 space-y-2">
                    {agentInsights.map((insight) => (
                      <div key={insight.id} className="flex items-start justify-between gap-2 rounded-md bg-ink-50 p-2">
                        <p className="text-xs text-ink-700">{insight.title}</p>
                        <PriorityBadge priority={insight.priority} />
                      </div>
                    ))}
                    {agentInsights.length === 0 && <p className="text-xs text-ink-400">Sin insights recientes.</p>}
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openAgentChat(agent)}
                    className="flex-1 inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    <MessageSquareText size={13} className="mr-1" />
                    Chatear con {agent.type}
                  </button>
                  <button
                    onClick={() => navigate('/workspace/tasks')}
                    className="rounded-md border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    Ver tareas
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {activeAgent && (
        <aside className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setActiveAgent(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l border-ink-200 p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink-900">{activeAgent.name}</p>
                <p className="text-xs text-ink-500">Chat contextual por tema</p>
              </div>
              <button onClick={() => setActiveAgent(null)} className="text-xs text-ink-500 hover:text-ink-800">
                Cerrar
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setActiveTopic(topic)}
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    activeTopic === topic ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            <div className="mt-3 flex-1 overflow-y-auto space-y-2 rounded-lg border border-ink-200 bg-ink-50 p-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[92%] rounded-lg px-3 py-2 text-xs ${
                    msg.role === 'agent'
                      ? 'bg-white text-ink-700 border border-ink-200'
                      : 'bg-brand-600 text-white ml-auto'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
                placeholder={`Pregunta a ${activeAgent.name} sobre ${activeTopic.toLowerCase()}...`}
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
              />
              <button
                onClick={sendMessage}
                className="inline-flex items-center rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                <Send size={12} className="mr-1" />
                Enviar
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
