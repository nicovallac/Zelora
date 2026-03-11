import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Phone, Users, BookOpen, Rocket, ChevronRight,
  ChevronLeft, Check, Globe, Instagram, Mail, Send, MessageSquare,
  Upload, Plus, Trash2, Sparkles, ArrowRight, Lock
} from 'lucide-react';
import { BarChart3, Plug, GitBranch, Inbox, Brain, Megaphone } from 'lucide-react';

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

const BUSINESS_SIZES = [
  { id: 'micro', label: 'Micro', hint: '1-10 personas' },
  { id: 'small', label: 'Pequena', hint: '11-50 personas' },
  { id: 'medium', label: 'Mediana', hint: '51-200 personas' },
  { id: 'sme', label: 'PyME', hint: 'Escala flexible' },
];

const PREVIEW_MODULES = [
  { id: 'inbox', name: 'Inbox Omnicanal', desc: 'Atencion unificada por canal.', icon: Inbox, requiredStep: 1, audience: 'Micro y pequena' },
  { id: 'workspace', name: 'AI Workspace', desc: 'Sales, Marketing y Operations IA.', icon: Brain, requiredStep: 2, audience: 'Todas' },
  { id: 'analytics', name: 'Analytics BI', desc: 'KPIs para decisiones rapidas.', icon: BarChart3, requiredStep: 2, audience: 'Pequena y mediana' },
  { id: 'campaigns', name: 'Campanas', desc: 'Promociones y mensajes por segmento.', icon: Megaphone, requiredStep: 3, audience: 'Pequena y mediana' },
  { id: 'flows', name: 'Flow Builder', desc: 'Automatizaciones por escenario.', icon: GitBranch, requiredStep: 4, audience: 'PyME y mediana' },
  { id: 'integrations', name: 'Integraciones', desc: 'Conecta ERP, CRM y fuentes.', icon: Plug, requiredStep: 4, audience: 'Mediana y PyME' },
];

const CHANNELS = [
  {
    id: 'whatsapp', name: 'WhatsApp Business', icon: Phone, locked: false,
    description: 'API oficial Meta · hasta 1K conv/día gratuitas', recommended: true,
    iconStyle: { background: '#DCFCE7', color: '#16A34A' },
    borderColor: '#16A34A',
  },
  {
    id: 'instagram', name: 'Instagram DM', icon: Instagram, locked: false,
    description: 'Inbox unificado con Instagram Direct', recommended: false,
    iconStyle: { background: 'linear-gradient(135deg,#833AB4,#FD1D1D,#FCB045)', color: '#fff' },
    borderColor: '#FD1D1D',
  },
  {
    id: 'webchat', name: 'Web Chat', icon: Globe, locked: false,
    description: 'Widget embebible en tu sitio web', recommended: false,
    iconStyle: { background: '#E0F2FE', color: '#0284C7' },
    borderColor: '#0284C7',
  },
  {
    id: 'tiktok', name: 'TikTok', icon: MessageSquare, locked: true,
    description: 'Comentarios y DMs de TikTok · Próximamente', recommended: false,
    iconStyle: { background: '#000', color: '#FE2C55' },
    borderColor: '#FE2C55',
  },
  {
    id: 'email', name: 'Email', icon: Mail, locked: true,
    description: 'Gestión de bandeja de entrada · Próximamente', recommended: false,
    iconStyle: { background: '#FEE2E2', color: '#EA4335' },
    borderColor: '#EA4335',
  },
  {
    id: 'telegram', name: 'Telegram', icon: Send, locked: true,
    description: 'Bot de Telegram · Próximamente', recommended: false,
    iconStyle: { background: '#E0F7FF', color: '#2AABEE' },
    borderColor: '#2AABEE',
  },
];

interface TeamMember { email: string; role: 'admin' | 'supervisor' | 'asesor'; }
interface KBTopic { title: string; content: string; }
const ONBOARDING_STORAGE_KEY = 'vendly_onboarding_state_v1';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessSize, setBusinessSize] = useState('micro');
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
  const [unlockedModules, setUnlockedModules] = useState<string[]>([]);
  const [recentlyUnlockedId, setRecentlyUnlockedId] = useState<string | null>(null);
  const [tourModuleId, setTourModuleId] = useState<string | null>(null);

  const canNext = () => {
    if (step === 1) return orgName.trim().length >= 2 && industry && businessSize;
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
    setTimeout(() => {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      navigate('/');
    }, 2000);
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

  const isModuleAvailable = (requiredStep: number) => step >= requiredStep;
  const isModuleUnlocked = (id: string) => unlockedModules.includes(id);
  const unlockModule = (id: string, requiredStep: number) => {
    if (!isModuleAvailable(requiredStep)) return;
    setUnlockedModules(prev => {
      if (prev.includes(id)) return prev;
      setRecentlyUnlockedId(id);
      setTourModuleId(id);
      return [...prev, id];
    });
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        step?: number;
        orgName?: string;
        industry?: string;
        businessSize?: string;
        country?: string;
        website?: string;
        selectedChannels?: string[];
        teamMembers?: TeamMember[];
        kbTopics?: KBTopic[];
        unlockedModules?: string[];
      };
      if (saved.step) setStep(saved.step);
      if (saved.orgName) setOrgName(saved.orgName);
      if (saved.industry) setIndustry(saved.industry);
      if (saved.businessSize) setBusinessSize(saved.businessSize);
      if (saved.country) setCountry(saved.country);
      if (saved.website) setWebsite(saved.website);
      if (saved.selectedChannels?.length) setSelectedChannels(saved.selectedChannels);
      if (saved.teamMembers?.length) setTeamMembers(saved.teamMembers);
      if (saved.kbTopics?.length) setKbTopics(saved.kbTopics);
      if (saved.unlockedModules?.length) setUnlockedModules(saved.unlockedModules);
    } catch {
      // ignore corrupt cache
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          step,
          orgName,
          industry,
          businessSize,
          country,
          website,
          selectedChannels,
          teamMembers,
          kbTopics,
          unlockedModules,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [businessSize, country, industry, kbTopics, orgName, selectedChannels, step, teamMembers, unlockedModules, website]);

  useEffect(() => {
    if (!recentlyUnlockedId) return;
    const timer = setTimeout(() => setRecentlyUnlockedId(null), 1200);
    return () => clearTimeout(timer);
  }, [recentlyUnlockedId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-ink-900">Vendly</span>
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)]">
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
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Tamano de empresa *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUSINESS_SIZES.map(size => (
                        <button
                          key={size.id}
                          onClick={() => setBusinessSize(size.id)}
                          className={`rounded-lg border px-3 py-2 text-left transition ${
                            businessSize === size.id
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-ink-200 hover:border-brand-300 hover:bg-brand-50/50'
                          }`}
                        >
                          <p className={`text-xs font-semibold ${businessSize === size.id ? 'text-brand-700' : 'text-ink-700'}`}>{size.label}</p>
                          <p className="text-[11px] text-ink-500">{size.hint}</p>
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
                      onClick={() => !ch.locked && toggleChannel(ch.id)}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        ch.locked
                          ? 'border-ink-200 cursor-not-allowed'
                          : selectedChannels.includes(ch.id)
                            ? 'cursor-pointer bg-ink-50'
                            : 'border-ink-200 cursor-pointer hover:border-ink-300'
                      }`}
                      style={!ch.locked && selectedChannels.includes(ch.id) ? { borderColor: ch.borderColor, background: `${ch.borderColor}08` } : {}}
                    >
                      {ch.locked && (
                        <div className="absolute inset-0 rounded-xl backdrop-blur-[1.5px] bg-white/50 flex items-center justify-end pr-4 z-10">
                          <div className="flex items-center gap-1.5 bg-ink-100 rounded-full px-3 py-1">
                            <Lock size={11} className="text-ink-500" />
                            <span className="text-xs text-ink-500 font-medium">Próximamente</span>
                          </div>
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={ch.iconStyle}>
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
                      {!ch.locked && (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          selectedChannels.includes(ch.id) ? 'border-transparent' : 'border-ink-300'
                        }`} style={selectedChannels.includes(ch.id) ? { background: ch.borderColor, borderColor: ch.borderColor } : {}}>
                          {selectedChannels.includes(ch.id) && <Check size={12} className="text-white" />}
                        </div>
                      )}
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
        <aside className="rounded-2xl border border-ink-200 bg-white/90 p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Vista desbloqueable</p>
            <h3 className="text-lg font-bold text-ink-900 mt-1">Tu plataforma por etapas</h3>
            <p className="text-xs text-ink-500 mt-1">
              Pensado para micro, pequena, mediana y pyme: avanza paso a paso y desbloquea modulos con click.
            </p>
          </div>

          <div className="mb-3 rounded-xl border border-ink-100 bg-ink-50 p-3">
            <p className="text-xs font-semibold text-ink-700">Segmento actual</p>
            <p className="text-sm font-bold text-ink-900">
              {BUSINESS_SIZES.find((s) => s.id === businessSize)?.label} · {BUSINESS_SIZES.find((s) => s.id === businessSize)?.hint}
            </p>
            <p className="text-xs text-ink-500 mt-1">Paso {step} de {STEPS.length}</p>
          </div>

          <div className="space-y-2">
            {PREVIEW_MODULES.map((module) => {
              const available = isModuleAvailable(module.requiredStep);
              const unlocked = isModuleUnlocked(module.id);
              const Icon = module.icon;
              const isNew = recentlyUnlockedId === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => unlockModule(module.id, module.requiredStep)}
                  className={`w-full text-left rounded-xl border bg-white p-3 transition hover:border-brand-300 ${
                    isNew ? 'border-emerald-300 ring-2 ring-emerald-100 animate-pulse' : 'border-ink-200'
                  }`}
                >
                  <div className={`relative ${available && unlocked ? '' : available ? 'blur-[1px]' : 'blur-[2px]'} transition-all`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${available && unlocked ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink-900">{module.name}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{module.desc}</p>
                        <p className="text-[11px] text-ink-400 mt-1">Ideal para: {module.audience}</p>
                      </div>
                    </div>
                  </div>

                  {!available && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-1 text-[11px] font-semibold text-ink-600">
                      <Lock size={11} />
                      Se habilita en paso {module.requiredStep}
                    </div>
                  )}
                  {available && !unlocked && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700">
                      Click para desbloquear
                    </div>
                  )}
                  {available && unlocked && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      <Check size={11} />
                      Modulo desbloqueado
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {tourModuleId && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Mini tour</p>
                <p className="text-sm font-bold text-brand-900 mt-1">
                  {PREVIEW_MODULES.find((m) => m.id === tourModuleId)?.name} desbloqueado
                </p>
                <p className="text-xs text-brand-800 mt-1">
                  {PREVIEW_MODULES.find((m) => m.id === tourModuleId)?.desc}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setTourModuleId(null)}
                    className="rounded-md bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-700"
                  >
                    Entendido
                  </button>
                  <span className="text-[11px] text-brand-700">Siguiente: completa el paso {Math.min(step + 1, 5)} para desbloquear más.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
        </div>

        <p className="text-center text-xs text-ink-400 mt-6">
          ¿Necesitas ayuda? <a href="#" className="text-brand-500 hover:underline">Contacta soporte</a>
        </p>
      </div>
    </div>
  );
}
