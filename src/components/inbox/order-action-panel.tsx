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
    <div className="border-b border-slate-100 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contexto e-commerce</p>
        {relatedOrder ? (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
            Pedido detectado
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Sin pedido
          </span>
        )}
      </div>

      {relatedOrder ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-800">{relatedOrder.id}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Canal: {relatedOrder.channel} · Total: {formatCop(relatedOrder.total)}
            </p>
            <div className="mt-2">
              <OrderStatusBadge status={relatedOrder.status} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-600">SKUs relacionados</p>
            {relatedVariants.map(({ product, variant }) => (
              <div key={variant.id} className="rounded-lg border border-slate-200 p-2">
                <p className="text-xs font-semibold text-slate-800">{product.title}</p>
                <p className="text-[11px] text-slate-500">
                  {variant.name} · {variant.sku}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-500">
                    Disponible: <span className="font-semibold text-slate-700">{variant.stock - variant.reserved}</span>
                  </p>
                  <StockBadge status={getVariantStockStatus(variant)} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-1.5 pt-1">
            <button
              onClick={onReserveStock}
              className="rounded-lg bg-violet-100 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-200"
            >
              Reservar stock
            </button>
            <button
              onClick={onMarkShipped}
              className="rounded-lg bg-cyan-100 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-200"
            >
              Marcar como enviado
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p>No hay pedido vinculado en mock para este cliente.</p>
          <button
            onClick={onCreateOrder}
            className="w-full rounded-lg bg-brand-100 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-200"
          >
            Crear pedido rapido
          </button>
        </div>
      )}
    </div>
  );
}
