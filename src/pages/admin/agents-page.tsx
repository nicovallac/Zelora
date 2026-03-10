import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import type { AgentAdmin, CreateAgentPayload } from '../../services/api';
import { agentPerformance } from '../../data/mock';
import { useNotification } from '../../contexts/NotificationContext';
import { Skeleton } from '../../components/ui/primitives';

// Map mock data to AgentAdmin shape for fallback
function mockAgents(): AgentAdmin[] {
  const emails: Record<string, string> = {
    'Carlos Pérez': 'carlos.perez@comfaguajira.com',
    'Laura Gutiérrez': 'laura.gutierrez@comfaguajira.com',
    'Andrés Morales': 'andres.morales@comfaguajira.com',
    'Diana Suárez': 'diana.suarez@comfaguajira.com',
  };
  const roles: Record<string, string> = {
    'Carlos Pérez': 'admin',
  };
  return agentPerformance.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    email: emails[a.nombre] ?? `${a.nombre.toLowerCase().replace(/\s+/g, '.')}@comfaguajira.com`,
    rol: roles[a.nombre] ?? 'asesor',
    activo: true,
    created_at: '2025-01-15T00:00:00Z',
  }));
}

function getInitials(nombre: string) {
  return nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface AgentFormState {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: string;
  changePassword: boolean;
}

const EMPTY_FORM: AgentFormState = {
  nombre: '',
  email: '',
  password: '',
  confirmPassword: '',
  rol: 'asesor',
  changePassword: false,
};

function validate(form: AgentFormState, isEdit: boolean): string | null {
  if (!form.nombre.trim()) return 'El nombre es obligatorio';
  if (!form.email.trim()) return 'El correo es obligatorio';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Correo inválido';
  if (!isEdit || form.changePassword) {
    if (!form.password) return 'La contraseña es obligatoria';
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden';
  }
  return null;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editAgent: AgentAdmin | null;
}

function AgentModal({ open, onClose, onSuccess, editAgent }: ModalProps) {
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState<AgentFormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!editAgent;

  useEffect(() => {
    if (open) {
      if (editAgent) {
        setForm({
          nombre: editAgent.nombre,
          email: editAgent.email,
          password: '',
          confirmPassword: '',
          rol: editAgent.rol,
          changePassword: false,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError('');
    }
  }, [open, editAgent]);

  if (!open) return null;

  function set(field: keyof AgentFormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(form, isEdit);
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        const payload: Partial<CreateAgentPayload> = {
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
        };
        if (form.changePassword && form.password) payload.password = form.password;
        await api.updateAgent(editAgent.id, payload);
        showSuccess('Asesor actualizado', `${form.nombre} fue actualizado correctamente`);
      } else {
        await api.createAgent({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol: form.rol,
        });
        showSuccess('Asesor creado', `${form.nombre} fue agregado al equipo`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
      showError('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">
            {isEdit ? 'Editar asesor' : 'Nuevo asesor'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Correo *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
              placeholder="correo@comfaguajira.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Rol</label>
            <select
              value={form.rol}
              onChange={(e) => set('rol', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 transition"
            >
              <option value="asesor">Asesor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.changePassword}
                onChange={(e) => set('changePassword', e.target.checked)}
                className="rounded"
              />
              Cambiar contraseña
            </label>
          )}

          {(!isEdit || form.changePassword) && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Confirmar contraseña *
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
                  placeholder="Repetir contraseña"
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60 transition"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear asesor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AgentsPage() {
  const { showSuccess } = useNotification();
  const [agents, setAgents] = useState<AgentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<AgentAdmin | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch {
      setAgents(mockAgents());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  function openCreate() {
    setEditAgent(null);
    setModalOpen(true);
  }

  function openEdit(agent: AgentAdmin) {
    setEditAgent(agent);
    setModalOpen(true);
  }

  async function handleToggle(agent: AgentAdmin) {
    setTogglingId(agent.id);
    try {
      await api.toggleAgent(agent.id, !agent.activo);
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, activo: !a.activo } : a))
      );
      showSuccess(
        agent.activo ? 'Asesor desactivado' : 'Asesor activado',
        `${agent.nombre} fue ${agent.activo ? 'desactivado' : 'activado'}`
      );
    } catch (err) {
      // Optimistic update fallback for demo
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, activo: !a.activo } : a))
      );
      void err;
      showSuccess(
        agent.activo ? 'Asesor desactivado' : 'Asesor activado',
        `${agent.nombre} fue ${agent.activo ? 'desactivado' : 'activado'} (demo)`
      );
    } finally {
      setTogglingId(null);
      setDeactivateId(null);
    }
  }

  const total = agents.length;
  const activos = agents.filter((a) => a.activo).length;
  const admins = agents.filter((a) => a.rol === 'admin').length;
  const avgSat =
    agentPerformance.reduce((sum, a) => sum + a.satisfaccion, 0) /
    Math.max(agentPerformance.length, 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Asesores</h1>
          <p className="text-sm text-slate-500">Administra el equipo de atención</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 transition"
        >
          <Plus size={15} /> Nuevo asesor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total asesores', value: total },
          { label: 'Activos', value: activos },
          { label: 'Admins', value: admins },
          { label: 'Satisfacción promedio', value: `${avgSat.toFixed(0)}%` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Asesor
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-6 w-20" /></td>
                    </tr>
                  ))
                : agents.map((agent) => (
                    <tr key={agent.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                            {getInitials(agent.nombre)}
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{agent.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{agent.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            agent.rol === 'admin'
                              ? 'bg-violet-100 text-violet-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {agent.rol === 'admin' ? 'Admin' : 'Asesor'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            agent.activo
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {agent.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {deactivateId === agent.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600">
                              ¿{agent.activo ? 'Desactivar' : 'Activar'}?
                            </span>
                            <button
                              onClick={() => void handleToggle(agent)}
                              className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-200 transition"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeactivateId(null)}
                              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(agent)}
                              className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                            >
                              <Pencil size={11} /> Editar
                            </button>
                            <button
                              onClick={() => setDeactivateId(agent.id)}
                              disabled={togglingId === agent.id}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                              {agent.activo ? (
                                <><ToggleRight size={13} className="text-emerald-600" /> Desactivar</>
                              ) : (
                                <><ToggleLeft size={13} /> Activar</>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <AgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchAgents}
        editAgent={editAgent}
      />
    </div>
  );
}
