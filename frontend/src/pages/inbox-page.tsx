import { useEffect, useMemo, useRef, useState } from 'react';
import { setUnreadCount } from '../lib/unread-store';
import { AlertTriangle, ChevronLeft, Columns3, ListFilter, PanelsTopLeft, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type {
  AICopilotResponse,
  AISummaryResponse,
  AppChatConnectionApiItem,
  ConvDetail,
  ConvListItem,
  KBArticleApiItem,
  KBDocumentApiItem,
  OrderApiItem,
  ProductApiItem,
  WebWidgetConnectionApiItem,
  WhatsAppConnectionApiItem,
} from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { Button, Card } from '../components/ui/primitives';
import { PageHeader } from '../components/ui/page-header';
import { InboxConversationList } from '../components/inbox/inbox-conversation-list';
import { ConversationView } from '../components/inbox/conversation-view';
import { ConversationContextPanel } from '../components/inbox/conversation-context-panel';
import { EmptyInboxState } from '../components/inbox/empty-inbox-state';
import type {
  InboxCommercialStatus,
  InboxConversationDetail,
  InboxConversationMeta,
  InboxKnowledgeSuggestion,
  InboxConversationSummary,
  InboxFilter,
  InboxRelatedProduct,
} from '../components/inbox/types';

type MobilePane = 'listado' | 'chat' | 'contexto';

function normalizeChannelLabel(channel: string) {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'instagram') return 'Instagram';
  if (channel === 'web') return 'Web';
  if (channel === 'app') return 'App Chat';
  if (channel === 'tiktok') return 'TikTok';
  return channel;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function inferCommercialStatus(apiStatus: string): InboxCommercialStatus {
  if (apiStatus === 'escalado') return 'escalado';
  if (apiStatus === 'resuelto') return 'cerrado';
  if (apiStatus === 'en_proceso') return 'en_conversacion';
  return 'nuevo';
}

function detectOpportunity(source: string) {
  const text = source.toLowerCase();
  return ['precio', 'stock', 'disponible', 'recomiendas', 'quiero', 'comprar', 'cuanto'].some((word) => text.includes(word));
}

function computePriority(source: string, sentiment: string): InboxConversationMeta['priority'] {
  const text = source.toLowerCase();
  if (sentiment === 'negativo' || ['urgente', 'hoy', 'ya', 'ahora'].some((word) => text.includes(word))) return 'alta';
  if (detectOpportunity(source)) return 'media';
  return 'baja';
}

function metaFromConversation(conversation: ConvListItem): InboxConversationMeta {
  const source = `${conversation.intent || ''} ${conversation.last_message || ''}`;
  return {
    commercialStatus: conversation.commercial_status || inferCommercialStatus(conversation.estado),
    owner: conversation.owner || (conversation.agent_nombre ? 'humano' : 'ia'),
    priority: conversation.priority || computePriority(source, conversation.sentimiento),
    followUp: conversation.follow_up ?? false,
    opportunity: conversation.opportunity ?? detectOpportunity(source),
    nextStep: conversation.next_step || '',
    summary: conversation.conversation_summary || '',
    escalationReason: conversation.escalation_reason || '',
    notes: [],
  };
}

function buildSummary(conversation: ConvListItem): InboxConversationSummary {
  const fullName = [conversation.contact_nombre, conversation.contact_apellido].filter(Boolean).join(' ').trim() || 'Cliente sin nombre';
  const identifier = conversation.contact_email || conversation.contact_telefono || conversation.contact_cedula || 'Sin identificador';
  const meta = metaFromConversation(conversation);
  return {
    id: conversation.id,
    channel: (conversation.canal as InboxConversationSummary['channel']) || 'web',
    channelLabel: normalizeChannelLabel(conversation.canal),
    apiStatus: conversation.estado as InboxConversationSummary['apiStatus'],
    commercialStatus: meta.commercialStatus,
    owner: meta.owner,
    activeAiAgent: conversation.active_ai_agent || '',
    priority: meta.priority,
    followUp: meta.followUp,
    opportunity: meta.opportunity,
    sentiment: conversation.sentimiento as InboxConversationSummary['sentiment'],
    contactName: fullName,
    contactInitials: getInitials(fullName),
    contactPhone: conversation.contact_telefono,
    contactEmail: conversation.contact_email,
    identifier,
    intent: conversation.intent || 'Sin clasificar',
    lastMessage: conversation.last_message || '',
    lastMessageAt: conversation.last_message_at,
    createdAt: conversation.created_at,
    assignedAgent: conversation.agent_nombre || undefined,
    nextStep: meta.nextStep,
    summary: meta.summary,
    escalationReason: meta.escalationReason,
    noteCount: conversation.note_count || 0,
    unread: conversation.unread ?? false,
    activeFlow: conversation.active_flow || null,
    qualification: conversation.qualification || {},
    salesStage: conversation.sales_stage || '',
    closeSignals: conversation.close_signals || [],
  };
}

function buildDetail(summary: InboxConversationSummary, detail: ConvDetail | null): InboxConversationDetail {
  return {
    ...summary,
    metadata: (detail?.metadata as Record<string, unknown> | undefined) || {},
    contactMemory: detail?.contact_memory || null,
    nextStep: detail?.next_step || summary.nextStep,
    summary: detail?.conversation_summary || summary.summary,
    escalationReason: detail?.escalation_reason || summary.escalationReason,
    messages: detail?.messages || [],
    timeline: detail?.timeline || [],
    notes: (detail?.notes || []).map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.created_at,
      noteType: note.note_type,
      authorName: note.author_nombre,
      isPinned: note.is_pinned,
    })),
    unread: detail?.unread ?? summary.unread,
    activeFlow: detail?.active_flow ?? summary.activeFlow ?? null,
    qualification: detail?.qualification ?? summary.qualification ?? {},
    salesStage: detail?.sales_stage ?? summary.salesStage ?? '',
    closeSignals: detail?.close_signals ?? summary.closeSignals ?? [],
  };
}

function matchesFilter(conversation: InboxConversationSummary, filter: InboxFilter) {
  switch (filter) {
    case 'pendientes':
      return ['nuevo', 'en_conversacion', 'interesado', 'esperando_respuesta'].includes(conversation.commercialStatus);
    case 'sin_responder':
      return conversation.apiStatus === 'nuevo';
    case 'ia':
      return conversation.owner === 'ia';
    case 'humano':
      return conversation.owner === 'humano';
    case 'escaladas':
      return conversation.commercialStatus === 'escalado';
    case 'oportunidades':
      return conversation.opportunity;
    case 'cerradas':
      return ['cerrado', 'venta_lograda'].includes(conversation.commercialStatus);
    case 'perdidas':
      return conversation.commercialStatus === 'perdido';
    default:
      return true;
  }
}

function searchConversation(conversation: InboxConversationSummary, term: string) {
  const q = term.toLowerCase();
  return [
    conversation.contactName,
    conversation.identifier,
    conversation.lastMessage,
    conversation.intent,
    conversation.summary || '',
  ].join(' ').toLowerCase().includes(q);
}

function inferRelatedProducts(conversation: InboxConversationDetail | null, products: ProductApiItem[]): InboxRelatedProduct[] {
  if (!conversation || products.length === 0) return [];
  const haystack = [
    conversation.intent,
    conversation.lastMessage,
    conversation.summary || '',
    ...conversation.messages.map((item) => item.content),
  ].join(' ').toLowerCase();
  return products
    .filter((product) => haystack.includes(product.title.toLowerCase()) || haystack.includes(product.category.toLowerCase()))
    .slice(0, 3)
    .map((product) => {
      const pricedVariant = product.variants.find((variant) => variant.price > 0);
      const availableUnits = product.variants.reduce((total, variant) => total + Math.max(0, variant.stock - variant.reserved), 0);
      const promotion = (product.attributes?.promotion as { active?: boolean; value?: number; type?: 'percentage' | 'fixed' } | undefined) ?? undefined;
      const promotionLabel = promotion?.active && promotion.value
        ? promotion.type === 'fixed'
          ? `Promo: -$${promotion.value.toLocaleString('es-CO')}`
          : `Promo: -${promotion.value}%`
        : undefined;
      return {
        id: product.id,
        title: product.title,
        category: product.category,
        priceLabel: pricedVariant ? `Desde $${pricedVariant.price.toLocaleString('es-CO')}` : 'Precio por confirmar',
        availabilityLabel: availableUnits > 0 ? `${availableUnits} unidades disponibles` : 'Sin stock ahora mismo',
        promotionLabel,
      };
    });
}

function inferRelatedKnowledge(
  conversation: InboxConversationDetail | null,
  articles: KBArticleApiItem[],
  documents: KBDocumentApiItem[],
): InboxKnowledgeSuggestion[] {
  if (!conversation) return [];

  const haystack = [
    conversation.intent,
    conversation.lastMessage,
    conversation.summary || '',
    conversation.nextStep || '',
    ...conversation.messages.map((item) => item.content),
  ]
    .join(' ')
    .toLowerCase();

  const tokens = Array.from(
    new Set(
      haystack
        .split(/[^a-zA-Z0-9áéíóúüñ]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 4),
    ),
  );

  const scoreText = (text: string) => {
    const source = text.toLowerCase();
    return tokens.reduce((score, token) => score + (source.includes(token) ? 1 : 0), 0);
  };

  const articleMatches = articles
    .filter((article) => article.status === 'published')
    .map((article) => ({
      id: article.id,
      title: article.title,
      kind: 'article' as const,
      excerpt: article.content.trim().slice(0, 220),
      score: scoreText([article.title, article.category, article.content].join(' ')),
    }))
    .filter((item) => item.score > 0);

  const documentMatches = documents
    .filter((document) => document.processing_status === 'ready')
    .map((document) => ({
      id: document.id,
      title: document.filename,
      kind: 'document' as const,
      excerpt: (document.extracted_text || '').trim().slice(0, 220) || 'Documento procesado y listo para usarse.',
      statusLabel: 'ready',
      score: scoreText([document.filename, document.extracted_text || ''].join(' ')),
    }))
    .filter((item) => item.score > 0);

  return [...articleMatches, ...documentMatches]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ score: _score, ...item }) => item);
}

export function InboxPage() {
  const { showError, showInfo, showSuccess } = useNotification();
  const { connected, lastMessage } = useWebSocket('/ws/inbox/', 'subprotocol');
  const autoSummaryRequestedRef = useRef<Set<string>>(new Set());
  const autoCopilotRequestedRef = useRef<Set<string>>(new Set());
  const [mobilePane, setMobilePane] = useState<MobilePane>('listado');
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>('todas');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingBatchJson, setExportingBatchJson] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [aiSummaryMap, setAiSummaryMap] = useState<Record<string, string>>({});
  const [copilotMap, setCopilotMap] = useState<Record<string, string[]>>({});
  const [aiSummaryLoadingId, setAiSummaryLoadingId] = useState<string | null>(null);
  const [copilotLoadingId, setCopilotLoadingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversationList, setConversationList] = useState<ConvListItem[]>([]);
  const [detailsMap, setDetailsMap] = useState<Record<string, ConvDetail>>({});
  const [products, setProducts] = useState<ProductApiItem[]>([]);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KBArticleApiItem[]>([]);
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<KBDocumentApiItem[]>([]);
  const [orders, setOrders] = useState<OrderApiItem[]>([]);
  const [appChat, setAppChat] = useState<AppChatConnectionApiItem | null>(null);
  const [webWidget, setWebWidget] = useState<WebWidgetConnectionApiItem | null>(null);
  const [whatsapp, setWhatsApp] = useState<WhatsAppConnectionApiItem | null>(null);

  // Sync unread count to sidebar
  useEffect(() => {
    setUnreadCount(conversationList.filter((c) => c.unread).length);
  }, [conversationList]);

  useEffect(() => {
    void loadInbox();
  }, []);

  async function loadInbox() {
    setListLoading(true);
    setError(null);
    try {
      const [conversations, productsResult, articlesResult, documentsResult, ordersResult, appChatResult, webWidgetResult, whatsappResult] = await Promise.all([
        api.getConversations(),
        api.getProducts().catch(() => []),
        api.getKnowledgeBaseArticles().catch(() => []),
        api.getKnowledgeBaseDocuments().catch(() => []),
        api.getOrders().catch(() => []),
        api.getAppChatConnection().catch(() => null),
        api.getWebWidgetConnection().catch(() => null),
        api.getWhatsAppConnection().catch(() => null),
      ]);

      setConversationList(conversations);
      setProducts(productsResult);
      setKnowledgeArticles(articlesResult);
      setKnowledgeDocuments(documentsResult);
      setOrders(ordersResult);
      setAppChat(appChatResult);
      setWebWidget(webWidgetResult);
      setWhatsApp(whatsappResult);

      if (!selectedId && conversations.length > 0) {
        setSelectedId(conversations[0].id);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'No se pudo cargar el inbox.';
      setError(message);
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshInbox() {
    setRefreshing(true);
    await loadInbox();
  }

  async function refreshConversation(id: string) {
    const detail = await api.getConversation(id);
    setDetailsMap((current) => ({ ...current, [id]: detail }));
    setConversationList((current) =>
      current.map((item) => (item.id === id ? { ...item, ...detail, unread: false, last_message: detail.messages.at(-1)?.content || item.last_message } : item)),
    );
    return detail;
  }

  const summaries = useMemo(() => {
    return conversationList.map((conversation) => buildSummary(conversation));
  }, [conversationList]);

  const filteredConversations = useMemo(() => {
    return summaries.filter((conversation) => matchesFilter(conversation, filter)).filter((conversation) => searchConversation(conversation, search));
  }, [summaries, filter, search]);

  const selectedSummary = useMemo(
    () => summaries.find((conversation) => conversation.id === selectedId) || null,
    [summaries, selectedId],
  );

  const selectedDetail = useMemo(() => {
    if (!selectedSummary) return null;
    return buildDetail(selectedSummary, detailsMap[selectedSummary.id] || null);
  }, [selectedSummary, detailsMap]);

  const relatedProducts = useMemo(() => inferRelatedProducts(selectedDetail, products), [selectedDetail, products]);
  const relatedKnowledge = useMemo(
    () => inferRelatedKnowledge(selectedDetail, knowledgeArticles, knowledgeDocuments),
    [selectedDetail, knowledgeArticles, knowledgeDocuments],
  );

  const activeAiSummary = selectedId ? aiSummaryMap[selectedId] || '' : '';
  const activeCopilotSuggestions = selectedId ? copilotMap[selectedId] || [] : [];

  useEffect(() => {
    if (!selectedId) return;
    const conversationId = selectedId;
    let cancelled = false;

    async function loadDetail() {
      setDetailLoading(true);
      try {
        const detail = await api.getConversation(conversationId);
        if (!cancelled) {
          setDetailsMap((current) => ({ ...current, [conversationId]: detail }));
        }
      } catch (loadError) {
        if (!cancelled) {
          showError('Inbox', loadError instanceof Error ? loadError.message : 'No se pudo abrir la conversacion.');
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    if (!detailsMap[conversationId]) {
      void loadDetail();
    }

    return () => {
      cancelled = true;
    };
  }, [selectedId, detailsMap, showError]);

  useEffect(() => {
    if (!selectedDetail) return;
    if (!aiSummaryMap[selectedDetail.id] && !autoSummaryRequestedRef.current.has(selectedDetail.id)) {
      autoSummaryRequestedRef.current.add(selectedDetail.id);
      void generateAISummary(selectedDetail.id, { silent: true });
    }
    if (
      (!copilotMap[selectedDetail.id] || copilotMap[selectedDetail.id].length === 0) &&
      !autoCopilotRequestedRef.current.has(selectedDetail.id)
    ) {
      autoCopilotRequestedRef.current.add(selectedDetail.id);
      void generateCopilotSuggestions(selectedDetail.id, { silent: true });
    }
  }, [selectedDetail, aiSummaryMap, copilotMap]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'conversation_upserted') {
      const rawData = lastMessage.data;
      const rawConversation = rawData && typeof rawData === 'object' ? (rawData as { conversation?: ConvListItem }).conversation : undefined;
      if (!rawConversation?.id) return;
      setConversationList((current) => {
        const existing = current.find((item) => item.id === rawConversation.id);
        const next = existing
          ? current.map((item) => (item.id === rawConversation.id ? { ...item, ...rawConversation } : item))
          : [rawConversation, ...current];
        return [...next].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      });
      return;
    }

    if (lastMessage.type !== 'new_message') return;
    const conversationId = typeof lastMessage.conversation_id === 'string' ? lastMessage.conversation_id : '';
    const rawMessage = lastMessage.message;
    const rawConversation = lastMessage.conversation;
    if (!conversationId || !rawMessage || typeof rawMessage !== 'object') return;

    const message = rawMessage as {
      id?: string;
      role?: string;
      content?: string;
      timestamp?: string;
      media_url?: string | null;
      media_type?: string | null;
    };
    if (!message.id || !message.role || !message.content || !message.timestamp) return;
    const nextMessage = {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      media_url: message.media_url ?? null,
      media_type: message.media_type ?? null,
    };

    setConversationList((current) => {
      const serializedConversation = rawConversation && typeof rawConversation === 'object' ? (rawConversation as ConvListItem) : null;
      const exists = current.some((item) => item.id === conversationId);
      const unread = nextMessage.role === 'user' && selectedId !== conversationId;
      const baseList = exists
        ? current.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  ...(serializedConversation || {}),
                  unread: unread ? true : (serializedConversation?.unread ?? item.unread),
                  last_message: nextMessage.content || item.last_message,
                  last_message_at: nextMessage.timestamp || item.last_message_at,
                }
              : item,
          )
        : serializedConversation
          ? [
              {
                ...serializedConversation,
                unread: nextMessage.role === 'user' ? true : (serializedConversation.unread ?? false),
                last_message: nextMessage.content,
                last_message_at: nextMessage.timestamp,
              },
              ...current,
            ]
          : current;
      return [...baseList].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    });

    setDetailsMap((current) => {
      const detail = current[conversationId];
      if (!detail) return current;
      if (detail.messages.some((item) => item.id === message.id)) return current;
      return {
        ...current,
        [conversationId]: {
          ...detail,
          unread: nextMessage.role === 'user' && selectedId !== conversationId ? true : false,
          last_message_at: nextMessage.timestamp || detail.last_message_at,
          messages: [
            ...detail.messages,
            nextMessage,
          ],
        },
      };
    });

    if (!selectedId) return;
    if (selectedId === conversationId && !detailsMap[conversationId]) {
      void refreshConversation(conversationId);
    }
  }, [lastMessage, selectedId, detailsMap]);

  useEffect(() => {
    if (!selectedId) return;
    const selectedConversation = conversationList.find((item) => item.id === selectedId);
    if (!selectedConversation?.unread) return;

    setConversationList((current) =>
      current.map((item) => (item.id === selectedId ? { ...item, unread: false } : item)),
    );
    setDetailsMap((current) => {
      const detail = current[selectedId];
      if (!detail) return current;
      return {
        ...current,
        [selectedId]: {
          ...detail,
          unread: false,
        },
      };
    });
    void api.markConversationRead(selectedId).catch(() => {});
  }, [selectedId, conversationList]);

  async function updateOperatorState(patch: {
    owner?: 'ia' | 'humano';
    commercial_status?: InboxCommercialStatus;
    priority?: 'alta' | 'media' | 'baja';
    follow_up?: boolean;
    opportunity?: boolean;
    next_step?: string;
    conversation_summary?: string;
    escalation_reason?: string;
  }) {
    if (!selectedId) return;
    await api.updateConversationOperatorState(selectedId, patch);
    await refreshConversation(selectedId);
  }

  async function generateAISummary(conversationId: string, options?: { silent?: boolean }) {
    setAiSummaryLoadingId(conversationId);
    try {
      const response: AISummaryResponse = await api.getAISummary(conversationId);
      setAiSummaryMap((current) => ({ ...current, [conversationId]: response.summary.trim() }));
      if (!options?.silent) {
        showSuccess('Resumen AI listo', 'Ya tienes un resumen nuevo para esta conversacion.');
      }
      return response.summary.trim();
    } catch (error) {
      if (!options?.silent) {
        showError('Resumen AI', error instanceof Error ? error.message : 'No se pudo generar el resumen.');
      }
      return '';
    } finally {
      setAiSummaryLoadingId((current) => (current === conversationId ? null : current));
    }
  }

  async function generateCopilotSuggestions(conversationId: string, options?: { silent?: boolean }) {
    const detail = detailsMap[conversationId] || (selectedDetail?.id === conversationId ? detailsMap[conversationId] || null : null);
    const summary = summaries.find((item) => item.id === conversationId) || (selectedDetail?.id === conversationId ? selectedDetail : null);
    setCopilotLoadingId(conversationId);
    try {
      const payload = {
        conversation_id: conversationId,
        intent: summary?.intent && summary.intent !== 'Sin clasificar' ? summary.intent : 'default',
        messages: (detail?.messages || selectedDetail?.messages || [])
          .slice(-12)
          .map((message) => ({ role: message.role, content: message.content })),
      };
      const response: AICopilotResponse = await api.getAICopilot(payload);
      const suggestions = response.suggestions.filter((item) => item.trim());
      setCopilotMap((current) => ({ ...current, [conversationId]: suggestions }));
      if (!options?.silent) {
        showSuccess('Copilot listo', 'Ya tienes respuestas sugeridas para esta conversacion.');
      }
      return suggestions;
    } catch (error) {
      if (!options?.silent) {
        showError('Copilot', error instanceof Error ? error.message : 'No se pudieron generar sugerencias.');
      }
      return [];
    } finally {
      setCopilotLoadingId((current) => (current === conversationId ? null : current));
    }
  }

  async function handleSend() {
    if (!selectedDetail || !draft.trim()) return;

    if (selectedDetail.owner === 'ia') {
      showInfo('La conversacion sigue con IA', 'Toma la conversacion o escala antes de responder manualmente.');
      return;
    }

    setSending(true);
    const content = draft.trim();
    try {
      await api.sendMessage(selectedDetail.id, content, 'agent');
      setDraft('');
      await refreshConversation(selectedDetail.id);
      await updateOperatorState({ commercial_status: 'en_conversacion' });
      showSuccess('Mensaje enviado', 'La conversacion sigue en curso.');
    } catch (sendError) {
      showError('Inbox', sendError instanceof Error ? sendError.message : 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  async function handleEscalate() {
    if (!selectedDetail) return;
    const reason = window.prompt('Motivo de escalado para el equipo humano:', selectedDetail.escalationReason || '');
    if (reason === null) return;
    try {
      await api.escalate(selectedDetail.id);
      await updateOperatorState({
        owner: 'humano',
        commercial_status: 'escalado',
        priority: 'alta',
        follow_up: true,
        escalation_reason: reason.trim(),
      });
      showSuccess('Escalada a humano', 'La conversacion ya queda en manos del equipo.');
    } catch (actionError) {
      showError('Inbox', actionError instanceof Error ? actionError.message : 'No se pudo escalar la conversacion.');
    }
  }

  async function handleTakeOver() {
    if (!selectedDetail) return;
    try {
      await api.takeOverConversation(selectedDetail.id);
      await refreshConversation(selectedDetail.id);
      showSuccess('Conversacion tomada', 'Ahora la conversacion queda asignada al operador.');
    } catch (actionError) {
      showError('Inbox', actionError instanceof Error ? actionError.message : 'No se pudo tomar la conversacion.');
    }
  }

  async function handleReturnToIA() {
    if (!selectedDetail) return;
    try {
      await api.returnConversationToAI(selectedDetail.id);
      await updateOperatorState({
        owner: 'ia',
        commercial_status: selectedDetail.commercialStatus === 'escalado' ? 'esperando_respuesta' : selectedDetail.commercialStatus,
      });
      showInfo('Devuelta a IA', 'La conversacion vuelve al flujo automatico.');
    } catch (actionError) {
      showError('Inbox', actionError instanceof Error ? actionError.message : 'No se pudo devolver la conversacion a IA.');
    }
  }

  async function handleAddInternalNote() {
    if (!selectedDetail) return;
    const content = draft.trim();
    if (!content) {
      showInfo('Nota interna', 'Escribe primero algo util para guardar como nota.');
      return;
    }
    try {
      await api.addConversationNote(selectedDetail.id, { content, note_type: 'note' });
      setDraft('');
      await updateOperatorState({ follow_up: true });
      showSuccess('Nota guardada', 'La nota interna queda disponible para el equipo.');
    } catch (noteError) {
      showError('Inbox', noteError instanceof Error ? noteError.message : 'No se pudo guardar la nota.');
    }
  }

  async function handleResolveCommercially() {
    if (!selectedDetail) return;
    try {
      await api.resolve(selectedDetail.id);
      await updateOperatorState({ commercial_status: 'cerrado', follow_up: false });
      showSuccess('Conversacion cerrada', 'La marcamos como resuelta.');
    } catch (actionError) {
      showError('Inbox', actionError instanceof Error ? actionError.message : 'No se pudo cerrar la conversacion.');
    }
  }

  async function handleReopen() {
    if (!selectedDetail) return;
    try {
      await api.reopen(selectedDetail.id);
      await updateOperatorState({ commercial_status: 'en_conversacion' });
      showSuccess('Conversacion reabierta', 'La IA retoma la conversacion.');
    } catch (actionError) {
      showError('Inbox', actionError instanceof Error ? actionError.message : 'No se pudo reabrir.');
    }
  }

  async function handleStatusChange(status: InboxCommercialStatus) {
    if (!selectedDetail) return;
    await updateOperatorState({
      commercial_status: status,
      follow_up: ['venta_lograda', 'perdido', 'cerrado'].includes(status) ? false : selectedDetail.followUp,
    });
  }

  async function handleToggleFollowUp() {
    if (!selectedDetail) return;
    await updateOperatorState({ follow_up: !selectedDetail.followUp });
  }

  async function handleEditNextStep() {
    if (!selectedDetail) return;
    const nextStep = window.prompt('Siguiente paso para esta conversacion:', selectedDetail.nextStep || '');
    if (nextStep === null) return;
    await updateOperatorState({ next_step: nextStep.trim() });
  }

  async function handleEditSummary() {
    if (!selectedDetail) return;
    const summary = window.prompt('Resumen operativo de la conversacion:', selectedDetail.summary || '');
    if (summary === null) return;
    await updateOperatorState({ conversation_summary: summary.trim() });
  }

  async function handleGenerateAISummary() {
    if (!selectedDetail) return;
    await generateAISummary(selectedDetail.id);
  }

  async function handleUseAISummary() {
    if (!selectedDetail || !activeAiSummary.trim()) return;
    await updateOperatorState({ conversation_summary: activeAiSummary.trim() });
    showSuccess('Resumen actualizado', 'El resumen AI se guardo en la conversacion.');
  }

  async function handleGenerateCopilot() {
    if (!selectedDetail) return;
    await generateCopilotSuggestions(selectedDetail.id);
  }

  function handleUseCopilotSuggestion(suggestion: string) {
    setDraft(suggestion);
    showInfo('Copilot', 'Deje la respuesta sugerida lista en el composer.');
  }

  async function handleSaveContact(payload: { nombre: string; telefono: string; email: string }) {
    if (!selectedDetail) return;
    if (!payload.nombre.trim()) {
      showInfo('Contacto', 'El nombre es obligatorio para guardar el contacto.');
      return;
    }
    setSavingContact(true);
    try {
      await api.updateConversationContact(selectedDetail.id, {
        nombre: payload.nombre.trim(),
        telefono: payload.telefono.trim(),
        email: payload.email.trim(),
      });
      await refreshConversation(selectedDetail.id);
      showSuccess('Contacto actualizado', 'Los datos del cliente ya quedaron guardados en la conversacion.');
    } catch (saveError) {
      showError('Contacto', saveError instanceof Error ? saveError.message : 'No se pudo guardar el contacto.');
    } finally {
      setSavingContact(false);
    }
  }

  async function handleExportConversationJson() {
    if (!selectedDetail) return;
    setExportingJson(true);
    try {
      await api.exportConversationJson(selectedDetail.id);
      showSuccess('Conversacion exportada', 'Se descargo el archivo JSON de esta conversacion.');
    } catch (error) {
      showError('Exportacion', error instanceof Error ? error.message : 'No se pudo exportar la conversacion.');
    } finally {
      setExportingJson(false);
    }
  }

  async function handleExportBatchJson() {
    if (filteredConversations.length === 0) {
      showInfo('Exportacion', 'No hay conversaciones visibles para exportar con este filtro.');
      return;
    }
    setExportingBatchJson(true);
    try {
      await api.exportConversationBatchJson(filteredConversations.map((item) => item.id));
      showSuccess('Exportacion lista', `Se descargaron ${filteredConversations.length} conversaciones visibles en un solo JSON.`);
    } catch (error) {
      showError('Exportacion', error instanceof Error ? error.message : 'No se pudo exportar el lote de conversaciones.');
    } finally {
      setExportingBatchJson(false);
    }
  }

  function handleShareProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const orgSlug = appChat?.organization_slug || webWidget?.organization_slug || '';
    const productUrl = orgSlug ? `${window.location.origin}/shop/${orgSlug}/${product.id}` : '';
    const pricedVariant = product.variants.find((variant) => variant.price > 0);
    const availableUnits = product.variants.reduce((total, variant) => total + Math.max(0, variant.stock - variant.reserved), 0);
    const promotion = (product.attributes?.promotion as { active?: boolean; value?: number; type?: 'percentage' | 'fixed' } | undefined) ?? undefined;
    const promoText = promotion?.active && promotion.value
      ? promotion.type === 'fixed'
        ? ` Tiene un descuento actual de $${promotion.value.toLocaleString('es-CO')}.`
        : ` Tiene un descuento actual del ${promotion.value}%.`
      : '';
    const copy = `Te comparto una opcion que puede encajar: ${product.title}. ${pricedVariant ? `Desde $${pricedVariant.price.toLocaleString('es-CO')}.` : 'Precio a confirmar.'} ${availableUnits > 0 ? `${availableUnits} unidades disponibles.` : 'Disponibilidad por confirmar.'}${promoText}${productUrl ? ` Mira la ficha aqui: ${productUrl}` : ''} Si quieres, te ayudo a seguir con este producto.`;
    setDraft(copy);
    showInfo('Producto listo para compartir', 'He dejado el mensaje preparado en el composer.');
  }

  async function handleCreateOrder(productId: string) {
    if (!selectedDetail) return;
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const variant = product.variants.find((item) => item.price > 0) || product.variants[0];
    if (!variant) {
      showInfo('Pedido', 'Este producto no tiene variantes configuradas todavia.');
      return;
    }
    const quantityInput = window.prompt('Cantidad para el pedido:', '1');
    if (quantityInput === null) return;
    const quantity = Math.max(1, Number(quantityInput) || 1);
    const channel = selectedDetail.channel === 'app' ? 'app' : selectedDetail.channel === 'whatsapp' ? 'whatsapp' : selectedDetail.channel === 'instagram' ? 'instagram' : 'web';

    try {
      await api.createOrder({
        customer_name: selectedDetail.contactName,
        contact: detailsMap[selectedDetail.id]?.contact || null,
        order_kind: product.offer_type === 'service' ? 'booking' : 'purchase',
        channel,
        items: [
          {
            sku: variant.sku,
            qty: quantity,
            unit_price: variant.price,
            title: product.title,
            offer_type: product.offer_type,
          },
        ],
        currency: 'COP',
        service_location: product.offer_type === 'service' ? 'Pendiente de coordinar' : undefined,
        scheduled_for: product.offer_type === 'service' ? new Date(Date.now() + 86400000).toISOString() : undefined,
        fulfillment_summary: {
          conversation_id: selectedDetail.id,
          source: 'inbox',
          product_id: product.id,
        },
        notes: `Pedido creado desde Inbox para ${selectedDetail.contactName}.`,
      });
      showSuccess('Pedido creado', 'Ya dejamos creado un pedido simple desde la conversacion.');
    } catch (error) {
      showError('Pedidos', error instanceof Error ? error.message : 'No se pudo crear el pedido.');
    }
  }

  const activeChannels = useMemo(() => {
    return [appChat?.is_active ? 'App Chat' : null, webWidget?.is_active ? 'Web Widget' : null, whatsapp?.is_active ? 'WhatsApp' : null].filter(Boolean) as string[];
  }, [appChat, webWidget, whatsapp]);

  if (!listLoading && conversationList.length === 0) {
    return (
      <div className="page-shell overflow-hidden">
        <div className="page-stack overflow-hidden">
          <PageHeader
            eyebrow="Operacion conversacional"
            title="Inbox"
            description="Tu mesa de operacion comercial para responder, vender y no perder oportunidades."
          />
          <EmptyInboxState />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell overflow-hidden">
      <div className="page-stack overflow-hidden">
        <PageHeader
          eyebrow="Operacion conversacional"
          title="Inbox"
          description="Responde, vende, escala y da seguimiento sin perder contexto operativo ni comercial."
          meta={(
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${connected ? 'bg-brand-100/80 text-brand-700' : 'bg-red-50/80 text-red-600'}`}>
                {connected ? 'Tiempo real conectado' : 'Sin conexion en tiempo real'}
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(17,17,16,0.05)', color: '#4a4840' }}>
                {activeChannels.length > 0 ? activeChannels.join(' · ') : 'Sin canales activos'}
              </span>
            </div>
          )}
          actions={(
            <>
              <Button variant="secondary" size="sm" onClick={() => void refreshInbox()}>
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                Actualizar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void handleExportBatchJson()} disabled={exportingBatchJson || filteredConversations.length === 0}>
                {exportingBatchJson ? 'Exportando...' : 'Exportar lote'}
              </Button>
            </>
          )}
        />

        {error ? (
          <div className="rounded-2xl border border-amber-200/50 bg-amber-50/60 px-4 py-3 text-[12px] text-amber-700">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} />
              {error}
            </div>
          </div>
        ) : null}

        <div className="lg:hidden">
          <div className="flex gap-1.5 rounded-2xl p-1.5" style={{ border: '1px solid rgba(17,17,16,0.08)', background: 'rgba(255,255,255,0.65)' }}>
            {([
              { key: 'listado', label: 'Conversaciones', icon: ListFilter },
              { key: 'chat', label: 'Chat', icon: Columns3 },
              { key: 'contexto', label: 'Contexto', icon: PanelsTopLeft },
            ] as const).map((item) => (
              <button
                key={item.key}
                onClick={() => setMobilePane(item.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                  mobilePane === item.key ? 'bg-brand-500 text-white shadow-card' : 'text-ink-500 hover:bg-[rgba(17,17,16,0.05)]'
                }`}
              >
                <item.icon size={13} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1.35fr)_300px] xl:grid-cols-[300px_minmax(0,1.5fr)_320px]">
          <div className={`${mobilePane === 'listado' ? 'block min-h-0' : 'hidden'} lg:block lg:min-h-0`}>
            <Card className="h-full min-h-0 overflow-hidden">
              <InboxConversationList
                conversations={filteredConversations}
                activeId={selectedId || undefined}
                filter={filter}
                search={search}
                loading={listLoading}
                onFilterChange={setFilter}
                onSearchChange={setSearch}
                onSelectConversation={(id) => {
                  setSelectedId(id);
                  setMobilePane('chat');
                }}
              />
            </Card>
          </div>

          <div className={`${mobilePane === 'chat' ? 'block min-h-0' : 'hidden'} lg:block lg:min-h-0`}>
            <div className="flex h-full min-h-0 flex-col space-y-3">
              {mobilePane !== 'listado' ? (
                <button
                  onClick={() => setMobilePane('listado')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-900 lg:hidden"
                >
                  <ChevronLeft size={16} />
                  Volver a conversaciones
                </button>
              ) : null}
              <div className="min-h-0 flex-1">
                <ConversationView
                conversation={selectedDetail}
                loading={detailLoading}
                draft={draft}
                onDraftChange={setDraft}
                onSend={() => void handleSend()}
                onAddNote={() => void handleAddInternalNote()}
                onResolve={() => void handleResolveCommercially()}
                onReopen={() => void handleReopen()}
                onEscalate={() => void handleEscalate()}
                onTakeOver={() => void handleTakeOver()}
                onReturnToIA={() => void handleReturnToIA()}
                onExportJson={() => void handleExportConversationJson()}
                exportingJson={exportingJson}
                sending={sending}
                />
              </div>
            </div>
          </div>

          <div className={`${mobilePane === 'contexto' ? 'block min-h-0' : 'hidden'} lg:block lg:min-h-0`}>
            <div className="flex h-full min-h-0 flex-col space-y-3 overflow-y-auto pr-1">
              {mobilePane !== 'listado' ? (
                <button
                  onClick={() => setMobilePane('chat')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-900 lg:hidden"
                >
                  <ChevronLeft size={16} />
                  Volver al chat
                </button>
              ) : null}
              <ConversationContextPanel
                conversation={selectedDetail}
                relatedProducts={relatedProducts}
                relatedKnowledge={relatedKnowledge}
                aiSummary={activeAiSummary}
                aiSummaryLoading={aiSummaryLoadingId === selectedId}
                copilotSuggestions={activeCopilotSuggestions}
                copilotLoading={copilotLoadingId === selectedId}
                onStatusChange={(status) => void handleStatusChange(status)}
                onToggleFollowUp={() => void handleToggleFollowUp()}
                onShareProduct={handleShareProduct}
                onCreateOrder={(productId) => void handleCreateOrder(productId)}
                onEditNextStep={() => void handleEditNextStep()}
                onEditSummary={() => void handleEditSummary()}
                onGenerateSummary={() => void handleGenerateAISummary()}
                onUseSummary={() => void handleUseAISummary()}
                onGenerateCopilot={() => void handleGenerateCopilot()}
                onUseCopilotSuggestion={handleUseCopilotSuggestion}
                onSaveContact={(payload) => void handleSaveContact(payload)}
                savingContact={savingContact}
              />
              {selectedDetail && selectedDetail.notes.length > 0 ? (
                <Card className="p-4">
                  <p className="text-sm font-bold text-ink-900">Notas internas</p>
                  <div className="mt-3 space-y-2">
                    {selectedDetail.notes.map((note) => (
                      <div key={note.id} className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-3">
                        <p className="text-sm text-ink-700">{note.content}</p>
                        <p className="mt-1 text-[11px] text-ink-400">
                          {(note.authorName || 'Equipo')} · {new Date(note.createdAt).toLocaleString('es-CO')}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
              {selectedDetail && orders.length > 0 ? (
                <Card className="p-4">
                  <p className="text-sm font-bold text-ink-900">Actividad de pedidos</p>
                  <div className="mt-3 space-y-2">
                    {orders
                      .filter((order) => order.customer_name.toLowerCase().includes(selectedDetail.contactName.toLowerCase().split(' ')[0].toLowerCase()))
                      .slice(0, 3)
                      .map((order) => (
                        <div key={order.id} className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-3">
                          <p className="text-sm font-semibold text-ink-900">{order.id}</p>
                          <p className="mt-1 text-xs text-ink-400">
                            {order.channel} · {order.status} · ${order.total.toLocaleString('es-CO')}
                          </p>
                        </div>
                      ))}
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
