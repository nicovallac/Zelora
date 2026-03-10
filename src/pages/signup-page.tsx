import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Eye, EyeOff, Loader2, MessageSquare, User, Building2,
  CheckCircle, ArrowRight
} from 'lucide-react';

const PLANS = [
  { id: 'starter', name: 'Starter', price: 'Gratis', desc: '1 canal · 500 conv/mes · 1 agente', highlight: false },
  { id: 'pro', name: 'Pro', price: '$299/mes', desc: '5 canales · 5.000 conv/mes · 10 agentes', highlight: true },
  { id: 'enterprise', name: 'Enterprise', price: 'A medida', desc: 'Canales ilimitados · volumen personalizado', highlight: false },
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-400'];
  const labels = ['Muy débil', 'Débil', 'Buena', 'Fuerte'];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
        {labels[score - 1] || ''}
      </p>
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2 fields
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  void setError; // reserved for future API error handling

  const canStep1 = name.trim().length >= 2 && company.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) && password.length >= 8 && password === confirm;

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!canStep1) return;
    setStep(2);
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate account creation
    setTimeout(() => {
      setLoading(false);
      navigate('/onboarding');
    }, 1500);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-900 px-12 py-14">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <MessageSquare size={18} className="text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">Vendly</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Empieza en<br />menos de 5 minutos
            </h1>
            <p className="mt-3 text-lg text-white/60 leading-relaxed">
              Crea tu cuenta, conecta tus canales y empieza a atender clientes con IA hoy mismo.
            </p>
          </div>

          <div className="space-y-4">
            {[
              'Sin tarjeta de crédito para el plan Starter',
              'Configuración guiada paso a paso',
              'Soporte en español incluido',
              'Cancela cuando quieras',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-white/70 font-medium">{item}</p>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-white/80 text-sm italic leading-relaxed">
              "Con Vendly redujimos el tiempo de respuesta de 4 horas a 38 segundos. Nuestros clientes lo notaron de inmediato."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white">MP</div>
              <div>
                <p className="text-xs font-bold text-white">María Pérez</p>
                <p className="text-xs text-white/50">Directora de Operaciones · Comfaguajira</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/30">© 2026 Vendly · Todos los derechos reservados</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <MessageSquare size={18} className="text-white" />
            </div>
            <span className="text-xl font-black text-brand-700 tracking-tight">Vendly</span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-7">
              {[1, 2].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-brand-600' : 'bg-slate-200'}`} />
              ))}
            </div>

            {step === 1 && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-black text-ink-900">Crea tu cuenta</h2>
                  <p className="text-sm text-slate-500 mt-1">Empieza gratis, sin tarjeta de crédito</p>
                </div>

                <form onSubmit={handleStep1} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Tu nombre *</label>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
                        <User size={14} className="shrink-0 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Nombre"
                          className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Empresa *</label>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
                        <Building2 size={14} className="shrink-0 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={e => setCompany(e.target.value)}
                          placeholder="Empresa"
                          className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Correo electrónico *</label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
                      <Mail size={14} className="shrink-0 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="correo@empresa.com"
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Contraseña *</label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)} className="shrink-0 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Confirmar contraseña *</label>
                    <div className={`flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand-100 transition ${confirm && password !== confirm ? 'border-red-300 focus-within:border-red-400' : 'border-slate-200 focus-within:border-brand-400'}`}>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="shrink-0 text-slate-400 hover:text-slate-600">
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {confirm && password !== confirm && (
                      <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                    )}
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={!canStep1}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  >
                    Continuar
                    <ArrowRight size={15} />
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-black text-ink-900">Elige tu plan</h2>
                  <p className="text-sm text-slate-500 mt-1">Puedes cambiar de plan en cualquier momento</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-3">
                  {PLANS.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {plan.highlight && (
                        <span className="absolute -top-2.5 left-4 text-xs bg-brand-600 text-white px-2.5 py-0.5 rounded-full font-bold">
                          Más popular
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-ink-900">{plan.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{plan.desc}</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <p className="font-bold text-brand-700">{plan.price}</p>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan === plan.id ? 'bg-brand-600 border-brand-600' : 'border-slate-300'}`}>
                            {selectedPlan === plan.id && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <p className="text-xs text-slate-400 text-center pt-1">
                    Al registrarte aceptas los <a href="#" className="text-brand-500 hover:underline">Términos de servicio</a> y la <a href="#" className="text-brand-500 hover:underline">Política de privacidad</a>
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? 'Creando tu cuenta...' : 'Crear cuenta y continuar'}
                    {!loading && <ArrowRight size={15} />}
                  </button>

                  <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-slate-500 hover:text-slate-700 py-1">
                    ← Volver
                  </button>
                </form>
              </>
            )}

            <p className="mt-5 text-center text-sm text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
