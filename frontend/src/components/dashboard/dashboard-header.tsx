import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/primitives';
import type { DashboardMaturity } from './types';

interface DashboardHeaderProps {
  maturity: DashboardMaturity;
  agentName: string;
  activeConversations: number;
  pendingConversations: number;
  connected: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({
  agentName,
  activeConversations,
  pendingConversations,
  connected,
  refreshing,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <div
      className="rounded-3xl px-6 py-5"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(255,255,255,0.55)',
        borderBottomColor: 'rgba(17,17,16,0.08)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 6px 18px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.70)',
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: greeting */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1
              className="text-[22px] font-bold leading-none text-ink-900 sm:text-[26px]"
              style={{ letterSpacing: '-0.025em' }}
            >
              Hola, {agentName}.
            </h1>
            {/* Live pulse */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: connected ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.08)', color: connected ? '#059669' : '#dc2626' }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: connected ? '#10b981' : '#ef4444',
                  boxShadow: connected ? '0 0 0 3px rgba(16,185,129,0.20)' : undefined,
                }}
              />
              {activeConversations > 0 ? `${activeConversations} activas` : 'En vivo'}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] text-ink-400">
            {pendingConversations > 0
              ? `${pendingConversations} conversacion${pendingConversations === 1 ? '' : 'es'} esperan tu atencion`
              : 'Todo al dia · sin pendientes urgentes'}
          </p>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-2">
          {pendingConversations > 0 && (
            <Link
              to="/inbox"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold text-white transition-all duration-200 hover:-translate-y-px hover:shadow-float active:translate-y-0"
              style={{ background: '#7c3aed', boxShadow: '0 1px 3px rgba(124,58,237,0.30), 0 4px 12px rgba(124,58,237,0.18)' }}
            >
              Revisar {pendingConversations} pendiente{pendingConversations === 1 ? '' : 's'}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
          <Button variant="secondary" size="sm" onClick={onRefresh} className="gap-1.5">
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
