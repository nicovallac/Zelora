import { Check, AlertTriangle, Zap, MessageSquare, Database, BarChart3, Shield } from 'lucide-react';
import { pilotPlan, recurringPlans, addons, whatsappExample, whatsappCategoryPrices } from '../data/mock';

export function CostosPage() {
  return (
    <div className="space-y-8">
      {/* SECTION 1: Pilot plan */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-8 text-white shadow-xl">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
          <Zap size={11} /> Escenario Piloto
        </div>
        <h2 className="mt-2 max-w-xl text-2xl font-extrabold leading-snug">{pilotPlan.name}</h2>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-4xl font-black">{pilotPlan.price}</p>
            <p className="text-sm text-brand-100">{pilotPlan.priceNote} · Duración: {pilotPlan.duration}</p>
          </div>
          <div className="flex gap-2">
            {pilotPlan.channels.map((ch) => (
              <span key={ch} className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                {ch}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-white/10 px-4 py-2.5 text-sm backdrop-blur">
          <span className="font-semibold">{pilotPlan.includedVolume}</span>
          <span className="mx-2 text-brand-200">·</span>
          <span className="text-brand-100">{pilotPlan.extra}</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-200">
              <Zap size={12} /> Capacidades IA
            </div>
            <ul className="space-y-1.5">
              {pilotPlan.capabilities.map((c) => (
                <li key={c} className="flex items-start gap-1.5 text-xs text-white">
                  <Check size={12} className="mt-0.5 flex-shrink-0 text-emerald-300" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-200">
              <MessageSquare size={12} /> Ejemplos de consultas
            </div>
            <ul className="space-y-1.5">
              {pilotPlan.queryExamples.map((q) => (
                <li key={q} className="flex items-start gap-1.5 text-xs text-white">
                  <span className="mt-0.5 text-brand-200">"</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-200">
              <Database size={12} /> Integraciones
            </div>
            <ul className="space-y-1.5">
              {pilotPlan.integrations.map((i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-white">
                  <Check size={12} className="mt-0.5 flex-shrink-0 text-emerald-300" />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-200">
              <BarChart3 size={12} /> Plataforma
            </div>
            <ul className="space-y-1.5">
              {pilotPlan.platform.map((p) => (
                <li key={p} className="flex items-start gap-1.5 text-xs text-white">
                  <Check size={12} className="mt-0.5 flex-shrink-0 text-emerald-300" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white/10 px-4 py-3 text-xs text-brand-100 backdrop-blur">
            <span className="font-semibold text-white">Infraestructura: </span>
            {pilotPlan.infrastructure}
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-xs text-brand-100 backdrop-blur">
            <span className="font-semibold text-white">Costo IA: </span>
            {pilotPlan.aiNote}
          </div>
        </div>

        <div className="mt-6">
          <button className="inline-flex items-center gap-2 rounded-xl bg-white/70 backdrop-blur-sm px-6 py-3 text-sm font-bold text-brand-700 shadow-lg transition hover:bg-brand-50">
            Solicitar Piloto
          </button>
        </div>
      </section>

      {/* SECTION 2: WhatsApp cost model */}
      <section className="rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card">
        <h2 className="mb-1 text-xl font-bold text-ink-900">Costo real de WhatsApp</h2>
        <p className="mb-4 text-sm text-ink-400">La gran mayoría de consultas de soporte NO generan costo</p>

        <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="mb-3 font-semibold text-emerald-800">Escenario típico COMFAGUAJIRA</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-emerald-100">
                <tr>
                  <td className="py-2 text-ink-600">Total afiliados activos</td>
                  <td className="py-2 text-right font-semibold text-ink-900">{whatsappExample.totalAfiliados}</td>
                </tr>
                <tr>
                  <td className="py-2 text-ink-600">Consultas estimadas al mes</td>
                  <td className="py-2 text-right font-semibold text-ink-900">{whatsappExample.consultasMes}</td>
                </tr>
                <tr>
                  <td className="py-2 text-ink-600">Mensajes por consulta (promedio)</td>
                  <td className="py-2 text-right font-semibold text-ink-900">{whatsappExample.mensajesPorConsulta}</td>
                </tr>
                <tr>
                  <td className="py-2 text-ink-600">Total mensajes intercambiados</td>
                  <td className="py-2 text-right font-semibold text-ink-900">{whatsappExample.totalMensajes}</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-emerald-700">Costo estimado de conversación</td>
                  <td className="py-2 text-right text-2xl font-black text-emerald-700">{whatsappExample.costo}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-emerald-700">{whatsappExample.nota}</p>
        </div>

        <div>
          <p className="mb-3 font-semibold text-ink-800">¿Cuándo sí pagas? (conversaciones iniciadas por empresa)</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(17,17,16,0.06)] text-left text-xs font-semibold text-ink-400">
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Precio aproximado</th>
                  <th className="py-2">Ejemplo de uso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(17,17,16,0.04)]">
                {whatsappCategoryPrices.map((row) => (
                  <tr key={row.tipo} className="text-sm hover:bg-[rgba(17,17,16,0.025)] transition">
                    <td className="py-2.5 pr-4 font-medium text-ink-900">{row.tipo}</td>
                    <td className="py-2.5 pr-4 font-semibold text-ink-700">{row.precio}</td>
                    <td className="py-2.5 text-ink-600">{row.ejemplo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            '95–98% tasa de lectura vs 20% en email',
            'Reduce carga del call center',
            'Canal preferido por afiliados en Colombia',
          ].map((adv) => (
            <div key={adv} className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
              <Check size={12} className="mt-0.5 flex-shrink-0 text-blue-500" />
              {adv}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Recurring plans */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink-900">Planes recurrentes (después del piloto)</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {recurringPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl border shadow-card ${
                plan.highlight
                  ? 'border-brand-400 shadow-brand-100'
                  : 'border-[rgba(17,17,16,0.09)]'
              }`}
            >
              {plan.highlight && (
                <>
                  <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-white">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{plan.name}</p>
                      <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold">Más popular</span>
                    </div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-5">
                    <p className="text-3xl font-black text-ink-900">{plan.price}</p>
                    <p className="text-sm text-ink-400">{plan.period}</p>
                    <p className="mt-1 text-xs font-semibold text-brand-600">{plan.volume}</p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                          <Check size={14} className="mt-0.5 flex-shrink-0 text-brand-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button className="mt-5 w-full rounded-full bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600">
                      Elegir Plan Profesional
                    </button>
                  </div>
                </>
              )}
              {!plan.highlight && (
                <div className="bg-white/70 backdrop-blur-sm p-5">
                  <p className="text-lg font-bold text-ink-900">{plan.name}</p>
                  <p className="mt-1 text-2xl font-black text-ink-900">{plan.price}</p>
                  {plan.period && <p className="text-sm text-ink-400">{plan.period}</p>}
                  <p className="mt-1 text-xs font-semibold text-ink-400">{plan.volume}</p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                        <Check size={14} className="mt-0.5 flex-shrink-0 text-ink-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className="mt-5 w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-[rgba(17,17,16,0.025)] py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-[rgba(17,17,16,0.06)]">
                    {plan.price === 'Contactar ventas' ? 'Contactar ventas' : `Elegir ${plan.name}`}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Add-ons */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink-900">Add-ons disponibles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {addons.map((addon) => (
            <div key={addon.name} className="flex items-start gap-4 rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-4 shadow-card">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
                <Zap size={18} className="text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-ink-900">{addon.name}</p>
                  <span className="flex-shrink-0 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                    {addon.price}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink-400">{addon.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Technical note */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          <h2 className="font-bold text-amber-900">Nota técnica importante</h2>
        </div>
        <p className="mb-4 text-sm text-amber-800">
          El chatbot de IA requiere trabajo de configuración y desarrollo adicional para producción. Los siguientes aspectos tienen esfuerzo técnico propio:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { icon: Shield, text: 'Seguridad y autenticación de afiliados (verificación de cédula, validación de identidad)' },
            { icon: Database, text: 'Integración con sistemas internos o ERP para datos en tiempo real' },
            { icon: Shield, text: 'Verificación de usuario antes de revelar información personal o sensible' },
            { icon: AlertTriangle, text: 'Protección de datos personales conforme a la Ley 1581 (habeas data Colombia)' },
            { icon: Zap, text: 'Parametrización de flujos específicos según procesos internos de COMFAGUAJIRA' },
            { icon: BarChart3, text: 'Pruebas, ajuste de umbrales de intención y afinamiento del modelo de lenguaje' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white/70 backdrop-blur-sm p-3 text-sm text-amber-900">
              <item.icon size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />
              {item.text}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
