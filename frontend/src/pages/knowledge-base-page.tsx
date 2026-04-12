import { useEffect, useMemo, useState } from 'react';
import {
  Bot, Brain, ChevronDown, ChevronLeft, ChevronUp,
  FileText, Loader2, Plus, RefreshCw, Sparkles, X,
} from 'lucide-react';

import { api } from '../services/api';
import type { KBArticleApiItem, KBArticlePayload, KBArticlePurpose, KBDocumentApiItem, LearningCandidateApiItem } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { Button, Card } from '../components/ui/primitives';
import { PageHeader } from '../components/ui/page-header';
import { AddKnowledgeModal } from '../components/knowledge/add-knowledge-modal';
import { KnowledgeEditor } from '../components/knowledge/knowledge-editor';
import { KnowledgeEmptyState } from '../components/knowledge/knowledge-empty-state';
import { KnowledgeList } from '../components/knowledge/knowledge-list';
import type { KnowledgeListItem } from '../components/knowledge/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function strip(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function preview(content: string) {
  const c = strip(content);
  return c.length > 120 ? `${c.slice(0, 117)}...` : c;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function articleToListItem(a: KBArticleApiItem): KnowledgeListItem {
  const looksLikeLink = /^https?:\/\//i.test(strip(a.content));
  return {
    id: a.id,
    kind: looksLikeLink ? 'link' : 'entrada',
    title: a.title || 'Entrada sin titulo',
    preview: strip(a.content).slice(0, 80) || 'Sin contenido',
    content: a.content,
    updatedAt: a.updated_at,
    rawArticle: a,
  };
}

function documentToListItem(d: KBDocumentApiItem): KnowledgeListItem {
  return {
    id: d.id,
    kind: 'archivo',
    title: d.filename,
    preview: d.extracted_text?.trim().slice(0, 140) || `${d.processing_status} · ${d.mime_type || ''}`,
    content: d.extracted_text || '',
    processingStatus: d.processing_status,
    updatedAt: d.updated_at,
    rawDocument: d,
  };
}

function buildPayload(
  title: string,
  content: string,
  category?: string,
  purpose?: KBArticlePurpose,
  tags?: string[],
): KBArticlePayload {
  const c = content.trim();
  const t = title.trim() || preview(c).slice(0, 60) || 'Sin titulo';
  return { title: t, content: c, category: category || 'General', purpose: purpose || 'faq', tags: tags || [], status: 'published' };
}

// ── category config ───────────────────────────────────────────────────────────

type CategoryFilter = 'all' | 'faq' | 'business' | 'sales_scripts' | 'policy' | 'docs';

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all',           label: 'Todos' },
  { id: 'faq',           label: 'Preguntas' },
  { id: 'business',      label: 'Pitch' },
  { id: 'sales_scripts', label: 'Objeciones' },
  { id: 'policy',        label: 'Políticas' },
  { id: 'docs',          label: 'Documentos' },
];

function categoryOfItem(item: KnowledgeListItem): CategoryFilter {
  if (item.kind === 'archivo') return 'docs';
  const purpose = (item.rawArticle?.purpose || '').toLowerCase();
  if (purpose === 'business') return 'business';
  if (purpose === 'sales_scripts') return 'sales_scripts';
  if (purpose === 'policy') return 'policy';
  return 'faq';
}

// ── stat chip ─────────────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center rounded-2xl px-4 py-2.5 ${accent ? 'bg-brand-50 border border-brand-200/60' : 'bg-white/60 border border-[rgba(17,17,16,0.07)]'}`}>
      <span className={`text-[18px] font-bold leading-none ${accent ? 'text-brand-600' : 'text-ink-900'}`}>{value}</span>
      <span className="mt-1 text-[10px] font-medium text-ink-400 text-center">{label}</span>
    </div>
  );
}

// ── candidate row ─────────────────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = {
  faq: 'FAQ',
  conversation_example: 'Ejemplo',
  winning_reply: 'Respuesta',
  objection: 'Objeción',
};

const KIND_COLORS: Record<string, string> = {
  faq: 'bg-sky-50 text-sky-700 border-sky-200/60',
  conversation_example: 'bg-purple-50 text-purple-700 border-purple-200/60',
  winning_reply: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  objection: 'bg-amber-50 text-amber-700 border-amber-200/60',
};

function CandidateRow({
  item,
  selected,
  acting,
  onToggle,
  onApprove,
  onReject,
  onShowConflicts,
}: {
  item: LearningCandidateApiItem;
  selected: boolean;
  acting: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onShowConflicts: () => void;
}) {
  const meta = (item.metadata as Record<string, unknown>) || {};
  const isLlm = meta?.source === 'llm';
  const tags: string[] = (meta?.tags as string[]) || [];
  const sourceLabel = String(meta?.source_label || '').trim();
  const resolutionLabel = String(meta?.resolution_label || '').trim();
  const stage = String(meta?.stage || '').trim();
  const channel = String(meta?.channel || '').trim();
  const commercialOutcome = String(meta?.commercial_outcome || '').trim();
  const conflicts = Array.isArray(meta?.conflicts) ? (meta.conflicts as Array<Record<string, unknown>>) : [];
  const conflictCount = conflicts.length;
  const pct = Math.round((item.confidence || 0) * 100);
  const kindColor = KIND_COLORS[item.kind] || 'bg-ink-50 text-ink-600 border-ink-200/60';

  return (
    <div className={`rounded-2xl border p-3.5 transition-all ${selected ? 'border-brand-300/70 bg-brand-50/50' : 'border-[rgba(17,17,16,0.08)] bg-white/70 hover:bg-white/90'}`}>
      {/* Top row */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-brand-500"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${kindColor}`}>
              {KIND_LABELS[item.kind] || item.kind}
            </span>
            {isLlm && (
              <span className="inline-flex items-center gap-1 rounded-full border border-brand-200/60 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                <Bot size={9} />
                LLM
              </span>
            )}
            {sourceLabel && (
              <span className="inline-flex items-center rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                {sourceLabel}
              </span>
            )}
            {resolutionLabel && (
              <span className="inline-flex items-center rounded-full border border-[rgba(17,17,16,0.10)] bg-[rgba(17,17,16,0.04)] px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                {resolutionLabel}
              </span>
            )}
            <span className="text-[10px] font-semibold text-ink-400">{pct}% confianza</span>
            {item.evidence_count > 1 && (
              <span className="text-[10px] text-ink-400">· {item.evidence_count}× detectado</span>
            )}
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-ink-100/60 px-2 py-0.5 text-[10px] text-ink-500">{t}</span>
            ))}
            {conflictCount > 0 && (
              <button
                onClick={onShowConflicts}
                className="rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Conflictos: {conflictCount}
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[13px] font-semibold leading-snug text-ink-900">{item.title}</p>
          {(stage || channel || commercialOutcome) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {stage && (
                <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-2 py-0.5 text-[10px] font-medium text-ink-600">
                  Etapa: {stage}
                </span>
              )}
              {channel && (
                <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-2 py-0.5 text-[10px] font-medium text-ink-600">
                  Canal: {channel}
                </span>
              )}
              {commercialOutcome && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  Outcome: {commercialOutcome}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            onClick={onApprove}
            disabled={acting}
            className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-40"
          >
            Aprobar
          </button>
          <button
            onClick={onReject}
            disabled={acting}
            className="rounded-full border border-[rgba(17,17,16,0.12)] bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:bg-white disabled:opacity-40"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Q&A preview */}
      {(item.source_question || item.proposed_answer) && (
        <div className="mt-2.5 grid grid-cols-2 gap-2 pl-7">
          {item.source_question && (
            <div className="rounded-xl bg-[rgba(17,17,16,0.04)] px-3 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">Detectado</p>
              <p className="mt-0.5 text-[11px] text-ink-700 line-clamp-2">{item.source_question}</p>
            </div>
          )}
          {item.proposed_answer && (
            <div className="rounded-xl bg-[rgba(17,17,16,0.04)] px-3 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">Respuesta propuesta</p>
              <p className="mt-0.5 text-[11px] text-ink-700 line-clamp-2">{item.proposed_answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export function KnowledgeBasePage() {
  const { showError, showInfo, showSuccess } = useNotification();

  // articles + documents
  const [articles, setArticles] = useState<KBArticleApiItem[]>([]);
  const [documents, setDocuments] = useState<KBDocumentApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftPurpose, setDraftPurpose] = useState<KBArticlePurpose>('faq');
  const [mobilePane, setMobilePane] = useState<'list' | 'editor'>('list');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // review queue
  const [candidates, setCandidates] = useState<LearningCandidateApiItem[]>([]);
  const [queueExpanded, setQueueExpanded] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [conflictCandidate, setConflictCandidate] = useState<LearningCandidateApiItem | null>(null);
  const conflictMeta = (conflictCandidate?.metadata as Record<string, unknown> | undefined) || {};
  const conflictList = Array.isArray(conflictMeta.conflicts)
    ? (conflictMeta.conflicts as Array<Record<string, unknown>>)
    : [];

  // ── data loading ────────────────────────────────────────────────────────────

  async function loadKnowledge(opts?: { silent?: boolean }) {
    if (opts?.silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [a, d] = await Promise.all([api.getKnowledgeBaseArticles(), api.getKnowledgeBaseDocuments()]);
      setArticles(a);
      setDocuments(d);
    } catch (e) {
      showError('KB', e instanceof Error ? e.message : 'No se pudo cargar.');
    } finally {
      if (opts?.silent) setRefreshing(false);
      else setLoading(false);
    }
  }

  async function loadQueue() {
    setLoadingQueue(true);
    try {
      const items = await api.getLearningCandidates({ status: 'pending' });
      setCandidates(items);
      if (items.length > 0) setQueueExpanded(true);
    } catch {
      setCandidates([]);
    } finally {
      setLoadingQueue(false);
    }
  }

  useEffect(() => {
    void loadKnowledge();
    void loadQueue();
  }, []);

  // auto-refresh while docs are processing
  useEffect(() => {
    const hasPending = documents.some((d) => ['pending', 'processing'].includes(d.processing_status));
    if (!hasPending) return;
    const id = setInterval(() => { void loadKnowledge({ silent: true }); }, 3500);
    return () => clearInterval(id);
  }, [documents]);

  // ── derived data ─────────────────────────────────────────────────────────────

  const allItems = useMemo(
    () => [...articles.map(articleToListItem), ...documents.map(documentToListItem)]
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [articles, documents],
  );

  const filteredItems = useMemo(() => {
    let items = categoryFilter === 'all' ? allItems : allItems.filter((i) => categoryOfItem(i) === categoryFilter);
    const term = search.trim().toLowerCase();
    if (term) items = items.filter((i) => [i.title, i.preview, i.content || ''].join(' ').toLowerCase().includes(term));
    return items;
  }, [allItems, categoryFilter, search]);

  const selectedItem = useMemo(
    () => filteredItems.find((i) => i.id === selectedId) || allItems.find((i) => i.id === selectedId) || null,
    [filteredItems, allItems, selectedId],
  );

  useEffect(() => {
    if (!filteredItems.some((i) => i.id === selectedId)) {
      setSelectedId(filteredItems[0]?.id || null);
    }
  }, [filteredItems]);

  useEffect(() => {
    if (!selectedItem || selectedItem.kind === 'archivo') { setDraftTitle(''); setDraftContent(''); setDraftPurpose('faq'); return; }
    setDraftTitle(selectedItem.title);
    setDraftContent(selectedItem.content || '');
    setDraftPurpose((selectedItem.rawArticle?.purpose as KBArticlePurpose) || 'faq');
  }, [selectedItem]);

  // stats
  const aiCount = articles.filter((a) => ['ai_aprendido', 'aprendizaje automatico', 'Resumen IA', 'FAQ extraído por IA'].includes(a.category || '')).length;
  const publishedCount = articles.filter((a) => a.status === 'published').length + documents.filter((d) => d.processing_status === 'ready').length;
  const categoryCounts: Record<CategoryFilter, number> = {
    all:           allItems.length,
    faq:           allItems.filter((i) => categoryOfItem(i) === 'faq').length,
    business:      allItems.filter((i) => categoryOfItem(i) === 'business').length,
    sales_scripts: allItems.filter((i) => categoryOfItem(i) === 'sales_scripts').length,
    policy:        allItems.filter((i) => categoryOfItem(i) === 'policy').length,
    docs:          allItems.filter((i) => categoryOfItem(i) === 'docs').length,
  };

  // ── article actions ──────────────────────────────────────────────────────────

  async function handleCreateText(payload: { title: string; content: string; category?: string; purpose?: KBArticlePurpose; tags?: string[] }) {
    if (!payload.content.trim()) { showInfo('Agregar', 'El contenido no puede estar vacío.'); return; }
    setSaving(true);
    try {
      const created = await api.createKnowledgeBaseArticle(
        buildPayload(payload.title, payload.content, payload.category, payload.purpose, payload.tags),
      );
      setArticles((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setCategoryFilter('all');
      showSuccess('Guardado', 'La fuente ya está activa.');
    } catch (e) { showError('KB', e instanceof Error ? e.message : 'No se pudo guardar.'); throw e; }
    finally { setSaving(false); }
  }

  async function handleCreateLink(payload: { url: string }) {
    const url = payload.url.trim();
    if (!url) { showInfo('Link', 'Pega primero un link válido.'); return; }
    if (!/^https?:\/\//i.test(url)) { showInfo('Link', 'El link debe empezar con http:// o https://'); return; }
    await handleCreateText({ title: url.replace(/^https?:\/\//, ''), content: url });
  }

  async function handleUploadFile(file: File) {
    setSaving(true);
    try {
      const uploaded = await api.uploadKnowledgeBaseDocument(null, file);
      setDocuments((prev) => [uploaded, ...prev]);
      setSelectedId(uploaded.id);
      setCategoryFilter('docs');
      showSuccess('Subido', 'Procesando documento...');
    } catch (e) { showError('KB', e instanceof Error ? e.message : 'No se pudo subir.'); throw e; }
    finally { setSaving(false); }
  }

  async function handleSaveSelected() {
    if (!selectedItem?.rawArticle) return;
    if (!draftContent.trim()) { showInfo('Editar', 'El contenido no puede estar vacío.'); return; }
    setSaving(true);
    try {
      const updated = await api.updateKnowledgeBaseArticle(
        selectedItem.rawArticle.id,
        buildPayload(draftTitle, draftContent, selectedItem.rawArticle.category, draftPurpose),
      );
      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showSuccess('Actualizado', 'Los cambios quedaron guardados.');
    } catch (e) { showError('KB', e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setSaving(false); }
  }

  async function handleDeleteSelected() {
    if (!selectedItem) return;
    setConfirmDelete(false);
    setSaving(true);
    try {
      if (selectedItem.rawArticle) {
        await api.deleteKnowledgeBaseArticle(selectedItem.rawArticle.id);
        setArticles((prev) => prev.filter((a) => a.id !== selectedItem.rawArticle?.id));
      } else if (selectedItem.rawDocument) {
        await api.deleteKnowledgeBaseDocument(selectedItem.rawDocument.id);
        setDocuments((prev) => prev.filter((d) => d.id !== selectedItem.rawDocument?.id));
      }
      setSelectedId(allItems.filter((i) => i.id !== selectedItem.id)[0]?.id || null);
      showSuccess('Eliminado', 'La fuente fue eliminada.');
    } catch (e) { showError('KB', e instanceof Error ? e.message : 'No se pudo eliminar.'); }
    finally { setSaving(false); }
  }

  // ── review queue actions ─────────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true);
    try {
      await api.generateLearningCandidates(180);
      await loadQueue();
      showSuccess('Aprendizaje', 'Nuevos candidatos generados.');
    } catch (e) { showError('Learning', e instanceof Error ? e.message : 'Error al generar.'); }
    finally { setGenerating(false); }
  }

  async function handleApprove(id: string) {
    setActingId(id);
    try {
      await api.approveLearningCandidate(id);
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      setSelectedCandidateIds((prev) => prev.filter((x) => x !== id));
      showSuccess('Aprobado', 'El aprendizaje se publicó en la KB.');
      void loadKnowledge({ silent: true });
    } catch (e) { showError('Aprobar', e instanceof Error ? e.message : 'No se pudo aprobar.'); }
    finally { setActingId(null); }
  }

  async function handleReject(id: string) {
    setActingId(id);
    try {
      await api.rejectLearningCandidate(id);
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      setSelectedCandidateIds((prev) => prev.filter((x) => x !== id));
    } catch (e) { showError('Descartar', e instanceof Error ? e.message : 'No se pudo descartar.'); }
    finally { setActingId(null); }
  }

  async function handleBatch(action: 'approve' | 'reject') {
    if (!selectedCandidateIds.length) return;
    setActingId('batch');
    try {
      await api.batchLearningCandidates(selectedCandidateIds, action);
      setCandidates((prev) => prev.filter((c) => !selectedCandidateIds.includes(c.id)));
      setSelectedCandidateIds([]);
      if (action === 'approve') {
        showSuccess('Lote aprobado', `${selectedCandidateIds.length} entradas publicadas en KB.`);
        void loadKnowledge({ silent: true });
      }
    } catch (e) { showError('Lote', e instanceof Error ? e.message : 'Error en la operación.'); }
    finally { setActingId(null); }
  }

  function toggleCandidate(id: string) {
    setSelectedCandidateIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="page-shell overflow-hidden bg-[#faf8f3]">
      <div className="page-stack min-h-0 h-full">

        {/* Header */}
        <PageHeader
          eyebrow="Knowledge Base"
          title="Base de conocimiento"
          description="Todo lo que el agente sabe — curado por ti, ampliado por IA."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => { void loadKnowledge(); void loadQueue(); }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 text-ink-500 transition hover:bg-white"
              >
                <RefreshCw size={13} className={loading || refreshing ? 'animate-spin' : ''} />
              </button>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus size={14} />
                Agregar
              </Button>
            </div>
          }
        />

        {/* Stats bar */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Stat label="Publicados" value={publishedCount} />
          <Stat label="IA aprendido" value={aiCount} accent={aiCount > 0} />
          <Stat label="En revisión" value={candidates.length} accent={candidates.length > 0} />
          <Stat label="Documentos" value={documents.length} />
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.id)}
              className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
                categoryFilter === f.id
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-[rgba(17,17,16,0.10)] bg-white/70 text-ink-500 hover:border-[rgba(17,17,16,0.18)] hover:text-ink-800'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-[10px] ${categoryFilter === f.id ? 'text-white/70' : 'text-ink-400'}`}>
                {categoryCounts[f.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Mobile pane toggle */}
        <div className="flex gap-1 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-1 xl:hidden">
          {(['list', 'editor'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setMobilePane(p)}
              className={`flex-1 rounded-xl py-2 text-[12px] font-semibold transition ${mobilePane === p ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-[rgba(17,17,16,0.04)]'}`}
            >
              {p === 'list' ? 'Listado' : 'Detalle'}
            </button>
          ))}
        </div>

        {/* Main split pane */}
        <div className="min-h-0 flex-1 grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
          {/* List */}
          <div className={`${mobilePane === 'list' ? 'block' : 'hidden'} xl:block min-h-0`}>
            <Card className="h-full overflow-hidden">
              <KnowledgeList
                items={filteredItems}
                selectedId={selectedId}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                onSelect={(id) => { setSelectedId(id); setMobilePane('editor'); }}
              />
            </Card>
          </div>

          {/* Editor */}
          <div className={`${mobilePane === 'editor' ? 'flex' : 'hidden'} xl:flex min-h-0 flex-col gap-3 overflow-hidden`}>
            {mobilePane === 'editor' && (
              <button
                onClick={() => setMobilePane('list')}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 hover:text-ink-800 xl:hidden"
              >
                <ChevronLeft size={15} /> Volver
              </button>
            )}

            {!loading && allItems.length === 0 ? (
              <KnowledgeEmptyState onAdd={() => setModalOpen(true)} />
            ) : (
              <div className="min-h-0 flex-1">
                <KnowledgeEditor
                  item={selectedItem}
                  draftTitle={draftTitle}
                  draftContent={draftContent}
                  draftPurpose={draftPurpose}
                  saving={saving}
                  onTitleChange={setDraftTitle}
                  onContentChange={setDraftContent}
                  onPurposeChange={setDraftPurpose}
                  onSave={() => void handleSaveSelected()}
                  onDelete={() => setConfirmDelete(true)}
                  onItemAdded={() => {
                    void loadKnowledge({ silent: true });
                  }}
                />
              </div>
            )}

            {saving && (
              <div className="flex items-center gap-2 text-[12px] text-ink-400">
                <Loader2 size={13} className="animate-spin" /> Guardando...
              </div>
            )}
          </div>
        </div>

        {/* Review queue — collapsible bottom panel */}
        <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/80 shadow-card overflow-hidden">
          {/* Queue header */}
          <button
            onClick={() => setQueueExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-[rgba(17,17,16,0.02)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50">
                <Brain size={14} className="text-brand-600" />
              </div>
              <span className="text-[13px] font-semibold text-ink-900">Cola de revisión</span>
              {candidates.length > 0 && (
                <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {candidates.length}
                </span>
              )}
              {loadingQueue && <Loader2 size={12} className="animate-spin text-ink-400" />}
            </div>
            <div className="flex items-center gap-2">
              {queueExpanded && (
                <button
                  onClick={(e) => { e.stopPropagation(); void handleGenerate(); }}
                  disabled={generating}
                  className="flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {generating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  Aprender ahora
                </button>
              )}
              {queueExpanded ? <ChevronUp size={15} className="text-ink-400" /> : <ChevronDown size={15} className="text-ink-400" />}
            </div>
          </button>

          {/* Queue body */}
          {queueExpanded && (
            <div className="border-t border-[rgba(17,17,16,0.07)] px-4 pb-4 pt-3">
              {candidates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <FileText size={28} className="text-ink-300" />
                  <p className="text-[13px] font-semibold text-ink-500">No hay candidatos pendientes</p>
                  <p className="text-[12px] text-ink-400">Pulsa "Aprender ahora" para generar aprendizajes desde conversaciones recientes.</p>
                </div>
              ) : (
                <>
                  {/* Batch bar */}
                  {selectedCandidateIds.length > 0 && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-brand-200/60 bg-brand-50/60 px-3 py-2">
                      <span className="flex-1 text-[12px] font-semibold text-brand-700">
                        {selectedCandidateIds.length} seleccionados
                      </span>
                      <button
                        onClick={() => void handleBatch('approve')}
                        disabled={actingId === 'batch'}
                        className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-40"
                      >
                        Aprobar lote
                      </button>
                      <button
                        onClick={() => void handleBatch('reject')}
                        disabled={actingId === 'batch'}
                        className="rounded-full border border-[rgba(17,17,16,0.12)] bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:bg-ink-50 disabled:opacity-40"
                      >
                        Descartar lote
                      </button>
                      <button
                        onClick={() => setSelectedCandidateIds([])}
                        className="text-[11px] text-ink-400 hover:text-ink-700"
                      >
                        Limpiar
                      </button>
                    </div>
                  )}

                  {/* Select all */}
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCandidateIds.length === candidates.length}
                      onChange={() =>
                        setSelectedCandidateIds(
                          selectedCandidateIds.length === candidates.length ? [] : candidates.map((c) => c.id),
                        )
                      }
                      className="h-4 w-4 cursor-pointer accent-brand-500"
                    />
                    <span className="text-[11px] text-ink-400">Seleccionar todo</span>
                  </div>

                  {/* Candidate list */}
                  <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-1">
                    {candidates.map((c) => (
                      <CandidateRow
                        key={c.id}
                        item={c}
                        selected={selectedCandidateIds.includes(c.id)}
                        acting={actingId === c.id || actingId === 'batch'}
                        onToggle={() => toggleCandidate(c.id)}
                        onApprove={() => void handleApprove(c.id)}
                        onReject={() => void handleReject(c.id)}
                        onShowConflicts={() => setConflictCandidate(c)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {conflictCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-[rgba(17,17,16,0.10)] bg-white p-6 shadow-xl">
              <p className="text-[15px] font-bold text-ink-900">Conflictos detectados</p>
              <p className="mt-1.5 text-[13px] text-ink-500">
                {conflictCandidate.title}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                {String(conflictMeta.stage || '').trim() && (
                  <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-2.5 py-1 font-medium text-ink-600">
                    Etapa: {String(conflictMeta.stage)}
                  </span>
                )}
                {String(conflictMeta.channel || '').trim() && (
                  <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-2.5 py-1 font-medium text-ink-600">
                    Canal: {String(conflictMeta.channel)}
                  </span>
                )}
                {String(conflictMeta.commercial_outcome || '').trim() && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    Outcome: {String(conflictMeta.commercial_outcome)}
                  </span>
                )}
              </div>

              <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {conflictList.length === 0 ? (
                  <div className="rounded-xl bg-[rgba(17,17,16,0.04)] px-3 py-2 text-[12px] text-ink-500">
                    No hay detalle de conflictos en metadata para este candidato.
                  </div>
                ) : (
                  conflictList.map((conflict: Record<string, unknown>, idx: number) => (
                    <div key={`${String(conflict.article_id || idx)}`} className="rounded-xl border border-amber-200/60 bg-amber-50/40 px-3 py-2">
                      <p className="text-[12px] font-semibold text-ink-800">{String(conflict.article_title || 'Articulo existente')}</p>
                      <p className="mt-1 text-[11px] text-amber-700">
                        Similitud: {toNumber(conflict.similarity, 0).toFixed(2)}
                      </p>
                      {String(conflict.content_snippet || '').trim() && (
                        <p className="mt-1 text-[11px] text-ink-500">{String(conflict.content_snippet)}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    void handleApprove(conflictCandidate.id);
                    setConflictCandidate(null);
                  }}
                  className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-600"
                >
                  Aprobar como nuevo
                </button>
                <button
                  onClick={() => setConflictCandidate(null)}
                  className="rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.04)]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <AddKnowledgeModal
          open={modalOpen}
          loading={saving}
          onClose={() => setModalOpen(false)}
          onCreateText={handleCreateText}
          onCreateLink={handleCreateLink}
          onUploadFile={handleUploadFile}
        />

        {/* Delete confirmation */}
        {confirmDelete && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-[rgba(17,17,16,0.10)] bg-white p-6 shadow-xl">
              <p className="text-[15px] font-bold text-ink-900">¿Eliminar esta fuente?</p>
              <p className="mt-1.5 text-[13px] text-ink-400">
                <span className="font-semibold text-ink-700">"{selectedItem.title}"</span> dejará de estar disponible para el agente de inmediato.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => void handleDeleteSelected()}
                  className="flex-1 rounded-2xl bg-red-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-600"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.04)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
