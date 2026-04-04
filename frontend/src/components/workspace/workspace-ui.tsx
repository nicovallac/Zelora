import type { TaskStatus, WorkspaceAgentType } from '../../types/workspace';

function agentTone(type: WorkspaceAgentType) {
  if (type === 'sales') return 'bg-emerald-100 text-emerald-700';
  if (type === 'marketing') return 'bg-violet-100 text-violet-700';
  if (type === 'operations') return 'bg-sky-100 text-sky-700';
  return 'bg-ink-100 text-ink-700';
}

export function AgentPill({ type }: { type: WorkspaceAgentType }) {
  const label = type === 'human' ? 'Human' : `${type[0].toUpperCase()}${type.slice(1)} Agent`;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${agentTone(type)}`}>
      {label}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const tone =
    status === 'resolved'
      ? 'bg-emerald-100 text-emerald-700'
    : status === 'in_progress'
      ? 'bg-blue-100 text-blue-700'
    : status === 'blocked'
      ? 'bg-red-100 text-red-700'
    : status === 'reviewing'
      ? 'bg-violet-100 text-violet-700'
    : status === 'cancelled'
      ? 'bg-ink-200 text-ink-600'
      : 'bg-ink-100 text-ink-600';

  const label = status.replace('_', ' ');
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>{label}</span>;
}
