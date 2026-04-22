import { useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Plug,
  GitBranch,
  Package,
  TrendingUp,
  Users,
  UserCheck,
  Building2,
  LogOut,
  Wifi,
  WifiOff,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { NotificationBell } from '../ui/NotificationBell';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, MessageSquare, BookOpen, Plug, GitBranch, Package,
  TrendingUp, Users, UserCheck, Building2,
};

const NAV_SECTIONS = [
  { label: 'Principal', paths: ['/', '/inbox'] },
  { label: 'Ventas',    paths: ['/products', '/knowledge-base', '/flows', '/integrations', '/analytics'] },
];

const ALL_NAV = [
  { label: 'Dashboard',           path: '/',              icon: 'LayoutDashboard', audience: 'all' },
  { label: 'Inbox',               path: '/inbox',         icon: 'MessageSquare',   audience: 'all' },
  { label: 'Catalogo',            path: '/products',      icon: 'Package',         audience: 'all' },
  { label: 'Base de conocimiento',path: '/knowledge-base',icon: 'BookOpen',        audience: 'all' },
  { label: 'Flujos',              path: '/flows',         icon: 'GitBranch',       audience: 'all' },
  { label: 'Canales',             path: '/integrations',  icon: 'Plug',            audience: 'all' },
  { label: 'Analytics',           path: '/analytics',     icon: 'TrendingUp',      audience: 'all' },
  { label: 'Agentes',             path: '/admin/agents',  icon: 'Users',           audience: 'admin' },
  { label: 'Contactos',           path: '/admin/contacts',icon: 'UserCheck',       audience: 'admin' },
  { label: 'Organizacion',        path: '/admin/organizations', icon: 'Building2', audience: 'admin' },
];

const MOBILE_PRIMARY_NAV = [
  { label: 'Inicio',   path: '/',              icon: 'LayoutDashboard' },
  { label: 'Inbox',    path: '/inbox',         icon: 'MessageSquare' },
  { label: 'Base',     path: '/knowledge-base',icon: 'BookOpen' },
  { label: 'Canales',  path: '/integrations',  icon: 'Plug' },
];

type NavEntry = (typeof ALL_NAV)[0];

function NavItem({ item, onClose }: { item: NavEntry; onClose?: () => void }) {
  const Icon = ICON_MAP[item.icon];
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-brand-600/80 text-white font-semibold shadow-card'
            : 'text-white/55 hover:bg-[rgba(255,255,255,0.07)] hover:text-white/85'
        }`
      }
      onClick={onClose}
    >
      {({ isActive }) => (
        <>
          {Icon && (
            <Icon
              size={14}
              className={isActive ? 'text-white/90' : 'text-white/40 group-hover:text-white/65'}
            />
          )}
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function MainLayout() {
  const { agent, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { connected } = useWebSocket('/ws/inbox/', 'subprotocol');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const organizationName = agent?.organizationName ?? 'organizacion';
  const currentPath = location.pathname;

  const sectionItems = NAV_SECTIONS.map((section) => ({
    ...section,
    items: ALL_NAV.filter(
      (n) => section.paths.includes(n.path) && n.audience !== 'admin',
    ),
  }));
  const adminItems = ALL_NAV.filter((n) => n.audience === 'admin');
  const mobilePrimaryItems = useMemo(
    () => MOBILE_PRIMARY_NAV.map((item) => ({ ...item, icon: ICON_MAP[item.icon] })),
    [],
  );

  /* ── Sidebar ─────────────────────────────────────────────── */
  const sidebar = (
    <div
      className="flex h-full flex-col"
      style={{
        background: 'rgba(12,11,17,0.92)',
        borderRight: '1px solid rgba(139,92,246,0.18)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-4 pb-4 pt-5"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.15)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-card"
            style={{ background: '#a78bfa' }}
          >
            <MessageSquare size={14} className="text-white" />
          </div>
          <span
            className="text-[15px] font-bold text-white/90"
            style={{ letterSpacing: '-0.01em' }}
          >
            Zelora
          </span>
        </div>
        <button
          className="rounded-xl p-1.5 text-white/50 transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-white/85 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sectionItems.map((section) => (
          <div key={section.label}>
            <p
              className="px-3 pb-1.5 text-[9px] font-semibold uppercase"
              style={{ letterSpacing: '0.18em', color: 'rgba(255,255,255,0.32)' }}
            >
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.path} item={item} onClose={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div>
            <p
              className="px-3 pb-1.5 text-[9px] font-semibold uppercase"
              style={{ letterSpacing: '0.18em', color: 'rgba(255,255,255,0.32)' }}
            >
              Admin
            </p>
            <div className="space-y-0.5">
              {adminItems.map((item) => (
                <NavItem key={item.path} item={item} onClose={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Profile footer */}
      <div style={{ borderTop: '1px solid rgba(139,92,246,0.15)' }} className="p-3">
        <button
          onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
          className="group flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-brand-300"
            style={{ background: 'rgba(139,92,246,0.20)' }}
          >
            {agent?.nombre?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'AG'}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[12px] font-semibold text-white/85">
              {agent?.nombre || 'Agente'}
            </p>
            <p className="truncate text-[11px] capitalize text-white/45">
              {agent?.rol || 'asesor'}
            </p>
          </div>
          <ChevronRight size={12} className="text-white/28 group-hover:text-white/55" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-transparent">
      {/* Desktop sidebar */}
      <div className="hidden w-52 shrink-0 flex-col lg:flex">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-[84vw] max-w-[300px] shadow-float">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2.5 px-3 sm:px-4"
          style={{
            background: 'rgba(236,234,228,0.85)',
            borderBottom: '1px solid rgba(17,17,16,0.07)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
          }}
        >
          <button
            className="rounded-xl p-1.5 text-ink-500 transition-colors hover:bg-[rgba(17,17,16,0.07)] hover:text-ink-800 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Org pill */}
          <div
            className="flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]"
            style={{
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(17,17,16,0.09)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
              style={{ background: '#a78bfa' }}
            >
              <Building2 size={8} className="text-white" />
            </div>
            <span className="max-w-[110px] truncate font-semibold capitalize text-ink-700 sm:max-w-none">
              {organizationName}
            </span>
          </div>

          <div className="flex-1" />

          {/* Status + actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                connected
                  ? 'bg-brand-100/80 text-brand-700'
                  : 'bg-red-50/80 text-red-500'
              }`}
            >
              {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
              <span className="hidden md:block">
                {connected ? 'En vivo' : 'Offline'}
              </span>
            </div>

            <NotificationBell />

            <button
              onClick={logout}
              className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-[rgba(17,17,16,0.06)] hover:text-red-500"
              title="Cerrar sesion"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] pt-2 lg:hidden"
          style={{
            background: 'rgba(12,11,17,0.92)',
            borderTop: '1px solid rgba(139,92,246,0.15)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div className="grid grid-cols-5 gap-1">
            {mobilePrimaryItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? currentPath === '/'
                  : currentPath === item.path ||
                    currentPath.startsWith(`${item.path}/`);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex min-h-[54px] flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-500/80 text-white'
                      : 'text-white/50 hover:text-white/75'
                  }`}
                  style={{ letterSpacing: '0.04em' }}
                >
                  <Icon size={16} className={isActive ? 'text-white/90' : 'text-white/45'} />
                  <span className="mt-1">{item.label}</span>
                </NavLink>
              );
            })}

            <button
              onClick={() => setSidebarOpen(true)}
              className="flex min-h-[54px] flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-semibold text-white/50 transition-colors"
            >
              <Menu size={16} className="text-white/45" />
              <span className="mt-1">Mas</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
