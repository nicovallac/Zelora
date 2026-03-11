import { Bot } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { DecisionCard } from '../components/workspace/decision-card';

export function WorkspaceActionsPage() {
  const { decisions, updateDecisionStatus, convertDecisionToTask } = useWorkspace();
  const { showSuccess } = useNotification();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-ink-900">Decisions</h1>
        </div>
        <p className="text-sm text-ink-500 mt-2">
          Decisiones recomendadas por IA con confianza, impacto y acciones de aprobacion.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {decisions.map((decision) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            onApprove={(id) => {
              updateDecisionStatus(id, 'approved');
              showSuccess('Decision approved');
            }}
            onConvertTask={(id) => {
              convertDecisionToTask(id);
              showSuccess('Decision converted to task');
            }}
            onDismiss={(id) => {
              updateDecisionStatus(id, 'dismissed');
              showSuccess('Decision dismissed');
            }}
          />
        ))}
      </section>
    </div>
  );
}
