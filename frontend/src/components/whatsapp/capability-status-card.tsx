import { ShieldCheck } from 'lucide-react';

export function CapabilityStatusCard({ capabilities }: { capabilities: string[] }) {
  return (
    <div className="rounded-[24px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-400">Capabilities</p>
          <h3 className="mt-1 text-lg font-bold text-ink-900">Estado operativo</h3>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {capabilities.map((capability) => (
          <span key={capability} className="rounded-full bg-[rgba(17,17,16,0.06)] px-3 py-1 text-xs font-semibold text-ink-700">
            {capability}
          </span>
        ))}
      </div>
    </div>
  );
}
