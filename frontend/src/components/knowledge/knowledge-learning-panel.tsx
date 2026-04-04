import { useEffect, useMemo, useState } from 'react';
import { Brain, Check, Loader2, RefreshCw, Wand2, X } from 'lucide-react';

import { api } from '../../services/api';
import type { LearningCandidateApiItem } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { Button, Card } from '../ui/primitives';
import { KnowledgeHistoricalPanel } from './knowledge-historical-panel';

const KIND_LABELS: Record<LearningCandidateApiItem['kind'], string> = {
  faq: 'FAQ',
  winning_reply: 'Respuesta',
  objection: 'Objecion',
  estilo_comunicacion: 'Estilo',
};

const KIND_COLORS: Record<LearningCandidateApiItem['kind'], string> = {
  faq: 'bg-[rgba(17,17,16,0.06)] text-ink-700',
  winning_reply: 'bg-emerald-100 text-emerald-700',
  objection: 'bg-amber-100 text-amber-700',
  estilo_comunicacion: 'bg-purple-100 text-purple-700',
};

export function KnowledgeLearningPanel() {
  const { showError, showSuccess } = useNotification();
  const [mode, setMode] = useState<'live' | 'imported'>('live');
  const [items, setItems] = useState<LearningCandidateApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function loadItems() {
    setLoading(true);
    try {
      const result = await api.getLearningCandidates({ status: 'pending' });
      setItems(result);
    } catch (error) {
      showError('Aprendizaje', error instanceof Error ? error.message : 'No se pudieron cargar los candidatos.');
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
    faq: items.filter((item) => item.kind === 'faq').length,
    replies: items.filter((item) => item.kind === 'winning_reply').length,
    objections: items.filter((item) => item.kind === 'objection').length,
    styles: items.filter((item) => item.kind === 'estilo_comunicacion').length,
  }), [items]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await api.generateLearningCandidates(180);
      await loadItems();
      showSuccess('Aprendizaje actualizado', `Procesadas ${result.processed_conversations} conversaciones.`);
    } catch (error) {
      showError('Aprendizaje', error instanceof Error ? error.message : 'No se pudieron generar candidatos.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove(id: string) {
    setActingId(id);
    try {
      await api.approveLearningCandidate(id);
      setItems((current) => current.filter((item) => item.id !== id));
      showSuccess('Aprobado', 'La pieza ya paso a Knowledge Base.');
    } catch (error) {
      showError('Aprendizaje', error instanceof Error ? error.message : 'No se pudo aprobar el candidato.');
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: string) {
    setActingId(id);
    try {
      await api.rejectLearningCandidate(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      showError('Aprendizaje', error instanceof Error ? error.message : 'No se pudo descartar el candidato.');
    } finally {
      setActingId(null);
    }
  }

  async function handleBatch(action: 'approve' | 'reject') {
    if (selectedIds.length === 0) return;
    setActingId('batch');
    try {
      const result = await api.batchLearningCandidates(selectedIds, action);
      setItems((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      showSuccess(action === 'approve' ? 'Lote aprobado' : 'Lote descartado', `${result.count} items procesados.`);
    } catch (error) {
      showError('Aprendizaje', error instanceof Error ? error.message : 'No se pudo ejecutar la accion en lote.');
    } finally {
      setActingId(null);
    }
  }

  const allVisibleSelected = items.length > 0 && selectedIds.length === items.length;
  const llmItems = items.filter((item) => String((item.metadata as { source?: string } | undefined)?.source || '') === 'llm').length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex gap-1 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/80 p-1">
        <button
          type="button"
          onClick={() => setMode('live')}
          className={`flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
            mode === 'live' ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-[rgba(17,17,16,0.04)] hover:text-ink-900'
          }`}
        >
          Engine automatico
        </button>
        <button
          type="button"
          onClick={() => setMode('imported')}
          className={`flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
            mode === 'imported' ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-[rgba(17,17,16,0.04)] hover:text-ink-900'
          }`}
        >
          Historico importado
        </button>
      </div>

      {mode === 'imported' ? (
        <KnowledgeHistoricalPanel />
      ) : (
        <>
          <Card className="shrink-0 p-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">
                Se activa en resuelto, escalado e inactividad
              </span>
              <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">
                {llmItems} generados por LLM
              </span>
              <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">
                Requiere aprobacion humana
              </span>
            </div>
          </Card>

          <Card className="min-h-0 flex-1 overflow-hidden p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Brain size={15} className="text-brand-500" />
                  <p className="text-[14px] font-bold text-ink-900">Bandeja del learning engine</p>
                </div>
                <p className="mt-1 text-[12px] text-ink-500">
                  Este motor analiza conversaciones terminadas y deja aqui piezas que pueden pasar a la base de conocimiento.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => void loadItems()}>
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Actualizar
                </Button>
                <Button size="sm" onClick={() => void handleGenerate()} disabled={generating}>
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  {generating ? 'Analizando...' : 'Aprender ahora'}
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">{stats.total} pendientes</span>
              <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">{stats.faq} FAQs</span>
              <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">{stats.replies} respuestas</span>
              <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 font-semibold text-ink-700">{stats.objections} objeciones</span>
              {stats.styles > 0 && (
                <span className="rounded-full bg-purple-50 px-3 py-1.5 font-semibold text-purple-700">{stats.styles} estilos</span>
              )}
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
                  <div key={item.id} className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/80 p-4">
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
                          <p className="text-[14px] font-bold text-ink-900">{item.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${KIND_COLORS[item.kind] ?? 'bg-[rgba(17,17,16,0.06)] text-ink-700'}`}>
                            {KIND_LABELS[item.kind] ?? item.kind}
                          </span>
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                          {String((item.metadata as { source?: string } | undefined)?.source || '') === 'llm' ? (
                            <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-2 py-0.5 text-[10px] font-semibold text-ink-700">
                              LLM
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[12px] text-ink-500">
                          {item.kind === 'estilo_comunicacion' ? 'Patron de estilo detectado en conversaciones' : `Evidencia: ${item.evidence_count} conversaciones`}
                        </p>
                        {item.kind === 'estilo_comunicacion' && (item.metadata as { example?: string } | undefined)?.example ? (
                          <p className="mt-1 text-[11px] italic text-purple-600">
                            Ejemplo real: &ldquo;{(item.metadata as { example: string }).example}&rdquo;
                          </p>
                        ) : null}
                        {Array.isArray((item.metadata as { tags?: string[] } | undefined)?.tags) && ((item.metadata as { tags?: string[] }).tags?.length ?? 0) > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {((item.metadata as { tags?: string[] }).tags || []).slice(0, 4).map((tag) => (
                              <span key={tag} className="rounded-full bg-[rgba(17,17,16,0.04)] px-2 py-0.5 text-[10px] font-medium text-ink-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
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

                    <div className="mt-3 grid gap-3 xl:grid-cols-2">
                      <div className="rounded-2xl bg-[rgba(17,17,16,0.025)] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Detectado</p>
                        <p className="mt-2 text-[13px] leading-6 text-ink-700">{item.source_question}</p>
                      </div>
                      <div className="rounded-2xl bg-[rgba(17,17,16,0.025)] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Propuesta</p>
                        <p className="mt-2 text-[13px] leading-6 text-ink-700">{item.proposed_answer}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
