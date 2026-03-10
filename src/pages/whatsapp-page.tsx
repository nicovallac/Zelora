import { useState } from 'react';
import { Send, Info } from 'lucide-react';
import { mockConversations } from '../data/mock';
import type { Message } from '../types';

type Scenario = 'subsidio' | 'certificado' | 'pqrs' | 'campana' | 'escalamiento';

const SCENARIO_LABELS: Record<Scenario, string> = {
  subsidio: 'Subsidio',
  certificado: 'Certificado',
  pqrs: 'PQRS',
  campana: 'Campaña',
  escalamiento: 'Escalamiento',
};

const SCENARIO_MESSAGES: Record<Scenario, Message[]> = {
  subsidio: mockConversations[0].messages,
  certificado: mockConversations[1].messages,
  pqrs: mockConversations[2].messages,
  campana: [
    { id: 'cm1', role: 'bot', content: '📢 COMFAGUAJIRA te informa: ¡Ya está disponible el catálogo de recreación 2026! Paquetes a Cartagena, Santa Marta y más. Responde "INFO" para conocer los detalles.', timestamp: '2026-03-09T09:00:00Z' },
    { id: 'cm2', role: 'user', content: 'INFO', timestamp: '2026-03-09T09:05:00Z' },
    { id: 'cm3', role: 'bot', content: '¡Hola! Te comparto el catálogo de paquetes vacacionales para afiliados: Cartagena (3 noches) $450.000 pp · Santa Marta (4 noches) $520.000 pp · Medellín (3 noches) $390.000 pp. ¿Te interesa alguno?', timestamp: '2026-03-09T09:05:08Z' },
    { id: 'cm4', role: 'user', content: 'Sí, quiero saber más de Cartagena', timestamp: '2026-03-09T09:06:00Z' },
    { id: 'cm5', role: 'bot', content: 'Excelente elección 🌴 El paquete Cartagena incluye: hotel 3★, transporte, desayunos y guía turístico. Salidas los viernes. ¿Cuántas personas viajan?', timestamp: '2026-03-09T09:06:10Z' },
  ],
  escalamiento: mockConversations[0].messages,
};

const SCENARIO_CONTACT: Record<Scenario, { name: string; phone: string }> = {
  subsidio: { name: 'María Fernanda Díaz', phone: '+57 310 234 5678' },
  certificado: { name: 'Jorge Armando Ríos', phone: '+57 315 876 5432' },
  pqrs: { name: 'Valentina Ospina', phone: '@vospina_oficial' },
  campana: { name: 'Pedro José Martínez', phone: '+57 301 456 7890' },
  escalamiento: { name: 'María Fernanda Díaz', phone: '+57 310 234 5678' },
};

const whatsappConvos = [
  ...mockConversations.filter((c) => c.channel === 'whatsapp'),
  {
    id: 'wc-extra1',
    channel: 'whatsapp' as const,
    status: 'resuelto' as const,
    user: { id: 'wx1', nombre: 'Camilo', apellido: 'Torres Reyes', telefono: '+57 320 111 2233', email: '', cedula: '', tipoAfiliado: 'trabajador' as const },
    intent: 'Certificado',
    sentiment: 'positivo' as const,
    createdAt: '2026-03-09T07:30:00Z',
    lastMessageAt: '2026-03-09T07:35:00Z',
    lastMessage: 'Listo, ya lo descargué. Gracias!',
    messages: [],
    timeline: [],
  },
  {
    id: 'wc-extra2',
    channel: 'whatsapp' as const,
    status: 'nuevo' as const,
    user: { id: 'wx2', nombre: 'Ana Lucía', apellido: 'Bermúdez', telefono: '+57 314 555 6677', email: '', cedula: '', tipoAfiliado: 'independiente' as const },
    intent: 'Actualización de datos',
    sentiment: 'neutro' as const,
    createdAt: '2026-03-09T11:30:00Z',
    lastMessageAt: '2026-03-09T11:31:00Z',
    lastMessage: '¿Cómo actualizo mi número de cuenta?',
    messages: [],
    timeline: [],
  },
];

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(nombre: string, apellido: string) {
  return `${nombre[0]}${apellido[0]}`.toUpperCase();
}

export function WhatsAppPage() {
  const [activeScenario, setActiveScenario] = useState<Scenario>('subsidio');
  const [activeConvoId, setActiveConvoId] = useState(whatsappConvos[0].id);
  const [inputVal, setInputVal] = useState('');

  const messages = SCENARIO_MESSAGES[activeScenario];
  const contact = SCENARIO_CONTACT[activeScenario];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
        <strong>Simulador WhatsApp Business:</strong> Explora distintos escenarios de atención usando las pestañas. Los mensajes son mock data representativos.
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Left panel - conversations list */}
          <div className="flex w-72 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="flex items-center gap-2 bg-[#075E54] px-4 py-3.5 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">WA</div>
              <div>
                <p className="text-sm font-bold">WhatsApp Business</p>
                <p className="text-xs text-green-200">COMFAGUAJIRA</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {whatsappConvos.map((conv) => {
                const isActive = conv.id === activeConvoId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvoId(conv.id)}
                    className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${isActive ? 'bg-slate-100' : ''}`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366] text-xs font-bold text-white">
                      {getInitials(conv.user.nombre, conv.user.apellido)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {conv.user.nombre} {conv.user.apellido}
                        </p>
                        <p className="text-[10px] text-slate-400">{formatTime(conv.lastMessageAt)}</p>
                      </div>
                      <p className="truncate text-xs text-slate-500">{conv.lastMessage}</p>
                      <div className="mt-1 flex items-center gap-1">
                        {conv.status === 'nuevo' && (
                          <span className="rounded-full bg-[#25D366] px-1.5 py-0.5 text-[9px] font-bold text-white">Nuevo</span>
                        )}
                        {conv.status === 'escalado' && (
                          <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">Escalado</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main panel */}
          <div className="flex flex-1 flex-col bg-[#efeae2]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d0ca' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
            {/* Header */}
            <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-sm font-bold text-white">
                {contact.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{contact.name}</p>
                <p className="text-xs text-green-200">Escribiendo...</p>
              </div>
            </div>

            {/* 24h window note */}
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 text-xs text-blue-700 border-b border-blue-100">
              <Info size={13} />
              Conversación dentro de la ventana de 24h. Sin costo de conversación.
            </div>

            {/* Scenario tabs */}
            <div className="flex gap-1 overflow-x-auto bg-white px-3 py-2 shadow-sm">
              {(Object.keys(SCENARIO_LABELS) as Scenario[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveScenario(s)}
                  className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeScenario === s
                      ? 'bg-[#25D366] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {SCENARIO_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`relative max-w-[72%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                      msg.role === 'user'
                        ? 'rounded-tl-sm bg-white text-slate-800'
                        : msg.role === 'agent'
                        ? 'rounded-tr-sm bg-emerald-100 text-emerald-900'
                        : 'rounded-tr-sm bg-[#dcf8c6] text-slate-800'
                    }`}
                  >
                    {msg.role === 'agent' && (
                      <p className="mb-0.5 text-[10px] font-bold text-emerald-700">Asesor</p>
                    )}
                    {msg.role === 'bot' && (
                      <p className="mb-0.5 text-[10px] font-bold text-[#075E54]">Bot COMFAGUAJIRA</p>
                    )}
                    <p className="leading-snug">{msg.content}</p>
                    <p className="mt-1 text-right text-[10px] text-slate-400">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-3">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Escribe un mensaje"
                className="flex-1 rounded-full border-0 bg-white px-4 py-2.5 text-sm shadow-sm outline-none placeholder-slate-400"
              />
              <button
                disabled={!inputVal.trim()}
                onClick={() => setInputVal('')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow disabled:opacity-40 transition hover:bg-[#128C7E]"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
