import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Eye,
  EyeOff,
  XCircle,
  Loader2,
  MessageSquare,
  BarChart2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEMO_ROWS = [
  { label: 'Admin', email: 'carlos.perez@comfaguajira.com' },
  { label: 'Asesor', email: 'laura.gutierrez@comfaguajira.com' },
];

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect home
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
      {/* Left panel — brand info (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center gap-8 bg-gradient-to-br from-brand-700 to-brand-900 px-12 py-16">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 mb-6">
            <span className="text-xl font-black text-white">CF</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">COMFAGUAJIRA</h1>
          <p className="mt-2 text-lg text-white/70 font-medium">Plataforma de Atención Omnicanal</p>
        </div>

        <div className="space-y-5">
          {[
            {
              Icon: MessageSquare,
              title: 'Atención 24/7',
              desc: 'Chatbot con IA atiende a tus afiliados en WhatsApp, Web, Instagram y TikTok.',
            },
            {
              Icon: BarChart2,
              title: 'Analytics en tiempo real',
              desc: 'Monitorea conversaciones, intenciones y satisfacción desde un dashboard unificado.',
            },
            {
              Icon: Shield,
              title: 'Seguro y confiable',
              desc: 'Gestión de asesores con roles, escalamiento inteligente y trazabilidad completa.',
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white">{title}</p>
                <p className="text-sm text-white/60 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            {/* Brand */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600">
                <span className="text-lg font-black text-white">CF</span>
              </div>
              <h2 className="text-xl font-black text-brand-700">COMFAGUAJIRA</h2>
              <p className="text-xs text-slate-500 mt-0.5">Plataforma de Atención</p>
              <p className="mt-4 text-base font-semibold text-slate-800">
                Iniciar sesión como asesor
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Correo electrónico
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
                  <Mail size={15} className="flex-shrink-0 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@comfaguajira.com"
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Contraseña
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <XCircle size={15} className="flex-shrink-0 text-red-500" />
                  <p className="text-xs font-medium text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-bold text-slate-600 uppercase tracking-wide">
                Credenciales de demo
              </p>
              <div className="space-y-2">
                {DEMO_ROWS.map(({ label, email: demoEmail }) => (
                  <div
                    key={demoEmail}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{label}: </span>
                      <span className="text-[10px] text-slate-600 font-mono">{demoEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => autofill(demoEmail)}
                      className="flex-shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 hover:bg-brand-100 transition"
                    >
                      Autocompletar
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-slate-500">
                  <span className="font-bold">Contraseña:</span> demo1234
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
