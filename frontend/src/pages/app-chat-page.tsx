import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Copy, ExternalLink, ChevronDown, Zap, MessageCircleMore, ShoppingBag, Sparkles, Globe, Instagram, MapPin, Music2 } from 'lucide-react';
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/primitives';
import { CropModal } from '../components/ui/crop-modal';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import type { AppChatConnectionApiItem } from '../services/api';

type Settings = {
  enabled: boolean;
  organizationSlug: string;
  appName: string;
  primaryColor: string;
  accentColor: string;
  pageBackgroundColor: string;
  backgroundMode: string;
  backgroundTreatment: string;
  heroHeight: string;
  logoSize: string;
  bannerIntensity: string;
  chatDensity: string;
  heroCurve: string;
  carouselStyle: string;
  socialVisibility: string;
  componentStyle: string;
  layoutTemplate: string;
  backgroundImageUrl: string;
  fontFamily: string;
  presentationStyle: string;
  userBubbleColor: string;
  agentBubbleColor: string;
  headerLogoUrl: string;
  launcherLabel: string;
  tickerEnabled: boolean;
  tickerText: string;
  showFeaturedProducts: boolean;
  instagramUrl: string;
  tiktokUrl: string;
  whatsappUrl: string;
  websiteUrl: string;
  locationUrl: string;
  iosBundleIds: string[];
  androidPackageNames: string[];
  allowedOrigins: string[];
  requireAuthentication: boolean;
  pushEnabled: boolean;
  handoffEnabled: boolean;
  restEndpoint: string;
  publicAppUrl: string;
  androidSdkSnippet: string;
  iosSdkSnippet: string;
  installStatus: string;
  verifiedApps: string[];
  lastInstallCheckAt: string | null;
};

const DEFAULT_SETTINGS: Settings = {
  enabled: false,
  organizationSlug: '',
  appName: 'App Chat',
  primaryColor: '#18181b',
  accentColor: '#111111',
  pageBackgroundColor: '#f7f3eb',
  backgroundMode: 'soft',
  backgroundTreatment: 'mesh',
  heroHeight: 'balanced',
  logoSize: 'md',
  bannerIntensity: 'medium',
  chatDensity: 'comfortable',
  heroCurve: 'soft',
  carouselStyle: 'glass',
  socialVisibility: 'auto',
  componentStyle: 'soft_cards',
  layoutTemplate: 'stack',
  backgroundImageUrl: '',
  fontFamily: 'Plus Jakarta Sans',
  presentationStyle: 'bottom_sheet',
  userBubbleColor: '#18181b',
  agentBubbleColor: '#ffffff',
  headerLogoUrl: '',
  launcherLabel: 'Virtual Store',
  tickerEnabled: false,
  tickerText: '',
  showFeaturedProducts: true,
  instagramUrl: '',
  tiktokUrl: '',
  whatsappUrl: '',
  websiteUrl: '',
  locationUrl: '',
  iosBundleIds: [],
  androidPackageNames: [],
  allowedOrigins: [],
  requireAuthentication: true,
  pushEnabled: false,
  handoffEnabled: true,
  restEndpoint: '',
  publicAppUrl: '',
  androidSdkSnippet: '',
  iosSdkSnippet: '',
  installStatus: 'not_installed',
  verifiedApps: [],
  lastInstallCheckAt: null,
};

const TEMPLATES = [
  { id: 'stack', label: 'Stack', description: 'Marca al centro, links apilados y chat como cierre elegante.', accent: 'La composicion mas limpia y mas vertical.' },
  { id: 'column_story', label: 'Column Story', description: 'Hero + logo centrado y gran footer CTA en la base.', accent: 'Versión columnar tipo poster con un bloque de información fijo abajo.' },
  { id: 'split', label: 'Split', description: 'Identidad a un lado y bloque complementario al otro.', accent: 'La composicion mas aireada y editorial.' },
  { id: 'spotlight', label: 'Spotlight', description: 'El asesor entra primero y la marca aterriza despues.', accent: 'La composicion mas guiada y con mas actitud.' },
  { id: 'swipe_story', label: 'Swipe Story', description: 'Hero dominante con gestos: arriba abre chat y a la izquierda abre tienda.', accent: 'Pensado para una experiencia tipo TikTok o reel interactivo.' },
  { id: 'storefront', label: 'Storefront', description: 'Ordena primero el descubrimiento de tienda y luego baja al cierre por chat.', accent: 'El mas comercial. Se siente como bio page + mini storefront.' },
  { id: 'triptych', label: 'Triptych', description: 'Fotos de producto en los costados, identidad al centro y chat integrado.', accent: 'El mas editorial y mas tienda. Las fotos flanquean la experiencia.' },
] as const;

const COMPONENT_STYLES = [
  { id: 'soft_cards', label: 'Soft Cards', description: 'Tarjetas amables, suaves y comerciales.' },
  { id: 'glass', label: 'Glass', description: 'Superficies translucidas, brillantes y ligeras.' },
  { id: 'neo_brutalism', label: 'Neo Brutalism', description: 'Bordes duros, contraste alto y sombras marcadas.' },
  { id: 'outline_minimal', label: 'Outline Minimal', description: 'Solo contornos, limpio y editorial.' },
  { id: 'solid_pop', label: 'Solid Pop', description: 'Bloques solidos, mas energia y mas impacto.' },
] as const;

const BACKGROUND_TREATMENTS = [
  { id: 'plain', label: 'Plain', description: 'Fondo limpio y casi plano.' },
  { id: 'mesh', label: 'Mesh', description: 'Nubes suaves de color y profundidad.' },
  { id: 'grain', label: 'Grain', description: 'Textura ligera y sensacion mas tactil.' },
  { id: 'grid', label: 'Grid', description: 'Patron fino, mas estructurado y grafico.' },
  { id: 'canvas', label: 'Canvas', description: 'Mancha amplia tipo poster o collage.' },
] as const;

const PRESETS = [
  { id: 'bio',      label: 'Bio Editorial',  description: 'Minimal, limpio y tipo perfil.',         primaryColor: '#18181b', accentColor: '#111111', pageBackgroundColor: '#f4efe7', backgroundMode: 'soft',     backgroundTreatment: 'plain',  heroHeight: 'balanced', logoSize: 'lg', bannerIntensity: 'soft',   chatDensity: 'comfortable', heroCurve: 'soft', carouselStyle: 'glass',   socialVisibility: 'auto',    fontFamily: 'Plus Jakarta Sans', userBubbleColor: '#18181b', agentBubbleColor: '#ffffff' },
  { id: 'glow',     label: 'Glow',           description: 'Aire suave, luminoso y emocional.',      primaryColor: '#7c3aed', accentColor: '#fb7185', pageBackgroundColor: '#fff7fb', backgroundMode: 'gradient', backgroundTreatment: 'mesh',   heroHeight: 'balanced', logoSize: 'lg', bannerIntensity: 'medium', chatDensity: 'comfortable', heroCurve: 'deep', carouselStyle: 'editorial', socialVisibility: 'minimal', fontFamily: 'Manrope', userBubbleColor: '#7c3aed', agentBubbleColor: '#fffafb' },
  { id: 'luxe',     label: 'Soft Luxe',      description: 'Mas premium y con aire editorial.',      primaryColor: '#0f172a', accentColor: '#8f6f4d', pageBackgroundColor: '#f7f2ea', backgroundMode: 'gradient', backgroundTreatment: 'grain',  heroHeight: 'immersive', logoSize: 'lg', bannerIntensity: 'medium', chatDensity: 'comfortable', heroCurve: 'deep', carouselStyle: 'editorial', socialVisibility: 'minimal', fontFamily: 'Fraunces',          userBubbleColor: '#0f172a', agentBubbleColor: '#fffdf8' },
  { id: 'creator',  label: 'Warm Creator',   description: 'Mas humano, calido y cercano.',          primaryColor: '#c2410c', accentColor: '#7c2d12', pageBackgroundColor: '#fff7ed', backgroundMode: 'gradient', backgroundTreatment: 'canvas', heroHeight: 'balanced', logoSize: 'md', bannerIntensity: 'medium', chatDensity: 'comfortable', heroCurve: 'soft', carouselStyle: 'glass',   socialVisibility: 'auto',    fontFamily: 'DM Sans',           userBubbleColor: '#c2410c', agentBubbleColor: '#fff7ed' },
  { id: 'commerce', label: 'Clean Commerce', description: 'Pensado para vender y guiar a compra.',  primaryColor: '#2563eb', accentColor: '#0f172a', pageBackgroundColor: '#eff6ff', backgroundMode: 'soft',     backgroundTreatment: 'grid',   heroHeight: 'compact',  logoSize: 'md', bannerIntensity: 'soft',   chatDensity: 'compact',     heroCurve: 'soft', carouselStyle: 'compact', socialVisibility: 'hidden', fontFamily: 'Space Grotesk',     userBubbleColor: '#2563eb', agentBubbleColor: '#f8fbff' },
  { id: 'runway',   label: 'Runway Gloss',   description: 'Fashion limpio, brillante y muy marca.', primaryColor: '#111827', accentColor: '#f59e0b', pageBackgroundColor: '#fff8eb', backgroundMode: 'gradient', backgroundTreatment: 'mesh',   heroHeight: 'immersive', logoSize: 'lg', bannerIntensity: 'bold',   chatDensity: 'comfortable', heroCurve: 'deep', carouselStyle: 'editorial', socialVisibility: 'minimal', fontFamily: 'IBM Plex Sans',     userBubbleColor: '#111827', agentBubbleColor: '#fffaf0' },
  { id: 'resort',   label: 'Resort Soft',    description: 'Ligero, solar y con tono lifestyle.',    primaryColor: '#0f766e', accentColor: '#f4a261', pageBackgroundColor: '#f5fffb', backgroundMode: 'gradient', backgroundTreatment: 'mesh',   heroHeight: 'balanced', logoSize: 'md', bannerIntensity: 'soft',   chatDensity: 'comfortable', heroCurve: 'soft', carouselStyle: 'glass',   socialVisibility: 'auto',    fontFamily: 'Manrope',           userBubbleColor: '#0f766e', agentBubbleColor: '#f6fffd' },
  { id: 'midnight', label: 'Midnight Club',  description: 'Mas oscuro, sobrio y con caracter.',     primaryColor: '#020617', accentColor: '#38bdf8', pageBackgroundColor: '#eaf4ff', backgroundMode: 'gradient', backgroundTreatment: 'canvas', heroHeight: 'immersive', logoSize: 'md', bannerIntensity: 'bold',   chatDensity: 'compact',     heroCurve: 'deep', carouselStyle: 'compact', socialVisibility: 'minimal', fontFamily: 'Space Grotesk',     userBubbleColor: '#020617', agentBubbleColor: '#f8fbff' },
  { id: 'atelier',  label: 'Atelier Rose',   description: 'Editorial suave para belleza o moda.',   primaryColor: '#9f1239', accentColor: '#fda4af', pageBackgroundColor: '#fff4f7', backgroundMode: 'gradient', backgroundTreatment: 'grain',  heroHeight: 'balanced', logoSize: 'lg', bannerIntensity: 'medium', chatDensity: 'comfortable', heroCurve: 'deep', carouselStyle: 'editorial', socialVisibility: 'minimal', fontFamily: 'Fraunces',          userBubbleColor: '#9f1239', agentBubbleColor: '#fff7fb' },
] as const;

const FONTS = ['Plus Jakarta Sans', 'Space Grotesk', 'DM Sans', 'IBM Plex Sans', 'Manrope', 'Fraunces'];

function normalizeLayoutTemplate(value: string) {
  switch (value) {
    case 'profile_halo':
    case 'portrait':
      return 'stack';
    case 'column_layout':
    case 'column_story':
      return 'column_story';
    case 'split_editorial':
    case 'glow':
      return 'split';
    case 'agent_spotlight':
    case 'stage':
      return 'spotlight';
    case 'swipe_story':
      return 'swipe_story';
    case 'storefront_stack':
      return 'storefront';
    default:
      return value || 'stack';
  }
}

function getBackgroundFill(mode: string, treatment: string, base: string, primary: string, accent: string) {
  if (mode === 'solid') return base;
  if (treatment === 'plain') {
    return mode === 'gradient'
      ? `linear-gradient(180deg, ${base} 0%, ${primary}10 100%)`
      : base;
  }
  if (treatment === 'grid') {
    return `linear-gradient(180deg, ${base} 0%, ${base} 100%), linear-gradient(rgba(17,17,16,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,16,0.06) 1px, transparent 1px)`;
  }
  if (treatment === 'grain') {
    return `radial-gradient(circle at 20% 20%, ${primary}12, transparent 28%), radial-gradient(circle at 80% 0%, ${accent}14, transparent 32%), linear-gradient(180deg, ${base} 0%, ${base} 100%)`;
  }
  if (treatment === 'canvas') {
    return `radial-gradient(circle at 18% 16%, ${primary}28, transparent 24%), radial-gradient(circle at 78% 12%, ${accent}1f, transparent 30%), linear-gradient(180deg, ${base} 0%, ${base} 100%)`;
  }
  return `radial-gradient(circle at top, ${primary}16, transparent 24%), radial-gradient(circle at 85% 12%, ${accent}14, transparent 28%), linear-gradient(180deg, ${base} 0%, ${base} 100%)`;
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const safe = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized.padEnd(6, '0').slice(0, 6);
  const int = Number.parseInt(safe, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getComponentSkin(style: string, primary: string, accent: string, pageBackground: string) {
  const primarySoft = hexToRgba(primary, 0.12);
  const primaryMid = hexToRgba(primary, 0.22);
  const accentSoft = hexToRgba(accent, 0.12);
  const accentMid = hexToRgba(accent, 0.18);
  const shared = {
    cardStyle: { backgroundColor: hexToRgba(pageBackground, 0.82), borderColor: primarySoft },
    softCardStyle: { background: `linear-gradient(180deg, ${hexToRgba(pageBackground, 0.88)} 0%, ${primarySoft} 100%)`, borderColor: primarySoft },
    socialStyle: { backgroundColor: primarySoft, color: primary },
    secondaryStyle: { backgroundColor: hexToRgba(pageBackground, 0.92), borderColor: primarySoft, color: primary },
    agentStyle: { background: `linear-gradient(180deg, ${hexToRgba(pageBackground, 0.9)} 0%, ${accentSoft} 100%)`, borderColor: accentSoft },
  };
  switch (style) {
    case 'glass':
      return {
        shell: 'backdrop-blur-md',
        card: 'border border-white/65 bg-white/55 shadow-[0_12px_28px_rgba(15,23,42,0.08)]',
        softCard: 'border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0.28)_100%)] shadow-[0_10px_24px_rgba(15,23,42,0.07)] backdrop-blur-md',
        primaryCta: 'text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]',
        secondaryCta: 'border border-white/60 bg-white/72 text-ink-700 shadow-[0_8px_18px_rgba(15,23,42,0.06)]',
        social: 'bg-[rgba(255,255,255,0.72)] shadow-[0_8px_16px_rgba(15,23,42,0.06)]',
        agent: 'border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.34)_100%)] text-ink-800 shadow-[0_12px_28px_rgba(15,23,42,0.08)]',
        cardStyle: { backgroundColor: hexToRgba(pageBackground, 0.62), borderColor: hexToRgba(primary, 0.16) },
        softCardStyle: { background: `linear-gradient(180deg, ${hexToRgba(pageBackground, 0.7)} 0%, ${hexToRgba(accent, 0.12)} 100%)`, borderColor: hexToRgba(primary, 0.14) },
        socialStyle: { backgroundColor: hexToRgba(pageBackground, 0.74), color: primary },
        secondaryStyle: { backgroundColor: hexToRgba(pageBackground, 0.78), borderColor: hexToRgba(primary, 0.14), color: primary },
        agentStyle: { background: `linear-gradient(180deg, ${hexToRgba(pageBackground, 0.76)} 0%, ${hexToRgba(accent, 0.14)} 100%)`, borderColor: hexToRgba(primary, 0.14) },
      };
    case 'neo_brutalism':
      return {
        shell: '',
        card: 'border-2 border-[#111110] bg-white shadow-[6px_6px_0_#111110]',
        softCard: 'border-2 border-[#111110] bg-white shadow-[6px_6px_0_#111110]',
        primaryCta: 'border-2 border-[#111110] text-white shadow-[4px_4px_0_#111110]',
        secondaryCta: 'border-2 border-[#111110] bg-[#fffdf8] text-[#111110] shadow-[4px_4px_0_#111110]',
        social: 'border-2 border-[#111110] bg-white shadow-[3px_3px_0_#111110]',
        agent: 'border-2 border-[#111110] bg-[#fffdf8] text-ink-900 shadow-[6px_6px_0_#111110]',
        cardStyle: { backgroundColor: hexToRgba(accent, 0.16) },
        softCardStyle: { backgroundColor: hexToRgba(accent, 0.16) },
        socialStyle: { backgroundColor: hexToRgba(primary, 0.12), color: '#111110' },
        secondaryStyle: { backgroundColor: hexToRgba(pageBackground, 0.96), color: '#111110' },
        agentStyle: { backgroundColor: hexToRgba(pageBackground, 0.96) },
      };
    case 'outline_minimal':
      return {
        shell: '',
        card: 'border border-[rgba(17,17,16,0.14)] bg-transparent shadow-none',
        softCard: 'border border-[rgba(17,17,16,0.14)] bg-transparent shadow-none',
        primaryCta: 'border border-[rgba(17,17,16,0.14)] text-ink-900 shadow-none',
        secondaryCta: 'border border-[rgba(17,17,16,0.14)] bg-transparent text-ink-700 shadow-none',
        social: 'border border-[rgba(17,17,16,0.14)] bg-transparent shadow-none',
        agent: 'border border-[rgba(17,17,16,0.14)] bg-transparent text-ink-800 shadow-none',
        cardStyle: { borderColor: primaryMid, backgroundColor: hexToRgba(pageBackground, 0.24) },
        softCardStyle: { borderColor: primaryMid, backgroundColor: hexToRgba(pageBackground, 0.12) },
        socialStyle: { borderColor: primaryMid, color: primary, backgroundColor: 'transparent' },
        secondaryStyle: { borderColor: primaryMid, color: primary, backgroundColor: 'transparent' },
        agentStyle: { borderColor: accentMid, backgroundColor: 'transparent' },
      };
    case 'solid_pop':
      return {
        shell: '',
        card: 'border border-transparent bg-white shadow-[0_14px_26px_rgba(15,23,42,0.08)]',
        softCard: 'border border-transparent text-white shadow-[0_14px_26px_rgba(15,23,42,0.12)]',
        primaryCta: 'text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]',
        secondaryCta: 'border border-transparent bg-white text-ink-800 shadow-[0_10px_20px_rgba(15,23,42,0.08)]',
        social: 'bg-white shadow-[0_8px_16px_rgba(15,23,42,0.08)]',
        agent: 'border border-transparent text-white shadow-[0_12px_24px_rgba(15,23,42,0.10)]',
        cardStyle: { backgroundColor: hexToRgba(pageBackground, 0.96) },
        softCardStyle: { background: `linear-gradient(135deg, ${primary}, ${accent})` },
        socialStyle: { backgroundColor: hexToRgba(pageBackground, 0.94), color: primary },
        secondaryStyle: { backgroundColor: hexToRgba(pageBackground, 0.96), color: primary },
        agentStyle: { background: `linear-gradient(135deg, ${primary}, ${accent})` },
      };
    default:
      return {
        shell: '',
        card: 'border border-[rgba(17,17,16,0.08)] bg-white/78 shadow-[0_10px_24px_rgba(15,23,42,0.06)]',
        softCard: 'border border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.025)] shadow-[0_10px_24px_rgba(15,23,42,0.05)]',
        primaryCta: 'text-white shadow-[0_10px_20px_rgba(15,23,42,0.12)]',
        secondaryCta: 'border border-[rgba(17,17,16,0.08)] bg-white/76 text-ink-700 shadow-[0_8px_18px_rgba(15,23,42,0.05)]',
        social: 'bg-[rgba(17,17,16,0.035)]',
        agent: 'border border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.025)] text-ink-800 shadow-[0_10px_24px_rgba(15,23,42,0.05)]',
        ...shared,
      };
  }
}

function getLinkBlockShape(style: string) {
  switch (style) {
    case 'neo_brutalism':
      return 'rounded-[16px]';
    case 'outline_minimal':
      return 'rounded-[18px]';
    case 'glass':
      return 'rounded-[22px]';
    case 'solid_pop':
      return 'rounded-[20px]';
    default:
      return 'rounded-full';
  }
}

function sanitizeMediaUrl(value: string) {
  const normalized = value.trim();
  const lowered = normalized.toLowerCase();
  if (!normalized || lowered.startsWith('data:') || lowered.startsWith('javascript:')) {
    return '';
  }
  return normalized;
}

function mapApi(connection: AppChatConnectionApiItem): Settings {
  return {
    enabled: connection.is_active,
    organizationSlug: connection.organization_slug,
    appName: connection.app_name,
    primaryColor: connection.primary_color,
    accentColor: connection.accent_color,
    pageBackgroundColor: connection.page_background_color,
    backgroundMode: connection.background_mode,
    backgroundTreatment: connection.background_treatment || 'mesh',
    heroHeight: connection.hero_height,
    logoSize: connection.logo_size,
    bannerIntensity: connection.banner_intensity,
    chatDensity: connection.chat_density,
    heroCurve: connection.hero_curve,
    carouselStyle: connection.carousel_style,
    socialVisibility: connection.social_visibility,
    componentStyle: connection.component_style || 'soft_cards',
    layoutTemplate: normalizeLayoutTemplate(connection.layout_template),
    backgroundImageUrl: sanitizeMediaUrl(connection.background_image_url),
    fontFamily: connection.font_family,
    presentationStyle: connection.presentation_style,
    userBubbleColor: connection.user_bubble_color,
    agentBubbleColor: connection.agent_bubble_color,
    headerLogoUrl: sanitizeMediaUrl(connection.header_logo_url),
    launcherLabel: connection.launcher_label,
    tickerEnabled: connection.ticker_enabled,
    tickerText: connection.ticker_text,
    showFeaturedProducts: connection.show_featured_products,
    instagramUrl: connection.instagram_url,
    tiktokUrl: connection.tiktok_url,
    whatsappUrl: connection.whatsapp_url,
    websiteUrl: connection.website_url,
    locationUrl: connection.location_url,
    iosBundleIds: connection.ios_bundle_ids ?? [],
    androidPackageNames: connection.android_package_names ?? [],
    allowedOrigins: connection.allowed_origins ?? [],
    requireAuthentication: connection.require_authentication,
    pushEnabled: connection.push_enabled,
    handoffEnabled: connection.handoff_enabled,
    restEndpoint: connection.rest_endpoint,
    publicAppUrl: connection.organization_slug ? `${window.location.origin}/${connection.organization_slug}/` : connection.public_app_url,
    androidSdkSnippet: connection.android_sdk_snippet,
    iosSdkSnippet: connection.ios_sdk_snippet,
    installStatus: connection.install_status,
    verifiedApps: connection.verified_apps ?? [],
    lastInstallCheckAt: connection.last_install_check_at,
  };
}

function textToList(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function validateOptionalUrl(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return `${label} debe usar http o https.`;
    }
    return null;
  } catch {
    return `${label} debe ser una URL valida completa.`;
  }
}

function normalizeInstagram(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://instagram.com/${trimmed.replace(/^@+/, '')}`;
}

function normalizeTikTok(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalizedHandle = trimmed.startsWith('@') ? trimmed : `@${trimmed.replace(/^@+/, '')}`;
  return `https://www.tiktok.com/${normalizedHandle}`;
}

function normalizeWhatsApp(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : trimmed;
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/* ── 1:1 live preview — mirrors AppChatPublicPage exactly ── */
export function LivePreview({ s, onAvatarClick, onHeroClick }: {
  s: Settings;
  onAvatarClick?: () => void;
  onHeroClick?: () => void;
}) {
  const heroBackground = s.backgroundImageUrl
    ? `linear-gradient(180deg, rgba(17,24,39,0.06), rgba(17,24,39,0.26)), ${s.backgroundImageUrl ? `url(${s.backgroundImageUrl})` : ''}`
    : `linear-gradient(160deg, ${s.primaryColor}30, ${s.accentColor}18 60%, rgba(255,255,255,0.9) 100%)`;

  const fontStack = s.fontFamily === 'Fraunces'
    ? '"Fraunces", Georgia, serif'
    : `"${s.fontFamily}", "Segoe UI", sans-serif`;

  /* Natural card width: 430px (same as public page max-w-[430px]).
     Scale so it fills 360px (aside width): 360/430 ≈ 0.837.
     Natural height (hero 220 + profile ~450) ≈ 670px × 0.837 ≈ 561px.
     Add ~30px bottom breathing room → 590px container.
     Center horizontally so scaled content sits flush on both sides. */
  const CARD_W = 430;
  const SCALE  = 0.837;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: '590px' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          marginLeft: `${-CARD_W / 2}px`,
          width: `${CARD_W}px`,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top center',
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: fontStack,
        }}
      >
        {/* ── exact structure from AppChatPublicPage ── */}
        <div className="overflow-hidden rounded-[34px] border border-white/70 bg-white/90 shadow-[0_24px_90px_rgba(15,23,42,0.14)] backdrop-blur">
          {/* Hero — click to change background */}
          <section
              className="group relative h-[220px] overflow-hidden"
              style={{
                backgroundImage: heroBackground,
                backgroundRepeat: 'no-repeat',
                backgroundSize: s.backgroundImageUrl ? 'cover' : undefined,
                backgroundPosition: 'center',
                pointerEvents: onHeroClick ? 'auto' : 'none',
              cursor: onHeroClick ? 'pointer' : undefined,
            }}
            onClick={onHeroClick}
          >
            <div className="absolute inset-x-0 bottom-[-1px] h-20 rounded-t-[100%] bg-white/70 backdrop-blur-sm" />
            {onHeroClick && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100" style={{ background: 'rgba(0,0,0,0.22)' }}>
                <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
                  <Camera size={14} className="text-ink-700" />
                  <span className="text-[12px] font-semibold text-ink-700">Cambiar fondo</span>
                </div>
              </div>
            )}
          </section>

          {/* Profile body */}
          <section className="relative bg-white/70 backdrop-blur-sm px-5 pb-6 pt-0">
            {/* Avatar — click to change */}
            <div className="absolute inset-x-0 top-0 flex -translate-y-1/2 justify-center">
              <div
                className="group/avatar relative"
                style={{
                  pointerEvents: onAvatarClick ? 'auto' : 'none',
                  cursor: onAvatarClick ? 'pointer' : undefined,
                }}
                onClick={onAvatarClick}
              >
                {s.headerLogoUrl ? (
                  <img
                    src={s.headerLogoUrl}
                    alt={s.appName}
                    className="h-28 w-28 rounded-full border-[8px] border-white bg-white/70 object-cover shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                  />
                ) : (
                  <div
                    className="flex h-28 w-28 items-center justify-center rounded-full border-[8px] border-white bg-white/70 text-[2rem] font-semibold tracking-[-0.08em] shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                    style={{ color: s.accentColor }}
                  >
                    {s.appName.slice(0, 4).toUpperCase()}
                  </div>
                )}
                {onAvatarClick && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity duration-150 group-hover/avatar:opacity-100" style={{ background: 'rgba(0,0,0,0.28)' }}>
                    <Camera size={18} className="text-white drop-shadow" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-16 text-center">
              <p className="text-[2rem] font-semibold tracking-[-0.06em] text-ink-950">{s.appName}</p>
              <p className="mt-2 text-[12px] uppercase tracking-[0.28em] text-ink-400">{s.launcherLabel || 'Virtual Store'}</p>
              {/* Icon row */}
              <div className="mt-5 flex items-center justify-center gap-3 text-ink-500">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(17,17,16,0.04)]"><Sparkles size={16} /></span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(17,17,16,0.04)]"><ShoppingBag size={16} /></span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(17,17,16,0.04)]"><MessageCircleMore size={16} /></span>
                {s.publicAppUrl ? (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(17,17,16,0.04)]"><ExternalLink size={16} /></span>
                ) : null}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 space-y-3">
              {s.tickerEnabled && s.tickerText ? (
                <div className="overflow-hidden rounded-[18px] border border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.03)] px-0 py-2">
                  <div className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                    {s.tickerText} · {s.tickerText}
                  </div>
                </div>
              ) : null}
              <div
                className="flex w-full items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-[15px] font-medium shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                style={{ backgroundColor: s.primaryColor, color: '#ffffff' }}
              >
                <MessageCircleMore size={17} />
                Hablar por chat
              </div>
              <div className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.025)] px-5 py-4 text-[15px] font-medium text-ink-800 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                <ShoppingBag size={17} />
                Ver catálogo
              </div>
              {s.handoffEnabled ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.025)] px-5 py-4 text-[15px] font-medium text-ink-800 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                  <Sparkles size={17} />
                  Necesito asesor
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Layout wireframe thumbnails ──────────────────────────── */
function LayoutWireframe({ id }: { id: string }) {
  const pid = `lw-${id}`;
  const c = {
    heroBg: '#dedad4', hatch: '#c4c0b8', bg: '#f7f5f2',
    card: '#edeae4', border: '#d8d3cc', text: '#c0bbb4',
    textSub: '#cccac4', product: '#d8d4cc', chat: '#e4e1db',
    primary: '#bfbab2',
  };
  const hatchDef = (
    <defs>
      <pattern id={`${pid}-h`} patternUnits="userSpaceOnUse" width="5" height="5">
        <line x1="0" y1="5" x2="5" y2="0" stroke={c.hatch} strokeWidth="0.65"/>
      </pattern>
    </defs>
  );
  const hatch = `url(#${pid}-h)`;

  if (id === 'stack') return (
    <svg viewBox="0 0 72 101" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {hatchDef}
      <rect x="0" y="0" width="72" height="25" fill={hatch}/>
      <rect x="0" y="0" width="72" height="25" fill={c.heroBg} fillOpacity="0.38"/>
      <path d="M0 25 Q36 17 72 25Z" fill={c.bg}/>
      <circle cx="36" cy="23" r="8" fill={c.bg} stroke={c.border} strokeWidth="1.5"/>
      <rect x="22" y="34" width="28" height="2.5" rx="1.25" fill={c.text}/>
      <rect x="26" y="38.5" width="20" height="1.8" rx="0.9" fill={c.textSub}/>
      <circle cx="28" cy="45" r="3" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <circle cx="36" cy="45" r="3" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <circle cx="44" cy="45" r="3" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <rect x="6" y="51" width="60" height="13" rx="4" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <rect x="6" y="67" width="14" height="14" rx="2" fill={c.product}/>
      <rect x="22" y="67" width="14" height="14" rx="2" fill={c.product}/>
      <rect x="38" y="67" width="14" height="14" rx="2" fill={c.product}/>
      <rect x="54" y="67" width="12" height="14" rx="2" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <line x1="6" y1="84.5" x2="66" y2="84.5" stroke={c.border} strokeWidth="0.6"/>
      <rect x="6" y="87" width="22" height="2.5" rx="1.25" fill={c.chat}/>
      <rect x="40" y="91.5" width="20" height="2.5" rx="1.25" fill={c.chat}/>
      <rect x="6" y="96" width="50" height="4.5" rx="2.25" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="62.5" cy="98.25" r="3.25" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
    </svg>
  );

  if (id === 'column_story') return (
    <svg viewBox="0 0 72 101" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {hatchDef}
      <rect x="0" y="0" width="72" height="23" fill={hatch}/>
      <rect x="0" y="0" width="72" height="23" fill={c.heroBg} fillOpacity="0.38"/>
      <path d="M0 23 Q36 15 72 23Z" fill={c.bg}/>
      <circle cx="36" cy="21" r="8" fill={c.bg} stroke={c.border} strokeWidth="1.5"/>
      <rect x="22" y="32" width="28" height="2.5" rx="1.25" fill={c.text}/>
      <rect x="26" y="37" width="20" height="1.8" rx="0.9" fill={c.textSub}/>
      <rect x="8" y="42" width="56" height="8" rx="4" fill={c.primary}/>
      <rect x="8" y="52.5" width="56" height="7" rx="3.5" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <rect x="8" y="61.5" width="56" height="7" rx="3.5" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <rect x="4" y="72" width="64" height="27" rx="5" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <rect x="9" y="77" width="18" height="17" rx="2" fill={c.product}/>
      <rect x="30" y="77" width="18" height="17" rx="2" fill={c.product}/>
      <rect x="51" y="77" width="11" height="17" rx="2" fill={c.product}/>
    </svg>
  );

  if (id === 'split') return (
    <svg viewBox="0 0 72 101" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {hatchDef}
      <rect x="0" y="0" width="72" height="22" fill={hatch}/>
      <rect x="0" y="0" width="72" height="22" fill={c.heroBg} fillOpacity="0.38"/>
      <circle cx="22" cy="20" r="7.5" fill={c.bg} stroke={c.border} strokeWidth="1.5"/>
      <rect x="6" y="30" width="26" height="2.5" rx="1.25" fill={c.text}/>
      <rect x="6" y="34.5" width="20" height="1.8" rx="0.9" fill={c.textSub}/>
      <circle cx="8" cy="41" r="2.5" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="14" cy="41" r="2.5" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="20" cy="41" r="2.5" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <rect x="42" y="24" width="24" height="19" rx="2.5" fill={c.product}/>
      <rect x="42" y="45" width="24" height="19" rx="2.5" fill={c.product}/>
      <rect x="6" y="66" width="60" height="11" rx="3.5" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <line x1="6" y1="81" x2="66" y2="81" stroke={c.border} strokeWidth="0.6"/>
      <rect x="6" y="83.5" width="22" height="2.5" rx="1.25" fill={c.chat}/>
      <rect x="40" y="88" width="20" height="2.5" rx="1.25" fill={c.chat}/>
      <rect x="6" y="93" width="50" height="4.5" rx="2.25" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="62.5" cy="95.25" r="3.25" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
    </svg>
  );

  if (id === 'spotlight') return (
    <svg viewBox="0 0 72 101" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {hatchDef}
      <rect x="0" y="0" width="72" height="40" fill={hatch}/>
      <rect x="0" y="0" width="72" height="40" fill={c.heroBg} fillOpacity="0.52"/>
      <circle cx="36" cy="15" r="9" fill={c.bg} stroke={c.border} strokeWidth="1.5"/>
      <rect x="6" y="31" width="60" height="16" rx="4.5" fill={c.bg} stroke={c.border} strokeWidth="0.8"/>
      <rect x="21" y="51" width="30" height="2.5" rx="1.25" fill={c.text}/>
      <rect x="25" y="56" width="22" height="1.8" rx="0.9" fill={c.textSub}/>
      <circle cx="28" cy="62" r="2.5" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="36" cy="62" r="2.5" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="44" cy="62" r="2.5" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <rect x="6" y="67" width="14" height="13" rx="2" fill={c.product}/>
      <rect x="22" y="67" width="14" height="13" rx="2" fill={c.product}/>
      <rect x="38" y="67" width="14" height="13" rx="2" fill={c.product}/>
      <rect x="54" y="67" width="12" height="13" rx="2" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <line x1="6" y1="84" x2="66" y2="84" stroke={c.border} strokeWidth="0.6"/>
      <rect x="6" y="86.5" width="22" height="2.5" rx="1.25" fill={c.chat}/>
      <rect x="40" y="91" width="20" height="2.5" rx="1.25" fill={c.chat}/>
      <rect x="6" y="96" width="50" height="4.5" rx="2.25" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="62.5" cy="98.25" r="3.25" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
    </svg>
  );

  if (id === 'swipe_story') return (
    <svg viewBox="0 0 72 101" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {hatchDef}
      <rect x="0" y="0" width="72" height="101" fill={hatch}/>
      <rect x="0" y="0" width="72" height="101" fill={c.heroBg} fillOpacity="0.52"/>
      <circle cx="36" cy="26" r="13" fill="#f7f5f2" fillOpacity="0.88" stroke={c.border} strokeWidth="1.5"/>
      <rect x="18" y="43" width="36" height="3" rx="1.5" fill="#f7f5f2" fillOpacity="0.78"/>
      <rect x="22" y="48.5" width="28" height="2" rx="1" fill="#f7f5f2" fillOpacity="0.48"/>
      <rect x="10" y="54.5" width="52" height="8.5" rx="4.25" fill="#f7f5f2" fillOpacity="0.82"/>
      <rect x="10" y="65" width="52" height="8" rx="4" fill="none" stroke="#f7f5f2" strokeOpacity="0.46" strokeWidth="0.8"/>
      <rect x="8" y="76" width="17" height="15" rx="2" fill="#f7f5f2" fillOpacity="0.22"/>
      <rect x="27.5" y="76" width="17" height="15" rx="2" fill="#f7f5f2" fillOpacity="0.22"/>
      <rect x="47" y="76" width="17" height="15" rx="2" fill="#f7f5f2" fillOpacity="0.22"/>
      <rect x="0" y="41" width="3.5" height="18" rx="1.75" fill="#f7f5f2" fillOpacity="0.48"/>
      <rect x="68.5" y="41" width="3.5" height="18" rx="1.75" fill="#f7f5f2" fillOpacity="0.48"/>
    </svg>
  );

  if (id === 'triptych') return (
    <svg viewBox="0 0 72 101" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {hatchDef}
      {/* Full bg */}
      <rect x="0" y="0" width="72" height="101" fill={c.bg}/>
      {/* Hero top band */}
      <rect x="0" y="0" width="72" height="38" fill={hatch}/>
      <rect x="0" y="0" width="72" height="38" fill={c.heroBg} fillOpacity="0.42"/>
      <path d="M16 38 Q36 32 56 38Z" fill={c.bg}/>
      {/* Left product strip */}
      <rect x="0" y="0" width="16" height="92" fill={c.product}/>
      <line x1="0" y1="18.5" x2="16" y2="18.5" stroke={c.bg} strokeWidth="1.2"/>
      <line x1="0" y1="37" x2="16" y2="37" stroke={c.bg} strokeWidth="1.2"/>
      <line x1="0" y1="55.5" x2="16" y2="55.5" stroke={c.bg} strokeWidth="1.2"/>
      <line x1="0" y1="74" x2="16" y2="74" stroke={c.bg} strokeWidth="1.2"/>
      {/* Right product strip */}
      <rect x="56" y="0" width="16" height="92" fill={c.product}/>
      <line x1="56" y1="14" x2="72" y2="14" stroke={c.bg} strokeWidth="1.2"/>
      <line x1="56" y1="32.5" x2="72" y2="32.5" stroke={c.bg} strokeWidth="1.2"/>
      <line x1="56" y1="51" x2="72" y2="51" stroke={c.bg} strokeWidth="1.2"/>
      <line x1="56" y1="69.5" x2="72" y2="69.5" stroke={c.bg} strokeWidth="1.2"/>
      {/* Center column bg (below hero) */}
      <rect x="16" y="38" width="40" height="54" fill={c.bg}/>
      {/* Logo circle */}
      <circle cx="36" cy="36" r="9" fill={c.bg} stroke={c.border} strokeWidth="1.5"/>
      {/* App name */}
      <rect x="24" y="48" width="24" height="2.2" rx="1.1" fill={c.text}/>
      <rect x="28" y="52.5" width="16" height="1.6" rx="0.8" fill={c.textSub}/>
      {/* Social icons */}
      <rect x="25" y="57" width="5.5" height="5.5" rx="1.5" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <rect x="33.25" y="57" width="5.5" height="5.5" rx="1.5" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <rect x="41.5" y="57" width="5.5" height="5.5" rx="1.5" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      {/* Chat box */}
      <rect x="18" y="66" width="36" height="22" rx="3" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <rect x="21" y="70" width="22" height="1.8" rx="0.9" fill={c.chat}/>
      <rect x="25" y="74" width="16" height="1.8" rx="0.9" fill={c.chat}/>
      <rect x="21" y="78.5" width="25" height="3" rx="1.5" fill={c.bg} stroke={c.border} strokeWidth="0.5"/>
      <circle cx="49" cy="80" r="2" fill={c.primary} stroke={c.border} strokeWidth="0.5"/>
      {/* Bottom bar */}
      <rect x="0" y="92" width="72" height="9" fill={c.bg}/>
      <line x1="0" y1="92" x2="72" y2="92" stroke={c.border} strokeWidth="0.6"/>
      <circle cx="18" cy="96.5" r="2.5" fill={c.card} stroke={c.border} strokeWidth="0.6"/>
      <circle cx="36" cy="96.5" r="2.5" fill={c.primary} stroke={c.border} strokeWidth="0.6"/>
      <circle cx="54" cy="96.5" r="2.5" fill={c.card} stroke={c.border} strokeWidth="0.6"/>
      {/* Store badge top-left */}
      <circle cx="8" cy="8" r="4.5" fill={c.bg} fillOpacity="0.82" stroke={c.border} strokeWidth="0.7"/>
    </svg>
  );

  if (id === 'storefront') return (
    <svg viewBox="0 0 72 101" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      {hatchDef}
      <rect x="0" y="0" width="72" height="20" fill={hatch}/>
      <rect x="0" y="0" width="72" height="20" fill={c.heroBg} fillOpacity="0.38"/>
      <path d="M0 20 Q36 13 72 20Z" fill={c.bg}/>
      <circle cx="36" cy="18" r="7" fill={c.bg} stroke={c.border} strokeWidth="1.5"/>
      <rect x="4" y="26" width="64" height="19" rx="4.5" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <rect x="20" y="29.5" width="32" height="2.5" rx="1.25" fill={c.text}/>
      <circle cx="26" cy="38" r="2.5" fill={c.bg} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="33" cy="38" r="2.5" fill={c.bg} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="40" cy="38" r="2.5" fill={c.bg} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="47" cy="38" r="2.5" fill={c.bg} stroke={c.border} strokeWidth="0.7"/>
      <rect x="4" y="48" width="15" height="15" rx="2" fill={c.product}/>
      <rect x="21" y="48" width="15" height="15" rx="2" fill={c.product}/>
      <rect x="38" y="48" width="15" height="15" rx="2" fill={c.product}/>
      <rect x="55" y="48" width="13" height="15" rx="2" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <rect x="6" y="66" width="60" height="11" rx="3.5" fill={c.card} stroke={c.border} strokeWidth="0.8"/>
      <line x1="6" y1="81" x2="66" y2="81" stroke={c.border} strokeWidth="0.6"/>
      <rect x="6" y="83.5" width="22" height="2.5" rx="1.25" fill={c.chat}/>
      <rect x="40" y="88" width="20" height="2.5" rx="1.25" fill={c.chat}/>
      <rect x="6" y="93" width="50" height="4.5" rx="2.25" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
      <circle cx="62.5" cy="95.25" r="3.25" fill={c.card} stroke={c.border} strokeWidth="0.7"/>
    </svg>
  );

  return null;
}

function AppChatPreviewCard({ s, agentGreeting, onAvatarClick, onHeroClick }: {
  s: Settings;
  agentGreeting: string;
  onAvatarClick?: () => void;
  onHeroClick?: () => void;
}) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const heroBackground = s.backgroundImageUrl
    ? `linear-gradient(180deg, rgba(17,24,39,0.06), rgba(17,24,39,0.26)), ${s.backgroundImageUrl ? `url(${s.backgroundImageUrl})` : ''}`
    : `linear-gradient(160deg, ${s.primaryColor}30, ${s.accentColor}18 60%, rgba(255,255,255,0.9) 100%)`;
  const fontStack = s.fontFamily === 'Fraunces'
    ? '"Fraunces", Georgia, serif'
    : `"${s.fontFamily}", "Segoe UI", sans-serif`;
  const previewProducts = [
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  ];
  const previewTicker = (s.tickerText || 'Nuevo drop hoy').split(/\s+/).filter(Boolean).join(' ').trim().slice(0, 32) || 'Nuevo drop hoy';
  const previewPlaceholders = [
    'Escribe tu mensaje',
    'Por ejemplo: una talla',
    'Tambien puedes hacer una pregunta',
    'Estoy aqui',
  ];
  const previewPlaceholder = previewPlaceholders[placeholderIndex] || previewPlaceholders[0];
  const heroHeight = s.heroHeight === 'immersive' ? 188 : s.heroHeight === 'compact' ? 154 : 172;
  const logoSize = s.logoSize === 'lg' ? 108 : s.logoSize === 'sm' ? 84 : 96;
  const bannerHeight = s.bannerIntensity === 'bold' ? 86 : s.bannerIntensity === 'soft' ? 68 : 76;
  const bannerTextSize = s.bannerIntensity === 'bold' ? '2.8' : s.bannerIntensity === 'soft' ? '2.1' : '2.45';
  const bannerTextOpacity = s.bannerIntensity === 'bold' ? '0.82' : s.bannerIntensity === 'soft' ? '0.62' : '0.72';
  const productCardWidth = s.chatDensity === 'compact' ? 60 : 66;
  const messageGap = s.chatDensity === 'compact' ? 'gap-2' : 'gap-2.5';
  const bubblePadding = s.chatDensity === 'compact' ? 'px-3 py-2' : 'px-3 py-2.5';
  const bubbleTextClass = s.chatDensity === 'compact' ? 'text-[12px] leading-[1.34]' : 'text-[12.5px] leading-[1.4]';
  const inputHeight = s.chatDensity === 'compact' ? 'h-8' : 'h-9';
  const curveHeight = s.heroCurve === 'deep' ? 'h-20' : s.heroCurve === 'sharp' ? 'h-12' : 'h-16';
  const curveRadius = s.heroCurve === 'deep' ? 'rounded-t-[115%]' : s.heroCurve === 'sharp' ? 'rounded-t-[82%]' : 'rounded-t-[100%]';
  const miniStoreButtonClass =
    s.carouselStyle === 'editorial'
      ? 'border border-white/70 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-md'
      : s.carouselStyle === 'compact'
        ? 'border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.03)] shadow-[0_6px_16px_rgba(15,23,42,0.04)]'
        : 'border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.34)_100%)] shadow-[0_8px_18px_rgba(15,23,42,0.06)] backdrop-blur-md';
  const carouselCardClass = s.carouselStyle === 'editorial'
    ? 'rounded-[18px] border border-[rgba(17,17,16,0.05)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]'
    : s.carouselStyle === 'compact'
      ? 'rounded-[11px] border border-[rgba(17,17,16,0.06)] shadow-[0_4px_10px_rgba(15,23,42,0.035)]'
      : 'rounded-[13px] border border-[rgba(17,17,16,0.06)] shadow-[0_5px_14px_rgba(15,23,42,0.03)]';
  const previewSocialItems = [
    s.instagramUrl ? <Instagram key="instagram" size={14} /> : null,
    s.tiktokUrl ? <Music2 key="tiktok" size={14} /> : null,
    s.whatsappUrl ? <MessageCircleMore key="whatsapp" size={14} /> : null,
    s.websiteUrl ? <Globe key="website" size={14} /> : null,
    s.locationUrl ? <MapPin key="location" size={14} /> : null,
  ].filter(Boolean);
  const visiblePreviewSocialItems = previewSocialItems;
  const layoutTemplate = normalizeLayoutTemplate(s.layoutTemplate);
  const shellBackground = getBackgroundFill(s.backgroundMode, s.backgroundTreatment, s.pageBackgroundColor, s.primaryColor, s.accentColor);
  const skin = getComponentSkin(s.componentStyle, s.primaryColor, s.accentColor, s.pageBackgroundColor);
  const linkShapeClass = getLinkBlockShape(s.componentStyle);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderVisible(false);
      window.setTimeout(() => {
        setPlaceholderIndex((current) => (current + 1) % previewPlaceholders.length);
        setPlaceholderVisible(true);
      }, 520);
    }, 4200);
    return () => window.clearInterval(timer);
    }, [previewPlaceholders.length]);

  const identityBlock = (
    <div className={layoutTemplate === 'split' ? 'text-left' : 'text-center'}>
      <p className="text-[1.76rem] font-semibold tracking-[-0.06em] text-ink-950">{s.appName}</p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-ink-400">{s.launcherLabel || 'Virtual Store'}</p>
    </div>
  );
  const socialRow = visiblePreviewSocialItems.length > 0 ? (
    <div className={`flex items-center gap-3 text-ink-500 ${layoutTemplate === 'split' ? 'justify-start' : 'justify-center'}`}>
      {visiblePreviewSocialItems.map((icon, index) => (
        <span key={`preview-social-${index}`} className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${skin.social}`} style={skin.socialStyle}>
          {icon}
        </span>
      ))}
    </div>
  ) : null;
  const agentIntro = (
    <div
      className={`rounded-[20px] px-4 py-3 ${layoutTemplate === 'spotlight' && s.componentStyle !== 'neo_brutalism' ? 'text-white' : 'text-ink-800'} ${skin.agent}`}
      style={skin.agentStyle}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${layoutTemplate === 'spotlight' || s.componentStyle === 'solid_pop' ? 'bg-white/14 text-white' : 'text-white'}`} style={layoutTemplate === 'spotlight' || s.componentStyle === 'solid_pop' ? undefined : { backgroundColor: s.primaryColor }}>
          {s.appName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${layoutTemplate === 'spotlight' || s.componentStyle === 'solid_pop' ? 'text-white/70' : 'text-ink-400'}`}>Sales Agent</p>
          <p className={`mt-1 line-clamp-2 text-[11.5px] leading-4 ${layoutTemplate === 'spotlight' || s.componentStyle === 'solid_pop' ? 'text-white' : 'text-ink-700'}`}>{agentGreeting || 'Estoy aqui para ayudarte.'}</p>
        </div>
      </div>
    </div>
  );
  const portraitLinks = (
    <div className="mt-4 space-y-2.5">
      {['Hablar con el asesor', 'Ver tienda', 'Link destacado'].map((label, index) => (
        <div
          key={label}
          className={`${linkShapeClass} px-4 py-3 text-center text-[11px] font-semibold tracking-[0.12em] ${
            index === 0
              ? skin.primaryCta
              : skin.secondaryCta
          }`}
          style={index === 0 ? { backgroundColor: s.primaryColor } : skin.secondaryStyle}
        >
          {label}
        </div>
      ))}
    </div>
  );
  const swipeStoryLinks = (
    <div className="mt-4 space-y-3">
      {['Hablar con el asesor', 'Ver tienda'].map((label, index) => (
        <div
          key={label}
          className={`${linkShapeClass} px-4 py-3 text-center text-[11px] font-semibold tracking-[0.12em] ${
            index === 0 ? skin.primaryCta : skin.secondaryCta
          }`}
          style={index === 0 ? { backgroundColor: s.primaryColor } : skin.secondaryStyle}
        >
          {label}
        </div>
      ))}
    </div>
  );
  const columnStoryLinks = (
    <div className="mt-4 space-y-3">
      {['Hablar con el asesor', 'Ver tienda', 'Reserva'].map((label, index) => (
        <div
          key={label}
          className={`${linkShapeClass} px-4 py-3 text-center text-[11px] font-semibold tracking-[0.12em] ${
            index === 0 ? skin.primaryCta : skin.secondaryCta
          }`}
          style={index === 0 ? { backgroundColor: s.primaryColor } : skin.secondaryStyle}
        >
          {label}
        </div>
      ))}
    </div>
  );
  const storefrontShelf = (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {previewProducts.slice(0, 2).map((image) => (
        <div key={image} className={`overflow-hidden rounded-[18px] ${skin.card}`} style={skin.cardStyle}>
          <img src={image} alt="Preview product" className="aspect-[0.9] w-full object-cover" />
          <div className="px-2.5 py-2">
            <div className="h-2 w-16 rounded-full bg-[rgba(17,17,16,0.10)]" />
            <div className="mt-2 h-7 rounded-full bg-[rgba(17,17,16,0.05)]" />
          </div>
        </div>
      ))}
    </div>
  );
  const columnStoryFooter = (
    <div className="mt-6 flex w-full justify-center px-4 pb-4">
      <div className={`w-full max-w-[312px] rounded-[28px] px-5 py-6 ${skin.softCard}`} style={skin.softCardStyle}>
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400">Destacado</p>
        <p className="mt-2 text-[16px] font-semibold text-ink-900">Explora lo más reciente</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {previewProducts.slice(0, 3).map((image, index) => (
            <div key={image} className={`overflow-hidden rounded-[16px] ${skin.card}`} style={skin.cardStyle}>
              <img src={image} alt={`Preview ${index}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  const bodyShellClass =
    layoutTemplate === 'split'
      ? `mx-[-6px] rounded-[30px] px-5 pb-3 shadow-[0_20px_40px_rgba(15,23,42,0.08)] ${skin.softCard} ${skin.shell}`
      : layoutTemplate === 'spotlight'
        ? `mx-[-8px] rounded-[28px] px-5 pb-3 ${skin.softCard}`
        : layoutTemplate === 'storefront'
          ? `mx-[-4px] rounded-[26px] px-5 pb-3 shadow-[0_18px_34px_rgba(15,23,42,0.06)] ${skin.softCard}`
          : '';
  return (
    <div className="p-3" style={{ background: shellBackground, fontFamily: fontStack }}>
      <div className="overflow-hidden rounded-[34px] shadow-[0_24px_90px_rgba(15,23,42,0.14)]">
      <div className="relative mx-auto flex h-[560px] w-full max-w-[430px] flex-col overflow-hidden" style={{ backgroundColor: s.pageBackgroundColor }}>
        <section
            className="group relative overflow-hidden"
            style={{
              backgroundImage: heroBackground,
              backgroundRepeat: 'no-repeat',
              backgroundSize: s.backgroundImageUrl ? 'cover' : undefined,
              backgroundPosition: 'center',
              pointerEvents: onHeroClick ? 'auto' : 'none',
            cursor: onHeroClick ? 'pointer' : undefined,
            height: `${heroHeight}px`,
          }}
          onClick={onHeroClick}
        >
          {s.tickerEnabled && s.tickerText ? (
            <svg viewBox="0 0 100 24" className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-10 w-full" style={{ height: `${bannerHeight}px` }} preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <path id="appchatPreviewTickerArc2" d="M 4 15 Q 50 1 96 15" />
              </defs>
              <path d="M 0 24 Q 50 -1 100 24 L 100 24 L 0 24 Z" fill={s.pageBackgroundColor} fillOpacity="0.98" />
              <text fill={`rgba(17,17,16,${bannerTextOpacity})`} fontSize={bannerTextSize} fontWeight="600" letterSpacing="0.35">
                <textPath href="#appchatPreviewTickerArc2" startOffset="38%">{previewTicker}</textPath>
              </text>
              <text fill={`rgba(17,17,16,${bannerTextOpacity})`} fontSize={bannerTextSize} fontWeight="600" letterSpacing="0.35">
                <textPath href="#appchatPreviewTickerArc2" startOffset="138%">{previewTicker}</textPath>
              </text>
            </svg>
          ) : null}
          <div className={`absolute inset-x-0 bottom-[-1px] ${curveHeight} ${curveRadius}`} style={{ backgroundColor: s.pageBackgroundColor }} />
          {onHeroClick ? (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100" style={{ background: 'rgba(0,0,0,0.22)' }}>
              <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
                <Camera size={14} className="text-ink-700" />
                <span className="text-[12px] font-semibold text-ink-700">Cambiar fondo</span>
              </div>
            </div>
          ) : null}
        </section>

        <div className="pointer-events-none absolute inset-x-0 z-10 flex -translate-y-1/2 justify-center" style={{ top: `${heroHeight}px` }}>
          <div className="group/avatar relative pointer-events-auto" style={{ cursor: onAvatarClick ? 'pointer' : undefined }} onClick={onAvatarClick}>
            {s.headerLogoUrl ? (
              <img src={s.headerLogoUrl} alt={s.appName} className="rounded-full border-[6px] object-cover shadow-[0_16px_30px_rgba(15,23,42,0.14)]" style={{ height: `${logoSize}px`, width: `${logoSize}px`, borderColor: s.pageBackgroundColor, backgroundColor: s.pageBackgroundColor }} />
            ) : (
              <div className="flex items-center justify-center rounded-full border-[6px] font-semibold tracking-[-0.08em] shadow-[0_16px_30px_rgba(15,23,42,0.14)]" style={{ color: s.accentColor, height: `${logoSize}px`, width: `${logoSize}px`, fontSize: logoSize >= 108 ? '1.9rem' : logoSize <= 84 ? '1.45rem' : '1.7rem', borderColor: s.pageBackgroundColor, backgroundColor: s.pageBackgroundColor }}>
                {s.appName.slice(0, 4).toUpperCase()}
              </div>
            )}
            {onAvatarClick ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity duration-150 group-hover/avatar:opacity-100" style={{ background: 'rgba(0,0,0,0.28)' }}>
                <Camera size={18} className="text-white drop-shadow" />
              </div>
            ) : null}
          </div>
        </div>

          <section className={`relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-3 pt-0 ${bodyShellClass}`} style={{ backgroundColor: layoutTemplate === 'spotlight' ? undefined : s.pageBackgroundColor }}>
          <div style={{ paddingTop: `${Math.max(logoSize / 2 + 8, 52)}px` }}>
            {layoutTemplate === 'split' ? (
              <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3">
                <div>
                  {identityBlock}
                  <div className="mt-3">{socialRow}</div>
                  <div className="mt-4 space-y-2">
                    {['Entrar al drop', 'Ver tienda', 'Descubrir links'].map((label) => (
                      <div key={label} className={`rounded-[16px] px-4 py-3 text-center text-[11px] font-semibold ${skin.secondaryCta}`}>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`rounded-[22px] p-2 ${skin.softCard}`} style={skin.softCardStyle}>
                  <div className="grid gap-1.5">
                    {previewProducts.slice(0, 2).map((image) => (
                      <div key={image} className={`overflow-hidden ${carouselCardClass} ${skin.card}`} style={skin.cardStyle}>
                        <img src={image} alt="Preview product" className="aspect-square w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : layoutTemplate === 'spotlight' ? (
              <>
                {agentIntro}
                <div className="mt-4">{identityBlock}</div>
                <div className="mt-3">{socialRow}</div>
                <div className="mt-4 space-y-2">
                  {['Asesorarte ahora', 'Ver piezas', 'Ultimo drop'].map((label) => (
                    <div key={label} className={`rounded-[16px] px-4 py-3 text-center text-[11px] font-semibold ${s.componentStyle === 'neo_brutalism' ? 'border-2 border-[#111110] bg-white text-ink-900 shadow-[4px_4px_0_#111110]' : 'border border-white/12 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm'}`}>
                      {label}
                    </div>
                  ))}
                </div>
              </>
            ) : layoutTemplate === 'column_story' ? (
              <>
                <div className="text-center">
                  {identityBlock}
                  {columnStoryLinks}
                </div>
                {columnStoryFooter}
              </>
            ) : layoutTemplate === 'swipe_story' ? (
              <>
                <div className="text-center">
                  {identityBlock}
                  {swipeStoryLinks}
                  {s.showFeaturedProducts ? <div className="mt-6">{storefrontShelf}</div> : null}
                </div>
              </>
            ) : layoutTemplate === 'storefront' ? (
              <>
                <div className={`rounded-[22px] px-4 py-4 ${skin.card}`} style={skin.cardStyle}>
                  {identityBlock}
                  <div className="mt-3">{socialRow}</div>
                </div>
                {storefrontShelf}
              </>
            ) : (
              <>
                <div className="text-center">
                  {identityBlock}
                  <div className="mt-3">{socialRow}</div>
                </div>
                {portraitLinks}
                <div className="mt-4">{agentIntro}</div>
              </>
            )}
            {layoutTemplate === 'split' || layoutTemplate === 'storefront' ? <div className="mt-4">{agentIntro}</div> : null}
            {!s.showFeaturedProducts ? (
              <div className={`mt-3 flex ${layoutTemplate === 'split' ? 'justify-start' : 'justify-center'}`}>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${miniStoreButtonClass}`}
                  style={{ color: s.primaryColor }}
                >
                  <ShoppingBag size={12} />
                  Ver tienda
                </span>
              </div>
            ) : null}
          </div>

            {s.showFeaturedProducts ? (
              <div className="mt-3 -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-1.5">
                {previewProducts.map((image) => (
                    <div key={image} className={`shrink-0 overflow-hidden ${carouselCardClass} ${skin.card}`} style={{ ...skin.cardStyle, width: `${productCardWidth}px` }}>
                    <img src={image} alt="Preview product" className="aspect-[0.74] h-full w-full object-cover" />
                  </div>
                ))}
                  <div className={`flex shrink-0 flex-col items-center justify-center px-2 py-2 text-center ${carouselCardClass} ${skin.softCard}`} style={{ ...skin.softCardStyle, width: `${productCardWidth}px` }}>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-ink-900">
                      <ShoppingBag size={13} />
                    </span>
                    <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-500">Ver tienda</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[rgba(17,17,16,0.05)] pt-2">
            <div className="min-h-0 flex-1 overflow-hidden px-0.5 py-0.5">
              <div className={`mx-auto flex min-h-full w-full flex-col justify-end text-[14px] ${messageGap}`}>
                <div className="flex justify-start">
                  <div className="flex max-w-[88%] items-end gap-2">
                    {s.headerLogoUrl ? (
                      <img src={s.headerLogoUrl} alt={s.appName} className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
                    ) : (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-card" style={{ backgroundColor: s.primaryColor }}>
                        {s.appName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className={`rounded-[16px] border border-[rgba(17,17,16,0.07)] text-ink-800 shadow-[0_4px_12px_rgba(15,23,42,0.022)] ${bubblePadding}`} style={{ backgroundColor: s.agentBubbleColor || '#ffffff' }}>
                        <p className={`line-clamp-3 whitespace-pre-wrap tracking-[-0.01em] ${bubbleTextClass}`}>{agentGreeting || 'Hola. En que podemos ayudarte?'}</p>
                      </div>
                      <span className="px-1 text-[10px] text-slate-400">12:41 p. m.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              <div className="shrink-0 border-t border-[rgba(17,17,16,0.05)] pt-2">
              <div className="flex items-center gap-3 px-1">
                <div className="relative flex-1">
                  <span className={`pointer-events-none absolute left-0 top-1 text-[12.5px] text-[rgba(17,17,16,0.34)] transition-opacity duration-700 ${placeholderVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {previewPlaceholder}
                  </span>
                  <input value="" readOnly placeholder="" className={`w-full border-0 border-b border-[rgba(17,17,16,0.16)] bg-transparent px-0 pb-2 pt-1 text-[12.5px] text-ink-900 outline-none ${inputHeight}`} />
                  <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full" style={{ background: `linear-gradient(90deg, ${s.primaryColor}00 0%, ${s.primaryColor}66 20%, ${s.primaryColor} 50%, ${s.primaryColor}66 80%, ${s.primaryColor}00 100%)` }} />
                </div>
                <button className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition" style={{ color: s.primaryColor }}>
                  <MessageCircleMore size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}

/* ── Toggle switch ──────────────────────────────────────── */
function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink-900">{label}</p>
        {description ? <p className="mt-0.5 text-[11px] text-ink-400">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-brand-500' : 'bg-[rgba(17,17,16,0.15)]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

/* ── Color field ────────────────────────────────────────── */
function ColorField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/80 backdrop-blur-sm px-3 py-2.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">{label}</p>
        <p className="font-mono text-[12px] font-medium text-ink-700">{value}</p>
      </div>
    </div>
  );
}

/* ── Form field with label ──────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">{label}</label>
      {children}
    </div>
  );
}

const inputClass = 'w-full rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/80 backdrop-blur-sm px-4 py-2.5 text-[13px] text-ink-800 outline-none placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition';
const selectClass = `${inputClass} cursor-pointer appearance-none`;

/* ── Glass section card ─────────────────────────────────── */
function SectionCard({ eyebrow, title, step, children }: { eyebrow: string; title?: string; step?: number; children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card"
      style={{ boxShadow: 'var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.70)' }}
    >
      <div className="mb-4 flex items-start gap-3">
        {step !== undefined ? (
          <span className="xl:hidden mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-bold text-brand-600">
            {step}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="page-eyebrow">{eyebrow}</p>
          {title ? <p className="text-[15px] font-bold text-ink-900" style={{ letterSpacing: '-0.015em' }}>{title}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function AppChatPage() {
  const { showError, showSuccess } = useNotification();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [agentGreeting, setAgentGreeting] = useState('');
  const [saving, setSaving] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [iosBundleText, setIosBundleText] = useState('');
  const [androidPackageText, setAndroidPackageText] = useState('');
  const [allowedOriginsText, setAllowedOriginsText] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'avatar' | 'hero' | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const activePresetId = useMemo(() => {
    const match = PRESETS.find((preset) =>
      preset.primaryColor === settings.primaryColor &&
      preset.accentColor === settings.accentColor &&
      preset.pageBackgroundColor === settings.pageBackgroundColor &&
      preset.backgroundMode === settings.backgroundMode &&
      preset.backgroundTreatment === settings.backgroundTreatment &&
      preset.heroHeight === settings.heroHeight &&
      preset.logoSize === settings.logoSize &&
      preset.bannerIntensity === settings.bannerIntensity &&
      preset.chatDensity === settings.chatDensity &&
      preset.heroCurve === settings.heroCurve &&
      preset.carouselStyle === settings.carouselStyle &&
      preset.fontFamily === settings.fontFamily &&
      preset.userBubbleColor === settings.userBubbleColor &&
      preset.agentBubbleColor === settings.agentBubbleColor
    );
    return match?.id ?? null;
  }, [
    settings.accentColor,
    settings.agentBubbleColor,
    settings.fontFamily,
    settings.launcherLabel,
    settings.pageBackgroundColor,
    settings.backgroundMode,
    settings.backgroundTreatment,
    settings.heroHeight,
    settings.logoSize,
    settings.bannerIntensity,
    settings.chatDensity,
    settings.heroCurve,
    settings.carouselStyle,
    settings.primaryColor,
    settings.userBubbleColor,
  ]);

  useEffect(() => {
    Promise.all([api.getAppChatConnection(), api.getOnboardingProfile()])
      .then(([data, profile]) => {
        const mapped = mapApi(data);
        setSettings(mapped);
        setIosBundleText(mapped.iosBundleIds.join('\n'));
        setAndroidPackageText(mapped.androidPackageNames.join('\n'));
        setAllowedOriginsText(mapped.allowedOrigins.join('\n'));
        setAgentGreeting(profile.sales_agent_profile?.greeting_message || '');
      })
      .catch((error) => showError('App Chat', error instanceof Error ? error.message : 'No se pudo cargar App Chat.'));
  }, [showError]);

  function applyPreset(id: string) {
    const preset = PRESETS.find((item) => item.id === id);
    if (!preset) return;
    const { socialVisibility: _ignoredSocialVisibility, ...presetWithoutSocials } = preset;
    setSettings((current) => ({ ...current, ...presetWithoutSocials }));
  }

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function openFileThenCrop(file: File, target: 'avatar' | 'hero') {
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropTarget(target);
    };
    reader.readAsDataURL(file);
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) openFileThenCrop(file, 'avatar');
    e.target.value = '';
  }

  function handleHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) openFileThenCrop(file, 'hero');
    e.target.value = '';
  }

  async function handleCropApply(croppedFile: File) {
    if (!cropTarget) return;
    setUploadingMedia(true);
    try {
      const uploaded = await api.uploadAppChatMedia(croppedFile, cropTarget === 'avatar' ? 'logo' : 'hero');
      if (cropTarget === 'avatar') set('headerLogoUrl', uploaded.url);
      if (cropTarget === 'hero') set('backgroundImageUrl', uploaded.url);
      setCropSrc(null);
      setCropTarget(null);
      showSuccess('Media actualizada');
    } catch (error) {
      showError('App Chat', error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setUploadingMedia(false);
    }
  }

  function handleCropCancel() {
    setCropSrc(null);
    setCropTarget(null);
  }

  async function save() {
    const normalizedInstagram = normalizeInstagram(settings.instagramUrl);
    const normalizedTikTok = normalizeTikTok(settings.tiktokUrl);
    const normalizedWhatsApp = normalizeWhatsApp(settings.whatsappUrl);
    const normalizedWebsite = normalizeWebsite(settings.websiteUrl);
    const normalizedLocation = normalizeWebsite(settings.locationUrl);

    const urlErrors = [
      validateOptionalUrl(normalizedInstagram, 'Instagram'),
      validateOptionalUrl(normalizedTikTok, 'TikTok'),
      validateOptionalUrl(normalizedWhatsApp, 'WhatsApp'),
      validateOptionalUrl(normalizedWebsite, 'Sitio web'),
      validateOptionalUrl(normalizedLocation, 'Ubicacion'),
    ].filter(Boolean);
    if (urlErrors.length > 0) {
      showError('App Chat', urlErrors[0] as string);
      return;
    }

    const safeBackgroundImageUrl = sanitizeMediaUrl(settings.backgroundImageUrl);
    const safeHeaderLogoUrl = sanitizeMediaUrl(settings.headerLogoUrl);

    setSaving(true);
    try {
      const updated = await api.updateAppChatConnection({
        is_active: settings.enabled,
        app_name: settings.appName,
        primary_color: settings.primaryColor,
        accent_color: settings.accentColor,
        page_background_color: settings.pageBackgroundColor,
        background_mode: settings.backgroundMode,
        background_treatment: settings.backgroundTreatment,
        hero_height: settings.heroHeight,
        logo_size: settings.logoSize,
        banner_intensity: settings.bannerIntensity,
        chat_density: settings.chatDensity,
        hero_curve: settings.heroCurve,
        carousel_style: settings.carouselStyle,
        social_visibility: settings.socialVisibility,
        component_style: settings.componentStyle,
        layout_template: settings.layoutTemplate,
        background_image_url: safeBackgroundImageUrl,
        font_family: settings.fontFamily,
        presentation_style: settings.presentationStyle,
        user_bubble_color: settings.userBubbleColor,
        agent_bubble_color: settings.agentBubbleColor,
        header_logo_url: safeHeaderLogoUrl,
        launcher_label: settings.launcherLabel,
        ticker_enabled: settings.tickerEnabled,
        ticker_text: settings.tickerText,
        show_featured_products: settings.showFeaturedProducts,
        instagram_url: normalizedInstagram,
        tiktok_url: normalizedTikTok,
        whatsapp_url: normalizedWhatsApp,
        website_url: normalizedWebsite,
        location_url: normalizedLocation,
        ios_bundle_ids: textToList(iosBundleText),
        android_package_names: textToList(androidPackageText),
        allowed_origins: textToList(allowedOriginsText),
        require_authentication: settings.requireAuthentication,
        push_enabled: settings.pushEnabled,
        handoff_enabled: settings.handoffEnabled,
      });
      setSettings(mapApi(updated));
      showSuccess('App Chat guardado', 'El canal ya quedo actualizado.');
    } catch (error) {
      showError('App Chat', error instanceof Error ? error.message : 'No se pudo guardar la configuracion.');
    } finally {
      setSaving(false);
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      showSuccess(`${label} copiado`);
    } catch {
      showError('App Chat', `No se pudo copiar ${label.toLowerCase()}.`);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-stack gap-3">

        {/* Header */}
        <PageHeader
          eyebrow="Canales · App Chat"
          title="App Chat"
          description="Personaliza la identidad visual, publica el canal y conecta tu app movil."
        />

        {/* Presets strip */}
        <div
          className="rounded-3xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-2.5 shadow-card xl:hidden"
          style={{ boxShadow: 'var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.70)' }}
        >
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div>
              <p className="page-eyebrow">Presets de estilo</p>
              <p className="mt-0.5 text-[11px] text-ink-500">Aplica una direccion visual completa en un click.</p>
            </div>
            <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1 text-[11px] font-semibold text-ink-600">
              {activePresetId ? `${PRESETS.find((preset) => preset.id === activePresetId)?.label} activo` : 'Custom'}
            </span>
          </div>
          <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`group w-[164px] shrink-0 rounded-[18px] border px-2.5 py-2 text-left transition ${
                  activePresetId === preset.id
                    ? 'border-[rgba(17,17,16,0.18)] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                    : 'border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] hover:border-brand-300/60 hover:bg-brand-50/40'
                }`}
              >
                <div
                  className="overflow-hidden rounded-[18px] border border-white/50 bg-white/70 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                >
                  <div
                    className="h-10 w-full"
                    style={{ background: `linear-gradient(135deg, ${preset.primaryColor}, ${preset.accentColor})` }}
                  />
                  <div className="space-y-1.5 px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-full border border-white/70 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${preset.accentColor}, ${preset.primaryColor})` }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-ink-800">{preset.label}</p>
                        <p className="truncate text-[10px] uppercase tracking-[0.12em] text-ink-400">{preset.fontFamily}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="h-5 flex-1 rounded-full" style={{ backgroundColor: preset.userBubbleColor }} />
                      <span className="h-5 flex-1 rounded-full border border-[rgba(17,17,16,0.06)]" style={{ backgroundColor: preset.agentBubbleColor }} />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink-700 group-hover:text-ink-900">{preset.label}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-ink-500">{preset.description}</p>
                  </div>
                  {activePresetId === preset.id ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      Activo
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">

          {/* ── Left column / steps ─────────────────────────── */}
          <div className="order-2 space-y-4 xl:order-1">

            <div
              className="hidden rounded-3xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-2.5 shadow-card xl:block"
              style={{ boxShadow: 'var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.70)' }}
            >
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div>
                  <p className="page-eyebrow">Presets de estilo</p>
                  <p className="mt-0.5 text-[11px] text-ink-500">Aplica una direccion visual completa en un click.</p>
                </div>
                <span className="rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1 text-[11px] font-semibold text-ink-600">
                  {activePresetId ? `${PRESETS.find((preset) => preset.id === activePresetId)?.label} activo` : 'Custom'}
                </span>
              </div>
              <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={`desktop-${preset.id}`}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`group w-[164px] shrink-0 rounded-[18px] border px-2.5 py-2 text-left transition ${
                        activePresetId === preset.id
                          ? 'border-[rgba(17,17,16,0.18)] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                          : 'border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] hover:border-brand-300/60 hover:bg-brand-50/40'
                      }`}
                    >
                      <div className="overflow-hidden rounded-[18px] border border-white/50 bg-white/70 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                        <div
                          className="h-10 w-full"
                          style={{ background: `linear-gradient(135deg, ${preset.primaryColor}, ${preset.accentColor})` }}
                        />
                        <div className="space-y-1.5 px-2.5 py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-6 w-6 rounded-full border border-white/70 shadow-sm"
                              style={{ background: `linear-gradient(135deg, ${preset.accentColor}, ${preset.primaryColor})` }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-[12px] font-semibold text-ink-800">{preset.label}</p>
                              <p className="truncate text-[10px] uppercase tracking-[0.12em] text-ink-400">{preset.fontFamily}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="h-5 flex-1 rounded-full" style={{ backgroundColor: preset.userBubbleColor }} />
                            <span className="h-5 flex-1 rounded-full border border-[rgba(17,17,16,0.06)]" style={{ backgroundColor: preset.agentBubbleColor }} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-ink-700 group-hover:text-ink-900">{preset.label}</p>
                          <p className="mt-0.5 text-[11px] leading-4 text-ink-500">{preset.description}</p>
                        </div>
                        {activePresetId === preset.id ? (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                            Activo
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <SectionCard eyebrow="Componentes" title="Estilo visual de los bloques" step={1}>
              <div className="grid gap-3 xl:grid-cols-2">
                {COMPONENT_STYLES.map((style) => {
                  const isActive = settings.componentStyle === style.id;
                  const previewClass =
                    style.id === 'neo_brutalism'
                      ? 'border-2 border-[#111110] bg-[#ffd84d] shadow-[6px_6px_0_#111110]'
                      : style.id === 'glass'
                        ? 'border border-white/60 bg-white/50 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-md'
                        : style.id === 'outline_minimal'
                          ? 'border border-[rgba(17,17,16,0.18)] bg-transparent shadow-none'
                          : style.id === 'solid_pop'
                            ? 'border border-transparent bg-[linear-gradient(135deg,#111827,#ec4899)] shadow-[0_16px_28px_rgba(15,23,42,0.14)]'
                            : 'border border-[rgba(17,17,16,0.08)] bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.06)]';
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => set('componentStyle', style.id)}
                      className={`rounded-[24px] border p-4 text-left transition ${
                        isActive
                          ? 'border-[rgba(17,17,16,0.18)] bg-[rgba(255,255,255,0.82)] shadow-[0_18px_34px_rgba(15,23,42,0.07)]'
                          : 'border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] hover:border-brand-300/55 hover:bg-brand-50/35'
                      }`}
                    >
                      <div className="mb-4 rounded-[22px] bg-[rgba(17,17,16,0.03)] p-3">
                        <div className={`${previewClass} rounded-[18px] p-3`}>
                          <div className="mb-2 h-8 rounded-[14px] bg-white/80" />
                          <div className="grid grid-cols-[1fr_68px] gap-2">
                            <div className="space-y-2">
                              <div className={`${previewClass} h-8 rounded-[14px]`} />
                              <div className={`${previewClass} h-8 rounded-[14px]`} />
                            </div>
                            <div className={`${previewClass} h-[72px] rounded-[16px]`} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-ink-900">{style.label}</p>
                          <p className="mt-1 text-[12px] leading-5 text-ink-500">{style.description}</p>
                        </div>
                        {isActive ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                            Activo
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Layout" title="Estructura del canal" step={2}>
              <div className="grid gap-3 xl:grid-cols-2">
                {TEMPLATES.map((template) => {
                  const isActive = settings.layoutTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => set('layoutTemplate', template.id)}
                      className={`rounded-[20px] border p-3 text-left transition ${
                        isActive
                          ? 'border-[rgba(17,17,16,0.18)] bg-[rgba(255,255,255,0.82)] shadow-[0_14px_28px_rgba(15,23,42,0.07)]'
                          : 'border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] hover:border-brand-300/55 hover:bg-brand-50/35'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-[80px] shrink-0 overflow-hidden rounded-[10px] border transition ${isActive ? 'border-brand-200/60' : 'border-[rgba(17,17,16,0.08)]'} bg-[rgba(17,17,16,0.02)]`}>
                          <LayoutWireframe id={template.id} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12.5px] font-semibold leading-tight text-ink-900">{template.label}</p>
                            {isActive ? (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                Activo
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1.5 text-[11px] leading-[1.45] text-ink-500">{template.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* Identidad */}
            <SectionCard eyebrow="Identidad" title="Nombre y contenido" step={3}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombre del canal">
                  <input value={settings.appName} onChange={(e) => set('appName', e.target.value)} placeholder="App Chat" className={inputClass} />
                </Field>
                <Field label="Etiqueta corta">
                  <input value={settings.launcherLabel} onChange={(e) => set('launcherLabel', e.target.value)} placeholder="Virtual Store" className={inputClass} />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Mensaje de bienvenida">
                  <div className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.02)] px-3 py-2.5">
                    <p className="text-[13px] text-ink-700 leading-relaxed">{agentGreeting || <span className="text-ink-400 italic">Sin mensaje configurado</span>}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] text-ink-400">Configurable en</span>
                      <Link to="/admin/agents" className="text-[10px] font-semibold text-brand-600 hover:underline">Agentes → Identidad →</Link>
                    </div>
                  </div>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Texto del banner ticker">
                  <input value={settings.tickerText} onChange={(e) => set('tickerText', e.target.value)} placeholder="Nuevo drop hoy · envio gratis en compras desde 200k · 3 ultimas unidades" className={inputClass} />
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Instagram">
                  <input value={settings.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} placeholder="tu_marca o @tu_marca" className={inputClass} />
                </Field>
                <Field label="TikTok">
                  <input value={settings.tiktokUrl} onChange={(e) => set('tiktokUrl', e.target.value)} placeholder="tu_marca o @tu_marca" className={inputClass} />
                </Field>
                <Field label="WhatsApp">
                  <input value={settings.whatsappUrl} onChange={(e) => set('whatsappUrl', e.target.value)} placeholder="573001234567" className={inputClass} />
                </Field>
                <Field label="Sitio web">
                  <input value={settings.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="tu-marca.com" className={inputClass} />
                </Field>
                <Field label="Ubicacion">
                  <input value={settings.locationUrl} onChange={(e) => set('locationUrl', e.target.value)} placeholder="maps.google.com/... o link corto" className={inputClass} />
                </Field>
              </div>
            </SectionCard>

            {/* Apariencia */}
            <SectionCard eyebrow="Apariencia" title="Preset y ajustes base" step={4}>
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorField label="Color principal" value={settings.primaryColor} onChange={(v) => set('primaryColor', v)} />
                <ColorField label="Color acento"    value={settings.accentColor}  onChange={(v) => set('accentColor', v)} />
                <ColorField label="Fondo del canal" value={settings.pageBackgroundColor} onChange={(v) => set('pageBackgroundColor', v)} />
                <ColorField label="Burbuja usuario" value={settings.userBubbleColor}  onChange={(v) => set('userBubbleColor', v)} />
                <ColorField label="Burbuja agente"  value={settings.agentBubbleColor} onChange={(v) => set('agentBubbleColor', v)} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Estilo de fondo">
                  <div className="relative">
                    <select value={settings.backgroundMode} onChange={(e) => set('backgroundMode', e.target.value)} className={selectClass}>
                      <option value="soft">Suave</option>
                      <option value="gradient">Gradiente</option>
                      <option value="solid">Solido</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
                <Field label="Tratamiento del fondo">
                  <div className="relative">
                    <select value={settings.backgroundTreatment} onChange={(e) => set('backgroundTreatment', e.target.value)} className={selectClass}>
                      {BACKGROUND_TREATMENTS.map((treatment) => <option key={treatment.id} value={treatment.id}>{treatment.label}</option>)}
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
                <Field label="Tipografia">
                  <div className="relative">
                    <select value={settings.fontFamily} onChange={(e) => set('fontFamily', e.target.value)} className={selectClass}>
                      {FONTS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="Altura del hero">
                  <div className="relative">
                    <select value={settings.heroHeight} onChange={(e) => set('heroHeight', e.target.value)} className={selectClass}>
                      <option value="compact">Compacto</option>
                      <option value="balanced">Balanceado</option>
                      <option value="immersive">Inmersivo</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
                <Field label="Tamano del logo">
                  <div className="relative">
                    <select value={settings.logoSize} onChange={(e) => set('logoSize', e.target.value)} className={selectClass}>
                      <option value="sm">Pequeno</option>
                      <option value="md">Medio</option>
                      <option value="lg">Grande</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
                <Field label="Intensidad del banner">
                  <div className="relative">
                    <select value={settings.bannerIntensity} onChange={(e) => set('bannerIntensity', e.target.value)} className={selectClass}>
                      <option value="soft">Suave</option>
                      <option value="medium">Media</option>
                      <option value="bold">Alta</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
                <Field label="Densidad del chat">
                  <div className="relative">
                    <select value={settings.chatDensity} onChange={(e) => set('chatDensity', e.target.value)} className={selectClass}>
                      <option value="compact">Compacta</option>
                      <option value="comfortable">Comoda</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Curva del hero">
                  <div className="relative">
                    <select value={settings.heroCurve} onChange={(e) => set('heroCurve', e.target.value)} className={selectClass}>
                      <option value="soft">Suave</option>
                      <option value="deep">Profunda</option>
                      <option value="sharp">Corta</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
                <Field label="Estilo del carrusel">
                  <div className="relative">
                    <select value={settings.carouselStyle} onChange={(e) => set('carouselStyle', e.target.value)} className={selectClass}>
                      <option value="glass">Glass</option>
                      <option value="editorial">Editorial</option>
                      <option value="compact">Compacto</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
                <Field label="Iconos sociales">
                  <div className="relative">
                    <select value={settings.socialVisibility} onChange={(e) => set('socialVisibility', e.target.value)} className={selectClass}>
                      <option value="auto">Automaticos</option>
                      <option value="minimal">Minimos</option>
                      <option value="hidden">Ocultos</option>
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* Publicacion */}
            <SectionCard eyebrow="Publicacion" title="Canal y permisos" step={5}>
              <div className="mb-4 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">Link publico</p>
                <p className="mt-1.5 break-all text-[13px] font-medium text-ink-700">
                  {settings.publicAppUrl || <span className="text-ink-300">Pendiente de configuracion</span>}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => void copyValue(settings.publicAppUrl, 'Link publico')} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white">
                    <Copy size={11} />Copiar
                  </button>
                  {settings.publicAppUrl ? (
                    <a href={settings.publicAppUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white">
                      <ExternalLink size={11} />Abrir
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="space-y-1 divide-y divide-[rgba(17,17,16,0.06)]">
                <Toggle label="Canal activo" description="Habilita el canal para recibir conversaciones" checked={settings.enabled} onChange={(v) => set('enabled', v)} />
                <div className="pt-1"><Toggle label="Permitir asesor humano" description="Activa el traspaso a un agente en vivo" checked={settings.handoffEnabled} onChange={(v) => set('handoffEnabled', v)} /></div>

                <div className="pt-1"><Toggle label="Banner ticker" description="Muestra una cinta animada tipo Wall Street en la parte superior" checked={settings.tickerEnabled} onChange={(v) => set('tickerEnabled', v)} /></div>
                <div className="pt-1"><Toggle label="Bloques de producto" description="Muestra hasta 3 productos destacados arriba del chat" checked={settings.showFeaturedProducts} onChange={(v) => set('showFeaturedProducts', v)} /></div>
              </div>
            </SectionCard>

            {/* Avanzado */}
            <div
              className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md shadow-card"
              style={{ boxShadow: 'var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.70)' }}
            >
              <button type="button" onClick={() => setTechnicalOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[rgba(17,17,16,0.02)]">
                <div>
                  <p className="page-eyebrow">Avanzado</p>
                  <p className="text-[13px] text-ink-500">Bundle IDs, origins permitidos y snippets del SDK</p>
                </div>
                <ChevronDown size={16} className={`text-ink-400 transition-transform duration-200 ${technicalOpen ? 'rotate-180' : ''}`} />
              </button>
              {technicalOpen && (
                <div className="border-t border-[rgba(17,17,16,0.07)] px-5 pb-5 pt-4">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <Field label="iOS Bundle IDs (uno por linea)">
                      <textarea value={iosBundleText} onChange={(e) => setIosBundleText(e.target.value)} rows={4} placeholder="com.empresa.app" className={inputClass} style={{ resize: 'none' }} />
                    </Field>
                    <Field label="Android Package Names (uno por linea)">
                      <textarea value={androidPackageText} onChange={(e) => setAndroidPackageText(e.target.value)} rows={4} placeholder="com.empresa.app" className={inputClass} style={{ resize: 'none' }} />
                    </Field>
                    <Field label="Allowed Origins (uno por linea)">
                      <textarea value={allowedOriginsText} onChange={(e) => setAllowedOriginsText(e.target.value)} rows={4} placeholder="https://tuapp.com" className={inputClass} style={{ resize: 'none' }} />
                    </Field>
                    <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">SDK Endpoint</p>
                      <p className="mt-1.5 break-all font-mono text-[12px] text-ink-700">{settings.restEndpoint || <span className="text-ink-300">Pendiente</span>}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => void copyValue(settings.androidSdkSnippet, 'Snippet Android')} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white">Copiar Android</button>
                        <button onClick={() => void copyValue(settings.iosSdkSnippet, 'Snippet iOS')} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white">Copiar iOS</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right aside — first on mobile (hero), right column on xl ── */}
          <aside className="order-1 xl:order-2">
            <div className="xl:sticky xl:top-3 xl:pr-1">

              {/* 1:1 Live preview card */}
              <div
                className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md shadow-card"
                style={{ boxShadow: 'var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.70)' }}
              >
                {/* Minimal header — just status badge */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(17,17,16,0.07)' }}>
                  <div className="min-w-0">
                    <p className="page-eyebrow">Vista previa</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => set('headerLogoUrl', '')}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600 transition hover:bg-white"
                      >
                        Quitar logo
                      </button>
                      <button
                        type="button"
                        onClick={() => set('backgroundImageUrl', '')}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600 transition hover:bg-white"
                      >
                        Quitar fondo
                      </button>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    settings.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100/70 text-ink-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${settings.enabled ? 'bg-emerald-500' : 'bg-ink-400'}`} />
                    {settings.enabled ? 'Activo' : 'Borrador'}
                  </span>
                </div>

                {/* Layout indicator */}
                <div className="flex items-center gap-2.5 border-b border-[rgba(17,17,16,0.07)] px-3 py-2">
                  <div className="w-9 shrink-0 overflow-hidden rounded-[8px] border border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.02)]">
                    <LayoutWireframe id={normalizeLayoutTemplate(settings.layoutTemplate)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-400">Layout activo</p>
                    <p className="text-[11px] font-semibold text-ink-700">{TEMPLATES.find((t) => t.id === normalizeLayoutTemplate(settings.layoutTemplate))?.label ?? settings.layoutTemplate}</p>
                  </div>
                </div>

                {/* Hidden file inputs */}
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                <input ref={heroInputRef}   type="file" accept="image/*" className="hidden" onChange={handleHeroFile} />

                {/* Scaled 1:1 preview — bleeds to card edges */}
                <AppChatPreviewCard
                  s={settings}
                  agentGreeting={agentGreeting}
                  onAvatarClick={() => avatarInputRef.current?.click()}
                  onHeroClick={() => heroInputRef.current?.click()}
                />

                {settings.publicAppUrl ? (
                  <div className="flex justify-center border-t border-[rgba(17,17,16,0.07)] py-3">
                    <a
                      href={settings.publicAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white"
                    >
                      <ExternalLink size={11} />
                      Abrir en tab
                    </a>
                  </div>
                ) : null}
                <div className="border-t border-[rgba(17,17,16,0.07)] p-3">
                  <Button className="w-full" size="sm" onClick={() => void save()} disabled={saving || uploadingMedia}>
                    <Zap size={13} />
                    {uploadingMedia ? 'Subiendo media...' : saving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </div>

            </div>
          </aside>
        </div>
      </div>

      {/* Crop modal */}
      {cropSrc && cropTarget && (
        <CropModal
          src={cropSrc}
          aspect={cropTarget === 'avatar' ? 1 : 430 / 220}
          shape={cropTarget === 'avatar' ? 'round' : 'rect'}
          title={cropTarget === 'avatar' ? 'Logo / Avatar' : 'Imagen de fondo'}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
