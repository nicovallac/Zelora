export function TagBadge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'interest' | 'objection' }) {
  const toneClass =
    tone === 'interest'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'objection'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-ink-100 text-ink-700';
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${toneClass}`}>{label}</span>;
}
