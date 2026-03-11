const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
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
  return res.json() as Promise<T>;
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
  last_message_at: string;
  created_at: string;
  user?: {
    id: string;
    cedula: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    email?: string;
    tipo_afiliado: string;
  };
  agent_nombre?: string;
}

export interface ConvDetail extends ConvListItem {
  messages: MessageItem[];
  timeline: {
    id: string;
    tipo: string;
    descripcion: string;
    timestamp: string;
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
  activo: boolean;
  created_at: string;
}

export interface CreateUserPayload {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono?: string;
  email?: string;
  tipo_afiliado: string;
}

export interface CreateOrderPayload {
  customer_name: string;
  channel: 'ecommerce' | 'whatsapp' | 'instagram' | 'web';
  items: { sku: string; qty: number; unit_price: number }[];
  currency?: 'COP';
}

export interface ReserveInventoryPayload {
  order_id: string;
  items: { sku: string; qty: number }[];
}

// ─── API object ───────────────────────────────────────────────────────────────

export const api = {
  // Health
  health: () => fetchApi<{ status: string }>('/health'),

  // Auth
  login: (email: string, password: string) =>
    fetchApi<{
      access_token: string;
      agent_id: string;
      agent_nombre: string;
      token_type: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Conversations
  getConversations: (params?: { canal?: string; estado?: string }) => {
    const q = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return fetchApi<ConvListItem[]>(`/conversations${q}`);
  },
  getConversation: (id: string) => fetchApi<ConvDetail>(`/conversations/${id}`),
  sendMessage: (id: string, content: string, role = 'agent') =>
    fetchApi<MessageItem>(`/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, role }),
    }),
  escalate: (id: string) =>
    fetchApi<{ status: string }>(`/conversations/${id}/escalate`, { method: 'POST' }),
  resolve: (id: string) =>
    fetchApi<{ status: string }>(`/conversations/${id}/resolve`, { method: 'POST' }),

  // Metrics
  getMetricsOverview: () => fetchApi<MetricsOverview>('/metrics/overview'),
  getMetricsChannels: () => fetchApi<ChannelMetric[]>('/metrics/channels'),
  getMetricsIntents: () => fetchApi<IntentMetric[]>('/metrics/intents'),

  // Pricing
  getPricing: () => fetchApi<PricingItem[]>('/pricing'),

  // Admin – Agents
  getAgents: () => fetchApi<AgentAdmin[]>('/admin/agents'),
  createAgent: (data: CreateAgentPayload) =>
    fetchApi<AgentAdmin>('/admin/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAgent: (id: string, data: Partial<CreateAgentPayload>) =>
    fetchApi<AgentAdmin>(`/admin/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleAgent: (id: string, activo: boolean) =>
    fetchApi<AgentAdmin>(`/admin/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ activo }),
    }),

  // Admin – Users (afiliados)
  getUsers: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchApi<UserAdmin[]>(`/admin/users${q}`);
  },
  createUser: (data: CreateUserPayload) =>
    fetchApi<UserAdmin>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: Partial<CreateUserPayload>) =>
    fetchApi<UserAdmin>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // WhatsApp
  sendWhatsApp: (to: string, message: string) =>
    fetchApi<{ success: boolean; message_id?: string }>('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ to, message }),
    }),

  // Ecommerce
  createOrder: (data: CreateOrderPayload) =>
    fetchApi<{ id: string; status: string; created_at: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  shipOrder: (id: string) =>
    fetchApi<{ id: string; status: string; updated_at: string }>(`/orders/${id}/ship`, {
      method: 'POST',
    }),
  reserveInventory: (data: ReserveInventoryPayload) =>
    fetchApi<{ success: boolean; reservation_id?: string }>('/inventory/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
