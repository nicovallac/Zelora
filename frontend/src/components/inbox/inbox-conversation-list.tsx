import { Search } from 'lucide-react';
import { Skeleton } from '../ui/primitives';
import { InboxConversationItem } from './inbox-conversation-item';
import type { InboxConversationSummary, InboxFilter } from './types';

const FILTERS: Array<{ key: InboxFilter; label: string }> = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'sin_responder', label: 'Sin responder' },
  { key: 'ia', label: 'IA' },
  { key: 'humano', label: 'Humano' },
  { key: 'escaladas', label: 'Escaladas' },
  { key: 'oportunidades', label: 'Oportunidades' },
  { key: 'cerradas', label: 'Cerradas' },
  { key: 'perdidas', label: 'Perdidas' },
];

export function InboxConversationList({
  conversations,
  activeId,
  filter,
  search,
  loading,
  onFilterChange,
  onSearchChange,
  onSelectConversation,
}: {
  conversations: InboxConversationSummary[];
  activeId?: string;
  filter: InboxFilter;
  search: string;
  loading: boolean;
  onFilterChange: (filter: InboxFilter) => void;
  onSearchChange: (value: string) => void;
  onSelectConversation: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[rgba(17,17,16,0.08)] p-2.5">
        <div className="flex items-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-2.5 py-2">
          <Search size={14} className="text-ink-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por cliente, mensaje o intencion"
            className="w-full bg-transparent text-[13px] text-ink-700 outline-none placeholder:text-ink-300"
          />
        </div>
        <div className="scrollbar-hide mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              onClick={() => onFilterChange(item.key)}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                filter === item.key ? 'bg-brand-500 text-white' : 'bg-[rgba(17,17,16,0.04)] text-ink-600 hover:bg-[rgba(17,17,16,0.07)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-2.5">
                <div className="flex gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.02)] px-4 py-8 text-center">
            <p className="text-sm font-semibold text-ink-900">No encontramos conversaciones</p>
            <p className="mt-1 text-sm text-ink-500">Cambia el filtro o espera nuevos mensajes desde tus canales activos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <InboxConversationItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                onSelect={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
