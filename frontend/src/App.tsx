import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/main-layout';

const DashboardPage = lazy(() => import('./pages/dashboard-page'));
const AnalyticsPage = lazy(() => import('./pages/analytics-page').then(m => ({ default: m.AnalyticsPage })));
const WebAppPage = lazy(() => import('./pages/webapp-page').then(m => ({ default: m.WebAppPage })));
const WebWidgetDemoPage = lazy(() => import('./pages/web-widget-demo-page').then(m => ({ default: m.WebWidgetDemoPage })));
const AppChatPage = lazy(() => import('./pages/app-chat-page').then(m => ({ default: m.AppChatPage })));
const AppChatPublicPage = lazy(() => import('./pages/app-chat-public-page').then(m => ({ default: m.AppChatPublicPage })));
const ProductPublicPage = lazy(() => import('./pages/product-public-page').then(m => ({ default: m.ProductPublicPage })));
const ProductBuySoonPage = lazy(() => import('./pages/product-buy-soon-page').then(m => ({ default: m.ProductBuySoonPage })));
const InboxPage = lazy(() => import('./pages/inbox-page').then(m => ({ default: m.InboxPage })));
const KnowledgeBasePage = lazy(() => import('./pages/knowledge-base-page').then(m => ({ default: m.KnowledgeBasePage })));
const FlowBuilderPage = lazy(() => import('./pages/flow-builder-page').then(m => ({ default: m.FlowBuilderPage })));
const IntegrationsPage = lazy(() => import('./pages/integrations-page').then(m => ({ default: m.IntegrationsPage })));
const ProductsPage = lazy(() => import('./pages/products-page').then(m => ({ default: m.ProductsPage })));
const WorkspacePerformancePage = lazy(() => import('./pages/workspace-performance-page').then(m => ({ default: m.WorkspacePerformancePage })));
const NotFoundPage = lazy(() => import('./pages/not-found-page').then(m => ({ default: m.NotFoundPage })));
const ProfilePage = lazy(() => import('./pages/profile-page').then(m => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('./pages/login-page').then(m => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('./pages/onboarding-page'));
const SignupPage = lazy(() => import('./pages/signup-page'));
const EmailVerificationPendingPage = lazy(() => import('./pages/email-verification-pending-page'));
const VerifyEmailPage = lazy(() => import('./pages/verify-email-page'));

// Admin
const AgentsPage = lazy(() => import('./pages/admin/agents-page').then(m => ({ default: m.AgentsPage })));
const AfiliadosPage = lazy(() => import('./pages/admin/afiliados-page').then(m => ({ default: m.AfiliadosPage })));
const OrganizationsPage = lazy(() => import('./pages/admin/organizations-page').then(m => ({ default: m.OrganizationsPage })));

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
        <Route path="/email-verification-pending" element={<EmailVerificationPendingPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/web-widget/demo" element={<WebWidgetDemoPage />} />
        <Route path="/:orgSlug" element={<AppChatPublicPage />} />
        <Route path="/app-chat/open/:orgSlug" element={<AppChatPublicPage />} />
        <Route path="/shop/:orgSlug/:productId" element={<ProductPublicPage />} />
        <Route path="/shop/:orgSlug/:productId/comprar" element={<ProductBuySoonPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/whatsapp" element={<Navigate to="/not-found" replace />} />
          <Route path="/web-widget" element={<WebAppPage />} />
          <Route path="/webapp" element={<Navigate to="/web-widget" replace />} />
          <Route path="/app-chat" element={<AppChatPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/knowledge-base/historical" element={<Navigate to="/knowledge-base" replace />} />
          <Route path="/knowledge-base/learning" element={<Navigate to="/knowledge-base" replace />} />
          <Route path="/knowledge-base/extraction" element={<Navigate to="/knowledge-base" replace />} />
          <Route
            path="/campaigns"
            element={<Navigate to="/knowledge-base" replace />}
          />
          <Route path="/flows" element={<FlowBuilderPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/inventory" element={<Navigate to="/inbox" replace />} />
          <Route path="/orders" element={<Navigate to="/inbox" replace />} />
          <Route path="/workspace" element={<Navigate to="/" replace />} />
          <Route path="/workspace/overview" element={<Navigate to="/" replace />} />
          <Route path="/workspace/memory" element={<Navigate to="/knowledge-base" replace />} />
          <Route path="/workspace/tasks" element={<Navigate to="/inbox" replace />} />
          <Route path="/workspace/insights" element={<Navigate to="/" replace />} />
          <Route path="/workspace/activity" element={<Navigate to="/inbox" replace />} />
          <Route path="/workspace/decisions" element={<Navigate to="/" replace />} />
          <Route path="/workspace/collab" element={<Navigate to="/inbox" replace />} />
          <Route path="/workspace/performance" element={<WorkspacePerformancePage />} />
          <Route path="/workspace/actions" element={<Navigate to="/inbox" replace />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="/billing" element={<Navigate to="/admin/organizations" replace />} />
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
                <Navigate to="/knowledge-base/historical" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/routing"
            element={
              <ProtectedRoute adminOnly>
                <Navigate to="/integrations" replace />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
