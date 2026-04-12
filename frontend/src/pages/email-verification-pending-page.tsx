import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { api, ApiError } from '../services/api';

const RESEND_COOLDOWN_S = 60;

export default function EmailVerificationPendingPage() {
  const email = sessionStorage.getItem('pending_verification_email') ?? '';
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setMessage('');
    setError('');
    try {
      await api.resendVerification(email);
      setMessage('Email reenviado. Revisa tu bandeja de entrada.');
      let remaining = RESEND_COOLDOWN_S;
      setCooldown(remaining);
      const id = setInterval(() => {
        remaining -= 1;
        setCooldown(remaining);
        if (remaining <= 0) clearInterval(id);
      }, 1000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Has solicitado demasiados emails. Intenta más tarde.');
      } else {
        setError('No se pudo reenviar el email. Intenta de nuevo.');
      }
    } finally {
      setResending(false);
    }
  }

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

        <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white px-7 py-8 shadow-float">
          {/* Icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
              <Mail size={28} className="text-violet-600" />
            </div>
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-ink-900">Revisa tu email</h1>
            <p className="mt-2 text-sm text-ink-500 leading-relaxed">
              Te enviamos un enlace de verificación a{' '}
              {email ? (
                <span className="font-semibold text-ink-800">{email}</span>
              ) : (
                'tu email'
              )}
              . Haz clic en él para activar tu cuenta.
            </p>
          </div>

          {/* Resend */}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending || !email}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(17,17,16,0.12)] bg-white px-4 py-3 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
            {cooldown > 0
              ? `Reenviar en ${cooldown}s`
              : resending
              ? 'Enviando...'
              : 'Reenviar email'}
          </button>

          {message ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-700">
              {error}
            </p>
          ) : null}

          <p className="mt-5 text-center text-xs text-ink-400">
            ¿Email equivocado?{' '}
            <Link
              to="/signup"
              className="font-semibold text-brand-500 transition hover:text-brand-600"
            >
              Volver al registro
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          El enlace expira en 24 horas.
        </p>
      </motion.div>
    </div>
  );
}
