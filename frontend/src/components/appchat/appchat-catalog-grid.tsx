import { Search } from 'lucide-react';
import type { RefObject } from 'react';
import type { PublicProductApiItem } from '../../services/api';
import { formatCop, getProductImage, getProductPrice } from './appchat-utils';

export function AppChatCatalogGrid({
  products,
  orgSlug,
  onAskAbout,
}: {
  products: PublicProductApiItem[];
  orgSlug: string;
  onAskAbout?: (product: PublicProductApiItem) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="col-span-2 rounded-[18px] border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.02)] px-4 py-6 text-center text-[13px] text-ink-500">
        No encontre nada con esa busqueda.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="group overflow-hidden rounded-[16px] bg-[rgba(17,17,16,0.025)] shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
        >
          <div className="aspect-[0.78] overflow-hidden">
            <a href={`/shop/${orgSlug}/${product.id}`}>
              <img
                src={getProductImage(product, index)}
                alt={product.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </a>
          </div>
          <div className="px-2.5 py-2.5">
            <p className="line-clamp-2 text-[11.5px] font-medium leading-4 text-ink-900">{product.title}</p>
            <p className="mt-1.5 text-[11px] font-semibold text-ink-700">{formatCop(getProductPrice(product))}</p>
            {onAskAbout ? (
              <div className="mt-2 flex gap-1.5">
                <a
                  href={`/shop/${orgSlug}/${product.id}/comprar`}
                  className="flex-1 rounded-full bg-[#111110] px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Comprar
                </a>
                <button
                  type="button"
                  onClick={() => onAskAbout(product)}
                  className="flex-1 rounded-full border border-[rgba(17,17,16,0.10)] bg-white px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-700"
                >
                  Preguntar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppChatCatalogPanel({
  open,
  catalogQuery,
  products,
  orgSlug,
  heroHeight,
  scrollerRef,
  onQueryChange,
  onClose,
  onAskAbout,
}: {
  open: boolean;
  catalogQuery: string;
  products: PublicProductApiItem[];
  orgSlug: string;
  heroHeight: number;
  scrollerRef: RefObject<HTMLDivElement | null>;
  onQueryChange: (v: string) => void;
  onClose: () => void;
  onAskAbout: (product: PublicProductApiItem) => void;
}) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-20 flex flex-col bg-white px-5 pb-4 pt-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ top: `${heroHeight + 16}px` }}
    >
      <div className="shrink-0">
        <div className="flex items-center gap-3 border-b border-[rgba(17,17,16,0.08)] pb-2">
          <Search size={15} className="text-ink-400" />
          <input
            value={catalogQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por producto, categoria o color"
            className="h-10 flex-1 bg-transparent text-[14px] text-ink-900 outline-none placeholder:text-ink-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 transition hover:text-ink-900"
          >
            Cerrar
          </button>
        </div>
      </div>
      <div ref={scrollerRef} id="catalogo" className="min-h-0 flex-1 overflow-y-auto pt-4">
        <AppChatCatalogGrid products={products} orgSlug={orgSlug} onAskAbout={onAskAbout} />
      </div>
    </div>
  );
}
