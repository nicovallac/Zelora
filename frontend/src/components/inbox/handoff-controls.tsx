import { Bot, ArrowUpRight, UserRound } from 'lucide-react';
import { Button } from '../ui/primitives';

export function HandoffControls({
  owner,
  disabled,
  onEscalate,
  onTakeOver,
  onReturnToIA,
}: {
  owner: 'ia' | 'humano';
  disabled?: boolean;
  onEscalate: () => void;
  onTakeOver: () => void;
  onReturnToIA: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {owner === 'ia' ? (
        <>
          <Button variant="secondary" size="sm" onClick={onTakeOver} disabled={disabled}>
            <UserRound size={14} />
            Tomar conversacion
          </Button>
          <Button variant="secondary" size="sm" onClick={onEscalate} disabled={disabled}>
            <ArrowUpRight size={14} />
            Escalar a humano
          </Button>
        </>
      ) : (
        <Button variant="secondary" size="sm" onClick={onReturnToIA} disabled={disabled}>
          <Bot size={14} />
          Devolver a IA
        </Button>
      )}
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${owner === 'ia' ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-700'}`}>
        {owner === 'ia' ? <Bot size={13} /> : <UserRound size={13} />}
        {owner === 'ia' ? 'La conversacion la lleva IA' : 'La conversacion la lleva humano'}
      </span>
    </div>
  );
}
