import { Link } from 'react-router-dom';
import { Package, ArrowRight, CheckCircle2 } from 'lucide-react';
import { OrderStatusBadge, ChannelBadge } from '../ui/primitives';
import type { OrderStatus } from '../../types';

interface Order {
  id: string;
  customer_name: string;
  channel: string;
  status: string;
  total: number;
  created_at: string;
}

const PENDING_STATUSES: string[] = ['new', 'paid', 'processing'];

function timeAgo(dateStr: string): string {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

interface PendingShipmentsProps {
  orders: Order[];
}

const MAX_VISIBLE = 25;

export function PendingShipments({ orders }: PendingShipmentsProps) {
  const pending = orders
    .filter((o) => PENDING_STATUSES.includes(o.status))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const visible = pending.slice(0, MAX_VISIBLE);
  const overflow = pending.length - MAX_VISIBLE;

  return (
    <div
      className="flex flex-col rounded-3xl p-5 sm:p-6"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(255,255,255,0.55)',
        borderBottomColor: 'rgba(17,17,16,0.08)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 6px 18px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-amber-600">
            <Package size={13} />
          </div>
          <div>
            <h2
              className="text-[15px] font-bold leading-tight text-ink-900"
              style={{ letterSpacing: '-0.01em' }}
            >
              Por enviar
            </h2>
            <p className="text-[11px] text-ink-400">
              {pending.length > 0
                ? `${pending.length} pedido${pending.length === 1 ? '' : 's'} esperando`
                : 'Pedidos pendientes de despacho'}
            </p>
          </div>
        </div>

        {pending.length > 0 && (
          <span
            className="flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[11px] font-bold text-white"
            style={{ background: pending.length > 5 ? '#d97706' : '#6d28d9' }}
          >
            {pending.length > MAX_VISIBLE ? `${MAX_VISIBLE}+` : pending.length}
          </span>
        )}
      </div>

      {/* Content */}
      {visible.length === 0 ? (
        <div
          className="mt-4 flex flex-col items-center justify-center rounded-2xl py-8 text-center"
          style={{ background: 'rgba(17,17,16,0.02)', border: '1px dashed rgba(17,17,16,0.08)' }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={16} />
          </div>
          <p className="mt-3 text-[13px] font-semibold text-ink-800">Sin pedidos pendientes</p>
          <p className="mt-1 text-[11px] text-ink-400">
            Los pedidos nuevos y por preparar aparecen aqui.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-1.5">
          {/* Column headers */}
          <div className="mb-1 grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-1">
            <p className="text-[9px] font-semibold uppercase text-ink-300" style={{ letterSpacing: '0.12em' }}>Cliente</p>
            <p className="text-[9px] font-semibold uppercase text-ink-300" style={{ letterSpacing: '0.12em' }}>Canal</p>
            <p className="text-[9px] font-semibold uppercase text-ink-300" style={{ letterSpacing: '0.12em' }}>Estado</p>
            <p className="text-[9px] font-semibold uppercase text-ink-300" style={{ letterSpacing: '0.12em' }}>Hace</p>
          </div>

          <div className="max-h-[340px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex flex-col gap-1.5">
              {visible.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-150 hover:bg-white/60"
                  style={{ border: '1px solid rgba(17,17,16,0.05)', background: 'rgba(17,17,16,0.02)' }}
                >
                  {/* Customer */}
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-ink-800">
                      {order.customer_name}
                    </p>
                    <p className="text-[10px] text-ink-400">
                      {formatCurrency(order.total)}
                    </p>
                  </div>

                  {/* Channel */}
                  <ChannelBadge channel={order.channel} />

                  {/* Status */}
                  <OrderStatusBadge status={order.status as OrderStatus} />

                  {/* Time */}
                  <p className="shrink-0 text-[10px] tabular-nums text-ink-400">
                    {timeAgo(order.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Overflow indicator */}
          {overflow > 0 && (
            <p className="mt-1 text-center text-[11px] text-ink-400">
              +{overflow} pedidos más
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      {pending.length > 0 && (
        <div
          className="mt-4 border-t pt-3"
          style={{ borderColor: 'rgba(17,17,16,0.06)' }}
        >
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 hover:text-brand-500"
          >
            Ver todos los pedidos
            <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}
