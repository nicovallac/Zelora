import { Bot, Download, Loader2, UserRound, CheckCheck, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, ChannelBadge } from '../ui/primitives';
import { ConversationStatusBadge } from './conversation-status-badge';
import { HandoffControls } from './handoff-controls';
import { ConversationComposer } from './conversation-composer';
import type { InboxConversationDetail } from './types';
import { Button } from '../ui/primitives';

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function activeAgentMeta(agent?: InboxConversationDetail['activeAiAgent']) {
  if (agent === 'sales') {
    return {
      label: 'Sales Agent activo',
      tone: 'bg-violet-100 text-violet-700',
    };
  }
  if (agent === 'general') {
    return {
      label: 'Sales Agent activo',
      tone: 'bg-sky-100 text-sky-700',
    };
  }
  if (agent === 'marketing') {
    return {
      label: 'Marketing Agent activo',
      tone: 'bg-amber-100 text-amber-700',
    };
  }
  if (agent === 'operations') {
    return {
      label: 'Operations Agent activo',
      tone: 'bg-emerald-100 text-emerald-700',
    };
  }
  return null;
}

function roleMeta(role: string) {
  if (role === 'user') {
    return { label: 'Cliente', tone: 'bg-white/80 border border-[rgba(17,17,16,0.08)] text-ink-800', side: 'left' as const };
  }
  if (role === 'agent') {
    return { label: 'Humano', tone: 'bg-emerald-100 text-emerald-900', side: 'right' as const };
  }
  return { label: 'IA', tone: 'bg-brand-500 text-white', side: 'right' as const };
}

function cleanDisplayText(value: string) {
  if (!value || (!value.includes('Ã') && !value.includes('Â'))) return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value.replaceAll('Â', '');
  }
}

function renderRichMessage(content: string, linkClassName: string) {
  const linkPattern = /\[([^\]]+)\]\((\/[^)]+)\)/g;
  const lines = cleanDisplayText(content).split('\n');

  function renderLine(line: string, lineIndex: number) {
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkPattern.exec(line)) !== null) {
      const [fullMatch, label, href] = match;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        nodes.push(<span key={`text-${lineIndex}-${matchIndex}`}>{line.slice(lastIndex, matchIndex)}</span>);
      }

      if (href.includes('?prefill=')) {
        nodes.push(
          <a
            key={`chip-${lineIndex}-${href}-${matchIndex}`}
            href={href}
            className="mx-0.5 inline-flex max-w-full items-center rounded-full border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.05)] px-2.5 py-1 align-middle"
          >
            <span className={linkClassName}>{label}</span>
          </a>
        );
      } else {
        nodes.push(
          <a key={`link-${lineIndex}-${href}-${matchIndex}`} href={href} className={linkClassName}>
            {label}
          </a>
        );
      }

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < line.length) {
      nodes.push(<span key={`tail-${lineIndex}-${lastIndex}`}>{line.slice(lastIndex)}</span>);
    }

    if (nodes.length === 0) {
      nodes.push(<span key={`empty-${lineIndex}`}>{line}</span>);
    }

    linkPattern.lastIndex = 0;
    return nodes;
  }

  return (
    <p className="leading-snug">
      {lines.map((line, index) => (
        <span key={`line-${index}`}>
          {index > 0 ? <br /> : null}
          {renderLine(line, index)}
        </span>
      ))}
    </p>
  );
}

export function ConversationView({
  conversation,
  loading,
  draft,
  sending,
  onDraftChange,
  onSend,
  onAddNote,
  onEscalate,
  onTakeOver,
  onReturnToIA,
  onResolve,
  onReopen,
  onExportJson,
  exportingJson,
}: {
  conversation: InboxConversationDetail | null;
  loading: boolean;
  draft: string;
  sending: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onAddNote: () => void;
  onEscalate: () => void;
  onTakeOver: () => void;
  onReturnToIA: () => void;
  onResolve: () => void;
  onReopen: () => void;
  onExportJson: () => void;
  exportingJson: boolean;
}) {
  const aiAgentMeta = activeAgentMeta(conversation?.activeAiAgent);

  if (!conversation) {
    return (
      <Card className="flex h-full min-h-0 items-center justify-center border-dashed bg-[rgba(17,17,16,0.02)] p-6 text-center">
        <div>
          <p className="text-lg font-bold text-ink-900">Selecciona una conversacion</p>
          <p className="mt-2 text-sm text-ink-500">Aqui veras mensajes, contexto comercial y acciones para responder o vender.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm">
      <div className="shrink-0 border-b border-[rgba(17,17,16,0.08)] px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-ink-900 tracking-tight">{conversation.contactName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <ChannelBadge channel={conversation.channel} />
              <ConversationStatusBadge status={conversation.commercialStatus} />
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${conversation.owner === 'ia' ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {conversation.owner === 'ia' ? 'IA' : 'Humano'}
              </span>
              {conversation.owner === 'ia' && aiAgentMeta ? (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${aiAgentMeta.tone}`}>
                  {aiAgentMeta.label}
                </span>
              ) : null}
              {conversation.activeFlow?.status === 'active' ? (
                <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">
                  {conversation.activeFlow.label}: {conversation.activeFlow.step.replaceAll('_', ' ')}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onExportJson} disabled={exportingJson}>
              {exportingJson ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              JSON
            </Button>
            {conversation.commercialStatus !== 'cerrado' && conversation.commercialStatus !== 'venta_lograda' ? (
              <Button variant="primary" size="sm" onClick={onResolve}>
                <CheckCheck size={14} />
                Resolver
              </Button>
            ) : null}
            <HandoffControls owner={conversation.owner} onEscalate={onEscalate} onTakeOver={onTakeOver} onReturnToIA={onReturnToIA} />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[rgba(17,17,16,0.02)] p-3">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-500">
            <Loader2 size={16} className="animate-spin" />
            Cargando conversacion...
          </div>
        ) : conversation.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm font-semibold text-ink-900">Todavia no hay mensajes cargados</p>
              <p className="mt-1 text-sm text-ink-500">Cuando entren mensajes o escribas una respuesta, apareceran aqui.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {conversation.messages.map((message) => {
              const meta = roleMeta(message.role);
              return (
                <div key={message.id} className={`flex ${meta.side === 'right' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[84%] items-end gap-1.5 ${meta.side === 'right' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl ${message.role === 'user' ? 'bg-[rgba(17,17,16,0.06)] text-ink-600' : message.role === 'agent' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'}`}>
                      {message.role === 'user' ? <UserRound size={13} /> : message.role === 'agent' ? <UserRound size={13} /> : <Bot size={13} />}
                    </div>
                    <div className={`rounded-2xl px-3 py-2.5 text-[13px] shadow-card ${meta.tone}`}>
                      <p className="mb-0.5 text-[10px] font-semibold opacity-80">{meta.label}</p>
                      {renderRichMessage(
                        message.content,
                        message.role === 'bot'
                          ? 'font-semibold underline underline-offset-2 text-white'
                          : 'font-semibold underline underline-offset-2 text-ink-900'
                      )}
                      <p className={`mt-1.5 text-right text-[9px] ${message.role === 'user' ? 'text-ink-400' : message.role === 'agent' ? 'text-emerald-700' : 'text-ink-600'}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {conversation.commercialStatus === 'cerrado' || conversation.commercialStatus === 'venta_lograda' ? (
        <div className="shrink-0 border-t border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.02)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-ink-500">
              Conversacion resuelta. Si el cliente escribe de nuevo se reabrira automaticamente.
            </p>
            <Button variant="secondary" size="sm" onClick={onReopen}>
              <RotateCcw size={13} />
              Reabrir
            </Button>
          </div>
        </div>
      ) : (
        <ConversationComposer
          value={draft}
          sending={sending}
          onChange={onDraftChange}
          onSend={onSend}
          onAddNote={onAddNote}
          placeholder={conversation.owner === 'ia' ? 'Puedes tomar la conversacion o agregar una nota interna...' : 'Escribe una respuesta al cliente'}
        />
      )}
    </div>
  );
}
