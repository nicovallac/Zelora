import { useEffect, useState } from 'react';
import {
  Send,
  Plus,
  BarChart2,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import type { CampaignApiItem, CampaignTemplateApiItem } from '../services/api';

type Tab = 'campanas' | 'plantillas';
type TemplateEstado = 'approved' | 'pending' | 'rejected';

interface Campaign {
  id: string;
  nombre: string;
  tipo: string;
  plantillaId: string;
  estado: string;
  total: number;
  enviados: number;
  leidos: number;
  respondidos: number;
  createdAt: string;
  scheduledAt: string | null;
}

interface Template {
  id: string;
  nombre: string;
  categoria: string;
  idioma: string;
  estado: string;
  contenido: string;
  variables: string[];
  createdAt: string;
}

function mapTemplateApiToLocal(template: CampaignTemplateApiItem): Template {
  const categoriaMap: Record<CampaignTemplateApiItem['tipo'], string> = {
    marketing: 'marketing',
    utility: 'utilidad',
    authentication: 'autenticacion',
  };

  return {
    id: template.id,
    nombre: template.name,
    categoria: categoriaMap[template.tipo] ?? 'utilidad',
    idioma: 'es',
    estado: template.status,
    contenido: template.content,
    variables: template.variables,
    createdAt: template.created_at,
  };
}

function mapCampaignApiToLocal(campaign: CampaignApiItem, templates: Template[]): Campaign {
  const estadoMap: Record<CampaignApiItem['status'], Campaign['estado']> = {
    draft: 'borrador',
    scheduled: 'programada',
    sending: 'enviando',
    sent: 'completada',
    failed: 'cancelada',
  };

  const template = templates.find((item) => item.id === campaign.template);

  return {
    id: campaign.id,
    nombre: campaign.name,
    tipo: template?.categoria ?? 'utilidad',
    plantillaId: campaign.template ?? '',
    estado: estadoMap[campaign.status] ?? 'borrador',
    total: campaign.total_recipients,
    enviados: campaign.delivered + campaign.read,
    leidos: campaign.read,
    respondidos: 0,
    createdAt: campaign.created_at,
    scheduledAt: campaign.scheduled_at,
  };
}

interface CampaignQuickStart {
  id: string;
  nombre: string;
  tipo: string;
  plantillaHint: string;
  segmento: string;
  objetivo: string;
}

interface AudiencePreset {
  id: 'todos' | 'trabajadores' | 'pensionados' | 'independientes' | 'manual';
  nombre: string;
  descripcion: string;
  total: number;
}

const CAMPAIGN_QUICK_STARTS: CampaignQuickStart[] = [
  {
    id: 'campana-inicial',
    nombre: 'Campana inicial',
    tipo: 'utilidad',
    plantillaHint: '',
    segmento: 'todos',
    objetivo: 'Crear tu primera campana desde una plantilla existente',
  },
  {
    id: 'aviso-general',
    nombre: 'Aviso general',
    tipo: 'utilidad',
    plantillaHint: '',
    segmento: 'todos',
    objetivo: 'Enviar una comunicacion general a un segmento definido',
  },
  {
    id: 'seguimiento-manual',
    nombre: 'Seguimiento manual',
    tipo: 'utilidad',
    plantillaHint: '',
    segmento: 'manual',
    objetivo: 'Preparar una campana puntual sin supuestos precargados',
  },
];

const AUDIENCE_PRESETS: AudiencePreset[] = [
  { id: 'todos', nombre: 'Todos los contactos', descripcion: 'Segmento completo disponible en backend', total: 0 },
  { id: 'trabajadores', nombre: 'Trabajadores', descripcion: 'Segmento por tipo de afiliado', total: 0 },
  { id: 'pensionados', nombre: 'Pensionados', descripcion: 'Segmento por tipo de afiliado', total: 0 },
  { id: 'independientes', nombre: 'Independientes', descripcion: 'Segmento por tipo de afiliado', total: 0 },
  { id: 'manual', nombre: 'Lista manual', descripcion: 'Carga puntual por CSV o seleccion manual', total: 0 },
];

function formatDate(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CampaignEstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    borrador: 'bg-[rgba(17,17,16,0.06)] text-ink-600',
    programada: 'bg-amber-100 text-amber-700',
    enviando: 'bg-blue-100 text-blue-700',
    completada: 'bg-emerald-100 text-emerald-700',
    cancelada: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[estado] ?? 'bg-[rgba(17,17,16,0.06)] text-ink-600'}`}>
      {estado}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, string> = {
    marketing: 'bg-purple-100 text-purple-700',
    utilidad: 'bg-blue-100 text-blue-700',
    autenticacion: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[tipo] ?? 'bg-[rgba(17,17,16,0.06)] text-ink-600'}`}>
      {tipo}
    </span>
  );
}

function TemplateEstadoBadge({ estado }: { estado: string }) {
  if (estado === 'approved') return (
    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
      <CheckCircle size={10} /> Aprobado
    </span>
  );
  if (estado === 'pending') return (
    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
      <Clock size={10} /> Pendiente
    </span>
  );
  return (
    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
      <XCircle size={10} /> Rechazado
    </span>
  );
}

function highlightVars(text: string) {
  const parts = text.split(/({{[^}]+}})/g);
  return parts.map((part, i) =>
    part.startsWith('{{') ? (
      <span key={i} className="rounded bg-amber-200 px-0.5 font-mono text-amber-800">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// New Campaign Modal (3 steps)
function NewCampaignModal({ templates, onClose, onCreated, initialDraft }: {
  templates: Template[];
  onClose: () => void;
  onCreated: (c: Campaign) => void;
  initialDraft?: Partial<{
    nombre: string;
    tipo: string;
    plantillaId: string;
    segmento: string;
  }>;
}) {
  const { showSuccess } = useNotification();
  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState(initialDraft?.nombre ?? '');
  const [tipo, setTipo] = useState(initialDraft?.tipo ?? 'utilidad');
  const [plantillaId, setPlantillaId] = useState(initialDraft?.plantillaId ?? templates[0]?.id ?? '');
  const [segmento, setSegmento] = useState(initialDraft?.segmento ?? 'todos');
  const [scheduleMode, setScheduleMode] = useState<'ahora' | 'programar'>('ahora');
  const [scheduledAt, setScheduledAt] = useState('');

  const selectedTemplate = templates.find((t) => t.id === plantillaId);
  const segmentoLabels: Record<string, string> = {
    todos: 'Todos los afiliados',
    trabajadores: 'Trabajadores dependientes',
    pensionados: 'Pensionados',
    independientes: 'Independientes',
    manual: 'Lista manual',
  };
  const estimatedReach: Record<string, number> = {
    todos: 48200, trabajadores: 31500, pensionados: 8400, independientes: 7200, manual: 0,
  };

  function handleCreate() {
    const newC: Campaign = {
      id: `camp-${Date.now()}`,
      nombre,
      tipo,
      plantillaId,
      estado: scheduleMode === 'ahora' ? 'enviando' : 'programada',
      total: estimatedReach[segmento] ?? 0,
      enviados: 0,
      leidos: 0,
      respondidos: 0,
      createdAt: new Date().toISOString(),
      scheduledAt: scheduleMode === 'programar' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };
    onCreated(newC);
    showSuccess('Campaña creada exitosamente');
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(17,17,16,0.45)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl rounded-2xl bg-white/70 backdrop-blur-sm shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-4 sm:px-6 py-3 flex-shrink-0">
          <div>
            <h3 className="font-bold text-ink-900">Nueva Campaña</h3>
            <p className="text-xs text-ink-400">Paso {step} de 3</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[rgba(17,17,16,0.06)] transition">
            <X size={16} className="text-ink-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition ${s <= step ? 'bg-brand-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="space-y-4 p-6">
          {step === 1 && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-600">Nombre de campaña</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Campaña Subsidio Abril 2026"
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-600">Tipo</label>
                <div className="flex gap-2">
                  {['marketing', 'utilidad', 'autenticacion'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={`flex-1 rounded-xl border-2 py-2 text-xs font-semibold capitalize transition ${
                        tipo === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[rgba(17,17,16,0.09)] text-ink-600 hover:border-[rgba(17,17,16,0.12)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-600">Plantilla</label>
                <select
                  value={plantillaId}
                  onChange={(e) => setPlantillaId(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-400"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre} ({t.estado})</option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-ink-700">
                    {highlightVars(selectedTemplate.contenido)}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-ink-600">Segmento de audiencia</label>
              {Object.entries(segmentoLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSegmento(key)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-sm transition ${
                    segmento === key ? 'border-brand-500 bg-brand-50' : 'border-[rgba(17,17,16,0.09)] hover:border-[rgba(17,17,16,0.12)]'
                  }`}
                >
                  <span className="font-medium text-ink-800">{label}</span>
                  {key !== 'manual' && (
                    <span className="text-xs text-ink-400">{estimatedReach[key]?.toLocaleString()} afiliados</span>
                  )}
                </button>
              ))}
              {segmento !== 'manual' && (
                <div className="rounded-xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] p-3 text-center text-sm font-semibold text-ink-700">
                  Alcance estimado: <span className="text-brand-600">{(estimatedReach[segmento] ?? 0).toLocaleString()} personas</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex gap-3">
                {(['ahora', 'programar'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setScheduleMode(m)}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition ${
                      scheduleMode === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[rgba(17,17,16,0.09)] text-ink-600 hover:border-[rgba(17,17,16,0.12)]'
                    }`}
                  >
                    {m === 'ahora' ? 'Enviar ahora' : 'Programar envío'}
                  </button>
                ))}
              </div>
              {scheduleMode === 'programar' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-600">Fecha y hora de envío</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-400"
                  />
                </div>
              )}
              <div className="rounded-xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] p-4 space-y-1 text-xs text-ink-600">
                <p><span className="font-semibold">Campaña:</span> {nombre || '(sin nombre)'}</p>
                <p><span className="font-semibold">Tipo:</span> {tipo}</p>
                <p><span className="font-semibold">Plantilla:</span> {selectedTemplate?.nombre}</p>
                <p><span className="font-semibold">Segmento:</span> {segmentoLabels[segmento]}</p>
                <p><span className="font-semibold">Alcance:</span> {(estimatedReach[segmento] ?? 0).toLocaleString()} afiliados</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 border-t border-[rgba(17,17,16,0.06)] px-6 py-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="rounded-xl border border-[rgba(17,17,16,0.09)] px-5 py-2 text-sm font-semibold text-ink-600 hover:bg-[rgba(17,17,16,0.025)] transition"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !nombre}
              className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-40"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition"
            >
              <Send size={14} /> Crear campaña
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// New Template Modal
function NewTemplateModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (t: Template) => void;
}) {
  const { showSuccess } = useNotification();
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('utilidad');
  const [idioma, setIdioma] = useState('es');
  const [contenido, setContenido] = useState('');
  const [varNames, setVarNames] = useState<string[]>(['']);

  const varCount = (contenido.match(/{{(\d+)}}/g) ?? []).length;
  const ensureVarNames = (n: number) => {
    setVarNames((prev) => {
      const copy = [...prev];
      while (copy.length < n) copy.push('');
      return copy.slice(0, n);
    });
  };

  function handleContenido(val: string) {
    setContenido(val);
    const matches = val.match(/{{(\d+)}}/g) ?? [];
    ensureVarNames(matches.length);
  }

  const isSnakeCase = /^[a-z][a-z0-9_]*$/.test(nombre);

  function handleSubmit() {
    const t: Template = {
      id: `t-${Date.now()}`,
      nombre,
      categoria,
      idioma,
      estado: 'pending',
      contenido,
      variables: varNames.filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    onCreated(t);
    showSuccess('Plantilla enviada a aprobación Meta');
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(17,17,16,0.45)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white/90 shadow-float backdrop-blur-sm flex flex-col max-h-[92dvh]"
      >
        <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-4 sm:px-6 py-3 flex-shrink-0">
          <h3 className="font-bold text-ink-900">Nueva Plantilla WhatsApp</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[rgba(17,17,16,0.06)] transition">
            <X size={16} className="text-ink-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto p-4 sm:p-6">
          {/* Left */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-600">Nombre (snake_case)</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="mi_plantilla_ejemplo"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${
                  nombre && !isSnakeCase ? 'border-red-300 bg-red-50' : 'border-[rgba(17,17,16,0.09)] focus:border-brand-400'
                }`}
              />
              {nombre && !isSnakeCase && (
                <p className="mt-1 text-[11px] text-red-500">Solo letras minúsculas, números y guión bajo</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2.5 text-sm outline-none focus:border-brand-400"
                >
                  <option value="marketing">Marketing</option>
                  <option value="utilidad">Utilidad</option>
                  <option value="autenticacion">Autenticación</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Idioma</label>
                <select
                  value={idioma}
                  onChange={(e) => setIdioma(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2.5 text-sm outline-none focus:border-brand-400"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-600">
                Contenido <span className="font-normal text-ink-400">(usa {'{{1}}'}, {'{{2}}'} para variables)</span>
              </label>
              <textarea
                value={contenido}
                onChange={(e) => handleContenido(e.target.value)}
                placeholder={`Hola {{1}}, tu trámite {{2}} fue registrado.`}
                rows={5}
                className="w-full resize-none rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm text-ink-700 outline-none focus:border-brand-400 placeholder:text-ink-300"
              />
            </div>
            {varCount > 0 && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Nombres de variables</label>
                <div className="space-y-2">
                  {Array.from({ length: varCount }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-12 rounded bg-amber-100 px-2 py-0.5 text-center text-xs font-mono text-amber-700">{`{{${i + 1}}}`}</span>
                      <input
                        type="text"
                        value={varNames[i] ?? ''}
                        onChange={(e) => setVarNames((prev) => { const c = [...prev]; c[i] = e.target.value; return c; })}
                        placeholder={`variable_${i + 1}`}
                        className="flex-1 rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-1.5 text-xs outline-none focus:border-brand-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Live preview */}
          <div>
            <p className="mb-3 text-xs font-semibold text-ink-600">Vista previa</p>
            <div className="rounded-2xl bg-[rgba(17,17,16,0.06)] p-4">
              <div className="rounded-2xl rounded-tl-sm bg-white/70 backdrop-blur-sm p-4 shadow-card text-sm text-ink-800 min-h-[80px]">
                {contenido ? (
                  <span>{highlightVars(contenido)}</span>
                ) : (
                  <span className="text-ink-300">El contenido aparecerá aquí...</span>
                )}
              </div>
              {contenido && (
                <div className="mt-3 space-y-1 text-[11px] text-ink-400">
                  <p>Caracteres: {contenido.length}/1024</p>
                  <p>Variables: {varCount}</p>
                </div>
              )}
            </div>
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
              Las plantillas de marketing requieren aprobación previa de Meta (1-2 días hábiles).
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[rgba(17,17,16,0.06)] px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <button onClick={onClose} className="rounded-xl border border-[rgba(17,17,16,0.09)] px-5 py-2 text-sm font-semibold text-ink-600 hover:bg-[rgba(17,17,16,0.025)] transition">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!nombre || !isSnakeCase || !contenido}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-40"
          >
            Enviar a aprobación
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CampaignsPage() {
  const { showSuccess, showInfo, showError } = useNotification();
  const [tab, setTab] = useState<Tab>('campanas');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [usingApi, setUsingApi] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null);
  const [newCampaignDraft, setNewCampaignDraft] = useState<Partial<{
    nombre: string;
    tipo: string;
    plantillaId: string;
    segmento: string;
  }> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaignModule() {
      try {
        const [templateData, campaignData] = await Promise.all([
          api.getCampaignTemplates(),
          api.getCampaigns(),
        ]);

        if (cancelled) return;

        const mappedTemplates = templateData.map(mapTemplateApiToLocal);
        setTemplates(mappedTemplates);
        setCampaigns(campaignData.map((campaign) => mapCampaignApiToLocal(campaign, mappedTemplates)));
        setUsingApi(true);
        setLoadError(null);
      } catch {
        if (!cancelled) {
          setUsingApi(false);
          setTemplates([]);
          setCampaigns([]);
          setLoadError('No se pudieron cargar campanas o plantillas desde el backend.');
        }
      }
    }

    void loadCampaignModule();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = {
    total: campaigns.length,
    programadas: campaigns.filter((c) => c.estado === 'programada').length,
    completadas: campaigns.filter((c) => c.estado === 'completada').length,
    borradores: campaigns.filter((c) => c.estado === 'borrador').length,
  };

  async function handleSendNow(id: string) {
    try {
      await api.sendCampaign(id);
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'enviando' } : c)));
      setUsingApi(true);
      showSuccess('Campana iniciada - enviando mensajes');
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar la campana';
      showError('Campanas', message);
      return;
    }
    showSuccess('Campaña iniciada — enviando mensajes');
  }

  async function handleCancel(id: string) {
    try {
      await api.updateCampaign(id, { status: 'failed' });
      setUsingApi(true);
    } catch {
      setUsingApi(false);
    }
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'cancelada' } : c)));
    showInfo('Campaña cancelada');
  }

  function handleViewMetrics(nombre: string) {
    showInfo(`Métricas de "${nombre}" — disponible en vista completa`);
  }

  function getTemplateName(id: string) {
    return templates.find((t) => t.id === id)?.nombre ?? id;
  }

  function findTemplateIdByHint(hint: string) {
    if (!hint.trim()) return templates[0]?.id ?? '';
    return templates.find((t) => t.nombre.includes(hint) || t.contenido.toLowerCase().includes(hint))?.id ?? templates[0]?.id ?? '';
  }

  function launchQuickStart(item: CampaignQuickStart) {
    setNewCampaignDraft({
      nombre: item.nombre,
      tipo: item.tipo,
      plantillaId: findTemplateIdByHint(item.plantillaHint),
      segmento: item.segmento,
    });
    setShowNewCampaign(true);
  }

  function launchWithAudience(audience: AudiencePreset) {
    setNewCampaignDraft({
      nombre: `Campana ${audience.nombre}`,
      tipo: 'utilidad',
      plantillaId: templates[0]?.id ?? '',
      segmento: audience.id,
    });
    setShowNewCampaign(true);
  }

  async function persistCampaign(campaign: Campaign) {
    try {
      const status = campaign.estado === 'programada' ? 'scheduled' : 'draft';
      const created = await api.createCampaign({
        name: campaign.nombre,
        channel: 'whatsapp',
        status,
        template: campaign.plantillaId || null,
        target_filter: {
          segment: newCampaignDraft?.segmento ?? 'todos',
          tipo: campaign.tipo,
        },
        scheduled_at: campaign.scheduledAt,
        total_recipients: campaign.total,
      });

      setCampaigns((prev) => [mapCampaignApiToLocal(created, templates), ...prev.filter((item) => item.id !== campaign.id)]);
      setUsingApi(true);
      showSuccess('Campana creada');
      return;
    } catch {
      setUsingApi(false);
    }
    showError('Campanas', 'No se pudo crear la campana en el backend.');
  }

  async function persistTemplate(template: Template) {
    const tipoMap: Record<string, 'marketing' | 'utility' | 'authentication'> = {
      marketing: 'marketing',
      utilidad: 'utility',
      autenticacion: 'authentication',
    };

    try {
      const created = await api.createCampaignTemplate({
        name: template.nombre,
        tipo: tipoMap[template.categoria] ?? 'utility',
        content: template.contenido,
        variables: template.variables,
        channel: 'whatsapp',
        status: 'draft',
      });

      setTemplates((prev) => [mapTemplateApiToLocal(created), ...prev.filter((item) => item.id !== template.id)]);
      setUsingApi(true);
      showSuccess('Plantilla creada');
      return;
    } catch {
      setUsingApi(false);
    }
    showError('Campanas', 'No se pudo crear la plantilla en el backend.');
  }

  return (
    <div className="page-shell">
      <div className="page-stack">
      <div className="page-header-card">
        <h1 className="page-title">Campanas</h1>
        <p className="page-description">
          Crea plantillas, prepara audiencias y ejecuta campanas reales desde el backend sin datos precargados.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-400">
          Fuente activa: {usingApi ? 'API /api/campaigns/' : 'Sin datos cargados'}
        </p>
        {loadError && <p className="text-xs font-semibold text-red-600">{loadError}</p>}
      </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Campañas WhatsApp</h1>
          <p className="text-sm text-ink-400">Gestión de campañas y plantillas de mensajes</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-1 shadow-card">
          <button
            onClick={() => setTab('campanas')}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === 'campanas' ? 'bg-brand-500 text-white shadow' : 'text-ink-600 hover:bg-[rgba(17,17,16,0.06)]'}`}
          >
            Campañas
          </button>
          <button
            onClick={() => setTab('plantillas')}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === 'plantillas' ? 'bg-brand-500 text-white shadow' : 'text-ink-600 hover:bg-[rgba(17,17,16,0.06)]'}`}
          >
            Plantillas
          </button>
        </div>
      </div>

      {tab === 'campanas' && (
        <>
          <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-4 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <Users size={15} className="text-brand-600" />
              <p className="text-sm font-semibold text-ink-900">Audiencias para campanas</p>
              <span className="rounded-full bg-[rgba(17,17,16,0.06)] px-2 py-0.5 text-[11px] font-semibold text-ink-400">
                Se definen al crear campana (Paso 2)
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {AUDIENCE_PRESETS.map((audience) => (
                <button
                  key={audience.id}
                  onClick={() => launchWithAudience(audience)}
                  className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <p className="text-sm font-semibold text-ink-900">{audience.nombre}</p>
                  <p className="mt-1 text-xs text-ink-400">{audience.descripcion}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-700">
                      {audience.total > 0 ? `${audience.total.toLocaleString()} contactos` : 'Sin conteo precargado'}
                    </span>
                    <span className="text-[11px] font-semibold text-ink-400">Usar</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Lanzamiento rapido</p>
                <p className="text-sm text-ink-600">Elige un objetivo y arranca una campana en menos de 2 minutos.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {CAMPAIGN_QUICK_STARTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => launchQuickStart(item)}
                  className="rounded-xl border border-brand-100 bg-white/70 backdrop-blur-sm p-3 text-left transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <p className="text-sm font-semibold text-ink-900">{item.nombre}</p>
                  <p className="mt-1 text-xs text-ink-400">{item.objetivo}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="rounded-full bg-[rgba(17,17,16,0.06)] px-2 py-0.5 text-[10px] font-semibold text-ink-600">{item.tipo}</span>
                    <span className="rounded-full bg-[rgba(17,17,16,0.06)] px-2 py-0.5 text-[10px] font-semibold text-ink-600">{item.segmento}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-4 shadow-card">
              <p className="text-xs font-semibold text-ink-400">Total campañas</p>
              <p className="mt-1 text-3xl font-bold text-ink-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-card">
              <p className="text-xs font-semibold text-amber-600">Programadas</p>
              <p className="mt-1 text-3xl font-bold text-amber-700">{stats.programadas}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-card">
              <p className="text-xs font-semibold text-emerald-600">Completadas</p>
              <p className="mt-1 text-3xl font-bold text-emerald-700">{stats.completadas}</p>
            </div>
            <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-4 shadow-card">
              <p className="text-xs font-semibold text-ink-400">Borradores</p>
              <p className="mt-1 text-3xl font-bold text-ink-600">{stats.borradores}</p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.07)] bg-white/65 backdrop-blur-md shadow-card">
            <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-5 py-4">
              <p className="font-bold text-ink-900">Campañas</p>
              <button
                onClick={() => {
                  setNewCampaignDraft(null);
                  setShowNewCampaign(true);
                }}
                className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition"
              >
                <Plus size={14} /> Nueva campaña
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(17,17,16,0.06)] text-left text-xs font-semibold text-ink-400">
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Plantilla</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-right">Enviados</th>
                    <th className="px-5 py-3 text-right">Leídos</th>
                    <th className="px-5 py-3 text-right">Resp.</th>
                    <th className="px-5 py-3 text-right">Lectura%</th>
                    <th className="px-5 py-3">Programado</th>
                    <th className="px-5 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((camp) => {
                    const lecturaRate = camp.enviados > 0 ? Math.round((camp.leidos / camp.enviados) * 100) : 0;
                    return (
                      <tr key={camp.id} className="border-b border-[rgba(17,17,16,0.04)] hover:bg-[rgba(17,17,16,0.025)] transition text-sm">
                        <td className="px-5 py-3 font-medium text-ink-900">{camp.nombre}</td>
                        <td className="px-5 py-3"><TipoBadge tipo={camp.tipo} /></td>
                        <td className="px-5 py-3 text-ink-400 font-mono text-xs">{getTemplateName(camp.plantillaId)}</td>
                        <td className="px-5 py-3"><CampaignEstadoBadge estado={camp.estado} /></td>
                        <td className="px-5 py-3 text-right text-ink-700">{camp.total.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-ink-700">{camp.enviados.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-ink-700">{camp.leidos.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-ink-700">{camp.respondidos.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-semibold ${lecturaRate >= 80 ? 'text-emerald-600' : lecturaRate >= 50 ? 'text-amber-600' : 'text-ink-400'}`}>
                            {camp.enviados > 0 ? `${lecturaRate}%` : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-400">{formatDate(camp.scheduledAt)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1">
                            {(camp.estado === 'borrador' || camp.estado === 'programada') && (
                              <button
                                onClick={() => handleSendNow(camp.id)}
                                title="Enviar ahora"
                                className="rounded-lg bg-brand-100 p-1.5 text-brand-700 hover:bg-brand-200 transition"
                              >
                                <Send size={12} />
                              </button>
                            )}
                            {camp.estado !== 'cancelada' && camp.estado !== 'completada' && (
                              <button
                                onClick={() => handleCancel(camp.id)}
                                title="Cancelar"
                                className="rounded-lg bg-red-100 p-1.5 text-red-600 hover:bg-red-200 transition"
                              >
                                <X size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handleViewMetrics(camp.nombre)}
                              title="Ver métricas"
                              className="rounded-lg bg-violet-100 p-1.5 text-violet-700 hover:bg-violet-200 transition"
                            >
                              <BarChart2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'plantillas' && (
        <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.07)] bg-white/65 backdrop-blur-md shadow-card">
          <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-5 py-4">
            <p className="font-bold text-ink-900">Plantillas de mensajes</p>
            <button
              onClick={() => setShowNewTemplate(true)}
              className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition"
            >
              <Plus size={14} /> Nueva plantilla
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(17,17,16,0.06)] text-left text-xs font-semibold text-ink-400">
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Variables</th>
                  <th className="px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tmpl) => (
                  <tr
                    key={tmpl.id}
                    className="relative border-b border-[rgba(17,17,16,0.04)] hover:bg-[rgba(17,17,16,0.025)] transition text-sm"
                    onMouseEnter={() => setHoveredTemplateId(tmpl.id)}
                    onMouseLeave={() => setHoveredTemplateId(null)}
                  >
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-ink-800">{tmpl.nombre}</td>
                    <td className="px-5 py-3"><TipoBadge tipo={tmpl.categoria} /></td>
                    <td className="px-5 py-3"><TemplateEstadoBadge estado={tmpl.estado as TemplateEstado} /></td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {tmpl.variables.map((v) => (
                          <span key={v} className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-mono text-amber-700">{v}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => showInfo(`Plantilla "${tmpl.nombre}" — ${tmpl.variables.length} variables`)}
                        className="rounded-lg bg-[rgba(17,17,16,0.06)] px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-[rgba(17,17,16,0.08)] transition"
                      >
                        Ver
                      </button>
                    </td>
                    {/* Hover popover */}
                    {hoveredTemplateId === tmpl.id && (
                      <td className="absolute left-1/2 top-0 z-20 w-80 -translate-x-1/2 -translate-y-full pt-1 border-0 p-0">
                        <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-4 shadow-xl text-xs">
                          <p className="mb-2 font-bold text-ink-700">Vista previa</p>
                          <div className="rounded-xl bg-[rgba(17,17,16,0.025)] p-3 text-ink-700 leading-relaxed">
                            {highlightVars(tmpl.contenido)}
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showNewCampaign && (
          <NewCampaignModal
            templates={templates}
            onClose={() => {
              setShowNewCampaign(false);
              setNewCampaignDraft(null);
            }}
            onCreated={(campaign) => {
              void persistCampaign(campaign);
              setShowNewCampaign(false);
              setNewCampaignDraft(null);
            }}
            initialDraft={newCampaignDraft ?? undefined}
          />
        )}
        {showNewTemplate && (
          <NewTemplateModal
            onClose={() => setShowNewTemplate(false)}
            onCreated={(template) => {
              void persistTemplate(template);
              setShowNewTemplate(false);
            }}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
