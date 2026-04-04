import type { EcommerceOrder, Product } from '../../types';
import { OrderStatusBadge, StockBadge } from '../ui/primitives';
import { getVariantStockStatus } from '../../data/ecommerce';

interface RelatedVariant {
  product: Product;
  variant: Product['variants'][number];
}

interface OrderActionPanelProps {
  relatedOrder?: EcommerceOrder;
  relatedVariants: RelatedVariant[];
  onReserveStock: () => void;
  onMarkShipped: () => void;
  onCreateOrder: () => void;
}

function formatCop(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function OrderActionPanel({
  relatedOrder,
  relatedVariants,
  onReserveStock,
  onMarkShipped,
  onCreateOrder,
}: OrderActionPanelProps) {
  return (
    <div className="border-b border-[rgba(17,17,16,0.07)] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Contexto e-commerce</p>
        {relatedOrder ? (
          <span className="rounded-full bg-violet-100/80 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
            Pedido detectado
          </span>
        ) : (
          <span className="rounded-full bg-[rgba(17,17,16,0.04)] px-2 py-0.5 text-[10px] font-semibold text-ink-500">
            Sin pedido
          </span>
        )}
      </div>

      {relatedOrder ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] p-3">
            <p className="text-xs font-semibold text-ink-800">{relatedOrder.id}</p>
            <p className="mt-0.5 text-[11px] text-ink-500">
              Canal: {relatedOrder.channel} · Total: {formatCop(relatedOrder.total)}
            </p>
            <div className="mt-2">
              <OrderStatusBadge status={relatedOrder.status} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-ink-600">SKUs relacionados</p>
            {relatedVariants.map(({ product, variant }) => (
              <div key={variant.id} className="rounded-xl border border-[rgba(17,17,16,0.07)] bg-[rgba(255,255,255,0.50)] p-2">
                <p className="text-xs font-semibold text-ink-800">{product.title}</p>
                <p className="text-[11px] text-ink-500">
                  {variant.name} · {variant.sku}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-ink-500">
                    Disponible: <span className="font-semibold text-ink-700">{variant.stock - variant.reserved}</span>
                  </p>
                  <StockBadge status={getVariantStockStatus(variant)} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-1.5 pt-1">
            <button
              onClick={onReserveStock}
              className="rounded-full bg-violet-100 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-200"
            >
              Reservar stock
            </button>
            <button
              onClick={onMarkShipped}
              className="rounded-full bg-cyan-100 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-200"
            >
              Marcar como enviado
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] p-3 text-xs text-ink-500">
          <p>No hay pedido vinculado en mock para este cliente.</p>
          <button
            onClick={onCreateOrder}
            className="w-full rounded-full bg-brand-100 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-200"
          >
            Crear pedido rapido
          </button>
        </div>
      )}
    </div>
  );
}
