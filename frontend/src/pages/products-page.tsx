import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CalendarClock, Copy, ImagePlus, Loader2, Package, Pencil, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { getProductAvailableUnits } from '../data/ecommerce';
import { Button, Card, Tag } from '../components/ui/primitives';
import { PageHeader } from '../components/ui/page-header';
import { CropModal } from '../components/ui/crop-modal';
import type { OfferType, PriceType, Product, ProductVariant } from '../types';
import { api } from '../services/api';
import type { ProductApiItem, ProductPayload, ProductVariantPayload } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

/* ─── helpers ─── */

const CURRENCIES = [
  { code: 'COP', label: 'COP — Peso colombiano' },
  { code: 'USD', label: 'USD — Dólar estadounidense' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'MXN', label: 'MXN — Peso mexicano' },
  { code: 'BRL', label: 'BRL — Real brasileño' },
  { code: 'ARS', label: 'ARS — Peso argentino' },
  { code: 'CLP', label: 'CLP — Peso chileno' },
  { code: 'PEN', label: 'PEN — Sol peruano' },
  { code: 'VES', label: 'VES — Bolívar venezolano' },
  { code: 'GBP', label: 'GBP — Libra esterlina' },
];

function getCurrency(product: Product): string {
  return (product.attributes?.currency as string) || 'COP';
}

function formatPrice(value: number, currency = 'COP') {
  if (value <= 0) return 'A cotizar';
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: ['COP', 'CLP', 'ARS'].includes(currency) ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString('es-CO')} ${currency}`;
  }
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

function newVariant(): ProductVariant {
  return {
    id: `v-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    sku: '',
    name: '',
    price: 0,
    cost: 0,
    stock: 0,
    reserved: 0,
    durationMinutes: 0,
    capacity: 0,
    deliveryMode: 'not_applicable',
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
    variants: [newVariant()],
  };
}

const DEFAULT_CATEGORIES = [
  'Ropa', 'Calzado', 'Accesorios', 'Belleza', 'Cuidado personal',
  'Hogar', 'Tecnologia', 'Mascotas', 'Salud y bienestar',
  'Alimentos y bebidas', 'Servicios', 'Suscripciones',
];

const QUICK_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

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

function getPromotion(product: Product) {
  return (product.attributes?.promotion as {
    title?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    active?: boolean;
  } | undefined) ?? {};
}

function setPromotion(product: Product, patch: Record<string, unknown>): Product {
  return {
    ...product,
    attributes: { ...(product.attributes ?? {}), promotion: { ...getPromotion(product), ...patch } },
  };
}

function formatPromotionLabel(product: Product) {
  const promo = getPromotion(product);
  if (!promo.active || !promo.value) return '';
  return promo.type === 'fixed' ? `-$${promo.value.toLocaleString('es-CO')}` : `-${promo.value}%`;
}

/* ─── Toggle switch ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? 'bg-brand-500' : 'bg-[rgba(17,17,16,0.15)]'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 translate-y-0 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

/* ─── OfferEditor ─── */
interface OfferEditorProps {
  product: Product;
  categories: string[];
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
}

function OfferEditor({ product, categories, onClose, onSave }: OfferEditorProps) {
  const [draft, setDraft] = useState<Product>(product);
  const [tagsInput, setTagsInput] = useState(product.tags.join(', '));
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);

  const promo = getPromotion(draft);

  function appendImage(url: string) {
    setDraft((prev) => ({ ...prev, images: [...prev.images, url].slice(0, 5) }));
  }

  function updateImage(index: number, url: string) {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.map((item, i) => (i === index ? url : item)),
    }));
  }

  function handleSlotClick(index: number) {
    if (draft.images[index]) return; // filled slot — actions are shown separately
    setPendingSlot(index);
    imageInputRef.current?.click();
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || pendingSlot === null) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropIndex(pendingSlot);
      setPendingSlot(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeImage(index: number) {
    setDraft((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }

  function makeImagePrimary(index: number) {
    setDraft((prev) => {
      const target = prev.images[index];
      if (!target) return prev;
      return { ...prev, images: [target, ...prev.images.filter((_, i) => i !== index)] };
    });
  }

  function openExistingImageCrop(index: number) {
    const src = draft.images[index];
    if (!src) return;
    setCropSrc(src);
    setCropIndex(index);
  }

  async function handleCropApply(croppedFile: File) {
    if (cropIndex === null) return;
    setUploadingImage(true);
    try {
      const uploaded = await api.uploadProductImage(croppedFile);
      if (cropIndex >= draft.images.length) appendImage(uploaded.url);
      else updateImage(cropIndex, uploaded.url);
      setCropSrc(null);
      setCropIndex(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  }

  function handleCropCancel() {
    setCropSrc(null);
    setCropIndex(null);
  }

  function updateVariant(idx: number, patch: Partial<ProductVariant>) {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    }));
  }

  function removeVariant(idx: number) {
    setDraft((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  }

  function copyVariant(idx: number) {
    const original = draft.variants[idx];
    if (!original) return;
    const cloned: ProductVariant = {
      ...original,
      id: `v-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      sku: original.sku ? `${original.sku}-2` : '',
    };
    setDraft((prev) => ({
      ...prev,
      variants: [...prev.variants.slice(0, idx + 1), cloned, ...prev.variants.slice(idx + 1)],
    }));
  }

  function addQuickVariant(size: string) {
    const slug = (draft.title || 'PRD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const v: ProductVariant = {
      ...newVariant(),
      name: size,
      sku: `${slug}-${size.replace(/\s+/g, '')}-${Date.now().toString().slice(-3)}`,
    };
    setDraft((prev) => ({ ...prev, variants: [...prev.variants, v] }));
  }

  function handleCreateCategory() {
    const next = window.prompt('Nueva categoría:', draft.category || '');
    if (!next) return;
    const val = next.trim();
    if (val) setDraft((prev) => ({ ...prev, category: val }));
  }

  const isValid =
    draft.title.trim().length > 0 &&
    draft.category.trim().length > 0 &&
    draft.variants.length > 0 &&
    draft.variants.every((v) => v.name.trim().length > 0 && v.sku.trim().length > 0);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        ...draft,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
    }
  }

  const INPUT = 'w-full rounded-xl border border-[rgba(17,17,16,0.10)] bg-white px-3 py-2.5 text-[13px] text-ink-800 outline-none focus:border-brand-400 transition';
  const LABEL = 'block space-y-1.5 text-[11px] font-semibold text-ink-500';

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div
        className="flex-1"
        style={{ background: 'rgba(17,17,16,0.40)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* drawer */}
      <div
        className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden"
        style={{ borderLeft: '1px solid rgba(17,17,16,0.08)', background: '#f5f4ef' }}
      >
        {/* header */}
        <div className="shrink-0 flex items-center justify-between border-b border-[rgba(17,17,16,0.08)] px-5 py-4">
          <div>
            <p className="text-[15px] font-bold text-ink-900" style={{ letterSpacing: '-0.01em' }}>
              {product.title ? 'Editar producto' : 'Nuevo producto'}
            </p>
            <p className="text-[12px] text-ink-400">Completa la información para publicarlo en tu catálogo.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-400 hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-700 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4 pb-24">

            {/* ── Card 1: Información del producto ── */}
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[13px] font-bold text-ink-900">Información del producto</p>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as Product['status'] }))}
                  className="rounded-full border border-[rgba(17,17,16,0.10)] bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-700 outline-none"
                >
                  <option value="active">Activo</option>
                  <option value="draft">Borrador</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className={LABEL}>
                  Nombre del producto
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej: Camiseta Oversized Negra"
                    className={INPUT}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={LABEL}>
                    Marca
                    <input
                      value={draft.brand}
                      onChange={(e) => setDraft((prev) => ({ ...prev, brand: e.target.value }))}
                      placeholder="Ej: Nike, propia, sin marca"
                      className={INPUT}
                    />
                  </label>

                  <label className={LABEL}>
                    Categoría
                    <div className="flex gap-2">
                      <select
                        value={draft.category}
                        onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                        className={INPUT}
                      >
                        <option value="">Selecciona</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="shrink-0 rounded-xl border border-[rgba(17,17,16,0.10)] bg-white px-3 text-[11px] font-semibold text-ink-600 hover:bg-[rgba(17,17,16,0.04)]"
                      >
                        + Nueva
                      </button>
                    </div>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className={LABEL}>
                    Modelo de precio
                    <select
                      value={draft.priceType}
                      onChange={(e) => setDraft((prev) => ({ ...prev, priceType: e.target.value as PriceType }))}
                      className={INPUT}
                    >
                      <option value="fixed">Precio fijo</option>
                      <option value="variable">Precio variable</option>
                      <option value="quote_required">Cotización requerida</option>
                    </select>
                    <span className="text-[10px] font-normal text-ink-400">
                      {draft.priceType === 'fixed' && 'El cliente ve un valor cerrado por variante.'}
                      {draft.priceType === 'variable' && 'El valor puede cambiar según el plan o alcance.'}
                      {draft.priceType === 'quote_required' && 'La venta pasa primero por propuesta comercial.'}
                    </span>
                  </label>

                  <label className={LABEL}>
                    Moneda
                    <select
                      value={getCurrency(draft)}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          attributes: { ...(prev.attributes ?? {}), currency: e.target.value },
                        }))
                      }
                      className={INPUT}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <span className="text-[10px] font-normal text-ink-400">
                      Se aplica a todas las variantes.
                    </span>
                  </label>

                  <label className={LABEL}>
                    Etiquetas
                    <input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="verano, bestseller, nuevo"
                      className={INPUT}
                    />
                    <span className="text-[10px] font-normal text-ink-400">Separadas por coma</span>
                  </label>
                </div>
              </div>
            </Card>

            {/* ── Card 2: Galería ── */}
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-ink-900">Galería de imágenes</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">Hasta 5 imágenes. La primera se usa como portada.</p>
                </div>
                <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-2.5 py-1 text-[10px] font-semibold text-ink-500">
                  {draft.images.length}/5
                </span>
              </div>

              {/* hidden file input */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />

              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => {
                  const image = draft.images[index];
                  const isPrimary = index === 0 && Boolean(image);
                  return (
                    <div key={index} className="flex flex-col gap-1.5">
                      {image ? (
                        /* Filled slot */
                        <div className="relative overflow-hidden rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)]" style={{ aspectRatio: '4/5' }}>
                          <img
                            src={image}
                            alt={`${draft.title || 'producto'} ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {isPrimary ? (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                              Portada
                            </span>
                          ) : null}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                            <button
                              onClick={() => openExistingImageCrop(index)}
                              className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-ink-800"
                            >
                              Recortar
                            </button>
                            {!isPrimary ? (
                              <button
                                onClick={() => makeImagePrimary(index)}
                                className="rounded-lg bg-brand-500/90 px-2 py-1 text-[10px] font-semibold text-white"
                              >
                                Principal
                              </button>
                            ) : null}
                            <button
                              onClick={() => removeImage(index)}
                              className="rounded-lg bg-red-500/90 px-2 py-1 text-[10px] font-semibold text-white"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Empty slot — click to upload */
                        <button
                          type="button"
                          onClick={() => handleSlotClick(index)}
                          disabled={draft.images.length >= 5 && index >= draft.images.length}
                          className="flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-[rgba(17,17,16,0.14)] bg-[rgba(17,17,16,0.02)] text-ink-400 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-500"
                          style={{ aspectRatio: '4/5' }}
                        >
                          <ImagePlus size={16} />
                          <span className="text-[9px] font-semibold leading-tight text-center px-1">
                            {index === 0 ? 'Portada' : 'Agregar'}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {uploadingImage ? (
                <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-400">
                  <Loader2 size={13} className="animate-spin" />
                  Subiendo imagen...
                </div>
              ) : null}
            </Card>

            {/* ── Card 3: Variantes ── */}
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-ink-900">Variantes del producto</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">Cada variante tiene su propio SKU, precio y stock.</p>
                </div>
                <button
                  onClick={() => setDraft((prev) => ({ ...prev, variants: [...prev.variants, newVariant()] }))}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-100"
                >
                  + Agregar
                </button>
              </div>

              <div className="space-y-3">
                {draft.variants.map((variant, idx) => (
                  <div key={variant.id} className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/60 p-3.5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-bold text-ink-600 uppercase tracking-wide">
                        Variante #{idx + 1}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyVariant(idx)}
                          title="Duplicar variante"
                          className="rounded-lg border border-[rgba(17,17,16,0.09)] p-1.5 text-ink-400 transition hover:bg-[rgba(17,17,16,0.05)] hover:text-ink-700"
                        >
                          <Copy size={12} />
                        </button>
                        {draft.variants.length > 1 ? (
                          <button
                            onClick={() => removeVariant(idx)}
                            className="rounded-lg border border-red-200/70 p-1.5 text-red-400 transition hover:bg-red-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <label className={LABEL}>
                        Nombre de la variante
                        <input
                          value={variant.name}
                          onChange={(e) => updateVariant(idx, { name: e.target.value })}
                          placeholder="Ej: Talla M / Negro"
                          className={INPUT}
                        />
                      </label>
                      <label className={LABEL}>
                        SKU interno
                        <input
                          value={variant.sku}
                          onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                          placeholder="CAM-M-NEG-001"
                          className={INPUT}
                        />
                      </label>
                      <label className={LABEL}>
                        Precio ({getCurrency(draft)})
                        <input
                          type="number"
                          min={0}
                          value={variant.price}
                          onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })}
                          placeholder="85000"
                          className={INPUT}
                        />
                      </label>
                      <label className={LABEL}>
                        Costo interno
                        <input
                          type="number"
                          min={0}
                          value={variant.cost}
                          onChange={(e) => updateVariant(idx, { cost: Number(e.target.value) })}
                          placeholder="0"
                          className={INPUT}
                        />
                      </label>
                      <label className={LABEL}>
                        Stock disponible
                        <input
                          type="number"
                          min={0}
                          value={variant.stock}
                          onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })}
                          placeholder="10"
                          className={INPUT}
                        />
                      </label>
                      <label className={LABEL}>
                        Unidades reservadas
                        <input
                          type="number"
                          min={0}
                          value={variant.reserved}
                          onChange={(e) => updateVariant(idx, { reserved: Number(e.target.value) })}
                          placeholder="0"
                          className={INPUT}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick size chips */}
              <div className="mt-3 border-t border-[rgba(17,17,16,0.06)] pt-3">
                <p className="mb-2 text-[11px] font-semibold text-ink-400">Agregar talla rápida</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => addQuickVariant(size)}
                      className="rounded-full border border-[rgba(17,17,16,0.10)] bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* ── Card 4: Promoción ── */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-ink-900">Promoción o descuento</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">Opcional. Se mostrará en el catálogo si está activa.</p>
                </div>
                <Toggle
                  checked={Boolean(promo.active)}
                  onChange={(val) => setDraft((prev) => setPromotion(prev, { active: val }))}
                />
              </div>

              {promo.active ? (
                <div className="mt-4 space-y-3">
                  <label className={LABEL}>
                    Título de la promoción
                    <input
                      value={promo.title ?? ''}
                      onChange={(e) => setDraft((prev) => setPromotion(prev, { title: e.target.value }))}
                      placeholder="Ej: Oferta de lanzamiento, 2x1, Liquidación"
                      className={INPUT}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-ink-500">Tipo de descuento</p>
                      <div className="flex gap-2">
                        {[
                          { value: 'percentage', label: '%' },
                          { value: 'fixed', label: '$' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setDraft((prev) => setPromotion(prev, { type: opt.value }))}
                            className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition ${
                              (promo.type ?? 'percentage') === opt.value
                                ? 'border-brand-400 bg-brand-50 text-brand-700'
                                : 'border-[rgba(17,17,16,0.10)] bg-white text-ink-600 hover:border-[rgba(17,17,16,0.18)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className={LABEL}>
                      Valor del descuento
                      <input
                        type="number"
                        min={0}
                        value={promo.value ?? 0}
                        onChange={(e) => setDraft((prev) => setPromotion(prev, { value: Number(e.target.value) }))}
                        placeholder={promo.type === 'fixed' ? '5000' : '15'}
                        className={INPUT}
                      />
                    </label>
                  </div>

                  {promo.value ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-3 py-1.5">
                      <span className="text-[12px] font-bold text-brand-700">
                        {promo.type === 'fixed'
                          ? `-$${(promo.value ?? 0).toLocaleString('es-CO')}`
                          : `-${promo.value}%`}
                      </span>
                      <span className="text-[11px] text-brand-600">{promo.title || 'Descuento activo'}</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-[12px] text-ink-400">Sin promoción activa para este producto.</p>
              )}
            </Card>

            {/* ── Card 5: Logística ── */}
            <Card className="p-5">
              <p className="mb-4 text-[13px] font-bold text-ink-900">Logística de entrega</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 px-4 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-ink-800">Requiere despacho</p>
                    <p className="mt-0.5 text-[11px] text-ink-400">Activa si el producto se envía físicamente al cliente.</p>
                  </div>
                  <Toggle
                    checked={draft.requiresShipping}
                    onChange={(val) => setDraft((prev) => ({ ...prev, requiresShipping: val }))}
                  />
                </div>

                <label className={LABEL}>
                  Notas logísticas
                  <textarea
                    value={draft.fulfillmentNotes}
                    onChange={(e) => setDraft((prev) => ({ ...prev, fulfillmentNotes: e.target.value }))}
                    rows={3}
                    placeholder="Ej: Despacho desde bodega central en 24–48h. Retiro disponible en Bogotá."
                    className={`${INPUT} resize-none`}
                  />
                </label>
              </div>
            </Card>

          </div>
        </div>

        {/* ── Floating action bar ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-5 pt-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #f5f4ef 65%, transparent)' }}
        >
          <div className="pointer-events-auto flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[rgba(17,17,16,0.12)] bg-white/90 px-5 py-2.5 text-[13px] font-semibold text-ink-700 shadow-sm transition hover:bg-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!isValid || saving || uploadingImage}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
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

/* ─── ProductsPage ─── */
export function ProductsPage() {
  const { showError, showSuccess } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [offerType, setOfferType] = useState<'all' | OfferType>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set([...DEFAULT_CATEGORIES, ...products.map((p) => p.category).filter(Boolean)]))],
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
    physical: products.filter((p) => p.offerType === 'physical').length,
    service: products.filter((p) => p.offerType === 'service').length,
    hybrid: products.filter((p) => p.offerType === 'hybrid').length,
  }), [products]);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await api.getProducts();
        if (!cancelled) setProducts(data.map(mapApiProductToUi));
      } catch (error) {
        if (!cancelled) showError('Catálogo', error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProducts();
    return () => { cancelled = true; };
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
      showSuccess('Producto guardado');
    } catch (error) {
      showError('Catálogo', error instanceof Error ? error.message : 'No se pudo guardar el producto.');
      throw error; // re-throw so OfferEditor's saving state resets
    }
  }

  async function handleDeleteProduct(id: string) {
    try {
      if (!id.startsWith('offer-')) await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showSuccess('Producto eliminado');
    } catch (error) {
      showError('Catálogo', error instanceof Error ? error.message : 'No se pudo eliminar el producto.');
    }
  }

  return (
    <div className="page-shell overflow-hidden">
      <div className="page-stack overflow-hidden">
        <PageHeader
          eyebrow="Catálogo comercial"
          title="Catálogo comercial"
          description="Gestiona tu catálogo de productos físicos, con variantes, stock y logística."
          actions={
            <Button variant="primary" onClick={() => setSelectedProduct(newOffer())}>
              <Plus size={14} /> Agregar producto
            </Button>
          }
        />

        {loading ? (
          <Card className="shrink-0 p-4 text-[13px] text-ink-400">Cargando catálogo...</Card>
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
            <p className="rounded-full bg-[rgba(17,17,16,0.05)] px-2.5 py-1 text-[10px] font-semibold text-ink-500">
              {filteredProducts.length} de {products.length}
            </p>
          </div>
          <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1.5fr)_150px_170px_auto]">
            <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2">
              <Search size={13} className="text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, marca o tag..."
                className="w-full bg-transparent text-[13px] text-ink-700 outline-none placeholder:text-ink-300"
              />
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
                  <option key={item} value={item}>{item === 'all' ? 'Todas' : item}</option>
                ))}
              </select>
            </label>
            <button
              onClick={() => { setSearch(''); setOfferType('all'); setCategory('all'); }}
              className="rounded-full border border-[rgba(17,17,16,0.08)] px-3 py-2 text-[11px] font-semibold text-ink-500 transition hover:bg-[rgba(17,17,16,0.04)]"
            >
              Limpiar
            </button>
          </div>
        </Card>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="grid grid-cols-1 gap-0 sm:grid-cols-[92px_1fr]">
                  <div className="h-[128px] rounded-l-3xl sm:h-full sm:min-h-[128px]" style={{ background: 'rgba(17,17,16,0.05)' }}>
                    {product.images[0] ? (
                      <img src={product.images[0]} alt={product.title} className="h-full w-full rounded-l-3xl object-cover" />
                    ) : null}
                  </div>
                  <div className="space-y-2.5 p-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <Tag text={getOfferTypeLabel(product.offerType)} color={getOfferTypeBadge(product.offerType)} />
                      <Tag text={getPriceTypeLabel(product.priceType)} color="bg-ink-100/60 text-ink-500" />
                      {formatPromotionLabel(product) ? (
                        <Tag text={formatPromotionLabel(product)} color="bg-brand-100/70 text-brand-700" />
                      ) : null}
                      {product.requiresShipping && <Tag text="Despacho" color="bg-sky-50/80 text-sky-600" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-ink-900" style={{ letterSpacing: '-0.01em' }}>{product.title}</p>
                      <p className="text-[12px] text-ink-400">{product.brand} · {product.category}</p>
                    </div>
                    <p className="line-clamp-2 text-[11px] text-ink-500">{product.fulfillmentNotes}</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] px-2.5 py-2">
                        <p className="lab-stat-label">Stock</p>
                        <p className="mt-0.5 text-[12px] font-bold text-ink-800">
                          {getProductAvailableUnits(product)} und disponibles
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] px-2.5 py-2">
                        <p className="lab-stat-label">Precio base · <span className="font-bold">{getCurrency(product)}</span></p>
                        <p className="mt-0.5 text-[12px] font-bold text-ink-800">
                          {formatPrice(product.variants[0]?.price ?? 0, getCurrency(product))}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag) => (
                          <Tag key={tag} text={tag} color="bg-ink-100/60 text-ink-500" />
                        ))}
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="rounded-xl border border-[rgba(17,17,16,0.08)] p-1.5 text-ink-400 transition hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-700"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => { setProducts((prev) => [copyOffer(product), ...prev]); showSuccess('Producto duplicado'); }}
                          className="rounded-xl border border-[rgba(17,17,16,0.08)] p-1.5 text-ink-400 transition hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-700"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => void handleDeleteProduct(product.id)}
                          className="rounded-xl border border-red-200/60 p-1.5 text-red-400 transition hover:bg-red-50/60"
                        >
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
