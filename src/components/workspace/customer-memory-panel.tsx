import { X } from 'lucide-react';
import type { AgentInsight, AgentTask, CustomerMemory } from '../../types/workspace';
import { NextBestActionCard } from './next-best-action-card';
import { TagBadge } from './tag-badge';

export function CustomerMemoryPanel({
  memory,
  tasks,
  insights,
  onClose,
}: {
  memory: CustomerMemory | null;
  tasks: AgentTask[];
  insights: AgentInsight[];
  onClose: () => void;
}) {
  if (!memory) return null;

  const relatedTasks = tasks.filter((task) => memory.relatedTaskIds.includes(task.id));
  const relatedInsights = insights.filter((insight) => memory.relatedInsightIds.includes(insight.id));

  return (
    <aside className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white border-l border-ink-200 overflow-y-auto p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Customer Memory Panel</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-ink-100">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-ink-200 p-3">
          <p className="text-sm font-semibold text-ink-900">{memory.customerName}</p>
          <p className="text-xs text-ink-500 mt-1">{memory.summary}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {memory.interests.map((item) => (
              <TagBadge key={item} label={item} tone="interest" />
            ))}
            {memory.objections.map((item) => (
              <TagBadge key={item} label={item} tone="objection" />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <NextBestActionCard action={memory.nextBestAction} />
        </div>

        <div className="mt-4 rounded-lg border border-ink-200 p-3">
          <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Conversation Timeline</p>
          <div className="mt-2 space-y-2">
            {memory.timeline.map((event) => (
              <div key={event.id} className="rounded-md bg-ink-50 p-2">
                <p className="text-[11px] text-ink-400">{new Date(event.at).toLocaleString('es-CO')}</p>
                <p className="text-xs text-ink-700">{event.event}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-ink-200 p-3">
          <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Related Tasks</p>
          <div className="mt-2 space-y-2">
            {relatedTasks.map((task) => (
              <p key={task.id} className="text-xs text-ink-700 rounded-md bg-ink-50 p-2">
                {task.title}
              </p>
            ))}
            {relatedTasks.length === 0 && <p className="text-xs text-ink-400">Sin tareas relacionadas.</p>}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-ink-200 p-3">
          <p className="text-xs font-semibold text-ink-700 uppercase tracking-wide">Related Insights</p>
          <div className="mt-2 space-y-2">
            {relatedInsights.map((insight) => (
              <p key={insight.id} className="text-xs text-ink-700 rounded-md bg-ink-50 p-2">
                {insight.title}
              </p>
            ))}
            {relatedInsights.length === 0 && <p className="text-xs text-ink-400">Sin insights relacionados.</p>}
          </div>
          <p className="text-xs text-ink-500 mt-3">Opportunity status: {memory.opportunityStatus}</p>
        </div>
      </div>
    </aside>
  );
}
