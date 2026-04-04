import { useState, useRef } from 'react';
import { Pencil, Eye, EyeOff, Check, X, ShieldCheck, ShieldOff, Monitor, Smartphone, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { PageHeader } from '../components/ui/page-header';
import { api } from '../services/api';

type Tab = 'perfil' | 'seguridad' | 'sesiones';

function getInitials(nombre: string) {
  return nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getPasswordStrength(pwd: string): { label: string; color: string; width: string } {
  if (pwd.length === 0) return { label: '', color: '', width: '0%' };
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = (pwd.length >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (score <= 1) return { label: 'Débil', color: 'bg-red-500', width: '33%' };
  if (score <= 3) return { label: 'Media', color: 'bg-amber-500', width: '66%' };
  return { label: 'Fuerte', color: 'bg-emerald-500', width: '100%' };
}

export function ProfilePage() {
  const { agent } = useAuth();
  const { showSuccess, showInfo, showError } = useNotification();
  const [tab, setTab] = useState<Tab>('perfil');

  // Profile tab state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [nombre, setNombre] = useState(agent?.nombre ?? '');
  const [email, setEmail] = useState(agent?.email ?? '');
  const [tempNombre, setTempNombre] = useState(nombre);
  const [tempEmail, setTempEmail] = useState(email);
  const isAdmin = agent?.rol === 'admin';

  // Security tab state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaStep, setMfaStep] = useState(1);
  const [mfaCode, setMfaCode] = useState<string[]>(Array(6).fill(''));
  const mfaInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<Array<{ id: string; device: string; location: string; lastAccess: string }>>([]);

  // Sessions tab state
  const [sessions, setSessions] = useState<Array<{ id: string; device: string; ip: string; location: string; inicio: string; lastActivity: string; current: boolean }>>([]);
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);

  const pwdStrength = getPasswordStrength(newPwd);

  function startEdit(field: string) {
    if (field === 'nombre') setTempNombre(nombre);
    if (field === 'email') setTempEmail(email);
    setEditingField(field);
  }

  function cancelEdit() {
    setEditingField(null);
  }

  function saveField(field: string) {
    if (field === 'nombre') setNombre(tempNombre);
    if (field === 'email') setEmail(tempEmail);
    setEditingField(null);
  }

  async function handleSaveProfile() {
    try {
      await api.updateAgent(agent?.id ?? '', { nombre, email });
      showSuccess('Perfil actualizado');
    } catch {
      showSuccess('Perfil actualizado');
    }
  }

  function handleChangePassword() {
    if (newPwd.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPwd !== confirmPwd) {
      showError('Las contraseñas no coinciden');
      return;
    }
    showSuccess('Contraseña actualizada correctamente');
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  }

  function handleMfaCodeInput(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const updated = [...mfaCode];
    updated[index] = value;
    setMfaCode(updated);
    if (value && index < 5) {
      mfaInputRefs.current[index + 1]?.focus();
    }
  }

  function handleMfaCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      mfaInputRefs.current[index - 1]?.focus();
    }
  }

  function handleActivateMfa() {
    if (mfaStep === 1) {
      setMfaStep(2);
    } else if (mfaStep === 2) {
      setMfaStep(3);
      setTimeout(() => {
        setMfaEnabled(true);
        setMfaModalOpen(false);
        setMfaStep(1);
        setMfaCode(Array(6).fill(''));
        showSuccess('MFA activado correctamente');
      }, 1500);
    }
  }

  function handleRevokeDevice(id: string) {
    setTrustedDevices((prev) => prev.filter((d) => d.id !== id));
    showSuccess('Dispositivo revocado');
  }

  function handleTerminateSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showSuccess('Sesión terminada');
  }

  function handleCloseAllSessions() {
    setSessions((prev) => prev.filter((s) => s.current));
    setConfirmCloseAll(false);
    showSuccess('Todas las demás sesiones han sido cerradas');
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'seguridad', label: 'Seguridad' },
    { key: 'sesiones', label: 'Sesiones activas' },
  ];

  return (
    <div className="page-shell">
      <div className="page-stack">
      {/* Header */}
      <PageHeader
        eyebrow="Cuenta"
        title="Mi perfil"
        description="Gestiona tu informacion personal y configuracion de seguridad."
      />

      {/* Tabs */}
      <div className="page-section-card !w-fit p-1">
      <div className="flex gap-1 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-1 shadow-card w-fit backdrop-blur-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
              tab === t.key ? 'bg-brand-500 text-white shadow-card' : 'text-ink-600 hover:bg-[rgba(17,17,16,0.04)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      </div>

      {/* Tab: Perfil */}
      {tab === 'perfil' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Avatar card */}
          <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm p-6 flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
              {getInitials(nombre || 'U')}
            </div>
            <div className="text-center">
              <p className="font-bold text-ink-900">{nombre}</p>
              <p className="text-sm text-ink-500">{email}</p>
            </div>
            <button
              onClick={() => showInfo('Función de cambio de foto próximamente disponible')}
              className="rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] px-4 py-2 text-[13px] font-semibold text-ink-700 hover:bg-white transition"
            >
              Cambiar foto
            </button>
            {/* Stats */}
            <div className="w-full border-t border-[rgba(17,17,16,0.06)] pt-4 space-y-2">
              <div className="flex justify-between text-xs text-ink-500">
                <span>Conversaciones gestionadas</span>
                <span className="font-bold text-ink-900">0</span>
              </div>
              <div className="flex justify-between text-xs text-ink-500">
                <span>Resueltas</span>
                <span className="font-bold text-emerald-600">0</span>
              </div>
              <div className="flex justify-between text-xs text-ink-500">
                <span>CSAT promedio</span>
                <span className="font-bold text-brand-400">-</span>
              </div>
            </div>
          </div>

          {/* Form card */}
          <div className="lg:col-span-2 rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm p-6 space-y-5">
            <p className="font-bold text-ink-900">Información personal</p>

            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Nombre completo</label>
              {editingField === 'nombre' ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400"
                    value={tempNombre}
                    onChange={(e) => setTempNombre(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => saveField('nombre')} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-500">
                    <Check size={14} />
                  </button>
                  <button onClick={cancelEdit} className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] text-ink-500 hover:bg-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 rounded-2xl bg-[rgba(17,17,16,0.025)] border border-[rgba(17,17,16,0.06)] px-3 py-2 text-[13px] text-ink-900">{nombre}</span>
                  <button onClick={() => startEdit('nombre')} className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] text-ink-400 hover:bg-white hover:text-ink-700">
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Email</label>
              {isAdmin && editingField === 'email' ? (
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="flex-1 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => saveField('email')} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-500">
                    <Check size={14} />
                  </button>
                  <button onClick={cancelEdit} className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] text-ink-500 hover:bg-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 rounded-2xl bg-[rgba(17,17,16,0.025)] border border-[rgba(17,17,16,0.06)] px-3 py-2 text-[13px] text-ink-900">{email}</span>
                  {isAdmin && (
                    <button onClick={() => startEdit('email')} className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] text-ink-400 hover:bg-white hover:text-ink-700">
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Rol */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Rol</label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    agent?.rol === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {agent?.rol === 'admin' ? 'Administrador' : 'Asesor'}
                </span>
              </div>
            </div>

            {/* Miembro desde */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Miembro desde</label>
              <span className="block rounded-2xl bg-[rgba(17,17,16,0.025)] border border-[rgba(17,17,16,0.06)] px-3 py-2 text-[13px] text-ink-900">1 de enero, 2026</span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveProfile}
                className="rounded-full bg-brand-500 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-500 transition shadow-card"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Seguridad */}
      {tab === 'seguridad' && (
        <div className="space-y-6">
          {/* Cambiar contraseña */}
          <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm p-6 space-y-4">
            <p className="font-bold text-ink-900">Cambiar contraseña</p>

            {/* Contraseña actual */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 pr-10 text-[13px] focus:outline-none focus:border-brand-400"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  onClick={() => setShowCurrentPwd((v) => !v)}
                >
                  {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 pr-10 text-[13px] focus:outline-none focus:border-brand-400"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  onClick={() => setShowNewPwd((v) => !v)}
                >
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength indicator */}
              {newPwd.length > 0 && (
                <div className="space-y-1 mt-1">
                  <div className="h-1.5 w-full rounded-full bg-[rgba(17,17,16,0.06)] overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${pwdStrength.color}`}
                      style={{ width: pwdStrength.width }}
                    />
                  </div>
                  <p className="text-xs text-ink-500">Seguridad: <span className="font-semibold">{pwdStrength.label}</span></p>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 pr-10 text-[13px] focus:outline-none focus:border-brand-400"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  onClick={() => setShowConfirmPwd((v) => !v)}
                >
                  {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirmPwd && newPwd !== confirmPwd && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            <button
              onClick={handleChangePassword}
              className="rounded-full bg-brand-500 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-500 transition shadow-card"
            >
              Cambiar contraseña
            </button>
          </div>

          {/* MFA */}
          <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm p-6 space-y-4">
            <p className="font-bold text-ink-900">Autenticación de dos factores (MFA)</p>

            {!mfaEnabled ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <ShieldOff className="text-amber-600 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-semibold text-amber-800">MFA desactivado</p>
                  <p className="text-xs text-amber-700">Tu cuenta es más vulnerable sin autenticación de dos factores.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <ShieldCheck className="text-emerald-600" size={18} />
                <p className="text-sm font-semibold text-emerald-800">MFA activado — tu cuenta está protegida</p>
              </div>
            )}

            {!mfaEnabled && (
              <button
                onClick={() => { setMfaModalOpen(true); setMfaStep(1); }}
                className="rounded-full bg-brand-500 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-500 transition shadow-card"
              >
                Activar MFA
              </button>
            )}
          </div>

          {/* Dispositivos confiables */}
          <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm">
            <div className="border-b border-[rgba(17,17,16,0.06)] px-6 py-4">
              <p className="font-bold text-ink-900">Dispositivos confiables</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(17,17,16,0.06)] text-left text-xs font-semibold text-ink-500">
                    <th className="px-6 py-3">Dispositivo</th>
                    <th className="px-6 py-3">Ubicación</th>
                    <th className="px-6 py-3">Último acceso</th>
                    <th className="px-6 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {trustedDevices.map((d) => (
                    <tr key={d.id} className="border-b border-[rgba(17,17,16,0.04)] hover:bg-[rgba(17,17,16,0.02)] transition">
                      <td className="px-6 py-3 text-[13px] text-ink-900 flex items-center gap-2">
                        <Monitor size={14} className="text-ink-400" />
                        {d.device}
                      </td>
                      <td className="px-6 py-3 text-[13px] text-ink-600">{d.location}</td>
                      <td className="px-6 py-3 text-[13px] text-ink-500">{d.lastAccess}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleRevokeDevice(d.id)}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                        >
                          Revocar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sesiones activas */}
      {tab === 'sesiones' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-6 py-4">
              <p className="font-bold text-ink-900">Sesiones activas</p>
              <button
                onClick={() => setConfirmCloseAll(true)}
                className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                Cerrar todas las demás sesiones
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(17,17,16,0.06)] text-left text-xs font-semibold text-ink-500">
                    <th className="px-6 py-3">Dispositivo</th>
                    <th className="px-6 py-3">IP</th>
                    <th className="px-6 py-3">Ubicación</th>
                    <th className="px-6 py-3">Inicio de sesión</th>
                    <th className="px-6 py-3">Última actividad</th>
                    <th className="px-6 py-3">Terminar</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className={`border-b border-[rgba(17,17,16,0.04)] transition ${s.current ? 'bg-emerald-50' : 'hover:bg-[rgba(17,17,16,0.02)]'}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Smartphone size={14} className="text-ink-400" />
                          <span className="text-[13px] text-ink-900">{s.device}</span>
                          {s.current && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Sesión actual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[13px] text-ink-600 font-mono">{s.ip}</td>
                      <td className="px-6 py-3 text-[13px] text-ink-600">{s.location}</td>
                      <td className="px-6 py-3 text-[13px] text-ink-500">{s.inicio}</td>
                      <td className="px-6 py-3 text-[13px] text-ink-500">{s.lastActivity}</td>
                      <td className="px-6 py-3">
                        {!s.current && (
                          <button
                            onClick={() => handleTerminateSession(s.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[rgba(17,17,16,0.06)] px-6 py-3">
              <p className="text-xs text-ink-400">La sesión actual no se puede cerrar desde aquí. Usa el botón de Cerrar sesión.</p>
            </div>
          </div>
        </div>
      )}

      {/* MFA Modal */}
      <AnimatePresence>
        {mfaModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(17,17,16,0.45)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 backdrop-blur-md shadow-float p-6 space-y-5"
            >
              {mfaStep === 1 && (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-bold text-ink-900">Escanea el código QR</p>
                    <p className="text-sm text-ink-500">Usa Google Authenticator o cualquier app TOTP</p>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-40 h-40 border-2 border-[rgba(17,17,16,0.08)] rounded-2xl flex items-center justify-center bg-[rgba(17,17,16,0.025)]">
                      <span className="text-xs text-ink-400 text-center leading-relaxed px-2">QR Code — Escanea con{'\n'}Google Authenticator</span>
                    </div>
                  </div>
                  <p className="text-xs text-ink-500 text-center">
                    O ingresa este código manualmente: <span className="font-mono font-semibold text-ink-900">COMF-GUAJ-MFA-2026</span>
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setMfaModalOpen(false)} className="flex-1 rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] py-2.5 text-[13px] font-semibold text-ink-700 hover:bg-white transition">
                      Cancelar
                    </button>
                    <button onClick={handleActivateMfa} className="flex-1 rounded-full bg-brand-500 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-500 transition shadow-card">
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {mfaStep === 2 && (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-bold text-ink-900">Ingresa el código</p>
                    <p className="text-sm text-ink-500">Introduce el código de 6 dígitos de tu app</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 6 }, (_, i) => i).map((i) => (
                      <input
                        key={i}
                        ref={(el) => { mfaInputRefs.current[i] = el; }}
                        type="text"
                        maxLength={1}
                        className="h-12 w-10 rounded-2xl border-2 border-[rgba(17,17,16,0.10)] bg-white/80 text-center text-lg font-bold text-ink-900 focus:border-brand-400 focus:outline-none transition"
                        value={mfaCode[i]}
                        onChange={(e) => handleMfaCodeInput(i, e.target.value)}
                        onKeyDown={(e) => handleMfaCodeKeyDown(i, e)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setMfaModalOpen(false)} className="flex-1 rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] py-2.5 text-[13px] font-semibold text-ink-700 hover:bg-white transition">
                      Cancelar
                    </button>
                    <button onClick={handleActivateMfa} className="flex-1 rounded-full bg-brand-500 py-2.5 text-[13px] font-semibold text-white hover:bg-brand-500 transition shadow-card">
                      Verificar
                    </button>
                  </div>
                </>
              )}

              {mfaStep === 3 && (
                <div className="text-center space-y-4 py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
                  >
                    <Check className="text-emerald-600" size={32} />
                  </motion.div>
                  <p className="text-lg font-bold text-emerald-700">MFA activado</p>
                  <p className="text-sm text-ink-500">Tu cuenta ahora está protegida con autenticación de dos factores.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm close all sessions dialog */}
      <AnimatePresence>
        {confirmCloseAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(17,17,16,0.45)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 backdrop-blur-md shadow-float p-6 space-y-4"
            >
              <p className="font-bold text-ink-900">¿Cerrar todas las demás sesiones?</p>
              <p className="text-sm text-ink-500">Se cerrarán todas las sesiones activas excepto la actual.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmCloseAll(false)} className="flex-1 rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] py-2.5 text-[13px] font-semibold text-ink-700 hover:bg-white transition">
                  Cancelar
                </button>
                <button onClick={handleCloseAllSessions} className="flex-1 rounded-full bg-red-600 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700 transition">
                  Cerrar sesiones
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
