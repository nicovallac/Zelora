import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/main-layout';

const DashboardPage = lazy(() => import('./pages/dashboard-page'));
const HomePage = lazy(() => import('./pages/home-page').then(m => ({ default: m.HomePage })));
const DemoWebPage = lazy(() => import('./pages/demo-web-page').then(m => ({ default: m.DemoWebPage })));
const WhatsAppPage = lazy(() => import('./pages/whatsapp-page').then(m => ({ default: m.WhatsAppPage })));
const InstagramPage = lazy(() => import('./pages/instagram-page').then(m => ({ default: m.InstagramPage })));
const TikTokPage = lazy(() => import('./pages/tiktok-page').then(m => ({ default: m.TikTokPage })));
const AppChatPage = lazy(() => import('./pages/app-chat-page').then(m => ({ default: m.AppChatPage })));
const InboxPage = lazy(() => import('./pages/inbox-page').then(m => ({ default: m.InboxPage })));
const AnalyticsPage = lazy(() => import('./pages/analytics-page').then(m => ({ default: m.AnalyticsPage })));
const CostosPage = lazy(() => import('./pages/costos-page').then(m => ({ default: m.CostosPage })));
const KnowledgeBasePage = lazy(() => import('./pages/knowledge-base-page').then(m => ({ default: m.KnowledgeBasePage })));
const CampaignsPage = lazy(() => import('./pages/campaigns-page').then(m => ({ default: m.CampaignsPage })));
const FlowBuilderPage = lazy(() => import('./pages/flow-builder-page').then(m => ({ default: m.FlowBuilderPage })));
const IntegrationsPage = lazy(() => import('./pages/integrations-page').then(m => ({ default: m.IntegrationsPage })));
const SettingsPage = lazy(() => import('./pages/settings-page').then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import('./pages/profile-page').then(m => ({ default: m.ProfilePage })));
const ProductsPage = lazy(() => import('./pages/products-page').then(m => ({ default: m.ProductsPage })));
const InventoryPage = lazy(() => import('./pages/inventory-page').then(m => ({ default: m.InventoryPage })));
const OrdersPage = lazy(() => import('./pages/orders-page').then(m => ({ default: m.OrdersPage })));
const WorkspaceDashboardPage = lazy(() => import('./pages/workspace-dashboard-page').then(m => ({ default: m.WorkspaceDashboardPage })));
const WorkspaceMemoryPage = lazy(() => import('./pages/workspace-memory-page').then(m => ({ default: m.WorkspaceMemoryPage })));
const WorkspaceTasksPage = lazy(() => import('./pages/workspace-tasks-page').then(m => ({ default: m.WorkspaceTasksPage })));
const WorkspaceInsightsPage = lazy(() => import('./pages/workspace-insights-page').then(m => ({ default: m.WorkspaceInsightsPage })));
const WorkspaceCollabPage = lazy(() => import('./pages/workspace-collab-page').then(m => ({ default: m.WorkspaceCollabPage })));
const WorkspacePerformancePage = lazy(() => import('./pages/workspace-performance-page').then(m => ({ default: m.WorkspacePerformancePage })));
const WorkspaceActionsPage = lazy(() => import('./pages/workspace-actions-page').then(m => ({ default: m.WorkspaceActionsPage })));
const LoginPage = lazy(() => import('./pages/login-page').then(m => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('./pages/onboarding-page'));
const SignupPage = lazy(() => import('./pages/signup-page'));

// Admin
const AgentsPage = lazy(() => import('./pages/admin/agents-page').then(m => ({ default: m.AgentsPage })));
const AfiliadosPage = lazy(() => import('./pages/admin/afiliados-page').then(m => ({ default: m.AfiliadosPage })));
const OrganizationsPage = lazy(() => import('./pages/admin/organizations-page').then(m => ({ default: m.OrganizationsPage })));
const TrainingPage = lazy(() => import('./pages/admin/training-page').then(m => ({ default: m.TrainingPage })));
const RoutingPage = lazy(() => import('./pages/admin/routing-page').then(m => ({ default: m.RoutingPage })));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/omnichannel" element={<HomePage />} />
          <Route path="/demo-web" element={<DemoWebPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/instagram" element={<InstagramPage />} />
          <Route path="/tiktok" element={<TikTokPage />} />
          <Route path="/app-chat" element={<AppChatPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/flows" element={<FlowBuilderPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/workspace" element={<WorkspaceDashboardPage />} />
          <Route path="/workspace/overview" element={<WorkspaceDashboardPage />} />
          <Route path="/workspace/memory" element={<WorkspaceMemoryPage />} />
          <Route path="/workspace/tasks" element={<WorkspaceTasksPage />} />
          <Route path="/workspace/insights" element={<WorkspaceInsightsPage />} />
          <Route path="/workspace/activity" element={<WorkspaceCollabPage />} />
          <Route path="/workspace/decisions" element={<WorkspaceActionsPage />} />
          <Route path="/workspace/collab" element={<WorkspaceCollabPage />} />
          <Route path="/workspace/performance" element={<WorkspacePerformancePage />} />
          <Route path="/workspace/actions" element={<WorkspaceActionsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/billing" element={<CostosPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin/agents"
            element={
              <ProtectedRoute adminOnly>
                <AgentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contacts"
            element={
              <ProtectedRoute adminOnly>
                <AfiliadosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/organizations"
            element={
              <ProtectedRoute adminOnly>
                <OrganizationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/training"
            element={
              <ProtectedRoute adminOnly>
                <TrainingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/routing"
            element={
              <ProtectedRoute adminOnly>
                <RoutingPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
