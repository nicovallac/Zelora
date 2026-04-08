import { useEffect, useState } from 'react';
import {
  Bot, BookOpen, ChevronDown, ChevronUp,
  FileText, Loader2, MessageSquare, Plus, RefreshCw, ShoppingBag, Zap,
} from 'lucide-react';

import { api } from '../../services/api';
import type { DocumentExtractionCandidateApiItem } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

// ── tab definitions ───────────────────────────────────────────────────────────

type TabId = 'faq' | 'services' | 'flows' | 'policies';

const TABS: { id: TabId; label: string; icon: React.ElementType; kinds: DocumentExtractionCandidateApiItem['kind'][] }[] = [
  { id: 'faq',      label: 'Preguntas y respuestas', icon: MessageSquare, kinds: ['ai_qa'] },
  { id: 'services', label: 'Servicios / Productos',  icon: ShoppingBag,   kinds: ['service'] },
  { id: 'flows',    label: 'Posibles flujos',         icon: Zap,           kinds: ['flow_hint'] },
  { id: 'policies', label: 'Políticas / Condiciones', icon: BookOpen,      kinds: ['policy', 'pricing_rule'] },
];

const KIND_DEST: Record<DocumentExtractionCandidateApiItem['kind'], string> = {
  ai_qa:        'KB · FAQ',
  ai_summary:   'KB',
  service:      'Catálogo',
  flow_hint:    'Flujos',
  policy:       'KB · Políticas',
  pricing_rule: 'KB · Precios',
};

const KIND_COLOR: Record<DocumentExtractionCandidateApiItem['kind'], string> = {
  ai_qa:        'bg-brand-50 text-brand-700 border-brand-200/60',
  ai_summary:   'bg-brand-50 text-brand-700 border-brand-200/60',
  service:      'bg-sky-50 text-sky-700 border-sky-200/60',
  flow_hint:    'bg-purple-50 text-purple-700 border-purple-200/60',
  policy:       'bg-amber-50 text-amber-700 border-amber-200/60',
  pricing_rule: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
};

// ── single item card ──────────────────────────────────────────────────────────

function ItemCard({
  item,
  onApprove,
  acting,
}: {
  item: DocumentExtractionCandidateApiItem;
  onApprove: (id: string) => void;
  acting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasBody = (item.body || '').trim().length > 0;
  const dest = KIND_DEST[item.kind];
  const color = KIND_COLOR[item.kind];

  return (
    <div className="rounded-2xl border border-[rgba(17,17,16,0.07)] bg-white/80 p-3">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold ${color}`}>
              {dest}
            </span>
            <span className="text-[10px] text-ink-400">{(item.confidence * 100).toFixed(0)}%</span>
          </div>
          <p className="mt-1 text-[12.5px] font-semibold leading-snug text-ink-900">{item.title}</p>

          {hasBody && (
            <>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-400 hover:text-ink-700"
              >
                {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {expanded ? 'Ocultar' : 'Ver contenido'}
              </button>
              {expanded && (
                <p className="mt-2 rounded-xl bg-[rgba(17,17,16,0.03)] px-3 py-2 text-[11.5px] leading-relaxed text-ink-600">
                  {item.body}
                </p>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => onApprove(item.id)}
          disabled={acting}
          className="flex flex-shrink-0 items-center gap-1 rounded-full bg-ink-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-ink-700 disabled:opacity-40"
        >
          {acting ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
          Agregar
        </button>
      </div>
    </div>
  );
}

// ── tab content ───────────────────────────────────────────────────────────────

function TabContent({
  items,
  onApprove,
  actingId,
  emptyText,
}: {
  items: DocumentExtractionCandidateApiItem[];
  onApprove: (id: string) => void;
  actingId: string | null;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.02)] py-8 text-[12px] text-ink-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onApprove={onApprove}
          acting={actingId === item.id}
        />
      ))}
    </div>
  );
}

// ── main panel ────────────────────────────────────────────────────────────────

export function DocumentAnalysisPanel({
  documentId,
  documentName,
  documentText,
  processingStatus,
  onItemAdded,
}: {
  documentId: string;
  documentName: string;
  documentText: string;
  processingStatus: string;
  onItemAdded?: () => void;
}) {
  const { showSuccess, showError } = useNotification();
  const [items, setItems] = useState<DocumentExtractionCandidateApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [savingFull, setSavingFull] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('faq');

  async function load() {
    setLoading(true);
    try {
      const result = await api.getDocumentExtractionCandidates({
        source_document: documentId,
        status: 'pending',
      });
      setItems(result);
      // Auto-select first tab that has items
      for (const tab of TABS) {
        if (result.some((i) => (tab.kinds as string[]).includes(i.kind))) {
          setActiveTab(tab.id);
          break;
        }
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (processingStatus === 'ready') void load();
  }, [documentId, processingStatus]);

  async function handleApprove(id: string) {
    setActingId(id);
    try {
      const result = await api.approveDocumentExtractionCandidate(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      const label = result.target === 'product' ? 'Catálogo' : 'KB';
      showSuccess('Agregado', `Guardado en ${label}.`);
      onItemAdded?.();
    } catch (e) {
      showError('Error', e instanceof Error ? e.message : 'No se pudo agregar.');
    } finally {
      setActingId(null);
    }
  }

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      await api.generateDocumentExtractionCandidates(documentId);
      await load();
      showSuccess('Re-analizado', 'El documento fue procesado de nuevo.');
    } catch (e) {
      showError('Error', e instanceof Error ? e.message : 'No se pudo re-analizar.');
    } finally {
      setReanalyzing(false);
    }
  }

  async function handleSaveFullText() {
    if (!documentText.trim()) { showError('Sin texto', 'Este documento no tiene texto extraído.'); return; }
    setSavingFull(true);
    try {
      await api.createKnowledgeBaseArticle({
        title: documentName,
        content: documentText,
        category: 'Documento completo',
        purpose: 'business',
        tags: ['documento', 'completo'],
        status: 'published',
      });
      showSuccess('Guardado', 'El texto completo del documento está ahora en KB y disponible para el agente.');
      onItemAdded?.();
    } catch (e) {
      showError('Error', e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSavingFull(false);
    }
  }

  if (processingStatus !== 'ready') return null;

  const summaryItem = items.find((i) => i.kind === 'ai_summary');

  return (
    <div className="mt-4 flex flex-col gap-3">

      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Bot size={13} className="text-brand-500" />
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">Análisis</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => void handleReanalyze()}
            disabled={reanalyzing}
            className="flex items-center gap-1 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-ink-500 transition hover:text-ink-800 disabled:opacity-40"
          >
            {reanalyzing ? <Loader2 size={9} className="animate-spin" /> : <RefreshCw size={9} />}
            Re-analizar
          </button>
          <button
            onClick={() => void load()}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 text-ink-400 hover:text-ink-700 transition"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-[12px] text-ink-400">
          <Loader2 size={12} className="animate-spin" /> Cargando análisis...
        </div>
      ) : (
        <>
          {/* AI summary — informational only, no action button */}
          {summaryItem && (
            <div className="rounded-2xl border border-brand-200/50 bg-gradient-to-br from-brand-50/50 to-white px-4 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-400">Lo que entendí</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-800">{summaryItem.body}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.03)] p-1">
            {TABS.map((tab) => {
              const count = items.filter((i) => (tab.kinds as string[]).includes(i.kind)).length;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-white shadow-sm text-ink-900'
                      : 'text-ink-400 hover:text-ink-700'
                  }`}
                >
                  <TabIcon size={11} />
                  {tab.label}
                  {count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${activeTab === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-ink-200/60 text-ink-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {TABS.map((tab) => {
            if (tab.id !== activeTab) return null;
            const tabItems = items.filter((i) => (tab.kinds as string[]).includes(i.kind));
            const emptyMessages: Record<TabId, string> = {
              faq:      'No se detectaron preguntas y respuestas en este documento.',
              services: 'No se detectaron servicios o productos.',
              flows:    'No se detectaron posibles flujos conversacionales.',
              policies: 'No se detectaron políticas ni condiciones.',
            };
            return (
              <TabContent
                key={tab.id}
                items={tabItems}
                onApprove={handleApprove}
                actingId={actingId}
                emptyText={emptyMessages[tab.id]}
              />
            );
          })}

          {/* Save full text */}
          <div className="rounded-2xl border border-[rgba(17,17,16,0.07)] bg-white/60 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-ink-800">Guardar texto completo en KB</p>
                <p className="mt-0.5 text-[11px] text-ink-400">
                  El agente podrá consultar el documento completo al responder preguntas.
                </p>
              </div>
              <button
                onClick={() => void handleSaveFullText()}
                disabled={savingFull || !documentText.trim()}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.12)] bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-40"
              >
                {savingFull ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                Guardar completo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
