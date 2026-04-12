import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { AIAgentsPanel } from '../components/dashboard/ai-agents-panel';
import { AttentionRequired } from '../components/dashboard/attention-required';
import { BusinessSnapshot } from '../components/dashboard/business-snapshot';
import { DashboardHeader } from '../components/dashboard/dashboard-header';
import { EmptyDashboardState } from '../components/dashboard/empty-dashboard-state';
import { OperationalSummary } from '../components/dashboard/operational-summary';
import { RecommendedNextSteps } from '../components/dashboard/recommended-next-steps';
import type {
  AttentionItem,
  DashboardMaturity,
  RecommendationItem,
  SnapshotItem,
  SummaryItem,
} from '../components/dashboard/types';
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
  if (conversations.length === 0) return 'Sin datos';
  const sorted = [...conversations].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  const newest = sorted[0];
  const oldest = sorted[sorted.length - 1];
  const diffMinutes = Math.max(1, Math.round((+new Date(newest.lastMessageAt) - +new Date(oldest.createdAt)) / 60000 / sorted.length));
  return diffMinutes < 60 ? `${diffMinutes} min` : `${Math.round(diffMinutes / 60)} h`;
}

function countTodayConversations(conversations: DashboardConversation[]) {
  if (conversations.length === 0) return 0;
  const referenceDate = new Date(
    conversations.reduce((latest, item) => (+new Date(item.createdAt) > +new Date(latest) ? item.createdAt : latest), conversations[0].createdAt),
  );
  return conversations.filter((item) => {
    const createdAt = new Date(item.createdAt);
    return createdAt.toDateString() === referenceDate.toDateString();
  }).length;
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
    const onboarding = data.onboarding;
    const conversations = data.conversations;
    const activeConversations = conversations.filter((item) => item.status !== 'resuelto').length;
    const pendingConversations = conversations.filter((item) => item.status === 'nuevo').length;
    const escalatedConversations = conversations.filter((item) => item.status === 'escalado').length;
    const resolvedConversations = conversations.filter((item) => item.status === 'resuelto').length;
    const opportunities = conversations.filter((item) => item.status !== 'resuelto' && item.sentiment !== 'negativo').length;
    const todayConversations = countTodayConversations(conversations);
    const activeChannels = [data.appChat, data.webWidget, data.whatsapp].filter((item) => item?.is_active).length;
    const productsLoaded = data.products.filter((item) => item.status === 'active').length;
    const outOfStockProducts = data.products.filter((item) =>
      item.variants.length > 0 && item.variants.every((variant) => variant.stock - variant.reserved <= 0),
    ).length;
    const knowledgeCount = data.knowledgeArticles.length + data.knowledgeDocuments.length;
    const completedCoreTasks = [
      onboarding?.activation_tasks?.knowledge_status === 'completed',
      onboarding?.activation_tasks?.channels_status === 'completed',
      onboarding?.activation_tasks?.agent_test_status === 'completed',
    ].filter(Boolean).length;
    const overviewTotal = Number(data.overview?.total_conversaciones ?? conversations.length);
    const overviewEscalated = Number(data.overview?.escalamiento_pct ?? 0);
    const salesMetrics = data.salesMetrics;
    const avgResponseTime = data.overview?.tiempo_promedio_seg
      ? `${Math.max(1, Math.round(Number(data.overview.tiempo_promedio_seg) / 60))} min`
      : formatResponseTime(conversations);
    const opportunitiesValue = salesMetrics?.qualified_leads ?? opportunities;
    const generalConversations = conversations.filter((item) => item.activeAiAgent === 'general').length;
    const generalEscalated = conversations.filter((item) => item.activeAiAgent === 'general' && item.status === 'escalado').length;

    const maturity: DashboardMaturity =
      !onboarding?.initial_onboarding_completed || completedCoreTasks <= 1
        ? 'nuevo'
        : completedCoreTasks < 3 || activeConversations === 0
          ? 'activado'
          : 'operativo';

    const snapshotItems: SnapshotItem[] = [
      {
        label: 'Conversaciones activas',
        value: String(activeConversations),
        hint: activeConversations > 0 ? 'Casos abiertos ahora mismo' : 'Aun no llegan conversaciones',
        tone: activeConversations > 0 ? 'brand' : 'default',
      },
      {
        label: 'Conversaciones totales',
        value: String(overviewTotal),
        hint: overviewTotal > 0 ? 'Volumen acumulado del periodo actual' : 'Sin volumen todavia',
        tone: overviewTotal > 0 ? 'brand' : 'default',
      },
      {
        label: 'Pendientes por responder',
        value: String(pendingConversations),
        hint: pendingConversations > 0 ? 'Conviene revisarlas primero' : 'Todo al dia por ahora',
        tone: pendingConversations > 0 ? 'warning' : 'success',
      },
      {
        label: 'Canales activos',
        value: String(activeChannels),
        hint: activeChannels > 0 ? 'App Chat, web o WhatsApp listos' : 'Todavia no hay canales activos',
        tone: activeChannels > 0 ? 'success' : 'warning',
      },
      {
        label: 'Knowledge Base',
        value: String(knowledgeCount),
        hint: knowledgeCount > 0 ? 'Fuentes cargadas para responder mejor' : 'Sin fuentes de conocimiento aun',
        tone: knowledgeCount > 0 ? 'success' : 'warning',
      },
      {
        label: 'Productos cargados',
        value: String(productsLoaded),
        hint: productsLoaded > 0 ? 'Tu catalogo ya ayuda a vender mejor' : 'Tu catalogo aun no esta cargado',
        tone: productsLoaded > 0 ? 'brand' : 'default',
      },
    ];

    const attentionItems: AttentionItem[] = [];
    if (pendingConversations > 0) {
      attentionItems.push({
        id: 'pending-conversations',
        title: `${pendingConversations} conversaciones siguen sin respuesta`,
        description: 'Empieza por las nuevas para no dejar oportunidades ni soporte esperando.',
        href: '/inbox',
        cta: 'Revisar inbox',
        tone: 'danger',
      });
    }
    if (escalatedConversations > 0) {
      attentionItems.push({
        id: 'escalated',
        title: `${escalatedConversations} conversaciones estan escaladas`,
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
        title: `${outOfStockProducts} productos estan sin stock`,
        description: 'Eso puede frenar ventas o generar respuestas inconsistentes.',
        href: '/knowledge-base',
        cta: 'Revisar',
        tone: 'warning',
      });
    }
    if (!onboarding?.initial_onboarding_completed) {
      attentionItems.push({
        id: 'activation-pending',
        title: 'Tu activacion inicial aun no esta cerrada',
        description: 'Completa los primeros pasos para entrar con el contexto minimo correcto.',
        href: '/onboarding',
        cta: 'Continuar',
        tone: 'neutral',
      });
    }

    const summaryItems: SummaryItem[] = [
      {
        label: 'Conversaciones de hoy',
        value: String(todayConversations),
        hint: 'Actividad reciente en tu operacion',
      },
      {
        label: 'Tiempo promedio de respuesta',
        value: avgResponseTime,
        hint: data.overview?.tiempo_promedio_seg ? 'Medido desde analytics' : 'Estimado segun actividad reciente',
      },
      {
        label: 'Conversaciones resueltas',
        value: String(resolvedConversations),
        hint: 'Casos cerrados en el periodo visible',
      },
      {
        label: 'Oportunidades detectadas',
        value: String(opportunitiesValue),
        hint: salesMetrics?.qualified_leads ? 'Lead scoring del Sales Agent' : 'Conversaciones con potencial de venta o avance',
      },
      {
        label: 'Pedidos por conversacion',
        value: String(data.orders.filter((item) => ['whatsapp', 'instagram', 'web'].includes(item.channel)).length),
        hint: 'Pedidos creados desde canales conversacionales',
      },
    ];

    const recommendations: RecommendationItem[] = [];
    if (activeChannels === 0) {
      recommendations.push({
        id: 'activate-widget',
        title: 'Activa tu canal principal',
        description: 'Empieza por App Chat o Web Widget para abrir tu primera puerta de entrada.',
        href: '/integrations',
        cta: 'Ver canales',
      });
    }
    if (productsLoaded === 0) {
      recommendations.push({
        id: 'catalog',
        title: 'Carga tu catalogo',
        description: 'El asistente vende mejor cuando entiende tus productos y tu oferta.',
        href: '/knowledge-base',
        cta: 'Agregar contenido',
      });
    }
    if ((onboarding?.optimization_profile?.status || 'not_started') === 'not_started') {
      recommendations.push({
        id: 'optimize-agent',
        title: 'Mejora como responde tu agente',
        description: 'Ajusta tono, cierre y limites para que suene mas a tu marca.',
        href: '/admin/organizations',
        cta: 'Ajustar',
      });
    }
    if (!data.whatsapp?.is_active) {
      recommendations.push({
        id: 'connect-whatsapp',
        title: 'Conecta WhatsApp',
        description: 'Cuando quieras crecer el volumen, este sera tu siguiente canal natural.',
        href: '/integrations',
        cta: 'Preparar',
      });
    }
    if (pendingConversations > 0) {
      recommendations.push({
        id: 'review-pending',
        title: 'Revisa conversaciones pendientes',
        description: 'Hay actividad esperando respuesta. Conviene atacarla antes que cualquier ajuste.',
        href: '/inbox',
        cta: 'Revisar',
      });
    }

    return {
      maturity,
      snapshotItems,
      attentionItems,
      summaryItems,
      recommendations: recommendations.slice(0, 4),
      activeConversations,
      pendingConversations,
      activeChannels,
      productsLoaded,
      knowledgeCount,
      opportunities: opportunitiesValue,
      resolvedConversations,
      avgResponseTime,
      escalatedPct: overviewEscalated,
      generalConversations,
      generalEscalated,
      hasAnyData:
        conversations.length > 0 ||
        activeChannels > 0 ||
        productsLoaded > 0 ||
        data.orders.length > 0 ||
        knowledgeCount > 0,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-stack">
          <Skeleton className="h-40 rounded-[28px]" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

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

  return (
    <div className="page-shell">
      <div className="page-stack">
        <DashboardHeader
          maturity={derived.maturity}
          agentName={agentName}
          activeConversations={derived.activeConversations}
          pendingConversations={derived.pendingConversations}
          connected={connected}
          refreshing={refreshing}
          onRefresh={() => void refreshDashboard()}
        />

        <BusinessSnapshot items={derived.snapshotItems} />

        <AIAgentsPanel
          conversationsHandled={data.salesMetrics?.conversations ?? derived.activeConversations}
          opportunitiesDetected={derived.opportunities}
          avgResponseTime={derived.avgResponseTime}
          conversationsResolved={data.salesMetrics?.executions ?? derived.resolvedConversations}
          generalConversations={derived.generalConversations}
          generalEscalated={derived.generalEscalated}
        />

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <AttentionRequired items={derived.attentionItems} />
          <RecommendedNextSteps items={derived.recommendations} />
        </div>

        <OperationalSummary items={derived.summaryItems} />

        {!derived.hasAnyData ? <EmptyDashboardState /> : null}

        {error ? (
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-700">
            Cargamos el dashboard con datos parciales. Algunos modulos no respondieron y pueden verse incompletos.
          </div>
        ) : null}

        <div
          className="rounded-2xl p-4 text-[12px] text-ink-400"
          style={{ border: '1px solid rgba(17,17,16,0.07)', background: 'rgba(255,255,255,0.45)' }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Si quieres afinar el comportamiento del asistente sin frenar la operacion, hazlo desde{' '}
              <Link to="/admin/organizations" className="font-semibold text-brand-600 hover:text-brand-500">
                Organizacion
              </Link>
              .
            </p>
            {refreshing ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-400">
                <Loader2 size={12} className="animate-spin" />
                Actualizando...
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
