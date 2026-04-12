import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Loader2, SkipForward, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { OnboardingProfileApiItem, OnboardingProfilePayload } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

type ActivationStep = 1 | 2 | 3;

const STEPS: Array<{ id: ActivationStep; title: string; description: string }> = [
  { id: 1, title: 'Contexto', description: 'Qué vendes y a quién le vendes' },
  { id: 2, title: 'Tu asistente', description: 'Personalidad y tono de respuesta' },
  { id: 3, title: 'Listo', description: 'Tu siguiente ruta dentro del producto' },
];

const SELL_PLACEHOLDERS = [
  'Ej: Ropa deportiva para mujeres que compran por Instagram',
  'Ej: Servicios de contabilidad para pymes en Colombia',
  'Ej: Suplementos deportivos al por mayor para gimnasios',
  'Ej: Seguros de vida y salud para empleados de empresas',
];

const TO_PLACEHOLDERS = [
  'Ej: Mujeres de 20-35 años que compran desde WhatsApp o Instagram',
  'Ej: Dueños de negocios pequeños que necesitan llevar sus cuentas',
  'Ej: Gerentes de gimnasios que compran al por mayor cada mes',
  'Ej: Directores de RRHH que buscan beneficios para sus empleados',
];

function useCyclePlaceholder(items: string[], active: boolean, interval = 3000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items.length, interval, active]);
  return items[index];
}

type FormLevel = 'formal' | 'balanced' | 'casual';

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
    general_agent_name: '',
    general_agent_profile: {
      agent_persona: '',
      mission_statement: '',
      scope_notes: '',
      response_language: 'auto',
      greeting_message: '',
    },
    sales_agent_name: 'Sales Agent',
    sales_agent_profile: {
      agent_persona: '',
      mission_statement: '',
      greeting_message: '',
      response_language: 'auto',
      competitor_response: '',
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
    notification_settings: { items: [] },
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
      general_agent: {
        enabled: true,
        trial_mode: true,
        model_name: 'gpt-4.1-nano',
        handoff_mode: 'balanceado',
        max_response_length: 'brief',
      },
    },
    optimization_profile: { status: 'not_started', last_updated_at: null },
    onboarding_status: 'draft',
    completed_step: 1,
  };
}

function taskTone(status: string | undefined) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'in_progress') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm text-ink-700';
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { showError, showInfo, showSuccess } = useNotification();
  const [step, setStep] = useState<ActivationStep>(1);
  const [profile, setProfile] = useState<OnboardingProfileApiItem>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 2 local state
  const [agentName, setAgentName] = useState('');
  const [formality, setFormality] = useState<FormLevel>('balanced');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const data = await api.getOnboardingProfile();
        if (cancelled) return;
        const nextProfile = { ...emptyProfile(), ...data };
        setProfile(nextProfile);
        setAgentName(nextProfile.general_agent_name || '');
        setFormality((nextProfile.brand_profile?.formality_level as FormLevel) || 'balanced');
        setGreeting(nextProfile.general_agent_profile?.greeting_message || '');
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
    return () => { cancelled = true; };
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
    return (profile.what_you_sell || '').trim().length >= 6 && (profile.who_you_sell_to || '').trim().length >= 6;
  }

  async function handleNextFromStepOne() {
    if (!stepOneValid()) {
      showInfo('Activación', 'Cuéntanos brevemente qué vendes y a quién le vendes.');
      return;
    }
    const saved = await persistProfile({
      what_you_sell: (profile.what_you_sell || '').trim(),
      who_you_sell_to: (profile.who_you_sell_to || '').trim(),
      onboarding_status: 'in_progress',
      completed_step: 2,
    });
    if (saved) setStep(2);
  }

  async function handleContinueFromBrand() {
    const saved = await persistProfile({
      general_agent_name: agentName.trim() || 'Asistente',
      brand_profile: {
        ...(profile.brand_profile || {}),
        formality_level: formality,
      },
      general_agent_profile: {
        ...(profile.general_agent_profile || {}),
        greeting_message: greeting.trim(),
      },
      completed_step: 3,
    });
    if (saved) setStep(3);
  }

  async function handleSkipBrand() {
    const saved = await persistProfile({ completed_step: 3 });
    if (saved) setStep(3);
  }

  async function handleFinish() {
    const saved = await persistProfile({
      initial_onboarding_completed: true,
      onboarding_status: 'completed',
      completed_step: 3,
    });
    if (saved) {
      showSuccess('Todo listo', 'Ya estás dentro. Empieza a activar valor desde el dashboard.');
      navigate('/');
    }
  }

  const sellPlaceholder = useCyclePlaceholder(SELL_PLACEHOLDERS, !profile.what_you_sell);
  const toPlaceholder = useCyclePlaceholder(TO_PLACEHOLDERS, !profile.who_you_sell_to);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[rgba(17,17,16,0.025)]">
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
          className="rounded-[28px] border border-[rgba(17,17,16,0.09)] bg-white/70 p-5 shadow-card backdrop-blur-sm sm:p-8"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Tu espacio está activo</p>
            <h1 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">Entra rápido y empieza a ver valor</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-400">
              Primero activamos tu cuenta. Después podrás ajustar cómo responde tu asistente con más detalle.
            </p>
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

          {/* Step 1: Contexto */}
          {step === 1 && (
            <div className="space-y-5">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">¿Qué vendes?</span>
                <textarea
                  value={profile.what_you_sell}
                  onChange={(e) => updateProfile({ what_you_sell: e.target.value })}
                  rows={3}
                  placeholder={sellPlaceholder}
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">¿A quién le vendes?</span>
                <textarea
                  value={profile.who_you_sell_to}
                  onChange={(e) => updateProfile({ who_you_sell_to: e.target.value })}
                  rows={3}
                  placeholder={toPlaceholder}
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

          {/* Step 2: Tu asistente */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-ink-900">Dale personalidad a tu asistente</h2>
                <p className="mt-1 text-sm text-ink-500">Opcional — puedes ajustarlo después con más detalle.</p>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">Nombre del asistente</span>
                <input
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ej: Sara, Max, Asistente Zelora"
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">Tono de comunicación</span>
                <div className="flex gap-2">
                  {(['formal', 'balanced', 'casual'] as FormLevel[]).map((level) => {
                    const labels: Record<FormLevel, string> = { formal: 'Formal', balanced: 'Balanceado', casual: 'Cercano' };
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormality(level)}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                          formality === level
                            ? 'border-brand-400 bg-brand-50 text-brand-700'
                            : 'border-[rgba(17,17,16,0.09)] bg-white/70 text-ink-600 hover:border-[rgba(17,17,16,0.16)]'
                        }`}
                      >
                        {labels[level]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-800">Mensaje de bienvenida</span>
                <textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  rows={3}
                  placeholder="Ej: Hola, soy Sara. Estoy aquí para ayudarte a encontrar lo que necesitas."
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm outline-none transition focus:border-brand-400"
                />
              </label>

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
                    onClick={() => void handleSkipBrand()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]"
                  >
                    <SkipForward size={16} />
                    Omitir por ahora
                  </button>
                  <button
                    onClick={() => void handleContinueFromBrand()}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                  >
                    Continuar
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Listo */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-emerald-600 p-2 text-white">
                    <Sparkles size={18} />
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
                          <Link
                            to={item.href}
                            className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 px-3 py-2 text-xs font-semibold text-ink-700 backdrop-blur-sm transition hover:bg-[rgba(17,17,16,0.025)]"
                          >
                            {item.actionLabel}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
                >
                  <Sparkles size={16} className="transition group-hover:scale-110" />
                  Ir a mi espacio
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
