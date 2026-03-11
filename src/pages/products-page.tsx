import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImagePlus, Package, Pencil, Plus, Search, Trash2, Copy, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { ecommerceProducts, getProductAvailableUnits, getVariantStockStatus } from '../data/ecommerce';
import { Button, Card, SectionTitle, StockBadge, Tag } from '../components/ui/primitives';
import type { Product, ProductVariant } from '../types';
import { useNotification } from '../contexts/NotificationContext';

function formatCop(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
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
  };
}

function newProduct(): Product {
  return {
    id: `p-${Date.now()}`,
    title: '',
    brand: '',
    category: '',
    status: 'draft',
    image: '',
    tags: [],
    updatedAt: new Date().toISOString(),
    variants: [newVariant()],
  };
}

function copyProduct(product: Product): Product {
  const idSuffix = `${Date.now()}`.slice(-5);
  return {
    ...product,
    id: `p-copy-${idSuffix}`,
    title: `${product.title} (Copia)`,
    updatedAt: new Date().toISOString(),
    variants: product.variants.map((v, idx) => ({
      ...v,
      id: `v-copy-${idSuffix}-${idx}`,
      sku: `${v.sku}-COPY`,
    })),
  };
}

function splitByLocation(totalStock: number) {
  const center = Math.max(0, Math.floor(totalStock * 0.5));
  const north = Math.max(0, Math.floor(totalStock * 0.3));
  const south = Math.max(0, totalStock - center - north);
  return { center, north, south };
}

interface ProductEditorProps {
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
}

function ProductEditor({ product, onClose, onSave }: ProductEditorProps) {
  const [draft, setDraft] = useState<Product>(product);
  const [tagsInput, setTagsInput] = useState(product.tags.join(', '));

  const isValid =
    draft.title.trim().length > 0 &&
    draft.brand.trim().length > 0 &&
    draft.category.trim().length > 0 &&
    draft.variants.length > 0 &&
    draft.variants.every((v) => v.sku.trim().length > 0 && v.name.trim().length > 0 && v.price > 0);

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setDraft((prev) => ({ ...prev, image: localUrl }));
  }

  function updateVariant(idx: number, field: keyof ProductVariant, value: string | number) {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === idx
          ? {
              ...v,
              [field]: value,
            }
          : v
      ),
    }));
  }

  function removeVariant(idx: number) {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  }

  function handleSave() {
    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({
      ...draft,
      tags: cleanTags,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/35" onClick={onClose} />
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {product.title ? 'Editar producto' : 'Crear producto'}
            </p>
            <p className="text-xs text-slate-500">Gestión completa de catálogo para tu tienda.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">Información general</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-slate-600">
                Título
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 text-xs text-slate-600">
                Marca
                <input
                  value={draft.brand}
                  onChange={(e) => setDraft((p) => ({ ...p, brand: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 text-xs text-slate-600">
                Categoría
                <input
                  value={draft.category}
                  onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 text-xs text-slate-600">
                Estado
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      status: e.target.value as Product['status'],
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="active">Activo</option>
                  <option value="draft">Borrador</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
            </div>
            <label className="mt-3 block space-y-1 text-xs text-slate-600">
              Tags (separadas por coma)
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ropa, top-seller, oferta"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </Card>

          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">Imagen del producto</p>
            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <div className="h-[120px] w-[120px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {draft.image ? (
                  <img src={draft.image} alt={draft.title || 'preview'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">Sin imagen</div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block space-y-1 text-xs text-slate-600">
                  URL imagen
                  <input
                    value={draft.image}
                    onChange={(e) => setDraft((p) => ({ ...p, image: e.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <ImagePlus size={14} />
                  Subir foto (preview local)
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Variantes</p>
              <button
                onClick={() => setDraft((p) => ({ ...p, variants: [...p.variants, newVariant()] }))}
                className="rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-200"
              >
                + Agregar variante
              </button>
            </div>
            <div className="space-y-3">
              {draft.variants.map((variant, idx) => (
                <div key={variant.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">Variante #{idx + 1}</p>
                    {draft.variants.length > 1 ? (
                      <button
                        onClick={() => removeVariant(idx)}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={variant.name}
                      onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                      placeholder="Nombre (M / Negro)"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      value={variant.sku}
                      onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                      placeholder="SKU"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={variant.price}
                      onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))}
                      placeholder="Precio"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={variant.cost}
                      onChange={(e) => updateVariant(idx, 'cost', Number(e.target.value))}
                      placeholder="Costo"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={(e) => updateVariant(idx, 'stock', Number(e.target.value))}
                      placeholder="Stock total"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={variant.reserved}
                      onChange={(e) => updateVariant(idx, 'reserved', Number(e.target.value))}
                      placeholder="Reservado"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="sticky bottom-0 mt-5 flex items-center justify-end gap-2 border-t border-slate-200 bg-white pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!isValid}>
            Guardar producto
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductsPage() {
  const { showSuccess } = useNotification();
  const [products, setProducts] = useState<Product[]>(ecommerceProducts);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const PAGE_SIZE = 6;

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))],
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchesCategory = category === 'all' || p.category === category;
        const q = search.toLowerCase();
        const matchesSearch =
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q));
        return matchesCategory && (!q || matchesSearch);
      }),
    [products, category, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const paged = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  function openCreate() {
    setEditing(newProduct());
    setEditorOpen(true);
  }

  function openEdit(product: Product) {
    setEditing({
      ...product,
      variants: product.variants.map((v) => ({ ...v })),
      tags: [...product.tags],
    });
    setEditorOpen(true);
  }

  function saveProduct(product: Product) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (!exists) return [product, ...prev];
      return prev.map((p) => (p.id === product.id ? product : p));
    });
    setEditorOpen(false);
    setEditing(null);
    showSuccess(`Producto ${product.title || 'guardado'} actualizado`);
  }

  function deleteProduct(productId: string, title: string) {
    const ok = window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setSelectedIds((prev) => prev.filter((id) => id !== productId));
    showSuccess(`Producto ${title} eliminado`);
  }

  function duplicateProduct(product: Product) {
    const duplicate = copyProduct(product);
    setProducts((prev) => [duplicate, ...prev]);
    showSuccess(`Producto duplicado: ${duplicate.title}`);
  }

  function toggleSelected(productId: string) {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  function bulkUpdateStatus(status: Product['status']) {
    if (selectedIds.length === 0) return;
    setProducts((prev) =>
      prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status, updatedAt: new Date().toISOString() } : p))
    );
    showSuccess(`Se actualizaron ${selectedIds.length} productos`);
  }

  function bulkDelete() {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(`¿Eliminar ${selectedIds.length} productos seleccionados?`);
    if (!ok) return;
    setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
    showSuccess(`${selectedIds.length} productos eliminados`);
    setSelectedIds([]);
  }

  return (
    <div className="space-y-4 px-3 pb-4 pt-5 sm:px-4 lg:px-5">
      <SectionTitle
        title="Productos"
        subtitle="Gestión completa: crear, editar, duplicar, eliminar, variantes, imagen y stock por ubicación."
      />

      <Card className="p-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, marca o SKU..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder-slate-400"
              />
            </div>
            <div className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    category === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c === 'all' ? 'Todas' : c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-2 ${viewMode === 'grid' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg p-2 ${viewMode === 'table' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}
              >
                <TableIcon size={14} />
              </button>
            </div>
            <Button variant="primary" onClick={openCreate} className="whitespace-nowrap">
              <Plus size={14} />
              Nuevo producto
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2">
            <p className="text-xs font-semibold text-slate-500">
              Seleccionados: {selectedIds.length}
            </p>
            <Button size="sm" variant="secondary" onClick={() => bulkUpdateStatus('active')} disabled={selectedIds.length === 0}>
              Activar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => bulkUpdateStatus('archived')} disabled={selectedIds.length === 0}>
              Archivar
            </Button>
            <Button size="sm" variant="ghost" onClick={bulkDelete} disabled={selectedIds.length === 0} className="text-red-600 hover:bg-red-50">
              Eliminar seleccionados
            </Button>
          </div>
        </div>
      </Card>

      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paged.map((product) => {
            const available = getProductAvailableUnits(product);
            const criticalVariant = product.variants.find((v) => getVariantStockStatus(v) !== 'in_stock');
            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-[16/9] bg-slate-100">
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">Sin imagen</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900">{product.title}</p>
                      <p className="text-xs text-slate-500">
                        {product.brand} · {product.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelected(product.id)}
                      />
                      <Tag
                        text={
                          product.status === 'active'
                            ? 'Activo'
                            : product.status === 'draft'
                              ? 'Borrador'
                              : 'Archivado'
                        }
                        color={product.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}
                      />
                    </div>
                  </div>
                  <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <Package size={14} />
                    {product.variants.length} variantes · {available} unidades disponibles
                  </div>

                  <div className="space-y-2">
                    {product.variants.map((variant) => {
                      const loc = splitByLocation(variant.stock);
                      return (
                        <div key={variant.id} className="rounded-xl border border-slate-200 p-2.5">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-800">{variant.name}</p>
                            <StockBadge status={getVariantStockStatus(variant)} />
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                            <p>SKU: <span className="font-medium text-slate-700">{variant.sku}</span></p>
                            <p>Precio: <span className="font-medium text-slate-700">{formatCop(variant.price)}</span></p>
                            <p>Stock: <span className="font-medium text-slate-700">{variant.stock}</span></p>
                            <p>Reservado: <span className="font-medium text-slate-700">{variant.reserved}</span></p>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            Bodega Centro: {loc.center} · Norte: {loc.north} · Sur: {loc.south}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {criticalVariant ? (
                    <p className="mt-3 text-xs font-semibold text-amber-700">
                      Atención: revisar variante {criticalVariant.name} ({criticalVariant.sku}).
                    </p>
                  ) : null}

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => duplicateProduct(product)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-violet-100 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-200"
                    >
                      <Copy size={12} />
                      Duplicar
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id, product.title)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                    >
                      <Trash2 size={12} />
                      Eliminar
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Variantes</th>
                  <th className="px-4 py-3">Stock disponible</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelected(product.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{product.title}</td>
                    <td className="px-4 py-3 text-slate-600">{product.brand}</td>
                    <td className="px-4 py-3 text-slate-600">{product.category}</td>
                    <td className="px-4 py-3 text-slate-600">{product.variants.length}</td>
                    <td className="px-4 py-3 text-slate-700">{getProductAvailableUnits(product)}</td>
                    <td className="px-4 py-3">
                      <Tag
                        text={product.status === 'active' ? 'Activo' : product.status === 'draft' ? 'Borrador' : 'Archivado'}
                        color={product.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(product)} className="rounded bg-slate-100 px-2 py-1 text-xs">Editar</button>
                        <button onClick={() => duplicateProduct(product)} className="rounded bg-violet-100 px-2 py-1 text-xs text-violet-700">Duplicar</button>
                        <button onClick={() => deleteProduct(product.id, product.title)} className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Mostrando {(clampedPage - 1) * PAGE_SIZE + 1} - {Math.min(clampedPage * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage === 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 text-xs font-semibold text-slate-600">
              {clampedPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={clampedPage === totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </Card>

      {editorOpen && editing ? (
        <ProductEditor
          product={editing}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSave={saveProduct}
        />
      ) : null}
    </div>
  );
}
