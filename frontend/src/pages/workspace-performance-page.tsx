import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, GraduationCap, Loader2 } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import type { LearningLoopMetricsApiItem } from '../services/api';

export function WorkspacePerformancePage() {
  const { agents, tasks } = useWorkspace();
  const [loadingLearning, setLoadingLearning] = useState(true);
  const [learningMetrics, setLearningMetrics] = useState<LearningLoopMetricsApiItem | null>(null);
  const [learningError, setLearningError] = useState<string | null>(null);

  const performanceData = agents.map((agent) => {
    const doneTasks = tasks.filter((task) => task.assignedTo === agent.type && task.status === 'resolved').length;
    const openTasks = tasks.filter((task) => task.assignedTo === agent.type && task.status !== 'resolved').length;
    return {
      name: agent.name,
      conversion: Number.parseFloat(agent.kpiValue) || 0,
      tasksDone: doneTasks,
      response: Math.max(70, 100 - openTasks * 2),
    };
  });

  useEffect(() => {
    let cancelled = false;
    async function loadLearningMetrics() {
      setLoadingLearning(true);
      setLearningError(null);
      try {
        const result = await api.getLearningLoopMetrics(30);
        if (!cancelled) setLearningMetrics(result);
      } catch (error) {
        if (!cancelled) {
          setLearningMetrics(null);
          setLearningError(error instanceof Error ? error.message : 'No se pudo cargar learning loop.');
        }
      } finally {
        if (!cancelled) setLoadingLearning(false);
      }
    }
    void loadLearningMetrics();
    return () => { cancelled = true; };
  }, []);

  const byKind = useMemo(() => {
    const items = learningMetrics?.candidates.by_kind || [];
    const map = new Map(items.map((item) => [item.kind, item.count]));
    return [
      { label: 'conversation_example', value: map.get('conversation_example') || 0 },
      { label: 'faq', value: map.get('faq') || 0 },
      { label: 'estilo_comunicacion', value: map.get('estilo_comunicacion') || 0 },
      ...items
        .filter((item) => !['conversation_example', 'faq', 'estilo_comunicacion'].includes(item.kind))
        .map((item) => ({ label: item.kind, value: item.count })),
    ];
  }, [learningMetrics]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <section className="rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/70 backdrop-blur-sm p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-ink-900">Agent Performance Dashboard</h1>
        </div>
        <p className="text-sm text-ink-500 mt-2">
          Vista ejecutiva de desempeno por agente en conversion, productividad y cumplimiento.
        </p>
      </section>

      <section className="rounded-xl border border-[rgba(17,17,16,0.10)] bg-white/70 backdrop-blur-sm p-4">
        <h2 className="font-semibold text-ink-900 text-sm mb-3">KPIs por agente</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="conversion" fill="#4F46E5" name="Conversion %" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tasksDone" fill="#10B981" name="Tasks done" radius={[4, 4, 0, 0]} />
              <Bar dataKey="response" fill="#0EA5E9" name="Response quality" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(17,17,16,0.10)] bg-white/70 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-brand-600" />
          <h2 className="font-semibold text-ink-900 text-sm">Learning Loop Health (L11)</h2>
        </div>

        {loadingLearning ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-ink-500">
            <Loader2 size={14} className="animate-spin" />
            Cargando metricas del learning loop...
          </div>
        ) : learningError ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {learningError}
          </div>
        ) : !learningMetrics ? (
          <div className="mt-3 rounded-xl border border-dashed border-[rgba(17,17,16,0.12)] px-3 py-2 text-sm text-ink-500">
            Sin datos de learning loop todavia.
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-[rgba(17,17,16,0.08)] bg-white/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.10em] text-ink-400">Pending</p>
                <p className="text-[16px] font-semibold text-ink-900">{learningMetrics.candidates.pending}</p>
              </div>
              <div className="rounded-xl border border-[rgba(17,17,16,0.08)] bg-white/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.10em] text-ink-400">Approved</p>
                <p className="text-[16px] font-semibold text-ink-900">{learningMetrics.candidates.approved}</p>
              </div>
              <div className="rounded-xl border border-[rgba(17,17,16,0.08)] bg-white/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.10em] text-ink-400">Rejected</p>
                <p className="text-[16px] font-semibold text-ink-900">{learningMetrics.candidates.rejected}</p>
              </div>
              <div className="rounded-xl border border-[rgba(17,17,16,0.08)] bg-white/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.10em] text-ink-400">Approval rate</p>
                <p className="text-[16px] font-semibold text-ink-900">{learningMetrics.candidates.approval_rate}%</p>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.02)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-ink-500">By kind</p>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {byKind.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-[12px]">
                    <span className="text-ink-700">{item.label}</span>
                    <span className="font-semibold text-ink-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.02)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-ink-500">Impact on CVR</p>
              <p className="mt-1 text-sm text-ink-700">
                Before: {learningMetrics.impact.cvr_before_learning}% {' -> '} After: {learningMetrics.impact.cvr_after_learning}% {' '}
                ({learningMetrics.impact.cvr_improvement >= 0 ? '+' : ''}{learningMetrics.impact.cvr_improvement}%)
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
