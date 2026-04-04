import { Activity, Boxes, Bot, MessageSquareMore, Radio, Reply } from 'lucide-react';
import { Card } from '../ui/primitives';
import type { SnapshotItem } from './types';

const ICONS = [MessageSquareMore, Reply, Radio, Boxes, Bot];

const TONE_CLASSES = {
  default: 'bg-ink-100/60 text-ink-500',
  brand:   'bg-brand-200/60 text-brand-700',
  success: 'bg-emerald-100/60 text-emerald-600',
  warning: 'bg-amber-100/60 text-amber-600',
} as const;

export function BusinessSnapshot({ items }: { items: SnapshotItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item, index) => {
        const Icon = ICONS[index] || Activity;
        return (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="lab-stat-label">{item.label}</p>
                <p className="lab-stat mt-2.5">{item.value}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-400">{item.hint}</p>
              </div>
              <div className={`shrink-0 rounded-2xl p-2 ${TONE_CLASSES[item.tone]}`}>
                <Icon size={14} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
