import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, CalendarClock, Package, Wrench } from 'lucide-react';
import { ecommerceProducts, getVariantStockStatus, inventoryMovements } from '../data/ecommerce';
import { Card, SectionTitle, StockBadge, Tag } from '../components/ui/primitives';
import { PageHeader } from '../components/ui/page-header';
import type { OfferType } from '../types';

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getOfferTypeLabel(type: OfferType) {
  if (type === 'physical') return 'Producto físico';
  if (type === 'service') return 'Servicio';
  return 'Híbrido';
}

function getOfferTypeColor(type: OfferType) {
  if (type === 'physical') return 'bg-blue-100 text-blue-700';
  if (type === 'service') return 'bg-violet-100 text-violet-700';
  return 'bg-amber-100 text-amber-700';
}

export function InventoryPage() {
  const [offerType, setOfferType] = useState<'all' | OfferType>('all');
  const [onlyCritical, setOnlyCritical] = useState(false);

  const flatVariants = useMemo(
    () =>
      ecommerceProducts.flatMap((product) =>
        product.variants.map((variant) => ({
          productId: product.id,
          productTitle: product.title,
          offerType: product.offerType,
          requiresBooking: product.requiresBooking,
          requiresShipping: product.requiresShipping,
          serviceMode: product.serviceMode,
          ...variant,
          available: Math.max(0, variant.stock - variant.reserved),
          stockStatus: getVariantStockStatus(variant),
        }))
      ),
    []
  );

  const visibleVariants = flatVariants.filter((variant) => {
    const matchesType = offerType === 'all' || variant.offerType === offerType;
    const matchesCritical = !onlyCritical || variant.offerType !== 'service' ? variant.stockStatus !== 'in_stock' : false;
    return matchesType && matchesCritical;
  });

  const physicalCount = flatVariants.filter((variant) => variant.offerType === 'physical' && variant.stockStatus !== 'in_stock').length;
  const hybridCount = flatVariants.filter((variant) => variant.offerType === 'hybrid' && variant.stockStatus !== 'in_stock').length;
  const serviceCapacityCount = flatVariants.filter((variant) => variant.offerType === 'service').reduce((sum, variant) => sum + variant.capacity, 0);

  return (
    <div className="page-shell">
      <div className="page-stack">
        <PageHeader
          eyebrow="Operacion de catalogo"
          title="Operaciones de catálogo"
          description="Controla inventario, capacidad y alertas según el tipo de oferta que vende la marca."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-400">Alertas físicas</p>
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700"><Package size={15} /></div>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">{physicalCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-400">Capacidad de servicios</p>
              <div className="rounded-lg bg-violet-100 p-2 text-violet-700"><CalendarClock size={15} /></div>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">{serviceCapacityCount}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-400">Alertas híbridas</p>
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700"><Wrench size={15} /></div>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">{hybridCount}</p>
          </Card>
        </div>

        <Card className="p-4">
          <SectionTitle title="Filtrar operación" subtitle="No todo se controla igual: stock para físicos, cupos para servicios, ambos para híbridos." />
          <div className="mt-3 flex flex-wrap gap-2">
            {(['all', 'physical', 'service', 'hybrid'] as Array<'all' | OfferType>).map((type) => (
              <button
                key={type}
                onClick={() => setOfferType(type)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  offerType === type ? 'bg-brand-500 text-white' : 'bg-[rgba(17,17,16,0.06)] text-ink-600 hover:bg-[rgba(17,17,16,0.08)]'
                }`}
              >
                {type === 'all' ? 'Todos' : getOfferTypeLabel(type)}
              </button>
            ))}
            <button
              onClick={() => setOnlyCritical((prev) => !prev)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${onlyCritical ? 'bg-red-600 text-white' : 'bg-[rgba(17,17,16,0.06)] text-ink-600 hover:bg-[rgba(17,17,16,0.08)]'}`}
            >
              Solo alertas
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Físico</p>
              <p className="mt-1 text-sm text-blue-900">Controla unidades disponibles, reservas y reposición.</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Servicio</p>
              <p className="mt-1 text-sm text-violet-900">Controla agenda, duración y cupos disponibles.</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Híbrido</p>
              <p className="mt-1 text-sm text-amber-900">Controla tanto el stock como la capacidad del servicio.</p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="bg-[rgba(17,17,16,0.025)] text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3">Oferta</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">SKU / plan</th>
                  <th className="px-4 py-3">Operación</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Observación</th>
                </tr>
              </thead>
              <tbody>
                {visibleVariants.map((variant) => (
                  <tr key={variant.id} className="border-t border-[rgba(17,17,16,0.06)]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-800">{variant.productTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Tag text={getOfferTypeLabel(variant.offerType)} color={getOfferTypeColor(variant.offerType)} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-800">{variant.sku}</p>
                      <p className="text-xs text-ink-400">{variant.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      {variant.offerType === 'physical' && (
                        <div>
                          <p className="font-semibold text-ink-800">{variant.available} und disponibles</p>
                          <p className="text-xs text-ink-400">Reservado: {variant.reserved}</p>
                        </div>
                      )}
                      {variant.offerType === 'service' && (
                        <div>
                          <p className="font-semibold text-ink-800">{variant.capacity} cupos</p>
                          <p className="text-xs text-ink-400">{variant.durationMinutes} min · {variant.deliveryMode}</p>
                        </div>
                      )}
                      {variant.offerType === 'hybrid' && (
                        <div>
                          <p className="font-semibold text-ink-800">{variant.available} kits</p>
                          <p className="text-xs text-ink-400">{variant.capacity} cupos · {variant.durationMinutes} min</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {variant.offerType === 'service' ? (
                        <Tag text="Gestionar agenda" color="bg-violet-50 text-violet-700" />
                      ) : (
                        <StockBadge status={variant.stockStatus} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-400">
                      {variant.offerType === 'physical' && 'Revisar reposición y despacho.'}
                      {variant.offerType === 'service' && 'Controlar agenda, capacidad y asignación.'}
                      {variant.offerType === 'hybrid' && 'Coordinar stock físico y sesión de entrega.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-4">
            <SectionTitle title="Movimientos recientes" subtitle="Solo físicos e híbridos generan movimientos de stock." />
            <div className="mt-4 space-y-3">
              {inventoryMovements.map((movement) => (
                <div key={movement.id} className="flex items-start justify-between rounded-lg border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] p-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-2 ${movement.type === 'in' ? 'bg-emerald-100 text-emerald-700' : movement.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {movement.type === 'in' ? <ArrowDown size={13} /> : movement.type === 'out' ? <ArrowUp size={13} /> : <AlertTriangle size={13} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{movement.sku}</p>
                      <p className="text-xs text-ink-400">{movement.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Tag text={getOfferTypeLabel(movement.offerType)} color={getOfferTypeColor(movement.offerType)} />
                    <p className="mt-1 text-xs text-ink-400">{formatDateTime(movement.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle title="Reglas operativas" subtitle="La interfaz debe dejar claro qué se controla en cada caso." />
            <div className="mt-4 space-y-3 text-sm text-ink-600">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="font-semibold text-blue-800">Producto físico</p>
                <p className="mt-1">Se controla inventario, reservados, despacho y movimientos.</p>
              </div>
              <div className="rounded-lg border border-violet-100 bg-violet-50 p-3">
                <p className="font-semibold text-violet-800">Servicio</p>
                <p className="mt-1">Se controla capacidad, agenda, duración y forma de prestación. No depende de stock.</p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="font-semibold text-amber-800">Híbrido</p>
                <p className="mt-1">Se coordinan ambas capas: disponibilidad física y prestación del servicio.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
