import type { AgentTask, TaskStatus } from '../../types/workspace';
import { AgentPill, TaskStatusBadge } from './workspace-ui';
import { PriorityBadge } from './priority-badge';

const columns: TaskStatus[] = ['new', 'reviewing', 'in_progress', 'blocked', 'resolved', 'cancelled'];

export function TaskBoard({
  tasks,
  onUpdateStatus,
}: {
  tasks: AgentTask[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
      {columns.map((column) => (
        <div key={column} className="rounded-xl border border-ink-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-ink-500 font-semibold">{column}</p>
          <div className="mt-2 space-y-2">
            {tasks.filter((task) => task.status === column).map((task) => (
              <article key={task.id} className="rounded-lg border border-ink-100 p-2.5 bg-ink-50">
                <p className="text-xs font-semibold text-ink-800">{task.title}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <PriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </div>
                <div className="mt-2">
                  <AgentPill type={task.assignedTo} />
                </div>
                {task.status !== 'resolved' && task.status !== 'cancelled' && (
                  <button
                    onClick={() => onUpdateStatus(task.id, 'resolved')}
                    className="mt-2 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
                  >
                    Mark resolved
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
