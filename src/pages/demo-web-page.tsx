import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, ArrowUpRight, Mic, Paperclip } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'agent';
  content: string;
}

const WELCOME: ChatMessage = {
  id: 'init',
  role: 'bot',
  content: '¡Hola! Soy el asistente virtual de COMFAGUAJIRA. ¿En qué puedo ayudarte hoy?',
};

const QUICK_REPLIES = [
  { label: '💰 Subsidio familiar', key: 'subsidio' },
  { label: '📄 Certificado', key: 'certificado' },
  { label: '🏠 Afiliación', key: 'afiliacion' },
  { label: '📋 PQRS', key: 'pqrs' },
  { label: '👤 Hablar con asesor', key: 'asesor' },
];

const BOT_RESPONSES: Record<string, string> = {
  subsidio: 'Puedo ayudarte con tu subsidio familiar. ¿Me das tu número de cédula para consultar tu estado de pago?',
  certificado: 'Genero tu certificado de afiliación en segundos. ¿Cuál es tu número de cédula?',
  afiliacion: 'Te explico el proceso de afiliación a COMFAGUAJIRA. ¿Eres trabajador dependiente, independiente o pensionado?',
  pqrs: 'Radico tu solicitud, queja o reclamo de inmediato. ¿Cuál es el motivo de tu PQRS?',
  asesor: 'Conectando con un asesor disponible... ✅ Carlos del equipo de atención está en línea y tomará tu caso ahora.',
};

const USER_MESSAGES: Record<string, string> = {
  subsidio: '💰 Subsidio familiar',
  certificado: '📄 Necesito mi certificado',
  afiliacion: '🏠 Quiero afiliarme',
  pqrs: '📋 Quiero radicar una PQRS',
  asesor: '👤 Quiero hablar con un asesor',
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
        <Bot size={14} />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [typing, setTyping] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [showEscalate, setShowEscalate] = useState(false);
  const botRepliesRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Cleanup recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  function addBotReply(content: string) {
    setTyping(true);
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'bot',
        content,
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
      botRepliesRef.current += 1;
      if (botRepliesRef.current >= 2) setShowEscalate(true);
    }, 1500);
  }

  function sendQuickReply(key: string) {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: USER_MESSAGES[key],
    };
    setMessages((prev) => [...prev, userMsg]);
    addBotReply(BOT_RESPONSES[key]);
  }

  function sendInput() {
    if (!inputVal.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: inputVal.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    addBotReply('Entendí tu consulta. Un momento mientras la proceso... ¿Puedes indicarme tu número de cédula para continuar?');
  }

  // Voice input handler
  function handleVoiceClick() {
    if (recording) return; // already recording (auto-stops)

    setRecording(true);
    setRecordingSeconds(0);

    let seconds = 0;
    recordingTimerRef.current = setInterval(() => {
      seconds += 1;
      setRecordingSeconds(seconds);
      if (seconds >= 3) {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecording(false);
        setRecordingSeconds(0);
        // Add voice message
        const voiceMsg: ChatMessage = {
          id: `u-voice-${Date.now()}`,
          role: 'user',
          content: '🎤 [Mensaje de voz - 3 segundos]',
        };
        setMessages((prev) => [...prev, voiceMsg]);
        addBotReply(
          'Escuché tu mensaje de voz. La funcionalidad de voz está disponible en el Plan Enterprise con procesamiento STT (Speech-to-Text) en tiempo real.'
        );
      }
    }, 1000);
  }

  // Document upload handler
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const filename = file.name;
    const docMsg: ChatMessage = {
      id: `u-doc-${Date.now()}`,
      role: 'user',
      content: `📎 ${filename}`,
    };
    setMessages((prev) => [...prev, docMsg]);
    // Reset input so the same file can be uploaded again
    e.target.value = '';
    addBotReply(
      `Recibí tu documento '${filename}'. Lo estoy procesando con IA para extraer la información relevante... ✅ Documento analizado: se detectó un certificado/formulario. ¿En qué puedo ayudarte con este documento?`
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-brand-600 px-4 py-3 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Bot size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Asistente Virtual</p>
          <p className="flex items-center gap-1 text-xs text-brand-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> En línea
          </p>
        </div>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20 transition">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role !== 'user' && (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Bot size={14} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-brand-600 text-white'
                    : msg.role === 'agent'
                    ? 'rounded-bl-sm bg-emerald-100 text-emerald-900'
                    : 'rounded-bl-sm bg-white text-slate-800 shadow-sm border border-slate-100'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && <TypingIndicator />}

        {/* Quick replies */}
        {!typing && messages.length < 3 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.key}
                onClick={() => sendQuickReply(qr.key)}
                className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 transition"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}

        {/* Escalate button */}
        {showEscalate && !typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={() => sendQuickReply('asesor')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition"
            >
              <ArrowUpRight size={14} /> Escalar a asesor humano
            </button>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-white p-3">
        {recording && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-600">Grabando... 0:{String(recordingSeconds).padStart(2, '0')}</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          {/* Paperclip / document upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
            title="Adjuntar documento"
          >
            <Paperclip size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.jpg,.png"
            className="hidden"
            onChange={handleFileChange}
          />

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendInput()}
            placeholder="Escribe tu consulta..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          />

          {/* Mic / voice input */}
          <button
            onClick={handleVoiceClick}
            disabled={recording}
            className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition ${
              recording
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
            }`}
            title={recording ? 'Grabando...' : 'Mensaje de voz'}
          >
            <Mic size={15} />
          </button>

          <button
            onClick={sendInput}
            disabled={!inputVal.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function DemoWebPage() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
        <strong>Demo interactiva:</strong> Esta es la vista del afiliado en el portal web de COMFAGUAJIRA. Haz clic en el botón azul de chat (abajo a la derecha) para probar el chatbot.
      </div>

      {/* Fake institutional website */}
      <div className="relative min-h-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Fake nav */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-brand-700 px-6 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-xs font-black">
              CF
            </div>
            <div>
              <p className="text-sm font-bold">COMFAGUAJIRA</p>
              <p className="text-[10px] text-brand-200">Caja de Compensación Familiar</p>
            </div>
          </div>
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            {['Inicio', 'Afiliados', 'Beneficios', 'PQRS', 'Contacto'].map((item) => (
              <button key={item} className="text-brand-100 hover:text-white transition">
                {item}
              </button>
            ))}
          </nav>
          <button className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30 transition">
            Mi Portal
          </button>
        </header>

        {/* Hero section */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-500 px-6 py-14 text-white">
          <div className="mx-auto max-w-xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-200">
              Caja de Compensación Familiar
            </p>
            <h2 className="text-3xl font-extrabold">
              Bienvenido a COMFAGUAJIRA
            </h2>
            <p className="mt-3 text-brand-100">
              Más de 50.000 afiliados confían en nosotros para subsidios, recreación, salud y educación en La Guajira.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow hover:bg-brand-50 transition">
                Consultar subsidio
              </button>
              <button className="rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/20 transition">
                Ver beneficios
              </button>
            </div>
          </div>
        </div>

        {/* Service cards */}
        <div className="grid gap-4 px-6 py-8 md:grid-cols-3">
          {[
            { emoji: '💰', title: 'Subsidio Familiar', desc: 'Consulta el estado y fecha de pago de tu subsidio mensual.' },
            { emoji: '🏖️', title: 'Recreación', desc: 'Paquetes turísticos con tarifas preferenciales para afiliados y familias.' },
            { emoji: '📄', title: 'Certificados', desc: 'Descarga tu certificado de afiliación de forma inmediata en línea.' },
          ].map((svc) => (
            <div
              key={svc.title}
              className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm transition hover:shadow-md hover:border-brand-200"
            >
              <span className="text-3xl">{svc.emoji}</span>
              <h3 className="mt-3 font-bold text-slate-900">{svc.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{svc.desc}</p>
              <button className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700 transition">
                Acceder →
              </button>
            </div>
          ))}
        </div>

        {/* Feature badges */}
        <div className="mx-6 mb-6 flex flex-wrap gap-2">
          {[
            { icon: '🎤', label: 'Voz habilitada' },
            { icon: '📎', label: 'Adjuntar documentos' },
            { icon: '🤖', label: 'IA 24/7' },
          ].map((b) => (
            <span key={b.label} className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              {b.icon} {b.label}
            </span>
          ))}
        </div>

        {/* Chat widget FAB */}
        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3">
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.18 }}
              >
                <ChatWindow onClose={() => setChatOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setChatOpen((v) => !v)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition"
          >
            <AnimatePresence mode="wait" initial={false}>
              {chatOpen ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X size={22} />
                </motion.span>
              ) : (
                <motion.span key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <MessageCircle size={22} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
