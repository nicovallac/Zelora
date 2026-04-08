import { AlertTriangle, Loader2, PencilLine, Save, Trash2 } from 'lucide-react';
import { Button, Card } from '../ui/primitives';
import { DocumentAnalysisPanel } from './document-analysis-panel';
import { FaqEditor, BusinessEditor, SalesScriptsEditor, PolicyEditor } from './structured-editors';
import type { KnowledgeListItem } from './types';
import type { KBArticlePurpose } from '../../services/api';

const PURPOSE_OPTIONS: { value: KBArticlePurpose; label: string; hint: string; description: string; color: string }[] = [
  {
    value: 'faq',
    label: 'Preguntas frecuentes',
    hint: 'Lo que siempre preguntan — el agente lo usa en toda conversación',
    description: 'Preguntas y respuestas que el agente usa en cualquier etapa. Ideal para dudas recurrentes sobre el producto, proceso de compra o uso del servicio.',
    color: 'bg-sky-50 text-sky-700 border-sky-200/70',
  },
  {
    value: 'business',
    label: 'Pitch',
    hint: 'Quiénes somos, qué vendemos, por qué elegirnos — activa cuando el cliente explora o compara opciones',
    description: 'Todo lo que define al negocio: qué ofreces, para quién, diferenciadores y propuesta de valor. El agente lo usa cuando el cliente está explorando o comparando opciones.',
    color: 'bg-violet-50 text-violet-700 border-violet-200/70',
  },
  {
    value: 'sales_scripts',
    label: 'Objeciones y cierre',
    hint: 'Qué decir cuando el cliente frena, duda o está listo para comprar',
    description: 'Scripts para manejar objeciones ("está caro", "lo pienso") y frases de cierre. El agente los activa cuando detecta duda o intención de compra.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  },
  {
    value: 'policy',
    label: 'Políticas',
    hint: 'Devoluciones, envíos, garantías, formas de pago — activa cuando preguntan por condiciones',
    description: 'Condiciones del negocio: devoluciones, envíos, garantías, formas de pago. El agente las usa cuando el cliente pregunta por términos antes o después de comprar.',
    color: 'bg-rose-50 text-rose-700 border-rose-200/70',
  },
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
      <p className="mt-2 text-[12px] leading-relaxed text-ink-400">{current.description}</p>
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
  onItemAdded,
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
  onItemAdded?: () => void;
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
    const isReady = item.processingStatus === 'ready';
    const isFailed = item.processingStatus === 'failed';
    const statusColor = isReady
      ? 'border-emerald-200/60 bg-emerald-50/50 text-emerald-700'
      : isFailed
        ? 'border-red-200/60 bg-red-50/50 text-red-600'
        : 'border-[rgba(17,17,16,0.07)] bg-[rgba(17,17,16,0.025)] text-ink-500';
    const statusCopy = isReady
      ? 'Procesado — el agente ya puede usar este documento.'
      : isFailed
        ? 'Error al procesar. Conviene eliminar y volver a subir el archivo.'
        : 'Procesando el documento, espera un momento...';

    return (
      <Card className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">Documento subido</p>
            <h2 className="mt-1.5 text-[15px] font-bold text-ink-900 leading-tight">{item.title}</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={onDelete}>
            <Trash2 size={12} />
            Eliminar
          </Button>
        </div>

        {/* Status pill */}
        <div className={`mt-3 rounded-xl border px-3 py-2 text-[12px] font-medium ${statusColor}`}>
          {statusCopy}
        </div>

        {/* Analysis panel — only when ready */}
        {item.rawDocument && (
          <DocumentAnalysisPanel
            documentId={item.rawDocument.id}
            documentName={item.title}
            documentText={item.content || ''}
            processingStatus={item.processingStatus || 'pending'}
            onItemAdded={onItemAdded}
          />
        )}

        {/* Raw text — collapsed at bottom */}
        {item.content && (
          <div className="mt-4 rounded-2xl border border-[rgba(17,17,16,0.07)] bg-white/50 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400">Texto extraído</p>
            <p className="mt-2 whitespace-pre-wrap text-[11.5px] leading-6 text-ink-400">{item.content.slice(0, 1200)}</p>
          </div>
        )}
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

        {item.rawArticle?.redirect_warning && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-[11.5px] leading-relaxed text-amber-800">{item.rawArticle.redirect_warning}</p>
          </div>
        )}

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

          <div className="min-h-0 flex-1 overflow-y-auto">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Contenido</label>
            {draftPurpose === 'faq' ? (
              <FaqEditor key={item.id + '-faq'} value={draftContent} onChange={onContentChange} />
            ) : draftPurpose === 'business' ? (
              <BusinessEditor key={item.id + '-business'} value={draftContent} onChange={onContentChange} />
            ) : draftPurpose === 'sales_scripts' ? (
              <SalesScriptsEditor key={item.id + '-sales'} value={draftContent} onChange={onContentChange} />
            ) : draftPurpose === 'policy' ? (
              <PolicyEditor key={item.id + '-policy'} value={draftContent} onChange={onContentChange} />
            ) : (
              <textarea
                value={draftContent}
                onChange={(event) => onContentChange(event.target.value)}
                rows={12}
                className="h-full min-h-[200px] w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] leading-relaxed text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
                placeholder="Pega aqui informacion util para responder mejor"
              />
            )}
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

    </div>
  );
}
