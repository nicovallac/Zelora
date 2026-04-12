import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, MessageSquare, XCircle } from 'lucide-react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type VerifyState = 'loading' | 'success' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  token_invalid: 'El enlace de verificación no es válido.',
  token_expired: 'El enlace ha expirado. Solicita uno nuevo.',
  token_already_used: 'Este enlace ya fue usado. Si ya verificaste tu cuenta, inicia sesión.',
};

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [state, setState] = useState<VerifyState>('loading');
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token') ?? '';
    if (!token) {
      setErrorDetail('No se encontró el token de verificación en el enlace.');
      setState('error');
      return;
    }

    void (async () => {
      try {
        const data = await api.verifyEmail(token);
        // Persist session manually (same as login)
        localStorage.setItem('comfa_token', data.access);
        localStorage.setItem('comfa_refresh', data.refresh);
        localStorage.setItem('comfa_agent', JSON.stringify({
          id: data.user.id,
          nombre: [data.user.nombre, data.user.apellido].filter(Boolean).join(' ').trim() || data.user.nombre,
          email: data.user.email,
          rol: data.user.rol ?? 'asesor',
          organizationName: data.user.organization_name,
        }));
        setState('success');
        // Small delay to show success state, then redirect
        setTimeout(() => {
          sessionStorage.removeItem('pending_verification_email');
          navigate('/onboarding', { replace: true });
        }, 1800);
      } catch (err) {
        let detail = 'No se pudo verificar el email. Intenta de nuevo.';
        if (err instanceof ApiError) {
          const raw = err.message;
          detail = ERROR_MESSAGES[raw] ?? detail;
        }
        setErrorDetail(detail);
        setState('error');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #faf5ff 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-card">
            <MessageSquare size={22} />
          </div>
          <span className="text-xl font-black tracking-tight text-ink-800">Zelora</span>
        </div>

        <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white px-7 py-10 shadow-float text-center">
          {state === 'loading' && (
            <>
              <Loader2 size={40} className="mx-auto mb-4 animate-spin text-brand-500" />
              <h1 className="text-xl font-bold text-ink-900">Verificando tu email…</h1>
              <p className="mt-2 text-sm text-ink-500">Un momento, por favor.</p>
            </>
          )}

          {state === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="mb-4 flex justify-center"
              >
                <CheckCircle2 size={48} className="text-emerald-500" />
              </motion.div>
              <h1 className="text-xl font-bold text-ink-900">¡Email verificado!</h1>
              <p className="mt-2 text-sm text-ink-500">
                Tu cuenta está activa. Redirigiendo al onboarding…
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <XCircle size={48} className="mx-auto mb-4 text-rose-500" />
              <h1 className="text-xl font-bold text-ink-900">Enlace no válido</h1>
              <p className="mt-2 text-sm text-ink-500 leading-relaxed">{errorDetail}</p>
              <Link
                to="/email-verification-pending"
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600"
              >
                Solicitar nuevo enlace
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
