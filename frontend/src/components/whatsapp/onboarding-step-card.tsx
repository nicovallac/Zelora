import { CheckCircle2, Circle, LoaderCircle, XCircle } from 'lucide-react';
import type { OnboardingStep } from '../../data/whatsapp-management';

const STEP_META = {
  done: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  current: { icon: LoaderCircle, color: 'text-brand-600', bg: 'bg-brand-50 border-brand-200' },
  pending: { icon: Circle, color: 'text-ink-400', bg: 'bg-white/70 backdrop-blur-sm border-[rgba(17,17,16,0.09)]' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

export function OnboardingStepCard({ step }: { step: OnboardingStep }) {
  const meta = STEP_META[step.status];
  const Icon = meta.icon;

  return (
    <div className={`rounded-2xl border px-4 py-4 ${meta.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${meta.color}`}>
          <Icon size={18} className={step.status === 'current' ? 'animate-spin' : ''} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900">{step.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-600">{step.description}</p>
        </div>
      </div>
    </div>
  );
}
