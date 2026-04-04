import type { Channel, Sentiment, Status } from '../../types';
import type { MessageItem } from '../../services/api';

export type InboxCommercialStatus =
  | 'nuevo'
  | 'en_conversacion'
  | 'interesado'
  | 'esperando_respuesta'
  | 'escalado'
  | 'cerrado'
  | 'venta_lograda'
  | 'perdido';

export type InboxOwner = 'ia' | 'humano';
export type InboxPriority = 'alta' | 'media' | 'baja';
export type InboxFilter =
  | 'todas'
  | 'pendientes'
  | 'sin_responder'
  | 'ia'
  | 'humano'
  | 'escaladas'
  | 'oportunidades'
  | 'cerradas'
  | 'perdidas';

export interface InboxNote {
  id: string;
  content: string;
  createdAt: string;
  noteType?: string;
  authorName?: string;
  isPinned?: boolean;
}

export interface InboxConversationMeta {
  commercialStatus: InboxCommercialStatus;
  owner: InboxOwner;
  priority: InboxPriority;
  followUp: boolean;
  opportunity: boolean;
  nextStep: string;
  summary: string;
  escalationReason: string;
  notes: InboxNote[];
}

export interface InboxActiveFlow {
  name: string;
  label: string;
  step: string;
  status: string;
  data: Record<string, unknown>;
}

export interface InboxConversationSummary {
  id: string;
  channel: Channel;
  channelLabel: string;
  apiStatus: Status;
  commercialStatus: InboxCommercialStatus;
  owner: InboxOwner;
  priority: InboxPriority;
  followUp: boolean;
  opportunity: boolean;
  sentiment: Sentiment;
  contactName: string;
  contactInitials: string;
  contactPhone?: string;
  contactEmail?: string;
  identifier: string;
  intent: string;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  assignedAgent?: string;
  nextStep?: string;
  summary?: string;
  escalationReason?: string;
  noteCount?: number;
  unread?: boolean;
  activeFlow?: InboxActiveFlow | null;
  qualification?: Record<string, unknown>;
  salesStage?: string;
  closeSignals?: string[];
}

export interface InboxConversationDetail extends InboxConversationSummary {
  messages: MessageItem[];
  notes: InboxNote[];
  timeline: Array<{
    id: string;
    tipo: string;
    descripcion: string;
    timestamp: string;
  }>;
}

export interface InboxRelatedProduct {
  id: string;
  title: string;
  category: string;
  priceLabel: string;
  availabilityLabel: string;
  promotionLabel?: string;
}

export interface InboxKnowledgeSuggestion {
  id: string;
  title: string;
  kind: 'article' | 'document';
  excerpt: string;
  statusLabel?: string;
}
