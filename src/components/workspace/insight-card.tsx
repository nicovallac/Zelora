import type { AgentInsight } from '../../types/workspace';
import { ConfidenceBadge } from './confidence-badge';
import { PriorityBadge } from './priority-badge';

export function InsightCard({
  insight,
  onCreateTask,
  onMarkReviewed,
  onDismiss,
}: {
  insight: AgentInsight;
  onCreateTask: (id: string) => void;
  onMarkReviewed: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <article className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-900">{insight.title}</p>
          <p className="text-xs text-ink-500 mt-1">{insight.description}</p>
        </div>
        <PriorityBadge priority={insight.priority} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-ink-100 px-2 py-1 text-[11px] text-ink-700">{insight.sourceAgent}</span>
        <span className="rounded-full bg-ink-100 px-2 py-1 text-[11px] text-ink-700">{insight.category}</span>
        <ConfidenceBadge value={insight.confidence} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => onCreateTask(insight.id)} className="rounded-md bg-brand-600 px-2.5 py-1.5 text-[11px] text-white font-semibold">
          Convert to task
        </button>
        <button onClick={() => onMarkReviewed(insight.id)} className="rounded-md bg-blue-50 px-2.5 py-1.5 text-[11px] text-blue-700 font-semibold">
          Mark reviewed
        </button>
        <button onClick={() => onDismiss(insight.id)} className="rounded-md bg-ink-100 px-2.5 py-1.5 text-[11px] text-ink-700 font-semibold">
          Dismiss
        </button>
      </div>
    </article>
  );
}
