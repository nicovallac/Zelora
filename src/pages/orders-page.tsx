import { useMemo, useState } from 'react';
import { PackageCheck, Search } from 'lucide-react';
import { ecommerceOrders } from '../data/ecommerce';
import { Card, OrderStatusBadge, SectionTitle, Tag } from '../components/ui/primitives';

function formatCop(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function OrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | (typeof ecommerceOrders)[number]['status']>('all');

  const statuses = useMemo(() => ['all', ...Array.from(new Set(ecommerceOrders.map((o) => o.status)))], []);

  const filtered = ecommerceOrders.filter((order) => {
    const statusOk = status === 'all' || order.status === status;
    const q = search.toLowerCase();
    const searchOk =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.items.some((item) => item.sku.toLowerCase().includes(q));
    return statusOk && searchOk;
  });

  return (
    <div className="space-y-4 px-3 pb-4 pt-5 sm:px-4 lg:px-5">
      <SectionTitle
        title="Pedidos"
        subtitle="Seguimiento de ordenes por canal (E-commerce, WhatsApp, Instagram, Web)."
      />

      <Card className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por pedido, cliente o SKU..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder-slate-400"
            />
          </div>
          <div className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1">
            {statuses.map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item as typeof status)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  status === item ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item === 'all' ? 'Todos' : item}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Pedidos activos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {ecommerceOrders.filter((o) => ['new', 'paid', 'processing', 'shipped'].includes(o.status)).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Ingresos (muestra)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCop(ecommerceOrders.reduce((sum, o) => sum + o.total, 0))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Canales conectados</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">4</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{order.id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{order.customerName}</td>
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
                  <td className="px-4 py-3 text-slate-700">{order.items.length}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCop(order.total)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(order.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <PackageCheck size={14} className="text-brand-600" />
          <p className="text-sm font-semibold text-slate-900">Siguiente paso operativo</p>
        </div>
        <p className="text-sm text-slate-600">
          Conectar esta vista a webhooks de tu plataforma e-commerce (`orders/create`, `orders/paid`, `fulfillments/create`) para sincronizar estado de pedidos en tiempo real.
        </p>
      </Card>
    </div>
  );
}
