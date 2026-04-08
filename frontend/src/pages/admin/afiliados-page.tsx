import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, Pencil, X, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { UserAdmin, CreateUserPayload } from '../../services/api';
import { mockConversations } from '../../data/mock';
import { useNotification } from '../../contexts/NotificationContext';
import { Skeleton } from '../../components/ui/primitives';
import { USE_MOCK_DATA } from '../../lib/runtime';
import { PageHeader } from '../../components/ui/page-header';

function mockUsers(): UserAdmin[] {
  return mockConversations.map((c, idx) => ({
    id: c.user.id,
    cedula: c.user.cedula,
    nombre: c.user.nombre,
    apellido: c.user.apellido,
    telefono: c.user.telefono,
    email: c.user.email,
    tipo_afiliado: c.user.tipoAfiliado,
    metadata: idx === 0 ? { ciudad: 'Riohacha', empresa: 'Comfaguajira' } : ({} as Record<string, string>),
    created_at: c.createdAt,
  }));
}

const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  trabajador: { label: 'Trabajador', className: 'bg-sky-100 text-sky-800' },
  pensionado: { label: 'Pensionado', className: 'bg-amber-100 text-amber-800' },
  independiente: { label: 'Independiente', className: 'bg-violet-100 text-violet-800' },
};

function stringifyMetadataValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyMetadataValue(item))
      .filter(Boolean)
      .join(', ');
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeMetadataRecord(metadata: Record<string, unknown> | undefined): Record<string, string> {
  if (!metadata || typeof metadata !== 'object') return {};
  return Object.fromEntries(
    Object.entries(metadata)
      .map(([key, value]) => [key, stringifyMetadataValue(value)])
      .filter(([key, value]) => Boolean(key) && Boolean(value))
  );
}

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
  metadata: Array<{ key: string; value: string }>;
}

const EMPTY_FORM: UserFormState = {
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  email: '',
  tipo_afiliado: 'trabajador',
  metadata: [],
};

function validateUser(form: UserFormState): string | null {
  if (!form.nombre.trim()) return 'El nombre es obligatorio';
  if (!form.apellido.trim()) return 'El apellido es obligatorio';
  if (!form.cedula.trim()) return 'La cédula es obligatoria';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Correo inválido';
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
    if (!open) return;
    if (editUser) {
      const normalizedMetadata = normalizeMetadataRecord(editUser.metadata);
      setForm({
        nombre: editUser.nombre,
        apellido: editUser.apellido,
        cedula: editUser.cedula,
        telefono: editUser.telefono ?? '',
        email: editUser.email ?? '',
        tipo_afiliado: editUser.tipo_afiliado,
        metadata: Object.entries(normalizedMetadata).map(([key, value]) => ({ key, value })),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [open, editUser]);

  if (!open) return null;

  function set(field: keyof UserFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateMetadata(index: number, patch: Partial<{ key: string; value: string }>) {
    setForm((current) => ({
      ...current,
      metadata: current.metadata.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function addMetadataField() {
    setForm((current) => ({
      ...current,
      metadata: [...current.metadata, { key: '', value: '' }],
    }));
  }

  function removeMetadataField(index: number) {
    setForm((current) => ({
      ...current,
      metadata: current.metadata.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateUser(form);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setLoading(true);

    const payload: CreateUserPayload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim() || undefined,
      email: form.email.trim() || undefined,
      tipo_afiliado: form.tipo_afiliado,
      metadata: Object.fromEntries(
        form.metadata
          .map((item) => [item.key.trim(), item.value.trim()] as const)
          .filter(([key, value]) => key && value),
      ),
    };

    try {
      if (isEdit && editUser) {
        await api.updateUser(editUser.id, payload);
        showSuccess('Contacto actualizado', `${form.nombre} ${form.apellido} fue actualizado`);
      } else {
        await api.createUser(payload);
        showSuccess('Contacto creado', `${form.nombre} ${form.apellido} fue registrado`);
      }
      onSuccess();
      onClose();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Error al guardar';
      setError(message);
      showError('Contactos', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" style={{ background: 'rgba(17,17,16,0.45)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-2xl rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-6 py-4">
          <h3 className="font-bold text-ink-900">{isEdit ? 'Editar contacto' : 'Nuevo contacto'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-400 transition hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-600">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-600">Nombre *</label>
              <input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="Nombre" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-600">Apellido *</label>
              <input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="Apellido" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">Cédula *</label>
            <input value={form.cedula} onChange={(e) => set('cedula', e.target.value)} className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="Número de cédula" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-600">Teléfono</label>
              <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="+57 300 123 4567" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-600">Email</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)} className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">Tipo de afiliado</label>
            <select value={form.tipo_afiliado} onChange={(e) => set('tipo_afiliado', e.target.value)} className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-400">
              <option value="trabajador">Trabajador</option>
              <option value="pensionado">Pensionado</option>
              <option value="independiente">Independiente</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-600">Campos adicionales</label>
                <p className="mt-0.5 text-[11px] text-ink-400">Agrega cualquier dato útil para tu operación: ciudad, empresa, cargo, plan, observación corta, etc.</p>
              </div>
              <button type="button" onClick={addMetadataField} className="inline-flex items-center gap-1 rounded-lg border border-[rgba(17,17,16,0.10)] px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]">
                <Plus size={12} />
                Agregar campo
              </button>
            </div>
            {form.metadata.length > 0 ? (
              <div className="space-y-2">
                {form.metadata.map((item, index) => (
                  <div key={`${index}-${item.key}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input value={item.key} onChange={(e) => updateMetadata(index, { key: e.target.value })} placeholder="Campo" className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
                    <input value={item.value} onChange={(e) => updateMetadata(index, { value: e.target.value })} placeholder="Valor" className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
                    <button type="button" onClick={() => removeMetadataField(index)} className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-red-700 transition hover:bg-red-100">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[rgba(17,17,16,0.10)] bg-[rgba(17,17,16,0.02)] px-3 py-3 text-xs text-ink-400">
                Todavía no agregaste campos adicionales.
              </div>
            )}
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[rgba(17,17,16,0.09)] py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-[rgba(17,17,16,0.025)]">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AfiliadosPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserAdmin | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchUsers = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await api.getUsers(q || undefined);
      setUsers(data);
      setLoadError('');
    } catch {
      if (USE_MOCK_DATA) {
        const base = mockUsers();
        if (q) {
          const lowerQuery = q.toLowerCase();
          setUsers(
            base.filter(
              (user) =>
                user.nombre.toLowerCase().includes(lowerQuery) ||
                user.apellido.toLowerCase().includes(lowerQuery) ||
                user.cedula.includes(lowerQuery) ||
                (user.telefono ?? '').includes(lowerQuery),
            ),
          );
        } else {
          setUsers(base);
        }
      } else {
        setUsers([]);
        setLoadError('No se pudieron cargar contactos desde el backend.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers(debouncedSearch || undefined);
  }, [fetchUsers, debouncedSearch]);

  const total = users.length;
  const conTelefono = users.filter((user) => !!user.telefono).length;
  const conEmail = users.filter((user) => !!user.email).length;
  const conExtras = users.filter((user) => Object.keys(user.metadata || {}).length > 0).length;

  return (
    <div className="page-shell overflow-hidden">
      <div className="page-stack overflow-hidden">
        <PageHeader
          eyebrow="Base comercial"
          title="Contactos"
          description="Consulta, busca y actualiza la base de contactos en una sola vista operativa."
          meta={(
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'Total', value: total },
                { label: 'Con teléfono', value: conTelefono },
                { label: 'Con email', value: conEmail },
                { label: 'Con extras', value: conExtras },
              ].map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1 rounded-full bg-[rgba(17,17,16,0.05)] px-2.5 py-1 text-[11px] font-semibold text-ink-600">
                  <span className="text-ink-400">{item.label}</span>
                  <span className="text-ink-700">{item.value}</span>
                </span>
              ))}
            </div>
          )}
          actions={(
            <>
              <div className="flex items-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 px-3 py-2 shadow-card backdrop-blur-md">
                <Search size={14} className="text-ink-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, cédula o teléfono..."
                  className="w-52 bg-transparent text-[13px] text-ink-700 placeholder:text-ink-400 outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setEditUser(null);
                  setModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-[12px] font-semibold text-white shadow-card transition hover:bg-brand-600"
              >
                <Plus size={14} /> Nuevo contacto
              </button>
            </>
          )}
        />

        {!USE_MOCK_DATA && loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 shadow-card backdrop-blur-md">
          <div className="h-full overflow-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)]">
                  {['Contacto', 'Cédula', 'Teléfono', 'Email', 'Tipo', 'Extras', 'Acciones'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-400">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-[rgba(17,17,16,0.04)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((item) => (
                        <td key={item} className="px-4 py-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.map((user) => {
                  const normalizedMetadata = normalizeMetadataRecord(user.metadata);
                  const typeConfig = TIPO_CONFIG[user.tipo_afiliado] ?? {
                    label: user.tipo_afiliado,
                    className: 'bg-[rgba(17,17,16,0.06)] text-ink-700',
                  };

                  return (
                    <tr key={user.id} className="border-b border-[rgba(17,17,16,0.04)] transition hover:bg-[rgba(17,17,16,0.025)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                            {getInitials(user.nombre, user.apellido)}
                          </div>
                          <p className="text-sm font-semibold text-ink-900">{user.nombre} {user.apellido}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-ink-600">{user.cedula}</td>
                      <td className="px-4 py-3 text-sm text-ink-600">{user.telefono ?? '—'}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-sm text-ink-600">{user.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeConfig.className}`}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {Object.keys(normalizedMetadata).length > 0 ? (
                          <div className="flex max-w-[240px] flex-wrap gap-1">
                            {Object.entries(normalizedMetadata).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="rounded-full bg-[rgba(17,17,16,0.06)] px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-400">Sin extras</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditUser(user);
                              setModalOpen(true);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-[rgba(17,17,16,0.06)] px-2 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-[rgba(17,17,16,0.08)]"
                          >
                            <Pencil size={10} /> Editar
                          </button>
                          <button
                            onClick={() => navigate('/inbox')}
                            className="flex items-center gap-1 rounded-lg bg-sky-100 px-2 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-200"
                          >
                            <ExternalLink size={10} /> Convs.
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-400">
                      No se encontraron contactos
                    </td>
                  </tr>
                ) : null}
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
    </div>
  );
}
