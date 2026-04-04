import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  Activity,
  Link2,
  MessagesSquare,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Smartphone,
  SquareStack,
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import type {
  CampaignTemplateApiItem,
  WhatsAppConnectionApiItem,
  WhatsAppConnectionPayload,
  WhatsAppEmbeddedSignupConfig,
  WhatsAppEmbeddedSignupSession,
} from '../services/api';
import type {
  AuditEvent,
  HealthEvent,
  OnboardingStep,
  PhoneNumberInfo,
  TemplateInfo,
  WebhookDiagnostic,
  WhatsAppConnection,
  WhatsAppSettings,
} from '../data/whatsapp-management';
import { AuditLogTable } from '../components/whatsapp/audit-log-table';
import { CapabilityStatusCard } from '../components/whatsapp/capability-status-card';
import { ConnectionStatusCard } from '../components/whatsapp/connection-status-card';
import { HealthTimeline } from '../components/whatsapp/health-timeline';
import { OnboardingStepCard } from '../components/whatsapp/onboarding-step-card';
import { PhoneNumberCard } from '../components/whatsapp/phone-number-card';
import { ReconnectBanner } from '../components/whatsapp/reconnect-banner';
import { SettingsForm } from '../components/whatsapp/settings-form';
import { TemplateSyncCard } from '../components/whatsapp/template-sync-card';
import { WarningAlert } from '../components/whatsapp/warning-alert';
import { WebhookHealthCard } from '../components/whatsapp/webhook-health-card';
import { PageHeader } from '../components/ui/page-header';

declare global {
  interface Window {
    FB?: {
      init: (options: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } } | undefined) => void,
        options?: Record<string, unknown>,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type WhatsAppSection =
  | 'overview'
  | 'setup'
  | 'phone_numbers'
  | 'webhooks'
  | 'templates'
  | 'health'
  | 'audit'
  | 'settings';

type EmbeddedSignupMessage = {
  business_portfolio_id?: string;
  whatsapp_business_account_id?: string;
  phone_number_id?: string;
  display_phone_number?: string;
  verified_name?: string;
};

const SECTIONS: Array<{ id: WhatsAppSection; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'setup', label: 'Connection Setup', icon: Link2 },
  { id: 'phone_numbers', label: 'Phone Numbers', icon: Smartphone },
  { id: 'webhooks', label: 'Webhooks', icon: ShieldCheck },
  { id: 'templates', label: 'Templates', icon: SquareStack },
  { id: 'health', label: 'Health & Limits', icon: Activity },
  { id: 'audit', label: 'Audit Log', icon: MessagesSquare },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const EMPTY_CONNECTION: WhatsAppConnection = {
  id: '',
  organizationId: 'current-org',
  whatsappBusinessAccountId: null,
  businessPortfolioId: null,
  phoneNumberId: null,
  displayPhoneNumber: null,
  verifiedName: null,
  connectionStatus: 'not_connected',
  onboardingStatus: 'not_started',
  webhookStatus: 'pending',
  templateSyncStatus: 'never',
  qualityStatus: 'unknown',
  messagingLimitStatus: 'unknown',
  capabilities: [],
  lastSyncAt: null,
  lastWebhookReceivedAt: null,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

const EMPTY_SETTINGS: WhatsAppSettings = {
  defaultSendBehavior: 'assistant_first',
  fallbackHandling: 'router_decides',
  autoSyncTemplates: true,
  alertOnWebhookFailure: true,
  internalLabel: '',
  internalNotes: '',
};

const RECOVERY_FORM = {
  accessToken: '',
  phoneNumberId: '',
  wabaId: '',
  businessPortfolioId: '',
  displayPhoneNumber: '',
  verifiedName: '',
};

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString('es-CO') : '-';
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function inferConnectionStatus(connection: WhatsAppConnectionApiItem): WhatsAppConnection['connectionStatus'] {
  if (!connection.phone_number_id) {
    return connection.onboarding_status === 'embedded_signup_started' ? 'connecting' : 'not_connected';
  }
  if (!connection.is_active) {
    return connection.onboarding_status === 'failed' ? 'disconnected' : 'degraded';
  }
  if (connection.webhook_status === 'failed' || connection.quality_status === 'critical') {
    return 'requires_attention';
  }
  if (connection.webhook_status === 'stale' || connection.quality_status === 'warning') {
    return 'degraded';
  }
  return 'connected';
}

function mapApiConnectionToUi(connection: WhatsAppConnectionApiItem): WhatsAppConnection {
  return {
    id: connection.id,
    organizationId: 'current-org',
    whatsappBusinessAccountId: connection.whatsapp_business_account_id || null,
    businessPortfolioId: connection.business_portfolio_id || null,
    phoneNumberId: connection.phone_number_id || null,
    displayPhoneNumber: connection.display_phone_number || null,
    verifiedName: connection.verified_name || null,
    connectionStatus: inferConnectionStatus(connection),
    onboardingStatus: (connection.onboarding_status as WhatsAppConnection['onboardingStatus']) || 'not_started',
    webhookStatus: (connection.webhook_status as WhatsAppConnection['webhookStatus']) || 'pending',
    templateSyncStatus: (connection.template_sync_status as WhatsAppConnection['templateSyncStatus']) || 'never',
    qualityStatus: (connection.quality_status as WhatsAppConnection['qualityStatus']) || 'unknown',
    messagingLimitStatus: connection.messaging_limit_status || 'unknown',
    capabilities: connection.capabilities ?? [],
    lastSyncAt: connection.last_sync_at,
    lastWebhookReceivedAt: connection.last_webhook_received_at,
    createdAt: connection.created_at,
    updatedAt: connection.updated_at,
  };
}

function mapApiConnectionToSettings(connection: WhatsAppConnectionApiItem): WhatsAppSettings {
  return {
    defaultSendBehavior: connection.default_send_behavior === 'human_first' ? 'human_first' : 'assistant_first',
    fallbackHandling: connection.fallback_handling === 'queue_human' ? 'queue_human' : 'router_decides',
    autoSyncTemplates: connection.auto_sync_templates,
    alertOnWebhookFailure: connection.alert_on_webhook_failure,
    internalLabel: connection.internal_label || '',
    internalNotes: connection.internal_notes || '',
  };
}

function mapCampaignTemplateToWhatsAppTemplate(template: CampaignTemplateApiItem): TemplateInfo {
  return {
    id: template.id,
    name: template.name,
    category: template.tipo,
    language: 'es_CO',
    status: template.status === 'draft' ? 'pending' : template.status,
    updatedAt: template.updated_at,
  };
}

function buildOnboardingSteps(
  connection: WhatsAppConnection,
  signupConfig: WhatsAppEmbeddedSignupConfig | null,
): OnboardingStep[] {
  const sessionStatus = signupConfig?.session_status ?? 'idle';
  const completed = connection.onboardingStatus === 'completed';
  const failed = connection.onboardingStatus === 'failed' || sessionStatus === 'failed';
  const started = ['embedded_signup_started', 'meta_authorized', 'phone_linked', 'completed'].includes(connection.onboardingStatus);
  const authorized = ['meta_authorized', 'phone_linked', 'completed'].includes(connection.onboardingStatus);
  const phoneLinked = ['phone_linked', 'completed'].includes(connection.onboardingStatus);
  const webhookDone = connection.webhookStatus === 'verified';

  return [
    {
      id: 'launch',
      title: 'Launch Embedded Signup',
      description: signupConfig?.enabled
        ? 'Zelora abre el flujo oficial de Meta para que el cliente conecte su propio negocio y su propio numero.'
        : 'Falta configurar META_APP_ID y META_EMBEDDED_SIGNUP_CONFIG_ID en la plataforma.',
      status: failed ? 'failed' : started ? 'done' : 'current',
    },
    {
      id: 'authorize',
      title: 'Authorize business and WABA',
      description: 'Meta devuelve el permiso de acceso, la WABA y la asociacion con el negocio del cliente.',
      status: failed ? 'failed' : authorized ? 'done' : started ? 'current' : 'pending',
    },
    {
      id: 'phone',
      title: 'Link phone number',
      description: 'La conexion debe devolver phone_number_id, numero visible y nombre verificado.',
      status: failed ? 'failed' : phoneLinked ? 'done' : authorized ? 'current' : 'pending',
    },
    {
      id: 'webhook',
      title: 'Verify webhook',
      description: 'Zelora valida challenge, firma y salud del endpoint publico de recepcion.',
      status: failed ? 'failed' : webhookDone ? 'done' : phoneLinked ? 'current' : 'pending',
    },
    {
      id: 'operate',
      title: 'Ready for inbox and campaigns',
      description: 'La organizacion ya puede usar inbox, templates, campanas y automatizaciones sobre su propia conexion.',
      status: completed && webhookDone ? 'done' : webhookDone ? 'current' : 'pending',
    },
  ];
}

function buildDiagnostics(connection: WhatsAppConnection, signupConfig: WhatsAppEmbeddedSignupConfig | null): WebhookDiagnostic[] {
  const diagnostics: WebhookDiagnostic[] = [];

  diagnostics.push({
    id: 'endpoint',
    title: signupConfig?.webhook_url ? 'Webhook endpoint ready' : 'Webhook endpoint pending',
    severity: signupConfig?.webhook_url ? 'info' : 'warning',
    description: signupConfig?.webhook_url
      ? 'La URL de callback esta publicada por Zelora y lista para ser registrada en Meta.'
      : 'Falta resolver la URL publica del webhook antes de usar trafico real.',
  });

  if (connection.webhookStatus === 'verified') {
    diagnostics.push({
      id: 'verified',
      title: 'Webhook verified',
      severity: 'info',
      description: 'El challenge de Meta se valido correctamente y el endpoint quedo marcado como verificado.',
    });
  } else if (connection.phoneNumberId) {
    diagnostics.push({
      id: 'verify_pending',
      title: 'Webhook verification pending',
      severity: 'warning',
      description: 'La conexion ya tiene numero enlazado, pero aun falta validar challenge o recibir eventos frescos.',
    });
  } else {
    diagnostics.push({
      id: 'no_binding',
      title: 'No phone binding yet',
      severity: 'warning',
      description: 'Hasta que Embedded Signup devuelva un phone_number_id no se puede resolver la organizacion en inbound.',
    });
  }

  if (connection.lastWebhookReceivedAt) {
    diagnostics.push({
      id: 'freshness',
      title: 'Webhook freshness',
      severity: 'info',
      description: `Ultimo evento recibido: ${formatDateTime(connection.lastWebhookReceivedAt)}.`,
    });
  } else {
    diagnostics.push({
      id: 'freshness_missing',
      title: 'No inbound events yet',
      severity: 'warning',
      description: 'Todavia no hay eventos entrantes procesados. Esto es normal si la conexion acaba de completarse.',
    });
  }

  return diagnostics;
}

function buildHealthTimeline(connection: WhatsAppConnection, templates: TemplateInfo[]): HealthEvent[] {
  const events: HealthEvent[] = [];

  if (connection.createdAt && connection.createdAt !== EMPTY_CONNECTION.createdAt) {
    events.push({
      id: 'created',
      timestamp: connection.createdAt,
      title: 'Connection created',
      status: connection.connectionStatus === 'connected' ? 'healthy' : 'degraded',
      description: 'La organizacion registro la conexion base de WhatsApp en Zelora.',
    });
  }
  if (connection.lastWebhookReceivedAt) {
    events.push({
      id: 'webhook-last',
      timestamp: connection.lastWebhookReceivedAt,
      title: 'Last webhook received',
      status: connection.webhookStatus === 'verified' ? 'healthy' : 'warning',
      description: 'Meta envio un evento que fue recibido y procesado por el backend.',
    });
  }
  if (connection.lastSyncAt) {
    events.push({
      id: 'templates-sync',
      timestamp: connection.lastSyncAt,
      title: 'Template sync',
      status: connection.templateSyncStatus === 'failed' ? 'warning' : 'healthy',
      description: `${templates.length} plantillas visibles en el catalogo actual.`,
    });
  }
  if (connection.updatedAt && connection.updatedAt !== EMPTY_CONNECTION.updatedAt) {
    events.push({
      id: 'updated',
      timestamp: connection.updatedAt,
      title: 'Connection updated',
      status:
        connection.connectionStatus === 'requires_attention'
          ? 'requires_attention'
          : connection.connectionStatus === 'connected'
            ? 'healthy'
            : 'degraded',
      description: 'Se registraron cambios operativos en la configuracion de WhatsApp.',
    });
  }

  if (events.length === 0) {
    events.push({
      id: 'empty',
      timestamp: new Date().toISOString(),
      title: 'No operational history yet',
      status: 'disconnected',
      description: 'Aun no hay eventos porque la organizacion no ha completado el onboarding real de WhatsApp.',
    });
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function buildAuditEvents(
  connection: WhatsAppConnection,
  signupConfig: WhatsAppEmbeddedSignupConfig | null,
  templates: TemplateInfo[],
): AuditEvent[] {
  const events: AuditEvent[] = [];

  if (signupConfig?.session_started_at) {
    events.push({
      id: 'signup-session',
      timestamp: signupConfig.session_started_at,
      actor: 'system',
      eventType: 'embedded_signup_started',
      description: `Se abrio una sesion de Embedded Signup con estado ${signupConfig.session_status}.`,
      relatedObject: signupConfig.session_state || 'session',
    });
  }

  if (connection.onboardingStatus === 'completed') {
    events.push({
      id: 'signup-complete',
      timestamp: connection.updatedAt,
      actor: 'system',
      eventType: 'onboarding_completed',
      description: 'La conexion de WhatsApp quedo completada y activa para esta organizacion.',
      relatedObject: connection.whatsappBusinessAccountId || connection.id,
    });
  }

  if (connection.lastWebhookReceivedAt) {
    events.push({
      id: 'last-webhook',
      timestamp: connection.lastWebhookReceivedAt,
      actor: 'system',
      eventType: 'webhook_received',
      description: 'Se recibio un evento entrante desde Meta Cloud API.',
      relatedObject: connection.phoneNumberId || connection.id,
    });
  }

  if (connection.lastSyncAt) {
    events.push({
      id: 'templates-sync',
      timestamp: connection.lastSyncAt,
      actor: 'system',
      eventType: 'template_sync',
      description: `Sincronizacion ejecutada. Plantillas visibles: ${templates.length}.`,
      relatedObject: connection.whatsappBusinessAccountId || connection.id,
    });
  }

  if (connection.updatedAt && connection.updatedAt !== EMPTY_CONNECTION.updatedAt) {
    events.push({
      id: 'settings-update',
      timestamp: connection.updatedAt,
      actor: 'system',
      eventType: 'connection_updated',
      description: 'Se actualizaron ajustes o metadatos de la conexion.',
      relatedObject: connection.id,
    });
  }

  if (events.length === 0) {
    events.push({
      id: 'empty-audit',
      timestamp: new Date().toISOString(),
      actor: 'system',
      eventType: 'pending_setup',
      description: 'Todavia no hay eventos de auditoria porque la conexion no se ha iniciado.',
      relatedObject: 'whatsapp',
    });
  }

  return dedupeById(events).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function extractEmbeddedSignupMetadata(rawValue: unknown): EmbeddedSignupMessage {
  const candidates: Array<Record<string, unknown>> = [];

  function visit(value: unknown) {
    if (!value) return;
    if (typeof value === 'string') {
      try {
        visit(JSON.parse(value));
      } catch {
        return;
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      candidates.push(record);
      Object.values(record).forEach(visit);
    }
  }

  visit(rawValue);

  for (const candidate of candidates) {
    const message: EmbeddedSignupMessage = {
      business_portfolio_id: typeof candidate.business_portfolio_id === 'string' ? candidate.business_portfolio_id : undefined,
      whatsapp_business_account_id:
        typeof candidate.whatsapp_business_account_id === 'string'
          ? candidate.whatsapp_business_account_id
          : typeof candidate.waba_id === 'string'
            ? candidate.waba_id
            : undefined,
      phone_number_id: typeof candidate.phone_number_id === 'string' ? candidate.phone_number_id : undefined,
      display_phone_number: typeof candidate.display_phone_number === 'string' ? candidate.display_phone_number : undefined,
      verified_name: typeof candidate.verified_name === 'string' ? candidate.verified_name : undefined,
    };

    if (Object.values(message).some(Boolean)) {
      return message;
    }
  }

  return {};
}

function loadFacebookSdk(appId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FB) {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v21.0' });
      resolve();
      return;
    }

    const existing = document.getElementById('facebook-jssdk');
    window.fbAsyncInit = () => {
      if (!window.FB) {
        reject(new Error('No se pudo inicializar el SDK de Meta.'));
        return;
      }
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v21.0' });
      resolve();
    };

    if (existing) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de Meta.'));
    document.body.appendChild(script);
  });
}

function waitForEmbeddedSignupMessage(): Promise<EmbeddedSignupMessage> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve({});
    }, 2500);

    function handleMessage(event: MessageEvent) {
      const metadata = extractEmbeddedSignupMetadata(event.data);
      if (!Object.values(metadata).some(Boolean)) {
        return;
      }
      window.clearTimeout(timeout);
      window.removeEventListener('message', handleMessage);
      resolve(metadata);
    }

    window.addEventListener('message', handleMessage);
  });
}

function KpiCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-4 py-4 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-ink-900">{value}</p>
      <p className="mt-1 text-xs text-ink-400">{helper}</p>
    </div>
  );
}

export function WhatsAppPage() {
  const { showError, showInfo, showSuccess } = useNotification();
  const [activeSection, setActiveSection] = useState<WhatsAppSection>('overview');
  const [connection, setConnection] = useState<WhatsAppConnection>(EMPTY_CONNECTION);
  const [settings, setSettings] = useState<WhatsAppSettings>(EMPTY_SETTINGS);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [signupConfig, setSignupConfig] = useState<WhatsAppEmbeddedSignupConfig | null>(null);
  const [recoveryForm, setRecoveryForm] = useState(RECOVERY_FORM);
  const [loading, setLoading] = useState(true);
  const [launchingSignup, setLaunchingSignup] = useState(false);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);

  const refreshPage = async () => {
    setLoading(true);
    const [connectionResult, signupResult, templateResult] = await Promise.allSettled([
      api.getWhatsAppConnection(),
      api.getWhatsAppEmbeddedSignupConfig(),
      api.getCampaignTemplates(),
    ]);

    if (connectionResult.status === 'fulfilled') {
      const connectionData = connectionResult.value;
      setConnection(mapApiConnectionToUi(connectionData));
      setSettings(mapApiConnectionToSettings(connectionData));
      setRecoveryForm({
        accessToken: '',
        phoneNumberId: connectionData.phone_number_id || '',
        wabaId: connectionData.whatsapp_business_account_id || '',
        businessPortfolioId: connectionData.business_portfolio_id || '',
        displayPhoneNumber: connectionData.display_phone_number || '',
        verifiedName: connectionData.verified_name || '',
      });
    } else {
      showError('WhatsApp', connectionResult.reason instanceof Error ? connectionResult.reason.message : 'No se pudo cargar la conexion.');
    }

    if (signupResult.status === 'fulfilled') {
      setSignupConfig(signupResult.value);
    }
    if (templateResult.status === 'fulfilled') {
      setTemplates(
        templateResult.value
          .filter((template) => template.channel === 'whatsapp')
          .map(mapCampaignTemplateToWhatsAppTemplate),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    void refreshPage();
  }, []);

  const onboardingSteps = useMemo(() => buildOnboardingSteps(connection, signupConfig), [connection, signupConfig]);
  const diagnostics = useMemo(() => buildDiagnostics(connection, signupConfig), [connection, signupConfig]);
  const healthTimeline = useMemo(() => buildHealthTimeline(connection, templates), [connection, templates]);
  const auditEvents = useMemo(() => buildAuditEvents(connection, signupConfig, templates), [connection, signupConfig, templates]);
  const phoneNumbers = connection.phoneNumberId
    ? [
        {
          id: connection.phoneNumberId,
          displayNumber: connection.displayPhoneNumber ?? 'Sin numero visible',
          phoneNumberId: connection.phoneNumberId,
          verifiedName: connection.verifiedName ?? 'Sin nombre verificado',
          status: connection.connectionStatus === 'connected' ? 'active' : connection.connectionStatus === 'not_connected' ? 'pending' : 'restricted',
          quality: connection.qualityStatus,
          limitTier: connection.messagingLimitStatus || 'unknown',
          lastActivityAt: connection.lastWebhookReceivedAt || connection.updatedAt,
        } satisfies PhoneNumberInfo,
      ]
    : [];
  const recentWarnings = [
    !signupConfig?.enabled ? 'Embedded Signup aun no esta habilitado en el backend.' : '',
    connection.webhookStatus !== 'verified' ? 'El webhook aun no esta verificado.' : '',
    !connection.phoneNumberId ? 'Falta phone_number_id para poder enrutar inbound por tenant.' : '',
  ].filter(Boolean);

  const handleEmbeddedSignupLaunch = async () => {
    if (!signupConfig?.enabled) {
      showError('Embedded Signup', 'Falta configurar META_APP_ID o META_EMBEDDED_SIGNUP_CONFIG_ID en el backend.');
      return;
    }

    setLaunchingSignup(true);
    try {
      await loadFacebookSdk(signupConfig.app_id);
      const session: WhatsAppEmbeddedSignupSession = await api.startWhatsAppEmbeddedSignup();
      const metadataPromise = waitForEmbeddedSignupMessage();
      const code = await new Promise<string>((resolve, reject) => {
        if (!window.FB) {
          reject(new Error('El SDK de Meta no esta disponible.'));
          return;
        }
        window.FB.login(
          (response) => {
            const authCode = response?.authResponse?.code;
            if (!authCode) {
              reject(new Error('Meta no devolvio un codigo de autorizacion.'));
              return;
            }
            resolve(authCode);
          },
          {
            config_id: signupConfig.config_id,
            response_type: 'code',
            override_default_response_type: true,
            extras: { feature: signupConfig.feature, sessionInfoVersion: 3 },
          },
        );
      });
      const metadata = await metadataPromise;
      await api.completeWhatsAppEmbeddedSignup({ state: session.session_state, code, ...metadata });
      await refreshPage();
      showSuccess('Embedded Signup completado', 'La conexion base de WhatsApp quedo registrada en Zelora.');
    } catch (error) {
      showError('Embedded Signup', error instanceof Error ? error.message : 'No se pudo completar el flujo de Meta.');
      await refreshPage();
    } finally {
      setLaunchingSignup(false);
    }
  };

  const handleSaveRecoveryForm = async () => {
    try {
      await api.updateWhatsAppConnection({
        is_active: true,
        access_token: recoveryForm.accessToken || undefined,
        phone_number_id: recoveryForm.phoneNumberId,
        whatsapp_business_account_id: recoveryForm.wabaId,
        business_portfolio_id: recoveryForm.businessPortfolioId,
        display_phone_number: recoveryForm.displayPhoneNumber,
        verified_name: recoveryForm.verifiedName,
        onboarding_status: recoveryForm.phoneNumberId && recoveryForm.wabaId ? 'completed' : connection.onboardingStatus,
        capabilities: ['cloud_api', 'templates', 'flows', 'ai_router', 'inbox', 'campaigns'],
      } satisfies WhatsAppConnectionPayload);
      await refreshPage();
      showSuccess('Recovery saved', 'Se completaron manualmente los metadatos faltantes de la conexion.');
    } catch (error) {
      showError('WhatsApp', error instanceof Error ? error.message : 'No se pudieron guardar los metadatos de recuperacion.');
    }
  };

  const handleSaveSettings = async (values: WhatsAppSettings) => {
    try {
      await api.updateWhatsAppConnection({
        default_send_behavior: values.defaultSendBehavior,
        fallback_handling: values.fallbackHandling,
        auto_sync_templates: values.autoSyncTemplates,
        alert_on_webhook_failure: values.alertOnWebhookFailure,
        internal_label: values.internalLabel,
        internal_notes: values.internalNotes,
      });
      setSettings(values);
      await refreshPage();
      showSuccess('Settings saved', 'Se guardaron los ajustes operativos de WhatsApp.');
    } catch (error) {
      showError('WhatsApp', error instanceof Error ? error.message : 'No se pudieron guardar los ajustes.');
    }
  };

  const handleVerifyWebhook = async () => {
    try {
      await api.verifyWhatsAppWebhook();
      await refreshPage();
      showSuccess('Webhook verificado', 'El webhook quedo marcado como verificado para esta organizacion.');
    } catch (error) {
      showError('WhatsApp', error instanceof Error ? error.message : 'No se pudo verificar el webhook.');
    }
  };

  const handleSyncTemplates = async () => {
    try {
      await api.syncWhatsAppTemplates();
      await refreshPage();
      showSuccess('Sync iniciado', 'Se lanzo la sincronizacion de plantillas.');
    } catch (error) {
      showError('WhatsApp', error instanceof Error ? error.message : 'No se pudieron sincronizar las plantillas.');
    }
  };

  const handleSimulateInbound = async () => {
    try {
      await api.simulateWhatsAppInbound({
        phone: '573001112233',
        message: 'Hola, quiero saber el estado de mi subsidio',
        message_type: 'text',
      });
      showSuccess('Inbound simulado', 'Se proceso un mensaje WhatsApp y ya deberia aparecer en Inbox.');
    } catch (error) {
      showError('WhatsApp', error instanceof Error ? error.message : 'No se pudo simular el inbound.');
    }
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(37,211,102,0.16),_transparent_32%),linear-gradient(180deg,_#f5fff8_0%,_#f7fafc_48%,_#f4f7fb_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Canales · WhatsApp"
          title="WhatsApp Business"
          description="Cada organización conecta su propia cuenta de WhatsApp Business y Zelora opera inbox, automatizaciones y campañas sobre esa conexión."
          meta={<p className="text-xs font-semibold text-ink-400">Fuente activa: API /api/channels/whatsapp/connection/</p>}
          actions={
            <>
              <button
                onClick={() => void handleEmbeddedSignupLaunch()}
                disabled={launchingSignup || loading}
                className="rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {launchingSignup ? 'Launching Meta...' : 'Start Embedded Signup'}
              </button>
              <button
                onClick={() => void handleVerifyWebhook()}
                disabled={loading}
                className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)] disabled:opacity-60"
              >
                Verify webhook
              </button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <KpiCard label="Connected" value={connection.connectionStatus === 'connected' ? 'Connected' : 'Not connected'} helper="Estado general de la conexion" />
            <KpiCard label="Phone number" value={connection.phoneNumberId ? 'linked' : 'pending'} helper={connection.displayPhoneNumber ?? 'Sin numero conectado'} />
            <KpiCard label="Webhook" value={connection.webhookStatus} helper={`Ultimo evento: ${formatDateTime(connection.lastWebhookReceivedAt)}`} />
            <KpiCard label="Template sync" value={connection.templateSyncStatus} helper={`${templates.length} plantillas visibles`} />
            <KpiCard label="Quality" value={connection.qualityStatus} helper="Estado reportado por Meta" />
            <KpiCard label="Messaging limits" value={connection.messagingLimitStatus || 'unknown'} helper={connection.phoneNumberId ? 'Limites activos para el numero conectado' : 'Sin numero enlazado'} />
          </div>
        </PageHeader>

        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active ? 'bg-slate-900 text-white shadow-card' : 'bg-white/70 backdrop-blur-sm text-ink-600 shadow-card ring-1 ring-slate-200 hover:bg-[rgba(17,17,16,0.025)]'
                }`}
              >
                <Icon size={14} />
                {section.label}
              </button>
            );
          })}
        </div>

        <ReconnectBanner
          visible={connection.connectionStatus === 'degraded' || connection.connectionStatus === 'requires_attention'}
          onReconnect={() => setActiveSection('setup')}
        />

        {activeSection === 'overview' && (
          <div className="space-y-6">
            <ConnectionStatusCard connection={connection} />
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-6">
                <WebhookHealthCard
                  status={connection.webhookStatus}
                  endpoint={signupConfig?.webhook_url || 'Pendiente de URL publica'}
                  lastWebhookReceivedAt={connection.lastWebhookReceivedAt}
                  diagnostics={diagnostics}
                />
                <TemplateSyncCard
                  status={connection.templateSyncStatus}
                  lastSyncAt={connection.lastSyncAt}
                  templates={templates}
                  onSync={() => void handleSyncTemplates()}
                />
              </div>
              <div className="space-y-6">
                <CapabilityStatusCard capabilities={connection.capabilities.length ? connection.capabilities : ['inbox']} />
                <div className="rounded-[24px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-5 shadow-card">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-400">Recent warnings</p>
                  <div className="mt-4 space-y-3">
                    {recentWarnings.length === 0 ? (
                      <WarningAlert title="Operational status" description="No hay advertencias activas para esta conexion." />
                    ) : (
                      recentWarnings.map((warning) => <WarningAlert key={warning} title="Operator warning" description={warning} />)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'setup' && (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-400">Meta Embedded Signup</p>
              <h2 className="mt-2 text-2xl font-bold text-ink-900">Connection setup</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
                Este flujo abre la pantalla oficial de Meta para que el cliente conecte su propio Business Portfolio,
                su propia WABA y su propio numero. Zelora no revende acceso; solo opera encima de la conexion.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Embedded Signup enabled</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{signupConfig?.enabled ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Meta app ID</p>
                  <p className="mt-1 break-all text-sm font-semibold text-ink-900">{signupConfig?.app_id || 'No configurado'}</p>
                </div>
                <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Config ID</p>
                  <p className="mt-1 break-all text-sm font-semibold text-ink-900">{signupConfig?.config_id || 'No configurado'}</p>
                </div>
                <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Session state</p>
                  <p className="mt-1 break-all text-sm font-semibold text-ink-900">{signupConfig?.session_state || 'Sin sesion activa'}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => void handleEmbeddedSignupLaunch()}
                  disabled={launchingSignup || loading}
                  className="rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16A34A] disabled:bg-emerald-300"
                >
                  {launchingSignup ? 'Launching Meta...' : 'Open Embedded Signup'}
                </button>
                <button
                  onClick={() => void handleVerifyWebhook()}
                  disabled={loading}
                  className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)] disabled:opacity-60"
                >
                  Verify webhook
                </button>
                <button
                  onClick={() => setShowRecoveryForm((current) => !current)}
                  className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]"
                >
                  {showRecoveryForm ? 'Hide recovery fields' : 'Show recovery fields'}
                </button>
              </div>
              {showRecoveryForm && (
                <div className="mt-6 rounded-[24px] border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-5">
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input value={recoveryForm.phoneNumberId} onChange={(event) => setRecoveryForm((current) => ({ ...current, phoneNumberId: event.target.value }))} placeholder="Phone number ID" className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
                    <input value={recoveryForm.wabaId} onChange={(event) => setRecoveryForm((current) => ({ ...current, wabaId: event.target.value }))} placeholder="WhatsApp Business Account ID" className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
                    <input value={recoveryForm.businessPortfolioId} onChange={(event) => setRecoveryForm((current) => ({ ...current, businessPortfolioId: event.target.value }))} placeholder="Business portfolio ID" className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
                    <input value={recoveryForm.displayPhoneNumber} onChange={(event) => setRecoveryForm((current) => ({ ...current, displayPhoneNumber: event.target.value }))} placeholder="Display phone number" className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
                    <input value={recoveryForm.verifiedName} onChange={(event) => setRecoveryForm((current) => ({ ...current, verifiedName: event.target.value }))} placeholder="Verified name" className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
                    <input type="password" value={recoveryForm.accessToken} onChange={(event) => setRecoveryForm((current) => ({ ...current, accessToken: event.target.value }))} placeholder="Meta access token" className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <button onClick={() => void handleSaveRecoveryForm()} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Save recovery data
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {onboardingSteps.map((step) => <OnboardingStepCard key={step.id} step={step} />)}
            </div>
          </div>
        )}

        {activeSection === 'phone_numbers' && (
          <div className="space-y-6">
            {phoneNumbers.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[rgba(17,17,16,0.12)] bg-white/70 backdrop-blur-sm px-6 py-10 text-center shadow-card">
                <p className="text-sm font-semibold text-ink-900">No connected phone number yet</p>
                <p className="mt-2 text-sm text-ink-400">Completa Embedded Signup para que Meta devuelva el numero asociado a la organizacion.</p>
              </div>
            ) : (
              phoneNumbers.map((phoneNumber) => <PhoneNumberCard key={phoneNumber.id} phoneNumber={phoneNumber} onRefresh={() => void refreshPage()} />)
            )}
          </div>
        )}

        {activeSection === 'webhooks' && (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <WebhookHealthCard status={connection.webhookStatus} endpoint={signupConfig?.webhook_url || 'Pendiente de URL publica'} lastWebhookReceivedAt={connection.lastWebhookReceivedAt} diagnostics={diagnostics} />
            <div className="rounded-[24px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-400">Diagnostics panel</p>
              <div className="mt-4 space-y-3">
                {[
                  'El webhook exige firma X-Hub-Signature-256 valida usando META_APP_SECRET.',
                  'El phone_number_id debe quedar asociado a la organizacion correcta para evitar cruces entre tenants.',
                  'Si no entran eventos reales, revisa callback URL, verify token, permisos y exposure HTTPS.',
                ].map((item) => <div key={item} className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3 text-sm text-ink-700">{item}</div>)}
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => void handleVerifyWebhook()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Verify webhook</button>
                <button onClick={() => showInfo('Refresh diagnostics', 'Actualiza el estado despues del proximo evento entrante real o simulado.')} className="rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]">Refresh diagnostics</button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'templates' && (
          <div className="space-y-6">
            <TemplateSyncCard status={connection.templateSyncStatus} lastSyncAt={connection.lastSyncAt} templates={templates} onSync={() => void handleSyncTemplates()} />
            <div className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.07)] bg-white/65 backdrop-blur-md shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)]">
                  <tr>
                    {['Template', 'Category', 'Language', 'Status', 'Updated'].map((header) => <th key={header} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-ink-400">{header}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(17,17,16,0.06)]">
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-400">No hay templates visibles. Sincroniza la WABA conectada para traer el catalogo real.</td>
                    </tr>
                  ) : (
                    templates.map((template) => (
                      <tr key={template.id} className="transition hover:bg-[rgba(17,17,16,0.025)]">
                        <td className="px-4 py-3 font-mono text-xs text-ink-800">{template.name}</td>
                        <td className="px-4 py-3 text-xs text-ink-600">{template.category}</td>
                        <td className="px-4 py-3 text-xs text-ink-600">{template.language}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-[rgba(17,17,16,0.06)] px-2.5 py-1 text-[10px] font-bold text-ink-700">{template.status}</span></td>
                        <td className="px-4 py-3 text-xs text-ink-400">{new Date(template.updatedAt).toLocaleString('es-CO')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'health' && <HealthTimeline events={healthTimeline} />}
        {activeSection === 'audit' && <AuditLogTable events={auditEvents} />}
        {activeSection === 'settings' && <SettingsForm key={`${connection.id}-${connection.updatedAt}`} initialValues={settings} onSave={(values) => void handleSaveSettings(values)} />}

        <div className="rounded-[24px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-400">Operator actions</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => void handleEmbeddedSignupLaunch()} disabled={launchingSignup || loading} className="inline-flex items-center gap-2 rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)] disabled:opacity-60"><Link2 size={14} />Start Embedded Signup</button>
            <button onClick={() => void handleVerifyWebhook()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)] disabled:opacity-60"><ShieldCheck size={14} />Verify webhook</button>
            <button onClick={() => void handleSyncTemplates()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)] disabled:opacity-60"><RefreshCw size={14} />Sync templates</button>
            <button onClick={() => void handleSimulateInbound()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[rgba(17,17,16,0.09)] px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)] disabled:opacity-60"><MessagesSquare size={14} />Simulate inbound</button>
          </div>
        </div>
      </div>
    </div>
  );
}
