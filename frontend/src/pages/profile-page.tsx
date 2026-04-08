import { useEffect, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Monitor, Pencil, ShieldOff, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { PageHeader } from '../components/ui/page-header';
import { api, type MyAgentProfileApiItem } from '../services/api';

type Tab = 'perfil' | 'seguridad' | 'sesiones';

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';
}

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: '', color: '', width: '0%' };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = (password.length >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (score <= 1) return { label: 'Debil', color: 'bg-red-500', width: '33%' };
  if (score <= 3) return { label: 'Media', color: 'bg-amber-500', width: '66%' };
  return { label: 'Fuerte', color: 'bg-emerald-500', width: '100%' };
}

function buildCurrentSession(profile: MyAgentProfileApiItem | null) {
  if (!profile) return [];
  return [
    {
      id: 'current',
      device: 'Sesion actual',
      ip: 'Protegida',
      location: 'Inventario de sesiones no habilitado',
      inicio: profile.created_at ? new Date(profile.created_at).toLocaleString('es-CO') : 'N/D',
      lastActivity: profile.last_seen ? new Date(profile.last_seen).toLocaleString('es-CO') : 'Reciente',
      current: true,
    },
  ];
}

export function ProfilePage() {
  const { agent, refreshAgent } = useAuth();
  const { showError, showInfo, showSuccess } = useNotification();
  const [tab, setTab] = useState<Tab>('perfil');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [profile, setProfile] = useState<MyAgentProfileApiItem | null>(null);
  const [nombre, setNombre] = useState(agent?.nombre ?? '');
  const [tempNombre, setTempNombre] = useState(agent?.nombre ?? '');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const pwdStrength = getPasswordStrength(newPwd);
  const sessions = buildCurrentSession(profile);
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'seguridad', label: 'Seguridad' },
    { key: 'sesiones', label: 'Sesiones' },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      try {
        const nextProfile = await api.getMyAgentProfile();
        if (cancelled) return;
        const fullName = [nextProfile.nombre, nextProfile.apellido].filter(Boolean).join(' ').trim() || nextProfile.nombre;
        setProfile(nextProfile);
        setNombre(fullName);
        setTempNombre(fullName);
      } catch (error) {
        if (!cancelled) {
          showError('Perfil', error instanceof Error ? error.message : 'No se pudo cargar el perfil.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  async function reloadProfile() {
    const nextProfile = await api.getMyAgentProfile();
    const fullName = [nextProfile.nombre, nextProfile.apellido].filter(Boolean).join(' ').trim() || nextProfile.nombre;
    setProfile(nextProfile);
    setNombre(fullName);
    setTempNombre(fullName);
  }

  async function handleSaveProfile() {
    const trimmedName = tempNombre.trim();
    if (!trimmedName) {
      showError('Perfil', 'El nombre no puede estar vacio.');
      return;
    }
    try {
      setSavingProfile(true);
      await api.updateMyAgentProfile({ nombre: trimmedName });
      await reloadProfile();
      await refreshAgent();
      setEditingName(false);
      showSuccess('Perfil actualizado');
    } catch (error) {
      showError('Perfil', error instanceof Error ? error.message : 'No se pudo actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPwd.trim()) {
      showError('Seguridad', 'Debes ingresar tu contrasena actual.');
      return;
    }
    if (newPwd.length < 8) {
      showError('Seguridad', 'La contrasena debe tener al menos 8 caracteres.');
      return;
    }
    if (newPwd !== confirmPwd) {
      showError('Seguridad', 'Las contrasenas no coinciden.');
      return;
    }
    try {
      setChangingPassword(true);
      await api.changeMyPassword({ old_password: currentPwd, new_password: newPwd });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      showSuccess('Contrasena actualizada');
    } catch (error) {
      showError('Seguridad', error instanceof Error ? error.message : 'No se pudo cambiar la contrasena.');
    } finally {
      setChangingPassword(false);
    }
  }

  function renderPasswordInput(
    label: string,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    onToggle: () => void,
  ) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</label>
        <div className="relative">
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 pr-10 text-[13px] focus:border-brand-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-700"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-stack">
        <PageHeader
          eyebrow="Cuenta"
          title="Mi perfil"
          description="Verifica tu informacion personal y las opciones reales de seguridad disponibles."
        />

        <div className="page-section-card !w-fit p-1">
          <div className="flex w-fit gap-1 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-1 shadow-card backdrop-blur-sm">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  tab === item.key ? 'bg-brand-500 text-white shadow-card' : 'text-ink-600 hover:bg-[rgba(17,17,16,0.04)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'perfil' ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-6 shadow-card backdrop-blur-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
                {getInitials(nombre || 'Usuario')}
              </div>
              <div className="text-center">
                <p className="font-bold text-ink-900">{loading ? 'Cargando...' : nombre}</p>
                <p className="text-sm text-ink-500">{profile?.email || agent?.email || '-'}</p>
              </div>
              <button
                onClick={() => showInfo('Perfil', 'La subida de avatar aun no esta habilitada.')}
                className="rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] px-4 py-2 text-[13px] font-semibold text-ink-700 transition hover:bg-white"
              >
                Cambiar foto
              </button>
              <div className="w-full space-y-2 border-t border-[rgba(17,17,16,0.06)] pt-4 text-xs text-ink-500">
                <div className="flex justify-between">
                  <span>Rol</span>
                  <span className="font-bold text-ink-900">{profile?.rol || agent?.rol || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ultima actividad</span>
                  <span className="font-bold text-ink-900">{profile?.last_seen ? new Date(profile.last_seen).toLocaleString('es-CO') : 'Reciente'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-6 shadow-card backdrop-blur-sm">
              <p className="font-bold text-ink-900">Informacion personal</p>
              <div className="mt-5 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">Nombre</label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        value={tempNombre}
                        onChange={(event) => setTempNombre(event.target.value)}
                        className="flex-1 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2 text-[13px] focus:border-brand-400 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => void handleSaveProfile()}
                        disabled={savingProfile}
                        className="rounded-full bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                      >
                        {savingProfile ? '...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => {
                          setTempNombre(nombre);
                          setEditingName(false);
                        }}
                        className="rounded-full border border-[rgba(17,17,16,0.12)] px-4 py-2 text-[13px] font-semibold text-ink-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 rounded-2xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-[13px] text-ink-900">
                        {loading ? 'Cargando...' : nombre}
                      </span>
                      <button
                        onClick={() => setEditingName(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] text-ink-400 transition hover:bg-white hover:text-ink-700"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">Email</label>
                  <span className="block rounded-2xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-[13px] text-ink-900">
                    {profile?.email || agent?.email || '-'}
                  </span>
                  <p className="text-[11px] text-ink-400">El cambio de email no esta habilitado desde esta pantalla para evitar cambios sin verificacion.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">Miembro desde</label>
                  <span className="block rounded-2xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-[13px] text-ink-900">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-CO') : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'seguridad' ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-6 shadow-card backdrop-blur-sm">
              <p className="font-bold text-ink-900">Cambiar contrasena</p>
              <div className="mt-4 space-y-4">
                {renderPasswordInput('Contrasena actual', currentPwd, setCurrentPwd, showCurrentPwd, () => setShowCurrentPwd((value) => !value))}
                {renderPasswordInput('Nueva contrasena', newPwd, setNewPwd, showNewPwd, () => setShowNewPwd((value) => !value))}
                {newPwd ? (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(17,17,16,0.06)]">
                      <div className={`h-1.5 rounded-full transition-all ${pwdStrength.color}`} style={{ width: pwdStrength.width }} />
                    </div>
                    <p className="text-xs text-ink-500">
                      Seguridad: <span className="font-semibold">{pwdStrength.label}</span>
                    </p>
                  </div>
                ) : null}
                {renderPasswordInput('Confirmar contrasena', confirmPwd, setConfirmPwd, showConfirmPwd, () => setShowConfirmPwd((value) => !value))}
                <button
                  onClick={() => void handleChangePassword()}
                  disabled={changingPassword}
                  className="rounded-full bg-brand-500 px-6 py-2.5 text-[13px] font-semibold text-white shadow-card disabled:opacity-60"
                >
                  {changingPassword ? 'Actualizando...' : 'Cambiar contrasena'}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <ShieldOff className="mt-0.5 shrink-0 text-amber-600" size={18} />
                <div>
                  <p className="font-semibold text-amber-900">MFA/TOTP aun no esta implementado de forma real</p>
                  <p className="mt-1 text-sm text-amber-800">
                    La version anterior simulaba activacion de MFA solo en frontend. Eso era inseguro y enganoso. Hasta tener soporte backend, recovery codes y verificacion real, no se expone como accion operativa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'sesiones' ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm">
              <div className="border-b border-[rgba(17,17,16,0.06)] px-6 py-4">
                <p className="font-bold text-ink-900">Sesiones activas</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(17,17,16,0.06)] text-left text-xs font-semibold text-ink-500">
                      <th className="px-6 py-3">Dispositivo</th>
                      <th className="px-6 py-3">IP</th>
                      <th className="px-6 py-3">Ubicacion</th>
                      <th className="px-6 py-3">Inicio</th>
                      <th className="px-6 py-3">Ultima actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b border-[rgba(17,17,16,0.04)] bg-emerald-50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Smartphone size={14} className="text-ink-400" />
                            <span className="text-[13px] text-ink-900">{session.device}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-[13px] font-mono text-ink-600">{session.ip}</td>
                        <td className="px-6 py-3 text-[13px] text-ink-600">{session.location}</td>
                        <td className="px-6 py-3 text-[13px] text-ink-500">{session.inicio}</td>
                        <td className="px-6 py-3 text-[13px] text-ink-500">{session.lastActivity}</td>
                      </tr>
                    ))}
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-sm text-ink-400">
                          No hay informacion de sesiones disponible.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[rgba(17,17,16,0.06)] px-6 py-4">
                <div className="flex items-start gap-2 text-sm text-ink-500">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  <p>El backend todavia no expone inventario ni revocacion de sesiones remotas. Solo mostramos la sesion actual mientras se implementa soporte real.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-6 shadow-card backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Monitor className="mt-0.5 shrink-0 text-ink-400" size={18} />
                <div>
                  <p className="font-semibold text-ink-900">Dispositivos confiables</p>
                  <p className="mt-1 text-sm text-ink-500">
                    Esta capacidad tambien requiere backend: huellas de dispositivo, expiracion, revocacion y auditoria. Hoy no hay soporte real, por lo tanto no la simulamos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
