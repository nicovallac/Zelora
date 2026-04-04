import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/primitives';
import { PageHeader } from '../ui/page-header';
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

function buildMessage(
  maturity: DashboardMaturity,
  activeConversations: number,
  pendingConversations: number,
) {
  if (maturity === 'nuevo') return 'Tu cuenta esta lista. Vamos a activar tu operacion conversacional.';
  if (maturity === 'activado') {
    return pendingConversations > 0
      ? `${activeConversations} conversaciones activas · ${pendingConversations} pendientes por responder.`
      : 'Ya activaste lo esencial. Mueve tus conversaciones hacia venta y respuesta rapida.';
  }
  return pendingConversations > 0
    ? `${activeConversations} conversaciones activas · ${pendingConversations} pendientes por responder.`
    : 'Tu operacion esta en marcha. Revisa alertas, oportunidades y rendimiento del dia.';
}

export function DashboardHeader({
  maturity,
  agentName,
  activeConversations,
  pendingConversations,
  connected,
  refreshing,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <PageHeader
      eyebrow="Centro de control"
      title={`Hola, ${agentName}.`}
      description={buildMessage(maturity, activeConversations, pendingConversations)}
      meta={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
            connected ? 'bg-brand-100/80 text-brand-700' : 'bg-red-50/80 text-red-600'
          }`}
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? 'Conectado en tiempo real' : 'Sin conexion'}
        </span>
      }
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </Button>
          <Link
            to={maturity === 'nuevo' ? '/onboarding' : '/inbox'}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2 text-[13px] font-semibold text-white shadow-card transition-all duration-200 hover:bg-brand-500 hover:-translate-y-px"
          >
            {maturity === 'nuevo' ? 'Seguir activando' : 'Ir a inbox'}
            <ArrowRight size={13} />
          </Link>
        </>
      }
    />
  );
}
