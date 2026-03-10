import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Bot,
  Upload,
  X,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

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
  { id: 'a1', label: 'Robot', bg: 'bg-brand-600' },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración de plataforma</h1>
        <p className="mt-1 text-sm text-slate-500">Personaliza el comportamiento global del chatbot y la plataforma</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
                activeTab === tab.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1 — General */}
      {activeTab === 'general' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-slate-900">Configuración regional</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Idioma de la plataforma</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Zona horaria</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="America/Bogota">America/Bogotá (UTC-5)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="Europe/Madrid">Europe/Madrid (UTC+1)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Formato de fecha</label>
                <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Timeout de sesión (minutos)</label>
                <input type="number" value={sessionTimeout} min={30} max={1440}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Idioma de respuesta por defecto: Español</p>
                <p className="text-xs text-slate-500">El bot responde en el idioma del usuario</p>
              </div>
              <button onClick={() => setDefaultResponseLang(!defaultResponseLang)} className="text-brand-600">
                {defaultResponseLang ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-slate-300" />}
              </button>
            </div>

            <button onClick={() => showSuccess('Configuración general guardada')}
              className="w-full rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
              Guardar configuración
            </button>
          </div>

          {/* Export data */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-bold text-slate-900">Exportar datos</h2>
            <p className="mb-4 text-sm text-slate-500">Descarga todos los datos de tu organización (GDPR Art. 20 — portabilidad).</p>
            <button onClick={() => showInfo('Exportación iniciada. Recibirás un email con el archivo ZIP en 10-15 minutos. Cumple con GDPR Art. 20.')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
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
              className="mb-3 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500" />
            <button
              disabled={deleteConfirm !== 'CONFIRMAR'}
              onClick={() => showWarning('Acción bloqueada en modo demo. Contacta soporte para eliminar tu organización.')}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
              Eliminar organización
            </button>
          </div>
        </div>
      )}

      {/* TAB 2 — Notificaciones */}
      {activeTab === 'notificaciones' && (
        <div className="max-w-3xl space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Evento</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Activo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">WhatsApp</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Browser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <tr key={n.key} className={`hover:bg-slate-50 transition ${!n.enabled ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{n.label}</td>
                    {(['enabled', 'email', 'whatsapp', 'browser'] as const).map((field) => (
                      <td key={field} className="px-4 py-3 text-center">
                        <button onClick={() => toggleNotif(n.key, field)} className="mx-auto flex justify-center text-brand-600">
                          {(n[field] as boolean) ? <ToggleRight size={20} /> : <ToggleLeft size={20} className="text-slate-300" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => showSuccess('Preferencias de notificaciones guardadas')}
            className="rounded-xl bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
            Guardar preferencias
          </button>
        </div>
      )}

      {/* TAB 3 — IA & Automatización */}
      {activeTab === 'ia' && (
        <div className="max-w-2xl space-y-6">
          {/* Provider */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900">Proveedor de IA</h2>
            <div className="grid grid-cols-3 gap-3">
              {AI_PROVIDERS.map((p) => (
                <button key={p.id}
                  onClick={() => !p.comingSoon && setAiProvider(p.id)}
                  className={`relative rounded-xl border p-3 text-sm font-semibold transition ${
                    aiProvider === p.id ? 'border-brand-500 bg-brand-50 text-brand-700' :
                    p.comingSoon ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed' :
                    'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                  {p.label}
                  {p.comingSoon && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">Pronto</span>}
                  {aiProvider === p.id && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Activo</span>}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Modelo para copiloto</label>
                <select value={copilotModel} onChange={(e) => setCopilotModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Modelo para resúmenes</label>
                <select value={summaryModel} onChange={(e) => setSummaryModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (rápido/económico)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-slate-900">Parámetros del modelo</h2>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-slate-700">Temperatura — Creatividad de las respuestas</label>
                <span className="font-bold text-brand-600">{temperature.toFixed(1)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-slate-400"><span>0 (preciso)</span><span>1 (creativo)</span></div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-slate-700">Tokens máximos por respuesta</label>
                <span className="font-bold text-brand-600">{maxTokens}</span>
              </div>
              <input type="range" min={100} max={2000} step={100} value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-slate-400"><span>100</span><span>2.000</span></div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-slate-700">Umbral de confianza para auto-respuesta</label>
                <span className="font-bold text-brand-600">{confidenceThreshold}%</span>
              </div>
              <input type="range" min={50} max={99} value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-slate-400"><span>50%</span><span>99%</span></div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Sugerencias de copiloto</label>
              <div className="flex gap-3">
                {([2, 3, 5] as const).map((n) => (
                  <button key={n} onClick={() => setCopilotSuggestions(n)}
                    className={`flex h-9 w-14 items-center justify-center rounded-xl border text-sm font-bold transition ${
                      copilotSuggestions === n ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900">Automatizaciones IA</h2>
            {[
              { label: 'Habilitar análisis de sentimiento', sub: 'Detecta emociones en cada mensaje del usuario', val: sentimentAnalysis, set: setSentimentAnalysis },
              { label: 'Auto-resumen al resolver conversación', sub: 'Genera un resumen IA al cerrar cada conversación', val: autoSummary, set: setAutoSummary },
              { label: 'QA scoring automático', sub: 'Puntúa automáticamente la calidad de respuestas', val: qaScoring, set: setQaScoring },
            ].map(({ label, sub, val, set }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
                <button onClick={() => set(!val)} className="text-brand-600">
                  {val ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-slate-300" />}
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
            className="w-full rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
            Guardar configuración IA
          </button>
        </div>
      )}

      {/* TAB 4 — Apariencia */}
      {activeTab === 'apariencia' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            {/* Color picker */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-900">Color del widget</h2>
              <div className="flex items-center gap-3 mb-3">
                {PRESET_COLORS.map((c) => (
                  <button key={c.hex} onClick={() => setWidgetColor(c.hex)} title={c.label}
                    style={{ backgroundColor: c.hex }}
                    className={`h-8 w-8 rounded-full cursor-pointer transition ${widgetColor === c.hex ? 'ring-2 ring-offset-2 ring-brand-600 scale-110' : 'hover:scale-105'}`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Hex personalizado:</label>
                <input type="text" value={customHex} onChange={(e) => setCustomHex(e.target.value)}
                  placeholder="#2563eb"
                  className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-400 font-mono" />
                <button onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(customHex)) setWidgetColor(customHex); }}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">
                  Aplicar
                </button>
              </div>
            </div>

            {/* Position */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-900">Posición del widget</h2>
              <div className="grid grid-cols-3 gap-3">
                {(['bottom-right', 'bottom-left', 'top-right'] as const).map((pos) => (
                  <button key={pos} onClick={() => setWidgetPosition(pos)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      widgetPosition === pos ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    {pos === 'bottom-right' ? 'Abajo derecha' : pos === 'bottom-left' ? 'Abajo izquierda' : 'Arriba derecha'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot name + greeting */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-slate-900">Personalización del bot</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre del bot</label>
                <input type="text" value={botName} onChange={(e) => setBotName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Mensaje de bienvenida</label>
                <textarea value={greetingMsg} onChange={(e) => setGreetingMsg(e.target.value)} rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-400" />
              </div>
            </div>

            {/* Avatar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-900">Avatar del bot</h2>
              <div className="flex gap-3">
                {BOT_AVATARS.map((av) => (
                  <button key={av.id} onClick={() => setSelectedAvatar(av.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition ${
                      selectedAvatar === av.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${av.bg} text-white`}>
                      <Bot size={18} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600">{av.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dark mode + Logo */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Modo oscuro del dashboard</p>
                  <p className="text-xs text-slate-500">Cambia el tema del panel de administración</p>
                </div>
                <button onClick={() => { setDarkMode(!darkMode); showInfo('Modo oscuro próximamente disponible.'); }} className="text-brand-600">
                  {darkMode ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-slate-300" />}
                </button>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">Logo de la organización</label>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-brand-400 transition">
                  <Upload size={20} className="text-slate-400" />
                  {logoFile ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{logoFile}</span>
                      <button onClick={(e) => { e.stopPropagation(); setLogoFile(null); }}
                        className="text-red-400 hover:text-red-600 transition"><X size={14} /></button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Arrastra tu logo aquí o haz clic para subir</p>
                  )}
                  <p className="text-[10px] text-slate-400">PNG, SVG, JPG — máx. 2 MB</p>
                </div>
                <input ref={logoInputRef} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setLogoFile(e.target.files[0].name); }} />
              </div>
            </div>

            <button onClick={() => showSuccess('Configuración de apariencia guardada')}
              className="w-full rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
              Guardar apariencia
            </button>
          </div>

          {/* Widget preview */}
          <div className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-900">Vista previa del widget</h2>
              <div className="relative bg-slate-100 rounded-xl overflow-hidden" style={{ height: 400 }}>
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
                    <div className="bg-white p-2">
                      <div className="rounded-xl rounded-tl-sm bg-slate-100 px-2 py-1.5 text-[10px] text-slate-700 leading-tight">
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
              <p className="mt-3 text-center text-xs text-slate-400">
                Vista previa — color: <span className="font-mono font-bold" style={{ color: widgetColor }}>{widgetColor}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AnimatePresence placeholder for future modals */}
      <AnimatePresence />
    </div>
  );
}
