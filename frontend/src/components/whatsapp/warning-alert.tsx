import { AlertTriangle } from 'lucide-react';

export function WarningAlert({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-amber-100 p-1.5 text-amber-700">
          <AlertTriangle size={14} />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">{description}</p>
        </div>
      </div>
    </div>
  );
}
