import { Clock3, Sparkles, UserRound } from 'lucide-react';
import { ChannelBadge } from '../ui/primitives';
import { ConversationStatusBadge } from './conversation-status-badge';
import type { InboxConversationSummary } from './types';

function relativeTime(timestamp: string) {
  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)} h`;
  return `${Math.round(diffMinutes / 1440)} d`;
}


export function InboxConversationItem({
  conversation,
  active,
  onSelect,
}: {
  conversation: InboxConversationSummary;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-2xl border p-2.5 text-left transition ${
        active
          ? 'border-brand-300 bg-brand-50 shadow-card'
          : conversation.unread
            ? 'border-brand-200 bg-brand-50/70 hover:border-brand-300 hover:bg-brand-50'
            : 'border-[rgba(17,17,16,0.08)] bg-white/70 hover:border-[rgba(17,17,16,0.12)] hover:bg-white/90'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(17,17,16,0.04)] text-xs font-bold text-ink-700">
          {conversation.contactInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`truncate text-[13px] ${conversation.unread ? 'font-bold text-ink-900' : 'font-semibold text-ink-900'}`}>{conversation.contactName}</p>
                {conversation.unread ? <span className="h-2 w-2 rounded-full bg-brand-500" /> : null}
              </div>
            </div>
            <span className="text-[10px] font-medium text-ink-400">{relativeTime(conversation.lastMessageAt)}</span>
          </div>

          <p className={`mt-1.5 line-clamp-2 text-[12px] leading-snug ${conversation.unread ? 'font-medium text-ink-700' : 'text-ink-600'}`}>{conversation.lastMessage || 'Sin mensajes aun'}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <ChannelBadge channel={conversation.channel} />
            {!['nuevo', 'en_proceso', 'en_conversacion'].includes(conversation.commercialStatus) ? (
              <ConversationStatusBadge status={conversation.commercialStatus} />
            ) : null}
            {conversation.priority === 'alta' ? (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Urgente</span>
            ) : null}
            {conversation.owner === 'humano' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <UserRound size={10} />
                Humano
              </span>
            ) : null}
            {conversation.sentiment === 'negativo' ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">Insatisfecho</span>
            ) : null}
            {['intent_to_buy', 'checkout_blocked'].includes(conversation.salesStage ?? '') ? (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                {conversation.salesStage === 'checkout_blocked' ? 'Pago bloqueado' : 'Listo para comprar'}
              </span>
            ) : null}
            {conversation.closeSignals && conversation.closeSignals.length > 0 ? (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                Listo para cierre
              </span>
            ) : null}
            {conversation.opportunity ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                <Sparkles size={10} />
                Oportunidad
              </span>
            ) : null}
            {conversation.followUp ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Clock3 size={11} />
                Seguimiento
              </span>
            ) : null}
            {conversation.activeFlow?.status === 'active' ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                Flujo: {conversation.activeFlow.label}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
