import { Heart, MessageCircle, Share2, ExternalLink, Clock, ArrowRight } from 'lucide-react';

const dmMessages = [
  { id: 't1', role: 'user' as const, content: 'Hola! Vi tu video sobre el subsidio familiar y quiero saber cómo aplico.', time: '18:00' },
  { id: 't2', role: 'bot' as const, content: '¡Hola Sofía! 👋 Gracias por escribirnos desde TikTok. Para el subsidio familiar necesitas ser afiliado activo. ¿Ya estás afiliado a COMFAGUAJIRA?', time: '18:00' },
  { id: 't3', role: 'user' as const, content: 'No, ¿cómo me afilio?', time: '18:01' },
  { id: 't4', role: 'bot' as const, content: '¡Te explicamos! 📲 Puedes completar tu afiliación en nuestro chat web (disponible 24/7) o por WhatsApp. ¿Por cuál prefieres?', time: '18:01' },
  { id: 't5', role: 'user' as const, content: 'Por WhatsApp mejor', time: '18:02' },
  { id: 't6', role: 'bot' as const, content: '✅ Perfecto. Escríbenos al +57 300 123 4567 y un asesor te guiará en menos de 5 minutos. ¡Bienvenida a COMFAGUAJIRA! 🎉', time: '18:02' },
];

const flowSteps = [
  { label: 'TikTok\nComentario / DM', icon: '📱', color: 'bg-slate-900 text-white', border: 'border-slate-700' },
  { label: 'IA detecta\nintención', icon: '🤖', color: 'bg-brand-500 text-white', border: 'border-brand-500' },
  { label: 'Respuesta\nautomática', icon: '⚡', color: 'bg-violet-600 text-white', border: 'border-violet-500' },
  { label: 'CTA\nWhatsApp/Web', icon: '🔗', color: 'bg-[#25D366] text-white', border: 'border-green-400' },
  { label: 'Conversión\nafiliado', icon: '✅', color: 'bg-emerald-600 text-white', border: 'border-emerald-500' },
];

export function TikTokPage() {
  return (
    <div className="space-y-8">
      {/* Header banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg">📱</div>
          <div>
            <p className="font-bold">Vista conceptual — Captación en TikTok</p>
            <p className="text-sm text-ink-400">
              TikTok permite responder comentarios y DMs automáticamente mediante la API de Business. El bot captura la intención y deriva al canal correcto.
            </p>
          </div>
        </div>
      </div>

      {/* Explanation card */}
      <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6">
        <h2 className="mb-3 text-lg font-bold text-ink-900">¿Cómo funciona la captación en TikTok?</h2>
        <div className="grid gap-4 text-sm text-ink-600 md:grid-cols-3">
          <div className="rounded-xl bg-[rgba(17,17,16,0.025)] p-4">
            <p className="mb-1 font-bold text-ink-900">1. Comentario en video</p>
            Un afiliado comenta en un video de COMFAGUAJIRA pidiendo información. El bot detecta el @mention y responde públicamente.
          </div>
          <div className="rounded-xl bg-[rgba(17,17,16,0.025)] p-4">
            <p className="mb-1 font-bold text-ink-900">2. DM automático</p>
            Simultáneamente envía un DM privado con más información y un enlace al chat web o WhatsApp para continuar la atención.
          </div>
          <div className="rounded-xl bg-[rgba(17,17,16,0.025)] p-4">
            <p className="mb-1 font-bold text-ink-900">3. Conversión</p>
            El afiliado migra al canal de mayor conveniencia (WhatsApp o Web) donde el bot ya tiene el contexto de la intención detectada.
          </div>
        </div>
      </div>

      {/* Main 2-col grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: TikTok video card */}
        <div className="space-y-4">
          <h3 className="font-bold text-ink-900">Video en TikTok + comentario bot</h3>

          <div className="overflow-hidden rounded-2xl bg-slate-900 text-white shadow-xl">
            {/* Video placeholder */}
            <div className="relative flex h-72 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
              {/* TikTok-style overlays */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-3xl font-black text-white ring-4 ring-white/20">
                    CF
                  </div>
                  <p className="text-sm font-bold">COMFAGUAJIRA</p>
                  <p className="mt-1 text-xs text-ink-400">💰 ¿Sabías que tienes subsidio familiar?</p>
                  <p className="text-xs text-ink-400">Afíliate hoy y empieza a cobrar 👇</p>
                </div>
              </div>

              {/* Right action buttons */}
              <div className="absolute bottom-6 right-3 flex flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <Heart size={20} />
                  </div>
                  <span className="text-xs">24.2K</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <MessageCircle size={20} />
                  </div>
                  <span className="text-xs">1.8K</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <Share2 size={20} />
                  </div>
                  <span className="text-xs">892</span>
                </div>
              </div>

              {/* Bottom meta */}
              <div className="absolute bottom-4 left-3 right-16">
                <p className="text-xs font-bold">@comfaguajira</p>
                <p className="text-xs text-ink-400">#subsidio #comfaguajira #guajira #beneficios</p>
              </div>
            </div>

            {/* Comments section */}
            <div className="border-t border-white/10 bg-slate-800 px-4 py-3 space-y-3">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Comentarios</p>

              {/* User comment */}
              <div className="flex gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">SH</div>
                <div>
                  <p className="text-xs">
                    <span className="font-bold text-white">@sofiahbello</span>{' '}
                    <span className="text-ink-300">¿Cómo aplico para el subsidio? @comfaguajira</span>
                  </p>
                  <p className="text-[10px] text-ink-400">hace 2h · 47 likes</p>
                </div>
              </div>

              {/* Bot reply */}
              <div className="flex gap-2 rounded-lg bg-white/5 p-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">CF</div>
                <div>
                  <p className="text-xs">
                    <span className="font-bold text-white">@comfaguajira</span>{' '}
                    <span className="text-ink-300">¡Hola! Te mandamos un DM con toda la info 😊 ¡Es muy fácil afiliarse!</span>
                  </p>
                  <p className="text-[10px] text-ink-400">hace 2h · Respuesta automática · 12 likes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: DM conversation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink-900">DM resultante</h3>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Clock size={11} />
              Respuesta automática en &lt;30 seg
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-ink-900 shadow-xl">
            {/* TikTok DM header */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-slate-900 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">CF</div>
              <div>
                <p className="text-sm font-bold text-white">comfaguajira</p>
                <p className="text-xs text-ink-400">Mensaje directo</p>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3 p-4">
              {dmMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'rounded-tl-sm bg-slate-700 text-slate-100'
                        : 'rounded-tr-sm bg-[#FE2C55] text-white'
                    }`}
                  >
                    <p className="leading-snug">{msg.content}</p>
                    <p className={`mt-1 text-right text-[10px] ${msg.role === 'user' ? 'text-ink-400' : 'text-white/70'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="border-t border-white/10 bg-slate-900 p-4 space-y-2">
              <p className="text-xs font-semibold text-ink-400">Continuar atención en:</p>
              <div className="flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white transition hover:bg-[#128C7E]">
                  <ExternalLink size={12} /> Ir a WhatsApp
                </button>
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-500 py-2.5 text-xs font-bold text-white transition hover:bg-brand-600">
                  <ExternalLink size={12} /> Ir a Chat Web
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6">
        <h3 className="mb-6 text-center font-bold text-ink-900">Flujo de captación TikTok → Conversión</h3>
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className={`flex min-w-[96px] flex-col items-center gap-2 rounded-2xl border-2 p-3 ${step.color} ${step.border}`}>
                <span className="text-xl">{step.icon}</span>
                <p className="text-center text-[10px] font-bold leading-tight whitespace-pre-line">{step.label}</p>
              </div>
              {i < flowSteps.length - 1 && (
                <ArrowRight size={18} className="flex-shrink-0 text-ink-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
