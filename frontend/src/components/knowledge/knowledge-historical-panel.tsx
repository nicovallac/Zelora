import { useEffect, useMemo, useState } from 'react';
import { ArrowUpFromLine, Brain, DatabaseZap, FileUp, Loader2, RefreshCw, Sparkles } from 'lucide-react';

import { api } from '../../services/api';
import type { HistoricalImportApiItem, HistoricalImportRunResult } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { Button, Card } from '../ui/primitives';

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-[rgba(17,17,16,0.08)] bg-white/70 px-3 py-2 text-[11px] shadow-card">
      <span className="font-semibold text-ink-400">{label}</span>
      <span className="ml-2 font-semibold text-ink-800">{value}</span>
    </div>
  );
}

export function KnowledgeHistoricalPanel() {
  const { showError, showInfo, showSuccess } = useNotification();
  const [imports, setImports] = useState<HistoricalImportApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [importingKb, setImportingKb] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [lastRun, setLastRun] = useState<HistoricalImportRunResult | null>(null);

  async function loadImports() {
    setLoading(true);
    try {
      const data = await api.getHistoricalImports();
      setImports(data);
    } catch (error) {
      showError('Historico', error instanceof Error ? error.message : 'No se pudo cargar el historico.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadImports();
  }, []);

  const summary = useMemo(() => {
    const totalSessions = imports.reduce((acc, item) => acc + item.report.sessions, 0);
    const totalRouter = imports.reduce((acc, item) => acc + item.report.router_examples, 0);
    const totalEvals = imports.reduce((acc, item) => acc + item.report.eval_examples, 0);
    return { totalSessions, totalRouter, totalEvals };
  }, [imports]);

  async function handleUpload() {
    if (!selectedFile) {
      showInfo('Historico', 'Selecciona primero un archivo .jsonl.');
      return;
    }
    setUploading(true);
    try {
      const result = await api.runHistoricalImport(selectedFile, sourceName);
      setLastRun(result);
      setSelectedFile(null);
      setSourceName('');
      await loadImports();
      showSuccess('Historico importado', 'Se generaron artefactos para router, KB y evals.');
    } catch (error) {
      showError('Historico', error instanceof Error ? error.message : 'No se pudo importar el archivo.');
    } finally {
      setUploading(false);
    }
  }

  async function handleImportKb(source: string) {
    setImportingKb(source);
    try {
      const result = await api.importHistoricalKbSeed(source);
      showSuccess('KB actualizada', `Se crearon ${result.created} articulos y se actualizaron ${result.updated}.`);
    } catch (error) {
      showError('Knowledge Base', error instanceof Error ? error.message : 'No se pudo importar el KB seed.');
    } finally {
      setImportingKb(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <StatChip label="Imports" value={imports.length} />
        <StatChip label="Sesiones" value={summary.totalSessions} />
        <StatChip label="Router" value={summary.totalRouter} />
        <StatChip label="Evals" value={summary.totalEvals} />
        <Button variant="secondary" size="sm" onClick={() => void loadImports()}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-3">
          <Card className="p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100/80 text-brand-600">
                <FileUp size={15} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-ink-900">Nuevo import</p>
                <p className="text-[12px] text-ink-400">Acepta `chats.jsonl` y genera salidas reutilizables por organizacion.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Nombre de fuente</label>
                <input
                  value={sourceName}
                  onChange={(event) => setSourceName(event.target.value)}
                  placeholder="comfaguajira_ws"
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Archivo</label>
                <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-[rgba(17,17,16,0.14)] bg-[rgba(17,17,16,0.025)] px-3 py-3 text-[13px] text-ink-600">
                  <ArrowUpFromLine size={14} />
                  <span className="truncate">{selectedFile?.name || 'Seleccionar chats.jsonl'}</span>
                  <input
                    type="file"
                    accept=".jsonl"
                    className="hidden"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <Button className="w-full" onClick={() => void handleUpload()} disabled={uploading}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <DatabaseZap size={14} />}
                {uploading ? 'Importando...' : 'Lanzar import'}
              </Button>
            </div>
          </Card>

          {lastRun ? (
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-brand-500" />
                <p className="text-[13px] font-bold text-ink-900">Ultimo resultado</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatChip label="Sesiones" value={lastRun.report.sessions} />
                <StatChip label="Router" value={lastRun.report.router_examples} />
                <StatChip label="Evals" value={lastRun.report.eval_examples} />
              </div>
              <p className="mt-3 break-all text-[12px] text-ink-400">{lastRun.target_dir}</p>
            </Card>
          ) : null}
        </div>

        <div>
          <Card className="flex flex-col">
            <div className="border-b border-[rgba(17,17,16,0.07)] px-4 py-3">
              <p className="text-[13px] font-bold text-ink-900">Imports disponibles</p>
            </div>
            <div className="p-3">
              {loading ? (
                <div className="flex min-h-40 items-center justify-center text-[13px] text-ink-400">
                  <Loader2 size={15} className="mr-2 animate-spin" />
                  Cargando imports...
                </div>
              ) : imports.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center text-center text-[13px] text-ink-400">
                  Todavia no hay imports cargados para esta organizacion.
                </div>
              ) : (
                <div className="space-y-3">
                  {imports.map((item) => (
                    <div key={item.source_name} className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-bold text-ink-900">{item.source_name}</p>
                          <p className="mt-1 break-all text-[12px] text-ink-400">{item.target_dir}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void handleImportKb(item.source_name)}
                          disabled={!item.has_kb_seed || importingKb === item.source_name}
                        >
                          {importingKb === item.source_name ? <Loader2 size={13} className="animate-spin" /> : <Brain size={13} />}
                          Importar a KB
                        </Button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatChip label="Sesiones" value={item.report.sessions} />
                        <StatChip label="Router" value={item.report.router_examples} />
                        <StatChip label="Evals" value={item.report.eval_examples} />
                      </div>

                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <div className="rounded-2xl bg-[rgba(17,17,16,0.025)] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Top temas</p>
                          <div className="mt-2 space-y-1">
                            {item.report.topics.slice(0, 3).map(([topic, count]) => (
                              <p key={topic} className="text-[12px] text-ink-600">{topic} · {count}</p>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[rgba(17,17,16,0.025)] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Rutas</p>
                          <div className="mt-2 space-y-1">
                            {item.report.route_hints.slice(0, 3).map(([route, count]) => (
                              <p key={route} className="text-[12px] text-ink-600">{route} · {count}</p>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[rgba(17,17,16,0.025)] p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Estados</p>
                          <div className="mt-2 space-y-1">
                            {item.report.stages.slice(0, 3).map(([stage, count]) => (
                              <p key={stage} className="text-[12px] text-ink-600">{stage} · {count}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
