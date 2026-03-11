import { useMemo, useState } from 'react';
import { Bot, Palette, Send, SlidersHorizontal, Sparkles, X } from 'lucide-react';

type ChatMsg = { id: string; role: 'user' | 'assistant'; content: string; time: string };

const COLOR_PRESETS = ['#1D4ED8', '#0F766E', '#BE185D', '#7C3AED', '#0369A1'];

const QUICK_PROMPTS = [
  'Quiero consultar mis beneficios',
  'Necesito un certificado',
  'Tengo una PQRS',
  'Quiero hablar con un asesor',
];

function nowLabel() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function simulateReply(text: string, businessName: string) {
  const lower = text.toLowerCase();
  if (lower.includes('certificado')) {
    return `Claro. Puedo generar tu certificado ahora mismo en ${businessName}. ¿Me confirmas tu cédula?`;
  }
  if (lower.includes('pqrs')) {
    return `Entiendo. Te ayudo a radicar tu PQRS y a escalarla con prioridad en ${businessName}.`;
  }
  if (lower.includes('asesor')) {
    return `Perfecto, te conecto con un asesor humano de ${businessName} con todo el contexto de esta conversación.`;
  }
  return `Estoy para ayudarte con atención 24/7 de ${businessName}. ¿Quieres continuar con una consulta de subsidio, afiliación o certificados?`;
}

export function AppChatPage() {
  const [businessName, setBusinessName] = useState('COMFAGUAJIRA');
  const [assistantName, setAssistantName] = useState('Asistente Virtual');
  const [accent, setAccent] = useState(COLOR_PRESETS[0]);
  const [customOpen, setCustomOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'm1',
      role: 'assistant',
      content: 'Hola, soy tu asistente empresarial. Esta interfaz está diseñada como canal conversacional principal, optimizada para móvil.',
      time: nowLabel(),
    },
  ]);

  const headerSubtitle = useMemo(
    () => `Canal conversacional full chat · Marca: ${businessName}`,
    [businessName]
  );

  const sendMessage = (forcedText?: string) => {
    const text = (forcedText ?? input).trim();
    if (!text) return;

    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: 'user', content: text, time: nowLabel() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const assistantMsg: ChatMsg = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: simulateReply(text, businessName),
        time: nowLabel(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTyping(false);
    }, 900);
  };

  return (
    <div className="h-full p-2 sm:p-4">
      <div className="mx-auto h-[calc(100vh-7rem)] max-w-6xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm lg:grid lg:grid-cols-[300px_1fr]">
        <aside className="hidden border-r border-ink-200 bg-ink-50 p-4 lg:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Personalización de marca</p>
          <h2 className="mt-1 text-lg font-bold text-ink-900">App Chat White-Label</h2>
          <p className="mt-1 text-xs text-ink-500">
            La empresa adapta nombre, estilo y tono para usar este canal como chat principal.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-ink-700">Nombre empresa</span>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-700">Nombre asistente</span>
              <input
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <div>
              <p className="text-xs font-semibold text-ink-700">Color principal</p>
              <div className="mt-2 flex gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccent(color)}
                    className={`h-7 w-7 rounded-full ring-offset-2 transition ${
                      accent === color ? 'ring-2 ring-ink-900' : ''
                    }`}
                    style={{ background: color }}
                    aria-label={`Seleccionar color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex h-full flex-col">
          <header className="flex items-center gap-3 border-b border-ink-200 px-3 py-2.5 sm:px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: accent }}>
              <Bot size={17} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-900">{assistantName}</p>
              <p className="truncate text-[11px] text-ink-500">{headerSubtitle}</p>
            </div>
            <button
              onClick={() => setCustomOpen(true)}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-600 lg:hidden"
            >
              <SlidersHorizontal size={13} />
              Marca
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-white p-3 sm:p-4">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[80%] ${
                      msg.role === 'user' ? 'text-white' : 'border border-ink-200 bg-ink-50 text-ink-800'
                    }`}
                    style={msg.role === 'user' ? { background: accent } : undefined}
                  >
                    <p>{msg.content}</p>
                    <p className={`mt-1 text-right text-[10px] ${msg.role === 'user' ? 'text-white/70' : 'text-ink-400'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">
                    {assistantName} está escribiendo...
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-ink-200 px-3 py-2.5 sm:px-4">
            <div className="mx-auto mb-2 flex max-w-3xl gap-1.5 overflow-x-auto">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="whitespace-nowrap rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-600 hover:bg-ink-50"
                >
                  <Sparkles size={11} className="mr-1 inline" />
                  {prompt}
                </button>
              ))}
            </div>
            <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
                placeholder={`Pregúntale a ${assistantName}...`}
                className="w-full bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-400"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white disabled:opacity-40"
                style={{ background: accent }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {customOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCustomOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-ink-900 flex items-center gap-1.5">
                <Palette size={15} />
                Personalizar marca
              </p>
              <button onClick={() => setCustomOpen(false)} className="rounded-lg p-1 hover:bg-ink-100">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                placeholder="Nombre empresa"
              />
              <input
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                placeholder="Nombre asistente"
              />
              <div className="flex gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccent(color)}
                    className={`h-8 w-8 rounded-full ${accent === color ? 'ring-2 ring-ink-900 ring-offset-2' : ''}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
