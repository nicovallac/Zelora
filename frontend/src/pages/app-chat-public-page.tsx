import { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { api } from '../services/api';
import type { AppChatPublicConfig, MessageItem, PublicProductApiItem } from '../services/api';
import { AppChatMessageList } from '../components/appchat/appchat-message-list';
import { AppChatChatInput } from '../components/appchat/appchat-chat-input';
import { AppChatCatalogGrid, AppChatCatalogPanel } from '../components/appchat/appchat-catalog-grid';
import {
  buildTickerLoop,
  getBackgroundFill,
  getComponentSkin,
  getFontStack,
  getPromoCardImage,
  getPromoCards,
  getSocialItems,
  mergeMessages,
  normalizeLayoutTemplate,
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

export function AppChatPublicPage() {
  const { orgSlug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [config, setConfig] = useState<AppChatPublicConfig>(DEFAULT_CONFIG);
  const [products, setProducts] = useState<PublicProductApiItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState<MessageItem | null>(null);
  const [error, setError] = useState('');
  const [tickerProgress, setTickerProgress] = useState(0);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const catalogScrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const deliveredBotIdsRef = useRef<Set<string>>(new Set());
  const pendingBotMessagesRef = useRef<MessageItem[]>([]);
  const botRevealTimeoutRef = useRef<number | null>(null);
  const botTypingIntervalRef = useRef<number | null>(null);

  const [sessionId] = useState(() => {
    const key = `zelora_appchat_session_${orgSlug || 'public'}`;
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const next =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `public-app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, next);
    return next;
  });

  const socketPath = orgSlug && sessionId && sessionToken
    ? `/ws/appchat/${orgSlug}/${sessionId}/?session_token=${encodeURIComponent(sessionToken)}`
    : '';
  const { lastMessage } = useWebSocket(socketPath, 'none');

  // --- Bot typing animation ---

  function getBotReplyDelay(content: string) {
    return Math.max(850, Math.min(2400, 700 + content.trim().length * 18));
  }

  function getBotTypingStep(content: string) {
    return Math.max(14, Math.min(32, 2600 / Math.max(content.trim().length, 1)));
  }

  function clearBotAnimationTimers() {
    if (botRevealTimeoutRef.current) { window.clearTimeout(botRevealTimeoutRef.current); botRevealTimeoutRef.current = null; }
    if (botTypingIntervalRef.current) { window.clearInterval(botTypingIntervalRef.current); botTypingIntervalRef.current = null; }
  }

  function startTypingMessage(message: MessageItem) {
    const fullContent = message.content;
    const step = getBotTypingStep(fullContent);
    let visibleLength = 0;
    setIsBotTyping(false);
    setTypingMessage({ ...message, content: '' });
    botTypingIntervalRef.current = window.setInterval(() => {
      visibleLength = Math.min(visibleLength + 1, fullContent.length);
      setTypingMessage({ ...message, content: fullContent.slice(0, visibleLength) });
      if (visibleLength >= fullContent.length) {
        if (botTypingIntervalRef.current) { window.clearInterval(botTypingIntervalRef.current); botTypingIntervalRef.current = null; }
        setMessages((current) => mergeMessages(current, [message]));
        setTypingMessage(null);
        if (pendingBotMessagesRef.current.length > 0) { revealNextBotMessage(); } else { setIsBotTyping(false); }
      }
    }, step);
  }

  function revealNextBotMessage() {
    if (botRevealTimeoutRef.current || botTypingIntervalRef.current || pendingBotMessagesRef.current.length === 0) return;
    setIsBotTyping(true);
    const next = pendingBotMessagesRef.current[0];
    botRevealTimeoutRef.current = window.setTimeout(() => {
      pendingBotMessagesRef.current.shift();
      deliveredBotIdsRef.current.add(next.id);
      botRevealTimeoutRef.current = null;
      startTypingMessage(next);
    }, getBotReplyDelay(next.content));
  }

  function enqueueBotMessages(incoming: MessageItem[]) {
    const fresh = incoming.filter((m) => {
      if (m.role !== 'bot') return false;
      if (deliveredBotIdsRef.current.has(m.id)) return false;
      if (pendingBotMessagesRef.current.some((p) => p.id === m.id)) return false;
      return true;
    });
    if (fresh.length === 0) return;
    pendingBotMessagesRef.current.push(...fresh);
    revealNextBotMessage();
  }

  // --- Data loading ---

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await api.getPublicAppChatConnection(orgSlug);
        const access = await api.getAppChatSessionAccess(orgSlug, sessionId);
        if (!isMounted) return;
        setConfig(data);
        setSessionToken(access.session_token);
        const catalog = await api.getPublicProducts(orgSlug).catch(() => []);
        if (!isMounted) return;
        setProducts(catalog);
        const conversation = await api.getAppChatConversation(orgSlug, sessionId, access.session_token).catch(() => null);
        if (!isMounted) return;
        if (conversation && conversation.messages.length > 0) {
          deliveredBotIdsRef.current = new Set(conversation.messages.filter((m) => m.role === 'bot').map((m) => m.id));
          setMessages(conversation.messages);
        } else {
          deliveredBotIdsRef.current = new Set(['welcome']);
          setMessages([{ id: 'welcome', role: 'bot', content: data.welcome_message, timestamp: new Date().toISOString() }]);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'No se pudo abrir este chat.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void load();
    return () => { isMounted = false; clearBotAnimationTimers(); };
  }, [orgSlug, sessionId]);

  useEffect(() => {
    if (lastMessage?.type !== 'new_message') return;
    const raw = lastMessage.message as Record<string, unknown>;
    const id = typeof raw.id === 'string' ? raw.id : '';
    const role = typeof raw.role === 'string' ? raw.role : '';
    const content = typeof raw.content === 'string' ? raw.content : '';
    const timestamp = typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString();
    if (!id || !role || !content) return;
    const parsed = { id, role, content, timestamp } satisfies MessageItem;
    if (role === 'bot') { enqueueBotMessages([parsed]); return; }
    setMessages((current) => mergeMessages(current, [parsed]));
  }, [lastMessage]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, typingMessage, isBotTyping]);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 8000;
    function tick(now: number) {
      setTickerProgress(((now - start) % duration) / duration);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!catalogOpen) return;
    catalogScrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [catalogOpen]);

  const inputPlaceholders = useMemo(() => {
    const first = products[0]?.title;
    const second = products[1]?.title;
    return [
      'Escribe tu mensaje',
      first ? `Por ejemplo: ${first}` : 'Escribe aqui',
      second ? `Tambien puedes preguntar por ${second}` : 'Puedes hacer una pregunta si quieres',
      'Estoy aqui',
    ];
  }, [products]);

  useEffect(() => {
    if (input.trim()) return;
    const timer = window.setInterval(() => {
      setPlaceholderVisible(false);
      window.setTimeout(() => {
        setPlaceholderIndex((current) => (current + 1) % inputPlaceholders.length);
        setPlaceholderVisible(true);
      }, 520);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [input, inputPlaceholders.length]);

  useEffect(() => {
    const prefill = searchParams.get('prefill')?.trim();
    if (!prefill) return;
    setCatalogOpen(false);
    setInput(prefill);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(prefill.length, prefill.length);
    });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // --- Actions ---

  async function sendMessage() {
    const message = input.trim();
    if (!message || sending) return;
    const optimistic: MessageItem = { id: `user-${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]);
    setInput('');
    setError('');
    setSending(true);
    setIsBotTyping(true);
    try {
      const response = await api.sendAppChatMessage({ organization_slug: orgSlug, session_id: sessionId, session_token: sessionToken, message, platform: 'unknown' });
      setMessages((current) => {
        const withoutOptimistic = current.filter((item) => item.id !== optimistic.id);
        const nonBot = response.messages.filter((item) => item.role !== 'bot');
        return nonBot.length > 0 ? mergeMessages(withoutOptimistic, nonBot) : withoutOptimistic;
      });
      const botMessages = response.messages.filter((item) => item.role === 'bot');
      if (botMessages.length > 0) { enqueueBotMessages(botMessages); }
      else if (pendingBotMessagesRef.current.length === 0) { setIsBotTyping(false); }
    } catch (err) {
      setMessages((current) => current.slice(0, -1));
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.');
      setIsBotTyping(false);
      setTypingMessage(null);
      clearBotAnimationTimers();
    } finally {
      setSending(false);
    }
  }

  function openCatalog() {
    setCatalogOpen(true);
  }

  function askAboutProduct(product: PublicProductApiItem) {
    const prompt = `Me interesa ${product.title}. Quiero saber si me conviene, precio y disponibilidad.`;
    setCatalogOpen(false);
    setInput(prompt);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(prompt.length, prompt.length);
    });
  }

  // --- Derived values ---

  const fontSize = config.font_scale === 'lg' ? '15px' : config.font_scale === 'sm' ? '12px' : '14px';
  const tickerLoop = useMemo(() => buildTickerLoop(config.ticker_text), [config.ticker_text]);
  const primaryTickerOffset = `${40 - tickerProgress * 100}%`;
  const secondaryTickerOffset = `${140 - tickerProgress * 100}%`;

  const filteredProducts = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    const sorted = [...products].sort((a, b) => {
      const aIn = a.variants.some((v) => v.stock - v.reserved > 0);
      const bIn = b.variants.some((v) => v.stock - v.reserved > 0);
      if (aIn !== bIn) return aIn ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
    if (!query) return sorted;
    return sorted.filter((p) => {
      const haystack = [p.title, p.brand, p.category, ...(p.tags || []), ...(p.variants || []).map((v) => v.name)]
        .filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [catalogQuery, products]);

  const productHrefMap = useMemo(
    () => new Map<string, PublicProductApiItem>(products.map((p) => [`/shop/${orgSlug}/${p.id}`, p])),
    [orgSlug, products]
  );

  const socialItems = useMemo(() => getSocialItems(config), [config]);
  const layoutTemplate = normalizeLayoutTemplate(config.layout_template);
  const skin = getComponentSkin(config.component_style, config.primary_color, config.accent_color, config.page_background_color);

  const heroHeight = config.hero_height === 'immersive' ? 188 : config.hero_height === 'compact' ? 154 : 172;
  const logoSize = config.logo_size === 'lg' ? 108 : config.logo_size === 'sm' ? 84 : 96;
  const bannerHeight = config.banner_intensity === 'bold' ? 86 : config.banner_intensity === 'soft' ? 68 : 76;
  const bannerTextSize = config.banner_intensity === 'bold' ? '2.8' : config.banner_intensity === 'soft' ? '2.1' : '2.45';
  const bannerTextOpacity = config.banner_intensity === 'bold' ? '0.82' : config.banner_intensity === 'soft' ? '0.62' : '0.72';
  const productCardWidth = config.chat_density === 'compact' ? 70 : 78;
  const messageGap = config.chat_density === 'compact' ? 'gap-2' : 'gap-2.5';
  const bubblePadding = config.chat_density === 'compact' ? 'px-3 py-2.5' : 'px-3.5 py-3';
  const bubbleRadius = config.chat_density === 'compact' ? 'rounded-[16px]' : 'rounded-[18px]';
  const bubbleTextClass = config.chat_density === 'compact' ? 'text-[0.88em] leading-[1.38]' : 'text-[0.92em] leading-[1.48]';
  const inputHeightClass = config.chat_density === 'compact' ? 'h-10 text-[13px]' : 'h-11 text-[14px]';
  const curveHeight = config.hero_curve === 'deep' ? 'h-20' : config.hero_curve === 'sharp' ? 'h-12' : 'h-16';
  const curveRadius = config.hero_curve === 'deep' ? 'rounded-t-[115%]' : config.hero_curve === 'sharp' ? 'rounded-t-[82%]' : 'rounded-t-[100%]';
  const carouselCardClass = config.carousel_style === 'editorial'
    ? 'rounded-[18px] border border-[rgba(17,17,16,0.05)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]'
    : config.carousel_style === 'compact'
      ? 'rounded-[11px] border border-[rgba(17,17,16,0.06)] shadow-[0_4px_10px_rgba(15,23,42,0.035)]'
      : 'rounded-[15px] border border-[rgba(17,17,16,0.06)] shadow-[0_5px_14px_rgba(15,23,42,0.03)]';
  const miniStoreButtonClass =
    config.carousel_style === 'editorial'
      ? 'border border-white/70 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-md'
      : config.carousel_style === 'compact'
        ? 'border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.03)] shadow-[0_6px_16px_rgba(15,23,42,0.04)]'
        : 'border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.34)_100%)] shadow-[0_8px_18px_rgba(15,23,42,0.06)] backdrop-blur-md';

  const shellBackground = getBackgroundFill(config.background_mode, config.background_treatment, config.page_background_color, config.primary_color, config.accent_color);
  const heroBackground = config.background_image_url
    ? `linear-gradient(180deg, rgba(17,24,39,0.05), rgba(17,24,39,0.24)), url(${config.background_image_url})`
    : `linear-gradient(160deg, ${config.primary_color}22, ${config.accent_color}14 58%, rgba(255,255,255,0.94) 100%)`;

  // --- Shared component props ---

  const messageListProps = {
    messages, typingMessage, isBotTyping, scrollerRef, messageGap, fontSize,
    bubbleRadius, bubblePadding, bubbleTextClass, productHrefMap, config,
  };
  const chatInputProps = {
    input, sending, inputRef, inputHeightClass,
    primaryColor: config.primary_color,
    placeholder: inputPlaceholders[placeholderIndex] || 'Escribe tu mensaje',
    placeholderVisible,
    onChange: setInput,
    onSend: () => void sendMessage(),
  };

  // --- Reusable JSX blocks ---

  const identityBlock = (
    <div className={layoutTemplate === 'split' ? 'text-left' : 'text-center'}>
      <p className="text-[1.76rem] font-semibold tracking-[-0.06em] text-ink-950">{config.app_name}</p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-ink-400">{config.launcher_label || 'Virtual Store'}</p>
    </div>
  );

  const socialRow = socialItems.length > 0 ? (
    <div className={`flex items-center gap-3 text-ink-500 ${layoutTemplate === 'split' ? 'justify-start' : 'justify-center'}`}>
      {socialItems.map((item, index) => (
        <a
          key={`${item.href}-${index}`}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${skin.social}`}
          style={skin.socialStyle}
        >
          {item.icon}
        </a>
      ))}
    </div>
  ) : null;

  const featuredBlock = config.show_featured_products && getPromoCards(products).length > 0 ? (
    <div className="mt-4 -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-1.5">
        {getPromoCards(products).map((product, index) => (
          <a
            key={product.id}
            href={`/shop/${orgSlug}/${product.id}`}
            className={`group shrink-0 overflow-hidden ${carouselCardClass} ${skin.card}`}
            style={{ ...skin.cardStyle, width: `${productCardWidth}px` }}
          >
            <img
              src={getPromoCardImage(product, index)}
              alt={product.title}
              className="aspect-[0.74] h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          </a>
        ))}
        <a
          href="#catalogo"
          onClick={(e) => { e.preventDefault(); openCatalog(); }}
          className={`flex shrink-0 flex-col items-center justify-center px-2 py-3 text-center ${carouselCardClass} ${skin.softCard}`}
          style={{ ...skin.softCardStyle, width: `${productCardWidth}px` }}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink-900">
            <ShoppingBag size={15} />
          </span>
          <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Ver tienda</span>
        </a>
      </div>
    </div>
  ) : null;

  const miniStoreButton = !config.show_featured_products ? (
    <div className={`mt-3 flex ${layoutTemplate === 'split' ? 'justify-start' : 'justify-center'}`}>
      <button
        type="button"
        onClick={openCatalog}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:opacity-95 ${miniStoreButtonClass} ${config.component_style === 'neo_brutalism' ? 'border-2 border-[#111110] shadow-[4px_4px_0_#111110]' : ''}`}
        style={{ ...skin.secondaryStyle, color: config.primary_color }}
      >
        <ShoppingBag size={12} />
        Ver tienda
      </button>
    </div>
  ) : null;

  const logoEl = config.header_logo_url ? (
    <img
      src={config.header_logo_url}
      alt={config.app_name}
      className="rounded-full border-[6px] object-cover shadow-[0_16px_30px_rgba(15,23,42,0.14)]"
      style={{
        height: `${logoSize}px`,
        width: `${logoSize}px`,
        borderColor: config.page_background_color,
        backgroundColor: config.page_background_color,
      }}
    />
  ) : (
    <div
      className="flex items-center justify-center rounded-full border-[6px] font-semibold tracking-[-0.08em] shadow-[0_16px_30px_rgba(15,23,42,0.14)]"
      style={{
        color: config.accent_color,
        height: `${logoSize}px`,
        width: `${logoSize}px`,
        fontSize: logoSize >= 108 ? '1.9rem' : logoSize <= 84 ? '1.45rem' : '1.7rem',
        borderColor: config.page_background_color,
        backgroundColor: config.page_background_color,
      }}
    >
      {config.app_name.slice(0, 4).toUpperCase()}
    </div>
  );

  // --- Early returns ---

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-[rgba(17,17,16,0.06)] text-ink-600">Cargando chat...</div>;
  }
  if (error && !messages.length) {
    return <div className="flex min-h-dvh items-center justify-center bg-[rgba(17,17,16,0.06)] px-6 text-center text-ink-600">{error}</div>;
  }

  return (
    <div
      className="h-dvh overflow-hidden"
      style={{ background: shellBackground, fontFamily: getFontStack(config.font_family) }}
    >
      <div
        className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
        style={{ backgroundColor: config.page_background_color }}
      >
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{
            background: heroBackground,
            backgroundSize: config.background_image_url ? 'cover' : undefined,
            backgroundPosition: 'center',
            height: `${heroHeight}px`,
          }}
        >
          {config.ticker_enabled && config.ticker_text ? (
            <svg
              key={`${config.ticker_text}-${config.ticker_enabled ? 'on' : 'off'}`}
              viewBox="0 0 100 24"
              className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-10 w-full"
              style={{ height: `${bannerHeight}px` }}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <path id="appchatTickerArc" d="M 4 15 Q 50 1 96 15" />
              </defs>
              <path d="M 0 24 Q 50 -1 100 24 L 100 24 L 0 24 Z" fill={config.page_background_color} fillOpacity="0.98" />
              <text fill={`rgba(17,17,16,${bannerTextOpacity})`} fontSize={bannerTextSize} fontWeight="600" letterSpacing="0.35">
                <textPath href="#appchatTickerArc" startOffset={primaryTickerOffset}>{tickerLoop}</textPath>
              </text>
              <text fill={`rgba(17,17,16,${bannerTextOpacity})`} fontSize={bannerTextSize} fontWeight="600" letterSpacing="0.35">
                <textPath href="#appchatTickerArc" startOffset={secondaryTickerOffset}>{tickerLoop}</textPath>
              </text>
            </svg>
          ) : null}

          <div className={`absolute inset-x-0 bottom-[-1px] ${curveHeight} ${curveRadius}`} style={{ backgroundColor: config.page_background_color }} />
        </section>

        {/* Logo overlay */}
        <div
          className="absolute inset-x-0 z-10 flex -translate-y-1/2 justify-center pointer-events-none"
          style={{ top: `${heroHeight}px` }}
        >
          {logoEl}
        </div>

        {/* Main content */}
        <section
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-4 pt-0"
          style={{ backgroundColor: config.page_background_color }}
        >
          <div style={{ paddingTop: `${Math.max(logoSize / 2 + 8, 52)}px` }}>
            {layoutTemplate === 'split' ? (
              <div className="grid grid-cols-[minmax(0,1fr)_108px] gap-3">
                <div>
                  {identityBlock}
                  <div className="mt-3">{socialRow}</div>
                  {miniStoreButton}
                </div>
                <div className={`rounded-[26px] p-2 ${skin.softCard}`} style={skin.softCardStyle}>
                  {featuredBlock ? (
                    <div className="-mx-1 overflow-x-hidden px-1">
                      <div className="grid gap-1.5">
                        {getPromoCards(products).slice(0, 2).map((product, index) => (
                          <a key={product.id} href={`/shop/${orgSlug}/${product.id}`} className={`overflow-hidden ${carouselCardClass} ${skin.card}`} style={skin.cardStyle}>
                            <img src={getPromoCardImage(product, index)} alt={product.title} className="aspect-square w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex h-full min-h-[120px] items-center justify-center rounded-[18px] text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500 ${skin.card}`} style={skin.cardStyle}>
                      Links
                    </div>
                  )}
                </div>
              </div>
            ) : layoutTemplate === 'spotlight' ? (
              <>
                <div className="mt-4">{identityBlock}</div>
                <div className="mt-3">{socialRow}</div>
                {featuredBlock}
                {miniStoreButton}
              </>
            ) : layoutTemplate === 'column_story' ? (
              <>
                <div className="text-center">
                  {identityBlock}
                  <div className="mt-3">{socialRow}</div>
                  {miniStoreButton}
                </div>
                {featuredBlock}
              </>
            ) : layoutTemplate === 'swipe_story' ? (
              <>
                <div className="text-center">
                  {identityBlock}
                  <div className="mt-3">{socialRow}</div>
                  {miniStoreButton}
                </div>
                {featuredBlock}
              </>
            ) : layoutTemplate === 'storefront' ? (
              <>
                <div className={`rounded-[24px] px-4 py-4 ${skin.softCard}`} style={skin.softCardStyle}>
                  {identityBlock}
                  <div className="mt-3">{socialRow}</div>
                </div>
                {featuredBlock}
                {miniStoreButton}
              </>
            ) : (
              /* default: stack */
              <>
                <div className="text-center">
                  {identityBlock}
                  <div className="mt-3">{socialRow}</div>
                  {miniStoreButton}
                </div>
                {featuredBlock}
              </>
            )}
          </div>

          {/* Chat area */}
          <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[rgba(17,17,16,0.05)] pt-4">
            <AppChatMessageList {...messageListProps} />
            <div className="shrink-0 border-t border-[rgba(17,17,16,0.05)] pt-3">
              {error ? <p className="mb-2 text-sm text-rose-600">{error}</p> : null}
              <AppChatChatInput {...chatInputProps} showGradientLine />
            </div>
          </div>

          {/* Slide-up catalog panel (non-swipe) */}
          <AppChatCatalogPanel
            open={catalogOpen}
            catalogQuery={catalogQuery}
            products={filteredProducts}
            orgSlug={orgSlug}
            heroHeight={heroHeight}
            scrollerRef={catalogScrollerRef}
            onQueryChange={setCatalogQuery}
            onClose={() => setCatalogOpen(false)}
            onAskAbout={askAboutProduct}
          />

        </section>
      </div>
    </div>
  );
}
