import { useState } from 'react';
import { KanbanSquare, Table2 } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { TaskTable } from '../components/workspace/task-table';
import { TaskBoard } from '../components/workspace/task-board';

export function WorkspaceTasksPage() {
  const [view, setView] = useState<'table' | 'board'>('table');
  const { tasks, updateTaskStatus } = useWorkspace();
  const { showSuccess } = useNotification();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <KanbanSquare size={18} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-ink-900">Tasks</h1>
        </div>
        <p className="text-sm text-ink-500 mt-2">
          Tareas creadas por Sales, Marketing, Operations y humanos.
        </p>
        <div className="mt-4 inline-flex rounded-lg border border-ink-200 bg-ink-50 p-1">
          <button
            onClick={() => setView('table')}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold ${view === 'table' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
          >
            <Table2 size={13} className="mr-1" />
            Table view
          </button>
          <button
            onClick={() => setView('board')}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold ${view === 'board' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
          >
            <KanbanSquare size={13} className="mr-1" />
            Kanban view
          </button>
        </div>
      </section>

      {view === 'table' ? (
        <TaskTable
          tasks={tasks}
          onUpdateStatus={(taskId, status) => {
            updateTaskStatus(taskId, status);
            showSuccess('Task updated', `Task ${taskId} -> ${status}`);
          }}
        />
      ) : (
        <TaskBoard
          tasks={tasks}
          onUpdateStatus={(taskId, status) => {
            updateTaskStatus(taskId, status);
            showSuccess('Task updated', `Task ${taskId} -> ${status}`);
          }}
        />
      )}
    </div>
  );
}
