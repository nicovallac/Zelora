import type { QualityStatus } from '../../data/whatsapp-management';

const QUALITY_STYLES: Record<QualityStatus, string> = {
  healthy: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-600',
  unknown: 'bg-[rgba(17,17,16,0.06)] text-ink-400',
};

const QUALITY_LABELS: Record<QualityStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  unknown: 'Unknown',
};

export function QualityBadge({ value }: { value: QualityStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${QUALITY_STYLES[value]}`}>
      {QUALITY_LABELS[value]}
    </span>
  );
}
