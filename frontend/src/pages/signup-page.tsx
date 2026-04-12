import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, CheckCircle2, Eye, EyeOff, Loader2, Mail, MessageSquare, User } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const BRAND_NAME_PLACEHOLDERS = [
  'Ej: Valdiri Move',
  'Ej: FitZone',
  'Ej: Natura Colombia',
  'Ej: TechHouse',
  'Ej: La Boutique',
  'Ej: Mundo Activo',
];

function useCyclePlaceholder(items: string[], interval = 3000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items.length, interval]);
  return items[index];
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-600' : 'text-ink-400'}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${met ? 'bg-emerald-500' : 'bg-ink-300'}`} />
      {label}
    </span>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError } = useNotification();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(false);
  const [companyAvailable, setCompanyAvailable] = useState(false);
  const [companySlug, setCompanySlug] = useState('');
  const [brandStepDone, setBrandStepDone] = useState(false);
  const [error, setError] = useState('');

  const placeholder = useCyclePlaceholder(BRAND_NAME_PLACEHOLDERS);

  useEffect(() => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailExists(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setCheckingEmail(true);
        const result = await api.signupAvailability({ email: trimmedEmail });
        setEmailExists(result.email_exists);
      } catch {
        setEmailExists(false);
      } finally {
        setCheckingEmail(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    const trimmedCompany = company.trim();
    if (trimmedCompany.length < 2) {
      setCompanyAvailable(false);
      setCompanySlug('');
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setCheckingCompany(true);
        const result = await api.signupAvailability({ company: trimmedCompany });
        setCompanyAvailable(result.company_available);
        setCompanySlug(result.company_slug);
      } catch {
        setCompanyAvailable(false);
        setCompanySlug('');
      } finally {
        setCheckingCompany(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [company]);

  const canContinueBrand = useMemo(
    () => company.trim().length >= 2 && companyAvailable && !checkingCompany,
    [company, companyAvailable, checkingCompany]
  );

  const emailFormatValid = /\S+@\S+\.\S+/.test(email);
  const pwHas8 = password.length >= 8;
  const pwHasLetter = /[a-zA-Z]/.test(password);
  const pwHasNumber = /[0-9]/.test(password);
  const passwordValid = pwHas8 && pwHasLetter && pwHasNumber;

  const canSubmit =
    name.trim().length >= 2 &&
    company.trim().length >= 2 &&
    emailFormatValid &&
    passwordValid &&
    !emailExists &&
    companyAvailable;

  function handleContinueBrand() {
    if (!canContinueBrand) return;
    setBrandStepDone(true);
    setError('');
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      await api.signup({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        password,
        plan: 'starter',
      });
      await login(email.trim(), password);
      navigate('/onboarding');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la cuenta.';
      setError(message);
      showError('Alta', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center px-4 py-12">
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
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-ink-900">
              {brandStepDone ? 'Crea tu acceso' : 'Elige el nombre de tu marca'}
            </h1>
            <p className="mt-1.5 text-sm text-ink-500">
              {brandStepDone
                ? 'Un último paso y ya estás dentro.'
                : 'Comprobamos disponibilidad antes de registrarte.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            {!brandStepDone ? (
              <>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-ink-700">Nombre de tu marca</span>
                  <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 bg-white ${company.trim().length > 1 && !companyAvailable && !checkingCompany ? 'border-rose-300' : 'border-[rgba(17,17,16,0.12)]'}`}>
                    <Building2 size={15} className="shrink-0 text-ink-400" />
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-transparent text-[13px] text-ink-800 outline-none placeholder-ink-400"
                    />
                  </div>
                </label>

                <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Tu URL pública</p>
                  <p className="mt-1.5 text-[13px] font-semibold text-ink-800">
                    {companySlug ? `zelora.app/${companySlug}` : 'Escribe un nombre para generar tu URL'}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {checkingCompany ? <span className="text-ink-400">Revisando...</span> : null}
                    {!checkingCompany && company.trim().length > 1 && companyAvailable ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                        <CheckCircle2 size={11} />
                        Disponible
                      </span>
                    ) : null}
                    {!checkingCompany && company.trim().length > 1 && !companyAvailable ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">
                        No disponible
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinueBrand}
                  disabled={!canContinueBrand}
                  className="w-full rounded-full bg-brand-500 py-3 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-50"
                >
                  Continuar con esta marca
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Marca</p>
                    <p className="mt-0.5 truncate text-[13px] font-semibold text-ink-800">{company}</p>
                    <p className="text-[11px] text-ink-500">zelora.app/{companySlug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBrandStepDone(false)}
                    className="inline-flex items-center gap-1 rounded-full border border-[rgba(17,17,16,0.10)] bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-700"
                  >
                    <ArrowLeft size={11} />
                    Cambiar
                  </button>
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-ink-700">Tu nombre</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-[rgba(17,17,16,0.12)] bg-white px-4 py-3">
                    <User size={15} className="shrink-0 text-ink-400" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Laura Gómez"
                      className="w-full bg-transparent text-[13px] text-ink-800 outline-none placeholder-ink-400"
                    />
                  </div>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-ink-700">Email</span>
                  <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 bg-white ${emailTouched && (!emailFormatValid || emailExists) ? 'border-rose-300' : emailTouched && emailFormatValid && !emailExists && !checkingEmail ? 'border-emerald-300' : 'border-[rgba(17,17,16,0.12)]'}`}>
                    <Mail size={15} className="shrink-0 text-ink-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="nombre@empresa.com"
                      className="w-full bg-transparent text-[13px] text-ink-800 outline-none placeholder-ink-400"
                    />
                    {emailTouched && emailFormatValid && !emailExists && !checkingEmail ? (
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                    ) : null}
                  </div>
                  {checkingEmail ? <p className="text-xs text-ink-400">Revisando...</p> : null}
                  {emailTouched && !emailFormatValid ? <p className="text-xs text-rose-600">Ingresa un email válido.</p> : null}
                  {emailTouched && emailFormatValid && emailExists ? <p className="text-xs text-rose-600">Este email ya tiene una cuenta.</p> : null}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-ink-700">Contraseña</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-[rgba(17,17,16,0.12)] bg-white px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="shrink-0 text-ink-400"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-transparent text-[13px] text-ink-800 outline-none placeholder-ink-400"
                    />
                  </div>
                  {(passwordTouched || password.length > 0) ? (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                      <PasswordRequirement met={pwHas8} label="8 caracteres" />
                      <PasswordRequirement met={pwHasLetter} label="Una letra" />
                      <PasswordRequirement met={pwHasNumber} label="Un número" />
                    </div>
                  ) : null}
                </label>
              </>
            )}

            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            ) : null}

            {brandStepDone ? (
              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                Crear cuenta y entrar
              </button>
            ) : null}
          </form>

          <p className="mt-5 text-center text-sm text-ink-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-ink-700 hover:text-ink-900">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
