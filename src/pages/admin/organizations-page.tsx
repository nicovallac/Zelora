import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Pencil,
  Check,
  X,
  Shield,
  Clock,
  Globe,
  Phone,
  Mail,
  Plus,
  Trash2,
  Download,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { mockOrganization, mockAuditLog } from '../../data/mock';
import { useNotification } from '../../contexts/NotificationContext';

type OrgTab = 'organizacion' | 'horarios' | 'canales' | 'seguridad';

interface EditableField {
  nombre: string;
  nit: string;
  email: string;
  telefono: string;
  sitioWeb: string;
}

interface BusinessDay {
  dia: string;
  label: string;
  activo: boolean;
  inicio: string;
  fin: string;
}

interface IPEntry {
  id: string;
  cidr: string;
  activo: boolean;
}

const PLAN_BADGE: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700 border border-purple-200',
  profesional: 'bg-blue-100 text-blue-700 border border-blue-200',
  base: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const PLAN_FEATURES: Record<string, string[]> = {
  enterprise: [
    'Omnicanal completo (WhatsApp, Web, Instagram, TikTok)',
    'Integraciones CRM/ERP ilimitadas',
    'SLA garantizado',
    'Soporte dedicado 24/7',
    'Personalización avanzada de flujos',
    'Analytics enterprise con exportación',
  ],
  profesional: [
    'WhatsApp + Chat Web',
    'Dashboard analítico avanzado',
    'Integración con sistemas internos',
    'Automatizaciones extendidas',
    'Soporte prioritario',
  ],
  base: [
    'WhatsApp + Chat Web',
    'Chatbot automatizado 24/7',
    'Bandeja para asesores',
    'Escalamiento humano',
    'Dashboard básico',
  ],
};

const defaultBusinessDays: BusinessDay[] = [
  { dia: 'lun', label: 'Lunes', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'mar', label: 'Martes', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'mié', label: 'Miércoles', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'jue', label: 'Jueves', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'vie', label: 'Viernes', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'sáb', label: 'Sábado', activo: true, inicio: '08:00', fin: '13:00' },
  { dia: 'dom', label: 'Domingo', activo: false, inicio: '08:00', fin: '18:00' },
];

const EVENT_COLORS: Record<string, string> = {
  auth: 'bg-emerald-100 text-emerald-700',
  action: 'bg-blue-100 text-blue-700',
  admin: 'bg-violet-100 text-violet-700',
  campaign: 'bg-orange-100 text-orange-700',
};

export function OrganizationsPage() {
  const { showSuccess, showInfo } = useNotification();
  const [activeTab, setActiveTab] = useState<OrgTab>('organizacion');

  // Tab 1 — Organización
  const [editingField, setEditingField] = useState<keyof EditableField | null>(null);
  const [fields, setFields] = useState<EditableField>({
    nombre: mockOrganization.nombre,
    nit: mockOrganization.nit,
    email: 'contacto@comfaguajira.com',
    telefono: '+57 (5) 727-1000',
    sitioWeb: 'comfaguajira.com',
  });
  const [tempValue, setTempValue] = useState('');

  function startEdit(field: keyof EditableField) {
    setEditingField(field);
    setTempValue(fields[field]);
  }
  function commitEdit() {
    if (editingField) {
      setFields((f) => ({ ...f, [editingField]: tempValue }));
      setEditingField(null);
      showSuccess('Campo actualizado correctamente');
    }
  }
  function cancelEdit() {
    setEditingField(null);
  }

  // Tab 2 — Horarios & SLA
  const [businessDays, setBusinessDays] = useState<BusinessDay[]>(defaultBusinessDays);
  const [slaMinutos, setSlaMinutos] = useState(10);
  const [autoEscalarMinutos, setAutoEscalarMinutos] = useState(15);
  const [mensajeFueraHorario, setMensajeFueraHorario] = useState(
    'Gracias por contactarnos. Estamos fuera de horario. Nuestros asesores estarán disponibles de Lunes a Viernes de 8:00 AM a 6:00 PM. Tu mensaje será atendido en cuanto retomemos labores.'
  );
  const [slaThreshold, setSlaThreshold] = useState(8);

  function toggleDay(dia: string) {
    setBusinessDays((prev) => prev.map((d) => d.dia === dia ? { ...d, activo: !d.activo } : d));
  }
  function updateDayTime(dia: string, field: 'inicio' | 'fin', val: string) {
    setBusinessDays((prev) => prev.map((d) => d.dia === dia ? { ...d, [field]: val } : d));
  }

  // Tab 3 — Canales
  const [showAddChannel, setShowAddChannel] = useState(false);

  // Tab 4 — Seguridad
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [minPasswordLength, setMinPasswordLength] = useState(12);
  const [requireSpecialChars, setRequireSpecialChars] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [passwordExpiryDays, setPasswordExpiryDays] = useState(90);
  const [ipList, setIpList] = useState<IPEntry[]>([
    { id: 'ip1', cidr: '186.29.45.0/24', activo: true },
    { id: 'ip2', cidr: '190.57.128.0/20', activo: true },
  ]);
  const [newIp, setNewIp] = useState('');
  const ipInputRef = useRef<HTMLInputElement>(null);

  function addIp() {
    if (!newIp.trim()) return;
    setIpList((prev) => [...prev, { id: `ip-${Date.now()}`, cidr: newIp.trim(), activo: true }]);
    setNewIp('');
  }
  function removeIp(id: string) {
    setIpList((prev) => prev.filter((ip) => ip.id !== id));
  }
  function toggleIp(id: string) {
    setIpList((prev) => prev.map((ip) => ip.id === id ? { ...ip, activo: !ip.activo } : ip));
  }

  const tabs: { key: OrgTab; label: string }[] = [
    { key: 'organizacion', label: 'Organización' },
    { key: 'horarios', label: 'Horarios & SLA' },
    { key: 'canales', label: 'Canales' },
    { key: 'seguridad', label: 'Seguridad' },
  ];

  const fieldLabels: Record<keyof EditableField, { label: string; icon: React.ReactNode }> = {
    nombre: { label: 'Nombre', icon: <Building2 size={13} /> },
    nit: { label: 'NIT', icon: <Shield size={13} /> },
    email: { label: 'Email de contacto', icon: <Mail size={13} /> },
    telefono: { label: 'Teléfono', icon: <Phone size={13} /> },
    sitioWeb: { label: 'Sitio web', icon: <Globe size={13} /> },
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración de Organización</h1>
        <p className="mt-1 text-sm text-slate-500">Gestiona todos los aspectos de tu organización en la plataforma</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1 — Organización */}
      {activeTab === 'organizacion' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Org card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-700 text-white font-bold text-2xl shadow-lg">
                  CF
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 text-lg">{fields.nombre}</p>
                  <p className="text-sm text-slate-500">{fields.nit}</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${PLAN_BADGE[mockOrganization.plan]}`}>
                    {mockOrganization.plan.charAt(0).toUpperCase() + mockOrganization.plan.slice(1)}
                  </span>
                </div>
              </div>

              {/* Usage stats */}
              <div className="mt-5 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-600">Conversaciones este mes</span>
                    <span className="font-semibold text-slate-800">9.240 / ilimitado</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: '62%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Agentes', val: '8' },
                    { label: 'Artículos KB', val: '24' },
                    { label: 'Campañas', val: '3' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-slate-50 p-2">
                      <p className="text-base font-bold text-slate-800">{s.val}</p>
                      <p className="text-[10px] text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Plan actual</p>
              <p className="font-bold text-slate-900 text-base mb-3 capitalize">{mockOrganization.plan}</p>
              <ul className="space-y-1.5 mb-4">
                {PLAN_FEATURES[mockOrganization.plan].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => showInfo('Contacta a ventas para actualizar tu plan: ventas@comfaguajira.com')}
                className="w-full rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
              >
                Actualizar plan
              </button>
            </div>
          </div>

          {/* Editable fields */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 font-bold text-slate-900">Información de la organización</h2>
              <div className="space-y-4">
                {(Object.keys(fieldLabels) as (keyof EditableField)[]).map((key) => (
                  <div key={key} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="text-slate-400">{fieldLabels[key].icon}</span>
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{fieldLabels[key].label}</p>
                      {editingField === key ? (
                        <input
                          autoFocus
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none border-b border-brand-400 pb-0.5"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{fields[key]}</p>
                      )}
                    </div>
                    {editingField === key ? (
                      <div className="flex gap-1">
                        <button onClick={commitEdit} className="rounded-lg bg-emerald-100 p-1.5 text-emerald-600 hover:bg-emerald-200 transition">
                          <Check size={13} />
                        </button>
                        <button onClick={cancelEdit} className="rounded-lg bg-red-100 p-1.5 text-red-500 hover:bg-red-200 transition">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(key)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition">
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 — Horarios & SLA */}
      {activeTab === 'horarios' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Business hours */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-bold text-slate-900 flex items-center gap-2"><Clock size={16} className="text-brand-600" /> Horario de atención</h2>
            <div className="space-y-2">
              {businessDays.map((day) => (
                <div key={day.dia} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${day.activo ? 'bg-slate-50' : 'bg-slate-50/40 opacity-60'}`}>
                  <button onClick={() => toggleDay(day.dia)} className="text-brand-600">
                    {day.activo ? <ToggleRight size={22} /> : <ToggleLeft size={22} className="text-slate-300" />}
                  </button>
                  <span className="w-24 text-sm font-semibold text-slate-700">{day.label}</span>
                  <input
                    type="time"
                    value={day.inicio}
                    disabled={!day.activo}
                    onChange={(e) => updateDayTime(day.dia, 'inicio', e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-brand-400 disabled:opacity-40"
                  />
                  <span className="text-slate-400 text-xs">—</span>
                  <input
                    type="time"
                    value={day.fin}
                    disabled={!day.activo}
                    onChange={(e) => updateDayTime(day.dia, 'fin', e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-brand-400 disabled:opacity-40"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SLA config */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Shield size={16} className="text-brand-600" /> Configuración SLA</h2>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-slate-700">Tiempo máximo de respuesta</label>
                <span className="font-bold text-brand-600">{slaMinutos} min</span>
              </div>
              <input type="range" min={5} max={60} value={slaMinutos} onChange={(e) => setSlaMinutos(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>5 min</span><span>60 min</span></div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-slate-700">Auto-escalar después de</label>
                <span className="font-bold text-brand-600">{autoEscalarMinutos} min</span>
              </div>
              <input type="range" min={5} max={30} value={autoEscalarMinutos} onChange={(e) => setAutoEscalarMinutos(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>5 min</span><span>30 min</span></div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mensaje fuera de horario</label>
              <textarea
                value={mensajeFueraHorario}
                onChange={(e) => setMensajeFueraHorario(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-brand-400"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Notificar supervisores cuando SLA &gt;</label>
              <input
                type="number"
                value={slaThreshold}
                min={1}
                max={60}
                onChange={(e) => setSlaThreshold(Number(e.target.value))}
                className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 outline-none focus:border-brand-400 text-center"
              />
              <span className="text-sm text-slate-500">min</span>
            </div>

            <button
              onClick={() => showSuccess('Configuración de horarios y SLA guardada')}
              className="w-full rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
            >
              Guardar configuración
            </button>
          </div>
        </div>
      )}

      {/* TAB 3 — Canales */}
      {activeTab === 'canales' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Canales configurados</h2>
            <button
              onClick={() => setShowAddChannel(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
            >
              <Plus size={14} /> Agregar canal
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { id: 'whatsapp', name: 'WhatsApp Business', status: 'activo', detail: '+57 300 ***-**90', extra: 'Configurado', color: 'bg-emerald-500', initial: 'WA', statusBadge: 'bg-emerald-100 text-emerald-700', canDisconnect: true },
              { id: 'web', name: 'Chat Web', status: 'activo', detail: 'Widget instalado en 1 dominio', extra: 'Activo', color: 'bg-brand-600', initial: 'WB', statusBadge: 'bg-emerald-100 text-emerald-700', canDisconnect: true },
              { id: 'instagram', name: 'Instagram DM', status: 'pendiente', detail: 'Pendiente autorización', extra: 'Conectar', color: 'bg-pink-500', initial: 'IG', statusBadge: 'bg-amber-100 text-amber-700', canDisconnect: false },
              { id: 'tiktok', name: 'TikTok', status: 'inactivo', detail: 'No configurado', extra: 'Configurar', color: 'bg-slate-700', initial: 'TK', statusBadge: 'bg-slate-100 text-slate-600', canDisconnect: false },
            ].map((ch) => (
              <div key={ch.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${ch.color} text-white text-sm font-bold`}>
                    {ch.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">{ch.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ch.statusBadge}`}>
                        {ch.status === 'activo' ? 'Activo' : ch.status === 'pendiente' ? 'Pendiente' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{ch.detail}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Última actividad: hace 5 min</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => showSuccess(`Configurando ${ch.name}...`)}
                    className="flex-1 rounded-xl border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {ch.canDisconnect ? 'Editar' : ch.extra}
                  </button>
                  {ch.canDisconnect && (
                    <button
                      onClick={() => showInfo(`¿Deseas desconectar ${ch.name}? Contacta soporte.`)}
                      className="flex-1 rounded-xl border border-red-100 bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                    >
                      Desconectar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add channel modal */}
          <AnimatePresence>
            {showAddChannel && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Agregar canal</h3>
                    <button onClick={() => setShowAddChannel(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"><X size={15} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Telegram', 'Email', 'SMS', 'Messenger'].map((c) => (
                      <button key={c} onClick={() => { setShowAddChannel(false); showInfo(`Integración con ${c} próximamente disponible.`); }}
                        className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-brand-300 transition">
                        {c}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* TAB 4 — Seguridad */}
      {activeTab === 'seguridad' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* MFA + Password policy */}
          <div className="space-y-4">
            {/* MFA */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-900 flex items-center gap-2"><Shield size={16} className="text-brand-600" /> Autenticación multifactor (MFA)</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">MFA para todos los agentes</p>
                  <p className="text-xs text-slate-500">Requiere código adicional al iniciar sesión</p>
                </div>
                <button onClick={() => setMfaEnabled(!mfaEnabled)} className="text-brand-600">
                  {mfaEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-300" />}
                </button>
              </div>
              <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${mfaEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {mfaEnabled ? '● MFA Habilitado' : '○ MFA Deshabilitado'}
              </div>
            </div>

            {/* Password policy */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-slate-900">Política de contraseñas</h2>

              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <label className="font-medium text-slate-700">Longitud mínima</label>
                  <span className="font-bold text-brand-600">{minPasswordLength} caracteres</span>
                </div>
                <input type="range" min={8} max={20} value={minPasswordLength} onChange={(e) => setMinPasswordLength(Number(e.target.value))}
                  className="w-full accent-brand-600" />
              </div>

              {[
                { label: 'Requerir caracteres especiales (!@#$)', val: requireSpecialChars, set: setRequireSpecialChars },
                { label: 'Requerir números', val: requireNumbers, set: setRequireNumbers },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{label}</span>
                  <button onClick={() => set(!val)} className="text-brand-600">
                    {val ? <ToggleRight size={22} /> : <ToggleLeft size={22} className="text-slate-300" />}
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">Expiración</label>
                <input type="number" value={passwordExpiryDays} min={30} max={365}
                  onChange={(e) => setPasswordExpiryDays(Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center outline-none focus:border-brand-400" />
                <span className="text-sm text-slate-500">días</span>
              </div>

              <button onClick={() => showSuccess('Política de contraseñas actualizada')}
                className="w-full rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
                Guardar política
              </button>
            </div>
          </div>

          {/* IP Allowlist + Audit log */}
          <div className="space-y-4">
            {/* IP Allowlist */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-900">Lista blanca de IPs</h2>
              <div className="space-y-2 mb-3">
                {ipList.map((ip) => (
                  <div key={ip.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <button onClick={() => toggleIp(ip.id)} className="text-brand-600">
                      {ip.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} className="text-slate-300" />}
                    </button>
                    <span className="flex-1 font-mono text-sm text-slate-700">{ip.cidr}</span>
                    <button onClick={() => removeIp(ip.id)} className="text-red-400 hover:text-red-600 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  ref={ipInputRef}
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIp()}
                  placeholder="192.168.1.0/24"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-sm outline-none focus:border-brand-400"
                />
                <button onClick={addIp} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 transition">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Audit log */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Registro de auditoría</h2>
                <button onClick={() => showSuccess('Audit log exportado como CSV')}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">
                  <Download size={12} /> Exportar
                </button>
              </div>
              <div className="space-y-2">
                {mockAuditLog.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0 ${EVENT_COLORS[ev.tipo]}`}>
                      {ev.tipo}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{ev.evento}</p>
                      <p className="text-[10px] text-slate-500">{ev.usuario} · {ev.ip}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 flex-shrink-0">
                      {new Date(ev.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
