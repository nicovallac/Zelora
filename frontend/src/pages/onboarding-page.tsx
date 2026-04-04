import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, FileUp, Link2, Loader2, Rocket, SkipForward, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { OnboardingProfileApiItem, OnboardingProfilePayload, QuickKnowledgeFileItem } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

type ActivationStep = 1 | 2 | 3;

const STEPS: Array<{
  id: ActivationStep;
  title: string;
  description: string;
}> = [
  { id: 1, title: 'Contexto', description: 'Qué vendes y a quién le vendes' },
  { id: 2, title: 'Información', description: 'Ayuda opcional para responder mejor' },
  { id: 3, title: 'Listo', description: 'Tu siguiente ruta dentro del producto' },
];

function emptyProfile(): OnboardingProfileApiItem {
  return {
    organization_name: '',
    website: '',
    timezone: 'America/Bogota',
    tax_id: '',
    contact_email: '',
    contact_phone: '',
    payment_methods: [],
    payment_settings: {},
    what_you_sell: '',
    who_you_sell_to: '',
    sales_agent_name: 'Sales Agent',
    sales_agent_profile: {
      what_you_sell: '',
      who_you_sell_to: '',
      brand_profile: {},
      sales_playbook: {},
      buyer_model: {},
      commerce_rules: {},
    },
    quick_knowledge_text: '',
    quick_knowledge_links: [],
    quick_knowledge_files: [],
    activation_tasks: {
      knowledge_status: 'pending',
      channels_status: 'pending',
      agent_test_status: 'pending',
      agent_tested_at: null,
    },
    initial_onboarding_completed: false,
    brand_profile: {
      tone_of_voice: '',
      formality_level: 'balanced',
      brand_personality: '',
      value_proposition: '',
      key_differentiators: [],
      preferred_closing_style: '',
      urgency_style: 'soft',
      recommended_phrases: [],
      avoid_phrases: [],
    },
    sales_playbook: {},
    buyer_model: {},
    commerce_rules: {},
    locale_settings: {
      language: 'es',
      date_format: 'DD/MM/YYYY',
      default_response_language: true,
      session_timeout_minutes: 480,
    },
    notification_settings: {
      items: [],
    },
    ai_preferences: {
      provider: 'gpt4',
      copilot_model: 'gpt-4o',
      summary_model: 'gpt-4.1-nano',
      temperature: 0.55,
      max_tokens: 350,
      confidence_threshold: 75,
      copilot_suggestions: 3,
      sentiment_analysis: true,
      auto_summary: true,
      qa_scoring: true,
    },
    optimization_profile: {
      status: 'not_started',
      last_updated_at: null,
    },
    onboarding_status: 'draft',
    completed_step: 1,
  };
}

function taskTone(status: string | undefined) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'in_progress') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm text-ink-700';
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { showError, showInfo, showSuccess } = useNotification();
  const [step, setStep] = useState<ActivationStep>(1);
  const [profile, setProfile] = useState<OnboardingProfileApiItem>(emptyProfile);
  const [knowledgeLink, setKnowledgeLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await api.getOnboardingProfile();
        if (cancelled) return;
        const nextProfile = { ...emptyProfile(), ...data };
        setProfile(nextProfile);
        if (nextProfile.initial_onboarding_completed) {
          setStep(3);
        } else {
          setStep((Math.min(nextProfile.completed_step || 1, 3) as ActivationStep) || 1);
        }
      } catch (error) {
        if (!cancelled) {
          showError('Activación', error instanceof Error ? error.message : 'No se pudo cargar la activación inicial.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  const completionPct = useMemo(() => Math.round((step / STEPS.length) * 100), [step]);

  function updateProfile(patch: Partial<OnboardingProfileApiItem>) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  async function persistProfile(patch?: OnboardingProfilePayload) {
    setSaving(true);
    try {
      const saved = await api.updateOnboardingProfile({
        ...patch,
        completed_step: patch?.completed_step ?? step,
      });
      setProfile((current) => ({ ...current, ...saved }));
      return saved;
    } catch (error) {
      showError('Activación', error instanceof Error ? error.message : 'No se pudo guardar.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  function stepOneValid() {
    return profile.what_you_sell.trim().length >= 6 && profile.who_you_sell_to.trim().length >= 6;
  }

  async function handleNextFromStepOne() {
    if (!stepOneValid()) {
      showInfo('Activación', 'Cuéntanos brevemente qué vendes y a quién le vendes.');
      return;
    }
    const saved = await persistProfile({
      what_you_sell: profile.what_you_sell.trim(),
      who_you_sell_to: profile.who_you_sell_to.trim(),
      onboarding_status: 'in_progress',
      completed_step: 2,
    });
    if (saved) setStep(2);
  }

  async function handleAddKnowledgeLink() {
    const normalized = normalizeUrl(knowledgeLink);
    if (!normalized) return;
    if (profile.quick_knowledge_links.includes(normalized)) {
      setKnowledgeLink('');
      return;
    }
    const nextLinks = [...profile.quick_knowledge_links, normalized];
    updateProfile({ quick_knowledge_links: nextLinks });
    setKnowledgeLink('');
    await persistProfile({ quick_knowledge_links: nextLinks, completed_step: 2 });
  }

  async function handleUploadFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploadOnboardingQuickKnowledgeFile(file);
      setProfile((current) => ({
        ...current,
        quick_knowledge_files: [...current.quick_knowledge_files, uploaded],
      }));
      showSuccess('Archivo agregado', 'Ya puedes seguir. Luego podrás organizarlo mejor dentro del producto.');
    } catch (error) {
      showError('Activación', error instanceof Error ? error.message : 'No se pudo subir el archivo.');
    } finally {
      setUploading(false);
    }
  }

  async function handleContinueFromKnowledge() {
    const saved = await persistProfile({
      quick_knowledge_text: profile.quick_knowledge_text,
      quick_knowledge_links: profile.quick_knowledge_links,
      completed_step: 3,
    });
    if (saved) setStep(3);
  }

  async function handleSkipKnowledge() {
    const saved = await persistProfile({
      completed_step: 3,
    });
    if (saved) setStep(3);
  }

  async function handleFinish() {
    const saved = await persistProfile({
      initial_onboarding_completed: true,
      onboarding_status: 'completed',
      completed_step: 3,
    });
    if (saved) {
      showSuccess('Todo listo', 'Ya estás dentro. Estos siguientes pasos te ayudarán a activar valor más rápido.');
      navigate('/');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-[rgba(17,17,16,0.025)]">
        <div className="flex items-center gap-3 text-ink-600">
          <Loader2 size={18} className="animate-spin" />
          Preparando tu espacio...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-[linear-gradient(180deg,_#f7fbff_0%,_#ffffff_48%,_#f8fafc_100%)] px-3 py-4 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="rounded-[28px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-5 shadow-card sm:p-8"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Activación inicial</p>
              <h1 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">Entra rápido y empieza a ver valor</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-400">
                Primero activamos tu cuenta. Después podrás ajustar cómo responde tu asistente con más detalle.
              </p>
            </div>
            <button
              onClick={() => void persistProfile({ onboarding_status: profile.onboarding_status })}
              disabled={saving}
              className="self-start rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)] disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar y seguir luego'}
            </button>
          </div>

          <div className="mb-6 grid gap-2 sm:grid-cols-3">
            {STEPS.map((item) => {
              const active = step === item.id;
              const completed = step > item.id || profile.completed_step > item.id || (item.id === 3 && profile.initial_onboarding_completed);
              return (
                <button
                  key={item.id}
                  onClick={() => setStep(item.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    active ? 'border-brand-400 bg-brand-50' : 'border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm'
                  }`}
                >
                  <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl ${
                    completed || active ? 'bg-brand-500 text-white' : 'bg-[rgba(17,17,16,0.06)] text-ink-400'
                  }`}>
                    {completed ? <CheckCircle2 size={16} /> : <span className="text-sm font-bold">{item.id}</span>}
                  </div>
                  <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                  <p className="mt-1 text-xs text-ink-400">{item.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mb-8 h-2 rounded-full bg-[rgba(17,17,16,0.06)]">
            <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${completionPct}%` }} />
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-4 text-sm text-ink-600">
                Cuéntanos solo lo mínimo para ubicar al sistema. No necesitas configurar toda tu marca ahora.
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">¿Qué vendes?</span>
                <textarea
                  value={profile.what_you_sell}
                  onChange={(event) => updateProfile({ what_you_sell: event.target.value })}
                  rows={3}
                  placeholder="Ej: Vendemos ropa deportiva para mujeres que compran online"
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">¿A quién le vendes?</span>
                <textarea
                  value={profile.who_you_sell_to}
                  onChange={(event) => updateProfile({ who_you_sell_to: event.target.value })}
                  rows={3}
                  placeholder="Ej: Le vendemos a personas que buscan comprar rápido desde WhatsApp, web o Instagram"
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <p className="text-xs text-ink-400">Esto nos ayuda a empezar con el contexto correcto sin frenar tu entrada.</p>
                <button
                  onClick={() => void handleNextFromStepOne()}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  Continuar
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-4 text-sm text-ink-600">
                Si quieres, agrega algo de información ahora para que tu asistente responda mejor desde el inicio.
                También puedes omitirlo y seguir.
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">Pega texto útil</span>
                <textarea
                  value={profile.quick_knowledge_text}
                  onChange={(event) => updateProfile({ quick_knowledge_text: event.target.value })}
                  rows={5}
                  placeholder="Ej: preguntas frecuentes, políticas, explicación de productos, entregas o devoluciones"
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">Pega un link</span>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={knowledgeLink}
                    onChange={(event) => setKnowledgeLink(event.target.value)}
                    placeholder="https://tu-tienda.com/politicas"
                    className="flex-1 rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                  />
                  <button
                    onClick={() => void handleAddKnowledgeLink()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]"
                  >
                    <Link2 size={16} />
                    Agregar link
                  </button>
                </div>
                {profile.quick_knowledge_links.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.quick_knowledge_links.map((item) => (
                      <span key={item} className="rounded-full border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-1 text-xs text-ink-600">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">Sube un archivo</span>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(17,17,16,0.12)] bg-[rgba(17,17,16,0.025)] px-4 py-6 text-center transition hover:border-[rgba(17,17,16,0.18)] hover:bg-white">
                  <FileUp size={18} className="text-ink-400" />
                  <p className="mt-2 text-sm font-semibold text-ink-700">
                    {uploading ? 'Subiendo archivo...' : 'PDF, documento o archivo útil'}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">Lo guardamos para que luego puedas usarlo dentro del producto.</p>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => void handleUploadFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                {profile.quick_knowledge_files.length > 0 ? (
                  <div className="space-y-2">
                    {profile.quick_knowledge_files.map((file: QuickKnowledgeFileItem) => (
                      <div key={file.id} className="flex items-center justify-between rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink-900">{file.filename}</p>
                          <p className="text-xs text-ink-400">{Math.max(1, Math.round(file.file_size / 1024))} KB</p>
                        </div>
                        <span className="text-xs font-semibold text-ink-400">Cargado</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-900"
                >
                  <ChevronLeft size={16} />
                  Volver
                </button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => void handleSkipKnowledge()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]"
                  >
                    <SkipForward size={16} />
                    Omitir por ahora
                  </button>
                  <button
                    onClick={() => void handleContinueFromKnowledge()}
                    disabled={saving || uploading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                  >
                    Continuar
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-emerald-600 p-2 text-white">
                    <Rocket size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-ink-900">Tu cuenta ya está lista</h2>
                    <p className="mt-1 text-sm text-ink-600">
                      Ya entraste a Zelora. Lo siguiente es activar valor más rápido con tres pasos simples.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">Qué sigue</p>
                <div className="mt-3 grid gap-3">
                  {[
                    {
                      title: 'Carga conocimiento',
                      description: 'Agrega información útil para responder mejor desde el primer día.',
                      status: profile.activation_tasks.knowledge_status,
                      actionLabel: 'Abrir conocimiento',
                      href: '/knowledge-base',
                    },
                    {
                      title: 'Activa un canal',
                      description: 'Conecta App Chat o Web Widget para empezar a recibir conversaciones.',
                      status: profile.activation_tasks.channels_status,
                      actionLabel: 'Abrir canales',
                      href: '/integrations',
                    },
                    {
                      title: 'Prueba tu agente',
                      description: 'Haz una prueba rápida para ver cómo se comporta dentro del producto.',
                      status: profile.activation_tasks.agent_test_status,
                      actionLabel: 'Abrir inbox',
                      href: '/inbox',
                    },
                  ].map((item) => (
                    <div key={item.title} className={`rounded-2xl border px-4 py-4 ${taskTone(item.status)}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="mt-1 text-xs opacity-80">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                            {item.status === 'completed' ? 'Completado' : item.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                          </span>
                          <Link to={item.href} className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]">
                            {item.actionLabel}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-4">
                <p className="text-sm font-semibold text-ink-900">Más adelante podrás ajustar cómo responde tu asistente</p>
                <p className="mt-1 text-sm text-ink-600">
                  Tono, estilo de cierre, reglas y comportamiento avanzado quedan fuera de esta activación inicial para no frenarte ahora.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-900"
                >
                  <ChevronLeft size={16} />
                  Volver
                </button>
                <button
                  onClick={() => void handleFinish()}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  Entrar al producto
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-brand-100 p-2 text-brand-700">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">La regla principal aquí es simple</p>
                <p className="mt-1 text-sm text-ink-600">
                  Primero activar. Después calibrar. No necesitas configurar todo para entrar.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
