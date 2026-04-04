import { useMemo, useState } from 'react';
import { CalendarClock, PackageCheck, Search, Wrench } from 'lucide-react';
import { ecommerceOrders } from '../data/ecommerce';
import { Card, OrderStatusBadge, SectionTitle, Tag } from '../components/ui/primitives';
import { PageHeader } from '../components/ui/page-header';
import type { EcommerceOrder, OfferType, OrderKind } from '../types';

function formatCop(value: number) {
  if (value <= 0) return 'Pendiente de cotizar';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getOrderKindLabel(kind: OrderKind) {
  if (kind === 'purchase') return 'Compra';
  if (kind === 'booking') return 'Reserva';
  return 'Solicitud de cotización';
}

function getOrderKindColor(kind: OrderKind) {
  if (kind === 'purchase') return 'bg-blue-100 text-blue-700';
  if (kind === 'booking') return 'bg-violet-100 text-violet-700';
  return 'bg-amber-100 text-amber-700';
}

function getOfferTypeColor(type: OfferType) {
  if (type === 'physical') return 'bg-blue-50 text-blue-700';
  if (type === 'service') return 'bg-violet-50 text-violet-700';
  return 'bg-amber-50 text-amber-700';
}

export function OrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | EcommerceOrder['status']>('all');
  const [kind, setKind] = useState<'all' | OrderKind>('all');

  const statuses = useMemo(() => ['all', ...Array.from(new Set(ecommerceOrders.map((order) => order.status)))], []);

  const filtered = ecommerceOrders.filter((order) => {
    const q = search.toLowerCase();
    const statusOk = status === 'all' || order.status === status;
    const kindOk = kind === 'all' || order.orderKind === kind;
    const searchOk =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.items.some((item) => item.sku.toLowerCase().includes(q) || item.title.toLowerCase().includes(q));
    return statusOk && kindOk && searchOk;
  });

  const summary = useMemo(() => ({
    purchase: ecommerceOrders.filter((order) => order.orderKind === 'purchase').length,
    booking: ecommerceOrders.filter((order) => order.orderKind === 'booking').length,
    quote: ecommerceOrders.filter((order) => order.orderKind === 'quote_request').length,
  }), []);

  return (
    <div className="page-shell">
      <div className="page-stack">
        <PageHeader
          eyebrow="Operacion comercial"
          title="Pedidos y solicitudes"
          description="Aquí conviven compras, reservas de servicio y solicitudes híbridas o de cotización."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-400">Compras</p>
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700"><PackageCheck size={15} /></div>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">{summary.purchase}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-400">Reservas</p>
              <div className="rounded-lg bg-violet-100 p-2 text-violet-700"><CalendarClock size={15} /></div>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">{summary.booking}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-400">Cotizaciones</p>
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700"><Wrench size={15} /></div>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">{summary.quote}</p>
          </Card>
        </div>

        <Card className="p-3">
          <SectionTitle title="Filtrar operación comercial" subtitle="Distingue rápido entre una compra, una reserva de servicio y una oportunidad híbrida." />
          <div className="mt-3 flex flex-col gap-2 xl:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2">
              <Search size={14} className="text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por pedido, cliente, oferta o SKU..."
                className="w-full bg-transparent text-sm text-ink-700 outline-none placeholder:text-ink-400"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(['all', 'purchase', 'booking', 'quote_request'] as Array<'all' | OrderKind>).map((item) => (
                <button
                  key={item}
                  onClick={() => setKind(item)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    kind === item ? 'bg-brand-500 text-white' : 'bg-[rgba(17,17,16,0.06)] text-ink-600 hover:bg-[rgba(17,17,16,0.08)]'
                  }`}
                >
                  {item === 'all' ? 'Todos los tipos' : getOrderKindLabel(item)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {statuses.map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item as typeof status)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    status === item ? 'bg-slate-900 text-white' : 'bg-[rgba(17,17,16,0.06)] text-ink-600 hover:bg-[rgba(17,17,16,0.08)]'
                  }`}
                >
                  {item === 'all' ? 'Todos los estados' : item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Compra</p>
              <p className="mt-1 text-sm text-blue-900">Se factura, se prepara y se entrega o despacha.</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Reserva</p>
              <p className="mt-1 text-sm text-violet-900">Se agenda, se confirma y luego se presta el servicio.</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Cotización</p>
              <p className="mt-1 text-sm text-amber-900">Se arma una propuesta comercial antes del cierre.</p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-[rgba(17,17,16,0.025)] text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3">Operación</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-t border-[rgba(17,17,16,0.06)] align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-800">{order.id}</p>
                      <p className="text-xs text-ink-400">{formatDate(order.updatedAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{order.customerName}</td>
                    <td className="px-4 py-3">
                      <Tag text={getOrderKindLabel(order.orderKind)} color={getOrderKindColor(order.orderKind)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.sku}`} className="rounded-lg bg-[rgba(17,17,16,0.025)] px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-ink-800">{item.title}</p>
                              <Tag
                                text={item.offerType === 'physical' ? 'Físico' : item.offerType === 'service' ? 'Servicio' : 'Híbrido'}
                                color={getOfferTypeColor(item.offerType)}
                              />
                            </div>
                            <p className="mt-1 text-xs text-ink-400">{item.sku} · {item.qty} unidad(es)</p>
                          </div>
                        ))}
                        {order.orderKind === 'booking' && (
                          <p className="text-xs text-violet-700">Agendado para {order.scheduledFor ? formatDate(order.scheduledFor) : 'pendiente'} · {order.serviceLocation}</p>
                        )}
                        {order.orderKind === 'quote_request' && (
                          <p className="text-xs text-amber-700">Pendiente de propuesta comercial · {order.serviceLocation}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Tag
                        text={order.channel}
                        color={
                          order.channel === 'ecommerce'
                            ? 'bg-violet-100 text-violet-800'
                            : order.channel === 'whatsapp'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.channel === 'instagram'
                                ? 'bg-pink-100 text-pink-800'
                                : 'bg-blue-100 text-blue-800'
                        }
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{formatCop(order.total)}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <PackageCheck size={14} className="text-brand-600" />
            <p className="text-sm font-semibold text-ink-900">Lectura operativa</p>
          </div>
          <p className="text-sm text-ink-600">
            Si el cliente vende servicios, aquí debe hablarse de <span className="font-semibold">reservas</span> y <span className="font-semibold">capacidad</span>. Si vende físicos, de <span className="font-semibold">pedidos</span> y <span className="font-semibold">despacho</span>. Y si vende híbridos, de ambas cosas al mismo tiempo.
          </p>
        </Card>
      </div>
    </div>
  );
}
