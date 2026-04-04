import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, CheckCircle2, Eye, EyeOff, Loader2, Mail, MessageSquare, User } from 'lucide-react';
import { api } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingCompany, setCheckingCompany] = useState(false);
  const [companyAvailable, setCompanyAvailable] = useState(false);
  const [companySlug, setCompanySlug] = useState('');
  const [brandStepDone, setBrandStepDone] = useState(false);
  const [error, setError] = useState('');

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

  const canSubmit =
    name.trim().length >= 2 &&
    company.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 8 &&
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

      const loginData = await api.login(email.trim(), password);
      const agentInfo = {
        id: loginData.user.id,
        nombre: [loginData.user.nombre, loginData.user.apellido].filter(Boolean).join(' ').trim() || loginData.user.nombre,
        email: loginData.user.email,
        rol: loginData.user.rol,
      };
      localStorage.setItem('comfa_token', loginData.access);
      localStorage.setItem('comfa_refresh', loginData.refresh);
      localStorage.setItem('comfa_agent', JSON.stringify(agentInfo));
      navigate('/onboarding');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la cuenta.';
      setError(message);
      setLoading(false);
      showError('Alta', message);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#eceae4] px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(17,17,16,0.08)] bg-[rgba(255,255,255,0.75)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-700">
              <MessageSquare size={14} />
              Activacion rapida para pymes
            </div>
            <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight text-ink-800">
              Reserva tu marca y entra en minutos
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">
              Primero definimos la identidad publica de tu espacio. Despues creas tu acceso y entras directo al onboarding.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Valida tu marca antes de registrarte',
                'Tu URL publica queda definida desde el inicio',
                'El backend vuelve a verificar al crear la cuenta',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-1 text-emerald-700">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-sm font-medium text-ink-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white">
              <MessageSquare size={18} />
            </div>
            <span className="text-xl font-black tracking-tight text-ink-800">Zelora</span>
          </div>

          <div className="rounded-4xl border border-[rgba(17,17,16,0.08)] bg-white/75 p-6 shadow-float backdrop-blur-md sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                {brandStepDone ? 'Crear cuenta' : 'Primero tu marca'}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink-800">
                {brandStepDone ? 'Ahora crea tu acceso' : 'Elige el nombre de tu marca'}
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                {brandStepDone
                  ? 'Tu espacio ya tiene identidad. Solo falta tu usuario administrador.'
                  : 'Comprobamos si el nombre ya esta registrado y te mostramos la URL propuesta antes del signup.'}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSignup}>
              {!brandStepDone ? (
                <>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink-700">Nombre de tu marca</span>
                    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 bg-white/80 ${company.trim().length > 1 && !companyAvailable && !checkingCompany ? 'border-rose-300' : 'border-[rgba(17,17,16,0.10)]'}`}>
                      <Building2 size={16} className="text-ink-400" />
                      <input
                        value={company}
                        onChange={(event) => setCompany(event.target.value)}
                        placeholder="Ej: Valdiri Move"
                        className="w-full bg-transparent text-[13px] text-ink-800 outline-none placeholder-ink-400"
                      />
                    </div>
                  </label>

                  <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Identidad publica</p>
                    <p className="mt-2 text-[13px] font-semibold text-ink-800">
                      {companySlug ? `vendly.com/${companySlug}` : 'Escribe un nombre para generar tu URL'}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      {checkingCompany ? <span className="text-ink-400">Revisando disponibilidad...</span> : null}
                      {!checkingCompany && company.trim().length > 1 && companyAvailable ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                          <CheckCircle2 size={12} />
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-500 disabled:opacity-60"
                  >
                    Continuar con esta marca
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-3xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Marca elegida</p>
                      <p className="mt-1 truncate text-[14px] font-semibold text-ink-800">{company}</p>
                      <p className="mt-0.5 text-[12px] text-ink-500">vendly.com/{companySlug}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrandStepDone(false)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-700"
                    >
                      <ArrowLeft size={12} />
                      Cambiar
                    </button>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink-700">Tu nombre</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3">
                      <User size={16} className="text-ink-400" />
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Ej: Laura Gomez"
                        className="w-full bg-transparent text-[13px] text-ink-800 outline-none placeholder-ink-400"
                      />
                    </div>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink-700">Email</span>
                    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 bg-white/80 ${emailExists ? 'border-rose-300' : 'border-[rgba(17,17,16,0.10)]'}`}>
                      <Mail size={16} className="text-ink-400" />
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="nombre@empresa.com"
                        className="w-full bg-transparent text-[13px] text-ink-800 outline-none placeholder-ink-400"
                      />
                    </div>
                    {checkingEmail ? <p className="text-xs text-ink-400">Revisando disponibilidad...</p> : null}
                    {emailExists ? <p className="text-xs font-medium text-rose-600">Este email ya tiene una cuenta.</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink-700">Contrasena</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3">
                      <button type="button" onClick={() => setShowPass((value) => !value)} className="text-ink-400">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Minimo 8 caracteres"
                        className="w-full bg-transparent text-[13px] text-ink-800 outline-none placeholder-ink-400"
                      />
                    </div>
                  </label>
                </>
              )}

              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

              {brandStepDone ? (
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-500 disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Crear cuenta y entrar
                </button>
              ) : null}
            </form>

            <p className="mt-5 text-center text-sm text-ink-500">
              Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-ink-700 hover:text-ink-900">
                Inicia sesion
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
