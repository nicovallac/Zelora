import { useMemo, useState } from 'react';
import { Database } from 'lucide-react';
import type { CustomerMemory } from '../types/workspace';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { SearchBar } from '../components/workspace/search-bar';
import { CustomerMemoryCard } from '../components/workspace/customer-memory-card';
import { CustomerMemoryPanel } from '../components/workspace/customer-memory-panel';

export function WorkspaceMemoryPage() {
  const { memories, tasks, insights } = useWorkspace();
  const [query, setQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<CustomerMemory | null>(null);

  const filteredMemories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return memories;
    return memories.filter((memory) => {
      const bucket = [
        memory.customerName,
        memory.companyName || '',
        memory.summary,
        memory.interests.join(' '),
        memory.objections.join(' '),
        memory.nextBestAction,
      ]
        .join(' ')
        .toLowerCase();
      return bucket.includes(q);
    });
  }, [memories, query]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <section className="rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/70 backdrop-blur-sm p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-ink-900">Shared Memory</h1>
        </div>
        <p className="text-sm text-ink-500 mt-2">
          Explora memoria persistente por cliente: intereses, objeciones, historial y next best action.
        </p>
        <div className="mt-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search customers by name, interests, objections or summary..."
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMemories.map((memory) => (
          <CustomerMemoryCard key={memory.id} memory={memory} onClick={setSelectedMemory} />
        ))}
      </section>

      <CustomerMemoryPanel
        memory={selectedMemory}
        tasks={tasks}
        insights={insights}
        onClose={() => setSelectedMemory(null)}
      />
    </div>
  );
}
