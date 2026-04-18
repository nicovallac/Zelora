import { Activity, Boxes, Bot, MessageSquareMore, Radio, Reply } from 'lucide-react';
import { Card } from '../ui/primitives';
import type { SnapshotItem } from './types';

const ICONS = [MessageSquareMore, Reply, Radio, Boxes, Bot];

const TONE_STYLES = {
  default: { background: 'rgba(0,0,0,0.06)',       color: '#6e6b60' },
  brand:   { background: 'rgba(139,92,246,0.10)',  color: '#7c3aed' },
  success: { background: 'rgba(16,185,129,0.10)',  color: '#059669' },
  warning: { background: 'rgba(245,158,11,0.10)',  color: '#b45309' },
} as const;

export function BusinessSnapshot({ items }: { items: SnapshotItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item, index) => {
        const Icon = ICONS[index] || Activity;
        const toneStyle = TONE_STYLES[item.tone];
        return (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="lab-stat-label">{item.label}</p>
                <p className="lab-stat mt-2.5">{item.value}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-500">{item.hint}</p>
              </div>
              <div className="shrink-0 rounded-xl p-2" style={toneStyle}>
                <Icon size={14} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
