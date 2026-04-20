import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronRight,
  Menu,
  X,
  Zap,
  Keyboard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { NotificationBell } from '../ui/NotificationBell';
import { KeyboardShortcutsModal } from '../ui/keyboard-shortcuts-modal';
import { ScrollToTop } from '../ui/scroll-to-top';
import { subscribeUnread } from '../../lib/unread-store';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, MessageSquare, BookOpen, Plug, GitBranch, Package,
  TrendingUp, Users, UserCheck, Building2,
};

const PAGE_LABELS: Record<string, string> = {
  '/':                    'Dashboard',
  '/inbox':               'Inbox',
  '/products':            'Catálogo',
  '/knowledge-base':      'Conocimiento',
  '/flows':               'Flujos',
  '/integrations':        'Canales',
  '/analytics':           'Analytics',
  '/profile':             'Perfil',
  '/admin/agents':        'Agentes',
  '/admin/contacts':      'Contactos',
  '/admin/organizations': 'Organización',
};

const GO_MAP: Record<string, string> = {
  d: '/',
  i: '/inbox',
  p: '/products',
  k: '/knowledge-base',
  f: '/flows',
  c: '/integrations',
  a: '/analytics',
};

const NAV_SECTIONS = [
  { label: 'Principal',    paths: ['/', '/inbox'] },
  { label: 'Herramientas', paths: ['/products', '/knowledge-base', '/flows', '/integrations', '/analytics'] },
];

const ALL_NAV = [
  { label: 'Dashboard',    path: '/',               icon: 'LayoutDashboard', audience: 'all' },
  { label: 'Inbox',        path: '/inbox',          icon: 'MessageSquare',   audience: 'all' },
  { label: 'Catálogo',     path: '/products',       icon: 'Package',         audience: 'all' },
  { label: 'Conocimiento', path: '/knowledge-base', icon: 'BookOpen',        audience: 'all' },
  { label: 'Flujos',       path: '/flows',          icon: 'GitBranch',       audience: 'all' },
  { label: 'Canales',      path: '/integrations',   icon: 'Plug',            audience: 'all' },
  { label: 'Analytics',    path: '/analytics',      icon: 'TrendingUp',      audience: 'all' },
  { label: 'Agentes',      path: '/admin/agents',   icon: 'Users',           audience: 'admin' },
  { label: 'Contactos',    path: '/admin/contacts', icon: 'UserCheck',       audience: 'admin' },
  { label: 'Organización', path: '/admin/organizations', icon: 'Building2',  audience: 'admin' },
];

const MOBILE_PRIMARY_NAV = [
  { label: 'Inicio',  path: '/',               icon: 'LayoutDashboard' },
  { label: 'Inbox',   path: '/inbox',          icon: 'MessageSquare' },
  { label: 'Base',    path: '/knowledge-base', icon: 'BookOpen' },
  { label: 'Canales', path: '/integrations',   icon: 'Plug' },
];

type NavEntry = (typeof ALL_NAV)[0];

function NavItem({
  item,
  unreadCount,
  onClose,
}: {
  item: NavEntry;
  unreadCount?: number;
  onClose?: () => void;
}) {
  const Icon = ICON_MAP[item.icon];
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-brand-500/[0.15] text-brand-300 font-semibold'
            : 'text-[rgba(255,255,255,0.52)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.85)]'
        }`
      }
      onClick={onClose}
    >
      {({ isActive }) => (
        <>
          {Icon && (
            <Icon
              size={14}
              className={
                isActive
                  ? 'text-brand-400'
                  : 'text-[rgba(255,255,255,0.35)] group-hover:text-[rgba(255,255,255,0.60)] transition-colors'
              }
            />
          )}
          <span className="truncate flex-1">{item.label}</span>
          {/* Unread badge */}
          {unreadCount != null && unreadCount > 0 && (
            <span
              className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
              style={{ background: '#ef4444', fontSize: '9px' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {isActive && !unreadCount && (
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          )}
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
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const organizationName =
    agent?.organization_name ||
    agent?.email?.split('@')[1]?.split('.')[0] ||
    'Organización';

  const currentPath = location.pathname;
  const pageLabel = PAGE_LABELS[currentPath] ?? '';

  // Subscribe to inbox unread count
  useEffect(() => subscribeUnread(setUnreadCount), []);

  // Keyboard navigation: G+key to navigate, ? for shortcuts
  const goMode = useRef(false);
  const goTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShortcuts = useCallback(() => setShortcutsOpen(true), []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if ((e.target as HTMLElement).isContentEditable) return;

      const key = e.key.toLowerCase();

      if (goMode.current) {
        goMode.current = false;
        if (goTimer.current) clearTimeout(goTimer.current);
        if (GO_MAP[key]) navigate(GO_MAP[key]);
        return;
      }

      if (key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        goMode.current = true;
        goTimer.current = setTimeout(() => { goMode.current = false; }, 800);
        return;
      }

      if (e.shiftKey && e.key === '?') {
        setShortcutsOpen((v) => !v);
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

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

  const initials =
    agent?.nombre
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ZL';

  /* ── Sidebar ─────────────────────────────────────────────── */
  const sidebar = (
    <div
      className="sidebar-scroll relative flex h-full flex-col"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.04,
          zIndex: 0,
        }}
      />

      {/* Logo */}
      <div
        className="relative z-10 flex items-center justify-between px-4 pb-4 pt-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
          >
            <Zap size={13} className="text-white" />
          </div>
          <span
            className="text-[15px] font-bold text-white"
            style={{ letterSpacing: '-0.01em' }}
          >
            Zelora
          </span>
        </div>
        <button
          aria-label="Cerrar menú"
          className="rounded-lg p-1.5 text-[rgba(255,255,255,0.35)] transition-colors hover:bg-[rgba(255,255,255,0.07)] hover:text-white lg:hidden cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {sectionItems.map((section) => (
          <div key={section.label}>
            <p
              className="px-3 pb-2 text-[9px] font-bold uppercase"
              style={{ letterSpacing: '0.16em', color: 'rgba(255,255,255,0.22)' }}
            >
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  unreadCount={item.path === '/inbox' ? unreadCount : undefined}
                  onClose={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div>
            <p
              className="px-3 pb-2 text-[9px] font-bold uppercase"
              style={{ letterSpacing: '0.16em', color: 'rgba(255,255,255,0.22)' }}
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

        {/* Keyboard shortcuts hint */}
        <div className="pt-2">
          <button
            onClick={handleShortcuts}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-[rgba(255,255,255,0.05)] cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            <Keyboard size={11} />
            <span>Atajos de teclado</span>
            <kbd
              className="ml-auto rounded px-1 py-0.5 text-[9px]"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.35)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              ?
            </kbd>
          </button>
        </div>
      </nav>

      {/* Profile footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="relative z-10 p-3">
        <button
          onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
          className="group flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[rgba(255,255,255,0.06)] cursor-pointer"
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[12px] font-semibold text-white/80">
              {agent?.nombre || 'Agente'}
            </p>
            <p className="truncate text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {agent?.rol || 'asesor'}
            </p>
          </div>
          <ChevronRight size={12} className="text-[rgba(255,255,255,0.22)] group-hover:text-[rgba(255,255,255,0.50)] transition-colors" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-transparent">
      <ScrollToTop />

      {/* Desktop sidebar */}
      <div className="hidden w-52 shrink-0 flex-col lg:flex">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-[80vw] max-w-[288px] shadow-float">
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
            background: '#ffffff',
            borderBottom: '1px solid #e5e3de',
          }}
        >
          {/* Mobile hamburger */}
          <button
            aria-label="Abrir menú"
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-black/5 hover:text-ink-700 lg:hidden cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Org pill */}
          <div
            className="flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: '#f0ede8',
              border: '1px solid #e5e3de',
            }}
          >
            <div
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
            >
              <Building2 size={7} className="text-white" />
            </div>
            <span className="max-w-[110px] truncate text-[12px] font-semibold capitalize text-ink-800 sm:max-w-none">
              {organizationName}
            </span>
          </div>

          {/* Current page name */}
          {pageLabel && (
            <>
              <span className="text-[13px] text-ink-300">/</span>
              <span className="hidden text-[13px] font-semibold text-ink-600 sm:block">
                {pageLabel}
              </span>
            </>
          )}

          <div className="flex-1" />

          {/* Status + actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                background: connected ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.08)',
                border: connected ? '1px solid rgba(16,185,129,0.20)' : '1px solid rgba(239,68,68,0.15)',
                color: connected ? '#059669' : '#dc2626',
              }}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={connected ? { boxShadow: '0 0 0 2px rgba(16,185,129,0.20)' } : {}}
              />
              <span className="hidden md:block">{connected ? 'En vivo' : 'Offline'}</span>
            </div>

            <button
              onClick={handleShortcuts}
              aria-label="Atajos de teclado"
              title="Atajos de teclado (?)"
              className="hidden lg:flex rounded-full p-1.5 text-ink-400 transition-colors hover:bg-black/5 hover:text-ink-700 cursor-pointer"
            >
              <Keyboard size={14} />
            </button>

            <NotificationBell />

            <button
              onClick={logout}
              aria-label="Cerrar sesión"
              className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
              title="Cerrar sesión"
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
            background: '#ffffff',
            borderTop: '1px solid #e5e3de',
          }}
        >
          <div className="grid grid-cols-5 gap-1">
            {mobilePrimaryItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? currentPath === '/'
                  : currentPath === item.path || currentPath.startsWith(`${item.path}/`);
              const isInbox = item.path === '/inbox';
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex min-h-[52px] flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold transition-all duration-150 cursor-pointer"
                  style={{
                    background: isActive ? 'rgba(139,92,246,0.08)' : 'transparent',
                    color: isActive ? '#7c3aed' : '#919188',
                    letterSpacing: '0.04em',
                  }}
                >
                  <div className="relative">
                    {Icon && <Icon size={16} />}
                    {isInbox && unreadCount > 0 && (
                      <span
                        className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full text-[8px] font-bold text-white"
                        style={{ background: '#ef4444' }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="mt-1">{item.label}</span>
                </NavLink>
              );
            })}

            <button
              onClick={() => setSidebarOpen(true)}
              className="flex min-h-[52px] flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors cursor-pointer"
              style={{ color: '#919188', letterSpacing: '0.04em' }}
            >
              <Menu size={16} />
              <span className="mt-1">Más</span>
            </button>
          </div>
        </nav>
      </div>

      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
