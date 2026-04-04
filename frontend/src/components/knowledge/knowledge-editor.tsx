import { Loader2, PencilLine, Save, Trash2 } from 'lucide-react';
import { Button, Card } from '../ui/primitives';
import type { KnowledgeListItem } from './types';
import type { KBArticlePurpose } from '../../services/api';

const PURPOSE_OPTIONS: { value: KBArticlePurpose; label: string; hint: string; color: string }[] = [
  { value: 'faq',             label: 'FAQ',              hint: 'Preguntas frecuentes generales',           color: 'bg-sky-50 text-sky-700 border-sky-200/70' },
  { value: 'objection',       label: 'Objeción',         hint: 'Cómo responder cuando el cliente duda',   color: 'bg-amber-50 text-amber-700 border-amber-200/70' },
  { value: 'closing',         label: 'Cierre',           hint: 'Frases y técnicas para cerrar ventas',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
  { value: 'brand_voice',     label: 'Voz de marca',     hint: 'Ejemplos de respuestas on-brand',         color: 'bg-violet-50 text-violet-700 border-violet-200/70' },
  { value: 'policy',          label: 'Política',         hint: 'Reglas de envío, pagos, devoluciones',    color: 'bg-rose-50 text-rose-700 border-rose-200/70' },
  { value: 'product_context', label: 'Producto',         hint: 'Información profunda del catálogo',       color: 'bg-orange-50 text-orange-700 border-orange-200/70' },
];

function PurposeSelector({
  value,
  onChange,
}: {
  value: KBArticlePurpose;
  onChange: (v: KBArticlePurpose) => void;
}) {
  const current = PURPOSE_OPTIONS.find((o) => o.value === value) || PURPOSE_OPTIONS[0];
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
        Propósito — cómo lo usa el agente
      </label>
      <div className="flex flex-wrap gap-1.5">
        {PURPOSE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={opt.hint}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
              value === opt.value
                ? opt.color + ' shadow-sm'
                : 'border-[rgba(17,17,16,0.10)] bg-white/60 text-ink-500 hover:bg-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-400">{current.hint}</p>
    </div>
  );
}

export function KnowledgeEditor({
  item,
  draftTitle,
  draftContent,
  draftPurpose,
  saving,
  onTitleChange,
  onContentChange,
  onPurposeChange,
  onSave,
  onDelete,
}: {
  item: KnowledgeListItem | null;
  draftTitle: string;
  draftContent: string;
  draftPurpose: KBArticlePurpose;
  saving: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onPurposeChange: (value: KBArticlePurpose) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  if (!item) {
    return (
      <Card className="flex h-full min-h-0 items-center justify-center border-dashed p-6 text-center">
        <div>
          <p className="text-[15px] font-bold text-ink-900">Selecciona informacion</p>
          <p className="mt-2 text-[13px] text-ink-400">Aqui podras ver, editar o borrar el contenido que usa tu asistente.</p>
        </div>
      </Card>
    );
  }

  if (item.kind === 'archivo') {
    const statusCopy =
      item.processingStatus === 'ready'
        ? 'El documento ya fue procesado y el asistente puede usarlo.'
        : item.processingStatus === 'failed'
          ? 'No pudimos procesar este archivo. Conviene volver a subirlo.'
          : 'Estamos procesando este documento para convertirlo en contexto util.';

    return (
      <Card className="flex h-full min-h-0 flex-col overflow-hidden p-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">Archivo</p>
        <h2 className="mt-2 text-[16px] font-bold text-ink-900">{item.title}</h2>
        <p className="mt-2 text-[12px] text-ink-400">{item.preview}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onDelete}>
            <Trash2 size={13} />
            Eliminar
          </Button>
        </div>
        <div className="mt-4 rounded-2xl border border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.025)] p-3 text-[12px] text-ink-500">{statusCopy}</div>
        {item.content ? (
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[rgba(17,17,16,0.07)] bg-white/50 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">Texto detectado</p>
            <p className="mt-2 whitespace-pre-wrap text-[12px] leading-6 text-ink-500">{item.content.slice(0, 1500)}</p>
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              {item.kind === 'link' ? 'Link guardado' : 'Entrada manual'}
            </p>
            <h2 className="mt-2 text-[15px] font-bold text-ink-900">Editar informacion</h2>
            <p className="mt-1 text-[12px] text-ink-400">Haz cambios rapidos para que el asistente responda mejor sin salirte a un CMS.</p>
          </div>
          <PencilLine size={16} className="text-brand-500" />
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Titulo</label>
            <input
              value={draftTitle}
              onChange={(event) => onTitleChange(event.target.value)}
              className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
              placeholder="Ponle un nombre corto y claro"
            />
          </div>

          <PurposeSelector value={draftPurpose} onChange={onPurposeChange} />

          <div className="min-h-0 flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Contenido</label>
            <textarea
              value={draftContent}
              onChange={(event) => onContentChange(event.target.value)}
              rows={12}
              className="h-full min-h-[200px] w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] leading-relaxed text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
              placeholder="Pega aqui informacion util para responder mejor"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Guardar cambios
          </Button>
          <Button variant="secondary" onClick={onDelete}>
            <Trash2 size={13} />
            Eliminar
          </Button>
        </div>
      </Card>

      <Card className="p-3">
        <p className="text-[13px] font-bold text-ink-900">Preparado para Inbox</p>
        <p className="mt-1 text-[12px] text-ink-400">
          Esta entrada queda lista para usarse desde conversaciones, mejorar respuestas y sugerir contexto automaticamente.
        </p>
      </Card>
    </div>
  );
}
