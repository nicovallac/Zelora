import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Phone, Users, BookOpen, Rocket, ChevronRight,
  ChevronLeft, Check, Globe, Instagram, Mail, Send, MessageSquare,
  Upload, Plus, Trash2, Sparkles, ArrowRight
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Tu organización', description: 'Datos básicos de tu empresa', icon: Building2 },
  { id: 2, title: 'Canales', description: 'Conecta tus canales de atención', icon: Phone },
  { id: 3, title: 'Tu equipo', description: 'Invita a tus agentes', icon: Users },
  { id: 4, title: 'Base de conocimiento', description: 'Entrena a tu IA', icon: BookOpen },
  { id: 5, title: '¡Listo!', description: 'Tu plataforma está lista', icon: Rocket },
];

const INDUSTRIES = [
  'Caja de compensación', 'Salud y EPS', 'Banca y finanzas', 'Retail',
  'Educación', 'Gobierno', 'Telecomunicaciones', 'Seguros', 'Otro',
];

const CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp Business', icon: Phone, color: 'emerald', description: 'API oficial Meta · hasta 1K conv/día gratuitas', recommended: true },
  { id: 'instagram', name: 'Instagram DM', icon: Instagram, color: 'pink', description: 'Inbox unificado con Instagram Direct' },
  { id: 'webchat', name: 'Web Chat', icon: Globe, color: 'sky', description: 'Widget embebible en tu sitio web' },
  { id: 'email', name: 'Email', icon: Mail, color: 'amber', description: 'Gestión de bandeja de entrada' },
  { id: 'telegram', name: 'Telegram', icon: Send, color: 'blue', description: 'Bot de Telegram' },
  { id: 'sms', name: 'SMS', icon: MessageSquare, color: 'violet', description: 'Mensajería SMS masiva' },
];

interface TeamMember { email: string; role: 'admin' | 'supervisor' | 'asesor'; }
interface KBTopic { title: string; content: string; }

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('Colombia');
  const [website, setWebsite] = useState('');

  // Step 2 state
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['whatsapp', 'webchat']);

  // Step 3 state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { email: '', role: 'asesor' },
  ]);

  // Step 4 state
  const [kbTopics, setKbTopics] = useState<KBTopic[]>([
    { title: 'Preguntas frecuentes', content: '' },
  ]);

  const [completing, setCompleting] = useState(false);

  const canNext = () => {
    if (step === 1) return orgName.trim().length >= 2 && industry;
    if (step === 2) return selectedChannels.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 5) setStep(s => s + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleComplete = () => {
    setCompleting(true);
    setTimeout(() => navigate('/'), 2000);
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const addMember = () => setTeamMembers(prev => [...prev, { email: '', role: 'asesor' }]);
  const removeMember = (i: number) => setTeamMembers(prev => prev.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const addTopic = () => setKbTopics(prev => [...prev, { title: '', content: '' }]);
  const removeTopic = (i: number) => setKbTopics(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-ink-900">OmniDesk</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step > s.id ? 'bg-brand-600 text-white' :
                  step === s.id ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  'bg-ink-100 text-ink-400'
                }`}>
                  {step > s.id ? <Check size={16} /> : s.id}
                </div>
                <span className={`text-xs mt-1.5 font-medium hidden sm:block ${step === s.id ? 'text-brand-600' : 'text-ink-400'}`}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${step > s.id ? 'bg-brand-400' : 'bg-ink-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-lg overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="p-8"
            >
              {/* Step header */}
              <div className="mb-6">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-3">
                  {(() => { const Icon = STEPS[step - 1].icon; return <Icon size={22} className="text-brand-600" />; })()}
                </div>
                <h2 className="text-xl font-bold text-ink-900">{STEPS[step - 1].title}</h2>
                <p className="text-sm text-ink-500 mt-1">{STEPS[step - 1].description}</p>
              </div>

              {/* Step 1 — Organization */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Nombre de la organización *</label>
                    <input
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder="Ej: Comfaguajira"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-ink-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Industria *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {INDUSTRIES.map(ind => (
                        <button
                          key={ind}
                          onClick={() => setIndustry(ind)}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                            industry === ind
                              ? 'bg-brand-600 border-brand-600 text-white'
                              : 'border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1.5">País</label>
                      <select
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-ink-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      >
                        {['Colombia', 'México', 'Chile', 'Perú', 'Argentina', 'Ecuador', 'Venezuela', 'España'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1.5">Sitio web (opcional)</label>
                      <input
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        placeholder="https://tuempresa.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-ink-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                    </div>
                  </div>
                  <div className="border-2 border-dashed border-ink-200 rounded-xl p-6 text-center hover:border-brand-300 cursor-pointer transition-colors">
                    <Upload size={22} className="mx-auto text-ink-300 mb-2" />
                    <p className="text-sm text-ink-500">Sube tu logo <span className="text-brand-500 font-medium">o arrastra aquí</span></p>
                    <p className="text-xs text-ink-400 mt-1">PNG, SVG · máx 2MB</p>
                  </div>
                </div>
              )}

              {/* Step 2 — Channels */}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-ink-500 mb-4">Selecciona los canales que activarás. Puedes conectar las credenciales luego desde Integraciones.</p>
                  {CHANNELS.map(ch => (
                    <div
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedChannels.includes(ch.id)
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-ink-200 hover:border-ink-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        ch.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                        ch.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                        ch.color === 'sky' ? 'bg-sky-100 text-sky-600' :
                        ch.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                        ch.color === 'violet' ? 'bg-violet-100 text-violet-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <ch.icon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink-800">{ch.name}</p>
                          {ch.recommended && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Recomendado</span>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 mt-0.5">{ch.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        selectedChannels.includes(ch.id) ? 'bg-brand-600 border-brand-600' : 'border-ink-300'
                      }`}>
                        {selectedChannels.includes(ch.id) && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3 — Team */}
              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-xs text-ink-500 mb-4">Invita a tu equipo. Recibirán un correo con instrucciones para acceder.</p>
                  {teamMembers.map((member, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={member.email}
                        onChange={e => updateMember(i, 'email', e.target.value)}
                        placeholder="correo@empresa.com"
                        type="email"
                        className="flex-1 px-3.5 py-2.5 rounded-lg border border-ink-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                      <select
                        value={member.role}
                        onChange={e => updateMember(i, 'role', e.target.value)}
                        className="px-3 py-2.5 rounded-lg border border-ink-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      >
                        <option value="asesor">Asesor</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Admin</option>
                      </select>
                      {teamMembers.length > 1 && (
                        <button onClick={() => removeMember(i)} className="p-2 text-ink-400 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addMember}
                    className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-2"
                  >
                    <Plus size={16} />
                    Agregar otro miembro
                  </button>
                  <div className="mt-4 p-3 bg-sky-50 rounded-lg border border-sky-100 text-xs text-sky-700">
                    Puedes saltar este paso y gestionar tu equipo desde <strong>Admin → Agentes</strong> en cualquier momento.
                  </div>
                </div>
              )}

              {/* Step 4 — Knowledge Base */}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-xs text-ink-500 mb-2">Define los temas principales que tu IA debe conocer. Puedes enriquecer la base de conocimiento después.</p>
                  {kbTopics.map((topic, i) => (
                    <div key={i} className="border border-ink-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <input
                          value={topic.title}
                          onChange={e => setKbTopics(prev => prev.map((t, idx) => idx === i ? { ...t, title: e.target.value } : t))}
                          placeholder="Título del tema (ej: Subsidio familiar)"
                          className="flex-1 text-sm font-medium text-ink-800 border-none outline-none bg-transparent placeholder-ink-300"
                        />
                        {kbTopics.length > 1 && (
                          <button onClick={() => removeTopic(i)} className="text-ink-300 hover:text-red-500 transition-colors ml-2">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={topic.content}
                        onChange={e => setKbTopics(prev => prev.map((t, idx) => idx === i ? { ...t, content: e.target.value } : t))}
                        placeholder="Describe brevemente este tema o pega la información relevante..."
                        rows={3}
                        className="w-full text-xs text-ink-600 border-none outline-none bg-transparent resize-none placeholder-ink-300"
                      />
                    </div>
                  ))}
                  <button onClick={addTopic} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
                    <Plus size={16} />
                    Agregar tema
                  </button>
                  <div className="border-2 border-dashed border-ink-200 rounded-xl p-5 text-center hover:border-brand-300 cursor-pointer transition-colors">
                    <Upload size={20} className="mx-auto text-ink-300 mb-2" />
                    <p className="text-sm text-ink-500">Sube un PDF o Word con tu documentación</p>
                    <p className="text-xs text-ink-400 mt-1">PDF, DOCX · máx 10MB</p>
                  </div>
                </div>
              )}

              {/* Step 5 — Done */}
              {step === 5 && (
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-20 h-20 bg-brand-600 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    {completing ? (
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={36} className="text-white" />
                    )}
                  </motion.div>
                  <h3 className="text-xl font-bold text-ink-900 mb-2">¡{orgName || 'Tu organización'} está lista!</h3>
                  <p className="text-sm text-ink-500 max-w-sm mx-auto mb-8">
                    Hemos configurado tu plataforma omnicanal. Puedes empezar a atender clientes de inmediato.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-8 text-left">
                    {[
                      { icon: Phone, label: `${selectedChannels.length} canales`, sub: 'seleccionados' },
                      { icon: Users, label: `${teamMembers.filter(m => m.email).length || 1} agentes`, sub: 'invitados' },
                      { icon: BookOpen, label: `${kbTopics.filter(t => t.title).length} temas`, sub: 'en base de conocimiento' },
                    ].map(item => (
                      <div key={item.label} className="bg-brand-50 rounded-xl p-4">
                        <item.icon size={18} className="text-brand-600 mb-2" />
                        <p className="text-lg font-bold text-ink-900">{item.label}</p>
                        <p className="text-xs text-ink-500">{item.sub}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors flex items-center gap-2 mx-auto"
                  >
                    {completing ? 'Entrando al Centro de Mando…' : 'Entrar al Centro de Mando'}
                    {!completing && <ArrowRight size={16} />}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          {step < 5 && (
            <div className="flex items-center justify-between px-8 py-5 border-t border-ink-100 bg-ink-50/50">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 disabled:opacity-30 transition-colors font-medium"
              >
                <ChevronLeft size={16} />
                Atrás
              </button>
              <div className="flex gap-1.5">
                {STEPS.slice(0, -1).map(s => (
                  <div key={s.id} className={`h-1.5 rounded-full transition-all ${step === s.id ? 'bg-brand-600 w-4' : step > s.id ? 'bg-brand-300 w-1.5' : 'bg-ink-300 w-1.5'}`} />
                ))}
              </div>
              <button
                onClick={handleNext}
                disabled={!canNext()}
                className="flex items-center gap-1.5 text-sm bg-brand-600 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-40 hover:bg-brand-700 transition-colors"
              >
                {step === 4 ? 'Finalizar' : 'Siguiente'}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-ink-400 mt-6">
          ¿Necesitas ayuda? <a href="#" className="text-brand-500 hover:underline">Contacta soporte</a>
        </p>
      </div>
    </div>
  );
}
