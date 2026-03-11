export type Channel = 'web' | 'whatsapp' | 'instagram' | 'tiktok';
export type Status = 'nuevo' | 'en_proceso' | 'escalado' | 'resuelto';
export type MessageRole = 'user' | 'bot' | 'agent';
export type Sentiment = 'positivo' | 'neutro' | 'negativo';
export type AudienceType = 'cliente' | 'asesor' | 'all' | 'admin';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  cedula: string;
  tipoAfiliado: 'trabajador' | 'pensionado' | 'independiente';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  tipo: 'bot_start' | 'intent_detected' | 'escalated' | 'agent_reply' | 'resolved' | 'note';
  descripcion: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  channel: Channel;
  status: Status;
  user: User;
  intent: string;
  sentiment: Sentiment;
  messages: Message[];
  timeline: TimelineEvent[];
  assignedAgent?: string;
  createdAt: string;
  lastMessageAt: string;
  lastMessage: string;
}

export interface AgentPerformance {
  id: string;
  nombre: string;
  conversaciones: number;
  resueltas: number;
  escaladas: number;
  tiempoPromedio: string;
  satisfaccion: number;
}

export interface MetricsDay {
  fecha: string;
  web: number;
  whatsapp: number;
  instagram: number;
  tiktok: number;
}

export interface IntentStat {
  nombre: string;
  count: number;
  porcentaje: number;
}

export interface HourStat {
  hora: string;
  total: number;
}

export interface NavItem {
  path: string;
  label: string;
  audience: AudienceType;
  icon?: string;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type ProductStatus = 'active' | 'draft' | 'archived';
export type OrderStatus =
  | 'new'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  reserved: number;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  status: ProductStatus;
  image: string;
  variants: ProductVariant[];
  tags: string[];
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  sku: string;
  type: 'in' | 'out' | 'adjustment' | 'reservation';
  quantity: number;
  reason: string;
  actor: string;
  createdAt: string;
}

export interface EcommerceOrder {
  id: string;
  customerName: string;
  channel: 'ecommerce' | 'whatsapp' | 'instagram' | 'web';
  status: OrderStatus;
  total: number;
  currency: 'COP';
  items: { sku: string; qty: number; unitPrice: number }[];
  createdAt: string;
  updatedAt: string;
}
