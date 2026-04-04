import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Instagram, MapPin, MessageCircleMore, Music2, ShoppingBag } from 'lucide-react';

import { api } from '../services/api';
import type { AppChatPublicConfig, PublicProductApiItem } from '../services/api';

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

function formatCop(value: number) {
  if (value <= 0) return 'A cotizar';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function getFontStack(fontFamily: string) {
  if (fontFamily === 'Fraunces') return '"Fraunces", Georgia, serif';
  return `"${fontFamily}", "Segoe UI", sans-serif`;
}

function getSocialItems(config: AppChatPublicConfig) {
  return [
    config.instagram_url ? { href: config.instagram_url, icon: <Instagram size={14} /> } : null,
    config.tiktok_url ? { href: config.tiktok_url, icon: <Music2 size={14} /> } : null,
    config.whatsapp_url ? { href: config.whatsapp_url, icon: <MessageCircleMore size={14} /> } : null,
    config.website_url ? { href: config.website_url, icon: <Globe size={14} /> } : null,
    config.location_url ? { href: config.location_url, icon: <MapPin size={14} /> } : null,
  ].filter(Boolean) as Array<{ href: string; icon: React.ReactNode }>;
}

export function ProductBuySoonPage() {
  const { orgSlug = '', productId = '' } = useParams();
  const [product, setProduct] = useState<PublicProductApiItem | null>(null);
  const [config, setConfig] = useState<AppChatPublicConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const buyPrompt = product
    ? `Quiero comprar ${product.title}. Ayudame con disponibilidad, talla o variante y siguiente paso.`
    : '';

  const socialItems = useMemo(() => getSocialItems(config), [config]);
  const visibleSocialItems = socialItems;

  const shellBackground =
    config.background_mode === 'solid'
      ? config.page_background_color
      : config.background_mode === 'gradient'
        ? `linear-gradient(180deg, ${config.page_background_color} 0%, ${config.primary_color}18 100%)`
        : `radial-gradient(circle at top, ${config.primary_color}14, transparent 24%), linear-gradient(180deg, ${config.page_background_color} 0%, ${config.page_background_color} 100%)`;
  const cardBackground = config.background_image_url
    ? `linear-gradient(180deg, rgba(255,255,255,0.76), rgba(255,255,255,0.92)), url(${config.background_image_url})`
    : `linear-gradient(180deg, ${config.page_background_color}f2 0%, ${config.primary_color}10 100%)`;
  const mutedPanelBackground = `linear-gradient(180deg, ${config.page_background_color}cc 0%, rgba(255,255,255,0.72) 100%)`;
  const subtleChipBackground = `${config.primary_color}12`;
  const secondaryButtonBackground = `${config.page_background_color}e8`;

  if (loading) {
    return <div className="flex h-dvh items-center justify-center bg-[rgba(17,17,16,0.025)] text-ink-500">Cargando compra...</div>;
  }

  if (!product || error) {
    return <div className="flex h-dvh items-center justify-center bg-[rgba(17,17,16,0.025)] px-6 text-center text-ink-500">{error || 'Producto no disponible.'}</div>;
  }

  return (
    <div
      className="h-dvh overflow-hidden p-3 sm:p-4"
      style={{ background: shellBackground, fontFamily: getFontStack(config.font_family) }}
    >
      <div
        className="mx-auto flex h-full max-w-[760px] flex-col overflow-hidden rounded-[30px] border shadow-[0_20px_80px_rgba(15,23,42,0.10)] backdrop-blur-sm"
        style={{ background: cardBackground, backgroundSize: config.background_image_url ? 'cover' : undefined, backgroundPosition: 'center', borderColor: `${config.primary_color}22` }}
      >
        <div className="shrink-0 border-b px-4 py-3 sm:px-5" style={{ borderColor: `${config.primary_color}18`, background: `linear-gradient(90deg, ${config.primary_color}08 0%, transparent 100%)` }}>
          <Link to={`/shop/${orgSlug}/${productId}`} className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-600 transition hover:text-ink-900">
            <ArrowLeft size={15} />
            Volver al producto
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
          <div className="shrink-0 text-center">
            {config.header_logo_url ? (
              <img
                src={config.header_logo_url}
                alt={config.app_name}
                className="mx-auto h-20 w-20 rounded-full border-[5px] object-cover shadow-[0_14px_28px_rgba(15,23,42,0.10)]"
                style={{ borderColor: config.page_background_color, backgroundColor: config.page_background_color }}
              />
            ) : (
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[5px] text-[1.45rem] font-semibold tracking-[-0.08em] shadow-[0_14px_28px_rgba(15,23,42,0.10)]"
                style={{ color: config.accent_color, borderColor: config.page_background_color, backgroundColor: config.page_background_color }}
              >
                {config.app_name.slice(0, 4).toUpperCase()}
              </div>
            )}
            <p className="mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-ink-950">{config.app_name}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.26em] text-ink-400">{config.launcher_label || 'Virtual Store'}</p>
            {visibleSocialItems.length ? (
              <div className="mt-3 flex items-center justify-center gap-3 text-ink-500">
                {visibleSocialItems.map((item, index) => (
                    <a
                      key={`${item.href}-${index}`}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: subtleChipBackground }}
                    >
                      {item.icon}
                    </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-5 min-h-0 flex-1 overflow-hidden rounded-[26px] border px-4 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]" style={{ borderColor: `${config.primary_color}18`, background: mutedPanelBackground }}>
            <div className="flex h-full flex-col">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-ink-900" style={{ backgroundColor: subtleChipBackground }}>
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Compra online</p>
                  <h1 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-ink-950">Proximamente podras comprar online.</h1>
                  <p className="mt-2 text-[13px] leading-6 text-ink-600">
                    Estamos cerrando la experiencia de checkout. Mientras tanto, puedes pedir este producto por chat y te ayudamos con talla, variante y siguiente paso.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border p-3.5" style={{ borderColor: `${config.primary_color}18`, background: mutedPanelBackground }}>
                <div className="flex items-center gap-3">
                  {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="h-16 w-16 rounded-2xl object-cover" /> : null}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink-900">{product.title}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-400">{product.brand || 'Marca propia'}</p>
                    <p className="mt-2 text-[14px] font-semibold" style={{ color: config.primary_color }}>{formatCop(pricing)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-2.5 pt-4">
                <Link
                  to={`/${orgSlug}/?prefill=${encodeURIComponent(buyPrompt)}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_rgba(17,17,16,0.18)]"
                  style={{ backgroundColor: config.primary_color }}
                >
                  Pedir por chat
                </Link>
                <Link
                  to={`/shop/${orgSlug}/${productId}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-800"
                  style={{ borderColor: `${config.primary_color}16`, backgroundColor: secondaryButtonBackground }}
                >
                  Volver
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
