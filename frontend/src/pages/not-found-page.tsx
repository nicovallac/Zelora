import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="max-w-lg rounded-[28px] border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-8 text-center shadow-card">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-ink-400">404</p>
        <h1 className="mt-3 text-3xl font-bold text-ink-900">Pagina no disponible</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-400">
          Este modulo todavia no esta habilitado en el MVP actual. Vuelve al dashboard o entra a una seccion disponible.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Ir al dashboard
          </Link>
          <Link
            to="/integrations"
            className="rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.025)]"
          >
            Ver integraciones
          </Link>
        </div>
      </div>
    </div>
  );
}
