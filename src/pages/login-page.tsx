import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Eye, EyeOff, XCircle, Loader2, MessageSquare, BarChart2, Shield, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEMO_ROWS = [
  { label: 'Admin', email: 'carlos.perez@comfaguajira.com' },
  { label: 'Asesor', email: 'laura.gutierrez@comfaguajira.com' },
];

const FEATURES = [
  { Icon: MessageSquare, title: 'Atención omnicanal 24/7', desc: 'WhatsApp, Instagram, Web Chat y más desde un solo lugar.' },
  { Icon: BarChart2, title: 'Analytics en tiempo real', desc: 'KPIs, satisfacción e intenciones en un dashboard unificado.' },
  { Icon: Shield, title: 'Seguro y trazable', desc: 'Roles, escalamiento inteligente y auditoría completa.' },
  { Icon: Zap, title: 'IA que aprende', desc: 'Tu base de conocimiento mejora con cada conversación.' },
];

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  function autofill(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('demo1234');
    setError('');
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
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5 mb-4">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wide">Para PYMEs en LATAM</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">
              La IA de atención<br />que tu PYME necesita
            </h1>
            <p className="mt-3 text-lg text-white/60 leading-relaxed">
              Automatiza el 74% de tus consultas desde el día 1. Sin infraestructura costosa, sin equipos grandes.
            </p>
          </div>
          <div className="space-y-5">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">{title}</p>
                  <p className="text-sm text-white/55 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
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
            <div className="mb-7 text-center">
              <h2 className="text-2xl font-black text-ink-900">Bienvenido de vuelta</h2>
              <p className="text-sm text-slate-500 mt-1">Inicia sesión en tu cuenta de Vendly</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Correo electrónico</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
                  <Mail size={15} className="shrink-0 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">Contraseña</label>
                  <a href="#" className="text-xs text-brand-600 hover:underline font-medium">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="shrink-0 text-slate-400 hover:text-slate-600 transition">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <XCircle size={15} className="shrink-0 text-red-500" />
                  <p className="text-xs font-medium text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              ¿No tienes cuenta?{' '}
              <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
                Regístrate gratis
              </Link>
            </p>

            {/* Demo credentials */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Credenciales de demo</p>
              <div className="space-y-2">
                {DEMO_ROWS.map(({ label, email: demoEmail }) => (
                  <div key={demoEmail} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{label}: </span>
                      <span className="text-[10px] text-slate-600 font-mono">{demoEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => autofill(demoEmail)}
                      className="shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 hover:bg-brand-100 transition"
                    >
                      Autocompletar
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-slate-500"><span className="font-bold">Contraseña:</span> demo1234</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
