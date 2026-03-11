import { ArrowRight } from 'lucide-react';

export function NextBestActionCard({ action }: { action: string }) {
  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-brand-700 font-semibold">Next Best Action</p>
      <p className="text-xs text-brand-800 mt-1">{action}</p>
      <button className="mt-2 inline-flex items-center text-[11px] font-semibold text-brand-700 hover:text-brand-900">
        Simular flujo
        <ArrowRight size={12} className="ml-1" />
      </button>
    </div>
  );
}
