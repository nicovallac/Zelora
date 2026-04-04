export type DashboardMaturity = 'nuevo' | 'activado' | 'operativo';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface SnapshotItem {
  label: string;
  value: string;
  hint: string;
  tone: 'default' | 'brand' | 'success' | 'warning';
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  href?: string;
  cta: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
}

export interface AttentionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: 'danger' | 'warning' | 'neutral';
}

export interface SummaryItem {
  label: string;
  value: string;
  hint: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}
