import { useMemo, useRef, useState } from 'react';
import { CreditCard, FileText, Link2, Loader2, PackageCheck, Paperclip, ReceiptText, ShieldAlert, Truck, X } from 'lucide-react';
import type { KBArticlePurpose } from '../../services/api';
import { Button, Card } from '../ui/primitives';

type AddMode = 'texto' | 'link' | 'archivo' | 'template';
type PolicyTemplateId = 'brand_context' | 'shipping' | 'payments' | 'returns' | 'discounts' | 'restrictions';

type CreateTextPayload = {
  title: string;
  content: string;
  category?: string;
  purpose?: KBArticlePurpose;
  tags?: string[];
};

interface AddKnowledgeModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCreateText: (payload: CreateTextPayload) => Promise<void>;
  onCreateLink: (payload: { url: string }) => Promise<void>;
  onUploadFile: (file: File) => Promise<void>;
}

type PolicyTemplate = {
  id: PolicyTemplateId;
  label: string;
  icon: typeof Truck;
  title: string;
  hint: string;
  category: string;
  purpose: KBArticlePurpose;
  tags: string[];
  fields: Array<{ key: string; label: string; placeholder: string; rows?: number }>;
};

const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'brand_context',
    label: 'Contexto de marca',
    icon: FileText,
    title: 'Contexto compartido de marca',
    hint: 'Base comun que heredan todos los agentes: que vende la marca, a quien sirve y como debe presentarse.',
    category: 'Contexto de marca',
    purpose: 'business',
    tags: ['brand-context', 'shared-context', 'agents'],
    fields: [
      { key: 'offer', label: 'Que ofrece la marca', placeholder: 'Ej: servicios de salud, educacion, creditos y beneficios para afiliados' },
      { key: 'audience', label: 'A quien sirve', placeholder: 'Ej: afiliados, empresas, particulares y familias de la region' },
      { key: 'mission', label: 'Proposito o mision', placeholder: 'Ej: mejorar la calidad de vida de los afiliados con servicios accesibles y utiles', rows: 3 },
      { key: 'differentiators', label: 'Diferenciadores clave', placeholder: 'Ej: subsidios, cobertura regional, atencion integral, trayectoria', rows: 3 },
      { key: 'tone', label: 'Como debe presentarse la marca', placeholder: 'Ej: cercana, clara, institucional y orientada a resolver', rows: 2 },
    ],
  },
  {
    id: 'shipping',
    label: 'Politica de envios',
    icon: Truck,
    title: 'Politica de envios',
    hint: 'Cobertura, tiempos, costo y condiciones de entrega.',
    category: 'Politicas comerciales',
    purpose: 'policy',
    tags: ['shipping', 'policy'],
    fields: [
      { key: 'coverage', label: 'Cobertura', placeholder: 'Ej: enviamos a todo Colombia, excepto zonas apartadas' },
      { key: 'times', label: 'Tiempos estimados', placeholder: 'Ej: Bogota 1-2 dias, nacional 3-5 dias' },
      { key: 'costs', label: 'Costo o regla de cobro', placeholder: 'Ej: gratis desde 200k, de lo contrario se calcula segun ciudad' },
      { key: 'conditions', label: 'Condiciones importantes', placeholder: 'Ej: no prometer entrega exacta sin validar ciudad y operador', rows: 3 },
    ],
  },
  {
    id: 'payments',
    label: 'Politica de pago',
    icon: CreditCard,
    title: 'Politica de pago y confirmacion',
    hint: 'Explica como confirmar pagos, restricciones y excepciones. Los metodos activos se configuran en Organizacion.',
    category: 'Politicas comerciales',
    purpose: 'policy',
    tags: ['payments', 'policy'],
    fields: [
      { key: 'confirmation', label: 'Como se confirma', placeholder: 'Ej: enviar comprobante por WhatsApp y validar con el asesor' },
      { key: 'timing', label: 'Cuando se da por confirmado', placeholder: 'Ej: solo cuando el asesor valida el soporte o el efectivo se recibe' },
      { key: 'limits', label: 'Restricciones o excepciones', placeholder: 'Ej: no aceptamos pagos parciales ni apartados sin abono validado', rows: 3 },
    ],
  },
  {
    id: 'returns',
    label: 'Cambios y devoluciones',
    icon: PackageCheck,
    title: 'Politica de cambios y devoluciones',
    hint: 'Plazos, requisitos del producto y canal de gestion.',
    category: 'Politicas comerciales',
    purpose: 'policy',
    tags: ['returns', 'policy'],
    fields: [
      { key: 'window', label: 'Plazo', placeholder: 'Ej: cambios dentro de 15 dias calendario' },
      { key: 'requirements', label: 'Requisitos', placeholder: 'Ej: prenda sin uso, con etiquetas y factura', rows: 3 },
      { key: 'channel', label: 'Como se solicita', placeholder: 'Ej: escribir al chat con numero de pedido y fotos del producto' },
    ],
  },
  {
    id: 'discounts',
    label: 'Promos y descuentos',
    icon: ReceiptText,
    title: 'Politica de promociones y descuentos',
    hint: 'Que puede ofrecer el agente y que nunca debe prometer.',
    category: 'Politicas comerciales',
    purpose: 'policy',
    tags: ['discounts', 'policy'],
    fields: [
      { key: 'active', label: 'Promos vigentes', placeholder: 'Ej: 10% en combos o envio gratis desde 200k' },
      { key: 'rules', label: 'Reglas para ofrecerlas', placeholder: 'Ej: solo si estan activas y visibles en el sistema', rows: 3 },
      { key: 'forbidden', label: 'Lo que no se puede prometer', placeholder: 'Ej: descuentos manuales, bonos no vigentes, regalos no aprobados', rows: 3 },
    ],
  },
  {
    id: 'restrictions',
    label: 'Claims y promesas prohibidas',
    icon: ShieldAlert,
    title: 'Claims y promesas prohibidas',
    hint: 'Lo que la IA no debe afirmar ni ofrecer.',
    category: 'Guardrails comerciales',
    purpose: 'policy',
    tags: ['guardrails', 'policy'],
    fields: [
      { key: 'claims', label: 'Claims prohibidos', placeholder: 'Ej: garantizado para todos, envio asegurado en 2 horas', rows: 3 },
      { key: 'promises', label: 'Promesas prohibidas', placeholder: 'Ej: apartar stock sin pago, prometer entrega hoy sin validar', rows: 3 },
      { key: 'handoff', label: 'Cuando debe escalar', placeholder: 'Ej: negociaciones especiales, volumen alto, quejas legales', rows: 3 },
    ],
  },
];

function buildTemplateContent(template: PolicyTemplate, values: Record<string, string>) {
  return template.fields
    .map((field) => {
      const value = (values[field.key] || '').trim();
      return value ? `${field.label}: ${value}` : null;
    })
    .filter(Boolean)
    .join('\n');
}

export function AddKnowledgeModal({
  open,
  loading,
  onClose,
  onCreateText,
  onCreateLink,
  onUploadFile,
}: AddKnowledgeModalProps) {
  const [mode, setMode] = useState<AddMode>('texto');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [templateId, setTemplateId] = useState<PolicyTemplateId>('brand_context');
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const activeTemplate = useMemo(
    () => POLICY_TEMPLATES.find((item) => item.id === templateId) || POLICY_TEMPLATES[0],
    [templateId],
  );

  if (!open) return null;

  function resetForm() {
    setTitle('');
    setContent('');
    setUrl('');
    setTemplateValues({});
    setMode('texto');
    setTemplateId('brand_context');
  }

  async function handleSubmit() {
    if (mode === 'archivo') {
      fileRef.current?.click();
      return;
    }
    if (mode === 'link') {
      await onCreateLink({ url });
      resetForm();
      onClose();
      return;
    }
    if (mode === 'template') {
      await onCreateText({
        title: activeTemplate.title,
        content: buildTemplateContent(activeTemplate, templateValues),
        category: activeTemplate.category,
        purpose: activeTemplate.purpose,
        tags: activeTemplate.tags,
      });
      resetForm();
      onClose();
      return;
    }
    await onCreateText({ title, content });
    resetForm();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(17,17,16,0.35)', backdropFilter: 'blur(6px)' }}>
      <Card className="w-full sm:max-w-3xl p-4 sm:p-5 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-500">Nueva fuente</p>
            <h2 className="mt-2 text-[18px] font-bold text-ink-900" style={{ letterSpacing: '-0.01em' }}>Agrega conocimiento a la marca</h2>
            <p className="mt-1 text-[13px] text-ink-400">Carga una fuente libre o usa una plantilla guiada para dejar claro el contexto de marca y las politicas que deben usar los agentes.</p>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="rounded-full p-2 text-ink-400 transition hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-700"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([
            { key: 'template', label: 'Usar template', icon: SparkTileIcon },
            { key: 'texto', label: 'Pegar texto', icon: FileText },
            { key: 'link', label: 'Pegar link', icon: Link2 },
            { key: 'archivo', label: 'Subir archivo', icon: Paperclip },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-150 ${
                mode === item.key
                  ? 'bg-brand-500 text-white shadow-card'
                  : 'bg-[rgba(17,17,16,0.05)] text-ink-600 hover:bg-[rgba(17,17,16,0.08)]'
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {mode === 'link' ? (
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Link</label>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://tu-sitio.com/politicas"
                className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
              />
            </div>
          ) : mode === 'archivo' ? (
            <div className="rounded-2xl border border-dashed border-[rgba(17,17,16,0.12)] bg-[rgba(17,17,16,0.02)] p-6 text-center">
              <p className="text-[13px] font-semibold text-ink-800">Sube un archivo util</p>
              <p className="mt-1 text-[12px] text-ink-400">PDF, DOCX o TXT. Lo usaremos como fuente para responder mejor.</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onUploadFile(file).then(() => {
                      resetForm();
                      onClose();
                    });
                  }
                  event.target.value = '';
                }}
              />
            </div>
          ) : mode === 'template' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.02)] p-3">
                <p className="text-[11px] font-semibold text-ink-800">Templates guiados</p>
                <p className="mt-1 text-[12px] text-ink-500">Define aqui el contexto compartido de marca y las politicas operativas para que los agentes lo usen directamente desde Knowledge Base.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {POLICY_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  const isActive = template.id === activeTemplate.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setTemplateId(template.id)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        isActive
                          ? 'border-brand-300 bg-brand-50/70'
                          : 'border-[rgba(17,17,16,0.08)] bg-white/80 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive ? 'bg-brand-500 text-white' : 'bg-[rgba(17,17,16,0.06)] text-ink-600'}`}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-ink-900">{template.label}</p>
                          <p className="text-[11px] text-ink-500">{template.hint}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 p-4">
                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Template activo</p>
                  <p className="mt-1 text-[15px] font-bold text-ink-900">{activeTemplate.title}</p>
                  <p className="mt-1 text-[12px] text-ink-500">{activeTemplate.hint}</p>
                </div>
                <div className="grid gap-3">
                  {activeTemplate.fields.map((field) => (
                    <div key={field.key}>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">{field.label}</label>
                      <textarea
                        value={templateValues[field.key] || ''}
                        onChange={(event) => setTemplateValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                        rows={field.rows || 2}
                        placeholder={field.placeholder}
                        className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white px-4 py-3 text-[13px] leading-relaxed text-ink-800 outline-none transition focus:border-brand-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Titulo opcional</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ej: Politica de envios"
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Informacion</label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={10}
                  placeholder="Pega aqui lo que tu asistente deberia saber para responder mejor"
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] leading-relaxed text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => { resetForm(); onClose(); }}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : null}
            {mode === 'archivo' ? 'Elegir archivo' : mode === 'template' ? 'Guardar template' : 'Guardar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SparkTileIcon({ size = 13 }: { size?: number }) {
  return <FileText size={size} />;
}
