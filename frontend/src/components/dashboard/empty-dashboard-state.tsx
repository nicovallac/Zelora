import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export function EmptyDashboardState() {
  return (
    <div className="rounded-3xl border border-dashed border-[rgba(17,17,16,0.1)] bg-white/65 p-8 text-center shadow-card">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100/80 text-brand-600">
        <Sparkles size={20} />
      </div>
      <h2
        className="mt-4 text-[17px] font-bold text-ink-900"
        style={{ letterSpacing: '-0.01em' }}
      >
        Todavia no hay actividad
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-400">
        Este panel cobrara vida cuando cargues informacion, actives un canal y empieces a recibir conversaciones.
      </p>
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Link
          to="/knowledge-base"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-500 px-5 py-2 text-[13px] font-semibold text-white shadow-card transition-all duration-200 hover:bg-brand-500 hover:-translate-y-px"
        >
          Cargar informacion
          <ArrowRight size={13} />
        </Link>
        <Link
          to="/integrations"
          className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold text-ink-700 transition-all duration-150 hover:-translate-y-px hover:bg-white"
          style={{ border: '1px solid rgba(17,17,16,0.12)', background: 'rgba(255,255,255,0.75)' }}
        >
          Activar un canal
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
