import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BellRing, ShieldAlert } from 'lucide-react';
import { Card } from '../ui/primitives';
import type { AttentionItem } from './types';

const TONE_STYLES: Record<string, string> = {
  danger:  'border-red-200/50 bg-red-50/40',
  warning: 'border-amber-200/50 bg-amber-50/40',
  neutral: 'border-[rgba(17,17,16,0.07)] bg-[rgba(255,255,255,0.4)]',
};

export function AttentionRequired({ items }: { items: AttentionItem[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <ShieldAlert size={14} />
        </div>
        <div>
          <h2 className="text-[15px] font-bold leading-tight text-ink-900" style={{ letterSpacing: '-0.01em' }}>
            Necesita tu atencion
          </h2>
          <p className="text-[11px] text-ink-400">Bloqueos y riesgos que vale revisar ahora.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div
          className="mt-4 rounded-2xl px-4 py-6 text-center"
          style={{ border: '1px dashed rgba(17,17,16,0.1)', background: 'rgba(17,17,16,0.02)' }}
        >
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <BellRing size={14} />
          </div>
          <p className="mt-3 text-[13px] font-semibold text-ink-800">No hay alertas urgentes</p>
          <p className="mt-1 text-[11px] text-ink-400">
            Buen momento para activar canales o mejorar tu asistente.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 ${TONE_STYLES[item.tone]}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      size={12}
                      className={item.tone === 'danger' ? 'text-red-500' : 'text-amber-500'}
                    />
                    <p className="text-[13px] font-semibold text-ink-800">{item.title}</p>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-400">{item.description}</p>
                </div>
                <Link
                  to={item.href}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-ink-700 transition-all duration-200 hover:-translate-y-px hover:bg-white"
                  style={{ border: '1px solid rgba(17,17,16,0.12)', background: 'rgba(255,255,255,0.75)' }}
                >
                  {item.cta}
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
