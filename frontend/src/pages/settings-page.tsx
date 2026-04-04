import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Bot,
  CheckCircle2,
  Upload,
  X,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import type { OnboardingProfileApiItem } from '../services/api';
import { PageHeader } from '../components/ui/page-header';

type SettingsTab = 'general' | 'notificaciones' | 'ia' | 'apariencia';

interface NotificationSetting {
  key: string;
  label: string;
  email: boolean;
  whatsapp: boolean;
  browser: boolean;
  enabled: boolean;
}

const PRESET_COLORS = [
  { hex: '#2563eb', label: 'Azul brand' },
  { hex: '#7c3aed', label: 'Violeta' },
  { hex: '#059669', label: 'Esmeralda' },
  { hex: '#dc2626', label: 'Rojo' },
  { hex: '#d97706', label: 'Ámbar' },
];

const BOT_AVATARS = [
  { id: 'a1', label: 'Robot', bg: 'bg-brand-500' },
  { id: 'a2', label: 'Asistente', bg: 'bg-violet-600' },
  { id: 'a3', label: 'Amigable', bg: 'bg-emerald-600' },
  { id: 'a4', label: 'Formal', bg: 'bg-slate-700' },
  { id: 'a5', label: 'Moderno', bg: 'bg-pink-600' },
];

const AI_PROVIDERS = [
  { id: 'gpt4', label: 'OpenAI GPT-4', active: true },
  { id: 'claude', label: 'Claude Sonnet', active: false },
  { id: 'llama', label: 'Llama 3', active: false, comingSoon: true },
];

export function SettingsPage() {
  const { showSuccess, showInfo, showWarning } = useNotification();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfileApiItem | null>(null);
  const [loadingOptimization, setLoadingOptimization] = useState(true);
  const [savingOptimization, setSavingOptimization] = useState(false);
  const [brandTone, setBrandTone] = useState('');
  const [brandFormality, setBrandFormality] = useState('balanced');
  const [valueProposition, setValueProposition] = useState('');
  const [differentiatorsText, setDifferentiatorsText] = useState('');
  const [closingStyle, setClosingStyle] = useState('');
  const [forbiddenPromisesText, setForbiddenPromisesText] = useState('');

  // General tab
  const [language, setLanguage] = useState('es');
  const [timezone, setTimezone] = useState('America/Bogota');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [defaultResponseLang, setDefaultResponseLang] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(480);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Notifications tab
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { key: 'nueva_conv', label: 'Nueva conversación entrante', email: true, whatsapp: false, browser: true, enabled: true },
    { key: 'escalada', label: 'Conversación escalada', email: true, whatsapp: true, browser: true, enabled: true },
    { key: 'sla', label: 'SLA vencido', email: true, whatsapp: true, browser: true, enabled: true },
    { key: 'pqrs', label: 'Nueva PQRS', email: true, whatsapp: false, browser: true, enabled: true },
    { key: 'campana', label: 'Campaña completada', email: true, whatsapp: false, browser: false, enabled: true },
    { key: 'error_int', label: 'Error de integración', email: true, whatsapp: false, browser: true, enabled: true },
    { key: 'nuevo_agente', label: 'Nuevo agente creado', email: false, whatsapp: false, browser: false, enabled: false },
    { key: 'informe', label: 'Informe semanal por email', email: true, whatsapp: false, browser: false, enabled: true },
  ]);

  function toggleNotif(key: string, field: keyof NotificationSetting) {
    setNotifications((prev) => prev.map((n) => n.key === key ? { ...n, [field]: !n[field as keyof NotificationSetting] } : n));
  }

  // AI tab
  const [aiProvider, setAiProvider] = useState('gpt4');
  const [copilotModel, setCopilotModel] = useState('gpt-4o');
  const [summaryModel, setSummaryModel] = useState('gpt-3.5-turbo');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [copilotSuggestions, setCopilotSuggestions] = useState<2 | 3 | 5>(3);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(true);
  const [autoSummary, setAutoSummary] = useState(true);
  const [qaScoring, setQaScoring] = useState(true);

  // Appearance tab
  const [widgetColor, setWidgetColor] = useState('#2563eb');
  const [customHex, setCustomHex] = useState('');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right'>('bottom-right');
  const [greetingMsg, setGreetingMsg] = useState('¡Hola! Soy el asistente virtual de COMFAGUAJIRA. ¿En qué puedo ayudarte hoy?');
  const [selectedAvatar, setSelectedAvatar] = useState('a1');
  const [botName, setBotName] = useState('Asistente COMFAGUAJIRA');
  const [darkMode, setDarkMode] = useState(false);
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'notificaciones', label: 'Notificaciones' },
    { key: 'ia', label: 'IA & Automatización' },
    { key: 'apariencia', label: 'Apariencia' },
  ];

  const estimatedCost = Math.round((9240 * maxTokens * 0.000002 * temperature) / 10) * 10;

  useEffect(() => {
    let cancelled = false;

    async function loadOptimizationProfile() {
      try {
        const profile = await api.getOnboardingProfile();
        if (cancelled) return;
        setOnboardingProfile(profile);
        setBrandTone(profile.brand_profile?.tone_of_voice || '');
        setBrandFormality(profile.brand_profile?.formality_level || 'balanced');
        setValueProposition(profile.brand_profile?.value_proposition || '');
        setDifferentiatorsText((profile.brand_profile?.key_differentiators || []).join('\n'));
        setClosingStyle(profile.brand_profile?.preferred_closing_style || '');
        setForbiddenPromisesText((profile.commerce_rules?.forbidden_promises || []).join('\n'));
      } catch {
        if (!cancelled) setOnboardingProfile(null);
      } finally {
        if (!cancelled) setLoadingOptimization(false);
      }
    }

    void loadOptimizationProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveOptimizationProfile() {
    setSavingOptimization(true);
    try {
      const saved = await api.updateOnboardingProfile({
        brand_profile: {
          ...(onboardingProfile?.brand_profile || {}),
          tone_of_voice: brandTone,
          formality_level: brandFormality,
          value_proposition: valueProposition,
          key_differentiators: differentiatorsText
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          preferred_closing_style: closingStyle,
        },
        commerce_rules: {
          ...(onboardingProfile?.commerce_rules || {}),
          forbidden_promises: forbiddenPromisesText
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        },
        optimization_profile: {
          ...(onboardingProfile?.optimization_profile || {}),
          status: 'in_progress',
          last_updated_at: new Date().toISOString(),
        },
      });
      setOnboardingProfile(saved);
      showSuccess('Asistente actualizado', 'Los ajustes de marca y comportamiento ya quedaron guardados.');
    } catch (error) {
      showWarning(error instanceof Error ? error.message : 'No se pudo guardar esta configuracion.');
    } finally {
      setSavingOptimization(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-stack">
      <PageHeader
        eyebrow="Ajustes del producto"
        title="Configuracion de plataforma"
        description="Personaliza el comportamiento global del chatbot y la plataforma."
      />

      {/* Tabs */}
      <div className="page-section-card py-3">
        <div className="border-b border-[rgba(17,17,16,0.09)]">
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
                activeTab === tab.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-400 hover:text-ink-800'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* TAB 1 — General */}
      {activeTab === 'general' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-4 sm:p-6 shadow-card backdrop-blur-sm space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Fase 2</p>
                <h2 className="mt-2 font-bold text-ink-900">Ajusta como responde tu asistente</h2>
                <p className="mt-1 text-sm text-ink-400">
                  Esta parte ya no bloquea tu entrada. Sirve para que el asistente suene mas a tu marca y venda mejor.
                </p>
              </div>
              {onboardingProfile?.optimization_profile?.last_updated_at ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  <CheckCircle2 size={12} />
                  Actualizado
                </span>
              ) : null}
            </div>

            {loadingOptimization ? (
              <div className="flex items-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-4 text-sm text-ink-600">
                <Loader2 size={16} className="animate-spin" />
                Cargando ajustes de activacion...
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-400">Tono</label>
                    <select
                      value={brandTone}
                      onChange={(e) => setBrandTone(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                    >
                      <option value="">Elige un tono</option>
                      <option value="cercano">Cercano</option>
                      <option value="consultivo">Consultivo</option>
                      <option value="premium">Premium</option>
                      <option value="directo">Directo</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-400">Formalidad</label>
                    <select
                      value={brandFormality}
                      onChange={(e) => setBrandFormality(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                    >
                      <option value="friendly">Muy cercana</option>
                      <option value="balanced">Balanceada</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-400">Propuesta de valor</label>
                  <textarea
                    value={valueProposition}
                    onChange={(e) => setValueProposition(e.target.value)}
                    rows={3}
                    placeholder="Ej: ayudamos a comprar rapido, con asesoria clara y entrega confiable"
                    className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-3 text-sm outline-none focus:border-brand-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-400">Diferenciales clave</label>
                  <textarea
                    value={differentiatorsText}
                    onChange={(e) => setDifferentiatorsText(e.target.value)}
                    rows={3}
                    placeholder={'Escribe uno por linea\nEntrega rapida\nAcompanamiento por WhatsApp'}
                    className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-3 text-sm outline-none focus:border-brand-400"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-400">Estilo de cierre</label>
                    <select
                      value={closingStyle}
                      onChange={(e) => setClosingStyle(e.target.value)}
                      className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
                    >
                      <option value="">Elige un estilo</option>
                      <option value="directo">Directo</option>
                      <option value="consultivo">Consultivo</option>
                      <option value="acompanado">Acompanado</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-400">Promesas que debe evitar</label>
                    <textarea
                      value={forbiddenPromisesText}
                      onChange={(e) => setForbiddenPromisesText(e.target.value)}
                      rows={3}
                      placeholder={'Escribe una por linea\nPrometer entrega el mismo dia\nOfrecer descuentos no vigentes'}
                      className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-3 text-sm outline-none focus:border-brand-400"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-4 text-sm text-ink-600">
                  Aqui vive la calibracion posterior: tono, estilo comercial y limites. El conocimiento profundo sigue yendo en informacion para responder mejor.
                </div>

                <button
                  onClick={() => void saveOptimizationProfile()}
                  disabled={savingOptimization}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {savingOptimization ? <Loader2 size={16} className="animate-spin" /> : null}
                  Guardar ajustes del asistente
                </button>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-4 sm:p-6 shadow-card backdrop-blur-sm space-y-5">
            <h2 className="font-bold text-ink-900">Configuración regional</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Idioma de la plataforma</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Zona horaria</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="America/Bogota">America/Bogotá (UTC-5)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="Europe/Madrid">Europe/Madrid (UTC+1)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Formato de fecha</label>
                <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Timeout de sesión (minutos)</label>
                <input type="number" value={sessionTimeout} min={30} max={1440}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-700">Idioma de respuesta por defecto: Español</p>
                <p className="text-xs text-ink-400">El bot responde en el idioma del usuario</p>
              </div>
              <button onClick={() => setDefaultResponseLang(!defaultResponseLang)} className="text-brand-600">
                {defaultResponseLang ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-ink-300" />}
              </button>
            </div>

            <button onClick={() => showSuccess('Configuración general guardada')}
              className="w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition">
              Guardar configuración
            </button>
          </div>

          {/* Export data */}
          <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card">
            <h2 className="mb-3 font-bold text-ink-900">Exportar datos</h2>
            <p className="mb-4 text-sm text-ink-400">Descarga todos los datos de tu organización (GDPR Art. 20 — portabilidad).</p>
            <button onClick={() => showInfo('Exportación iniciada. Recibirás un email con el archivo ZIP en 10-15 minutos. Cumple con GDPR Art. 20.')}
              className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-[rgba(17,17,16,0.06)] transition">
              Exportar todos los datos
            </button>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h2 className="font-bold text-red-700">Zona de peligro</h2>
            </div>
            <p className="mb-4 text-sm text-red-600">Esta acción elimina permanentemente todos los datos de la organización. No se puede deshacer.</p>
            <label className="mb-1 block text-xs font-semibold text-red-600">Escribe CONFIRMAR para habilitar el botón</label>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="CONFIRMAR"
              className="mb-3 w-full rounded-xl border border-red-200 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm outline-none focus:border-red-500" />
            <button
              disabled={deleteConfirm !== 'CONFIRMAR'}
              onClick={() => showWarning('La eliminacion de la organizacion requiere validacion manual y soporte operativo.')}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
              Eliminar organización
            </button>
          </div>
        </div>
      )}

      {/* TAB 2 — Notificaciones */}
      {activeTab === 'notificaciones' && (
        <div className="max-w-3xl space-y-4">
          <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">Evento</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-400">Activo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-400">Email</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-400">WhatsApp</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-400">Browser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(17,17,16,0.06)]">
                {notifications.map((n) => (
                  <tr key={n.key} className={`hover:bg-[rgba(17,17,16,0.025)] transition ${!n.enabled ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-ink-700">{n.label}</td>
                    {(['enabled', 'email', 'whatsapp', 'browser'] as const).map((field) => (
                      <td key={field} className="px-4 py-3 text-center">
                        <button onClick={() => toggleNotif(n.key, field)} className="mx-auto flex justify-center text-brand-600">
                          {(n[field] as boolean) ? <ToggleRight size={20} /> : <ToggleLeft size={20} className="text-ink-300" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => showSuccess('Preferencias de notificaciones guardadas')}
            className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition">
            Guardar preferencias
          </button>
        </div>
      )}

      {/* TAB 3 — IA & Automatización */}
      {activeTab === 'ia' && (
        <div className="max-w-2xl space-y-6">
          {/* Provider */}
          <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-4 sm:p-6 shadow-card backdrop-blur-sm space-y-4">
            <h2 className="font-bold text-ink-900">Proveedor de IA</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AI_PROVIDERS.map((p) => (
                <button key={p.id}
                  onClick={() => !p.comingSoon && setAiProvider(p.id)}
                  className={`relative rounded-xl border p-3 text-sm font-semibold transition ${
                    aiProvider === p.id ? 'border-brand-500 bg-brand-50 text-brand-700' :
                    p.comingSoon ? 'border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] text-ink-400 cursor-not-allowed' :
                    'border-[rgba(17,17,16,0.09)] text-ink-700 hover:bg-[rgba(17,17,16,0.025)]'
                  }`}>
                  {p.label}
                  {p.comingSoon && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-ink-400">Pronto</span>}
                  {aiProvider === p.id && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Activo</span>}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Modelo para copiloto</label>
                <select value={copilotModel} onChange={(e) => setCopilotModel(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Modelo para resúmenes</label>
                <select value={summaryModel} onChange={(e) => setSummaryModel(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (rápido/económico)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-4 sm:p-6 shadow-card backdrop-blur-sm space-y-5">
            <h2 className="font-bold text-ink-900">Parámetros del modelo</h2>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-ink-700">Temperatura — Creatividad de las respuestas</label>
                <span className="font-bold text-brand-600">{temperature.toFixed(1)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-ink-400"><span>0 (preciso)</span><span>1 (creativo)</span></div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-ink-700">Tokens máximos por respuesta</label>
                <span className="font-bold text-brand-600">{maxTokens}</span>
              </div>
              <input type="range" min={100} max={2000} step={100} value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-ink-400"><span>100</span><span>2.000</span></div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-ink-700">Umbral de confianza para auto-respuesta</label>
                <span className="font-bold text-brand-600">{confidenceThreshold}%</span>
              </div>
              <input type="range" min={50} max={99} value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-ink-400"><span>50%</span><span>99%</span></div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Sugerencias de copiloto</label>
              <div className="flex gap-3">
                {([2, 3, 5] as const).map((n) => (
                  <button key={n} onClick={() => setCopilotSuggestions(n)}
                    className={`flex h-9 w-14 items-center justify-center rounded-xl border text-sm font-bold transition ${
                      copilotSuggestions === n ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[rgba(17,17,16,0.09)] text-ink-600 hover:bg-[rgba(17,17,16,0.025)]'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-4 sm:p-6 shadow-card backdrop-blur-sm space-y-4">
            <h2 className="font-bold text-ink-900">Automatizaciones IA</h2>
            {[
              { label: 'Habilitar análisis de sentimiento', sub: 'Detecta emociones en cada mensaje del usuario', val: sentimentAnalysis, set: setSentimentAnalysis },
              { label: 'Auto-resumen al resolver conversación', sub: 'Genera un resumen IA al cerrar cada conversación', val: autoSummary, set: setAutoSummary },
              { label: 'QA scoring automático', sub: 'Puntúa automáticamente la calidad de respuestas', val: qaScoring, set: setQaScoring },
            ].map(({ label, sub, val, set }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-700">{label}</p>
                  <p className="text-xs text-ink-400">{sub}</p>
                </div>
                <button onClick={() => set(!val)} className="text-brand-600">
                  {val ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-ink-300" />}
                </button>
              </div>
            ))}
          </div>

          {/* Cost estimate */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-600">Estimado de costo IA mensual</p>
            <p className="text-3xl font-extrabold text-amber-700">${estimatedCost.toLocaleString('es-CO')} COP</p>
            <p className="mt-1 text-xs text-amber-600">Basado en 9.240 conversaciones/mes · {maxTokens} tokens promedio · modelo {copilotModel}</p>
          </div>

          <button onClick={() => showSuccess('Configuración de IA guardada correctamente')}
            className="w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition">
            Guardar configuración IA
          </button>
        </div>
      )}

      {/* TAB 4 — Apariencia */}
      {activeTab === 'apariencia' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            {/* Color picker */}
            <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card">
              <h2 className="mb-4 font-bold text-ink-900">Color del widget</h2>
              <div className="flex items-center gap-3 mb-3">
                {PRESET_COLORS.map((c) => (
                  <button key={c.hex} onClick={() => setWidgetColor(c.hex)} title={c.label}
                    style={{ backgroundColor: c.hex }}
                    className={`h-8 w-8 rounded-full cursor-pointer transition ${widgetColor === c.hex ? 'ring-2 ring-offset-2 ring-brand-600 scale-110' : 'hover:scale-105'}`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-ink-600">Hex personalizado:</label>
                <input type="text" value={customHex} onChange={(e) => setCustomHex(e.target.value)}
                  placeholder="#2563eb"
                  className="w-28 rounded-lg border border-[rgba(17,17,16,0.09)] px-2 py-1 text-xs outline-none focus:border-brand-400 font-mono" />
                <button onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(customHex)) setWidgetColor(customHex); }}
                  className="rounded-lg bg-[rgba(17,17,16,0.06)] px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-[rgba(17,17,16,0.08)] transition">
                  Aplicar
                </button>
              </div>
            </div>

            {/* Position */}
            <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card">
              <h2 className="mb-4 font-bold text-ink-900">Posición del widget</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['bottom-right', 'bottom-left', 'top-right'] as const).map((pos) => (
                  <button key={pos} onClick={() => setWidgetPosition(pos)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      widgetPosition === pos ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[rgba(17,17,16,0.09)] text-ink-600 hover:bg-[rgba(17,17,16,0.025)]'
                    }`}>
                    {pos === 'bottom-right' ? 'Abajo derecha' : pos === 'bottom-left' ? 'Abajo izquierda' : 'Arriba derecha'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot name + greeting */}
            <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-4 sm:p-6 shadow-card backdrop-blur-sm space-y-4">
              <h2 className="font-bold text-ink-900">Personalización del bot</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Nombre del bot</label>
                <input type="text" value={botName} onChange={(e) => setBotName(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-600">Mensaje de bienvenida</label>
                <textarea value={greetingMsg} onChange={(e) => setGreetingMsg(e.target.value)} rows={3}
                  className="w-full resize-none rounded-xl border border-[rgba(17,17,16,0.09)] p-3 text-sm outline-none focus:border-brand-400" />
              </div>
            </div>

            {/* Avatar */}
            <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card">
              <h2 className="mb-4 font-bold text-ink-900">Avatar del bot</h2>
              <div className="flex gap-3">
                {BOT_AVATARS.map((av) => (
                  <button key={av.id} onClick={() => setSelectedAvatar(av.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition ${
                      selectedAvatar === av.id ? 'border-brand-500 bg-brand-50' : 'border-[rgba(17,17,16,0.09)] hover:bg-[rgba(17,17,16,0.025)]'
                    }`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${av.bg} text-white`}>
                      <Bot size={18} />
                    </div>
                    <span className="text-[10px] font-semibold text-ink-600">{av.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dark mode + Logo */}
            <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-4 sm:p-6 shadow-card backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-700">Modo oscuro del dashboard</p>
                  <p className="text-xs text-ink-400">Cambia el tema del panel de administración</p>
                </div>
                <button onClick={() => { setDarkMode(!darkMode); showInfo('Modo oscuro próximamente disponible.'); }} className="text-brand-600">
                  {darkMode ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-ink-300" />}
                </button>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-ink-600">Logo de la organización</label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[rgba(17,17,16,0.12)] p-6 text-center hover:border-brand-400 transition">
                  <Upload size={20} className="text-ink-400" />
                  {logoFile ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-700">{logoFile}</span>
                      <button onClick={(e) => { e.stopPropagation(); setLogoFile(null); }}
                        className="text-red-400 hover:text-red-600 transition"><X size={14} /></button>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-400">Arrastra tu logo aquí o haz clic para subir</p>
                  )}
                  <p className="text-[10px] text-ink-400">PNG, SVG, JPG — máx. 2 MB</p>
                </div>
                <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setLogoFile(e.target.files[0].name); }} />
              </div>
            </div>

            <button onClick={() => showSuccess('Configuración de apariencia guardada')}
              className="w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition">
              Guardar apariencia
            </button>
          </div>

          {/* Widget preview */}
          <div className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card">
              <h2 className="mb-4 font-bold text-ink-900">Vista previa del widget</h2>
              <div className="relative bg-[rgba(17,17,16,0.06)] rounded-xl overflow-hidden" style={{ height: 400 }}>
                {/* Fake website bg */}
                <div className="absolute inset-0 flex flex-col">
                  <div className="h-10 bg-slate-300" />
                  <div className="flex-1 p-4 space-y-2">
                    {[80, 60, 90, 50].map((w, i) => (
                      <div key={i} className="h-3 rounded bg-slate-200" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>

                {/* Widget position */}
                <div className={`absolute flex flex-col items-end gap-2 ${
                  widgetPosition === 'bottom-right' ? 'bottom-4 right-4' :
                  widgetPosition === 'bottom-left' ? 'bottom-4 left-4 items-start' :
                  'top-4 right-4'
                }`}>
                  {/* Mini chat bubble */}
                  <div className="w-48 rounded-2xl overflow-hidden shadow-lg">
                    <div className="flex items-center gap-2 px-3 py-2 text-white text-xs" style={{ backgroundColor: widgetColor }}>
                      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot size={12} />
                      </div>
                      <div>
                        <p className="font-bold leading-none">{botName || 'Bot'}</p>
                        <p className="text-[9px] opacity-80">En línea</p>
                      </div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm p-2">
                      <div className="rounded-xl rounded-tl-sm bg-[rgba(17,17,16,0.06)] px-2 py-1.5 text-[10px] text-ink-700 leading-tight">
                        {greetingMsg.slice(0, 60)}...
                      </div>
                    </div>
                  </div>
                  {/* FAB */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg text-white" style={{ backgroundColor: widgetColor }}>
                    <Bot size={18} />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-ink-400">
                Vista previa — color: <span className="font-mono font-bold" style={{ color: widgetColor }}>{widgetColor}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AnimatePresence placeholder for future modals */}
      <AnimatePresence />
      </div>
    </div>
  );
}
