import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { Card } from '../ui/primitives';

export function EmptyInboxState() {
  return (
    <Card className="flex min-h-[60vh] items-center justify-center border-dashed p-6 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <MessageSquare size={20} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-ink-900">Todavia no tienes conversaciones</h2>
        <p className="mt-2 mx-auto max-w-md text-sm leading-relaxed text-ink-500">
          Activa un canal para empezar a recibir mensajes o prueba tu agente desde tu sitio y tu App Chat.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/integrations"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-500"
          >
            Activar canales
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/web-widget"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(17,17,16,0.12)] bg-[rgba(255,255,255,0.75)] px-4 py-1.5 text-[12px] font-semibold text-ink-700 transition hover:bg-white"
          >
            Probar Web Widget
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Card>
  );
}
