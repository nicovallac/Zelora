import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { ecommerceProducts, getVariantStockStatus, inventoryMovements } from '../data/ecommerce';
import { Card, SectionTitle, StockBadge } from '../components/ui/primitives';

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function InventoryPage() {
  const [onlyCritical, setOnlyCritical] = useState(false);

  const flatVariants = useMemo(
    () =>
      ecommerceProducts.flatMap((p) =>
        p.variants.map((variant) => ({
          productId: p.id,
          productTitle: p.title,
          ...variant,
          available: variant.stock - variant.reserved,
          stockStatus: getVariantStockStatus(variant),
        }))
      ),
    []
  );

  const variants = onlyCritical
    ? flatVariants.filter((v) => v.stockStatus !== 'in_stock')
    : flatVariants;

  const criticalCount = flatVariants.filter((v) => v.stockStatus !== 'in_stock').length;

  return (
    <div className="space-y-4 px-3 pb-4 pt-5 sm:px-4 lg:px-5">
      <SectionTitle
        title="Inventario"
        subtitle="Control de stock por SKU, reservas y movimientos recientes."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-slate-500">SKUs totales</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{flatVariants.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Stock critico</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{criticalCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Movimientos hoy</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{inventoryMovements.length}</p>
        </Card>
      </div>

      <Card className="p-3">
        <button
          onClick={() => setOnlyCritical((v) => !v)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            onlyCritical ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {onlyCritical ? 'Mostrando solo stock critico' : 'Filtrar solo stock critico'}
        </button>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Reservado</th>
                <th className="px-4 py-3">Disponible</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{v.productTitle}</p>
                    <p className="text-xs text-slate-500">{v.name}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.sku}</td>
                  <td className="px-4 py-3 text-slate-700">{v.stock}</td>
                  <td className="px-4 py-3 text-slate-700">{v.reserved}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{v.available}</td>
                  <td className="px-4 py-3"><StockBadge status={v.stockStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <RefreshCw size={14} className="text-brand-600" />
          <p className="text-sm font-semibold text-slate-900">Ultimos movimientos</p>
        </div>
        <div className="space-y-2">
          {inventoryMovements.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{m.sku}</p>
                <p className="text-xs text-slate-500">{m.reason} · {m.actor}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {m.type === 'in' && <ArrowUp size={14} className="text-emerald-600" />}
                {m.type === 'out' && <ArrowDown size={14} className="text-red-600" />}
                {m.type === 'adjustment' && <AlertTriangle size={14} className="text-amber-600" />}
                {m.type === 'reservation' && <RefreshCw size={14} className="text-violet-600" />}
                <span className="font-semibold text-slate-700">{m.type}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{m.quantity}</span>
                <span className="text-slate-400">{formatDateTime(m.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
