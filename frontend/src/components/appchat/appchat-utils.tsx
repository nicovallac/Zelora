import type { ReactNode } from 'react';
import { Globe, Instagram, MapPin, MessageCircleMore, Music2 } from 'lucide-react';
import type { AppChatPublicConfig, MessageItem, PublicProductApiItem } from '../../services/api';

export const FALLBACK_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
];

export function getFontStack(fontFamily: string) {
  if (fontFamily === 'Fraunces') return '"Fraunces", Georgia, serif';
  return `"${fontFamily}", "Segoe UI", sans-serif`;
}

export function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
}

export function cleanDisplayText(value: string) {
  if (!value || (!value.includes('Ã') && !value.includes('Â'))) return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value.replaceAll('Â', '');
  }
}

export function mergeMessages(current: MessageItem[], incoming: MessageItem[]) {
  const merged = new Map<string, MessageItem>();
  for (const message of current) merged.set(message.id, message);
  for (const message of incoming) merged.set(message.id, message);
  return Array.from(merged.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getPromoCards(products: PublicProductApiItem[]) {
  return products.slice(0, 3);
}

export function getPromoCardImage(product: PublicProductApiItem, index: number) {
  return product.images?.[0] || FALLBACK_PRODUCT_IMAGES[index % FALLBACK_PRODUCT_IMAGES.length];
}

export function getProductImage(product: PublicProductApiItem, index: number) {
  return product.images?.[0] || FALLBACK_PRODUCT_IMAGES[index % FALLBACK_PRODUCT_IMAGES.length];
}

export function getProductPrice(product: PublicProductApiItem) {
  const prices = product.variants.map((v) => v.price).filter((p) => p > 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function formatCop(value: number) {
  if (value <= 0) return 'A cotizar';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export function getSocialItems(config: AppChatPublicConfig) {
  return [
    config.instagram_url ? { href: config.instagram_url, icon: <Instagram size={14} /> } : null,
    config.tiktok_url ? { href: config.tiktok_url, icon: <Music2 size={14} /> } : null,
    config.whatsapp_url ? { href: config.whatsapp_url, icon: <MessageCircleMore size={14} /> } : null,
    config.website_url ? { href: config.website_url, icon: <Globe size={14} /> } : null,
    config.location_url ? { href: config.location_url, icon: <MapPin size={14} /> } : null,
  ].filter(Boolean) as Array<{ href: string; icon: ReactNode }>;
}

export function normalizeLayoutTemplate(value: string) {
  switch (value) {
    case 'profile_halo':
    case 'portrait':
      return 'stack';
    case 'split_editorial':
    case 'glow':
      return 'split';
    case 'agent_spotlight':
    case 'stage':
      return 'spotlight';
    case 'column_layout':
    case 'column_story':
      return 'column_story';
    case 'swipe_story':
      return 'swipe_story';
    case 'storefront_stack':
      return 'storefront';
    default:
      return value || 'stack';
  }
}

export function getBackgroundFill(mode: string, treatment: string, base: string, primary: string, accent: string) {
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

export function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const safe = normalized.length === 3
    ? normalized.split('').map((c) => `${c}${c}`).join('')
    : normalized.padEnd(6, '0').slice(0, 6);
  const int = Number.parseInt(safe, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getComponentSkin(style: string, primary: string, accent: string, pageBackground: string) {
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
        card: 'border border-white/65 bg-white/55 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-md',
        softCard: 'border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0.28)_100%)] shadow-[0_10px_24px_rgba(15,23,42,0.07)] backdrop-blur-md',
        social: 'bg-[rgba(255,255,255,0.72)] shadow-[0_8px_16px_rgba(15,23,42,0.06)]',
        secondary: 'border border-white/60 bg-white/72 text-ink-700 shadow-[0_8px_18px_rgba(15,23,42,0.06)]',
        darkText: false,
        cardStyle: { backgroundColor: hexToRgba(pageBackground, 0.62), borderColor: hexToRgba(primary, 0.16) },
        softCardStyle: { background: `linear-gradient(180deg, ${hexToRgba(pageBackground, 0.7)} 0%, ${hexToRgba(accent, 0.12)} 100%)`, borderColor: hexToRgba(primary, 0.14) },
        socialStyle: { backgroundColor: hexToRgba(pageBackground, 0.74), color: primary },
        secondaryStyle: { backgroundColor: hexToRgba(pageBackground, 0.78), borderColor: hexToRgba(primary, 0.14), color: primary },
        agentStyle: { background: `linear-gradient(180deg, ${hexToRgba(pageBackground, 0.76)} 0%, ${hexToRgba(accent, 0.14)} 100%)`, borderColor: hexToRgba(primary, 0.14) },
      };
    case 'neo_brutalism':
      return {
        card: 'border-2 border-[#111110] bg-white shadow-[6px_6px_0_#111110]',
        softCard: 'border-2 border-[#111110] bg-white shadow-[6px_6px_0_#111110]',
        social: 'border-2 border-[#111110] bg-white shadow-[3px_3px_0_#111110]',
        secondary: 'border-2 border-[#111110] bg-[#fffdf8] text-[#111110] shadow-[4px_4px_0_#111110]',
        darkText: true,
        cardStyle: { backgroundColor: hexToRgba(accent, 0.16) },
        softCardStyle: { backgroundColor: hexToRgba(accent, 0.16) },
        socialStyle: { backgroundColor: hexToRgba(primary, 0.12), color: '#111110' },
        secondaryStyle: { backgroundColor: hexToRgba(pageBackground, 0.96), color: '#111110' },
        agentStyle: { backgroundColor: hexToRgba(pageBackground, 0.96) },
      };
    case 'outline_minimal':
      return {
        card: 'border border-[rgba(17,17,16,0.14)] bg-transparent shadow-none',
        softCard: 'border border-[rgba(17,17,16,0.14)] bg-transparent shadow-none',
        social: 'border border-[rgba(17,17,16,0.14)] bg-transparent shadow-none',
        secondary: 'border border-[rgba(17,17,16,0.14)] bg-transparent text-ink-700 shadow-none',
        darkText: true,
        cardStyle: { borderColor: primaryMid, backgroundColor: hexToRgba(pageBackground, 0.24) },
        softCardStyle: { borderColor: primaryMid, backgroundColor: hexToRgba(pageBackground, 0.12) },
        socialStyle: { borderColor: primaryMid, color: primary, backgroundColor: 'transparent' },
        secondaryStyle: { borderColor: primaryMid, color: primary, backgroundColor: 'transparent' },
        agentStyle: { borderColor: accentMid, backgroundColor: 'transparent' },
      };
    case 'solid_pop':
      return {
        card: 'border border-transparent bg-white shadow-[0_14px_26px_rgba(15,23,42,0.08)]',
        softCard: 'border border-transparent text-white shadow-[0_14px_26px_rgba(15,23,42,0.12)]',
        social: 'bg-white shadow-[0_8px_16px_rgba(15,23,42,0.08)]',
        secondary: 'border border-transparent bg-white text-ink-800 shadow-[0_10px_20px_rgba(15,23,42,0.08)]',
        darkText: false,
        cardStyle: { backgroundColor: hexToRgba(pageBackground, 0.96) },
        softCardStyle: { background: `linear-gradient(135deg, ${primary}, ${accent})` },
        socialStyle: { backgroundColor: hexToRgba(pageBackground, 0.94), color: primary },
        secondaryStyle: { backgroundColor: hexToRgba(pageBackground, 0.96), color: primary },
        agentStyle: { background: `linear-gradient(135deg, ${primary}, ${accent})` },
      };
    default:
      return {
        card: 'border border-[rgba(17,17,16,0.08)] bg-white/78 shadow-[0_10px_24px_rgba(15,23,42,0.06)]',
        softCard: 'border border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.025)] shadow-[0_10px_24px_rgba(15,23,42,0.05)]',
        social: 'bg-[rgba(17,17,16,0.035)]',
        secondary: 'border border-[rgba(17,17,16,0.08)] bg-white/76 text-ink-700 shadow-[0_8px_18px_rgba(15,23,42,0.05)]',
        darkText: true,
        ...shared,
      };
  }
}

export type AppChatSkin = ReturnType<typeof getComponentSkin>;

export function getLinkBlockShape(style: string) {
  switch (style) {
    case 'neo_brutalism': return 'rounded-[16px]';
    case 'outline_minimal': return 'rounded-[18px]';
    case 'glass': return 'rounded-[22px]';
    case 'solid_pop': return 'rounded-[20px]';
    default: return 'rounded-full';
  }
}

export function buildTickerLoop(text: string) {
  const compact = (text || '').split(/\s+/).filter(Boolean).join(' ').trim();
  const safe = compact.length > 28 ? `${compact.slice(0, 25).trim()}...` : compact;
  return safe;
}

export function renderRichMessage(
  content: string,
  textClassName: string,
  linkClassName: string,
  resolveProduct?: (href: string) => PublicProductApiItem | undefined
) {
  const linkPattern = /\[([^\]]+)\]\((\/[^)]+)\)/g;
  const lines = cleanDisplayText(content).split('\n');

  function renderLine(line: string, lineIndex: number) {
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkPattern.exec(line)) !== null) {
      const [fullMatch, label, href] = match;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        nodes.push(<span key={`text-${lineIndex}-${matchIndex}`}>{line.slice(lastIndex, matchIndex)}</span>);
      }

      const product = href.startsWith('/shop/') ? resolveProduct?.(href) : undefined;
      if (product) {
        nodes.push(
          <a
            key={`link-${lineIndex}-${href}-${matchIndex}`}
            href={href}
            className="mx-0.5 inline-flex max-w-full items-center gap-2 rounded-full border border-[rgba(17,17,16,0.08)] bg-white/80 px-2 py-1 align-middle shadow-[0_6px_14px_rgba(15,23,42,0.05)] backdrop-blur-sm"
          >
            <img src={getProductImage(product, 0)} alt={label} className="h-5 w-5 shrink-0 rounded-full object-cover" />
            <span className={`truncate ${linkClassName}`}>{label}</span>
          </a>
        );
      } else if (href.includes('?prefill=')) {
        nodes.push(
          <a
            key={`action-${lineIndex}-${href}-${matchIndex}`}
            href={href}
            className="mx-0.5 inline-flex max-w-full items-center rounded-full border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.05)] px-2.5 py-1 align-middle shadow-[0_4px_10px_rgba(15,23,42,0.04)]"
          >
            <span className={`truncate ${linkClassName}`}>{label}</span>
          </a>
        );
      } else {
        nodes.push(
          <a key={`link-${lineIndex}-${href}-${matchIndex}`} href={href} className={linkClassName}>
            {label}
          </a>
        );
      }
      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < line.length) {
      nodes.push(<span key={`tail-${lineIndex}-${lastIndex}`}>{line.slice(lastIndex)}</span>);
    }
    if (nodes.length === 0) {
      nodes.push(<span key={`empty-${lineIndex}`}>{line}</span>);
    }

    linkPattern.lastIndex = 0;
    return nodes;
  }

  return (
    <p className={`whitespace-pre-wrap tracking-[-0.01em] ${textClassName}`}>
      {lines.map((line, index) => (
        <span key={`line-${index}`}>
          {index > 0 ? <br /> : null}
          {renderLine(line, index)}
        </span>
      ))}
    </p>
  );
}
