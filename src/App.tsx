import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/main-layout';

const DashboardPage = lazy(() => import('./pages/dashboard-page'));
const InboxPage = lazy(() => import('./pages/inbox-page').then(m => ({ default: m.InboxPage })));
const AnalyticsPage = lazy(() => import('./pages/analytics-page').then(m => ({ default: m.AnalyticsPage })));
const CostosPage = lazy(() => import('./pages/costos-page').then(m => ({ default: m.CostosPage })));
const KnowledgeBasePage = lazy(() => import('./pages/knowledge-base-page').then(m => ({ default: m.KnowledgeBasePage })));
const CampaignsPage = lazy(() => import('./pages/campaigns-page').then(m => ({ default: m.CampaignsPage })));
const FlowBuilderPage = lazy(() => import('./pages/flow-builder-page').then(m => ({ default: m.FlowBuilderPage })));
const IntegrationsPage = lazy(() => import('./pages/integrations-page').then(m => ({ default: m.IntegrationsPage })));
const SettingsPage = lazy(() => import('./pages/settings-page').then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import('./pages/profile-page').then(m => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('./pages/login-page').then(m => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('./pages/onboarding-page'));

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
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/flows" element={<FlowBuilderPage />} />
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
