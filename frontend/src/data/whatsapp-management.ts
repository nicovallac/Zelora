export type ConnectionStatus =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'degraded'
  | 'disconnected'
  | 'requires_attention';

export type OnboardingStatus =
  | 'not_started'
  | 'embedded_signup_started'
  | 'meta_authorized'
  | 'phone_linked'
  | 'webhook_pending'
  | 'completed'
  | 'failed';

export type WebhookStatus = 'verified' | 'pending' | 'failed' | 'stale';
export type SyncStatus = 'synced' | 'pending' | 'failed' | 'never';
export type QualityStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type HealthState = 'healthy' | 'degraded' | 'disconnected' | 'requires_attention';

export interface WhatsAppConnection {
  id: string;
  organizationId: string;
  whatsappBusinessAccountId: string | null;
  businessPortfolioId: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  connectionStatus: ConnectionStatus;
  onboardingStatus: OnboardingStatus;
  webhookStatus: WebhookStatus;
  templateSyncStatus: SyncStatus;
  qualityStatus: QualityStatus;
  messagingLimitStatus: string;
  capabilities: string[];
  lastSyncAt: string | null;
  lastWebhookReceivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'done' | 'current' | 'pending' | 'failed';
}

export interface PhoneNumberInfo {
  id: string;
  displayNumber: string;
  phoneNumberId: string;
  verifiedName: string;
  status: 'active' | 'pending' | 'restricted';
  quality: QualityStatus;
  limitTier: string;
  lastActivityAt: string;
}

export interface WebhookDiagnostic {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  status: 'approved' | 'pending' | 'rejected' | 'paused';
  updatedAt: string;
}

export interface HealthEvent {
  id: string;
  timestamp: string;
  title: string;
  status: HealthState | 'warning';
  description: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  eventType: string;
  description: string;
  relatedObject: string;
}

export interface WhatsAppSettings {
  defaultSendBehavior: 'assistant_first' | 'human_first';
  fallbackHandling: 'queue_human' | 'router_decides';
  autoSyncTemplates: boolean;
  alertOnWebhookFailure: boolean;
  internalLabel: string;
  internalNotes: string;
}

export const whatsappConnectionMock: WhatsAppConnection = {
  id: 'wa_conn_001',
  organizationId: 'org1',
  whatsappBusinessAccountId: '102938475610293',
  businessPortfolioId: '998877665544332',
  phoneNumberId: '551122334455667',
  displayPhoneNumber: '+57 320 445 7788',
  verifiedName: 'Zelora Demo Commerce',
  connectionStatus: 'connected',
  onboardingStatus: 'completed',
  webhookStatus: 'verified',
  templateSyncStatus: 'synced',
  qualityStatus: 'warning',
  messagingLimitStatus: 'Tier 2 · hasta 10K conversaciones/24h',
  capabilities: ['cloud_api', 'templates', 'flows', 'ai_router', 'inbox'],
  lastSyncAt: '2026-03-11T08:15:00Z',
  lastWebhookReceivedAt: '2026-03-11T13:42:00Z',
  createdAt: '2026-02-27T10:00:00Z',
  updatedAt: '2026-03-11T13:42:00Z',
};

export const onboardingStepsMock: OnboardingStep[] = [
  {
    id: 'step-1',
    title: 'Lanzar Embedded Signup',
    description: 'Abrimos Meta Embedded Signup desde Zelora para iniciar la conexión.',
    status: 'done',
  },
  {
    id: 'step-2',
    title: 'Autorizar negocio y WABA',
    description: 'El cliente selecciona o crea su Business Portfolio y su WhatsApp Business Account.',
    status: 'done',
  },
  {
    id: 'step-3',
    title: 'Vincular número',
    description: 'Meta devuelve el phone number id y los metadatos principales del número.',
    status: 'done',
  },
  {
    id: 'step-4',
    title: 'Verificar webhook',
    description: 'Zelora valida challenge, eventos y salud inicial de la conexión.',
    status: 'current',
  },
  {
    id: 'step-5',
    title: 'Operación lista',
    description: 'La conexión queda lista para inbox, AI Router y flows.',
    status: 'pending',
  },
];

export const phoneNumbersMock: PhoneNumberInfo[] = [
  {
    id: 'phone-1',
    displayNumber: '+57 320 445 7788',
    phoneNumberId: '551122334455667',
    verifiedName: 'Zelora Demo Commerce',
    status: 'active',
    quality: 'warning',
    limitTier: 'Tier 2',
    lastActivityAt: '2026-03-11T13:42:00Z',
  },
];

export const webhookDiagnosticsMock: WebhookDiagnostic[] = [
  {
    id: 'diag-1',
    title: 'Webhook verificado',
    severity: 'info',
    description: 'El challenge de Meta fue validado correctamente y el endpoint responde en tiempo.',
  },
  {
    id: 'diag-2',
    title: 'Freshness en observación',
    severity: 'warning',
    description: 'No se detectaron errores, pero conviene vigilar si pasan más de 2h sin eventos entrantes.',
  },
];

export const templatesMock: TemplateInfo[] = [
  {
    id: 'tpl-1',
    name: 'order_update_v1',
    category: 'utility',
    language: 'es_CO',
    status: 'approved',
    updatedAt: '2026-03-11T08:15:00Z',
  },
  {
    id: 'tpl-2',
    name: 'promo_flash_weekend',
    category: 'marketing',
    language: 'es_CO',
    status: 'pending',
    updatedAt: '2026-03-10T17:20:00Z',
  },
  {
    id: 'tpl-3',
    name: 'login_otp',
    category: 'authentication',
    language: 'es_CO',
    status: 'approved',
    updatedAt: '2026-03-09T12:10:00Z',
  },
];

export const healthTimelineMock: HealthEvent[] = [
  {
    id: 'health-1',
    timestamp: '2026-03-11T13:42:00Z',
    title: 'Último webhook recibido',
    status: 'healthy',
    description: 'Evento message.received procesado correctamente.',
  },
  {
    id: 'health-2',
    timestamp: '2026-03-11T08:15:00Z',
    title: 'Template sync completo',
    status: 'healthy',
    description: 'Sincronización de 18 plantillas desde Meta completada sin errores.',
  },
  {
    id: 'health-3',
    timestamp: '2026-03-10T19:00:00Z',
    title: 'Quality rating en warning',
    status: 'warning',
    description: 'Meta reportó una caída de calidad por aumento de bloqueos en mensajes de marketing.',
  },
];

export const auditEventsMock: AuditEvent[] = [
  {
    id: 'audit-1',
    timestamp: '2026-03-11T13:42:00Z',
    actor: 'system',
    eventType: 'webhook_received',
    description: 'Se procesó un evento de mensaje entrante desde WhatsApp Cloud API.',
    relatedObject: 'phone_number_id:551122334455667',
  },
  {
    id: 'audit-2',
    timestamp: '2026-03-11T08:15:00Z',
    actor: 'system',
    eventType: 'template_sync',
    description: 'Se sincronizaron 18 plantillas y 1 quedó en pending approval.',
    relatedObject: 'waba:102938475610293',
  },
  {
    id: 'audit-3',
    timestamp: '2026-03-10T19:00:00Z',
    actor: 'system',
    eventType: 'quality_change',
    description: 'La calidad del número pasó a warning. Se recomienda revisar campañas recientes.',
    relatedObject: 'phone_number_id:551122334455667',
  },
  {
    id: 'audit-4',
    timestamp: '2026-03-09T15:20:00Z',
    actor: 'Carlos Pérez',
    eventType: 'verify_webhook',
    description: 'Se ejecutó una revalidación manual del webhook desde el panel.',
    relatedObject: 'connection:wa_conn_001',
  },
  {
    id: 'audit-5',
    timestamp: '2026-02-27T10:22:00Z',
    actor: 'Carlos Pérez',
    eventType: 'onboarding_completed',
    description: 'Conexión de WhatsApp completada mediante Embedded Signup.',
    relatedObject: 'waba:102938475610293',
  },
];

export const whatsappSettingsMock: WhatsAppSettings = {
  defaultSendBehavior: 'assistant_first',
  fallbackHandling: 'router_decides',
  autoSyncTemplates: true,
  alertOnWebhookFailure: true,
  internalLabel: 'Cuenta principal LATAM',
  internalNotes: 'Usada para inbox, automatizaciones comerciales y handoff a agentes.',
};
