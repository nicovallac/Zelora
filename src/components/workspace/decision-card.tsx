import type { WorkspaceDecision } from '../../types/workspace';
import { ConfidenceBadge } from './confidence-badge';

export function DecisionCard({
  decision,
  onApprove,
  onConvertTask,
  onDismiss,
}: {
  decision: WorkspaceDecision;
  onApprove: (id: string) => void;
  onConvertTask: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const impactTone =
    decision.impact === 'high' ? 'bg-red-100 text-red-700' : decision.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-700';
  return (
    <article className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">{decision.title}</p>
          <p className="text-xs text-ink-500 mt-1">{decision.explanation}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${impactTone}`}>Impact {decision.impact}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <ConfidenceBadge value={decision.confidence} />
        <span className="rounded-full bg-ink-100 px-2 py-1 text-[11px] text-ink-700">{decision.ownerAgent}</span>
        <span className="rounded-full bg-ink-100 px-2 py-1 text-[11px] text-ink-700">{decision.status}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => onApprove(decision.id)} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] text-white font-semibold">
          Approve
        </button>
        <button onClick={() => onConvertTask(decision.id)} className="rounded-md bg-brand-600 px-2.5 py-1.5 text-[11px] text-white font-semibold">
          Convert to task
        </button>
        <button onClick={() => onDismiss(decision.id)} className="rounded-md bg-ink-100 px-2.5 py-1.5 text-[11px] text-ink-700 font-semibold">
          Dismiss
        </button>
      </div>
    </article>
  );
}
