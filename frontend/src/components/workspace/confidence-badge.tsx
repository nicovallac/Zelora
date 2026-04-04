export function ConfidenceBadge({ value }: { value: number }) {
  const tone =
    value >= 85 ? 'bg-emerald-100 text-emerald-700' : value >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>Confidence {value}%</span>;
}
