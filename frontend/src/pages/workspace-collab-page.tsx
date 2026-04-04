import { useMemo, useState } from 'react';
import { Hash, MessagesSquare, SendHorizontal } from 'lucide-react';
import { workspaceChannels } from '../data/workspace';
import { ActivityItem } from '../components/workspace/activity-item';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotification } from '../contexts/NotificationContext';

export function WorkspaceCollabPage() {
  const [selectedChannel, setSelectedChannel] = useState(workspaceChannels[0]);
  const [note, setNote] = useState('');
  const { activity, postActivity } = useWorkspace();
  const { showSuccess } = useNotification();

  const filteredEvents = useMemo(
    () => activity.filter((event) => event.channel === selectedChannel),
    [activity, selectedChannel]
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[72vh]">
        <aside className="lg:col-span-3 rounded-xl border border-[rgba(17,17,16,0.10)] bg-white/70 backdrop-blur-sm p-4">
          <h1 className="font-semibold text-ink-900 flex items-center gap-2 mb-3">
            <Hash size={15} className="text-brand-600" />
            Activity Channels
          </h1>
          <div className="space-y-1.5">
            {workspaceChannels.map((channel) => (
              <button
                key={channel}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedChannel === channel ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
        </aside>

        <section className="lg:col-span-9 rounded-xl border border-[rgba(17,17,16,0.10)] bg-white/70 backdrop-blur-sm p-4 flex flex-col">
          <div className="pb-3 border-b border-[rgba(17,17,16,0.08)]">
            <h2 className="font-semibold text-ink-900 flex items-center gap-2">
              <MessagesSquare size={16} className="text-brand-600" />
              Activity Feed {selectedChannel}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {filteredEvents.map((event) => (
              <ActivityItem key={event.id} event={event} />
            ))}
          </div>

          <div className="pt-3 border-t border-[rgba(17,17,16,0.08)]">
            <div className="flex items-center gap-2 rounded-lg border border-[rgba(17,17,16,0.10)] px-3 py-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Escribe una nota interna o decision..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
              />
              <button
                onClick={() => {
                  postActivity(selectedChannel, note || 'Internal update', 'system');
                  setNote('');
                  showSuccess('Activity posted');
                }}
                className="inline-flex items-center rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
              >
                <SendHorizontal size={12} className="mr-1" />
                Post
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
