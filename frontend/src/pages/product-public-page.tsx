import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

import { api } from '../services/api';
import type { AppChatPublicConfig, PublicProductApiItem } from '../services/api';
import {
  formatCop,
  getBackgroundFill,
  getComponentSkin,
  getFontStack,
  getLinkBlockShape,
  getSocialItems,
} from '../components/appchat/appchat-utils';

const DEFAULT_CONFIG: AppChatPublicConfig = {
  organization_slug: '',
  app_name: 'App Chat',
  welcome_message: 'Hola. En que podemos ayudarte?',
  primary_color: '#1d4ed8',
  accent_color: '#0f172a',
  background_image_url: '',
  background_overlay: 'soft-dark',
  font_family: 'Manrope',
  font_scale: 'md',
  presentation_style: 'bottom_sheet',
  surface_style: 'glass',
  bubble_style: 'rounded',
  user_bubble_color: '#1d4ed8',
  agent_bubble_color: '#ffffff',
  header_logo_url: '',
  launcher_label: 'Abrir soporte',
  page_background_color: '#f7f3eb',
  background_mode: 'soft',
  background_treatment: 'mesh',
  hero_height: 'balanced',
  logo_size: 'md',
  banner_intensity: 'medium',
  chat_density: 'comfortable',
  hero_curve: 'soft',
  carousel_style: 'glass',
  social_visibility: 'auto',
  component_style: 'soft_cards',
  layout_template: 'stack',
  ticker_enabled: false,
  ticker_text: '',
  show_featured_products: true,
  instagram_url: '',
  tiktok_url: '',
  whatsapp_url: '',
  website_url: '',
  location_url: '',
  handoff_enabled: true,
  public_app_url: '',
};

export function ProductPublicPage() {
  const { orgSlug = '', productId = '' } = useParams();
  const [product, setProduct] = useState<PublicProductApiItem | null>(null);
  const [config, setConfig] = useState<AppChatPublicConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      try {
        const [productData, configData] = await Promise.all([
          api.getPublicProduct(orgSlug, productId),
          api.getPublicAppChatConnection(orgSlug).catch(() => DEFAULT_CONFIG),
        ]);
        if (!cancelled) {
          setProduct(productData);
          setConfig(configData);
          setActiveImageIndex(0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el producto.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProduct();
    return () => {
      cancelled = true;
    };
  }, [orgSlug, productId]);

  const pricing = useMemo(() => {
    if (!product) return 0;
    const prices = product.variants.map((variant) => variant.price).filter((price) => price > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [product]);

  const promotion = (product?.attributes?.promotion as { active?: boolean; type?: 'percentage' | 'fixed'; value?: number; title?: string } | undefined) ?? undefined;
  const promotionalPrice = useMemo(() => {
    if (!promotion?.active || !promotion.value || pricing <= 0) return 0;
    if (promotion.type === 'fixed') {
      return Math.max(pricing - promotion.value, 0);
    }
    return Math.max(pricing - pricing * (promotion.value / 100), 0);
  }, [pricing, promotion]);
  const askPrompt = product
    ? `Me interesa ${product.title}. Quiero saber si me conviene, precio y disponibilidad.`
    : '';

  const socialItems = useMemo(() => getSocialItems(config), [config]);
  const visibleSocialItems = socialItems;
  const skin = getComponentSkin(config.component_style, config.primary_color, config.accent_color, config.page_background_color);
  const linkShapeClass = getLinkBlockShape(config.component_style);
  const shellBackground = getBackgroundFill(
    config.background_mode,
    config.background_treatment,
    config.page_background_color,
    config.primary_color,
    config.accent_color
  );
  const cardShellBackground = config.background_image_url
    ? `linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.85)), url(${config.background_image_url})`
    : `linear-gradient(180deg, ${config.page_background_color}f2 0%, ${config.primary_color}10 100%)`;
  const cardShellStyle = {
    ...skin.cardStyle,
    borderColor: `${config.primary_color}22`,
    background: cardShellBackground,
    backgroundSize: config.background_image_url ? 'cover' : undefined,
    backgroundPosition: config.background_image_url ? 'center' : undefined,
  };
  const socialLinkClasses = `inline-flex h-8 w-8 items-center justify-center ${skin.social} ${linkShapeClass}`;

  if (loading) {
    return <div className="flex h-dvh items-center justify-center bg-[rgba(17,17,16,0.025)] text-ink-400">Cargando producto...</div>;
  }

  if (!product || error) {
    return <div className="flex h-dvh items-center justify-center bg-[rgba(17,17,16,0.025)] px-6 text-center text-ink-400">{error || 'Producto no disponible.'}</div>;
  }

  const activeImage = product.images?.[activeImageIndex] || product.images?.[0] || '';

  return (
    <div
      className="h-dvh overflow-hidden p-3 sm:p-4"
      style={{ background: shellBackground, fontFamily: getFontStack(config.font_family) }}
    >
      <div
        className="mx-auto flex h-full max-w-[980px] flex-col overflow-hidden rounded-[30px] border shadow-[0_20px_80px_rgba(15,23,42,0.10)] backdrop-blur-sm"
        style={cardShellStyle}
      >
        <div className="shrink-0 border-b px-4 py-3 sm:px-5" style={{ borderColor: `${config.primary_color}18`, background: `linear-gradient(90deg, ${config.primary_color}08 0%, transparent 100%)` }}>
          <Link to={`/${orgSlug}`} className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-600 transition hover:text-ink-900">
            <ArrowLeft size={15} />
            Volver al chat
          </Link>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[0.96fr_1.04fr]">
          <div className="min-h-0" style={{ background: `linear-gradient(160deg, ${config.primary_color}14 0%, ${config.accent_color}10 100%)` }}>
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1">
                {activeImage ? (
                  <img src={activeImage} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-400">
                    <ShoppingBag size={38} />
                  </div>
                )}
              </div>
              {(product.images?.length || 0) > 1 ? (
                <div className="flex shrink-0 gap-2 overflow-x-auto border-t px-3 py-3" style={{ borderColor: `${config.primary_color}18`, background: `${config.page_background_color}cc` }}>
                  {(product.images || []).slice(0, 5).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setActiveImageIndex(index)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border transition ${activeImageIndex === index ? 'shadow-card' : ''}`}
                      style={{ borderColor: activeImageIndex === index ? config.primary_color : `${config.primary_color}18` }}
                    >
                      <img src={image} alt={`${product.title} ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
            <div className="shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[rgba(17,17,16,0.06)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700">
                      {product.category || 'Sin categoria'}
                    </span>
                    {promotion?.active && promotion.value ? (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700">
                        {promotion.title || (promotion.type === 'fixed' ? `-$${promotion.value.toLocaleString('es-CO')}` : `-${promotion.value}%`)}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-ink-950">{product.title}</h1>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-ink-400">{product.brand || 'Marca propia'}</p>
                </div>

                {config.header_logo_url ? (
                  <img
                    src={config.header_logo_url}
                    alt={config.app_name}
                    className="h-14 w-14 shrink-0 rounded-full border-[4px] object-cover shadow-[0_10px_22px_rgba(15,23,42,0.10)]"
                    style={{ borderColor: config.page_background_color, backgroundColor: config.page_background_color }}
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[4px] text-[1rem] font-semibold tracking-[-0.08em] shadow-[0_10px_22px_rgba(15,23,42,0.10)]"
                    style={{ color: config.accent_color, borderColor: config.page_background_color, backgroundColor: config.page_background_color }}
                  >
                    {config.app_name.slice(0, 3).toUpperCase()}
                  </div>
                )}
              </div>

              {visibleSocialItems.length ? (
                <div className="mt-3 flex items-center gap-2 text-ink-500">
                  {visibleSocialItems.map((item, index) => (
                    <a
                      key={`${item.href}-${index}`}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={socialLinkClasses}
                      style={skin.socialStyle}
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className={`rounded-[18px] border px-3 py-3 ${skin.card}`} style={{ ...skin.cardStyle, borderColor: `${config.primary_color}18` }}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">Precio</p>
                  {promotion?.active && promotionalPrice > 0 ? (
                    <div className="mt-1.5">
                      <p className="text-[12px] font-medium text-ink-400 line-through">{formatCop(pricing)}</p>
                      <p className="mt-0.5 text-[17px] font-bold" style={{ color: config.primary_color }}>{formatCop(promotionalPrice)}</p>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[15px] font-bold text-ink-950">{formatCop(pricing)}</p>
                  )}
                </div>
                <div className={`rounded-[18px] border px-3 py-3 ${skin.card}`} style={{ ...skin.cardStyle, borderColor: `${config.primary_color}18` }}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">Entrega</p>
                  <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold leading-4 text-ink-900">{product.fulfillment_notes || 'A confirmar'}</p>
                </div>
              </div>
            </div>

              <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                <div className="grid h-full gap-3">
                  <div className={`rounded-[22px] px-3.5 py-3.5 ${skin.softCard}`} style={skin.softCardStyle}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">Detalle</p>
                  <p className="mt-2 line-clamp-6 text-[13px] leading-6 text-ink-600">
                    {product.description || product.fulfillment_notes || 'Producto disponible para cotizar y vender por chat.'}
                  </p>
                </div>

                {product.variants.length > 0 ? (
                  <div className={`rounded-[22px] px-3.5 py-3.5 ${skin.card}`} style={{ ...skin.cardStyle, borderColor: `${config.primary_color}18` }}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">Variantes</p>
                      <p className="text-[10px] text-ink-400">{product.variants.length} opciones</p>
                    </div>
                    <div className="mt-2.5 grid gap-2">
                      {product.variants.slice(0, 3).map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between gap-3 rounded-[16px] border px-3 py-2.5" style={{ borderColor: `${config.primary_color}16`, backgroundColor: `${config.page_background_color}cc` }}>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-ink-900">{variant.name}</p>
                            <p className="mt-0.5 truncate text-[10px] text-ink-400">{variant.sku}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[11px] font-semibold text-ink-900">{formatCop(variant.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 shrink-0 grid grid-cols-2 gap-2.5">
              <Link
                to={`/shop/${orgSlug}/${productId}/comprar`}
                className="inline-flex min-h-11 items-center justify-center rounded-[18px] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_rgba(17,17,16,0.18)]"
                style={{ backgroundColor: config.primary_color }}
              >
                <span className="text-white">Comprar</span>
              </Link>
              <Link
                to={`/${orgSlug}/?prefill=${encodeURIComponent(askPrompt)}`}
                className={`inline-flex min-h-11 items-center justify-center rounded-[18px] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] ${skin.secondary}`}
                style={{ ...skin.secondaryStyle }}
              >
                Preguntar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
