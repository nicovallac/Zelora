import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Eye, EyeOff, XCircle, Loader2, MessageSquare, BarChart2, Shield, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { USE_MOCK_DATA } from '../lib/runtime';

const DEMO_ROWS = [
  { label: 'Admin', email: 'carlos.perez@comfaguajira.com' },
  { label: 'Asesor', email: 'laura.gutierrez@comfaguajira.com' },
];

const FEATURES = [
  { Icon: MessageSquare, title: 'Omnicanal 24/7',       desc: 'WhatsApp, Instagram, Web y más.' },
  { Icon: BarChart2,     title: 'Analytics en tiempo real', desc: 'KPIs e intenciones unificados.' },
  { Icon: Shield,        title: 'Seguro y trazable',    desc: 'Roles y auditoría completa.' },
  { Icon: Zap,           title: 'IA que aprende',       desc: 'Mejora con cada conversación.' },
];

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

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
    if (!USE_MOCK_DATA) return;
    setEmail(demoEmail);
    setPassword('demo1234');
    setError('');
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16"
      style={{ background: '#0f0e13' }}
    >

      {/* ── Background: violet grid ──────────────────────────── */}
      {/* Grid lines tinted violet so they're actually visible */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.22) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.22) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 55% 60% at 50% 50%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 55% 60% at 50% 50%, black 0%, transparent 100%)',
        }}
      />

      {/* Strong violet spotlight — glows behind the form */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 52%, rgba(109,40,217,0.38) 0%, transparent 65%),
            radial-gradient(ellipse 40% 30% at 50% 52%, rgba(139,92,246,0.22) 0%, transparent 55%)
          `,
        }}
      />

      {/* Edge vignette — fades grid to black at borders */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(15,14,19,0.85) 100%)
          `,
        }}
      />

      {/* ── Content ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 flex w-full max-w-[420px] flex-col items-center"
      >
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
          >
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-[20px] font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            Zelora
          </span>
        </div>

        {/* Headline */}
        <div className="mb-8 text-center">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.28)',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-brand-400"
              style={{ boxShadow: '0 0 6px rgba(167,139,250,0.9)' }}
            />
            <span className="text-[11px] font-semibold uppercase text-brand-300" style={{ letterSpacing: '0.12em' }}>
              Para PYMEs en LATAM
            </span>
          </div>
          <h1
            className="text-[28px] font-extrabold leading-[1.15] text-white"
            style={{ letterSpacing: '-0.025em' }}
          >
            La IA de atención<br />
            <span className="text-brand-400">que tu negocio necesita</span>
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Automatiza el 74% de tus consultas desde el día 1.
          </p>
        </div>

        {/* Form card */}
        <div
          className="w-full rounded-3xl p-7"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 60px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Correo electrónico
              </label>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-150 focus-within:ring-2 focus-within:ring-brand-500/40"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
              >
                <Mail size={14} style={{ color: 'rgba(255,255,255,0.30)', flexShrink: 0 }} />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[rgba(255,255,255,0.28)]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  Contraseña
                </label>
                <a href="#" className="text-[11px] font-medium text-brand-400 transition-colors hover:text-brand-300">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-150 focus-within:ring-2 focus-within:ring-brand-500/40"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
              >
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[rgba(255,255,255,0.28)]"
                />
                <button
                  type="button"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPass((v) => !v)}
                  className="shrink-0 cursor-pointer transition-colors"
                  style={{ color: 'rgba(255,255,255,0.30)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.70)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.30)'; }}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                <XCircle size={14} className="shrink-0 text-red-400" />
                <p className="text-[12px] font-medium text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                boxShadow: '0 0 0 1px rgba(139,92,246,0.40) inset, 0 4px 16px rgba(109,40,217,0.45)',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 0 0 1px rgba(139,92,246,0.50) inset, 0 6px 24px rgba(109,40,217,0.60)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 0 0 1px rgba(139,92,246,0.40) inset, 0 4px 16px rgba(109,40,217,0.45)';
              }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Signup link */}
          <p className="mt-5 text-center text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/signup" className="font-semibold text-brand-300 transition-colors hover:text-brand-200">
              Regístrate gratis
            </Link>
          </p>

          {/* Demo credentials */}
          {USE_MOCK_DATA && (
            <div
              className="mt-5 rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p className="mb-3 text-[10px] font-bold uppercase" style={{ letterSpacing: '0.12em', color: 'rgba(255,255,255,0.30)' }}>
                Credenciales de demo
              </p>
              <div className="space-y-2">
                {DEMO_ROWS.map(({ label, email: demoEmail }) => (
                  <div key={demoEmail} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}: </span>
                      <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{demoEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => autofill(demoEmail)}
                      className="shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors"
                      style={{
                        color: 'rgba(255,255,255,0.55)',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      Autocompletar
                    </button>
                  </div>
                ))}
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  <span className="font-bold">Contraseña:</span> demo1234
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature strip */}
        <div className="mt-8 grid w-full grid-cols-2 gap-3">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-2.5 rounded-2xl p-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.22)',
                }}
              >
                <Icon size={13} className="text-brand-400" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-white/70">{title}</p>
                <p className="mt-0.5 text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.32)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          © 2026 Zelora · Todos los derechos reservados
        </p>
      </motion.div>
    </div>
  );
}
