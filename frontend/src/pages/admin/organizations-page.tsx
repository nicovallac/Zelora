import { useEffect, useState, useRef } from 'react';
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
import { useNotification } from '../../contexts/NotificationContext';
import { api } from '../../services/api';
import type { OnboardingProfileApiItem, OnboardingProfilePayload, SecurityAuditLogItem } from '../../services/api';
import { PageHeader } from '../../components/ui/page-header';

const AUDIT_EVENT_COLORS: Record<string, string> = {
  login_success: 'bg-emerald-100 text-emerald-700',
  login_failed: 'bg-red-100 text-red-700',
  login_blocked_ip: 'bg-red-100 text-red-700',
  password_changed: 'bg-blue-100 text-blue-700',
  security_settings_changed: 'bg-violet-100 text-violet-700',
  ip_allowlist_changed: 'bg-violet-100 text-violet-700',
  agent_created: 'bg-orange-100 text-orange-700',
  agent_deleted: 'bg-orange-100 text-orange-700',
};

type OrgTab = 'organizacion' | 'plataforma' | 'horarios' | 'seguridad';

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

interface NotificationSetting {
  key: string;
  label: string;
  email: boolean;
  whatsapp: boolean;
  browser: boolean;
  enabled: boolean;
}

type PaymentDetailTab = 'transferencia bancaria' | 'efectivo';

const PLAN_BADGE: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700 border border-purple-200',
  profesional: 'bg-blue-100 text-blue-700 border border-blue-200',
  base: 'bg-[rgba(17,17,16,0.06)] text-ink-600 border border-[rgba(17,17,16,0.09)]',
};

const PLAN_FEATURES: Record<string, string[]> = {
  enterprise: [
    'Canales avanzados y automatizaciones extendidas',
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

const ORGANIZATION_PLAN = 'base';

void PLAN_BADGE;
void PLAN_FEATURES;

const defaultBusinessDays: BusinessDay[] = [
  { dia: 'lun', label: 'Lunes', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'mar', label: 'Martes', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'mié', label: 'Miércoles', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'jue', label: 'Jueves', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'vie', label: 'Viernes', activo: true, inicio: '08:00', fin: '18:00' },
  { dia: 'sáb', label: 'Sábado', activo: true, inicio: '08:00', fin: '13:00' },
  { dia: 'dom', label: 'Domingo', activo: false, inicio: '08:00', fin: '18:00' },
];


export function OrganizationsPage() {
  const { showSuccess, showInfo, showError } = useNotification();
  const [activeTab, setActiveTab] = useState<OrgTab>('organizacion');
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfileApiItem | null>(null);
  const [loadingOrganization, setLoadingOrganization] = useState(true);
  const [savingOrganization, setSavingOrganization] = useState(false);
  const [paymentDetailTab, setPaymentDetailTab] = useState<PaymentDetailTab>('transferencia bancaria');
  const [orgStats, setOrgStats] = useState({ agents: '—', articles: '—', campaigns: '—', convThisMonth: '—' });
  const [auditLog, setAuditLog] = useState<SecurityAuditLogItem[]>([]);
  const [loadingAuditLog, setLoadingAuditLog] = useState(false);

  // Tab 1 — Organización
  const [editingField, setEditingField] = useState<keyof EditableField | null>(null);
  const [fields, setFields] = useState<EditableField>({
    nombre: '',
    nit: '',
    email: '',
    telefono: '',
    sitioWeb: '',
  });
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizationContext() {
      setLoadingOrganization(true);
      try {
        const [profile, agentsRes, articlesRes, campaignsRes, convStatsRes] = await Promise.allSettled([
          api.getOnboardingProfile(),
          api.getAgents(),
          api.getKnowledgeBaseArticles(),
          api.getCampaigns(),
          api.getConversationStats(),
        ]);
        if (cancelled) return;

        if (profile.status === 'fulfilled') {
          const p = profile.value;
          setOnboardingProfile(p);
          setFields((current) => ({
            ...current,
            nombre: p.organization_name || current.nombre,
            nit: p.tax_id || current.nit,
            email: p.contact_email || current.email,
            telefono: p.contact_phone || current.telefono,
            sitioWeb: p.website || current.sitioWeb,
          }));
          // Init Horarios & SLA from locale_settings
          const ls = p.locale_settings || {};
          if (ls.business_hours?.length) setBusinessDays(ls.business_hours);
          if (ls.sla_minutes) setSlaMinutos(ls.sla_minutes);
          if (ls.auto_escalate_minutes) setAutoEscalarMinutos(ls.auto_escalate_minutes);
          if (ls.off_hours_message) setMensajeFueraHorario(ls.off_hours_message);
          if (ls.sla_threshold) setSlaThreshold(ls.sla_threshold);
          // Init Seguridad from security_settings
          const ss = p.security_settings || {};
          if (ss.mfa_enabled !== undefined) setMfaEnabled(ss.mfa_enabled);
          if (ss.min_password_length) setMinPasswordLength(ss.min_password_length);
          if (ss.require_special_chars !== undefined) setRequireSpecialChars(ss.require_special_chars);
          if (ss.require_numbers !== undefined) setRequireNumbers(ss.require_numbers);
          if (ss.password_expiry_days) setPasswordExpiryDays(ss.password_expiry_days);
          if (ss.ip_allowlist?.length) setIpList(ss.ip_allowlist);
        } else {
          showError('Organizacion', profile.reason instanceof Error ? profile.reason.message : 'No se pudo cargar la informacion de onboarding.');
        }

        setOrgStats({
          agents: agentsRes.status === 'fulfilled' ? String(agentsRes.value.length) : '—',
          articles: articlesRes.status === 'fulfilled' ? String(articlesRes.value.length) : '—',
          campaigns: campaignsRes.status === 'fulfilled' ? String(campaignsRes.value.length) : '—',
          convThisMonth: convStatsRes.status === 'fulfilled' ? convStatsRes.value.this_month.toLocaleString('es-CO') : '—',
        });
      } finally {
        if (!cancelled) setLoadingOrganization(false);
      }
    }

    void loadOrganizationContext();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  function startEdit(field: keyof EditableField) {
    setEditingField(field);
    setTempValue(fields[field]);
  }
  async function commitEdit() {
    if (editingField) {
      const nextFields = { ...fields, [editingField]: tempValue };
      setFields(nextFields);
      setEditingField(null);
      setSavingOrganization(true);
      try {
        const saved = await api.updateOnboardingProfile({
          organization_name: nextFields.nombre,
          website: nextFields.sitioWeb,
          tax_id: nextFields.nit,
          contact_email: nextFields.email,
          contact_phone: nextFields.telefono,
        });
        setOnboardingProfile(saved);
        setFields({
          nombre: saved.organization_name || '',
          nit: saved.tax_id || '',
          email: saved.contact_email || '',
          telefono: saved.contact_phone || '',
          sitioWeb: saved.website || '',
        });
        showSuccess('Organizacion', 'Cambios guardados correctamente.');
      } catch (error) {
        showError('Organizacion', error instanceof Error ? error.message : 'No se pudo guardar la configuracion.');
      } finally {
        setSavingOrganization(false);
      }
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

  // Tab: Seguridad
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
    { key: 'plataforma', label: 'Plataforma' },
    { key: 'organizacion', label: 'Organización' },
    { key: 'horarios', label: 'Horarios & SLA' },
    { key: 'seguridad', label: 'Seguridad' },
  ];

  const fieldLabels: Record<keyof EditableField, { label: string; icon: React.ReactNode }> = {
    nombre: { label: 'Nombre', icon: <Building2 size={13} /> },
    nit: { label: 'NIT', icon: <Shield size={13} /> },
    email: { label: 'Email de contacto', icon: <Mail size={13} /> },
    telefono: { label: 'Teléfono', icon: <Phone size={13} /> },
    sitioWeb: { label: 'Sitio web', icon: <Globe size={13} /> },
  };
  const fieldPlaceholders: Record<keyof EditableField, string> = {
    nombre: 'Ej: Safaera Store',
    nit: 'Ej: 901234567-8',
    email: 'Ej: hola@safaera.co',
    telefono: 'Ej: +57 300 123 4567',
    sitioWeb: 'Ej: https://safaera.co',
  };

  const paymentMethods = onboardingProfile?.payment_methods || [];
  const paymentSettings = onboardingProfile?.payment_settings || {};

  function togglePaymentMethod(method: string, enabled: boolean) {
    const current = new Set(paymentMethods);
    if (enabled) {
      current.add(method);
    } else {
      current.delete(method);
    }
    setOnboardingProfile((currentProfile) => currentProfile ? ({
      ...currentProfile,
      payment_methods: Array.from(current),
    }) : currentProfile);
  }

  function updatePaymentSettings(patch: Record<string, unknown>) {
    setOnboardingProfile((currentProfile) => currentProfile ? ({
      ...currentProfile,
      payment_settings: {
        ...(currentProfile.payment_settings || {}),
        ...patch,
      },
    }) : currentProfile);
  }

  async function persistOrganization(patch?: OnboardingProfilePayload) {
    setSavingOrganization(true);
    try {
      const saved = await api.updateOnboardingProfile({
        organization_name: fields.nombre,
        website: fields.sitioWeb,
        tax_id: fields.nit,
        contact_email: fields.email,
        contact_phone: fields.telefono,
        ...(patch || {}),
      });
      setOnboardingProfile(saved);
      setFields((current) => ({
        ...current,
        nombre: saved.organization_name || '',
        nit: saved.tax_id || '',
        email: saved.contact_email || '',
        telefono: saved.contact_phone || '',
        sitioWeb: saved.website || '',
      }));
      showSuccess('Organizacion', 'Cambios guardados correctamente.');
      return saved;
    } catch (error) {
      showError('Organizacion', error instanceof Error ? error.message : 'No se pudo guardar la configuracion.');
      return null;
    } finally {
      setSavingOrganization(false);
    }
  }

  async function saveHorarios() {
    setSavingOrganization(true);
    try {
      const saved = await api.updateOnboardingProfile({
        locale_settings: {
          ...(onboardingProfile?.locale_settings || {}),
          business_hours: businessDays,
          sla_minutes: slaMinutos,
          auto_escalate_minutes: autoEscalarMinutos,
          off_hours_message: mensajeFueraHorario,
          sla_threshold: slaThreshold,
        },
      });
      setOnboardingProfile(saved);
      showSuccess('Organizacion', 'Horarios y SLA guardados.');
    } catch (err) {
      showError('Organizacion', err instanceof Error ? err.message : 'No se pudo guardar los horarios.');
    } finally {
      setSavingOrganization(false);
    }
  }

  async function saveSeguridad() {
    setSavingOrganization(true);
    try {
      const saved = await api.updateOnboardingProfile({
        security_settings: {
          mfa_enabled: mfaEnabled,
          min_password_length: minPasswordLength,
          require_special_chars: requireSpecialChars,
          require_numbers: requireNumbers,
          password_expiry_days: passwordExpiryDays,
          ip_allowlist: ipList,
        },
      });
      setOnboardingProfile(saved);
      showSuccess('Organizacion', 'Configuracion de seguridad guardada.');
    } catch (err) {
      showError('Organizacion', err instanceof Error ? err.message : 'No se pudo guardar la configuracion de seguridad.');
    } finally {
      setSavingOrganization(false);
    }
  }

  async function loadAuditLog() {
    setLoadingAuditLog(true);
    try {
      const logs = await api.getSecurityAuditLog();
      setAuditLog(logs);
    } catch {
      // non-fatal — audit log panel will stay empty
    } finally {
      setLoadingAuditLog(false);
    }
  }

  function switchTab(tab: OrgTab) {
    setActiveTab(tab);
    if (tab === 'seguridad' && auditLog.length === 0) {
      void loadAuditLog();
    }
  }

  const localeSettings = onboardingProfile?.locale_settings || {};
  const notificationDefaults: NotificationSetting[] = [
    { key: 'nueva_conv', label: 'Nueva conversacion entrante', email: true, whatsapp: false, browser: true, enabled: true },
    { key: 'escalada', label: 'Conversacion escalada', email: true, whatsapp: true, browser: true, enabled: true },
    { key: 'sla', label: 'SLA vencido', email: true, whatsapp: true, browser: true, enabled: true },
    { key: 'error_int', label: 'Error de integracion', email: true, whatsapp: false, browser: true, enabled: true },
    { key: 'informe', label: 'Informe semanal', email: true, whatsapp: false, browser: false, enabled: true },
  ];
  const notificationSettings = (onboardingProfile?.notification_settings?.items?.length
    ? onboardingProfile.notification_settings.items
    : notificationDefaults) as NotificationSetting[];

  function updateNotificationSetting(key: string, field: keyof NotificationSetting) {
    const nextItems = notificationSettings.map((item) => (
      item.key === key ? { ...item, [field]: !item[field] } : item
    ));
    setOnboardingProfile((current) => current ? ({
      ...current,
      notification_settings: {
        ...(current.notification_settings || {}),
        items: nextItems,
      },
    }) : current);
  }

  return (
    <div className="page-shell overflow-hidden">
      <div className="page-stack min-h-0 overflow-hidden">
      <PageHeader
        eyebrow="Workspace"
        title="Configuracion de organizacion"
        description="Centraliza identidad, reglas operativas y seguridad de la marca en una vista compacta."
        actions={
          <button
            onClick={() => void persistOrganization(onboardingProfile || undefined)}
            disabled={savingOrganization}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {savingOrganization ? 'Guardando...' : 'Guardar cambios'}
          </button>
        }
      />
      <div className="hidden">
        <h1 className="text-2xl font-bold text-ink-900">Configuración de Organización</h1>
        <p className="mt-1 text-sm text-ink-400">Gestiona todos los aspectos de tu organización en la plataforma</p>
      </div>

      {/* Tabs */}
      <div className="rounded-[26px] border border-[rgba(17,17,16,0.09)]/80 bg-white/90 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)]">
        <div className="border-b border-[rgba(17,17,16,0.09)] px-4 py-2.5 sm:px-5">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-brand-500 text-white shadow-card'
                  : 'bg-[rgba(17,17,16,0.06)] text-ink-600 hover:bg-[rgba(17,17,16,0.08)] hover:text-ink-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 max-h-[calc(100vh-250px)] overflow-y-auto px-4 py-4 sm:px-5">

      {/* TAB 1 — Organización */}
      {activeTab === 'organizacion' && (
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          {/* Org card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white font-bold text-xl shadow-lg">
                  {fields.nombre?.trim()?.slice(0, 2).toUpperCase() || 'OR'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-ink-900">{fields.nombre || 'Organizacion'}</p>
                  <p className="truncate text-xs text-ink-400">{fields.nit || 'Sin NIT definido'}</p>
                  <p className="mt-1 truncate text-[11px] text-ink-400">{fields.sitioWeb || 'Sin sitio web'}</p>
                  {false ? (
                    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${PLAN_BADGE.base}`}>
                      Base
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Usage stats */}
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-600">Conversaciones este mes</span>
                    <span className="font-semibold text-ink-800">{orgStats.convThisMonth} / ilimitado</span>
                  </div>
                  <div className="h-2 rounded-full bg-[rgba(17,17,16,0.06)]">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: '62%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Agentes', val: orgStats.agents },
                    { label: 'Artículos KB', val: orgStats.articles },
                    { label: 'Campañas', val: orgStats.campaigns },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-[rgba(17,17,16,0.025)] px-2 py-2">
                      <p className="text-sm font-bold text-ink-800">{s.val}</p>
                      <p className="text-[10px] text-ink-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-400">Plan actual</p>
              <p className="font-bold text-ink-900 text-base mb-3 capitalize">{ORGANIZATION_PLAN}</p>
              <ul className="space-y-1.5 mb-4">
                {PLAN_FEATURES[ORGANIZATION_PLAN].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-ink-600">
                    <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => showInfo('Contacta a ventas para actualizar tu plan: ventas@comfaguajira.com')}
                className="w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition"
              >
                Actualizar plan
              </button>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
              <h2 className="mb-5 font-bold text-ink-900">Información de la organización</h2>
              {loadingOrganization ? (
                <div className="mb-4 rounded-xl bg-[rgba(17,17,16,0.025)] px-4 py-3 text-sm text-ink-400">Cargando informacion de onboarding...</div>
              ) : null}
              <div className="grid gap-3 lg:grid-cols-2">
                {(Object.keys(fieldLabels) as (keyof EditableField)[]).map((key) => (
                  <div key={key} className="flex items-center gap-3 rounded-xl border border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)] px-3 py-2.5">
                    <span className="text-ink-400">{fieldLabels[key].icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{fieldLabels[key].label}</p>
                      {editingField === key ? (
                        <input
                          autoFocus
                          value={tempValue}
                          placeholder={fieldPlaceholders[key]}
                          onChange={(e) => setTempValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                          className="w-full bg-transparent text-sm font-semibold text-ink-900 outline-none border-b border-brand-400 pb-0.5"
                        />
                      ) : (
                        <p className="truncate text-sm font-semibold text-ink-900">{fields[key] || 'No definido'}</p>
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
                      <button onClick={() => startEdit(key)} className="rounded-full p-1.5 text-ink-400 hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-700 transition">
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.03)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Configuracion comercial</p>
                <p className="mt-1 text-sm text-ink-700">
                  La personalidad, tono, buyer model y playbook del vendedor ahora se configuran en <a href="/admin/agents" className="font-semibold text-brand-600">Agentes</a>.
                </p>
              </div>

              <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink-900">Metodos de pago</h3>
                    <p className="mt-1 text-xs text-ink-500">Define que puede ofrecer el asistente y deja listos los datos operativos para venta.</p>
                  </div>
                  <div className="rounded-full border border-[rgba(17,17,16,0.08)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-ink-600">
                    {paymentMethods.length} activos
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-brand-200/60 bg-brand-50/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">Uso en ventas</p>
                      <p className="mt-1 text-xs leading-relaxed text-brand-700">
                        El Sales Agent ofrecera estos metodos automaticamente en el chat. Si quieres explicarle condiciones, confirmacion o restricciones, hazlo desde <a href="/knowledge-base" className="font-semibold underline">Knowledge Base</a> con una politica de pago.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {paymentMethods.length ? paymentMethods.map((method) => (
                        <span key={method} className="rounded-full border border-brand-200/70 bg-white/90 px-3 py-1 text-[11px] font-semibold text-brand-700">
                          {method}
                        </span>
                      )) : (
                        <span className="rounded-full border border-brand-200/70 bg-white/90 px-3 py-1 text-[11px] font-semibold text-brand-700">
                          Sin metodos activos
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextValue = !paymentMethods.includes('transferencia bancaria');
                      togglePaymentMethod('transferencia bancaria', nextValue);
                      updatePaymentSettings({ bank_transfer_enabled: nextValue });
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      paymentMethods.includes('transferencia bancaria')
                        ? 'border-brand-300 bg-brand-50/70'
                        : 'border-[rgba(17,17,16,0.08)] bg-white/80 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">Transferencia bancaria</p>
                        <p className="mt-1 text-xs text-ink-500">Disponible para que el asesor la ofrezca en el chat y en el cierre.</p>
                      </div>
                      {paymentMethods.includes('transferencia bancaria') ? (
                        <ToggleRight size={24} className="text-brand-500" />
                      ) : (
                        <ToggleLeft size={24} className="text-ink-300" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextValue = !paymentMethods.includes('efectivo');
                      togglePaymentMethod('efectivo', nextValue);
                      updatePaymentSettings({ cash_enabled: nextValue });
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      paymentMethods.includes('efectivo')
                        ? 'border-brand-300 bg-brand-50/70'
                        : 'border-[rgba(17,17,16,0.08)] bg-white/80 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">Efectivo</p>
                        <p className="mt-1 text-xs text-ink-500">Disponible como alternativa cuando el negocio permita pago presencial o contraentrega.</p>
                      </div>
                      {paymentMethods.includes('efectivo') ? (
                        <ToggleRight size={24} className="text-brand-500" />
                      ) : (
                        <ToggleLeft size={24} className="text-ink-300" />
                      )}
                    </div>
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/80 p-4">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {([
                      { id: 'transferencia bancaria', label: 'Transferencia bancaria' },
                      { id: 'efectivo', label: 'Efectivo' },
                    ] as const).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPaymentDetailTab(tab.id)}
                        className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                          paymentDetailTab === tab.id
                            ? 'bg-ink-900 text-white'
                            : 'border border-[rgba(17,17,16,0.10)] bg-white text-ink-500 hover:text-ink-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {paymentDetailTab === 'transferencia bancaria' ? (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                      <div>
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Datos bancarios</p>
                          <p className="mt-1 text-xs text-ink-500">Informacion que el asesor comparte cuando el cliente elige transferencia.</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Banco</span>
                            <input
                              value={String(paymentSettings.bank_name || '')}
                              onChange={(e) => updatePaymentSettings({ bank_name: e.target.value })}
                              placeholder="Ej: Bancolombia"
                              className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm text-ink-700 outline-none focus:border-brand-400"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Tipo de cuenta</span>
                            <input
                              value={String(paymentSettings.account_type || '')}
                              onChange={(e) => updatePaymentSettings({ account_type: e.target.value })}
                              placeholder="Ej: Ahorros"
                              className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm text-ink-700 outline-none focus:border-brand-400"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Numero de cuenta</span>
                            <input
                              value={String(paymentSettings.account_number || '')}
                              onChange={(e) => updatePaymentSettings({ account_number: e.target.value })}
                              placeholder="Ej: 12345678901"
                              className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm text-ink-700 outline-none focus:border-brand-400"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Titular</span>
                            <input
                              value={String(paymentSettings.account_holder || '')}
                              onChange={(e) => updatePaymentSettings({ account_holder: e.target.value })}
                              placeholder="Ej: Valdiri Move SAS"
                              className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm text-ink-700 outline-none focus:border-brand-400"
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Instrucciones de confirmacion</p>
                          <p className="mt-1 text-xs text-ink-500">Guia operativa para pedir soporte y validar el pago.</p>
                        </div>
                        <label className="block">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Nota de referencia</span>
                          <textarea
                            value={String(paymentSettings.payment_reference_note || '')}
                            onChange={(e) => updatePaymentSettings({ payment_reference_note: e.target.value })}
                            rows={5}
                            placeholder="Ej: Enviar comprobante por chat con nombre y producto."
                            className="mt-2 w-full resize-none rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm text-ink-700 outline-none focus:border-brand-400"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.02)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Resumen</p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">Pago en efectivo</p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-500">
                          Usa este bloque para dejar claro si aplica contraentrega, pago en punto fisico o alguna validacion manual antes de cerrar.
                        </p>
                      </div>
                      <div>
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Instrucciones para efectivo</p>
                          <p className="mt-1 text-xs text-ink-500">Lo que debe decir el agente cuando el cliente elige esta alternativa.</p>
                        </div>
                        <label className="block">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Detalle operativo</span>
                          <textarea
                            value={String(paymentSettings.cash_instructions || '')}
                            onChange={(e) => updatePaymentSettings({ cash_instructions: e.target.value })}
                            rows={6}
                            placeholder="Ej: Pago en efectivo contra entrega o recogida en punto."
                            className="mt-2 w-full resize-none rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm text-ink-700 outline-none focus:border-brand-400"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
      )}

      {/* TAB 2 — Horarios & SLA */}
      {activeTab === 'plataforma' && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
              <h2 className="mb-4 text-sm font-bold text-ink-900">Regional y sesion</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Idioma</span>
                  <select value={localeSettings.language || 'es'} onChange={(e) => setOnboardingProfile((current) => current ? ({ ...current, locale_settings: { ...(current.locale_settings || {}), language: e.target.value } }) : current)} className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm outline-none focus:border-brand-400">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Zona horaria</span>
                  <select value={onboardingProfile?.timezone || 'America/Bogota'} onChange={(e) => setOnboardingProfile((current) => current ? { ...current, timezone: e.target.value } : current)} className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm outline-none focus:border-brand-400">
                    <option value="America/Bogota">America/Bogota</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/Madrid">Europe/Madrid</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Formato de fecha</span>
                  <select value={localeSettings.date_format || 'DD/MM/YYYY'} onChange={(e) => setOnboardingProfile((current) => current ? ({ ...current, locale_settings: { ...(current.locale_settings || {}), date_format: e.target.value } }) : current)} className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm outline-none focus:border-brand-400">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Timeout de sesion</span>
                  <input type="number" min={30} max={1440} value={localeSettings.session_timeout_minutes || 480} onChange={(e) => setOnboardingProfile((current) => current ? ({ ...current, locale_settings: { ...(current.locale_settings || {}), session_timeout_minutes: Number(e.target.value) } }) : current)} placeholder="Ej: 480" className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md px-3 py-2 text-sm outline-none focus:border-brand-400" />
                </label>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-700">Responder por defecto en el idioma del usuario</p>
                  <p className="text-xs text-ink-400">Si esta activo, el bot se adapta al idioma detectado.</p>
                </div>
                <button onClick={() => setOnboardingProfile((current) => current ? ({ ...current, locale_settings: { ...(current.locale_settings || {}), default_response_language: !(current.locale_settings?.default_response_language ?? true) } }) : current)} className="text-brand-600">
                  {(localeSettings.default_response_language ?? true) ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-ink-300" />}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-5 shadow-card">
              <h2 className="mb-4 text-sm font-bold text-ink-900">Notificaciones</h2>
              <div className="overflow-hidden rounded-2xl border border-[rgba(17,17,16,0.09)]">
                <table className="w-full text-sm">
                  <thead className="border-b border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.025)]">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-400">Evento</th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400">On</th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400">Email</th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400">WA</th>
                      <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400">Web</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(17,17,16,0.06)]">
                    {notificationSettings.map((item) => (
                      <tr key={item.key} className={!item.enabled ? 'opacity-50' : ''}>
                        <td className="px-3 py-2 text-sm font-medium text-ink-700">{item.label}</td>
                        {(['enabled', 'email', 'whatsapp', 'browser'] as const).map((field) => (
                          <td key={field} className="px-3 py-2 text-center">
                            <button onClick={() => updateNotificationSetting(item.key, field)} className="text-brand-600">
                              {item[field] ? <ToggleRight size={20} /> : <ToggleLeft size={20} className="text-ink-300" />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] p-5 text-sm text-ink-600">
              <p className="font-semibold text-ink-800">Apariencia del widget</p>
              <p className="mt-1">No la repito aqui para evitar duplicados. El color, launcher, saludo y look del chat se ajustan desde <span className="font-semibold text-ink-800">Canales</span>, porque dependen del canal concreto.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'horarios' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Business hours */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-6 shadow-card">
            <h2 className="mb-4 font-bold text-ink-900 flex items-center gap-2"><Clock size={16} className="text-brand-600" /> Horario de atención</h2>
            <div className="space-y-2">
              {businessDays.map((day) => (
                <div key={day.dia} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${day.activo ? 'bg-[rgba(17,17,16,0.025)]' : 'bg-[rgba(17,17,16,0.025)]/40 opacity-60'}`}>
                  <button onClick={() => toggleDay(day.dia)} className="text-brand-600">
                    {day.activo ? <ToggleRight size={22} /> : <ToggleLeft size={22} className="text-ink-300" />}
                  </button>
                  <span className="w-24 text-sm font-semibold text-ink-700">{day.label}</span>
                  <input
                    type="time"
                    value={day.inicio}
                    disabled={!day.activo}
                    onChange={(e) => updateDayTime(day.dia, 'inicio', e.target.value)}
                    className="rounded-lg border border-[rgba(17,17,16,0.09)] px-2 py-1 text-xs text-ink-700 outline-none focus:border-brand-400 disabled:opacity-40"
                  />
                  <span className="text-ink-400 text-xs">—</span>
                  <input
                    type="time"
                    value={day.fin}
                    disabled={!day.activo}
                    onChange={(e) => updateDayTime(day.dia, 'fin', e.target.value)}
                    className="rounded-lg border border-[rgba(17,17,16,0.09)] px-2 py-1 text-xs text-ink-700 outline-none focus:border-brand-400 disabled:opacity-40"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SLA config */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-6 shadow-card space-y-5">
            <h2 className="font-bold text-ink-900 flex items-center gap-2"><Shield size={16} className="text-brand-600" /> Configuración SLA</h2>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-ink-700">Tiempo máximo de respuesta</label>
                <span className="font-bold text-brand-600">{slaMinutos} min</span>
              </div>
              <input type="range" min={5} max={60} value={slaMinutos} onChange={(e) => setSlaMinutos(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-ink-400 mt-0.5"><span>5 min</span><span>60 min</span></div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <label className="font-medium text-ink-700">Auto-escalar después de</label>
                <span className="font-bold text-brand-600">{autoEscalarMinutos} min</span>
              </div>
              <input type="range" min={5} max={30} value={autoEscalarMinutos} onChange={(e) => setAutoEscalarMinutos(Number(e.target.value))}
                className="w-full accent-brand-600" />
              <div className="flex justify-between text-[10px] text-ink-400 mt-0.5"><span>5 min</span><span>30 min</span></div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Mensaje fuera de horario</label>
              <textarea
                value={mensajeFueraHorario}
                onChange={(e) => setMensajeFueraHorario(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-[rgba(17,17,16,0.09)] p-3 text-sm text-ink-700 outline-none focus:border-brand-400"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-ink-700">Notificar supervisores cuando SLA &gt;</label>
              <input
                type="number"
                value={slaThreshold}
                min={1}
                max={60}
                onChange={(e) => setSlaThreshold(Number(e.target.value))}
                className="w-16 rounded-lg border border-[rgba(17,17,16,0.09)] px-2 py-1 text-sm text-ink-700 outline-none focus:border-brand-400 text-center"
              />
              <span className="text-sm text-ink-400">min</span>
            </div>

            <button
              onClick={() => void saveHorarios()}
              disabled={savingOrganization}
              className="w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition"
            >
              {savingOrganization ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </div>
      )}

      {/* TAB: Seguridad */}
      {activeTab === 'seguridad' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* MFA + Password policy */}
          <div className="space-y-4">
            {/* MFA */}
            <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-6 shadow-card">
              <h2 className="mb-4 font-bold text-ink-900 flex items-center gap-2"><Shield size={16} className="text-brand-600" /> Autenticación multifactor (MFA)</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-700">MFA para todos los agentes</p>
                  <p className="text-xs text-ink-400">Requiere código adicional al iniciar sesión</p>
                </div>
                <button onClick={() => setMfaEnabled(!mfaEnabled)} className="text-brand-600">
                  {mfaEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-ink-300" />}
                </button>
              </div>
              <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${mfaEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {mfaEnabled ? '● MFA Habilitado' : '○ MFA Deshabilitado'}
              </div>
            </div>

            {/* Password policy */}
            <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-6 shadow-card space-y-4">
              <h2 className="font-bold text-ink-900">Política de contraseñas</h2>

              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <label className="font-medium text-ink-700">Longitud mínima</label>
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
                  <span className="text-sm text-ink-700">{label}</span>
                  <button onClick={() => set(!val)} className="text-brand-600">
                    {val ? <ToggleRight size={22} /> : <ToggleLeft size={22} className="text-ink-300" />}
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-ink-700">Expiración</label>
                <input type="number" value={passwordExpiryDays} min={30} max={365}
                  onChange={(e) => setPasswordExpiryDays(Number(e.target.value))}
                  className="w-20 rounded-lg border border-[rgba(17,17,16,0.09)] px-2 py-1 text-sm text-center outline-none focus:border-brand-400" />
                <span className="text-sm text-ink-400">días</span>
              </div>

              <button onClick={() => void saveSeguridad()} disabled={savingOrganization}
                className="w-full rounded-full bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition">
                {savingOrganization ? 'Guardando...' : 'Guardar configuración de seguridad'}
              </button>
            </div>
          </div>

          {/* IP Allowlist + Audit log */}
          <div className="space-y-4">
            {/* IP Allowlist */}
            <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-6 shadow-card">
              <h2 className="mb-4 font-bold text-ink-900">Lista blanca de IPs</h2>
              <div className="space-y-2 mb-3">
                {ipList.map((ip) => (
                  <div key={ip.id} className="flex items-center gap-2 rounded-lg bg-[rgba(17,17,16,0.025)] px-3 py-2">
                    <button onClick={() => toggleIp(ip.id)} className="text-brand-600">
                      {ip.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} className="text-ink-300" />}
                    </button>
                    <span className="flex-1 font-mono text-sm text-ink-700">{ip.cidr}</span>
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
                  className="flex-1 rounded-lg border border-[rgba(17,17,16,0.09)] px-3 py-1.5 font-mono text-sm outline-none focus:border-brand-400"
                />
                <button onClick={addIp} className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Audit log */}
            <div className="rounded-2xl border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-ink-900">Registro de auditoría</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => void loadAuditLog()}
                    disabled={loadingAuditLog}
                    className="flex items-center gap-1.5 rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-[rgba(17,17,16,0.09)] transition disabled:opacity-50"
                  >
                    {loadingAuditLog ? '...' : 'Actualizar'}
                  </button>
                  <button
                    onClick={() => void api.downloadSecurityAuditLogCsv().catch((e: unknown) => showError('Audit Log', e instanceof Error ? e.message : 'Error al exportar'))}
                    className="flex items-center gap-1.5 rounded-full bg-[rgba(17,17,16,0.05)] px-3 py-1.5 text-[12px] font-semibold text-ink-700 hover:bg-[rgba(17,17,16,0.09)] transition"
                  >
                    <Download size={12} /> Exportar CSV
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {loadingAuditLog ? (
                  <p className="py-6 text-center text-sm text-ink-400">Cargando eventos...</p>
                ) : auditLog.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink-400">No hay eventos de auditoría registrados.</p>
                ) : (
                  auditLog.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3 rounded-xl bg-[rgba(17,17,16,0.025)] px-3 py-2.5">
                      <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0 ${AUDIT_EVENT_COLORS[ev.event_type] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ev.event_type.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink-800 truncate">{ev.event_description}</p>
                        <p className="text-[10px] text-ink-400">{ev.actor_email || '—'} · {ev.ip_address || 'IP desconocida'}</p>
                      </div>
                      <p className="text-[10px] text-ink-400 flex-shrink-0 whitespace-nowrap">
                        {new Date(ev.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
    </div>
  );
}
