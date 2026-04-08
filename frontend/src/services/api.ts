const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const publicApiCache = new Map<string, Promise<unknown>>();

function getToken(): string | null {
  return localStorage.getItem('comfa_token');
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers ?? {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('comfa_token');
      localStorage.removeItem('comfa_agent');
      window.location.href = '/login';
    }
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new ApiError(res.status, data.detail ?? `Error ${res.status}`);
  }
  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

async function fetchList<T>(path: string, options?: RequestInit): Promise<T[]> {
  const data = await fetchApi<T[] | PaginatedResponse<T>>(path, options);
  if (Array.isArray(data)) {
    return data;
  }
  return data.results;
}

function fetchCached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const cached = publicApiCache.get(key);
  if (cached) {
    return cached as Promise<T>;
  }
  const request = loader().finally(() => {
    setTimeout(() => publicApiCache.delete(key), 1500);
  });
  publicApiCache.set(key, request as Promise<unknown>);
  return request;
}

async function downloadFile(path: string, filenameFallback: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new ApiError(res.status, data.detail ?? `Error ${res.status}`);
  }
  const blob = await res.blob();
  const contentDisposition = res.headers.get('Content-Disposition') || '';
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || filenameFallback;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function downloadFileWithBody(path: string, body: unknown, filenameFallback: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new ApiError(res.status, data.detail ?? `Error ${res.status}`);
  }
  const blob = await res.blob();
  const contentDisposition = res.headers.get('Content-Disposition') || '';
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || filenameFallback;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

// ─── Response types ──────────────────────────────────────────────────────────

export interface MessageItem {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface ConvListItem {
  id: string;
  canal: string;
  estado: string;
  intent?: string;
  sentimiento: string;
  last_message?: string;
  last_message_at: string;
  created_at: string;
  contact_nombre?: string;
  contact_apellido?: string;
  contact_cedula?: string;
  contact_telefono?: string;
  contact_email?: string;
  contact_tipo_afiliado?: string;
  agent_nombre?: string;
  owner?: 'ia' | 'humano';
  active_ai_agent?: 'general' | 'sales' | 'marketing' | 'operations' | '';
  commercial_status?: 'nuevo' | 'en_conversacion' | 'interesado' | 'esperando_respuesta' | 'escalado' | 'cerrado' | 'venta_lograda' | 'perdido';
  priority?: 'alta' | 'media' | 'baja';
  follow_up?: boolean;
  opportunity?: boolean;
  next_step?: string;
  conversation_summary?: string;
  escalation_reason?: string;
  note_count?: number;
  unread?: boolean;
  active_flow?: {
    name: string;
    label: string;
    step: string;
    status: string;
    data: Record<string, unknown>;
  } | null;
  qualification?: Record<string, unknown>;
  sales_stage?: string;
  close_signals?: string[];
}

export interface ConvDetail extends ConvListItem {
  contact?: string | null;
  messages: MessageItem[];
  timeline: {
    id: string;
    tipo: string;
    descripcion: string;
    timestamp: string;
  }[];
  notes: {
    id: string;
    note_type: string;
    content: string;
    is_pinned: boolean;
    author_nombre?: string;
    created_at: string;
  }[];
}

export interface MetricsOverview {
  total_conversaciones: number;
  automatizacion_pct: number;
  escalamiento_pct: number;
  satisfaccion_pct: number;
  tiempo_promedio_seg: number;
}

export interface ChannelMetric {
  canal: string;
  total: number;
  automatizadas: number;
  escaladas: number;
}

export interface IntentMetric {
  nombre: string;
  count: number;
  porcentaje: number;
}

export interface PricingItem {
  id: string;
  tipo: string;
  nombre: string;
  precio?: number;
  moneda: string;
  descripcion?: string;
}

export interface AICopilotResponse {
  suggestions: string[];
  intent: string;
  conversation_id?: string;
}

export interface AISummaryResponse {
  summary: string;
  message_count: number;
}

export interface AgentAdmin {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  created_at: string;
}

export interface CreateAgentPayload {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface UserAdmin {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  tipo_afiliado: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface AgentApiItem {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  rol: string;
  is_active: boolean;
  created_at: string;
}

export interface MyAgentProfileApiItem {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  rol: string;
  is_active: boolean;
  is_available: boolean;
  max_concurrent_chats?: number;
  last_seen?: string | null;
  full_name?: string;
  created_at: string;
}

interface ContactApiListItem {
  id: string;
  full_name: string;
  telefono?: string;
  email?: string;
  tipo: string;
  canal: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface ContactApiDetailItem {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  cedula?: string;
  tipo_afiliado?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CreateUserPayload {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono?: string;
  email?: string;
  tipo_afiliado: string;
  metadata?: Record<string, unknown>;
}

export interface CreateOrderPayload {
  customer_name: string;
  contact?: string | null;
  order_kind?: 'purchase' | 'booking' | 'quote_request';
  channel: 'ecommerce' | 'whatsapp' | 'instagram' | 'web' | 'app';
  items: { sku: string; qty: number; unit_price: number; title?: string; offer_type?: 'physical' | 'service' | 'hybrid' }[];
  currency?: 'COP';
  scheduled_for?: string;
  service_location?: string;
  fulfillment_summary?: Record<string, unknown>;
  notes?: string;
}

export interface ReserveInventoryPayload {
  order_id: string;
  items: { sku: string; qty: number }[];
}

export type KBArticlePurpose = 'faq' | 'business' | 'sales_scripts' | 'policy';

export interface KBArticleApiItem {
  id: string;
  title: string;
  content: string;
  category: string;
  purpose: KBArticlePurpose;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  visits: number;
  created_at: string;
  updated_at: string;
  redirect_warning?: string | null;
}

export interface KBArticlePayload {
  title: string;
  content: string;
  category: string;
  purpose?: KBArticlePurpose;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

export interface KBDocumentApiItem {
  id: string;
  article: string | null;
  filename: string;
  file_size: number;
  mime_type: string;
  processing_status: 'pending' | 'processing' | 'ready' | 'failed';
  processed: boolean;
  extracted_text?: string;
  uploaded_at: string;
  updated_at: string;
}

export interface ProductApiItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  description: string;
  offer_type: 'physical' | 'service' | 'hybrid';
  price_type: 'fixed' | 'variable' | 'quote_required';
  service_mode?: 'onsite' | 'remote' | 'hybrid' | 'not_applicable';
  requires_booking?: boolean;
  requires_shipping?: boolean;
  service_duration_minutes?: number;
  capacity?: number;
  fulfillment_notes?: string;
  attributes?: Record<string, unknown>;
  images?: string[];
  tags?: string[];
  is_active?: boolean;
  status: 'active' | 'draft' | 'archived';
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    stock: number;
    reserved: number;
    price: number;
    cost?: number;
    duration_minutes?: number;
    capacity?: number;
    delivery_mode?: 'onsite' | 'remote' | 'hybrid' | 'not_applicable';
    metadata?: Record<string, unknown>;
  }>;
  created_at: string;
  updated_at: string;
}

export interface PublicProductApiItem extends ProductApiItem {
  organization_slug?: string;
}

export interface ProductVariantPayload {
  id?: string;
  sku: string;
  name: string;
  price: number;
  cost?: number;
  stock?: number;
  reserved?: number;
  duration_minutes?: number;
  capacity?: number;
  delivery_mode?: 'onsite' | 'remote' | 'hybrid' | 'not_applicable';
  metadata?: Record<string, unknown>;
}

export interface ProductPayload {
  title: string;
  brand: string;
  category: string;
  description: string;
  offer_type: 'physical' | 'service' | 'hybrid';
  price_type: 'fixed' | 'variable' | 'quote_required';
  service_mode: 'onsite' | 'remote' | 'hybrid' | 'not_applicable';
  requires_booking: boolean;
  requires_shipping: boolean;
  service_duration_minutes: number;
  capacity: number;
  fulfillment_notes: string;
  attributes: Record<string, unknown>;
  images: string[];
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  is_active?: boolean;
  variants: ProductVariantPayload[];
}

export interface ProductImageUploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  content_type?: string;
}

export interface ChannelMediaUploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  content_type?: string;
  kind: 'logo' | 'hero';
}

export interface OrderApiItem {
  id: string;
  customer_name: string;
  channel: 'ecommerce' | 'whatsapp' | 'instagram' | 'web';
  status: 'new' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignTemplateApiItem {
  id: string;
  name: string;
  tipo: 'marketing' | 'utility' | 'authentication';
  content: string;
  variables: string[];
  channel: string;
  status: 'draft' | 'approved' | 'rejected';
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignTemplatePayload {
  name: string;
  tipo: 'marketing' | 'utility' | 'authentication';
  content: string;
  variables: string[];
  channel?: string;
  status?: 'draft' | 'approved' | 'rejected';
}

export interface CampaignApiItem {
  id: string;
  name: string;
  channel: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  target_filter: Record<string, unknown>;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  delivered: number;
  read: number;
  failed: number;
  created_at: string;
  template: string | null;
  template_name?: string;
}

export interface CampaignPayload {
  name: string;
  channel?: string;
  status?: 'draft' | 'scheduled';
  template?: string | null;
  target_filter?: Record<string, unknown>;
  scheduled_at?: string | null;
  total_recipients?: number;
}

export interface ConversationOperatorStatePayload {
  owner?: 'ia' | 'humano';
  commercial_status?: 'nuevo' | 'en_conversacion' | 'interesado' | 'esperando_respuesta' | 'escalado' | 'cerrado' | 'venta_lograda' | 'perdido';
  priority?: 'alta' | 'media' | 'baja';
  follow_up?: boolean;
  opportunity?: boolean;
  next_step?: string;
  conversation_summary?: string;
  escalation_reason?: string;
}

export interface ConversationNotePayload {
  content: string;
  note_type?: 'note' | 'escalation_reason' | 'resolution_note' | 'handoff' | 'warning';
}

export interface ConversationContactPayload {
  nombre?: string;
  telefono?: string;
  email?: string;
}

export interface WebChatInboundPayload {
  organization_slug?: string;
  session_id: string;
  message: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
}

export interface WebChatInboundResponse {
  conversation_id: string;
  contact_id: string;
  intent: string;
  session_id?: string;
  messages: MessageItem[];
}

export interface WhatsAppConnectionApiItem {
  id: string;
  channel: string;
  is_active: boolean;
  webhook_url: string;
  token_configured: boolean;
  phone_number_id: string;
  whatsapp_business_account_id: string;
  business_portfolio_id: string;
  display_phone_number: string;
  verified_name: string;
  onboarding_status: string;
  webhook_status: string;
  template_sync_status: string;
  quality_status: string;
  messaging_limit_status: string;
  capabilities: string[];
  last_sync_at: string | null;
  last_webhook_received_at: string | null;
  default_send_behavior: string;
  fallback_handling: string;
  auto_sync_templates: boolean;
  alert_on_webhook_failure: boolean;
  internal_label: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConnectionPayload {
  is_active?: boolean;
  webhook_url?: string;
  access_token?: string;
  phone_number_id?: string;
  whatsapp_business_account_id?: string;
  business_portfolio_id?: string;
  display_phone_number?: string;
  verified_name?: string;
  onboarding_status?: string;
  webhook_status?: string;
  template_sync_status?: string;
  quality_status?: string;
  messaging_limit_status?: string;
  capabilities?: string[];
  default_send_behavior?: string;
  fallback_handling?: string;
  auto_sync_templates?: boolean;
  alert_on_webhook_failure?: boolean;
  internal_label?: string;
  internal_notes?: string;
}

export interface WhatsAppEmbeddedSignupConfig {
  enabled: boolean;
  app_id: string;
  config_id: string;
  feature: string;
  session_state: string;
  session_started_at: string | null;
  session_status: string;
  webhook_url: string;
  verify_token: string;
}

export interface WhatsAppEmbeddedSignupSession {
  session_state: string;
  session_started_at: string;
  session_status: string;
}

export interface WhatsAppEmbeddedSignupCompletePayload {
  state: string;
  code?: string;
  access_token?: string;
  business_portfolio_id?: string;
  whatsapp_business_account_id?: string;
  phone_number_id?: string;
  display_phone_number?: string;
  verified_name?: string;
}

export interface WhatsAppSimulateInboundPayload {
  phone: string;
  message: string;
  message_type?: string;
}

export interface WebWidgetConnectionApiItem {
  id: string;
  channel: string;
  organization_slug: string;
  is_active: boolean;
  widget_name: string;
  greeting_message: string;
  brand_color: string;
  position: string;
  allowed_domains: string[];
  launcher_label: string;
  require_consent: boolean;
  handoff_enabled: boolean;
  widget_script_url: string;
  embed_snippet: string;
  public_demo_url: string;
  install_status: string;
  verified_domains: string[];
  last_install_check_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebWidgetPublicConfig {
  organization_slug: string;
  is_active: boolean;
  widget_name: string;
  greeting_message: string;
  brand_color: string;
  position: string;
  launcher_label: string;
  require_consent: boolean;
  handoff_enabled: boolean;
  public_demo_url: string;
}

export interface WebWidgetConnectionPayload {
  is_active?: boolean;
  widget_name?: string;
  brand_color?: string;
  position?: string;
  allowed_domains?: string[];
  launcher_label?: string;
  require_consent?: boolean;
  handoff_enabled?: boolean;
}

export interface AppChatConnectionApiItem {
  id: string;
  channel: string;
  organization_slug: string;
  is_active: boolean;
  app_name: string;
  welcome_message: string;
  primary_color: string;
  accent_color: string;
  page_background_color: string;
  background_mode: string;
  background_treatment: string;
  hero_height: string;
  logo_size: string;
  banner_intensity: string;
  chat_density: string;
  hero_curve: string;
  carousel_style: string;
  social_visibility: string;
  component_style: string;
  layout_template: string;
  background_image_url: string;
  background_overlay: string;
  font_family: string;
  font_scale: string;
  presentation_style: string;
  surface_style: string;
  bubble_style: string;
  user_bubble_color: string;
  agent_bubble_color: string;
  header_logo_url: string;
  launcher_label: string;
  ticker_enabled: boolean;
  ticker_text: string;
  show_featured_products: boolean;
  instagram_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  website_url: string;
  location_url: string;
  ios_bundle_ids: string[];
  android_package_names: string[];
  allowed_origins: string[];
  auth_mode: string;
  require_authentication: boolean;
  push_enabled: boolean;
  handoff_enabled: boolean;
  publishable_key: string;
  rest_endpoint: string;
  public_app_url: string;
  android_sdk_snippet: string;
  ios_sdk_snippet: string;
  install_status: string;
  verified_apps: string[];
  last_install_check_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppChatConnectionPayload {
  is_active?: boolean;
  app_name?: string;
  primary_color?: string;
  accent_color?: string;
  page_background_color?: string;
  background_mode?: string;
  background_treatment?: string;
  hero_height?: string;
  logo_size?: string;
  banner_intensity?: string;
  chat_density?: string;
  hero_curve?: string;
  carousel_style?: string;
  social_visibility?: string;
  component_style?: string;
  layout_template?: string;
  background_image_url?: string;
  background_overlay?: string;
  font_family?: string;
  font_scale?: string;
  presentation_style?: string;
  surface_style?: string;
  bubble_style?: string;
  user_bubble_color?: string;
  agent_bubble_color?: string;
  header_logo_url?: string;
  launcher_label?: string;
  ticker_enabled?: boolean;
  ticker_text?: string;
  show_featured_products?: boolean;
  instagram_url?: string;
  tiktok_url?: string;
  whatsapp_url?: string;
  website_url?: string;
  location_url?: string;
  ios_bundle_ids?: string[];
  android_package_names?: string[];
  allowed_origins?: string[];
  auth_mode?: string;
  require_authentication?: boolean;
  push_enabled?: boolean;
  handoff_enabled?: boolean;
}

export interface AppChatVerifyInstallResult {
  status: string;
  install_status: string;
  verified_apps: string[];
  last_install_check_at: string;
}

export interface AppChatPublicConfig {
  organization_slug: string;
  app_name: string;
  welcome_message: string;
  primary_color: string;
  accent_color: string;
  page_background_color: string;
  background_mode: string;
  background_treatment: string;
  hero_height: string;
  logo_size: string;
  banner_intensity: string;
  chat_density: string;
  hero_curve: string;
  carousel_style: string;
  social_visibility: string;
  component_style: string;
  layout_template: string;
  background_image_url: string;
  background_overlay: string;
  font_family: string;
  font_scale: string;
  presentation_style: string;
  surface_style: string;
  bubble_style: string;
  user_bubble_color: string;
  agent_bubble_color: string;
  header_logo_url: string;
  launcher_label: string;
  ticker_enabled: boolean;
  ticker_text: string;
  show_featured_products: boolean;
  instagram_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  website_url: string;
  location_url: string;
  handoff_enabled: boolean;
  public_app_url: string;
}

export interface AppChatInboundPayload {
  organization_slug?: string;
  session_id: string;
  session_token?: string;
  message: string;
  platform?: 'ios' | 'android' | 'unknown';
  app_user_id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
}

export interface AppChatSessionAccess {
  session_token: string;
  organization_slug: string;
  session_id: string;
}

export interface FlowApiItem {
  id: string;
  name: string;
  description: string;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  trigger: string;
  channel: string;
  is_active: boolean;
  router_config?: {
    triggerType?: string;
    intent?: string;
    keywords?: string[];
    confidenceThreshold?: number;
    fallbackAction?: string;
  };
  canales?: string[];
  created_at: string;
  updated_at: string;
}

export interface FlowPayload {
  name: string;
  description: string;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  is_active: boolean;
  trigger?: string;
  channel?: string;
  router_config: {
    triggerType: string;
    intent: string;
    keywords: string[];
    confidenceThreshold: number;
    fallbackAction: string;
  };
  canales: string[];
}

export interface DatabaseConnectionApiItem {
  id: string;
  channel: string;
  is_active: boolean;
  engine: 'postgresql' | 'sqlite';
  host: string;
  port: number;
  database_name: string;
  schema_name: string;
  username: string;
  password_configured: boolean;
  ssl_mode: string;
  connection_status: string;
  last_tested_at: string | null;
  last_error: string;
  default_lookup_table: string;
  document_column: string;
  full_name_column: string;
  phone_column: string;
  email_column: string;
  affiliate_type_column: string;
  last_lookup_at: string | null;
  capabilities: string[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseConnectionPayload {
  is_active?: boolean;
  engine?: 'postgresql' | 'sqlite';
  host?: string;
  port?: number;
  database_name?: string;
  schema_name?: string;
  username?: string;
  password?: string;
  ssl_mode?: string;
  default_lookup_table?: string;
  document_column?: string;
  full_name_column?: string;
  phone_column?: string;
  email_column?: string;
  affiliate_type_column?: string;
  capabilities?: string[];
}

export interface DatabaseConnectionTestResult {
  status: string;
  connection_status: string;
  last_tested_at: string;
  error: string;
}

export interface DatabaseLookupResult {
  found: boolean;
  record: {
    full_name: string;
    phone?: string | null;
    email?: string | null;
    affiliate_type?: string | null;
  } | null;
  last_lookup_at: string;
}

export interface SignupPayload {
  name: string;
  company: string;
  email: string;
  password: string;
  plan?: string;
}

export interface SignupResponse {
  message: string;
  org_id: string;
  user_id: string;
}

export interface SignupAvailabilityPayload {
  email?: string;
  name?: string;
  company?: string;
}

export interface SignupAvailabilityResponse {
  email_exists: boolean;
  name_exists: boolean;
  company_slug: string;
  company_available: boolean;
}

export interface QuickKnowledgeFileItem {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface OnboardingProfileApiItem {
  organization_name: string;
  website: string;
  timezone: string;
  tax_id: string;
  contact_email: string;
  contact_phone: string;
  payment_methods: string[];
  payment_settings: {
    bank_transfer_enabled?: boolean;
    cash_enabled?: boolean;
    bank_name?: string;
    account_type?: string;
    account_number?: string;
    account_holder?: string;
    payment_reference_note?: string;
    cash_instructions?: string;
    payment_link_enabled?: boolean;
    payment_link_url?: string;
  };
  what_you_sell: string;
  who_you_sell_to: string;
  general_agent_name: string;
  general_agent_profile: {
    agent_persona?: string;
    mission_statement?: string;
    scope_notes?: string;
    allowed_topics?: string[];
    blocked_topics?: string[];
    handoff_to_sales_when?: string[];
    handoff_to_human_when?: string[];
    response_language?: 'auto' | 'es' | 'en';
    greeting_message?: string;
  };
  sales_agent_name: string;
  sales_agent_profile: {
    agent_persona?: string;
    mission_statement?: string;
    industry?: string;
    country?: string;
    website?: string;
    response_language?: 'auto' | 'es' | 'en';
    greeting_message?: string;
    competitor_response?: string;
    payment_methods?: string[];
    shipping_policy?: string;
    brand_profile?: {
      tone_of_voice?: string;
      formality_level?: string;
      brand_personality?: string;
      value_proposition?: string;
      key_differentiators?: string[];
      preferred_closing_style?: string;
      urgency_style?: string;
      recommended_phrases?: string[];
      avoid_phrases?: string[];
      customer_style_notes?: string;
    };
    sales_playbook?: {
      opening_style?: string;
      recommendation_style?: string;
      objection_style?: string;
      closing_style?: string;
      follow_up_style?: string;
      upsell_style?: string;
      escalate_conditions?: string[];
      competitor_response?: string;
    };
    buyer_model?: {
      ideal_buyers?: string[];
      common_objections?: string[];
      purchase_signals?: string[];
      low_intent_signals?: string[];
      bulk_buyer_signals?: string[];
    };
    commerce_rules?: {
      payment_methods?: string[];
      shipping_policy?: string;
      discount_policy?: string;
      negotiation_policy?: string;
      inventory_promise_rule?: string;
      delivery_promise_rule?: string;
      return_policy_summary?: string;
      forbidden_claims?: string[];
      forbidden_promises?: string[];
    };
  };
  quick_knowledge_text: string;
  quick_knowledge_links: string[];
  quick_knowledge_files: QuickKnowledgeFileItem[];
  activation_tasks: {
    knowledge_status?: 'pending' | 'in_progress' | 'completed';
    channels_status?: 'pending' | 'in_progress' | 'completed';
    agent_test_status?: 'pending' | 'in_progress' | 'completed';
    agent_tested_at?: string | null;
  };
  initial_onboarding_completed: boolean;
  brand_profile: {
    tone_of_voice?: string;
    formality_level?: string;
    brand_personality?: string;
    value_proposition?: string;
    key_differentiators?: string[];
    preferred_closing_style?: string;
    urgency_style?: string;
    recommended_phrases?: string[];
    avoid_phrases?: string[];
    customer_style_notes?: string;
  };
  sales_playbook: {
    opening_style?: string;
    recommendation_style?: string;
    objection_style?: string;
    closing_style?: string;
    follow_up_style?: string;
    upsell_style?: string;
    escalate_conditions?: string[];
  };
  buyer_model: {
    ideal_buyers?: string[];
    common_objections?: string[];
    purchase_signals?: string[];
    low_intent_signals?: string[];
    bulk_buyer_signals?: string[];
  };
  commerce_rules: {
    payment_methods?: string[];
    shipping_policy?: string;
    discount_policy?: string;
    negotiation_policy?: string;
    inventory_promise_rule?: string;
    delivery_promise_rule?: string;
    return_policy_summary?: string;
    forbidden_claims?: string[];
    forbidden_promises?: string[];
  };
  locale_settings: {
    language?: string;
    date_format?: string;
    default_response_language?: boolean;
    session_timeout_minutes?: number;
    business_hours?: Array<{ dia: string; label: string; activo: boolean; inicio: string; fin: string }>;
    sla_minutes?: number;
    auto_escalate_minutes?: number;
    off_hours_message?: string;
    sla_threshold?: number;
  };
  notification_settings: {
    items?: Array<{
      key: string;
      label: string;
      email: boolean;
      whatsapp: boolean;
      browser: boolean;
      enabled: boolean;
    }>;
  };
  ai_preferences: {
    provider?: string;
    copilot_model?: string;
    summary_model?: string;
    temperature?: number;
    max_tokens?: number;
    confidence_threshold?: number;
    copilot_suggestions?: 2 | 3 | 5;
    sentiment_analysis?: boolean;
    auto_summary?: boolean;
    qa_scoring?: boolean;
    general_agent?: {
      enabled?: boolean;
      trial_mode?: boolean;
      model_name?: string;
      handoff_mode?: 'temprano' | 'balanceado' | 'estricto';
      max_response_length?: 'brief' | 'standard' | 'detailed';
    };
    sales_agent?: {
      enabled?: boolean;
      autonomy_level?: 'asistido' | 'semi_autonomo' | 'autonomo';
      followup_mode?: 'apagado' | 'suave' | 'activo';
      max_followups?: 0 | 1 | 2;
      recommendation_depth?: 1 | 2 | 3;
      handoff_mode?: 'temprano' | 'balanceado' | 'estricto';
      max_response_length?: 'brief' | 'standard' | 'detailed';
    };
  };
  optimization_profile: {
    status?: string;
    last_updated_at?: string | null;
  };
  security_settings?: {
    mfa_enabled?: boolean;
    min_password_length?: number;
    require_special_chars?: boolean;
    require_numbers?: boolean;
    password_expiry_days?: number;
    ip_allowlist?: Array<{ id: string; cidr: string; activo: boolean }>;
  };
  onboarding_status: string;
  completed_step: number;
}

export interface OnboardingProfilePayload extends Partial<OnboardingProfileApiItem> {}

export interface SecurityAuditLogItem {
  id: string;
  actor_email: string;
  event_type: string;
  event_description: string;
  ip_address: string | null;
  user_agent: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SalesAgentMetricsApiItem {
  period_days: number;
  executions: number;
  conversations: number;
  qualified_leads: number;
  followups_created: number;
  handoffs: number;
  product_recommendations: number;
  avg_confidence_pct: number;
}

export interface HistoricalImportReportApiItem {
  sessions: number;
  router_examples: number;
  eval_examples: number;
  topics: Array<[string, number]>;
  route_hints: Array<[string, number]>;
  stages: Array<[string, number]>;
}

export interface HistoricalImportApiItem {
  source_name: string;
  target_dir: string;
  report: HistoricalImportReportApiItem;
  has_kb_seed: boolean;
}

export interface HistoricalImportRunResult {
  target_dir: string;
  normalized_path: string;
  router_path: string;
  evals_path: string;
  kb_seed_path: string;
  report_path: string;
  report: HistoricalImportReportApiItem;
}

export interface LearningCandidateApiItem {
  id: string;
  kind: 'faq' | 'winning_reply' | 'objection' | 'estilo_comunicacion';
  status: 'pending' | 'approved' | 'rejected';
  title: string;
  source_question: string;
  proposed_answer: string;
  confidence: number;
  evidence_count: number;
  metadata: Record<string, unknown>;
  approved_article?: string | null;
  suggested_destination: 'kb_article' | 'kb_playbook' | 'quick_reply';
  created_at: string;
  updated_at: string;
}

export interface DocumentExtractionCandidateApiItem {
  id: string;
  kind: 'service' | 'pricing_rule' | 'policy' | 'flow_hint' | 'ai_summary' | 'ai_qa';
  status: 'pending' | 'approved' | 'rejected';
  title: string;
  body: string;
  confidence: number;
  metadata: Record<string, unknown>;
  source_document: string;
  source_document_name: string;
  approved_article?: string | null;
  approved_product?: string | null;
  suggested_destination: 'catalog_service' | 'kb_pricing' | 'kb_policy' | 'flow_hint' | 'kb_article';
  created_at: string;
  updated_at: string;
}


// ─── API object ───────────────────────────────────────────────────────────────

export const api = {
  // Health
  health: () => fetchApi<{ status: string }>('/health'),

  // Auth
  signup: (data: SignupPayload) =>
    fetchApi<SignupResponse>('/api/auth/signup/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  signupAvailability: (data: SignupAvailabilityPayload) =>
    fetchApi<SignupAvailabilityResponse>('/api/auth/signup-availability/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (email: string, password: string) =>
    fetchApi<{
      access: string;
      refresh: string;
      user: {
        id: string;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
      };
    }>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMyAgentProfile: () => fetchApi<MyAgentProfileApiItem>('/api/auth/agents/me/'),
  updateMyAgentProfile: (data: { nombre?: string; apellido?: string; telefono?: string }) =>
    fetchApi<MyAgentProfileApiItem>('/api/auth/agents/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  changeMyPassword: (data: { old_password: string; new_password: string }) =>
    fetchApi<{ message: string }>('/api/auth/agents/change_password/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Security audit log
  getSecurityAuditLog: () =>
    fetchList<SecurityAuditLogItem>('/api/auth/audit-log/'),
  downloadSecurityAuditLogCsv: () =>
    downloadFile('/api/auth/audit-log/export_csv/', 'security_audit_log.csv'),

  // Conversations
  getConversations: (params?: { canal?: string; estado?: string }) => {
    const q = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return fetchList<ConvListItem>(`/api/conversations/${q}`);
  },
  getConversationStats: () =>
    fetchApi<{ this_month: number; total: number }>('/api/conversations/stats/'),
  getConversation: (id: string) => fetchApi<ConvDetail>(`/api/conversations/${id}/`),
  sendMessage: (id: string, content: string, role = 'agent') =>
    fetchApi<MessageItem>(`/api/conversations/${id}/messages/`, {
      method: 'POST',
      body: JSON.stringify({ content, role }),
    }),
  escalate: (id: string) =>
    fetchApi<{ status: string }>(`/api/conversations/${id}/escalate/`, { method: 'POST' }),
  resolve: (id: string) =>
    fetchApi<{ status: string }>(`/api/conversations/${id}/resolve/`, { method: 'POST' }),
  reopen: (id: string) =>
    fetchApi<{ status: string }>(`/api/conversations/${id}/reopen/`, { method: 'POST' }),
  takeOverConversation: (id: string) =>
    fetchApi<{ status: string; agent: string }>(`/api/conversations/${id}/take-over/`, { method: 'POST' }),
  returnConversationToAI: (id: string) =>
    fetchApi<{ status: string }>(`/api/conversations/${id}/return-to-ai/`, { method: 'POST' }),
  updateConversationOperatorState: (id: string, data: ConversationOperatorStatePayload) =>
    fetchApi<{ status: string; operator_state: Record<string, unknown> }>(`/api/conversations/${id}/operator-state/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  addConversationNote: (id: string, data: ConversationNotePayload) =>
    fetchApi<{
      id: string;
      content: string;
      note_type: string;
      author_nombre?: string;
      created_at: string;
      is_pinned: boolean;
    }>(`/api/conversations/${id}/notes/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateConversationContact: (id: string, data: ConversationContactPayload) =>
    fetchApi<{ status: string; contact_id: string; nombre: string; telefono: string; email: string }>(`/api/conversations/${id}/contact/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  markConversationRead: (id: string) =>
    fetchApi<{ status: string; inbox_state: Record<string, unknown> }>(`/api/conversations/${id}/mark-read/`, {
      method: 'POST',
    }),
  exportConversationJson: (id: string) =>
    downloadFile(`/api/conversations/${id}/export-json/`, `conversation-${id}.json`),
  exportConversationBatchJson: (conversationIds: string[]) =>
    downloadFileWithBody('/api/conversations/export-json-batch/', { conversation_ids: conversationIds }, 'conversations-export.json'),
  getAICopilot: (data: { conversation_id: string; intent?: string; messages?: Array<{ role: string; content: string }> }) =>
    fetchApi<AICopilotResponse>('/api/ai/copilot/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAISummary: (conversationId: string) =>
    fetchApi<AISummaryResponse>('/api/ai/summarize/', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId }),
    }),

  // Metrics
  getMetricsOverview: (days = 30) => fetchApi<MetricsOverview & Record<string, unknown>>(`/api/analytics/overview/?days=${days}`),
  getMetricsChannels: (days = 30) => fetchApi<{ channels: ChannelMetric[]; period_days: number }>(`/api/analytics/channels/?days=${days}`),
  getMetricsIntents: (days = 30) => fetchApi<IntentMetric[]>(`/api/analytics/intents/?days=${days}`),

  // Pricing
  getPricing: () => fetchApi<PricingItem[]>('/pricing'),

  // Admin – Agents
  getAgents: async () => {
    const agents = await fetchList<AgentApiItem>('/api/auth/agents/');
    return agents.map((agent) => ({
      id: agent.id,
      nombre: [agent.nombre, agent.apellido].filter(Boolean).join(' ').trim() || agent.nombre,
      email: agent.email,
      rol: agent.rol,
      activo: agent.is_active,
      created_at: agent.created_at,
    }));
  },
  createAgent: (data: CreateAgentPayload) =>
    fetchApi<AgentAdmin>('/api/auth/agents/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAgent: (id: string, data: Partial<CreateAgentPayload>) =>
    fetchApi<AgentAdmin>(`/api/auth/agents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  toggleAgent: (id: string, activo: boolean) =>
    fetchApi<AgentAdmin>(`/api/auth/agents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: activo }),
    }),

  // Admin – Users (afiliados)
  getUsers: async (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const contacts = await fetchList<ContactApiListItem>(`/api/auth/contacts/${q}`);
    return contacts.map((contact) => {
      const fullName = contact.full_name.trim();
      const [nombre, ...rest] = fullName.split(' ');
      return {
        id: contact.id,
        cedula: '',
        nombre: nombre || 'Contacto',
        apellido: rest.join(' '),
        telefono: contact.telefono ?? '',
        email: contact.email ?? '',
        tipo_afiliado: contact.tipo,
        metadata: contact.metadata ?? {},
        created_at: contact.created_at,
      };
    });
  },
  createUser: (data: CreateUserPayload) =>
    fetchApi<UserAdmin>('/api/auth/contacts/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: Partial<CreateUserPayload>) =>
    fetchApi<ContactApiDetailItem>(`/api/auth/contacts/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // WhatsApp
  sendWhatsApp: (to: string, message: string) =>
    fetchApi<{ success: boolean; message_id?: string }>('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ to, message }),
    }),

  // Knowledge Base
  getKnowledgeBaseArticles: () =>
    fetchList<KBArticleApiItem>('/api/kb/articles/'),
  createKnowledgeBaseArticle: (data: KBArticlePayload) =>
    fetchApi<KBArticleApiItem>('/api/kb/articles/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateKnowledgeBaseArticle: (id: string, data: KBArticlePayload) =>
    fetchApi<KBArticleApiItem>(`/api/kb/articles/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteKnowledgeBaseArticle: (id: string) =>
    fetchApi<void>(`/api/kb/articles/${id}/`, {
      method: 'DELETE',
    }),
  visitKnowledgeBaseArticle: (id: string) =>
    fetchApi<{ visits: number }>(`/api/kb/articles/${id}/visit/`, {
      method: 'POST',
    }),
  searchKnowledgeBaseArticles: (query: string) =>
    fetchList<KBArticleApiItem>(`/api/kb/articles/search/?q=${encodeURIComponent(query)}`),
  getKnowledgeBaseDocuments: () =>
    fetchList<KBDocumentApiItem>('/api/kb/documents/'),
  uploadKnowledgeBaseDocument: (articleId: string | null, file: File) => {
    const formData = new FormData();
    if (articleId) {
      formData.append('article', articleId);
    }
    formData.append('file', file);
    return fetchApi<KBDocumentApiItem>('/api/kb/documents/', {
      method: 'POST',
      body: formData,
    });
  },
  deleteKnowledgeBaseDocument: (id: string) =>
    fetchApi<void>(`/api/kb/documents/${id}/`, {
      method: 'DELETE',
    }),

  // Ecommerce
  getProducts: () =>
    fetchList<ProductApiItem>('/api/ecommerce/products/'),
  getPublicProducts: (orgSlug: string) =>
    fetchCached(`public-products:${orgSlug}`, () =>
      fetchList<PublicProductApiItem>(`/api/ecommerce/products/public/${encodeURIComponent(orgSlug)}/`),
    ),
  getPublicProduct: (orgSlug: string, productId: string) =>
    fetchApi<PublicProductApiItem>(`/api/ecommerce/products/public/${encodeURIComponent(orgSlug)}/${encodeURIComponent(productId)}/`),
  createProduct: (data: ProductPayload) =>
    fetchApi<ProductApiItem>('/api/ecommerce/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadProductImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi<ProductImageUploadResult>('/api/ecommerce/products/upload-image/', {
      method: 'POST',
      body: formData,
    });
  },
  updateProduct: (id: string, data: ProductPayload) =>
    fetchApi<ProductApiItem>(`/api/ecommerce/products/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    fetchApi<void>(`/api/ecommerce/products/${id}/`, {
      method: 'DELETE',
    }),
  getOrders: () =>
    fetchList<OrderApiItem>('/api/ecommerce/orders/'),

  // Campaigns
  getCampaignTemplates: () =>
    fetchList<CampaignTemplateApiItem>('/api/campaigns/templates/'),
  createCampaignTemplate: (data: CampaignTemplatePayload) =>
    fetchApi<CampaignTemplateApiItem>('/api/campaigns/templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCampaigns: () =>
    fetchList<CampaignApiItem>('/api/campaigns/campaigns/'),
  createCampaign: (data: CampaignPayload) =>
    fetchApi<CampaignApiItem>('/api/campaigns/campaigns/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCampaign: (id: string, data: Partial<Omit<CampaignPayload, 'status'> & { status: CampaignApiItem['status'] }>) =>
    fetchApi<CampaignApiItem>(`/api/campaigns/campaigns/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  sendCampaign: (id: string) =>
    fetchApi<{ status: string }>(`/api/campaigns/campaigns/${id}/send/`, {
      method: 'POST',
    }),

  // Public web chat
  getWebChatSessionToken: (orgSlug: string, sessionId: string) =>
    fetchApi<{ session_token: string; organization_slug: string; session_id: string }>(
      '/api/channels/webchat/session/',
      { method: 'POST', body: JSON.stringify({ organization_slug: orgSlug, session_id: sessionId }) }
    ),
  sendWebChatMessage: (data: WebChatInboundPayload & { session_token?: string }) =>
    fetchApi<WebChatInboundResponse>('/api/channels/webchat/messages/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendAppChatMessage: (data: AppChatInboundPayload) =>
    fetchApi<WebChatInboundResponse>('/api/channels/appchat/messages/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAppChatConversation: (orgSlug: string, sessionId: string, sessionToken: string) =>
    fetchCached(`public-appchat-conversation:${orgSlug}:${sessionId}:${sessionToken}`, () =>
      fetchApi<WebChatInboundResponse>(
        `/api/channels/appchat/conversations/${encodeURIComponent(orgSlug)}/${encodeURIComponent(sessionId)}/?session_token=${encodeURIComponent(sessionToken)}`,
      ),
    ),
  getAppChatSessionAccess: (orgSlug: string, sessionId: string) =>
    fetchCached(`public-appchat-session:${orgSlug}:${sessionId}`, () =>
      fetchApi<AppChatSessionAccess>(`/api/channels/appchat/session/${encodeURIComponent(orgSlug)}/${encodeURIComponent(sessionId)}/`),
    ),

  // WhatsApp management
  getWhatsAppConnection: () =>
    fetchApi<WhatsAppConnectionApiItem>('/api/channels/whatsapp/connection/'),
  updateWhatsAppConnection: (data: WhatsAppConnectionPayload) =>
    fetchApi<WhatsAppConnectionApiItem>('/api/channels/whatsapp/connection/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  verifyWhatsAppWebhook: () =>
    fetchApi<{ status: string; webhook_url: string; last_webhook_received_at: string }>('/api/channels/whatsapp/verify-webhook/', {
      method: 'POST',
    }),
  syncWhatsAppTemplates: () =>
    fetchApi<{ status: string; last_sync_at: string }>('/api/channels/whatsapp/sync-templates/', {
      method: 'POST',
    }),
  simulateWhatsAppInbound: (data: WhatsAppSimulateInboundPayload) =>
    fetchApi<{ status: string; result: Record<string, unknown> }>('/api/channels/whatsapp/simulate-inbound/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getWhatsAppEmbeddedSignupConfig: () =>
    fetchApi<WhatsAppEmbeddedSignupConfig>('/api/channels/whatsapp/embedded-signup/config/'),
  startWhatsAppEmbeddedSignup: () =>
    fetchApi<WhatsAppEmbeddedSignupSession>('/api/channels/whatsapp/embedded-signup/start/', {
      method: 'POST',
    }),
  completeWhatsAppEmbeddedSignup: (data: WhatsAppEmbeddedSignupCompletePayload) =>
    fetchApi<WhatsAppConnectionApiItem>('/api/channels/whatsapp/embedded-signup/complete/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Web widget management
  getWebWidgetConnection: () =>
    fetchApi<WebWidgetConnectionApiItem>('/api/channels/webapp/connection/'),
  getPublicWebWidgetConnection: (orgSlug: string) =>
    fetchCached(`public-webwidget:${orgSlug}`, () =>
      fetchApi<WebWidgetPublicConfig>(`/api/channels/webapp/public/${orgSlug}/`),
    ),
  updateWebWidgetConnection: (data: WebWidgetConnectionPayload) =>
    fetchApi<WebWidgetConnectionApiItem>('/api/channels/webapp/connection/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  verifyWebWidgetInstall: () =>
    fetchApi<{ status: string; install_status: string; verified_domains: string[]; last_install_check_at: string }>(
      '/api/channels/webapp/verify-install/',
      {
        method: 'POST',
      },
    ),

  // App chat management
  getAppChatConnection: () =>
    fetchApi<AppChatConnectionApiItem>('/api/channels/appchat/connection/'),
  getPublicAppChatConnection: (orgSlug: string) =>
    fetchCached(`public-appchat:${orgSlug}`, () =>
      fetchApi<AppChatPublicConfig>(`/api/channels/appchat/public/${orgSlug}/`),
    ),
  uploadAppChatMedia: (file: File, kind: 'logo' | 'hero') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    return fetchApi<ChannelMediaUploadResult>('/api/channels/appchat/upload-media/', {
      method: 'POST',
      body: formData,
    });
  },
  updateAppChatConnection: (data: AppChatConnectionPayload) =>
    fetchApi<AppChatConnectionApiItem>('/api/channels/appchat/connection/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  verifyAppChatInstall: () =>
    fetchApi<AppChatVerifyInstallResult>('/api/channels/appchat/verify-install/', {
      method: 'POST',
    }),

  // Database integration management
  getDatabaseConnection: () =>
    fetchApi<DatabaseConnectionApiItem>('/api/channels/database/connection/'),
  updateDatabaseConnection: (data: DatabaseConnectionPayload) =>
    fetchApi<DatabaseConnectionApiItem>('/api/channels/database/connection/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  testDatabaseConnection: () =>
    fetchApi<DatabaseConnectionTestResult>('/api/channels/database/test-connection/', {
      method: 'POST',
    }),
  lookupAffiliateByDocument: (documentNumber: string) =>
    fetchApi<DatabaseLookupResult>('/api/channels/database/lookup-affiliate/', {
      method: 'POST',
      body: JSON.stringify({ document_number: documentNumber }),
    }),

  // Onboarding profile
  getOnboardingProfile: () =>
    fetchApi<OnboardingProfileApiItem>('/api/auth/onboarding-profile/'),
  updateOnboardingProfile: (data: OnboardingProfilePayload) =>
    fetchApi<OnboardingProfileApiItem>('/api/auth/onboarding-profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getSalesAgentMetrics: (days = 30) =>
    fetchApi<SalesAgentMetricsApiItem>(`/api/analytics/sales-agent/?days=${days}`),
  getHistoricalImports: () =>
    fetchApi<HistoricalImportApiItem[]>('/api/analytics/historical-imports/'),
  runHistoricalImport: (file: File, sourceName?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (sourceName?.trim()) {
      formData.append('source_name', sourceName.trim());
    }
    return fetchApi<HistoricalImportRunResult>('/api/analytics/historical-imports/', {
      method: 'POST',
      body: formData,
    });
  },
  importHistoricalKbSeed: (sourceName: string) =>
    fetchApi<{ created: number; updated: number }>('/api/analytics/historical-imports/import-kb/', {
      method: 'POST',
      body: JSON.stringify({ source_name: sourceName }),
    }),
  getLearningCandidates: (params?: { kind?: string; status?: string }) => {
    const q = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return fetchApi<LearningCandidateApiItem[]>(`/api/analytics/learning-candidates/${q}`);
  },
  generateLearningCandidates: (limit = 150) =>
    fetchApi<{ created: number; updated: number; processed_conversations: number }>('/api/analytics/learning-candidates/', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    }),
  approveLearningCandidate: (id: string) =>
    fetchApi<{ status: string; article_id: string }>(`/api/analytics/learning-candidates/${id}/approve/`, {
      method: 'POST',
    }),
  rejectLearningCandidate: (id: string) =>
    fetchApi<{ status: string }>(`/api/analytics/learning-candidates/${id}/reject/`, {
      method: 'POST',
    }),
  batchLearningCandidates: (ids: string[], action: 'approve' | 'reject') =>
    fetchApi<{ status: string; count: number }>(`/api/analytics/learning-candidates/batch/?action=${action}`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  getDocumentExtractionCandidates: (params?: { kind?: string; status?: string; source_document?: string }) => {
    const filtered = params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) : {};
    const q = Object.keys(filtered).length ? `?${new URLSearchParams(filtered as Record<string, string>).toString()}` : '';
    return fetchApi<DocumentExtractionCandidateApiItem[]>(`/api/analytics/document-extraction-candidates/${q}`);
  },
  generateDocumentExtractionCandidates: (documentId?: string) =>
    fetchApi<{ created: number; updated: number; processed_documents: number }>('/api/analytics/document-extraction-candidates/', {
      method: 'POST',
      body: JSON.stringify(documentId ? { document_id: documentId } : {}),
    }),
  approveDocumentExtractionCandidate: (id: string) =>
    fetchApi<{ status: string; target: 'article' | 'product'; id: string }>(`/api/analytics/document-extraction-candidates/${id}/approve/`, {
      method: 'POST',
    }),
  rejectDocumentExtractionCandidate: (id: string) =>
    fetchApi<{ status: string }>(`/api/analytics/document-extraction-candidates/${id}/reject/`, {
      method: 'POST',
    }),
  batchDocumentExtractionCandidates: (ids: string[], action: 'approve' | 'reject') =>
    fetchApi<{ status: string; count: number }>(`/api/analytics/document-extraction-candidates/batch/?action=${action}`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  uploadOnboardingQuickKnowledgeFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi<QuickKnowledgeFileItem>('/api/auth/onboarding-quick-knowledge/', {
      method: 'POST',
      body: formData,
    });
  },
  // Flows
  getFlows: () =>
    fetchList<FlowApiItem>('/api/flows/'),
  createFlow: (data: FlowPayload) =>
    fetchApi<FlowApiItem>('/api/flows/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFlow: (id: string, data: Partial<FlowPayload>) =>
    fetchApi<FlowApiItem>(`/api/flows/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteFlow: (id: string) =>
    fetchApi<void>(`/api/flows/${id}/`, {
      method: 'DELETE',
    }),
  getFlowIntents: () =>
    fetchList<{ id: string | null; value: string; label: string; is_custom: boolean; keywords?: string[] }>('/api/flows/intents/'),
  createCustomIntent: (data: { name: string; label: string; keywords: string[] }) =>
    fetchApi<{ id: string; value: string; label: string; is_custom: boolean; keywords: string[] }>('/api/flows/intents/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCustomIntent: (id: string) =>
    fetchApi<void>(`/api/flows/intents/${id}/`, { method: 'DELETE' }),

  // Ecommerce
  createOrder: (data: CreateOrderPayload) =>
    fetchApi<{ id: string; status: string; created_at: string }>('/api/ecommerce/orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  shipOrder: (id: string) =>
    fetchApi<{ id: string; status: string; updated_at: string }>(`/api/ecommerce/orders/${id}/ship/`, {
      method: 'POST',
    }),
  reserveInventory: (data: ReserveInventoryPayload) =>
    fetchApi<{ success: boolean; reservation_id?: string }>('/api/ecommerce/orders/inventory/reserve/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
