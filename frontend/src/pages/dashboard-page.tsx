import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { api } from '../services/api';
import type {
  AppChatConnectionApiItem,
  ConvListItem,
  KBArticleApiItem,
  KBDocumentApiItem,
  MetricsOverview,
  OnboardingProfileApiItem,
  OrderApiItem,
  ProductApiItem,
  SalesAgentMetricsApiItem,
  WebWidgetConnectionApiItem,
  WhatsAppConnectionApiItem,
} from '../services/api';
import { AgentPerformance } from '../components/dashboard/agent-performance';
import { AttentionRequired } from '../components/dashboard/attention-required';
import { ConversationChart } from '../components/dashboard/conversation-chart';
import { DashboardHeader } from '../components/dashboard/dashboard-header';
import { EmptyDashboardState } from '../components/dashboard/empty-dashboard-state';
import { KpiStrip } from '../components/dashboard/kpi-strip';
import { PendingShipments } from '../components/dashboard/pending-shipments';
import type { AttentionItem } from '../components/dashboard/types';
import { Button, Card, Skeleton } from '../components/ui/primitives';

type DashboardConversation = {
  id: string;
  status: string;
  sentiment: string;
  intent: string;
  channel: string;
  createdAt: string;
  lastMessageAt: string;
  activeAiAgent?: string;
};

interface DashboardDataState {
  onboarding: OnboardingProfileApiItem | null;
  conversations: DashboardConversation[];
  knowledgeArticles: KBArticleApiItem[];
  knowledgeDocuments: KBDocumentApiItem[];
  products: ProductApiItem[];
  orders: OrderApiItem[];
  appChat: AppChatConnectionApiItem | null;
  webWidget: WebWidgetConnectionApiItem | null;
  whatsapp: WhatsAppConnectionApiItem | null;
  overview: (MetricsOverview & Record<string, unknown>) | null;
  salesMetrics: SalesAgentMetricsApiItem | null;
}

const EMPTY_STATE: DashboardDataState = {
  onboarding: null,
  conversations: [],
  knowledgeArticles: [],
  knowledgeDocuments: [],
  products: [],
  orders: [],
  appChat: null,
  webWidget: null,
  whatsapp: null,
  overview: null,
  salesMetrics: null,
};

function formatResponseTime(conversations: DashboardConversation[]) {
  if (conversations.length === 0) return '—';
  const sorted = [...conversations].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  const newest = sorted[0];
  const oldest = sorted[sorted.length - 1];
  const diffMinutes = Math.max(1, Math.round((+new Date(newest.lastMessageAt) - +new Date(oldest.createdAt)) / 60000 / sorted.length));
  return diffMinutes < 60 ? `${diffMinutes} min` : `${Math.round(diffMinutes / 60)} h`;
}

export default function DashboardPage() {
  const { agent } = useAuth();
  const { connected } = useWebSocket('/ws/inbox/', 'subprotocol');
  const [data, setData] = useState<DashboardDataState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [
        onboardingResult,
        conversationsResult,
        kbArticlesResult,
        kbDocumentsResult,
        productsResult,
        ordersResult,
        appChatResult,
        webWidgetResult,
        whatsappResult,
        overviewResult,
        salesMetricsResult,
      ] = await Promise.allSettled([
        api.getOnboardingProfile(),
        api.getConversations(),
        api.getKnowledgeBaseArticles(),
        api.getKnowledgeBaseDocuments(),
        api.getProducts(),
        api.getOrders(),
        api.getAppChatConnection(),
        api.getWebWidgetConnection(),
        api.getWhatsAppConnection(),
        api.getMetricsOverview(),
        api.getSalesAgentMetrics(),
      ]);

      const hadRejected = [
        onboardingResult, conversationsResult, kbArticlesResult, kbDocumentsResult,
        productsResult, ordersResult, appChatResult, webWidgetResult,
        whatsappResult, overviewResult, salesMetricsResult,
      ].some((item) => item.status === 'rejected');

      setData({
        onboarding: onboardingResult.status === 'fulfilled' ? onboardingResult.value : null,
        conversations:
          conversationsResult.status === 'fulfilled'
            ? conversationsResult.value.map((item: ConvListItem) => ({
                id: item.id,
                status: item.estado,
                sentiment: item.sentimiento,
                intent: item.intent || 'Sin clasificar',
                channel: item.canal,
                createdAt: item.created_at,
                lastMessageAt: item.last_message_at,
                activeAiAgent: item.active_ai_agent ?? '',
              }))
            : [],
        knowledgeArticles: kbArticlesResult.status === 'fulfilled' ? kbArticlesResult.value : [],
        knowledgeDocuments: kbDocumentsResult.status === 'fulfilled' ? kbDocumentsResult.value : [],
        products: productsResult.status === 'fulfilled' ? productsResult.value : [],
        orders: ordersResult.status === 'fulfilled' ? ordersResult.value : [],
        appChat: appChatResult.status === 'fulfilled' ? appChatResult.value : null,
        webWidget: webWidgetResult.status === 'fulfilled' ? webWidgetResult.value : null,
        whatsapp: whatsappResult.status === 'fulfilled' ? whatsappResult.value : null,
        overview: overviewResult.status === 'fulfilled' ? overviewResult.value : null,
        salesMetrics: salesMetricsResult.status === 'fulfilled' ? salesMetricsResult.value : null,
      });

      if (hadRejected) {
        setError('Algunos datos no pudieron cargarse y el panel puede verse incompleto.');
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshDashboard() {
    setRefreshing(true);
    await loadDashboard();
  }

  const derived = useMemo(() => {
    const conversations = data.conversations;
    const activeConversations = conversations.filter((c) => c.status !== 'resuelto').length;
    const pendingConversations = conversations.filter((c) => c.status === 'nuevo').length;
    const escalatedConversations = conversations.filter((c) => c.status === 'escalado').length;
    const resolvedConversations = conversations.filter((c) => c.status === 'resuelto').length;
    const opportunities = conversations.filter((c) => c.status !== 'resuelto' && c.sentiment !== 'negativo').length;
    const activeChannels = [data.appChat, data.webWidget, data.whatsapp].filter((c) => c?.is_active).length;
    const outOfStockProducts = data.products.filter(
      (p) => p.variants.length > 0 && p.variants.every((v) => v.stock - v.reserved <= 0),
    ).length;

    const overviewTotal = Number(data.overview?.total_conversaciones ?? conversations.length);
    const salesMetrics = data.salesMetrics;
    const avgResponseTime = data.overview?.tiempo_promedio_seg
      ? `${Math.max(1, Math.round(Number(data.overview.tiempo_promedio_seg) / 60))} min`
      : formatResponseTime(conversations);
    const opportunitiesValue = salesMetrics?.qualified_leads ?? opportunities;

    const attentionItems: AttentionItem[] = [];
    if (pendingConversations > 0) {
      attentionItems.push({
        id: 'pending-conversations',
        title: `${pendingConversations} conversacion${pendingConversations === 1 ? '' : 'es'} sin respuesta`,
        description: 'Empieza por las nuevas para no dejar oportunidades ni soporte esperando.',
        href: '/inbox',
        cta: 'Revisar inbox',
        tone: 'danger',
      });
    }
    if (escalatedConversations > 0) {
      attentionItems.push({
        id: 'escalated',
        title: `${escalatedConversations} conversacion${escalatedConversations === 1 ? '' : 'es'} escalada${escalatedConversations === 1 ? '' : 's'}`,
        description: 'Necesitan seguimiento humano para no perder el hilo de la venta o el caso.',
        href: '/inbox',
        cta: 'Atender',
        tone: 'warning',
      });
    }
    if (activeChannels === 0) {
      attentionItems.push({
        id: 'no-channel',
        title: 'Todavia no tienes un canal activo',
        description: 'Sin un canal publicado no veras conversaciones nuevas dentro de Zelora.',
        href: '/integrations',
        cta: 'Activar canal',
        tone: 'danger',
      });
    }
    if (outOfStockProducts > 0) {
      attentionItems.push({
        id: 'out-of-stock',
        title: `${outOfStockProducts} producto${outOfStockProducts === 1 ? '' : 's'} sin stock`,
        description: 'Eso puede frenar ventas o generar respuestas inconsistentes del agente.',
        href: '/knowledge-base',
        cta: 'Revisar',
        tone: 'warning',
      });
    }
    if (!data.onboarding?.initial_onboarding_completed) {
      attentionItems.push({
        id: 'activation-pending',
        title: 'Tu activacion inicial aun no esta cerrada',
        description: 'Completa los primeros pasos para entrar con el contexto minimo correcto.',
        href: '/onboarding',
        cta: 'Continuar',
        tone: 'neutral',
      });
    }

    return {
      activeConversations,
      pendingConversations,
      resolvedConversations,
      escalatedConversations,
      overviewTotal,
      opportunities: opportunitiesValue,
      avgResponseTime,
      attentionItems,
      hasAnyData:
        conversations.length > 0 ||
        activeChannels > 0 ||
        data.products.filter((p) => p.status === 'active').length > 0 ||
        data.orders.length > 0,
    };
  }, [data]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-stack">
          <Skeleton className="h-[76px] rounded-3xl" />
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Skeleton className="h-72 rounded-3xl" />
            <Skeleton className="h-72 rounded-3xl" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error (full) ───────────────────────────────────────────────────────────
  if (error && !data.onboarding) {
    return (
      <div className="page-shell">
        <div className="page-stack">
          <Card className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-ink-900">No pudimos cargar tu dashboard</h1>
            <p className="mt-2 text-sm text-ink-400">{error}</p>
            <div className="mt-5 flex justify-center">
              <Button onClick={() => void refreshDashboard()}>Intentar de nuevo</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const agentName = agent?.nombre?.split(' ')[0] || 'Equipo';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-shell">
      <div className="page-stack">

        {/* 1 ── Header */}
        <DashboardHeader
          maturity={
            !data.onboarding?.initial_onboarding_completed ? 'nuevo'
            : derived.activeConversations === 0 ? 'activado'
            : 'operativo'
          }
          agentName={agentName}
          activeConversations={derived.activeConversations}
          pendingConversations={derived.pendingConversations}
          connected={connected}
          refreshing={refreshing}
          onRefresh={() => void refreshDashboard()}
        />

        {/* 2 ── KPI strip */}
        <KpiStrip
          activeConversations={derived.activeConversations}
          totalConversations={derived.overviewTotal}
          pendingConversations={derived.pendingConversations}
          opportunities={derived.opportunities}
        />

        {/* 3 ── Chart + Agent performance */}
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <ConversationChart conversations={data.conversations} />
          <AgentPerformance
            conversationsHandled={data.salesMetrics?.conversations ?? derived.activeConversations}
            opportunitiesDetected={data.salesMetrics?.qualified_leads ?? derived.opportunities}
            conversationsResolved={data.salesMetrics?.executions ?? derived.resolvedConversations}
            avgResponseTime={derived.avgResponseTime}
            handoffs={data.salesMetrics?.handoffs ?? derived.escalatedConversations}
            avgConfidencePct={data.salesMetrics?.avg_confidence_pct ?? 0}
            periodDays={data.salesMetrics?.period_days ?? 0}
          />
        </div>

        {/* 4 ── Attention + Pending shipments */}
        <div className="grid gap-4 xl:grid-cols-2">
          <AttentionRequired items={derived.attentionItems} />
          <PendingShipments orders={data.orders} />
        </div>

        {/* Empty state */}
        {!derived.hasAnyData ? <EmptyDashboardState /> : null}

        {/* Partial error */}
        {error && derived.hasAnyData ? (
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-700">
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="shrink-0" />
              Cargamos el dashboard con datos parciales. Algunos modulos no respondieron.
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
