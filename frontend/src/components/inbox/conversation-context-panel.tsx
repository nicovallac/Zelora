import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText, Bot, Clock3, Loader2, PackageSearch, Phone, Sparkles, UserRound, WandSparkles } from 'lucide-react';
import { Card, SentimentBadge } from '../ui/primitives';
import { ConversationStatusBadge, INBOX_STATUS_LABELS } from './conversation-status-badge';
import type { InboxCommercialStatus, InboxConversationDetail, InboxKnowledgeSuggestion, InboxRelatedProduct } from './types';

const COMMERCIAL_STATUS_OPTIONS: InboxCommercialStatus[] = [
  'nuevo',
  'en_conversacion',
  'interesado',
  'esperando_respuesta',
  'escalado',
  'cerrado',
  'venta_lograda',
  'perdido',
];

function isMeaningfulValue(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return !['', 'unknown', 'sin clasificar', 'no definido', 'motivo'].includes(normalized);
}

export function ConversationContextPanel({
  conversation,
  relatedProducts,
  relatedKnowledge,
  aiSummary,
  aiSummaryLoading,
  copilotSuggestions,
  copilotLoading,
  onStatusChange,
  onToggleFollowUp,
  onShareProduct,
  onCreateOrder,
  onEditNextStep,
  onEditSummary,
  onGenerateSummary,
  onUseSummary,
  onGenerateCopilot,
  onUseCopilotSuggestion,
  onSaveContact,
  savingContact,
}: {
  conversation: InboxConversationDetail | null;
  relatedProducts: InboxRelatedProduct[];
  relatedKnowledge: InboxKnowledgeSuggestion[];
  aiSummary: string;
  aiSummaryLoading: boolean;
  copilotSuggestions: string[];
  copilotLoading: boolean;
  onStatusChange: (status: InboxCommercialStatus) => void;
  onToggleFollowUp: () => void;
  onShareProduct: (productId: string) => void;
  onCreateOrder: (productId: string) => void;
  onEditNextStep: () => void;
  onEditSummary: () => void;
  onGenerateSummary: () => void;
  onUseSummary: () => void;
  onGenerateCopilot: () => void;
  onUseCopilotSuggestion: (suggestion: string) => void;
  onSaveContact: (payload: { nombre: string; telefono: string; email: string }) => void;
  savingContact: boolean;
}) {
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ nombre: '', telefono: '', email: '' });

  const missingContactData = useMemo(() => {
    if (!conversation) return false;
    return conversation.contactName === 'Cliente sin nombre' || !conversation.contactPhone || !conversation.contactEmail;
  }, [conversation]);

  useEffect(() => {
    if (!conversation) return;
    setContactForm({
      nombre: conversation.contactName === 'Cliente sin nombre' ? '' : conversation.contactName,
      telefono: conversation.contactPhone || '',
      email: conversation.contactEmail || '',
    });
    setEditingContact(missingContactData);
  }, [conversation, missingContactData]);

  const cleanIntent = useMemo(
    () => (isMeaningfulValue(conversation?.intent) ? conversation?.intent?.trim() || '' : ''),
    [conversation?.intent],
  );
  const cleanSummary = useMemo(
    () => (isMeaningfulValue(conversation?.summary) ? conversation?.summary?.trim() || '' : ''),
    [conversation?.summary],
  );
  const cleanNextStep = useMemo(
    () => (isMeaningfulValue(conversation?.nextStep) ? conversation?.nextStep?.trim() || '' : ''),
    [conversation?.nextStep],
  );
  const cleanEscalationReason = useMemo(
    () => (isMeaningfulValue(conversation?.escalationReason) ? conversation?.escalationReason?.trim() || '' : ''),
    [conversation?.escalationReason],
  );
  const qualificationStatus = conversation?.qualification?.['affiliate_status'];
  const qualificationCategory = conversation?.qualification?.['affiliate_category'];

  if (!conversation) {
    return (
      <Card className="border-dashed p-5 text-center">
        <p className="text-sm font-semibold text-ink-900">Sin contexto seleccionado</p>
        <p className="mt-1 text-sm text-ink-500">Cuando abras una conversacion, aqui veras datos comerciales y acciones utiles.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-bold text-ink-900">{conversation.contactName}</p>
          </div>
          <SentimentBadge sentiment={conversation.sentiment} />
        </div>
        <div className="mt-2.5 grid gap-1.5 text-[12px] text-ink-600">
          <p className="flex items-center gap-1.5"><Phone size={13} className="text-ink-400" /> {conversation.contactPhone || 'Sin telefono'}</p>
          <p className="truncate text-[12px] text-ink-600">{conversation.contactEmail || 'Sin email'}</p>
          <p className="flex items-center gap-1.5">
            {conversation.owner === 'ia' ? <Bot size={13} className="text-brand-500" /> : <UserRound size={13} className="text-emerald-600" />}
            Responsable actual: {conversation.owner === 'ia' ? 'IA' : conversation.assignedAgent || 'Humano'}
          </p>
          <p className="flex items-center gap-1.5"><Clock3 size={13} className="text-ink-400" /> Ultimo movimiento: {new Date(conversation.lastMessageAt).toLocaleString('es-CO')}</p>
        </div>
        <div className="mt-2.5 border-t border-[rgba(17,17,16,0.06)] pt-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Contacto</p>
            <button
              onClick={() => setEditingContact((current) => !current)}
              className="text-xs font-semibold text-brand-500 transition hover:text-brand-600"
            >
              {editingContact ? 'Cancelar' : 'Editar'}
            </button>
          </div>
          {editingContact ? (
            <div className="mt-2.5 space-y-2">
              <input
                value={contactForm.nombre}
                onChange={(event) => setContactForm((current) => ({ ...current, nombre: event.target.value }))}
                placeholder="Nombre del cliente"
                className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-700 placeholder:text-ink-300 outline-none focus:border-[rgba(17,17,16,0.20)]"
              />
              <input
                value={contactForm.telefono}
                onChange={(event) => setContactForm((current) => ({ ...current, telefono: event.target.value }))}
                placeholder="Telefono"
                className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-700 placeholder:text-ink-300 outline-none focus:border-[rgba(17,17,16,0.20)]"
              />
              <input
                value={contactForm.email}
                onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email"
                className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-700 placeholder:text-ink-300 outline-none focus:border-[rgba(17,17,16,0.20)]"
              />
              <button
                onClick={() => onSaveContact(contactForm)}
                disabled={savingContact}
                className="w-full rounded-full border border-brand-200 bg-brand-50 px-3 py-2 text-[12px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingContact ? 'Guardando...' : 'Guardar contacto'}
              </button>
            </div>
          ) : missingContactData ? (
            <p className="mt-3 text-xs text-amber-700">Faltan datos del cliente. Puedes completarlos aqui y se guardaran en el contacto.</p>
          ) : null}
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <WandSparkles size={14} className="text-brand-500" />
          <div>
            <p className="text-[13px] font-bold text-ink-900">Asistencia AI</p>
            <p className="text-[11px] text-ink-500">Resumen y respuestas sugeridas para avanzar la conversacion.</p>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <div className="rounded-2xl border border-[rgba(17,17,16,0.07)] bg-[rgba(255,255,255,0.55)] p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Resumen AI</p>
              <button onClick={onGenerateSummary} className="text-[11px] font-semibold text-brand-500 transition hover:text-brand-600">
                {aiSummaryLoading ? 'Generando...' : aiSummary ? 'Regenerar' : 'Generar'}
              </button>
            </div>
            <div className="mt-2 min-h-[72px] rounded-2xl bg-white/80 px-3 py-2.5 text-[12px] leading-5 text-ink-700">
              {aiSummaryLoading ? (
                <div className="flex items-center gap-2 text-ink-500">
                  <Loader2 size={13} className="animate-spin" />
                  Preparando resumen...
                </div>
              ) : aiSummary ? (
                aiSummary
              ) : (
                <span className="text-ink-400">Genera un resumen corto y accionable de la conversacion.</span>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={onUseSummary}
                disabled={!aiSummary}
                className="rounded-full border border-brand-200 bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Usar como resumen
              </button>
              <button
                onClick={onEditSummary}
                className="rounded-full border border-[rgba(17,17,16,0.12)] bg-white/80 px-3 py-2 text-[11px] font-semibold text-ink-700 transition hover:bg-white"
              >
                Editar manual
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(17,17,16,0.07)] bg-[rgba(255,255,255,0.55)] p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Copilot</p>
              <button onClick={onGenerateCopilot} className="text-[11px] font-semibold text-brand-500 transition hover:text-brand-600">
                {copilotLoading ? 'Pensando...' : copilotSuggestions.length > 0 ? 'Regenerar' : 'Sugerir'}
              </button>
            </div>
            {copilotLoading ? (
              <div className="mt-2 flex min-h-[72px] items-center gap-2 rounded-2xl bg-white/80 px-3 py-2.5 text-[12px] text-ink-500">
                <Loader2 size={13} className="animate-spin" />
                Armando respuestas sugeridas...
              </div>
            ) : copilotSuggestions.length === 0 ? (
              <div className="mt-2 min-h-[72px] rounded-2xl bg-white/80 px-3 py-2.5 text-[12px] text-ink-400">
                Genera 2 o 3 respuestas cortas listas para ajustar y enviar.
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {copilotSuggestions.map((suggestion, index) => (
                  <button
                    key={`${index}-${suggestion.slice(0, 24)}`}
                    onClick={() => onUseCopilotSuggestion(suggestion)}
                    className="w-full rounded-2xl border border-[rgba(17,17,16,0.08)] bg-white/85 px-3 py-2.5 text-left text-[12px] leading-5 text-ink-700 transition hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Estado comercial</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <ConversationStatusBadge status={conversation.commercialStatus} />
          {conversation.followUp ? (
            <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Seguimiento activo</span>
          ) : null}
          {conversation.opportunity ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100/80 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              <Sparkles size={10} />
              Oportunidad detectada
            </span>
          ) : null}
        </div>
        <div className="mt-2.5">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Cambiar estado</label>
          <select
            value={conversation.commercialStatus}
            onChange={(event) => onStatusChange(event.target.value as InboxCommercialStatus)}
            className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] outline-none focus:border-[rgba(17,17,16,0.20)]"
          >
            {COMMERCIAL_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {INBOX_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onToggleFollowUp}
          className="mt-2.5 w-full rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] px-3 py-2 text-[12px] font-semibold text-ink-700 transition hover:bg-white"
        >
          {conversation.followUp ? 'Quitar seguimiento' : 'Marcar seguimiento'}
        </button>
      </Card>

      <Card className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Operacion</p>
        <div className="mt-2.5 space-y-1.5 text-[12px] text-ink-600">
          {cleanIntent ? <p><span className="font-semibold text-ink-900">Intencion:</span> {cleanIntent}</p> : null}
          <p><span className="font-semibold text-ink-900">Canal:</span> {conversation.channelLabel}</p>
          <p><span className="font-semibold text-ink-900">Historial:</span> {conversation.messages.length} mensajes y {conversation.timeline.length} eventos</p>
          {conversation.activeFlow ? (
            <p><span className="font-semibold text-ink-900">Flujo activo:</span> {conversation.activeFlow.label} · {conversation.activeFlow.step.replaceAll('_', ' ')}</p>
          ) : null}
          {conversation.salesStage ? (
            <p><span className="font-semibold text-ink-900">Etapa de venta:</span> {conversation.salesStage.replaceAll('_', ' ')}</p>
          ) : null}
          {conversation.closeSignals && conversation.closeSignals.length > 0 ? (
            <div>
              <p><span className="font-semibold text-ink-900">Senales de cierre:</span></p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {conversation.closeSignals.map((signal) => (
                  <span key={signal} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {signal.replaceAll('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {qualificationStatus ? (
            <p>
              <span className="font-semibold text-ink-900">Calificacion:</span>{' '}
              {String(qualificationStatus)}
              {qualificationCategory ? ` · categoria ${String(qualificationCategory)}` : ''}
            </p>
          ) : null}
          {cleanSummary ? <p><span className="font-semibold text-ink-900">Resumen guardado:</span> {cleanSummary}</p> : null}
          {cleanNextStep ? <p><span className="font-semibold text-ink-900">Siguiente paso:</span> {cleanNextStep}</p> : null}
          {cleanEscalationReason ? <p><span className="font-semibold text-ink-900">Motivo de escalado:</span> {cleanEscalationReason}</p> : null}
        </div>
        {conversation.activeFlow?.data && Object.keys(conversation.activeFlow.data).length > 0 ? (
          <div className="mt-2.5 rounded-2xl border border-[rgba(17,17,16,0.07)] bg-[rgba(255,255,255,0.55)] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Datos capturados</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(conversation.activeFlow.data)
                .filter(([, value]) => value !== null && value !== '' && typeof value !== 'object')
                .map(([key, value]) => (
                  <span key={key} className="rounded-full bg-[rgba(17,17,16,0.06)] px-2 py-0.5 text-[10px] font-medium text-ink-700">
                    {key.replaceAll('_', ' ')}: {String(value)}
                  </span>
                ))}
            </div>
          </div>
        ) : null}
        <div className="mt-2.5 grid gap-2">
          <button
            onClick={onEditNextStep}
            className="rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] px-3 py-2 text-[12px] font-semibold text-ink-700 transition hover:bg-white"
          >
            Definir siguiente paso
          </button>
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <PackageSearch size={14} className="text-brand-500" />
          <p className="text-[13px] font-bold text-ink-900">Productos consultados</p>
        </div>
        {relatedProducts.length === 0 ? (
          <p className="mt-2.5 text-[12px] text-ink-500">Todavia no detectamos productos claros en esta conversacion.</p>
        ) : (
          <div className="mt-2.5 space-y-2">
            {relatedProducts.map((product) => (
              <div key={product.id} className="rounded-2xl border border-[rgba(17,17,16,0.07)] bg-[rgba(255,255,255,0.50)] p-2.5">
                <p className="text-[12px] font-semibold text-ink-900">{product.title}</p>
                <p className="mt-0.5 text-[11px] text-ink-500">{product.category}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-ink-500">
                    <p>{product.priceLabel}</p>
                    <p>{product.availabilityLabel}</p>
                    {product.promotionLabel ? <p>{product.promotionLabel}</p> : null}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => onShareProduct(product.id)}
                      className="rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white"
                    >
                      Compartir
                    </button>
                    <button
                      onClick={() => onCreateOrder(product.id)}
                      className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-100"
                    >
                      Crear pedido
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <BookOpenText size={14} className="text-brand-500" />
          <p className="text-[13px] font-bold text-ink-900">Knowledge sugerida</p>
        </div>
        {relatedKnowledge.length === 0 ? (
          <p className="mt-2.5 text-[12px] text-ink-500">Aun no detectamos contenido claramente util para esta conversacion.</p>
        ) : (
          <div className="mt-2.5 space-y-2">
            {relatedKnowledge.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[rgba(17,17,16,0.07)] bg-[rgba(255,255,255,0.50)] p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold text-ink-900">{item.title}</p>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                    {item.kind === 'article' ? 'articulo' : item.statusLabel || 'documento'}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-ink-600">{item.excerpt}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-3">
        <p className="text-[13px] font-bold text-ink-900">Acciones rapidas</p>
        <div className="mt-2.5 grid gap-2">
          <Link to="/knowledge-base" className="inline-flex items-center justify-between rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] px-3 py-2 text-[12px] font-semibold text-ink-700 transition hover:bg-white">
            Ver historial y contenido
            <ArrowRight size={14} />
          </Link>
          <Link to="/integrations" className="inline-flex items-center justify-between rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] px-3 py-2 text-[12px] font-semibold text-ink-700 transition hover:bg-white">
            Revisar canales
            <ArrowRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  );
}
