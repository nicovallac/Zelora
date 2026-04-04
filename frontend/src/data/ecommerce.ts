import type {
  EcommerceOrder,
  InventoryMovement,
  Product,
  ProductVariant,
  StockStatus,
} from '../types';

export const ecommerceProducts: Product[] = [
  {
    id: 'offer-001',
    title: 'Camiseta Basic Unisex',
    brand: 'Nativo',
    category: 'Apparel',
    offerType: 'physical',
    priceType: 'fixed',
    serviceMode: 'not_applicable',
    requiresBooking: false,
    requiresShipping: true,
    serviceDurationMinutes: 0,
    capacity: 0,
    fulfillmentNotes: 'Despacho desde bodega central.',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=240&q=80&auto=format&fit=crop'],
    tags: ['top-seller', 'ropa'],
    updatedAt: '2026-03-10T10:20:00Z',
    variants: [
      { id: 'v-001-1', sku: 'CAM-BAS-S-BLK', name: 'S / Negro', price: 69000, cost: 28000, stock: 18, reserved: 2, durationMinutes: 0, capacity: 0, deliveryMode: 'not_applicable' },
      { id: 'v-001-2', sku: 'CAM-BAS-M-BLK', name: 'M / Negro', price: 69000, cost: 28000, stock: 7, reserved: 1, durationMinutes: 0, capacity: 0, deliveryMode: 'not_applicable' },
      { id: 'v-001-3', sku: 'CAM-BAS-L-WHT', name: 'L / Blanco', price: 69000, cost: 28000, stock: 0, reserved: 0, durationMinutes: 0, capacity: 0, deliveryMode: 'not_applicable' },
    ],
  },
  {
    id: 'offer-002',
    title: 'Asesoria de subsidio familiar',
    brand: 'Comfaguajira',
    category: 'Servicios',
    offerType: 'service',
    priceType: 'fixed',
    serviceMode: 'remote',
    requiresBooking: true,
    requiresShipping: false,
    serviceDurationMinutes: 45,
    capacity: 12,
    fulfillmentNotes: 'Reserva previa con confirmacion por WhatsApp o Web.',
    attributes: { team: 'Subsidios', bookingWindowDays: 14 },
    status: 'active',
    images: ['https://images.unsplash.com/photo-1552664730-d307ca884978?w=240&q=80&auto=format&fit=crop'],
    tags: ['asesoria', 'subsidio'],
    updatedAt: '2026-03-11T09:15:00Z',
    variants: [
      { id: 'v-002-1', sku: 'ASE-SUB-REM-45', name: 'Remota / 45 min', price: 85000, cost: 0, stock: 0, reserved: 0, durationMinutes: 45, capacity: 12, deliveryMode: 'remote' },
      { id: 'v-002-2', sku: 'ASE-SUB-PRE-60', name: 'Presencial / 60 min', price: 110000, cost: 0, stock: 0, reserved: 0, durationMinutes: 60, capacity: 8, deliveryMode: 'onsite' },
    ],
  },
  {
    id: 'offer-003',
    title: 'Kit de onboarding con instalacion',
    brand: 'Zelora Services',
    category: 'Implementacion',
    offerType: 'hybrid',
    priceType: 'quote_required',
    serviceMode: 'hybrid',
    requiresBooking: true,
    requiresShipping: true,
    serviceDurationMinutes: 90,
    capacity: 4,
    fulfillmentNotes: 'Incluye envio del kit fisico y sesion de configuracion remota.',
    attributes: { hardwareIncluded: true, activationLeadTimeDays: 5 },
    status: 'active',
    images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=240&q=80&auto=format&fit=crop'],
    tags: ['implementacion', 'kit'],
    updatedAt: '2026-03-11T12:30:00Z',
    variants: [
      { id: 'v-003-1', sku: 'KIT-ONB-STD', name: 'Kit estandar + setup', price: 420000, cost: 180000, stock: 6, reserved: 1, durationMinutes: 90, capacity: 4, deliveryMode: 'hybrid' },
      { id: 'v-003-2', sku: 'KIT-ONB-ADV', name: 'Kit avanzado + setup', price: 0, cost: 250000, stock: 2, reserved: 0, durationMinutes: 120, capacity: 2, deliveryMode: 'hybrid' },
    ],
  },
];

export const ecommerceOrders: EcommerceOrder[] = [
  {
    id: 'ORD-10921',
    customerName: 'Daniela Pardo',
    orderKind: 'purchase',
    channel: 'ecommerce',
    status: 'paid',
    total: 258000,
    currency: 'COP',
    items: [
      { sku: 'CAM-BAS-M-BLK', qty: 1, unitPrice: 69000, title: 'Camiseta Basic Unisex', offerType: 'physical' },
      { sku: 'CAM-BAS-S-BLK', qty: 1, unitPrice: 189000, title: 'Combo premium', offerType: 'physical' },
    ],
    fulfillmentSummary: { shippingStatus: 'ready_to_pack' },
    createdAt: '2026-03-10T08:10:00Z',
    updatedAt: '2026-03-10T08:14:00Z',
  },
  {
    id: 'BKG-22014',
    customerName: 'Laura Mendoza',
    orderKind: 'booking',
    channel: 'whatsapp',
    status: 'processing',
    total: 85000,
    currency: 'COP',
    items: [{ sku: 'ASE-SUB-REM-45', qty: 1, unitPrice: 85000, title: 'Asesoria de subsidio familiar', offerType: 'service' }],
    scheduledFor: '2026-03-13T15:00:00Z',
    serviceLocation: 'Remoto por videollamada',
    fulfillmentSummary: { advisor: 'Equipo Subsidios', bookingStatus: 'confirmed' },
    createdAt: '2026-03-10T09:40:00Z',
    updatedAt: '2026-03-10T10:01:00Z',
  },
  {
    id: 'QTE-88031',
    customerName: 'Cooperativa Horizonte',
    orderKind: 'quote_request',
    channel: 'web',
    status: 'new',
    total: 0,
    currency: 'COP',
    items: [{ sku: 'KIT-ONB-ADV', qty: 2, unitPrice: 0, title: 'Kit de onboarding con instalacion', offerType: 'hybrid' }],
    serviceLocation: 'Barranquilla + remoto',
    fulfillmentSummary: { requestedScope: '10 sedes', quoteOwner: 'Equipo CX' },
    createdAt: '2026-03-11T10:45:00Z',
    updatedAt: '2026-03-11T10:45:00Z',
  },
];

export const inventoryMovements: InventoryMovement[] = [
  {
    id: 'mov-1',
    sku: 'CAM-BAS-M-BLK',
    offerType: 'physical',
    type: 'out',
    quantity: 1,
    reason: 'Pedido ORD-10921',
    actor: 'Sistema Commerce',
    createdAt: '2026-03-10T08:14:00Z',
  },
  {
    id: 'mov-2',
    sku: 'KIT-ONB-STD',
    offerType: 'hybrid',
    type: 'reservation',
    quantity: 1,
    reason: 'Reserva para instalacion confirmada',
    actor: 'Canal WhatsApp',
    createdAt: '2026-03-10T09:58:00Z',
  },
  {
    id: 'mov-3',
    sku: 'CAM-BAS-L-WHT',
    offerType: 'physical',
    type: 'in',
    quantity: 20,
    reason: 'Reposicion proveedor',
    actor: 'Compras',
    createdAt: '2026-03-10T11:00:00Z',
  },
];

export function getVariantStockStatus(variant: ProductVariant): StockStatus {
  if (variant.deliveryMode !== 'not_applicable' && variant.stock === 0 && variant.reserved === 0) {
    return 'in_stock';
  }
  const available = variant.stock - variant.reserved;
  if (available <= 0) return 'out_of_stock';
  if (available <= 5) return 'low_stock';
  return 'in_stock';
}

export function getProductAvailableUnits(product: Product): number {
  if (product.offerType === 'service') return product.capacity;
  return product.variants.reduce((sum, variant) => sum + Math.max(0, variant.stock - variant.reserved), 0);
}
