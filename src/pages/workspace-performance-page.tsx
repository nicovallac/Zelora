import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';

export function WorkspacePerformancePage() {
  const { agents, tasks } = useWorkspace();
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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-ink-900">Agent Performance Dashboard</h1>
        </div>
        <p className="text-sm text-ink-500 mt-2">
          Vista ejecutiva de desempeno por agente en conversion, productividad y cumplimiento.
        </p>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-4">
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
    </div>
  );
}
