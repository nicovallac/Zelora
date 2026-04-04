import { MessageSquarePlus, Send } from 'lucide-react';
import { Button } from '../ui/primitives';

export function ConversationComposer({
  value,
  disabled,
  sending,
  placeholder,
  onChange,
  onSend,
  onAddNote,
}: {
  value: string;
  disabled?: boolean;
  sending?: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAddNote: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-[rgba(17,17,16,0.08)] bg-white/80 p-2.5">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] flex-1 resize-none rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 placeholder:text-ink-300 outline-none transition focus:border-[rgba(17,17,16,0.20)] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button variant="secondary" size="md" onClick={onAddNote}>
          <MessageSquarePlus size={15} />
          Nota
        </Button>
        <Button onClick={onSend} disabled={disabled || sending || !value.trim()}>
          <Send size={15} />
          {sending ? 'Enviando' : 'Enviar'}
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] text-ink-400">
        Responde rapido, comparte contexto util y usa notas internas para no perder seguimiento.
      </p>
    </div>
  );
}
