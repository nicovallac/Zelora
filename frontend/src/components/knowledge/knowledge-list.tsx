import { Search } from 'lucide-react';
import { Skeleton } from '../ui/primitives';
import { KnowledgeItem } from './knowledge-item';
import type { KnowledgeListItem } from './types';

export function KnowledgeList({
  items,
  selectedId,
  loading,
  search,
  onSearchChange,
  onSelect,
}: {
  items: KnowledgeListItem[];
  selectedId: string | null;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[rgba(17,17,16,0.07)] p-2.5">
        <div className="flex items-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/60 px-2.5 py-2 backdrop-blur-sm">
          <Search size={14} className="text-ink-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar informacion"
            className="w-full bg-transparent text-[13px] text-ink-700 outline-none placeholder:text-ink-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[rgba(17,17,16,0.07)] bg-white/60 p-2.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-8 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <KnowledgeItem key={item.id} item={item} active={selectedId === item.id} onSelect={() => onSelect(item.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
