import type { AgentTask, TaskStatus } from '../../types/workspace';
import { AgentPill, TaskStatusBadge } from './workspace-ui';
import { PriorityBadge } from './priority-badge';

export function TaskTable({
  tasks,
  onUpdateStatus,
}: {
  tasks: AgentTask[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-ink-50 text-ink-500 text-xs">
          <tr>
            <th className="text-left font-semibold px-3 py-2">Title</th>
            <th className="text-left font-semibold px-3 py-2">Type</th>
            <th className="text-left font-semibold px-3 py-2">Priority</th>
            <th className="text-left font-semibold px-3 py-2">Status</th>
            <th className="text-left font-semibold px-3 py-2">Created by</th>
            <th className="text-left font-semibold px-3 py-2">Assigned to</th>
            <th className="text-left font-semibold px-3 py-2">Due</th>
            <th className="text-left font-semibold px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-ink-100">
              <td className="px-3 py-3">
                <p className="text-xs font-semibold text-ink-800">{task.title}</p>
                <p className="text-[11px] text-ink-500 mt-1">{task.relatedCustomerId || task.relatedProduct || '-'}</p>
              </td>
              <td className="px-3 py-3 text-xs text-ink-600">{task.taskType}</td>
              <td className="px-3 py-3"><PriorityBadge priority={task.priority} /></td>
              <td className="px-3 py-3"><TaskStatusBadge status={task.status} /></td>
              <td className="px-3 py-3"><AgentPill type={task.createdBy} /></td>
              <td className="px-3 py-3"><AgentPill type={task.assignedTo} /></td>
              <td className="px-3 py-3 text-xs text-ink-600">{new Date(task.dueAt).toLocaleString('es-CO')}</td>
              <td className="px-3 py-3">
                <select
                  value={task.status}
                  onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                  className="rounded-md border border-ink-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="new">new</option>
                  <option value="reviewing">reviewing</option>
                  <option value="in_progress">in_progress</option>
                  <option value="blocked">blocked</option>
                  <option value="resolved">resolved</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
