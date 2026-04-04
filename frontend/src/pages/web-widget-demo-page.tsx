import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Brain,
  CalendarDays,
  CheckCircle2,
  Globe2,
  MessageCircle,
  Mic,
  Paperclip,
  Send,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import type { WebWidgetPublicConfig } from '../services/api';

type DemoMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AssistantMode = 'listening' | 'reasoning' | 'handoff';

type ConversationMemory = {
  visitorName: string | null;
  activeTopic: 'subsidio' | 'certificado' | 'afiliacion' | 'asesor' | 'general' | null;
  lastDocumentHint: string | null;
};

const INITIAL_MESSAGES: DemoMessage[] = [
  {
    id: 'm-1',
    role: 'assistant',
    content:
      'Hola, te doy la bienvenida a Comfaguajira. Soy Laura y estoy aquí para ayudarte con certificados, subsidios, afiliación o cualquier orientación que necesites.',
  },
];

const DEFAULT_WIDGET: WebWidgetPublicConfig = {
  organization_slug: '',
  is_active: true,
  widget_name: 'Asistente web',
  greeting_message: 'Hola. Estoy aqui para ayudarte con tu consulta.',
  brand_color: '#0f766e',
  position: 'bottom-right',
  launcher_label: 'Hablar con soporte',
  require_consent: true,
  handoff_enabled: true,
  public_demo_url: '',
};

const STARTER_PROMPTS = [
  'Hola, me llamo Andrea y necesito mi certificado',
  'Quiero saber si tengo subsidio este mes',
  'Estoy interesada en afiliarme',
  'Prefiero hablar con una asesora',
];

function TypingIndicator({ mode }: { mode: AssistantMode }) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-card">
        <Brain size={16} />
      </div>
      <div className="max-w-[82%] rounded-[22px] rounded-bl-md border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-4 py-3 shadow-card">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
              style={{ animationDelay: `${dot * 0.14}s` }}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] font-medium text-ink-400">
          {mode === 'handoff' && 'Preparando el contexto para una asesora...'}
          {mode === 'reasoning' && 'Entendiendo la consulta y armando la mejor respuesta...'}
          {mode === 'listening' && 'Pensando la siguiente respuesta...'}
        </p>
      </div>
    </div>
  );
}

function detectName(input: string) {
  const match = input.match(/(?:soy|me llamo)\s+([a-záéíóúñ]+)/i);
  if (!match?.[1]) return null;
  const value = match[1];
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function detectTopic(input: string): ConversationMemory['activeTopic'] {
  const normalized = input.toLowerCase();
  if (normalized.includes('certificado')) return 'certificado';
  if (normalized.includes('subsidio')) return 'subsidio';
  if (normalized.includes('afili')) return 'afiliacion';
  if (normalized.includes('asesor') || normalized.includes('humano')) return 'asesor';
  return 'general';
}

function nextMode(topic: ConversationMemory['activeTopic']) {
  if (topic === 'asesor') return 'handoff';
  if (topic === 'subsidio' || topic === 'certificado' || topic === 'afiliacion') return 'reasoning';
  return 'listening';
}

function buildAssistantReply(input: string, memory: ConversationMemory) {
  const normalized = input.toLowerCase();
  const salutation = memory.visitorName ? `${memory.visitorName}, ` : '';

  if (memory.activeTopic === 'asesor') {
    return `${salutation}claro. Voy a dejar tu caso encaminado para que una asesora lo retome con el contexto completo y puedas avanzar más rápido.`;
  }

  if (memory.activeTopic === 'certificado') {
    if (/\d{5,}/.test(normalized)) {
      return `${salutation}perfecto. Con ese dato lo habitual es validar la información en el sistema y confirmar de inmediato si el certificado puede generarse o si hace falta una validación adicional.`;
    }
    return `${salutation}con gusto te ayudo con el certificado. Para avanzar, normalmente te pediría tu documento y, si hace falta, confirmaría un dato adicional antes de generarlo.`;
  }

  if (memory.activeTopic === 'subsidio') {
    if (/\d{5,}/.test(normalized)) {
      return `${salutation}gracias. Con ese dato puedo revisar el estado del subsidio y darte una respuesta clara: si ya está aprobado, si sigue en proceso o si hay alguna novedad por validar.`;
    }
    return `${salutation}puedo revisarlo contigo. Para hacerlo bien, primero confirmaría tu documento y enseguida te indicaría el estado del subsidio de forma clara.`;
  }

  if (memory.activeTopic === 'afiliacion') {
    return `${salutation}te ayudo con la afiliación. Lo primero es entender tu caso y, a partir de eso, indicarte los documentos necesarios y la forma más conveniente de completar el proceso.`;
  }

  if (normalized.includes('hola') || normalized.includes('buenas')) {
    return `${salutation}hola, con mucho gusto. Cuéntame qué necesitas y te voy orientando paso a paso para ayudarte desde aquí o dejar tu caso encaminado con el equipo de atención.`;
  }

  if (normalized.includes('gracias')) {
    return `${salutation}con gusto. Si lo deseas, podemos continuar por aquí mismo con el siguiente paso.`;
  }

  return `${salutation}ya tengo una idea de lo que necesitas. Para ayudarte mejor, te pediría solo el dato necesario para continuar con el proceso.`;
}

export function WebWidgetDemoPage() {
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') ?? '';
  const [widgetConfig, setWidgetConfig] = useState<WebWidgetPublicConfig>(DEFAULT_WIDGET);
  const [widgetOpen, setWidgetOpen] = useState(true);
  const [messages, setMessages] = useState<DemoMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('listening');
  const [typing, setTyping] = useState(false);
  const [memory, setMemory] = useState<ConversationMemory>({
    visitorName: null,
    activeTopic: null,
    lastDocumentHint: null,
  });
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      if (!orgSlug) return;
      try {
        const config = await api.getPublicWebWidgetConnection(orgSlug);
        if (cancelled) return;
        setWidgetConfig(config);
        setMessages([
          {
            id: 'm-1',
            role: 'assistant',
            content: config.greeting_message || DEFAULT_WIDGET.greeting_message,
          },
        ]);
      } catch {
        if (cancelled) return;
        setWidgetConfig(DEFAULT_WIDGET);
      }
    }

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, [orgSlug]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const heroStats = useMemo(
    () => [
      { label: 'Atencion', value: '24/7' },
      { label: 'Canal', value: 'Widget web' },
      { label: 'Resolucion', value: 'Asistida por IA' },
    ],
    []
  );

  function queueAssistantReply(content: string, mode: AssistantMode) {
    setTyping(true);
    setAssistantMode(mode);
    const delay = Math.min(2600, Math.max(950, content.length * 14));
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content,
        },
      ]);
      setTyping(false);
    }, delay);
  }

  function handleSend(rawValue?: string) {
    const value = (rawValue ?? input).trim();
    if (!value) return;

    const nextName = detectName(value) ?? memory.visitorName;
    const nextTopic = detectTopic(value) ?? memory.activeTopic;
    const nextMemory: ConversationMemory = {
      visitorName: nextName,
      activeTopic: nextTopic,
      lastDocumentHint: /\d{5,}/.test(value) ? 'document_detected' : memory.lastDocumentHint,
    };

    setMemory(nextMemory);
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: value,
      },
    ]);
    setInput('');

    queueAssistantReply(buildAssistantReply(value, nextMemory), nextMode(nextTopic));
  }

  const toneBadge =
    assistantMode === 'handoff'
      ? 'bg-amber-100 text-amber-700'
      : assistantMode === 'reasoning'
        ? 'bg-sky-100 text-sky-700'
        : 'bg-emerald-100 text-emerald-700';
  const widgetTitle = widgetConfig.widget_name || DEFAULT_WIDGET.widget_name;
  const widgetSubtitle = orgSlug ? `Atencion digital de ${orgSlug}` : 'Atencion digital de la marca';
  const brandColorStyle = { backgroundColor: widgetConfig.brand_color || DEFAULT_WIDGET.brand_color };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_24%),linear-gradient(180deg,_#f7fafc_0%,_#f8fafc_52%,_#eef4ff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1480px] flex-col gap-5 px-4 py-4 md:px-6">
        <div className="rounded-[28px] border border-white/60 bg-white/82 px-5 py-4 shadow-card backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-emerald-600">
                {orgSlug ? `${orgSlug} · Demo widget` : 'Web Widget · Demo'}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-ink-900 md:text-3xl">Vista cliente final</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${toneBadge}`}>
                <Brain size={14} />
                {assistantMode === 'handoff' ? 'Preparando handoff humano' : assistantMode === 'reasoning' ? 'Razonando respuesta' : 'Escucha activa'}
              </div>
              <button
                onClick={() => setWidgetOpen((prev) => !prev)}
                className="rounded-full border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]"
              >
                {widgetOpen ? 'Ocultar widget' : 'Abrir widget'}
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[34px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.07)] bg-white/65 backdrop-blur-md shadow-card">
          <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(135deg,_#0f766e_0%,_#2563eb_100%)]" />
          <div className="relative z-10 flex h-full min-h-[840px] flex-col">
            <header className="border-b border-white/10 px-6 py-5 text-white md:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-100">Caja de compensacion familiar</p>
                  <h2 className="mt-2 text-3xl font-bold md:text-4xl">Atencion digital mas cercana para afiliados y empresas</h2>
                  <p className="mt-3 max-w-2xl text-sm text-emerald-50/90 md:text-base">
                    Resuelve certificados, afiliacion, subsidios y acompanamiento en un mismo punto de contacto.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-[26px] border border-white/20 bg-white/10 p-2 backdrop-blur">
                  {heroStats.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">{item.label}</p>
                      <p className="mt-2 text-sm font-bold text-white md:text-base">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </header>

            <main className="relative flex-1 overflow-hidden bg-[linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_60%,_#f8fafc_100%)] px-6 py-6 md:px-8">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_390px]">
                <div className="space-y-5">
                  <section className="rounded-[30px] bg-white/70 backdrop-blur-sm p-6 shadow-card ring-1 ring-slate-200">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Portal de servicios</p>
                        <h3 className="mt-2 text-2xl font-bold text-ink-900 md:text-3xl">Haz tus tramites sin filas ni llamadas innecesarias</h3>
                        <p className="mt-3 text-sm leading-relaxed text-ink-600 md:text-base">
                          Consulta beneficios, solicita certificados y encuentra orientacion para tu proceso desde un solo lugar.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                            Ingresar al portal
                          </button>
                          <button className="rounded-full border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]">
                            Ver servicios disponibles
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
                        {[
                          { label: 'Certificados', value: 'Inmediatos', icon: CheckCircle2 },
                          { label: 'Subsidios', value: 'Consulta guiada', icon: CalendarDays },
                          { label: 'Afiliacion', value: 'Acompanamiento digital', icon: Globe2 },
                        ].map((item) => (
                          <div key={item.label} className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <item.icon size={18} />
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-400">{item.label}</p>
                                <p className="mt-1 text-sm font-semibold text-ink-900">{item.value}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-4 lg:grid-cols-3">
                    {[
                      {
                        title: 'Atencion al afiliado',
                        description: 'Respuestas inmediatas para consultas frecuentes y acompanamiento cuando el caso lo necesita.',
                      },
                      {
                        title: 'Empresas afiliadas',
                        description: 'Orientacion para procesos, requisitos y seguimiento a solicitudes desde la misma experiencia.',
                      },
                      {
                        title: 'Canal digital continuo',
                        description: 'El asistente recoge contexto, entiende lenguaje natural y deja listo el relevo a un asesor.',
                      },
                    ].map((card) => (
                      <article key={card.title} className="rounded-[24px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-5 shadow-card">
                        <p className="text-lg font-semibold text-ink-900">{card.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600">{card.description}</p>
                      </article>
                    ))}
                  </section>

                  <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <article className="rounded-[28px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink-400">Servicios mas usados</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                          'Certificado de afiliacion',
                          'Consulta de subsidio',
                          'Actualizacion de datos',
                          'Orientacion de afiliacion',
                        ].map((item) => (
                          <div key={item} className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3 text-sm font-medium text-ink-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="rounded-[28px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink-400">Probar conversacion</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {STARTER_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => {
                              setWidgetOpen(true);
                              handleSend(prompt);
                            }}
                            className="rounded-full border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </article>
                  </section>
                </div>

                <aside className="hidden md:block">
                  <div className="sticky top-6 space-y-4">
                    <div className="rounded-[24px] border border-[rgba(17,17,16,0.09)] bg-white/90 p-4 shadow-card backdrop-blur">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink-400">Canales disponibles</p>
                      <div className="mt-4 space-y-3">
                        {[
                          { title: 'Asistente web', subtitle: 'Disponible ahora', active: true },
                          { title: 'App Chat', subtitle: 'Experiencia nativa', active: true },
                          { title: 'WhatsApp', subtitle: 'Proximamente', active: false },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className={`rounded-2xl border px-4 py-4 ${item.active ? 'border-emerald-200 bg-emerald-50/70' : 'border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)]'}`}
                          >
                            <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                            <p className="mt-1 text-xs text-ink-400">{item.subtitle}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[30px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm shadow-2xl">
                      <div className="border-b border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                            <Brain size={17} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-ink-900">{widgetTitle}</p>
                            <p className="mt-0.5 text-xs text-ink-400">{widgetSubtitle}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex h-[620px] flex-col">
                        <div className="flex-1 space-y-4 overflow-y-auto bg-[rgba(17,17,16,0.025)] px-4 py-4">
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex items-end gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                              {message.role === 'assistant' && (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                                  <Brain size={16} />
                                </div>
                              )}
                              <div
                                className={`max-w-[84%] rounded-[22px] px-4 py-3 text-sm leading-relaxed ${
                                  message.role === 'user'
                                    ? 'rounded-br-md text-white'
                                    : 'rounded-bl-md border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm text-ink-800 shadow-card'
                                }`}
                                style={message.role === 'user' ? brandColorStyle : undefined}
                              >
                                {message.content}
                              </div>
                            </motion.div>
                          ))}

                          {typing && <TypingIndicator mode={assistantMode} />}

                          {!typing && messages.length <= 2 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {STARTER_PROMPTS.slice(0, 3).map((prompt) => (
                                <button
                                  key={prompt}
                                  onClick={() => handleSend(prompt)}
                                  className="rounded-full border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>
                          )}
                          <div ref={endRef} />
                        </div>

                        <div className="border-t border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-3">
                          <div className="flex items-center gap-2 rounded-[22px] border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2">
                            <button className="rounded-lg p-1 text-ink-400 transition hover:bg-[rgba(17,17,16,0.08)] hover:text-ink-600">
                              <Paperclip size={15} />
                            </button>
                            <input
                              value={input}
                              onChange={(event) => setInput(event.target.value)}
                              onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                              placeholder={widgetConfig.launcher_label ? `Escribe por ${widgetConfig.launcher_label.toLowerCase()}...` : 'Escribe tu mensaje...'}
                              className="flex-1 bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
                            />
                            <button className="rounded-lg p-1 text-ink-400 transition hover:bg-[rgba(17,17,16,0.08)] hover:text-ink-600">
                              <Mic size={15} />
                            </button>
                            <button
                              onClick={() => handleSend()}
                              disabled={!input.trim()}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition disabled:opacity-40"
                              style={brandColorStyle}
                            >
                              <Send size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>

              <div className="absolute bottom-5 right-5 z-20 w-[min(100%,390px)] md:hidden">
                <div className="relative flex min-h-[620px] items-end justify-end">
                  <AnimatePresence>
                    {widgetOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 flex h-[590px] w-full max-w-[378px] flex-col overflow-hidden rounded-[30px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm shadow-2xl"
                      >
                        <div className="border-b border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                              <Brain size={17} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-ink-900">{widgetTitle}</p>
                                <p className="mt-0.5 text-xs text-ink-400">{widgetSubtitle}</p>
                            </div>
                            <button onClick={() => setWidgetOpen(false)} className="rounded-full p-1 text-ink-400 transition hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-600">
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto bg-[rgba(17,17,16,0.025)] px-4 py-4">
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex items-end gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                              {message.role === 'assistant' && (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                                  <Brain size={16} />
                                </div>
                              )}
                              <div
                                className={`max-w-[84%] rounded-[22px] px-4 py-3 text-sm leading-relaxed ${
                                  message.role === 'user'
                                    ? 'rounded-br-md text-white'
                                    : 'rounded-bl-md border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm text-ink-800 shadow-card'
                                }`}
                                style={message.role === 'user' ? brandColorStyle : undefined}
                              >
                                {message.content}
                              </div>
                            </motion.div>
                          ))}

                          {typing && <TypingIndicator mode={assistantMode} />}

                          {!typing && messages.length <= 2 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {STARTER_PROMPTS.slice(0, 3).map((prompt) => (
                                <button
                                  key={prompt}
                                  onClick={() => handleSend(prompt)}
                                  className="rounded-full border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>
                          )}
                          <div ref={endRef} />
                        </div>

                        <div className="border-t border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-3">
                          <div className="flex items-center gap-2 rounded-[22px] border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2">
                            <button className="rounded-lg p-1 text-ink-400 transition hover:bg-[rgba(17,17,16,0.08)] hover:text-ink-600">
                              <Paperclip size={15} />
                            </button>
                            <input
                              value={input}
                              onChange={(event) => setInput(event.target.value)}
                              onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                              placeholder={widgetConfig.launcher_label ? `Escribe por ${widgetConfig.launcher_label.toLowerCase()}...` : 'Escribe tu mensaje...'}
                              className="flex-1 bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
                            />
                            <button className="rounded-lg p-1 text-ink-400 transition hover:bg-[rgba(17,17,16,0.08)] hover:text-ink-600">
                              <Mic size={15} />
                            </button>
                            <button
                              onClick={() => handleSend()}
                              disabled={!input.trim()}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition disabled:opacity-40"
                              style={brandColorStyle}
                            >
                              <Send size={15} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!widgetOpen && (
                    <motion.button
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setWidgetOpen(true)}
                      className="relative z-10 ml-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl transition"
                      style={brandColorStyle}
                    >
                      <MessageCircle size={24} />
                    </motion.button>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
