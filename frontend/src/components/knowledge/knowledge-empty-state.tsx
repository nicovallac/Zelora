import { Link } from 'react-router-dom';
import { ArrowRight, Brain } from 'lucide-react';
import { Card } from '../ui/primitives';

export function KnowledgeEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="border-dashed p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100/80 text-brand-600">
        <Brain size={20} />
      </div>
      <h2 className="mt-4 text-[15px] font-bold text-ink-900">Tu asistente todavia no tiene informacion suficiente</h2>
      <p className="mt-2 mx-auto max-w-xl text-[13px] leading-relaxed text-ink-400">
        Agrega info para que responda mejor y venda mejor dentro de las conversaciones.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-500 hover:-translate-y-px active:translate-y-0"
        >
          Agregar informacion
          <ArrowRight size={13} />
        </button>
        <Link
          to="/inbox"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(17,17,16,0.12)] bg-white/80 px-5 py-2 text-[13px] font-semibold text-ink-700 shadow-card transition hover:bg-white hover:-translate-y-px active:translate-y-0"
        >
          Ir al inbox
          <ArrowRight size={13} />
        </Link>
      </div>
    </Card>
  );
}
