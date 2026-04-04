import { Phone } from 'lucide-react';
import type { PhoneNumberInfo } from '../../data/whatsapp-management';
import { LimitStatusBadge } from './limit-status-badge';
import { QualityBadge } from './quality-badge';

const PHONE_STATUS_STYLES: Record<PhoneNumberInfo['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-sky-100 text-sky-700',
  restricted: 'bg-red-100 text-red-600',
};

export function PhoneNumberCard({
  phoneNumber,
  onRefresh,
}: {
  phoneNumber: PhoneNumberInfo;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#dcfce7] text-[#16a34a]">
            <Phone size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">{phoneNumber.displayNumber}</p>
            <p className="mt-1 font-mono text-[11px] text-ink-400">{phoneNumber.phoneNumberId}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${PHONE_STATUS_STYLES[phoneNumber.status]}`}>
          {phoneNumber.status}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <QualityBadge value={phoneNumber.quality} />
          <LimitStatusBadge value={phoneNumber.limitTier} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Verified name</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{phoneNumber.verifiedName}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Last activity</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{new Date(phoneNumber.lastActivityAt).toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>
      <button
        onClick={onRefresh}
        className="mt-4 rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]"
      >
        Refresh
      </button>
    </div>
  );
}
