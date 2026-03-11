import type {
  EcommerceOrder,
  InventoryMovement,
  Product,
  ProductVariant,
  StockStatus,
} from '../types';

export const ecommerceProducts: Product[] = [
  {
    id: 'p-001',
    title: 'Camiseta Basic Unisex',
    brand: 'Nativo',
    category: 'Apparel',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=240&q=80&auto=format&fit=crop',
    tags: ['top-seller', 'ropa'],
    updatedAt: '2026-03-10T10:20:00Z',
    variants: [
      { id: 'v-001-1', sku: 'CAM-BAS-S-BLK', name: 'S / Negro', price: 69000, cost: 28000, stock: 18, reserved: 2 },
      { id: 'v-001-2', sku: 'CAM-BAS-M-BLK', name: 'M / Negro', price: 69000, cost: 28000, stock: 7, reserved: 1 },
      { id: 'v-001-3', sku: 'CAM-BAS-L-WHT', name: 'L / Blanco', price: 69000, cost: 28000, stock: 0, reserved: 0 },
    ],
  },
  {
    id: 'p-002',
    title: 'Tenis Urban Lite',
    brand: 'Rout',
    category: 'Footwear',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=240&q=80&auto=format&fit=crop',
    tags: ['nueva-coleccion'],
    updatedAt: '2026-03-10T09:10:00Z',
    variants: [
      { id: 'v-002-1', sku: 'TEN-URB-38', name: 'Talla 38', price: 189000, cost: 91000, stock: 5, reserved: 1 },
      { id: 'v-002-2', sku: 'TEN-URB-39', name: 'Talla 39', price: 189000, cost: 91000, stock: 2, reserved: 1 },
      { id: 'v-002-3', sku: 'TEN-URB-40', name: 'Talla 40', price: 189000, cost: 91000, stock: 11, reserved: 3 },
    ],
  },
  {
    id: 'p-003',
    title: 'Mochila Work Pro',
    brand: 'Carryco',
    category: 'Accesorios',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=240&q=80&auto=format&fit=crop',
    tags: ['corporativo'],
    updatedAt: '2026-03-09T16:05:00Z',
    variants: [
      { id: 'v-003-1', sku: 'MOC-WRK-GRY', name: 'Gris', price: 149000, cost: 64000, stock: 25, reserved: 4 },
      { id: 'v-003-2', sku: 'MOC-WRK-BLK', name: 'Negro', price: 149000, cost: 64000, stock: 3, reserved: 1 },
    ],
  },
];

export const ecommerceOrders: EcommerceOrder[] = [
  {
    id: 'ORD-10921',
    customerName: 'Daniela Pardo',
    channel: 'ecommerce',
    status: 'paid',
    total: 258000,
    currency: 'COP',
    items: [
      { sku: 'CAM-BAS-M-BLK', qty: 1, unitPrice: 69000 },
      { sku: 'TEN-URB-39', qty: 1, unitPrice: 189000 },
    ],
    createdAt: '2026-03-10T08:10:00Z',
    updatedAt: '2026-03-10T08:14:00Z',
  },
  {
    id: 'ORD-10922',
    customerName: 'Juan Camilo Vela',
    channel: 'whatsapp',
    status: 'processing',
    total: 149000,
    currency: 'COP',
    items: [{ sku: 'MOC-WRK-BLK', qty: 1, unitPrice: 149000 }],
    createdAt: '2026-03-10T09:40:00Z',
    updatedAt: '2026-03-10T10:01:00Z',
  },
  {
    id: 'ORD-10923',
    customerName: 'Mariana Correa',
    channel: 'instagram',
    status: 'new',
    total: 138000,
    currency: 'COP',
    items: [{ sku: 'CAM-BAS-S-BLK', qty: 2, unitPrice: 69000 }],
    createdAt: '2026-03-10T10:45:00Z',
    updatedAt: '2026-03-10T10:45:00Z',
  },
  {
    id: 'ORD-10911',
    customerName: 'Santiago Otero',
    channel: 'ecommerce',
    status: 'delivered',
    total: 338000,
    currency: 'COP',
    items: [
      { sku: 'MOC-WRK-GRY', qty: 1, unitPrice: 149000 },
      { sku: 'TEN-URB-40', qty: 1, unitPrice: 189000 },
    ],
    createdAt: '2026-03-08T14:25:00Z',
    updatedAt: '2026-03-09T17:00:00Z',
  },
];

export const inventoryMovements: InventoryMovement[] = [
  {
    id: 'mov-1',
    sku: 'TEN-URB-39',
    type: 'out',
    quantity: 1,
    reason: 'Pedido ORD-10921',
    actor: 'Sistema E-commerce',
    createdAt: '2026-03-10T08:14:00Z',
  },
  {
    id: 'mov-2',
    sku: 'MOC-WRK-BLK',
    type: 'reservation',
    quantity: 1,
    reason: 'Checkout iniciado',
    actor: 'Canal WhatsApp',
    createdAt: '2026-03-10T09:58:00Z',
  },
  {
    id: 'mov-3',
    sku: 'CAM-BAS-M-BLK',
    type: 'adjustment',
    quantity: 4,
    reason: 'Conteo fisico bodega',
    actor: 'Ana Torres',
    createdAt: '2026-03-10T10:05:00Z',
  },
  {
    id: 'mov-4',
    sku: 'CAM-BAS-L-WHT',
    type: 'in',
    quantity: 20,
    reason: 'Reposicion proveedor',
    actor: 'Compras',
    createdAt: '2026-03-10T11:00:00Z',
  },
];

export function getVariantStockStatus(variant: ProductVariant): StockStatus {
  const available = variant.stock - variant.reserved;
  if (available <= 0) return 'out_of_stock';
  if (available <= 5) return 'low_stock';
  return 'in_stock';
}

export function getProductAvailableUnits(product: Product): number {
  return product.variants.reduce((sum, variant) => sum + (variant.stock - variant.reserved), 0);
}
