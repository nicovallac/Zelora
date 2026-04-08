import { Bot, FileText, Link2, Paperclip } from 'lucide-react';
import type { KnowledgeListItem } from './types';

function kindBadge(item: KnowledgeListItem) {
  if (item.kind === 'archivo') return { Icon: Paperclip, label: 'Doc', tone: 'bg-amber-50 text-amber-700 border-amber-200/60' };
  if (item.kind === 'link') return { Icon: Link2, label: 'Link', tone: 'bg-sky-50 text-sky-700 border-sky-200/60' };
  return { Icon: FileText, label: 'Texto', tone: 'bg-brand-50 text-brand-700 border-brand-200/60' };
}

function sourceBadge(item: KnowledgeListItem): { label: string; tone: string; isAi: boolean } | null {
  if (!item.rawArticle) return null;
  const tags: string[] = item.rawArticle.tags || [];
  const cat = (item.rawArticle.category || '').toLowerCase();

  // Came from AI conversation learning
  if (cat === 'ai_aprendido' || cat === 'aprendizaje automatico') {
    return { label: 'IA aprendido', tone: 'bg-violet-50 text-violet-700 border-violet-200/60', isAi: true };
  }
  // Came from document analysis approval
  if (tags.includes('document_extraction')) {
    return { label: 'Extraído', tone: 'bg-amber-50 text-amber-700 border-amber-200/60', isAi: true };
  }
  // Created manually by the user
  return { label: 'Manual', tone: 'bg-slate-50 text-slate-600 border-slate-200/60', isAi: false };
}

function processingColor(status?: KnowledgeListItem['processingStatus']) {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700';
  if (status === 'failed') return 'bg-red-50 text-red-600';
  if (status === 'processing') return 'bg-sky-50 text-sky-600';
  return 'bg-ink-100/70 text-ink-500';
}

const PROCESSING_LABELS: Record<string, string> = {
  ready: 'Listo',
  failed: 'Error',
  processing: 'Procesando',
  pending: 'Pendiente',
};

export function KnowledgeItem({
  item,
  active,
  onSelect,
}: {
  item: KnowledgeListItem;
  active: boolean;
  onSelect: () => void;
}) {
  const kind = kindBadge(item);
  const cat = sourceBadge(item);
  const KindIcon = kind.Icon;

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border p-3 text-left transition-all duration-150 ${
        active
          ? 'border-brand-300/70 bg-brand-50/80 shadow-card'
          : 'border-[rgba(17,17,16,0.08)] bg-white/60 hover:border-[rgba(17,17,16,0.13)] hover:bg-white/85'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${kind.tone}`}>
          <KindIcon size={11} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {cat && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${cat.tone}`}>
                {cat.isAi && <Bot size={8} />}
                {cat.label}
              </span>
            )}
            <p className="truncate text-[13px] font-semibold text-ink-900 leading-tight">{item.title}</p>
          </div>
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-ink-400">{item.preview}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 pl-[34px]">
        <span className="text-[10px] text-ink-400">
          {new Date(item.updatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
        </span>
        {item.processingStatus && (
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${processingColor(item.processingStatus)}`}>
            {PROCESSING_LABELS[item.processingStatus] || item.processingStatus}
          </span>
        )}
      </div>
    </button>
  );
}
