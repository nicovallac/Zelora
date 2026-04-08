import { useEffect, useMemo, useState } from 'react';
import { Bot, Check, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';

import { api } from '../../services/api';
import type { DocumentExtractionCandidateApiItem } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { Button } from '../ui/primitives';

const KIND_LABELS: Record<DocumentExtractionCandidateApiItem['kind'], string> = {
  service: 'Servicio',
  pricing_rule: 'Precio',
  policy: 'Politica',
  flow_hint: 'Flow',
  ai_summary: 'Resumen IA',
  ai_qa: 'FAQ IA',
};

const KIND_COLORS: Record<DocumentExtractionCandidateApiItem['kind'], string> = {
  service: 'bg-sky-50 text-sky-700 border-sky-200/60',
  pricing_rule: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  policy: 'bg-amber-50 text-amber-700 border-amber-200/60',
  flow_hint: 'bg-purple-50 text-purple-700 border-purple-200/60',
  ai_summary: 'bg-brand-50 text-brand-700 border-brand-200/60',
  ai_qa: 'bg-brand-50 text-brand-700 border-brand-200/60',
};

function isAiKind(kind: DocumentExtractionCandidateApiItem['kind']) {
  return kind === 'ai_summary' || kind === 'ai_qa';
}

export function KnowledgeExtractionPanel() {
  const { showError, showSuccess } = useNotification();
  const [items, setItems] = useState<DocumentExtractionCandidateApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function loadItems() {
    setLoading(true);
    try {
      const result = await api.getDocumentExtractionCandidates({ status: 'pending' });
      setItems(result);
    } catch (error) {
      showError('Documentos', error instanceof Error ? error.message : 'No se pudieron cargar los candidatos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => items.some((item) => item.id === id)));
  }, [items]);

  const stats = useMemo(() => ({
    total: items.length,
    ai: items.filter((item) => isAiKind(item.kind)).length,
    services: items.filter((item) => item.kind === 'service').length,
    pricing: items.filter((item) => item.kind === 'pricing_rule').length,
    policies: items.filter((item) => item.kind === 'policy').length,
    flows: items.filter((item) => item.kind === 'flow_hint').length,
  }), [items]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await api.generateDocumentExtractionCandidates();
      await loadItems();
      showSuccess('Documentos procesados', `Procesados ${result.processed_documents} documentos.`);
    } catch (error) {
      showError('Documentos', error instanceof Error ? error.message : 'No se pudo reprocesar la extraccion.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove(id: string) {
    setActingId(id);
    try {
      const result = await api.approveDocumentExtractionCandidate(id);
      setItems((current) => current.filter((item) => item.id !== id));
      showSuccess(
        'Aprobado',
        result.target === 'product' ? 'Se creo un servicio borrador.' : 'La pieza paso a Knowledge Base.',
      );
    } catch (error) {
      showError('Documentos', error instanceof Error ? error.message : 'No se pudo aprobar el candidato.');
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: string) {
    setActingId(id);
    try {
      await api.rejectDocumentExtractionCandidate(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      showError('Documentos', error instanceof Error ? error.message : 'No se pudo descartar el candidato.');
    } finally {
      setActingId(null);
    }
  }

  async function handleBatch(action: 'approve' | 'reject') {
    if (selectedIds.length === 0) return;
    setActingId('batch');
    try {
      const result = await api.batchDocumentExtractionCandidates(selectedIds, action);
      setItems((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      showSuccess(action === 'approve' ? 'Lote aprobado' : 'Lote descartado', `${result.count} items procesados.`);
    } catch (error) {
      showError('Documentos', error instanceof Error ? error.message : 'No se pudo ejecutar la accion en lote.');
    } finally {
      setActingId(null);
    }
  }

  const allVisibleSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] text-ink-500">
            Ambos análisis (IA + estructural) corren en paralelo al subir el documento. Revisa y aprueba para añadirlos a KB.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => void loadItems()}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => void handleGenerate()} disabled={generating}>
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Procesando...' : 'Procesar documentos'}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">{stats.total} pendientes</span>
        {stats.ai > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-brand-200/60 bg-brand-50 px-3 py-1.5 font-semibold text-brand-700">
            <Bot size={10} /> {stats.ai} por IA
          </span>
        )}
        <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">{stats.services} servicios</span>
        <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">{stats.pricing} precios</span>
        <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">{stats.policies} politicas</span>
        <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">{stats.flows} flows</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void handleBatch('approve')}
          disabled={selectedIds.length === 0 || actingId === 'batch'}
        >
          {actingId === 'batch' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Aprobar lote
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void handleBatch('reject')}
          disabled={selectedIds.length === 0 || actingId === 'batch'}
        >
          <X size={14} />
          Descartar lote
        </Button>
        {!loading && items.length > 0 ? (
          <label className="ml-auto inline-flex items-center gap-2 text-[12px] text-ink-500">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(event) => setSelectedIds(event.target.checked ? items.map((item) => item.id) : [])}
            />
            Seleccionar todo
          </label>
        ) : null}
      </div>

      <div className="mt-4 min-h-0 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center text-[13px] text-ink-400">
            <Loader2 size={15} className="mr-2 animate-spin" />
            Cargando candidatos...
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl bg-[rgba(17,17,16,0.03)] text-center text-[13px] text-ink-400">
            No hay candidatos pendientes ahora mismo.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 ${isAiKind(item.kind) ? 'border-brand-200/60 bg-brand-50/30' : 'border-[rgba(17,17,16,0.08)] bg-white/80'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked ? [...current, item.id] : current.filter((value) => value !== item.id),
                        )
                      }
                    />
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${KIND_COLORS[item.kind]}`}>
                      {isAiKind(item.kind) && <Bot size={9} />}
                      {KIND_LABELS[item.kind]}
                    </span>
                    <span className="rounded-full bg-[rgba(17,17,16,0.06)] px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                      {(item.confidence * 100).toFixed(0)}% confianza
                    </span>
                    <p className="text-[13px] font-semibold text-ink-900">{item.title}</p>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-500">Fuente: {item.source_document_name}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => void handleReject(item.id)} disabled={actingId === item.id}>
                    <X size={13} />
                    Descartar
                  </Button>
                  <Button size="sm" onClick={() => void handleApprove(item.id)} disabled={actingId === item.id}>
                    {actingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Aprobar
                  </Button>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-[rgba(17,17,16,0.025)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  {isAiKind(item.kind) ? 'Generado por IA' : 'Detectado estructuralmente'}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-ink-700">{item.body || 'Sin cuerpo adicional.'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
