import type { CustomerMemory } from '../../types/workspace';
import { StageBadge } from './stage-badge';
import { TagBadge } from './tag-badge';
import { NextBestActionCard } from './next-best-action-card';

export function CustomerMemoryCard({
  memory,
  onClick,
}: {
  memory: CustomerMemory;
  onClick: (memory: CustomerMemory) => void;
}) {
  return (
    <button
      onClick={() => onClick(memory)}
      className="w-full text-left rounded-xl border border-[rgba(17,17,16,0.10)] bg-white/70 backdrop-blur-sm p-4 hover:border-brand-300 hover:shadow-card transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">{memory.customerName}</p>
          {memory.companyName && <p className="text-xs text-ink-500 mt-0.5">{memory.companyName}</p>}
        </div>
        <StageBadge stage={memory.stage} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full bg-ink-100 px-2 py-1 text-ink-700">{memory.preferredChannel}</span>
        <span className="rounded-full bg-ink-100 px-2 py-1 text-ink-700">Close {memory.closingProbability}%</span>
        <span className="rounded-full bg-ink-100 px-2 py-1 text-ink-700">Tier {memory.valueTier}</span>
      </div>

      <p className="text-xs text-ink-600 mt-3">{memory.summary}</p>

      <div className="mt-3">
        <p className="text-[11px] font-semibold text-ink-700">Interests</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {memory.interests.map((tag) => (
            <TagBadge key={tag} label={tag} tone="interest" />
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[11px] font-semibold text-ink-700">Objections</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {memory.objections.map((tag) => (
            <TagBadge key={tag} label={tag} tone="objection" />
          ))}
        </div>
      </div>

      <div className="mt-3">
        <NextBestActionCard action={memory.nextBestAction} />
      </div>
      <p className="text-[11px] text-ink-400 mt-2">
        Last interaction: {new Date(memory.lastInteraction).toLocaleString('es-CO')}
      </p>
    </button>
  );
}
