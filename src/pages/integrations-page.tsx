import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { mockIntegrations } from '../data/mock';
import { useNotification } from '../contexts/NotificationContext';

interface CatalogItem {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  color: string;
  initials: string;
  estado: 'disponible' | 'conectado' | 'proximo';
}

interface WebhookEntry {
  id: string;
  evento: string;
  url: string;
  secret: string;
  estado: 'activo' | 'inactivo';
  lastTriggered: string;
}

interface IntegrationLog {
  id: string;
  timestamp: string;
  integracion: string;
  evento: string;
  estado: 'exitoso' | 'error' | 'pendiente';
  detalles: string;
}

const CATALOG: CatalogItem[] = [
  { id: 'salesforce', nombre: 'Salesforce', categoria: 'CRM', descripcion: 'CRM líder mundial para gestión de clientes y ventas', color: 'bg-blue-600', initials: 'SF', estado: 'disponible' },
  { id: 'hubspot', nombre: 'HubSpot', categoria: 'CRM', descripcion: 'Plataforma de marketing, ventas y servicio al cliente', color: 'bg-orange-500', initials: 'HS', estado: 'disponible' },
  { id: 'sisfamiliar', nombre: 'SISFAMILIAR', categoria: 'BD', descripcion: 'Base de datos de afiliados y núcleos familiares', color: 'bg-blue-700', initials: 'SF', estado: 'conectado' },
  { id: 'sap', nombre: 'SAP', categoria: 'ERP', descripcion: 'Sistema integrado de gestión empresarial', color: 'bg-sky-600', initials: 'SP', estado: 'disponible' },
  { id: 'openai', nombre: 'OpenAI GPT-4', categoria: 'IA', descripcion: 'Modelos de lenguaje para respuestas inteligentes', color: 'bg-emerald-600', initials: 'OA', estado: 'conectado' },
  { id: 'claude', nombre: 'Claude Anthropic', categoria: 'IA', descripcion: 'IA constitucional de alta fiabilidad y precisión', color: 'bg-violet-600', initials: 'CA', estado: 'disponible' },
  { id: 'twilio', nombre: 'Twilio SMS', categoria: 'Comunicación', descripcion: 'Envío de SMS y notificaciones programáticas', color: 'bg-red-500', initials: 'TW', estado: 'disponible' },
  { id: 'stripe', nombre: 'Stripe', categoria: 'Pagos', descripcion: 'Procesamiento de pagos y suscripciones en línea', color: 'bg-indigo-600', initials: 'ST', estado: 'proximo' },
  { id: 'zendesk', nombre: 'Zendesk', categoria: 'CRM', descripcion: 'Plataforma de soporte y tickets al cliente', color: 'bg-green-600', initials: 'ZD', estado: 'proximo' },
  { id: 'ga', nombre: 'Google Analytics', categoria: 'Analytics', descripcion: 'Análisis de tráfico y comportamiento web', color: 'bg-amber-500', initials: 'GA', estado: 'disponible' },
  { id: 'powerbi', nombre: 'Power BI', categoria: 'Analytics', descripcion: 'Dashboards empresariales de Microsoft', color: 'bg-yellow-500', initials: 'PB', estado: 'proximo' },
  { id: 'azuread', nombre: 'Azure AD / SSO', categoria: 'Seguridad', descripcion: 'Inicio de sesión único con Microsoft Azure', color: 'bg-blue-500', initials: 'AZ', estado: 'disponible' },
];

const MOCK_WEBHOOKS: WebhookEntry[] = [
  { id: 'wh1', evento: 'conversacion.escalada', url: 'https://api.comfaguajira.com/hooks/escalation', secret: 'whsec_abc123', estado: 'activo', lastTriggered: '2026-03-10T09:30:00Z' },
  { id: 'wh2', evento: 'campaña.completada', url: 'https://erp.comfaguajira.com/callbacks/campaign', secret: 'whsec_def456', estado: 'activo', lastTriggered: '2026-03-09T08:00:00Z' },
  { id: 'wh3', evento: 'pqrs.nueva', url: 'https://tickets.comfaguajira.com/hooks/pqrs', secret: 'whsec_ghi789', estado: 'inactivo', lastTriggered: '2026-03-08T14:00:00Z' },
];

const MOCK_LOGS: IntegrationLog[] = [
  { id: 'lg1', timestamp: '2026-03-10T09:55:00Z', integracion: 'SISFAMILIAR', evento: 'Sincronización incremental', estado: 'exitoso', detalles: '1.234 registros actualizados' },
  { id: 'lg2', timestamp: '2026-03-10T09:30:00Z', integracion: 'OpenAI GPT-4', evento: 'Generación de respuesta', estado: 'exitoso', detalles: 'Latencia: 420ms, tokens: 312' },
  { id: 'lg3', timestamp: '2026-03-10T08:15:00Z', integracion: 'Sistema de Certificados', evento: 'Consulta certificado', estado: 'exitoso', detalles: 'Certificado #C-20260310-0891 generado' },
  { id: 'lg4', timestamp: '2026-03-10T07:45:00Z', integracion: 'SISFAMILIAR', evento: 'Validación afiliado', estado: 'error', detalles: 'Timeout 30s — reintento programado' },
  { id: 'lg5', timestamp: '2026-03-09T18:00:00Z', integracion: 'OpenAI GPT-4', evento: 'Análisis de sentimiento', estado: 'exitoso', detalles: 'Sentimiento: negativo (0.82)' },
  { id: 'lg6', timestamp: '2026-03-09T17:30:00Z', integracion: 'Webhook pqrs.nueva', evento: 'Envío webhook', estado: 'exitoso', detalles: 'HTTP 200 — 145ms' },
  { id: 'lg7', timestamp: '2026-03-09T14:00:00Z', integracion: 'SISFAMILIAR', evento: 'Sincronización completa', estado: 'exitoso', detalles: '52.431 registros sincronizados' },
  { id: 'lg8', timestamp: '2026-03-09T10:00:00Z', integracion: 'Sistema de Certificados', evento: 'Consulta certificado', estado: 'pendiente', detalles: 'En cola de procesamiento' },
  { id: 'lg9', timestamp: '2026-03-09T08:00:00Z', integracion: 'Twilio SMS', evento: 'Envío SMS masivo', estado: 'exitoso', detalles: '4.820 mensajes enviados' },
  { id: 'lg10', timestamp: '2026-03-08T20:00:00Z', integracion: 'OpenAI GPT-4', evento: 'Resumen automático', estado: 'exitoso', detalles: '12 conversaciones resumidas' },
];

const CAT_COLORS: Record<string, string> = {
  CRM: 'bg-blue-100 text-blue-700',
  BD: 'bg-violet-100 text-violet-700',
  ERP: 'bg-sky-100 text-sky-700',
  IA: 'bg-emerald-100 text-emerald-700',
  Comunicación: 'bg-orange-100 text-orange-700',
  Pagos: 'bg-indigo-100 text-indigo-700',
  Analytics: 'bg-amber-100 text-amber-700',
  Seguridad: 'bg-red-100 text-red-700',
};

const LOG_STATUS: Record<string, string> = {
  exitoso: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-red-600',
  pendiente: 'bg-amber-100 text-amber-700',
};

export function IntegrationsPage() {
  const { showSuccess, showError, showInfo } = useNotification();
  const [connectingItem, setConnectingItem] = useState<CatalogItem | null>(null);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>(MOCK_WEBHOOKS);
  const [newWh, setNewWh] = useState({ evento: '', url: '' });
  const webhookUrl = `https://api.comfaguajira-chatbot.com/integrations/${connectingItem?.id ?? 'new'}/webhook`;

  function handleCopy() {
    void navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleTest() {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setTesting(false);
    const success = Math.random() > 0.3;
    if (success) {
      showSuccess('Conexión exitosa. 52.431 registros encontrados.');
    } else {
      showError('Error de conexión. Verifica las credenciales e intenta de nuevo.');
    }
  }

  function handleSaveConnection() {
    if (!connectingItem) return;
    showSuccess(`Integración con ${connectingItem.nombre} configurada correctamente`);
    setConnectingItem(null);
    setApiKey('');
    setClientId('');
    setClientSecret('');
  }

  function addWebhook() {
    if (!newWh.evento || !newWh.url) return;
    setWebhooks((prev) => [...prev, {
      id: `wh-${Date.now()}`,
      evento: newWh.evento,
      url: newWh.url,
      secret: `whsec_${Math.random().toString(36).slice(2, 10)}`,
      estado: 'activo',
      lastTriggered: '-',
    }]);
    setNewWh({ evento: '', url: '' });
    setShowNewWebhook(false);
    showSuccess('Webhook creado correctamente');
  }

  function removeWebhook(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    showInfo('Webhook eliminado');
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hub de Integraciones</h1>
        <p className="mt-1 text-sm text-slate-500">Conecta COMFAGUAJIRA con tus sistemas internos y plataformas externas</p>
      </div>

      {/* Section 1 — Active integrations */}
      <section>
        <h2 className="mb-4 font-bold text-slate-800 flex items-center gap-2">
          <Plug size={16} className="text-emerald-600" /> Integraciones activas
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {mockIntegrations.map((int) => (
            <div key={int.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${int.color} text-white text-sm font-bold`}>
                  {int.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{int.nombre}</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Conectado</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Última sincronización: {int.lastSync ? new Date(int.lastSync).toLocaleString('es-CO') : '-'}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {int.registros.toLocaleString()} registros
                  </p>
                </div>
                <RefreshCw size={14} className="text-slate-300 flex-shrink-0 mt-1" />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => showSuccess(`Sincronizando ${int.nombre}...`)}
                  className="flex-1 rounded-xl border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                  Editar
                </button>
                <button onClick={() => showInfo(`¿Desconectar ${int.nombre}? Esta acción detendrá la sincronización.`)}
                  className="flex-1 rounded-xl border border-red-100 bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition">
                  Desconectar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2 — Catalog */}
      <section>
        <h2 className="mb-4 font-bold text-slate-800">Catálogo de integraciones</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATALOG.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${item.color} text-white text-xs font-bold`}>
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{item.nombre}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CAT_COLORS[item.categoria] ?? 'bg-slate-100 text-slate-600'}`}>
                    {item.categoria}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{item.descripcion}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                  item.estado === 'conectado' ? 'bg-emerald-100 text-emerald-700' :
                  item.estado === 'proximo' ? 'bg-slate-100 text-slate-500' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {item.estado === 'conectado' ? 'Conectado' : item.estado === 'proximo' ? 'Próximamente' : 'Disponible'}
                </span>
                {item.estado === 'proximo' ? (
                  <button onClick={() => showInfo('Esta integración estará disponible próximamente.')}
                    className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 cursor-not-allowed">
                    Pronto
                  </button>
                ) : item.estado === 'conectado' ? (
                  <button onClick={() => showSuccess(`${item.nombre} ya está conectado y activo.`)}
                    className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Activo
                  </button>
                ) : (
                  <button onClick={() => setConnectingItem(item)}
                    className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition">
                    Conectar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Webhooks */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ExternalLink size={16} className="text-brand-600" /> Webhooks entrantes
          </h2>
          <button onClick={() => setShowNewWebhook(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
            <Plus size={14} /> Nuevo webhook
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                {['Evento', 'URL', 'Estado', 'Último disparo', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {webhooks.map((wh) => (
                <tr key={wh.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{wh.evento}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{wh.url}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${wh.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {wh.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {wh.lastTriggered === '-' ? '-' : new Date(wh.lastTriggered).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => removeWebhook(wh.id)} className="text-red-400 hover:text-red-600 transition">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4 — Integration logs */}
      <section>
        <h2 className="mb-4 font-bold text-slate-800">Logs de integración</h2>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                {['Timestamp', 'Integración', 'Evento', 'Estado', 'Detalles'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">{log.integracion}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{log.evento}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${LOG_STATUS[log.estado]}`}>
                      {log.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">{log.detalles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Connect modal */}
      <AnimatePresence>
        {connectingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${connectingItem.color} text-white text-sm font-bold`}>
                  {connectingItem.initials}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Conectar {connectingItem.nombre}</h3>
                  <p className="text-xs text-slate-500">{connectingItem.categoria}</p>
                </div>
                <button onClick={() => setConnectingItem(null)} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">API Key</label>
                  <div className="flex gap-2">
                    <input type={showSecret ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-••••••••••••••••"
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
                    <button onClick={() => setShowSecret(!showSecret)} className="rounded-xl border border-slate-200 px-3 text-slate-400 hover:bg-slate-50 transition">
                      {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Client ID</label>
                  <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)}
                    placeholder="client_id_here"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Client Secret</label>
                  <div className="flex gap-2">
                    <input type={showClientSecret ? 'text' : 'password'} value={clientSecret} onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
                    <button onClick={() => setShowClientSecret(!showClientSecret)} className="rounded-xl border border-slate-200 px-3 text-slate-400 hover:bg-slate-50 transition">
                      {showClientSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Webhook URL (auto-generada)</label>
                  <div className="flex gap-2">
                    <input type="text" value={webhookUrl} readOnly
                      className="flex-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500 outline-none font-mono" />
                    <button onClick={handleCopy} className="rounded-xl border border-slate-200 px-3 text-slate-400 hover:bg-slate-50 transition">
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => void handleTest()} disabled={testing}
                    className="flex-1 rounded-xl border border-brand-200 bg-brand-50 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition disabled:opacity-50">
                    {testing ? 'Probando...' : 'Probar conexión'}
                  </button>
                  <button onClick={handleSaveConnection}
                    className="flex-1 rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New webhook modal */}
      <AnimatePresence>
        {showNewWebhook && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Nuevo webhook</h3>
                <button onClick={() => setShowNewWebhook(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"><X size={15} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Tipo de evento</label>
                  <select value={newWh.evento} onChange={(e) => setNewWh((w) => ({ ...w, evento: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                    <option value="">Seleccionar evento...</option>
                    {['conversacion.nueva', 'conversacion.escalada', 'conversacion.resuelta', 'pqrs.nueva', 'campaña.completada', 'error.integracion'].map((ev) => (
                      <option key={ev} value={ev}>{ev}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">URL de destino</label>
                  <input type="url" value={newWh.url} onChange={(e) => setNewWh((w) => ({ ...w, url: e.target.value }))}
                    placeholder="https://tu-sistema.com/webhook"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
                </div>
                <button onClick={addWebhook} className="w-full rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
                  Crear webhook
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
