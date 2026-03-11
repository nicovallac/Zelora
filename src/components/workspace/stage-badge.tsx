import type { CustomerStage } from '../../types/workspace';

export function StageBadge({ stage }: { stage: CustomerStage }) {
  const tone =
    stage === 'decision'
      ? 'bg-emerald-100 text-emerald-700'
      : stage === 'consideration'
        ? 'bg-blue-100 text-blue-700'
        : stage === 'interest'
          ? 'bg-violet-100 text-violet-700'
          : stage === 'customer'
            ? 'bg-teal-100 text-teal-700'
            : 'bg-ink-100 text-ink-700';
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>{stage}</span>;
}
