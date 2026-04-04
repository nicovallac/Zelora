import type { TaskPriority } from '../../types/workspace';

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const tone =
    priority === 'urgent'
      ? 'bg-red-100 text-red-700'
      : priority === 'high'
        ? 'bg-amber-100 text-amber-700'
        : priority === 'medium'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-ink-100 text-ink-600';
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>{priority}</span>;
}
