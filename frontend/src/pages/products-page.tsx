import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CalendarClock, ImagePlus, Package, Pencil, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { getProductAvailableUnits } from '../data/ecommerce';
import { Button, Card, Tag } from '../components/ui/primitives';
import { PageHeader } from '../components/ui/page-header';
import { CropModal } from '../components/ui/crop-modal';
import type { OfferType, PriceType, Product, ProductVariant, ServiceMode } from '../types';
import { api } from '../services/api';
import type { ProductApiItem, ProductPayload, ProductVariantPayload } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

function formatCop(value: number) {
  if (value <= 0) return 'A cotizar';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function getOfferTypeBadge(type: OfferType) {
  if (type === 'physical') return 'bg-sky-100/70 text-sky-600';
  if (type === 'service') return 'bg-violet-100/70 text-violet-600';
  return 'bg-amber-100/70 text-amber-600';
}

function getOfferTypeLabel(type: OfferType) {
  if (type === 'physical') return 'Producto físico';
  if (type === 'service') return 'Servicio';
  return 'Híbrido';
}

function getPriceTypeLabel(type: PriceType) {
  if (type === 'fixed') return 'Precio fijo';
  if (type === 'variable') return 'Precio variable';
  return 'Cotización';
}

function getOfferTypeDescription(type: OfferType) {
  if (type === 'physical') return 'Lo gestionas con stock, reservados y despacho.';
  if (type === 'service') return 'Lo gestionas con agenda, duración y capacidad.';
  return 'Necesita stock físico y también agenda o implementación.';
}

function getEditorChecklist(type: OfferType) {
  if (type === 'physical') return ['Nombre y categoría', 'Precio por variante', 'Stock y reservados', 'Despacho o entrega'];
  if (type === 'service') return ['Nombre y categoría', 'Duración y capacidad', 'Modalidad del servicio', 'Reserva y prestación'];
  return ['Nombre y categoría', 'Precio y stock base', 'Duración y capacidad', 'Entrega e implementación'];
}

function getVariantBlockTitle(type: OfferType) {
  if (type === 'physical') return 'Variantes de producto';
  if (type === 'service') return 'Planes de servicio';
  return 'Paquetes híbridos';
}

function getVariantBlockDescription(type: OfferType) {
  if (type === 'physical') return 'Cada variante representa una presentación física con su propio SKU, precio y stock.';
  if (type === 'service') return 'Cada plan representa una modalidad o duración del servicio con su propia capacidad.';
  return 'Cada paquete combina inventario físico con alcance de servicio o implementación.';
}

function getVariantNameLabel(type: OfferType) {
  if (type === 'physical') return 'Nombre de la variante';
  if (type === 'service') return 'Nombre del plan';
  return 'Nombre del paquete';
}

function getVariantNamePlaceholder(type: OfferType) {
  if (type === 'physical') return 'Talla M / Negro';
  if (type === 'service') return 'Remoto 45 min';
  return 'Kit estándar + setup';
}

function newVariant(type: OfferType): ProductVariant {
  return {
    id: `v-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    sku: '',
    name: '',
    price: 0,
    cost: 0,
    stock: 0,
    reserved: 0,
    durationMinutes: type === 'physical' ? 0 : 30,
    capacity: type === 'physical' ? 0 : 1,
    deliveryMode: type === 'physical' ? 'not_applicable' : 'remote',
  };
}

function newOffer(): Product {
  return {
    id: `offer-${Date.now()}`,
    title: '',
    brand: '',
    category: '',
    offerType: 'physical',
    priceType: 'fixed',
    serviceMode: 'not_applicable',
    requiresBooking: false,
    requiresShipping: true,
    serviceDurationMinutes: 0,
    capacity: 0,
    fulfillmentNotes: '',
    attributes: {},
    status: 'draft',
    images: [],
    tags: [],
    updatedAt: new Date().toISOString(),
    variants: [newVariant('physical')],
  };
}

const DEFAULT_CATEGORIES = [
  'Ropa',
  'Calzado',
  'Accesorios',
  'Belleza',
  'Cuidado personal',
  'Hogar',
  'Tecnologia',
  'Mascotas',
  'Salud y bienestar',
  'Alimentos y bebidas',
  'Servicios',
  'Suscripciones',
];

function copyOffer(product: Product): Product {
  const idSuffix = `${Date.now()}`.slice(-5);
  return {
    ...product,
    id: `offer-copy-${idSuffix}`,
    title: `${product.title} (Copia)`,
    updatedAt: new Date().toISOString(),
    variants: product.variants.map((v, idx) => ({
      ...v,
      id: `v-copy-${idSuffix}-${idx}`,
      sku: `${v.sku}-COPY`,
    })),
  };
}

function mapApiVariantToUi(variant: ProductApiItem['variants'][number]): ProductVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    name: variant.name,
    price: variant.price,
    cost: variant.cost ?? 0,
    stock: variant.stock,
    reserved: variant.reserved,
    durationMinutes: variant.duration_minutes ?? 0,
    capacity: variant.capacity ?? 0,
    deliveryMode: variant.delivery_mode ?? 'not_applicable',
    metadata: variant.metadata ?? {},
  };
}

function mapApiProductToUi(product: ProductApiItem): Product {
  return {
    id: product.id,
    title: product.title,
    brand: product.brand,
    category: product.category,
    offerType: product.offer_type,
    priceType: product.price_type,
    serviceMode: product.service_mode ?? 'not_applicable',
    requiresBooking: product.requires_booking ?? false,
    requiresShipping: product.requires_shipping ?? true,
    serviceDurationMinutes: product.service_duration_minutes ?? 0,
    capacity: product.capacity ?? 0,
    fulfillmentNotes: product.fulfillment_notes ?? '',
    attributes: product.attributes ?? {},
    status: product.status,
    images: product.images ?? [],
    tags: product.tags ?? [],
    updatedAt: product.updated_at,
    variants: product.variants.map(mapApiVariantToUi),
  };
}

function mapUiVariantToPayload(variant: ProductVariant): ProductVariantPayload {
  return {
    id: variant.id.startsWith('v-') ? undefined : variant.id,
    sku: variant.sku,
    name: variant.name,
    price: variant.price,
    cost: variant.cost,
    stock: variant.stock,
    reserved: variant.reserved,
    duration_minutes: variant.durationMinutes,
    capacity: variant.capacity,
    delivery_mode: variant.deliveryMode,
    metadata: variant.metadata ?? {},
  };
}

function mapUiProductToPayload(product: Product): ProductPayload {
  return {
    title: product.title,
    brand: product.brand,
    category: product.category,
    description: '',
    offer_type: product.offerType,
    price_type: product.priceType,
    service_mode: product.serviceMode,
    requires_booking: product.requiresBooking,
    requires_shipping: product.requiresShipping,
    service_duration_minutes: product.serviceDurationMinutes,
    capacity: product.capacity,
    fulfillment_notes: product.fulfillmentNotes,
    attributes: product.attributes ?? {},
    images: product.images.slice(0, 5),
    tags: product.tags,
    status: product.status,
    is_active: product.status !== 'archived',
    variants: product.variants.map(mapUiVariantToPayload),
  };
}

function getPromotion(product: Product): {
  title?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  active?: boolean;
} {
  return (product.attributes?.promotion as {
    title?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    active?: boolean;
  } | undefined) ?? {};
}

function setPromotion(product: Product, patch: Record<string, unknown>): Product {
  const currentPromotion = getPromotion(product);
  return {
    ...product,
    attributes: {
      ...(product.attributes ?? {}),
      promotion: {
        ...currentPromotion,
        ...patch,
      },
    },
  };
}

function formatPromotionLabel(product: Product) {
  const promotion = getPromotion(product);
  if (!promotion.active || !promotion.value) return '';
  if (promotion.type === 'fixed') {
    return `-$${promotion.value.toLocaleString('es-CO')}`;
  }
  return `-${promotion.value}%`;
}

interface OfferEditorProps {
  product: Product;
  categories: string[];
  onClose: () => void;
  onSave: (product: Product) => void;
}

function OfferEditor({ product, categories, onClose, onSave }: OfferEditorProps) {
  const [draft, setDraft] = useState<Product>(product);
  const [tagsInput, setTagsInput] = useState(product.tags.join(', '));
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const checklist = getEditorChecklist(draft.offerType);

  function appendImage(imageUrl: string) {
    setDraft((prev) => {
      if (prev.images.length >= 5) return prev;
      return { ...prev, images: [...prev.images, imageUrl].slice(0, 5) };
    });
  }

  function updateImage(index: number, imageUrl: string) {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.map((item, currentIndex) => (currentIndex === index ? imageUrl : item)),
    }));
  }

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = Math.max(0, 5 - draft.images.length);
    files.slice(0, remaining).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result as string);
        setCropIndex(draft.images.length + index);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function handleImageUrlAdd() {
    const nextUrl = window.prompt('URL de la imagen:', '');
    if (!nextUrl) return;
    const normalized = nextUrl.trim();
    if (!normalized) return;
    appendImage(normalized);
  }

  function removeImage(index: number) {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function makeImagePrimary(index: number) {
    setDraft((prev) => {
      const target = prev.images[index];
      if (!target) return prev;
      return {
        ...prev,
        images: [target, ...prev.images.filter((_, currentIndex) => currentIndex !== index)],
      };
    });
  }

  function openExistingImageCrop(index: number) {
    const src = draft.images[index];
    if (!src) return;
    setCropSrc(src);
    setCropIndex(index);
  }

  function handleCropApply(croppedUrl: string) {
    if (cropIndex === null) return;
    if (cropIndex >= draft.images.length) {
      appendImage(croppedUrl);
    } else {
      updateImage(cropIndex, croppedUrl);
    }
    setCropSrc(null);
    setCropIndex(null);
  }

  function handleCropCancel() {
    setCropSrc(null);
    setCropIndex(null);
  }

  function setOfferType(nextType: OfferType) {
    setDraft((prev) => ({
      ...prev,
      offerType: nextType,
      serviceMode: nextType === 'physical' ? 'not_applicable' : prev.serviceMode === 'not_applicable' ? 'remote' : prev.serviceMode,
      requiresBooking: nextType !== 'physical',
      requiresShipping: nextType !== 'service',
      serviceDurationMinutes: nextType === 'physical' ? 0 : Math.max(prev.serviceDurationMinutes, 30),
      capacity: nextType === 'physical' ? 0 : Math.max(prev.capacity, 1),
      variants: prev.variants.map((variant) => ({
        ...variant,
        stock: nextType === 'service' ? 0 : variant.stock,
        reserved: nextType === 'service' ? 0 : variant.reserved,
        durationMinutes: nextType === 'physical' ? 0 : Math.max(variant.durationMinutes, 30),
        capacity: nextType === 'physical' ? 0 : Math.max(variant.capacity, 1),
        deliveryMode: nextType === 'physical' ? 'not_applicable' : variant.deliveryMode === 'not_applicable' ? 'remote' : variant.deliveryMode,
      })),
    }));
  }

  function updateVariant(idx: number, patch: Partial<ProductVariant>) {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, index) => (index === idx ? { ...variant, ...patch } : variant)),
    }));
  }

  function removeVariant(idx: number) {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, index) => index !== idx),
    }));
  }

  const isValid =
    draft.title.trim().length > 0 &&
    draft.category.trim().length > 0 &&
    draft.variants.length > 0 &&
    draft.variants.every((variant) => variant.name.trim().length > 0 && variant.sku.trim().length > 0);

  function handleSave() {
    onSave({
      ...draft,
      tags: tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    });
  }

  function handleCreateCategory() {
    const nextCategory = window.prompt('Nueva categoria:', draft.category || '');
    if (!nextCategory) return;
    const value = nextCategory.trim();
    if (!value) return;
    setDraft((prev) => ({ ...prev, category: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1" style={{ background: "rgba(17,17,16,0.40)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="h-full w-full max-w-3xl overflow-y-auto p-4 sm:p-6" style={{ borderLeft: '1px solid rgba(17,17,16,0.08)', background: '#f5f4ef' }}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[15px] font-bold text-ink-900" style={{ letterSpacing: '-0.01em' }}>
              {product.title ? 'Editar oferta comercial' : 'Crear oferta comercial'}
            </p>
            <p className="text-[12px] text-ink-400">Configura si vendes un físico, un servicio o una propuesta híbrida.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-ink-400 hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-700 text-lg leading-none">×</button>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-3 text-[12px] font-semibold uppercase text-ink-500" style={{ letterSpacing: '0.12em' }}>Tipo de oferta</p>
            <div className="grid gap-2.5 md:grid-cols-3">
              {(['physical', 'service', 'hybrid'] as OfferType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setOfferType(type)}
                  className={`rounded-2xl border p-3 text-left transition-all duration-150 ${
                    draft.offerType === type
                      ? 'border-brand-300/60 bg-brand-50/60 shadow-card'
                      : 'border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.02)] hover:bg-white/50'
                  }`}
                >
                  <p className="text-[13px] font-semibold text-ink-800">{getOfferTypeLabel(type)}</p>
                  <p className="mt-1 text-[11px] text-ink-400">{getOfferTypeDescription(type)}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-2xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.02)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Tag text={getOfferTypeLabel(draft.offerType)} color={getOfferTypeBadge(draft.offerType)} />
                <Tag text={getPriceTypeLabel(draft.priceType)} color="bg-ink-100/60 text-ink-500" />
                {draft.requiresBooking && <Tag text="Requiere agenda" color="bg-violet-100/70 text-violet-600" />}
                {draft.requiresShipping && <Tag text="Requiere despacho" color="bg-sky-100/70 text-sky-600" />}
              </div>
              <p className="mt-2.5 text-[12px] text-ink-600">{getOfferTypeDescription(draft.offerType)}</p>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {checklist.map((item) => (
                  <div key={item} className="rounded-xl border border-[rgba(17,17,16,0.06)] bg-white/60 px-3 py-2 text-[11px] font-semibold text-ink-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="mb-3 text-[12px] font-semibold uppercase text-ink-500" style={{ letterSpacing: '0.12em' }}>Información general</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-[11px] font-medium text-ink-500">
                Nombre comercial
                <input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
              </label>
              <label className="space-y-1 text-[11px] font-medium text-ink-500">
                Marca o área
                <input value={draft.brand} onChange={(e) => setDraft((prev) => ({ ...prev, brand: e.target.value }))} className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
              </label>
              <label className="space-y-1 text-[11px] font-medium text-ink-500">
                Categoría
                <div className="flex gap-2">
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none"
                  >
                    <option value="">Selecciona una categoria</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <Button type="button" variant="secondary" onClick={handleCreateCategory}>
                    Nueva
                  </Button>
                </div>
              </label>
              <label className="space-y-1 text-[11px] font-medium text-ink-500">
                Modelo de precio
                <select
                  value={draft.priceType}
                  onChange={(e) => setDraft((prev) => ({ ...prev, priceType: e.target.value as PriceType }))}
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none"
                >
                  <option value="fixed">Precio fijo</option>
                  <option value="variable">Precio variable</option>
                  <option value="quote_required">Cotización requerida</option>
                </select>
                <p className="text-[11px] text-ink-400">
                  {draft.priceType === 'fixed' && 'El cliente ve un valor cerrado.'}
                  {draft.priceType === 'variable' && 'El valor puede cambiar según plan o alcance.'}
                  {draft.priceType === 'quote_required' && 'La venta pasa primero por propuesta comercial.'}
                </p>
              </label>
            </div>
            <label className="mt-3 block space-y-1 text-xs text-ink-600">
              Etiquetas
              <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="corporativo, onboarding, bestseller" className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
            </label>
            <div className="mt-4 rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-4">
              <p className="text-sm font-semibold text-ink-900">Promocion o descuento</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-ink-600">
                  Titulo promocional
                  <input
                    value={getPromotion(draft).title ?? ''}
                    onChange={(e) => setDraft((prev) => setPromotion(prev, { title: e.target.value }))}
                    placeholder="Oferta de lanzamiento"
                    className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                  />
                </label>
                <label className="space-y-1 text-xs text-ink-600">
                  Tipo
                  <select
                    value={getPromotion(draft).type ?? 'percentage'}
                    onChange={(e) => setDraft((prev) => setPromotion(prev, { type: e.target.value }))}
                    className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                  >
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed">Valor fijo</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs text-ink-600">
                  Valor
                  <input
                    type="number"
                    min={0}
                    value={getPromotion(draft).value ?? 0}
                    onChange={(e) => setDraft((prev) => setPromotion(prev, { value: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={Boolean(getPromotion(draft).active)}
                    onChange={(e) => setDraft((prev) => setPromotion(prev, { active: e.target.checked }))}
                  />
                  Promocion activa
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {draft.offerType === 'physical' && 'Logística física'}
                  {draft.offerType === 'service' && 'Prestación del servicio'}
                  {draft.offerType === 'hybrid' && 'Prestación y logística'}
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  {draft.offerType === 'physical' && 'Solo verás campos de despacho y estado del producto.'}
                  {draft.offerType === 'service' && 'Solo verás campos de agenda, modalidad y capacidad.'}
                  {draft.offerType === 'hybrid' && 'Aquí defines qué parte se agenda y qué parte se entrega físicamente.'}
                </p>
              </div>
              <label className="space-y-1 text-xs text-ink-600 min-w-[150px]">
                Estado
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as Product['status'] }))}
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                >
                  <option value="active">Activo</option>
                  <option value="draft">Borrador</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
            </div>

            {draft.offerType === 'physical' && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center justify-between rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm text-ink-700">
                    Requiere despacho
                    <input type="checkbox" checked={draft.requiresShipping} onChange={(e) => setDraft((prev) => ({ ...prev, requiresShipping: e.target.checked }))} />
                  </label>
                  <div className="rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm text-ink-700">
                    <p className="font-semibold text-ink-900">Qué vas a gestionar</p>
                    <p className="mt-1 text-xs text-ink-400">Stock, reservados, reposición y entrega.</p>
                  </div>
                </div>
                <label className="block space-y-1 text-xs text-ink-600">
                  Notas logísticas
                  <textarea value={draft.fulfillmentNotes} onChange={(e) => setDraft((prev) => ({ ...prev, fulfillmentNotes: e.target.value }))} rows={3} placeholder="Bodega central, entrega en 24h, retiro en tienda..." className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                </label>
              </div>
            )}

            {draft.offerType === 'service' && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs text-ink-600">
                    Modalidad del servicio
                    <select
                      value={draft.serviceMode}
                      onChange={(e) => setDraft((prev) => ({ ...prev, serviceMode: e.target.value as ServiceMode }))}
                      className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                    >
                      <option value="remote">Remoto</option>
                      <option value="onsite">Presencial</option>
                      <option value="hybrid">Híbrido</option>
                    </select>
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm text-ink-700">
                    Requiere agenda
                    <input type="checkbox" checked={draft.requiresBooking} onChange={(e) => setDraft((prev) => ({ ...prev, requiresBooking: e.target.checked }))} />
                  </label>
                  <label className="space-y-1 text-xs text-ink-600">
                    Duración base (min)
                    <input
                      type="number"
                      min={0}
                      value={draft.serviceDurationMinutes}
                      onChange={(e) => setDraft((prev) => ({ ...prev, serviceDurationMinutes: Number(e.target.value) }))}
                      className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-ink-600">
                    Capacidad simultánea
                    <input
                      type="number"
                      min={0}
                      value={draft.capacity}
                      onChange={(e) => setDraft((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                      className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                    />
                  </label>
                </div>
                <label className="block space-y-1 text-xs text-ink-600">
                  Notas de prestación
                  <textarea value={draft.fulfillmentNotes} onChange={(e) => setDraft((prev) => ({ ...prev, fulfillmentNotes: e.target.value }))} rows={3} placeholder="Incluye videollamada, asesor asignado, confirmación previa..." className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                </label>
              </div>
            )}

            {draft.offerType === 'hybrid' && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs text-ink-600">
                    Modalidad de prestación
                    <select
                      value={draft.serviceMode}
                      onChange={(e) => setDraft((prev) => ({ ...prev, serviceMode: e.target.value as ServiceMode }))}
                      className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                    >
                      <option value="remote">Remoto</option>
                      <option value="onsite">Presencial</option>
                      <option value="hybrid">Híbrido</option>
                    </select>
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm text-ink-700">
                    Requiere agenda
                    <input type="checkbox" checked={draft.requiresBooking} onChange={(e) => setDraft((prev) => ({ ...prev, requiresBooking: e.target.checked }))} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm text-ink-700">
                    Requiere despacho
                    <input type="checkbox" checked={draft.requiresShipping} onChange={(e) => setDraft((prev) => ({ ...prev, requiresShipping: e.target.checked }))} />
                  </label>
                  <div className="rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm text-ink-700">
                    <p className="font-semibold text-ink-900">Qué vas a coordinar</p>
                    <p className="mt-1 text-xs text-ink-400">Inventario físico + agenda + entrega del servicio.</p>
                  </div>
                  <label className="space-y-1 text-xs text-ink-600">
                    Duración base (min)
                    <input
                      type="number"
                      min={0}
                      value={draft.serviceDurationMinutes}
                      onChange={(e) => setDraft((prev) => ({ ...prev, serviceDurationMinutes: Number(e.target.value) }))}
                      className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-ink-600">
                    Capacidad simultánea
                    <input
                      type="number"
                      min={0}
                      value={draft.capacity}
                      onChange={(e) => setDraft((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                      className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                    />
                  </label>
                </div>
                <label className="block space-y-1 text-xs text-ink-600">
                  Notas operativas combinadas
                  <textarea value={draft.fulfillmentNotes} onChange={(e) => setDraft((prev) => ({ ...prev, fulfillmentNotes: e.target.value }))} rows={3} placeholder="Enviar kit antes de la sesión, instalación en sede, activación remota..." className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                </label>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">Galeria del producto</p>
                <p className="mt-1 text-xs text-ink-400">Hasta 5 imagenes. La primera se usa como principal en catalogo y ficha.</p>
              </div>
              <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-2.5 py-1 text-[10px] font-semibold text-ink-500">
                {draft.images.length}/5
              </span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => {
                  const image = draft.images[index];
                  const isPrimary = index === 0 && Boolean(image);
                  return (
                    <div key={index} className="space-y-2">
                      <div className="relative h-[120px] overflow-hidden rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)]">
                        {image ? (
                          <img src={image} alt={`${draft.title || 'producto'} ${index + 1}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-ink-400">
                            {index === 0 ? 'Portada principal' : 'Imagen opcional'}
                          </div>
                        )}
                        {isPrimary ? (
                          <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-1 text-[9px] font-semibold text-white">Principal</span>
                        ) : null}
                      </div>
                      {image ? (
                        <div className="grid gap-1">
                          <button onClick={() => openExistingImageCrop(index)} className="rounded-full border border-[rgba(17,17,16,0.12)] bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-ink-700 transition hover:bg-white">
                            Recortar
                          </button>
                          {!isPrimary ? (
                            <button onClick={() => makeImagePrimary(index)} className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-[10px] font-semibold text-brand-700 transition hover:bg-brand-100">
                              Hacer principal
                            </button>
                          ) : null}
                          <button onClick={() => removeImage(index)} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold text-red-700 transition hover:bg-red-100">
                            Eliminar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[rgba(17,17,16,0.12)] px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-[rgba(17,17,16,0.025)]">
                  <ImagePlus size={14} />
                  Subir imagenes
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
                <button onClick={handleImageUrlAdd} className="inline-flex items-center gap-2 rounded-lg border border-[rgba(17,17,16,0.12)] px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-[rgba(17,17,16,0.025)]">
                  <Plus size={14} />
                  Agregar por URL
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">{getVariantBlockTitle(draft.offerType)}</p>
                <p className="mt-1 text-xs text-ink-400">{getVariantBlockDescription(draft.offerType)}</p>
              </div>
              <button onClick={() => setDraft((prev) => ({ ...prev, variants: [...prev.variants, newVariant(prev.offerType)] }))} className="rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-200">
                + Agregar
              </button>
            </div>
            <div className="space-y-3">
              {draft.variants.map((variant, idx) => (
                <div key={variant.id} className="rounded-xl border border-[rgba(17,17,16,0.09)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink-700">
                      {draft.offerType === 'physical' && `Variante #${idx + 1}`}
                      {draft.offerType === 'service' && `Plan #${idx + 1}`}
                      {draft.offerType === 'hybrid' && `Paquete #${idx + 1}`}
                    </p>
                    {draft.variants.length > 1 && (
                      <button onClick={() => removeVariant(idx)} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="space-y-1 text-[11px] font-medium text-ink-500">
                      {getVariantNameLabel(draft.offerType)}
                      <input value={variant.name} onChange={(e) => updateVariant(idx, { name: e.target.value })} placeholder={getVariantNamePlaceholder(draft.offerType)} className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-ink-500">
                      SKU interno
                      <input value={variant.sku} onChange={(e) => updateVariant(idx, { sku: e.target.value })} placeholder="ASE-SUB-REM-45" className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-ink-500">
                      Precio
                      <input type="number" min={0} value={variant.price} onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })} placeholder="85000" className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                    </label>
                    <label className="space-y-1 text-[11px] font-medium text-ink-500">
                      Costo interno
                      <input type="number" min={0} value={variant.cost} onChange={(e) => updateVariant(idx, { cost: Number(e.target.value) })} placeholder="0" className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                    </label>
                    {draft.offerType !== 'service' && (
                      <>
                        <label className="space-y-1 text-[11px] font-medium text-ink-500">
                          Stock disponible
                          <input type="number" min={0} value={variant.stock} onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })} placeholder="10" className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                        </label>
                        <label className="space-y-1 text-[11px] font-medium text-ink-500">
                          Unidades reservadas
                          <input type="number" min={0} value={variant.reserved} onChange={(e) => updateVariant(idx, { reserved: Number(e.target.value) })} placeholder="2" className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                        </label>
                      </>
                    )}
                    {draft.offerType !== 'physical' && (
                      <>
                        <label className="space-y-1 text-[11px] font-medium text-ink-500">
                          Duración (min)
                          <input type="number" min={0} value={variant.durationMinutes} onChange={(e) => updateVariant(idx, { durationMinutes: Number(e.target.value) })} placeholder="45" className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                        </label>
                        <label className="space-y-1 text-[11px] font-medium text-ink-500">
                          Capacidad o cupos
                          <input type="number" min={0} value={variant.capacity} onChange={(e) => updateVariant(idx, { capacity: Number(e.target.value) })} placeholder="8" className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400" />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="sticky bottom-0 mt-5 flex items-center justify-end gap-2 pt-4" style={{ borderTop: '1px solid rgba(17,17,16,0.08)', background: '#f5f4ef' }}>
          <p className="mr-auto text-[11px] text-ink-400">
            {draft.offerType === 'physical' && 'Se guardará como producto físico listo para stock y despacho.'}
            {draft.offerType === 'service' && 'Se guardará como servicio listo para agenda y reservas.'}
            {draft.offerType === 'hybrid' && 'Se guardará como oferta híbrida con logística y prestación.'}
          </p>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={!isValid}>Guardar oferta</Button>
        </div>
      </div>
      {cropSrc ? (
        <CropModal
          src={cropSrc}
          aspect={4 / 5}
          shape="rect"
          title="Imagen del producto"
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      ) : null}
    </div>
  );
}

export function ProductsPage() {
  const { showError, showSuccess } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [offerType, setOfferType] = useState<'all' | OfferType>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set([...DEFAULT_CATEGORIES, ...products.map((product) => product.category).filter(Boolean)]))],
    [products]
  );
  const [category, setCategory] = useState<string>('all');

  const filteredProducts = products.filter((product) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      product.title.toLowerCase().includes(q) ||
      product.brand.toLowerCase().includes(q) ||
      product.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchesType = offerType === 'all' || product.offerType === offerType;
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesType && matchesCategory;
  });

  const summary = useMemo(() => ({
    physical: products.filter((product) => product.offerType === 'physical').length,
    service: products.filter((product) => product.offerType === 'service').length,
    hybrid: products.filter((product) => product.offerType === 'hybrid').length,
  }), [products]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      try {
        const data = await api.getProducts();
        if (!cancelled) {
          setProducts(data.map(mapApiProductToUi));
        }
      } catch (error) {
        if (!cancelled) {
          showError('Catalogo', error instanceof Error ? error.message : 'No se pudo cargar el catalogo.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  async function handleSaveProduct(product: Product) {
    try {
      const payload = mapUiProductToPayload(product);
      const isPersisted = !product.id.startsWith('offer-');
      const saved = isPersisted
        ? await api.updateProduct(product.id, payload)
        : await api.createProduct(payload);
      const next = mapApiProductToUi(saved);
      setProducts((prev) => {
        const exists = prev.some((item) => item.id === next.id);
        return exists ? prev.map((item) => (item.id === next.id ? next : item)) : [next, ...prev];
      });
      setSelectedProduct(null);
      showSuccess('Oferta guardada');
    } catch (error) {
      showError('Catalogo', error instanceof Error ? error.message : 'No se pudo guardar la oferta.');
    }
  }

  async function handleDeleteProduct(id: string) {
    try {
      if (!id.startsWith('offer-')) {
        await api.deleteProduct(id);
      }
      setProducts((prev) => prev.filter((product) => product.id !== id));
      showSuccess('Oferta eliminada');
    } catch (error) {
      showError('Catalogo', error instanceof Error ? error.message : 'No se pudo eliminar la oferta.');
    }
  }

  return (
    <div className="page-shell overflow-hidden">
      <div className="page-stack overflow-hidden">
        <PageHeader
          eyebrow="Catalogo comercial"
          title="Catálogo comercial"
          description="Gestiona productos físicos, servicios y ofertas híbridas sin mezclar la operación de cada uno."
          actions={
            <Button variant="primary" onClick={() => setSelectedProduct(newOffer())}>
              <Plus size={14} /> Nueva oferta
            </Button>
          }
        />

        {loading ? (
          <Card className="shrink-0 p-4 text-[13px] text-ink-400">Cargando catalogo...</Card>
        ) : null}

        <div className="grid shrink-0 gap-3 md:grid-cols-3">
          {[
            { label: 'Físicos', value: summary.physical, tone: 'bg-sky-100/70 text-sky-600', icon: Package },
            { label: 'Servicios', value: summary.service, tone: 'bg-violet-100/70 text-violet-600', icon: CalendarClock },
            { label: 'Híbridos', value: summary.hybrid, tone: 'bg-amber-100/70 text-amber-600', icon: Wrench },
          ].map((item) => (
            <Card key={item.label} className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-ink-400">{item.label}</p>
                <div className={`rounded-lg p-1.5 ${item.tone}`}>
                  <item.icon size={14} />
                </div>
              </div>
              <p className="mt-1.5 text-[24px] font-bold text-ink-900">{item.value}</p>
            </Card>
          ))}
        </div>

        <Card className="shrink-0 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-semibold text-ink-700">Filtrar catálogo</p>
            <p className="rounded-full bg-[rgba(17,17,16,0.05)] px-2.5 py-1 text-[10px] font-semibold text-ink-500">{filteredProducts.length} de {products.length}</p>
          </div>
          <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1.5fr)_150px_170px_auto]">
            <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2">
              <Search size={13} className="text-ink-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, marca o tag..." className="w-full bg-transparent text-[13px] text-ink-700 outline-none placeholder:text-ink-300" />
            </div>
            <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/80 px-3 py-2">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Tipo</span>
              <select
                value={offerType}
                onChange={(e) => setOfferType(e.target.value as 'all' | OfferType)}
                className="w-full bg-transparent text-[12px] font-medium text-ink-700 outline-none"
              >
                <option value="all">Todos</option>
                <option value="physical">{getOfferTypeLabel('physical')}</option>
                <option value="service">{getOfferTypeLabel('service')}</option>
                <option value="hybrid">{getOfferTypeLabel('hybrid')}</option>
              </select>
            </label>
            <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/80 px-3 py-2">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Categoría</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-[12px] font-medium text-ink-700 outline-none"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === 'all' ? 'Todas' : item}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                setSearch('');
                setOfferType('all');
                setCategory('all');
              }}
              className="rounded-full border border-[rgba(17,17,16,0.08)] px-3 py-2 text-[11px] font-semibold text-ink-500 transition hover:bg-[rgba(17,17,16,0.04)]"
            >
              Limpiar
            </button>
          </div>
          <div className="hidden mt-3 grid gap-2 lg:grid-cols-[minmax(0,1.35fr)_190px_210px]">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2">
              <Search size={13} className="text-ink-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, marca o tag..." className="w-full bg-transparent text-[13px] text-ink-700 outline-none placeholder:text-ink-300" />
            </div>
            <label className="flex min-w-0 flex-col gap-1 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/80 px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Tipo</span>
              <select
                value={offerType}
                onChange={(e) => setOfferType(e.target.value as 'all' | OfferType)}
                className="w-full bg-transparent text-[13px] font-medium text-ink-700 outline-none"
              >
                <option value="all">Todos</option>
                <option value="physical">{getOfferTypeLabel('physical')}</option>
                <option value="service">{getOfferTypeLabel('service')}</option>
                <option value="hybrid">{getOfferTypeLabel('hybrid')}</option>
              </select>
            </label>
            <div className="hidden flex-wrap gap-1.5">
              {(['all', 'physical', 'service', 'hybrid'] as Array<'all' | OfferType>).map((type) => (
                <button
                  key={type}
                  onClick={() => setOfferType(type)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                    offerType === type ? 'bg-brand-500 text-white shadow-card' : 'bg-[rgba(17,17,16,0.05)] text-ink-600 hover:bg-[rgba(17,17,16,0.08)]'
                  }`}
                >
                  {type === 'all' ? 'Todos' : getOfferTypeLabel(type)}
                </button>
              ))}
            </div>
            <label className="flex min-w-0 flex-col gap-1 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/80 px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Categoria</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-[13px] font-medium text-ink-700 outline-none"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === 'all' ? 'Todas las categorÃ­as' : item}
                  </option>
                ))}
              </select>
            </label>
            <div className="hidden flex-wrap gap-1.5">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${
                    category === item ? 'bg-ink-800 text-white' : 'bg-[rgba(17,17,16,0.05)] text-ink-600 hover:bg-[rgba(17,17,16,0.08)]'
                  }`}
                >
                  {item === 'all' ? 'Todas las categorías' : item}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-[92px_1fr]">
                <div className="h-[128px] rounded-l-3xl sm:h-full sm:min-h-[128px]" style={{ background: 'rgba(17,17,16,0.05)' }}>
                  {product.images[0] ? <img src={product.images[0]} alt={product.title} className="h-full w-full rounded-l-3xl object-cover" /> : null}
                </div>
                <div className="space-y-2.5 p-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <Tag text={getOfferTypeLabel(product.offerType)} color={getOfferTypeBadge(product.offerType)} />
                    <Tag text={getPriceTypeLabel(product.priceType)} color="bg-ink-100/60 text-ink-500" />
                    {formatPromotionLabel(product) ? <Tag text={formatPromotionLabel(product)} color="bg-brand-100/70 text-brand-700" /> : null}
                    {product.requiresBooking && <Tag text="Agenda" color="bg-violet-50/80 text-violet-600" />}
                    {product.requiresShipping && <Tag text="Despacho" color="bg-sky-50/80 text-sky-600" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ink-900" style={{ letterSpacing: '-0.01em' }}>{product.title}</p>
                    <p className="text-[12px] text-ink-400">{product.brand} · {product.category}</p>
                  </div>
                  <p className="line-clamp-2 text-[11px] text-ink-500">{product.fulfillmentNotes}</p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] px-2.5 py-2">
                      <p className="lab-stat-label">Operación</p>
                      <p className="mt-0.5 text-[12px] font-bold text-ink-800">
                        {product.offerType === 'physical' && `${getProductAvailableUnits(product)} und disponibles`}
                        {product.offerType === 'service' && `${product.capacity} cupos por bloque`}
                        {product.offerType === 'hybrid' && `${getProductAvailableUnits(product)} kits + ${product.capacity} cupos`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] px-2.5 py-2">
                      <p className="lab-stat-label">Precio base</p>
                      <p className="mt-0.5 text-[12px] font-bold text-ink-800">{formatCop(product.variants[0]?.price ?? 0)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1">
                      {product.tags.slice(0, 3).map((tag) => <Tag key={tag} text={tag} color="bg-ink-100/60 text-ink-500" />)}
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button onClick={() => setSelectedProduct(product)} className="rounded-xl border border-[rgba(17,17,16,0.08)] p-1.5 text-ink-400 transition hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-700">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setProducts((prev) => [copyOffer(product), ...prev]);
                          showSuccess('Oferta duplicada');
                        }}
                        className="rounded-xl border border-[rgba(17,17,16,0.08)] p-1.5 text-ink-400 transition hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-700"
                      >
                        <Package size={13} />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="rounded-xl border border-red-200/60 p-1.5 text-red-400 transition hover:bg-red-50/60">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          </div>
        </div>
      </div>

      {selectedProduct && (
        <OfferEditor
          product={selectedProduct}
          categories={categories.filter((item) => item !== 'all')}
          onClose={() => setSelectedProduct(null)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}
