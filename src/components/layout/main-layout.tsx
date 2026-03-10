import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, BarChart3, BookOpen, Megaphone,
  GitBranch, Plug, Settings, CreditCard, Users, UserCheck,
  Building2, Brain, Shuffle, LogOut, ChevronDown,
  Wifi, WifiOff, ChevronRight, Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { NotificationBell } from '../ui/NotificationBell';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, MessageSquare, BarChart3, BookOpen, Megaphone,
  GitBranch, Plug, Settings, CreditCard, Users, UserCheck,
  Building2, Brain, Shuffle,
};

const NAV_SECTIONS = [
  {
    label: 'Principal',
    paths: ['/', '/inbox', '/analytics'],
  },
  {
    label: 'Contenido',
    paths: ['/knowledge-base', '/campaigns', '/flows'],
  },
  {
    label: 'Configuración',
    paths: ['/integrations', '/settings', '/billing'],
  },
];

const MOCK_ORGS = [
  { id: 1, name: 'Comfaguajira', plan: 'Plan Pro' },
  { id: 2, name: 'Demo Corp', plan: 'Plan Básico' },
];

const ALL_NAV = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard', audience: 'all' },
  { label: 'Inbox', path: '/inbox', icon: 'MessageSquare', audience: 'all' },
  { label: 'Analytics', path: '/analytics', icon: 'BarChart3', audience: 'all' },
  { label: 'Base de conocimiento', path: '/knowledge-base', icon: 'BookOpen', audience: 'all' },
  { label: 'Campañas', path: '/campaigns', icon: 'Megaphone', audience: 'all' },
  { label: 'Flujos', path: '/flows', icon: 'GitBranch', audience: 'all' },
  { label: 'Integraciones', path: '/integrations', icon: 'Plug', audience: 'all' },
  { label: 'Configuración', path: '/settings', icon: 'Settings', audience: 'all' },
  { label: 'Facturación', path: '/billing', icon: 'CreditCard', audience: 'all' },
  { label: 'Agentes', path: '/admin/agents', icon: 'Users', audience: 'admin' },
  { label: 'Contactos', path: '/admin/contacts', icon: 'UserCheck', audience: 'admin' },
  { label: 'Organización', path: '/admin/organizations', icon: 'Building2', audience: 'admin' },
  { label: 'Entrenamiento IA', path: '/admin/training', icon: 'Brain', audience: 'admin' },
  { label: 'Enrutamiento', path: '/admin/routing', icon: 'Shuffle', audience: 'admin' },
];

type NavEntry = typeof ALL_NAV[0];

function NavItem({ item, onClose }: { item: NavEntry; onClose?: () => void }) {
  const Icon = ICON_MAP[item.icon];
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
          isActive
            ? 'bg-brand-50 text-brand-700 font-semibold'
            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
        }`
      }
      onClick={onClose}
    >
      {({ isActive }) => (
        <>
          {Icon && <Icon size={16} className={isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600'} />}
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function MainLayout() {
  const { agent, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { connected } = useWebSocket('/ws/inbox');
  const [orgOpen, setOrgOpen] = useState(false);
  const [currentOrg, setCurrentOrg] = useState(MOCK_ORGS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const orgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (orgRef.current && !orgRef.current.contains(e.target as Node)) setOrgOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sectionItems = NAV_SECTIONS.map(section => ({
    ...section,
    items: ALL_NAV.filter(n => section.paths.includes(n.path) && n.audience !== 'admin'),
  }));

  const adminItems = ALL_NAV.filter(n => n.audience === 'admin');

  const sidebar = (
    <div className="flex flex-col h-full bg-white border-r border-ink-200">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-ink-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <MessageSquare size={16} className="text-white" />
          </div>
          <span className="font-bold text-ink-900 text-base">Vendly</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sectionItems.map(section => (
          <div key={section.label}>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider px-3 mb-1.5">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavItem key={item.path} item={item} onClose={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider px-3 mb-1.5">Administración</p>
            <div className="space-y-0.5">
              {adminItems.map(item => (
                <NavItem key={item.path} item={item} onClose={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-ink-100 p-3">
        <button
          onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-ink-50 transition-colors group"
        >
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
            {agent?.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AG'}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-semibold text-ink-800 truncate">{agent?.nombre || 'Agente'}</p>
            <p className="text-xs text-ink-400 truncate capitalize">{agent?.rol || 'asesor'}</p>
          </div>
          <ChevronRight size={14} className="text-ink-300 group-hover:text-ink-500" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 shrink-0 flex-col">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56 h-full">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-ink-200 flex items-center px-4 gap-3 shrink-0">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-1.5 text-ink-500 hover:text-ink-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Org switcher */}
          <div className="relative" ref={orgRef}>
            <button
              onClick={() => setOrgOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-200 hover:bg-ink-50 transition-colors text-sm"
            >
              <div className="w-5 h-5 bg-brand-100 rounded flex items-center justify-center">
                <Building2 size={11} className="text-brand-600" />
              </div>
              <span className="font-semibold text-ink-800 hidden sm:block">{currentOrg.name}</span>
              <span className="text-xs text-ink-400 hidden md:block">· {currentOrg.plan}</span>
              <ChevronDown size={13} className="text-ink-400" />
            </button>
            {orgOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-ink-200 rounded-xl shadow-lg py-1.5 z-50">
                <p className="text-xs text-ink-400 px-3 pb-1.5 font-medium">Cambiar organización</p>
                {MOCK_ORGS.map(org => (
                  <button
                    key={org.id}
                    onClick={() => { setCurrentOrg(org); setOrgOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-ink-50 transition-colors text-left ${currentOrg.id === org.id ? 'bg-brand-50' : ''}`}
                  >
                    <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={13} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-800">{org.name}</p>
                      <p className="text-xs text-ink-400">{org.plan}</p>
                    </div>
                    {currentOrg.id === org.id && <div className="ml-auto w-1.5 h-1.5 bg-brand-500 rounded-full" />}
                  </button>
                ))}
                <div className="border-t border-ink-100 mt-1.5 pt-1.5">
                  <button className="w-full text-xs text-brand-600 hover:text-brand-700 px-3 py-1.5 text-left font-medium hover:bg-brand-50 transition-colors">
                    + Nueva organización
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* WS indicator */}
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
              <span className="hidden sm:block">{connected ? 'En vivo' : 'Offline'}</span>
            </div>
            <NotificationBell />
            <button
              onClick={logout}
              className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
