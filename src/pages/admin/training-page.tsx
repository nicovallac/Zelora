import { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockTrainingConversations } from '../../data/mock';
import { useNotification } from '../../contexts/NotificationContext';

type TrainingTab = 'revisar' | 'aprobadas' | 'rechazadas' | 'configuracion';

const ALL_INTENTS = [
  'Subsidio familiar',
  'Certificado de afiliación',
  'PQRS',
  'Recreación y turismo',
  'Actualización de datos',
  'Afiliación',
  'Crédito social',
  'Capacitación',
  'Información general',
];

const approvedMock = [
  { id: 'ap1', preview: 'Necesito el certificado para el banco urgente', intent: 'Certificado de afiliación', confidence: 98, qaScore: 91, approvedAt: '08/03' },
  { id: 'ap2', preview: '¿Cómo hago para afiliarme como independiente?', intent: 'Afiliación', confidence: 85, qaScore: 83, approvedAt: '07/03' },
  { id: 'ap3', preview: 'Quiero inscribirme al curso de sistemas del SENA', intent: 'Capacitación', confidence: 88, qaScore: 90, approvedAt: '07/03' },
];

const rejectedMock = [
  { id: 're1', preview: 'Hola, ¿me pueden ayudar?', intent: 'Información general', confidence: 45, qaScore: 60, reason: 'QA Score insuficiente' },
  { id: 're2', preview: 'buen día', intent: 'Información general', confidence: 30, qaScore: 55, reason: 'Conversación muy corta' },
];

interface TrainingConv {
  id: string;
  preview: string;
  intent: string;
  confidence: number;
  qaScore: number;
}

export function TrainingPage() {
  const { showSuccess, showInfo } = useNotification();
  const [tab, setTab] = useState<TrainingTab>('revisar');
  const [pending, setPending] = useState<TrainingConv[]>(mockTrainingConversations);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewConv, setViewConv] = useState<TrainingConv | null>(null);
  const [approved, setApproved] = useState(approvedMock);
  const [rejected, setRejected] = useState(rejectedMock);

  // Config state
  const [autoThreshold, setAutoThreshold] = useState(85);
  const [minConversations, setMinConversations] = useState(20);
  const [retrainFreq, setRetrainFreq] = useState('weekly');
  const [activeIntents, setActiveIntents] = useState<Set<string>>(new Set(ALL_INTENTS));
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  useEffect(() => {
    if (!isTraining) return;
    setTrainingProgress(0);
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          showSuccess('Modelo reentrenado exitosamente. Precisión mejorada: 87.3% → 88.1%');
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isTraining, showSuccess]);

  function handleApprove(id: string) {
    const conv = pending.find((c) => c.id === id);
    if (conv) {
      setApproved((prev) => [{ ...conv, approvedAt: '10/03' }, ...prev]);
    }
    setPending((prev) => prev.filter((c) => c.id !== id));
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    showSuccess('Conversación aprobada para entrenamiento');
  }

  function handleReject(id: string) {
    const conv = pending.find((c) => c.id === id);
    if (conv) {
      setRejected((prev) => [{ ...conv, reason: 'Rechazada manualmente' }, ...prev]);
    }
    setPending((prev) => prev.filter((c) => c.id !== id));
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    showInfo('Conversación rechazada');
  }

  function handleBulkApprove() {
    const toApprove = pending.filter((c) => selected.has(c.id));
    setApproved((prev) => [...toApprove.map((c) => ({ ...c, approvedAt: '10/03' })), ...prev]);
    setPending((prev) => prev.filter((c) => !selected.has(c.id)));
    setSelected(new Set());
    showSuccess(`${toApprove.length} conversaciones aprobadas para entrenamiento`);
  }

  function handleBulkReject() {
    const toReject = pending.filter((c) => selected.has(c.id));
    setRejected((prev) => [...toReject.map((c) => ({ ...c, reason: 'Rechazada manualmente' })), ...prev]);
    setPending((prev) => prev.filter((c) => !selected.has(c.id)));
    setSelected(new Set());
    showInfo(`${toReject.length} conversaciones rechazadas`);
  }

  function handleRevertApproved(id: string) {
    const conv = approved.find((c) => c.id === id);
    if (conv) {
      const { approvedAt: _a, ...rest } = conv as typeof conv & { approvedAt: string };
      void _a;
      setPending((prev) => [{ ...rest }, ...prev]);
    }
    setApproved((prev) => prev.filter((c) => c.id !== id));
    showInfo('Conversación revertida a pendiente');
  }

  function handleRecoverRejected(id: string) {
    const conv = rejected.find((c) => c.id === id);
    if (conv) {
      const { reason: _r, ...rest } = conv as typeof conv & { reason: string };
      void _r;
      setPending((prev) => [{ ...rest }, ...prev]);
    }
    setRejected((prev) => prev.filter((c) => c.id !== id));
    showInfo('Conversación recuperada a pendiente');
  }

  function toggleIntent(intent: string) {
    setActiveIntents((prev) => {
      const s = new Set(prev);
      if (s.has(intent)) s.delete(intent); else s.add(intent);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((c) => c.id)));
    }
  }

  const TABS: { key: TrainingTab; label: string }[] = [
    { key: 'revisar', label: 'Por revisar' },
    { key: 'aprobadas', label: 'Aprobadas' },
    { key: 'rechazadas', label: 'Rechazadas' },
    { key: 'configuracion', label: 'Configuración' },
  ];

  function IntentBadge({ intent }: { intent: string }) {
    const colors: Record<string, string> = {
      'Subsidio familiar': 'bg-blue-100 text-blue-700',
      'Certificado de afiliación': 'bg-violet-100 text-violet-700',
      'PQRS': 'bg-red-100 text-red-700',
      'Recreación y turismo': 'bg-emerald-100 text-emerald-700',
      'Actualización de datos': 'bg-amber-100 text-amber-700',
      'Afiliación': 'bg-sky-100 text-sky-700',
      'Crédito social': 'bg-orange-100 text-orange-700',
      'Capacitación': 'bg-teal-100 text-teal-700',
      'Información general': 'bg-slate-100 text-slate-600',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors[intent] ?? 'bg-slate-100 text-slate-600'}`}>
        {intent}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
          <Brain className="text-violet-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Entrenamiento de IA</h1>
          <p className="text-sm text-slate-500">Mejora continua del clasificador de intenciones con conversaciones reales</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Pendientes de revisión', value: String(pending.length), color: 'text-amber-600' },
          { label: 'Aprobadas este mes', value: String(approved.length + 144), color: 'text-emerald-600' },
          { label: 'Rechazadas este mes', value: String(rejected.length + 10), color: 'text-red-600' },
          { label: 'Precisión actual', value: '87.3%', color: 'text-brand-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? 'bg-brand-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Por revisar */}
      {tab === 'revisar' && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Las siguientes conversaciones tienen QA Score ≥ 80 y pueden usarse para entrenar el modelo de intenciones.
          </div>

          {/* Bulk actions */}
          {pending.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selected.size === pending.length && pending.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
                Seleccionar todo
              </label>
              {selected.size > 0 && (
                <>
                  <button onClick={handleBulkApprove} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition">
                    Aprobar seleccionadas ({selected.size})
                  </button>
                  <button onClick={handleBulkReject} className="rounded-lg border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition">
                    Rechazar seleccionadas
                  </button>
                </>
              )}
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                    <th className="px-4 py-3 w-8"></th>
                    <th className="px-4 py-3">Preview conversación</th>
                    <th className="px-4 py-3">Intención</th>
                    <th className="px-4 py-3">Confianza</th>
                    <th className="px-4 py-3">QA Score</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {pending.map((conv) => (
                      <motion.tr
                        key={conv.id}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-b border-slate-50 hover:bg-slate-50 transition"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(conv.id)}
                            onChange={() => {
                              setSelected((prev) => {
                                const s = new Set(prev);
                                if (s.has(conv.id)) s.delete(conv.id); else s.add(conv.id);
                                return s;
                              });
                            }}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-900 max-w-xs truncate">{conv.preview}</p>
                        </td>
                        <td className="px-4 py-3">
                          <IntentBadge intent={conv.intent} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-brand-500" style={{ width: `${conv.confidence}%` }} />
                            </div>
                            <span className="text-xs text-slate-700 font-medium">{conv.confidence}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${conv.qaScore >= 90 ? 'bg-emerald-100 text-emerald-700' : conv.qaScore >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {conv.qaScore}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleApprove(conv.id)} title="Aprobar" className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => handleReject(conv.id)} title="Rechazar" className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                              <XCircle size={14} />
                            </button>
                            <button onClick={() => setViewConv(conv)} title="Ver" className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition">
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                        No hay conversaciones pendientes de revisión
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Aprobadas */}
      {tab === 'aprobadas' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Preview</th>
                  <th className="px-5 py-3">Intención</th>
                  <th className="px-5 py-3">Confianza</th>
                  <th className="px-5 py-3">QA</th>
                  <th className="px-5 py-3">Aprobada el</th>
                  <th className="px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((conv) => (
                  <tr key={conv.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-sm text-slate-900 max-w-xs truncate">{conv.preview}</td>
                    <td className="px-5 py-3"><IntentBadge intent={conv.intent} /></td>
                    <td className="px-5 py-3 text-sm text-slate-700">{conv.confidence}%</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{conv.qaScore}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{conv.approvedAt}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleRevertApproved(conv.id)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                        Revertir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Rechazadas */}
      {tab === 'rechazadas' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Preview</th>
                  <th className="px-5 py-3">Intención</th>
                  <th className="px-5 py-3">QA</th>
                  <th className="px-5 py-3">Motivo</th>
                  <th className="px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rejected.map((conv) => (
                  <tr key={conv.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-sm text-slate-900 max-w-xs truncate">{conv.preview}</td>
                    <td className="px-5 py-3"><IntentBadge intent={conv.intent} /></td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{conv.qaScore}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{conv.reason}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleRecoverRejected(conv.id)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                        Recuperar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Configuración */}
      {tab === 'configuracion' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <p className="font-bold text-slate-900">Configuración de auto-entrenamiento</p>

            {/* Auto-aprobación threshold */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Umbral de auto-aprobación</label>
              <input
                type="range"
                min={80}
                max={99}
                value={autoThreshold}
                onChange={(e) => setAutoThreshold(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <p className="text-xs text-slate-500">
                Conversaciones con QA ≥ <span className="font-bold text-slate-900">{autoThreshold}</span> se aprueban automáticamente
              </p>
            </div>

            {/* Mínimo conversaciones */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mínimo de conversaciones por intención antes de reentrenar</label>
              <input
                type="number"
                min={5}
                max={100}
                value={minConversations}
                onChange={(e) => setMinConversations(Number(e.target.value))}
                className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {/* Frecuencia */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Frecuencia de reentrenamiento</label>
              <select
                value={retrainFreq}
                onChange={(e) => setRetrainFreq(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="daily">Automático diario</option>
                <option value="weekly">Automático semanal</option>
                <option value="manual">Solo manual</option>
              </select>
            </div>

            {/* Intenciones activas */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Intenciones activas</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {ALL_INTENTS.map((intent) => (
                  <label key={intent} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={activeIntents.has(intent)}
                      onChange={() => toggleIntent(intent)}
                      className="rounded border-slate-300 accent-brand-600"
                    />
                    <span className="text-sm text-slate-700">{intent}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => showSuccess('Configuración guardada')}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
            >
              Guardar configuración
            </button>
          </div>

          {/* Ejecutar entrenamiento */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <p className="font-bold text-slate-900">Ejecutar entrenamiento</p>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Última ejecución</p>
                <p className="font-medium text-slate-900">Hace 3 días</p>
                <p className="text-xs text-slate-500">8 intenciones · 847 conversaciones procesadas</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Próxima ejecución automática</p>
                <p className="font-medium text-slate-900">En 4 días</p>
              </div>
            </div>

            {isTraining && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Entrenando modelo...</span>
                  <span>{trainingProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-2 rounded-full bg-brand-600"
                    initial={{ width: '0%' }}
                    animate={{ width: `${trainingProgress}%` }}
                    transition={{ ease: 'linear' }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setIsTraining(true)}
              disabled={isTraining}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTraining ? 'Entrenando...' : 'Ejecutar ahora'}
            </button>
          </div>
        </div>
      )}

      {/* View conversation modal */}
      <AnimatePresence>
        {viewConv && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">Vista de conversación</p>
                <button onClick={() => setViewConv(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Usuario</p>
                  <p className="text-sm text-slate-900">{viewConv.preview}</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-xs font-semibold text-brand-600 mb-1">Bot</p>
                  <p className="text-sm text-slate-700">Entendido. Déjame ayudarte con tu solicitud de {viewConv.intent.toLowerCase()}. ¿Puedes confirmarme más detalles?</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IntentBadge intent={viewConv.intent} />
                <span className="text-xs text-slate-500">Confianza: {viewConv.confidence}%</span>
                <span className="text-xs text-slate-500">QA: {viewConv.qaScore}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { handleApprove(viewConv.id); setViewConv(null); }} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                  Aprobar
                </button>
                <button onClick={() => { handleReject(viewConv.id); setViewConv(null); }} className="flex-1 rounded-xl border border-red-300 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition">
                  Rechazar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
