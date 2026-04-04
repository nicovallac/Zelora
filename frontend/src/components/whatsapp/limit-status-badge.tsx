export function LimitStatusBadge({ value }: { value: string }) {
  const style = value.toLowerCase().includes('tier 2')
    ? 'bg-sky-100 text-sky-700'
    : value.toLowerCase().includes('tier 1')
      ? 'bg-amber-100 text-amber-700'
      : 'bg-[rgba(17,17,16,0.06)] text-ink-600';

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${style}`}>{value}</span>;
}
