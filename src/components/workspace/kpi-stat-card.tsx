export function KPIStatCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <article className="rounded-xl border border-ink-200 bg-white p-3 sm:p-4">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-ink-900 mt-1">{value}</p>
      <p className="text-xs text-emerald-600 mt-1">{delta}</p>
    </article>
  );
}
