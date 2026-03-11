import { Lightbulb } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { InsightCard } from '../components/workspace/insight-card';

export function WorkspaceInsightsPage() {
  const { insights, createTaskFromInsight, updateInsightStatus } = useWorkspace();
  const { showSuccess } = useNotification();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-ink-900">Insights</h1>
        </div>
        <p className="text-sm text-ink-500 mt-2">
          Insights de agentes con score de confianza y acciones inmediatas.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onCreateTask={(id) => {
              createTaskFromInsight(id);
              showSuccess('Insight converted', 'Se creo una nueva tarea');
            }}
            onMarkReviewed={(id) => {
              updateInsightStatus(id, 'reviewed');
              showSuccess('Insight reviewed');
            }}
            onDismiss={(id) => {
              updateInsightStatus(id, 'dismissed');
              showSuccess('Insight dismissed');
            }}
          />
        ))}
      </section>
    </div>
  );
}
