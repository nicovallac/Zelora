import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Copy,
  ExternalLink,
  LayoutTemplate,
  MonitorSmartphone,
  Save,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/primitives';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import type { WebWidgetConnectionApiItem } from '../services/api';

interface WebWidgetSettings {
  enabled: boolean;
  organizationSlug: string;
  widgetName: string;
  greetingMessage: string;
  brandColor: string;
  position: 'bottom-right' | 'bottom-left';
  allowedDomains: string[];
  launcherLabel: string;
  requireConsent: boolean;
  handoffEnabled: boolean;
  embedSnippet: string;
  widgetScriptUrl: string;
  publicDemoUrl: string;
  installStatus: string;
  verifiedDomains: string[];
  lastInstallCheckAt: string | null;
}

const DEFAULT_SETTINGS: WebWidgetSettings = {
  enabled: false,
  organizationSlug: '',
  widgetName: 'Asistente web',
  greetingMessage: 'Hola. En que podemos ayudarte hoy?',
  brandColor: '#0f766e',
  position: 'bottom-right',
  allowedDomains: [],
  launcherLabel: 'Hablar con soporte',
  requireConsent: true,
  handoffEnabled: true,
  embedSnippet: '',
  widgetScriptUrl: '',
  publicDemoUrl: '',
  installStatus: 'not_installed',
  verifiedDomains: [],
  lastInstallCheckAt: null,
};

function mapApiConnectionToUi(connection: WebWidgetConnectionApiItem): WebWidgetSettings {
  return {
    enabled: connection.is_active,
    organizationSlug: connection.organization_slug,
    widgetName: connection.widget_name,
    greetingMessage: connection.greeting_message,
    brandColor: connection.brand_color,
    position: connection.position === 'bottom-left' ? 'bottom-left' : 'bottom-right',
    allowedDomains: connection.allowed_domains ?? [],
    launcherLabel: connection.launcher_label,
    requireConsent: connection.require_consent,
    handoffEnabled: connection.handoff_enabled,
    embedSnippet: connection.embed_snippet,
    widgetScriptUrl: connection.widget_script_url,
    publicDemoUrl: connection.public_demo_url,
    installStatus: connection.install_status,
    verifiedDomains: connection.verified_domains ?? [],
    lastInstallCheckAt: connection.last_install_check_at,
  };
}

function SectionCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-3xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 p-5 shadow-card backdrop-blur-md"
      style={{ boxShadow: 'var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.70)' }}
    >
      <div className="mb-4">
        <p className="page-eyebrow">{eyebrow}</p>
        <p className="text-[15px] font-bold text-ink-900" style={{ letterSpacing: '-0.015em' }}>{title}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink-900">{label}</p>
        {description ? <p className="mt-0.5 text-[11px] text-ink-400">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-brand-500' : 'bg-[rgba(17,17,16,0.15)]'
        }`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[rgba(17,17,16,0.08)] bg-white/70 px-3 py-2 text-[11px] shadow-card">
      <span className="font-semibold text-ink-400">{label}</span>
      <span className="ml-2 font-semibold text-ink-800">{value}</span>
    </div>
  );
}

function WebWidgetPreview({ settings }: { settings: WebWidgetSettings }) {
  const launcherJustify = settings.position === 'bottom-left' ? 'justify-start' : 'justify-end';

  return (
    <div className="overflow-hidden rounded-[30px] shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
      <div className="relative h-[590px] overflow-hidden bg-[linear-gradient(180deg,#f7fafc_0%,#eef6ff_100%)]">
        <div className="h-[188px] bg-[linear-gradient(140deg,rgba(15,118,110,0.18),rgba(59,130,246,0.12)_48%,rgba(255,255,255,0.92)_100%)] px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-400">Web Widget</p>
          <h3 className="mt-2 max-w-[240px] text-[24px] font-semibold tracking-[-0.04em] text-ink-950">
            Chat web listo para vender y atender.
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatPill label="Estado" value={settings.enabled ? 'Activo' : 'Borrador'} />
            <StatPill label="Posicion" value={settings.position === 'bottom-left' ? 'Izquierda' : 'Derecha'} />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 top-[118px] rounded-t-[34px] bg-white px-4 pb-4 pt-4">
          <div className="flex h-full flex-col">
            <div className={`mb-4 flex ${launcherJustify}`}>
              <button
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white shadow-card"
                style={{ backgroundColor: settings.brandColor }}
              >
                <Sparkles size={14} />
                {settings.launcherLabel || 'Hablar con soporte'}
              </button>
            </div>

            <div className="min-h-0 flex-1 rounded-[26px] border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] p-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <div className="flex h-full flex-col overflow-hidden rounded-[22px] bg-white">
                <div className="flex items-start gap-3 border-b border-[rgba(17,17,16,0.07)] px-4 py-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-card"
                    style={{ backgroundColor: settings.brandColor }}
                  >
                    <LayoutTemplate size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">{settings.widgetName || 'Asistente web'}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {settings.requireConsent ? 'Con consentimiento previo' : 'Acceso directo'}
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  <div className="flex justify-start">
                    <div className="max-w-[82%] rounded-[18px] rounded-bl-md border border-[rgba(17,17,16,0.08)] bg-white px-3.5 py-3 text-[13px] leading-[1.45] text-ink-800 shadow-card">
                      {settings.greetingMessage || 'Hola. En que podemos ayudarte hoy?'}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[72%] rounded-[18px] rounded-br-md px-3.5 py-3 text-[13px] leading-[1.45] text-white shadow-card" style={{ backgroundColor: settings.brandColor }}>
                      Hola, quiero ayuda para comprar
                    </div>
                  </div>
                </div>

                <div className="border-t border-[rgba(17,17,16,0.07)] px-3 py-3">
                  <div className="flex items-center gap-2 rounded-[18px] border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] px-3 py-2">
                    <input
                      readOnly
                      value=""
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
                    />
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: settings.brandColor }}
                    >
                      <Zap size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/80 px-4 py-2.5 text-[13px] text-ink-800 outline-none placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition';
const selectClass = `${inputClass} cursor-pointer appearance-none`;

export function WebAppPage() {
  const { showError, showSuccess } = useNotification();
  const [settings, setSettings] = useState<WebWidgetSettings>(DEFAULT_SETTINGS);
  const [domainInput, setDomainInput] = useState('');
  const [testMessage, setTestMessage] = useState('Hola, quiero ayuda para comprar');
  const [sendingTest, setSendingTest] = useState(false);
  const [testIntent, setTestIntent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadConnection() {
      try {
        const data = await api.getWebWidgetConnection();
        if (cancelled) return;
        setSettings(mapApiConnectionToUi(data));
      } catch (error) {
        if (cancelled) return;
        showError('Web Widget', error instanceof Error ? error.message : 'No se pudo cargar la configuracion del widget.');
      }
    }

    void loadConnection();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  function set<K extends keyof WebWidgetSettings>(key: K, value: WebWidgetSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function addDomain() {
    const value = domainInput.trim().toLowerCase();
    if (!value || settings.allowedDomains.includes(value)) return;
    set('allowedDomains', [...settings.allowedDomains, value]);
    setDomainInput('');
  }

  function removeDomain(domain: string) {
    set('allowedDomains', settings.allowedDomains.filter((item) => item !== domain));
  }

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(settings.embedSnippet);
      showSuccess('Snippet copiado');
    } catch {
      showError('Web Widget', 'No se pudo copiar el snippet.');
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const updated = await api.updateWebWidgetConnection({
        is_active: settings.enabled,
        widget_name: settings.widgetName,
        greeting_message: settings.greetingMessage,
        brand_color: settings.brandColor,
        position: settings.position,
        allowed_domains: settings.allowedDomains,
        launcher_label: settings.launcherLabel,
        require_consent: settings.requireConsent,
        handoff_enabled: settings.handoffEnabled,
      });
      setSettings(mapApiConnectionToUi(updated));
      showSuccess('Web Widget guardado');
    } catch (error) {
      showError('Web Widget', error instanceof Error ? error.message : 'No se pudo guardar la configuracion.');
    } finally {
      setSaving(false);
    }
  }

  async function verifyInstall() {
    setVerifying(true);
    try {
      const result = await api.verifyWebWidgetInstall();
      setSettings((current) => ({
        ...current,
        installStatus: result.install_status,
        verifiedDomains: result.verified_domains,
        lastInstallCheckAt: result.last_install_check_at,
      }));
      showSuccess('Comprobacion registrada', 'La instalacion queda pendiente de verificacion real.');
    } catch (error) {
      showError('Web Widget', error instanceof Error ? error.message : 'No se pudo verificar la instalacion.');
    } finally {
      setVerifying(false);
    }
  }

  async function sendTestMessage() {
    if (!settings.organizationSlug || !testMessage.trim()) return;
    setSendingTest(true);
    try {
      const response = await api.sendWebChatMessage({
        organization_slug: settings.organizationSlug,
        session_id: `web-widget-${Date.now()}`,
        message: testMessage.trim(),
        nombre: 'Cliente demo',
      });
      setTestIntent(response.intent);
      showSuccess('Prueba enviada', 'La conversacion entro al canal web y deberia aparecer en Inbox.');
    } catch (error) {
      showError('Web Widget', error instanceof Error ? error.message : 'No se pudo enviar la prueba.');
    } finally {
      setSendingTest(false);
    }
  }

  const overviewStats = useMemo(
    () => [
      { label: 'Estado', value: settings.enabled ? 'Activo' : 'Borrador' },
      { label: 'Dominios', value: String(settings.allowedDomains.length) },
      { label: 'Launcher', value: settings.launcherLabel || 'Sin texto' },
      { label: 'Instalacion', value: settings.installStatus || 'Pendiente' },
    ],
    [settings.allowedDomains.length, settings.enabled, settings.installStatus, settings.launcherLabel],
  );

  return (
    <div className="page-shell">
      <div className="page-stack gap-3">
        <PageHeader
          eyebrow="Canales · Web Widget"
          title="Web Widget"
          description="Configura el chat web de la marca, valida dominios y prueba el canal antes de publicarlo."
          actions={(
            <>
              <Button variant="secondary" size="sm" onClick={() => void verifyInstall()} disabled={verifying}>
                <ShieldCheck size={13} />
                {verifying ? 'Comprobando...' : 'Comprobar'}
              </Button>
              <Button size="sm" onClick={() => void saveSettings()} disabled={saving}>
                <Save size={13} />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </>
          )}
        />

        <div className="flex flex-wrap gap-2">
          {overviewStats.map((item) => (
            <StatPill key={item.label} label={item.label} value={item.value} />
          ))}
        </div>

        <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.06fr)_380px]">
          <div className="order-2 min-h-0 space-y-3 xl:order-1">
            <SectionCard eyebrow="Identidad" title="Nombre, saludo y lanzamiento">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombre del widget">
                  <input value={settings.widgetName} onChange={(event) => set('widgetName', event.target.value)} className={inputClass} />
                </Field>
                <Field label="Texto del launcher">
                  <input value={settings.launcherLabel} onChange={(event) => set('launcherLabel', event.target.value)} className={inputClass} />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Mensaje de bienvenida">
                  <textarea
                    value={settings.greetingMessage}
                    onChange={(event) => set('greetingMessage', event.target.value)}
                    rows={3}
                    className={inputClass}
                    style={{ resize: 'none' }}
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard eyebrow="Apariencia" title="Look basico del widget">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Color principal">
                  <div className="flex items-center gap-3 rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2.5">
                    <input type="color" value={settings.brandColor} onChange={(event) => set('brandColor', event.target.value)} className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                    <div>
                      <p className="font-mono text-[12px] font-medium text-ink-700">{settings.brandColor}</p>
                    </div>
                  </div>
                </Field>
                <Field label="Posicion del launcher">
                  <div className="relative">
                    <select value={settings.position} onChange={(event) => set('position', event.target.value as WebWidgetSettings['position'])} className={selectClass}>
                      <option value="bottom-right">Derecha</option>
                      <option value="bottom-left">Izquierda</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
              </div>
              <div className="mt-3 space-y-1 divide-y divide-[rgba(17,17,16,0.06)]">
                <Toggle checked={settings.enabled} onChange={(value) => set('enabled', value)} label="Widget activo" description="Activa el launcher cuando el sitio ya este listo." />
                <div className="pt-1">
                  <Toggle checked={settings.handoffEnabled} onChange={(value) => set('handoffEnabled', value)} label="Permitir asesor humano" description="Escala la conversacion a Inbox cuando haga falta." />
                </div>
                <div className="pt-1">
                  <Toggle checked={settings.requireConsent} onChange={(value) => set('requireConsent', value)} label="Solicitar consentimiento" description="Pide aceptacion antes de iniciar la conversacion." />
                </div>
              </div>
            </SectionCard>

            <SectionCard eyebrow="Seguridad" title="Dominios permitidos">
              <div className="flex gap-2">
                <input
                  value={domainInput}
                  onChange={(event) => setDomainInput(event.target.value)}
                  placeholder="ej. tienda.com"
                  className={inputClass}
                />
                <button onClick={addDomain} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800">
                  Agregar
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {settings.allowedDomains.length === 0 ? (
                  <span className="rounded-full bg-[rgba(17,17,16,0.06)] px-3 py-1.5 text-[11px] font-semibold text-ink-400">Sin dominios autorizados</span>
                ) : null}
                {settings.allowedDomains.map((domain) => (
                  <button key={domain} onClick={() => removeDomain(domain)} className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white">
                    {domain}
                  </button>
                ))}
              </div>
              {settings.verifiedDomains.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Dominios verificados</p>
                  <p className="mt-2 text-[13px] text-ink-700">{settings.verifiedDomains.join(', ')}</p>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard eyebrow="Instalacion" title="Snippet y demo publica">
              <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-ink-950 p-4 text-xs text-sky-100">
                <code>{settings.embedSnippet || 'Snippet no disponible'}</code>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => void copySnippet()} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white">
                  <Copy size={11} />
                  Copiar snippet
                </button>
                {settings.publicDemoUrl ? (
                  <a href={settings.publicDemoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white">
                    <ExternalLink size={11} />
                    Abrir demo
                  </a>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Prueba" title="Enviar trafico real al canal">
              <Field label="Mensaje de prueba">
                <textarea
                  value={testMessage}
                  onChange={(event) => setTestMessage(event.target.value)}
                  rows={3}
                  className={inputClass}
                  style={{ resize: 'none' }}
                />
              </Field>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => void sendTestMessage()} disabled={sendingTest || !settings.organizationSlug} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                  {sendingTest ? 'Enviando...' : 'Enviar prueba'}
                </button>
                <Link to="/inbox" className="rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-white">
                  Abrir inbox
                </Link>
              </div>
              <div className="mt-4 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] p-4 text-[13px] text-ink-700">
                <p><span className="font-semibold text-ink-900">Marca:</span> {settings.organizationSlug || 'Sin slug disponible'}</p>
                <p className="mt-1"><span className="font-semibold text-ink-900">Intent detectado:</span> {testIntent || 'Aun sin prueba'}</p>
                <p className="mt-1"><span className="font-semibold text-ink-900">Ultima verificacion:</span> {settings.lastInstallCheckAt ? new Date(settings.lastInstallCheckAt).toLocaleString('es-CO') : 'Sin verificacion'}</p>
              </div>
            </SectionCard>
          </div>

          <aside className="order-1 xl:order-2">
            <div className="xl:sticky xl:top-3 xl:pr-1">
              <div
                className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 shadow-card backdrop-blur-md"
                style={{ boxShadow: 'var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.70)' }}
              >
                <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.07)] px-4 py-3">
                  <p className="page-eyebrow">Vista previa</p>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    settings.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100/70 text-ink-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${settings.enabled ? 'bg-emerald-500' : 'bg-ink-400'}`} />
                    {settings.enabled ? 'Activo' : 'Borrador'}
                  </span>
                </div>
                <WebWidgetPreview settings={settings} />
                <div className="flex justify-center border-t border-[rgba(17,17,16,0.07)] py-3">
                  {settings.publicDemoUrl ? (
                    <a href={settings.publicDemoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white">
                      <MonitorSmartphone size={11} />
                      Abrir demo real
                    </a>
                  ) : (
                    <span className="text-[11px] font-semibold text-ink-400">La demo publica aparecera aqui</span>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
