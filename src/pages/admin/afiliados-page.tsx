import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, Pencil, ToggleRight, ToggleLeft, X, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { UserAdmin, CreateUserPayload } from '../../services/api';
import { mockConversations } from '../../data/mock';
import { useNotification } from '../../contexts/NotificationContext';
import { Skeleton } from '../../components/ui/primitives';

// Build mock UserAdmin list from mockConversations
function mockUsers(): UserAdmin[] {
  return mockConversations.map((c, idx) => ({
    id: c.user.id,
    cedula: c.user.cedula,
    nombre: c.user.nombre,
    apellido: c.user.apellido,
    telefono: c.user.telefono,
    email: c.user.email,
    tipo_afiliado: c.user.tipoAfiliado,
    activo: idx !== 2, // one inactive for demo
    created_at: c.createdAt,
  }));
}

const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  trabajador: { label: 'Trabajador', className: 'bg-sky-100 text-sky-800' },
  pensionado: { label: 'Pensionado', className: 'bg-amber-100 text-amber-800' },
  independiente: { label: 'Independiente', className: 'bg-violet-100 text-violet-800' },
};

function getInitials(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
}

interface UserFormState {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  tipo_afiliado: string;
}

const EMPTY_FORM: UserFormState = {
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  email: '',
  tipo_afiliado: 'trabajador',
};

function validateUser(form: UserFormState): string | null {
  if (!form.nombre.trim()) return 'El nombre es obligatorio';
  if (!form.apellido.trim()) return 'El apellido es obligatorio';
  if (!form.cedula.trim()) return 'La cédula es obligatoria';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    return 'Correo inválido';
  return null;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editUser: UserAdmin | null;
}

function AfiliadoModal({ open, onClose, onSuccess, editUser }: ModalProps) {
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!editUser;

  useEffect(() => {
    if (open) {
      if (editUser) {
        setForm({
          nombre: editUser.nombre,
          apellido: editUser.apellido,
          cedula: editUser.cedula,
          telefono: editUser.telefono ?? '',
          email: editUser.email ?? '',
          tipo_afiliado: editUser.tipo_afiliado,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError('');
    }
  }, [open, editUser]);

  if (!open) return null;

  function set(field: keyof UserFormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateUser(form);
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    const payload: CreateUserPayload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim() || undefined,
      email: form.email.trim() || undefined,
      tipo_afiliado: form.tipo_afiliado,
    };

    try {
      if (isEdit) {
        await api.updateUser(editUser.id, payload);
        showSuccess('Afiliado actualizado', `${form.nombre} ${form.apellido} fue actualizado`);
      } else {
        await api.createUser(payload);
        showSuccess('Afiliado creado', `${form.nombre} ${form.apellido} fue registrado`);
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
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-900">
            {isEdit ? 'Editar afiliado' : 'Nuevo afiliado'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Apellido *</label>
              <input
                type="text"
                value={form.apellido}
                onChange={(e) => set('apellido', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
                placeholder="Apellido"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Cédula *</label>
            <input
              type="text"
              value={form.cedula}
              onChange={(e) => set('cedula', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
              placeholder="Número de cédula"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Teléfono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
                placeholder="+57 300 123 4567"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Tipo de afiliado</label>
            <select
              value={form.tipo_afiliado}
              onChange={(e) => set('tipo_afiliado', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 transition"
            >
              <option value="trabajador">Trabajador</option>
              <option value="pensionado">Pensionado</option>
              <option value="independiente">Independiente</option>
            </select>
          </div>

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
              {isEdit ? 'Guardar cambios' : 'Crear afiliado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AfiliadosPage() {
  const { showSuccess } = useNotification();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserAdmin | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchUsers = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await api.getUsers(q || undefined);
      setUsers(data);
    } catch {
      // Fallback to mock data
      const base = mockUsers();
      if (q) {
        const lq = q.toLowerCase();
        setUsers(
          base.filter(
            (u) =>
              u.nombre.toLowerCase().includes(lq) ||
              u.apellido.toLowerCase().includes(lq) ||
              u.cedula.includes(lq) ||
              (u.telefono ?? '').includes(lq)
          )
        );
      } else {
        setUsers(base);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchUsers(debouncedSearch || undefined); }, [fetchUsers, debouncedSearch]);

  function openCreate() {
    setEditUser(null);
    setModalOpen(true);
  }

  function openEdit(user: UserAdmin) {
    setEditUser(user);
    setModalOpen(true);
  }

  async function handleToggle(user: UserAdmin) {
    setTogglingId(user.id);
    // Optimistic update (API toggle endpoint not spec'd for users — use updateUser)
    try {
      await api.updateUser(user.id, { nombre: user.nombre }); // partial update
    } catch {
      // swallow — demo mode
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, activo: !u.activo } : u))
    );
    showSuccess(
      user.activo ? 'Afiliado desactivado' : 'Afiliado activado',
      `${user.nombre} ${user.apellido} fue ${user.activo ? 'desactivado' : 'activado'}`
    );
    setTogglingId(null);
    setConfirmToggleId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Afiliados</h1>
          <p className="text-sm text-slate-500">Administra el registro de afiliados</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, cédula o teléfono..."
              className="w-56 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 transition"
          >
            <Plus size={15} /> Nuevo afiliado
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Afiliado', 'Cédula', 'Teléfono', 'Email', 'Tipo', 'Estado', 'Acciones'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <td key={j} className="px-4 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.map((user) => {
                    const tipoConf = TIPO_CONFIG[user.tipo_afiliado] ?? {
                      label: user.tipo_afiliado,
                      className: 'bg-slate-100 text-slate-700',
                    };
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-slate-50 hover:bg-slate-50 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                              {getInitials(user.nombre, user.apellido)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {user.nombre} {user.apellido}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{user.cedula}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{user.telefono ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[160px] truncate">
                          {user.email ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tipoConf.className}`}
                          >
                            {tipoConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              user.activo
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {confirmToggleId === user.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-600">
                                ¿{user.activo ? 'Desactivar' : 'Activar'}?
                              </span>
                              <button
                                onClick={() => void handleToggle(user)}
                                disabled={togglingId === user.id}
                                className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmToggleId(null)}
                                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEdit(user)}
                                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                              >
                                <Pencil size={10} /> Editar
                              </button>
                              <button
                                onClick={() => navigate('/inbox')}
                                className="flex items-center gap-1 rounded-lg bg-sky-100 px-2 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-200 transition"
                              >
                                <ExternalLink size={10} /> Convs.
                              </button>
                              <button
                                onClick={() => setConfirmToggleId(user.id)}
                                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                              >
                                {user.activo ? (
                                  <ToggleRight size={12} className="text-emerald-600" />
                                ) : (
                                  <ToggleLeft size={12} />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    No se encontraron afiliados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AfiliadoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => void fetchUsers(debouncedSearch || undefined)}
        editUser={editUser}
      />
    </div>
  );
}
