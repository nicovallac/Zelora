import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Globe, Phone, Plug } from 'lucide-react';
import { PageHeader } from '../components/ui/page-header';

interface CatalogItem {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  color: string;
  initials: string;
  estado: 'disponible' | 'proximo';
  path?: string;
}

const CATALOG: CatalogItem[] = [
  { id: 'whatsapp-business', nombre: 'WhatsApp Business', categoria: 'Canal', descripcion: 'Gestiona la conexion del numero, webhook, templates y salud operativa del canal.', color: 'bg-emerald-500', initials: 'WA', estado: 'proximo' },
  { id: 'web-widget', nombre: 'Web Widget', categoria: 'Canal', descripcion: 'Configura launcher, apariencia, dominio, seguridad y comportamiento del chat web.', color: 'bg-sky-500', initials: 'WB', estado: 'disponible', path: '/webapp' },
  { id: 'app-chat', nombre: 'App Chat', categoria: 'Canal', descripcion: 'Canal embebido para apps iOS y Android con identidad, handoff e instalacion guiada.', color: 'bg-indigo-500', initials: 'AC', estado: 'disponible', path: '/app-chat' },
  { id: 'salesforce', nombre: 'Salesforce', categoria: 'Integracion', descripcion: 'CRM para gestion comercial, contactos y oportunidades.', color: 'bg-blue-500', initials: 'SF', estado: 'proximo' },
  { id: 'hubspot', nombre: 'HubSpot', categoria: 'Integracion', descripcion: 'Marketing, ventas y servicio al cliente en una sola plataforma.', color: 'bg-orange-400', initials: 'HS', estado: 'proximo' },
  { id: 'sap', nombre: 'SAP', categoria: 'Integracion', descripcion: 'ERP para procesos empresariales e integraciones operativas.', color: 'bg-sky-500', initials: 'SAP', estado: 'proximo' },
  { id: 'openai', nombre: 'OpenAI', categoria: 'Integracion', descripcion: 'Proveedor de modelos para respuestas, clasificacion y automatizacion.', color: 'bg-emerald-500', initials: 'OA', estado: 'proximo' },
  { id: 'claude', nombre: 'Claude', categoria: 'Integracion', descripcion: 'Proveedor alternativo de modelos para tareas de lenguaje.', color: 'bg-violet-500', initials: 'CL', estado: 'proximo' },
  { id: 'twilio', nombre: 'Twilio SMS', categoria: 'Canal', descripcion: 'Mensajeria SMS programatica para notificaciones y campañas.', color: 'bg-red-400', initials: 'TW', estado: 'proximo' },
  { id: 'stripe', nombre: 'Stripe', categoria: 'Integracion', descripcion: 'Procesamiento de pagos y cobros recurrentes.', color: 'bg-indigo-500', initials: 'ST', estado: 'proximo' },
  { id: 'zendesk', nombre: 'Zendesk', categoria: 'Integracion', descripcion: 'Gestion de soporte y tickets para equipos de atencion.', color: 'bg-green-500', initials: 'ZD', estado: 'proximo' },
  { id: 'google-analytics', nombre: 'Google Analytics', categoria: 'Integracion', descripcion: 'Analitica de trafico y comportamiento web.', color: 'bg-amber-500', initials: 'GA', estado: 'proximo' },
  { id: 'power-bi', nombre: 'Power BI', categoria: 'Integracion', descripcion: 'Dashboards y reporting empresarial.', color: 'bg-yellow-400', initials: 'PB', estado: 'proximo' },
  { id: 'azure-ad', nombre: 'Azure AD / SSO', categoria: 'Integracion', descripcion: 'Inicio de sesion unico y gestion de identidad corporativa.', color: 'bg-blue-500', initials: 'AZ', estado: 'proximo' },
  { id: 'instagram', nombre: 'Instagram', categoria: 'Canal', descripcion: 'Canal social para mensajes y automatizaciones.', color: 'bg-fuchsia-500', initials: 'IG', estado: 'proximo' },
  { id: 'tiktok', nombre: 'TikTok', categoria: 'Canal', descripcion: 'Mensajeria y engagement social desde TikTok.', color: 'bg-ink-800', initials: 'TT', estado: 'proximo' },
  { id: 'meta-ads', nombre: 'Meta Ads', categoria: 'Integracion', descripcion: 'Sincronizacion futura con campañas y eventos de conversion.', color: 'bg-cyan-500', initials: 'MA', estado: 'proximo' },
];

const CAT_PILL: Record<string, string> = {
  Canal:       'bg-sky-100/70 text-sky-600',
  Integracion: 'bg-ink-100/60 text-ink-500',
};

export function IntegrationsPage() {
  const availableItems = useMemo(() => CATALOG.filter((i) => i.estado === 'disponible'), []);
  const upcomingItems  = useMemo(() => CATALOG.filter((i) => i.estado === 'proximo'), []);

  return (
    <div className="page-shell overflow-hidden">
      <div className="page-stack overflow-hidden">
        <PageHeader
          eyebrow="Canales e integraciones"
          title="Integraciones"
          description="Gestiona los canales e integraciones activas del MVP. Por ahora Web Widget y App Chat estan habilitados."
        />

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">

          {/* Available */}
          <section
            className="min-h-0 overflow-hidden rounded-3xl"
            style={{ border: '1px solid rgba(17,17,16,0.08)', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="px-5 py-3.5"
              style={{ borderBottom: '1px solid rgba(17,17,16,0.07)' }}
            >
              <h2 className="flex items-center gap-2 text-[12px] font-semibold text-ink-700" style={{ letterSpacing: '0.06em' }}>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-200/80">
                  <Plug size={11} className="text-brand-700" />
                </div>
                DISPONIBLES AHORA
              </h2>
            </div>
            <div className="grid max-h-full gap-2.5 overflow-y-auto p-4 md:grid-cols-2">
              {availableItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 transition-all duration-150 hover:shadow-soft hover:-translate-y-px"
                  style={{ border: '1px solid rgba(17,17,16,0.07)', background: 'rgba(255,255,255,0.70)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white ${item.color}`}>
                      {item.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-ink-900">{item.nombre}</p>
                        <span
                          className="rounded-full bg-brand-200/60 px-2 py-0.5 text-[9px] font-bold text-brand-700"
                          style={{ letterSpacing: '0.08em' }}
                        >
                          ACTIVO
                        </span>
                      </div>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${CAT_PILL[item.categoria]}`}
                        style={{ letterSpacing: '0.1em' }}
                      >
                        {item.categoria}
                      </span>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-400">{item.descripcion}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link
                      to={item.path ?? '/integrations'}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-[11px] font-semibold text-white shadow-card transition-all duration-150 hover:bg-brand-500 hover:-translate-y-px"
                    >
                      Gestionar <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,1fr)_auto]">
            {/* Upcoming */}
            <section
              className="min-h-0 overflow-hidden rounded-3xl"
              style={{ border: '1px solid rgba(17,17,16,0.08)', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)' }}
            >
              <div
                className="px-5 py-3.5"
                style={{ borderBottom: '1px solid rgba(17,17,16,0.07)' }}
              >
                <h2 className="text-[12px] font-semibold text-ink-500" style={{ letterSpacing: '0.06em' }}>
                  PROXIMAMENTE
                </h2>
              </div>
              <div className="grid max-h-full gap-2 overflow-y-auto p-3 sm:grid-cols-2 xl:grid-cols-1">
                {upcomingItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl p-3"
                    style={{ border: '1px solid rgba(17,17,16,0.06)', background: 'rgba(17,17,16,0.02)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white ${item.color}`}>
                        {item.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-ink-800">{item.nombre}</p>
                        <span
                          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${CAT_PILL[item.categoria]}`}
                          style={{ letterSpacing: '0.1em' }}
                        >
                          {item.categoria}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-ink-400">{item.descripcion}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* MVP channels info */}
            <section className="page-section-card">
              <h2 className="text-[12px] font-semibold text-ink-700" style={{ letterSpacing: '0.06em' }}>
                CANALES DEL MVP
              </h2>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {[
                  { Icon: Globe, color: 'text-sky-500', bg: 'bg-sky-50/70', title: 'Web Widget', desc: 'Configuracion del launcher, apariencia, dominios autorizados y snippet de instalacion.' },
                  { Icon: Phone, color: 'text-indigo-500', bg: 'bg-indigo-50/70', title: 'App Chat', desc: 'Canal embebido para apps moviles, seguridad por bundle/package y flujo SDK.' },
                ].map(({ Icon, color, bg, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-2xl p-3"
                    style={{ border: '1px solid rgba(17,17,16,0.07)', background: 'rgba(17,17,16,0.02)' }}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${bg} ${color}`}>
                      <Icon size={13} />
                    </div>
                    <p className="mt-2 text-[12px] font-semibold text-ink-800">{title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{desc}</p>
                  </div>
                ))}
                <div
                  className="rounded-2xl p-3 md:col-span-2"
                  style={{ border: '1px solid rgba(17,17,16,0.07)', background: 'rgba(17,17,16,0.02)' }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50/70 text-blue-600">
                    <Plug size={13} />
                  </div>
                  <p className="mt-2 text-[12px] font-semibold text-ink-800">Base de datos externa</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
                    Mas adelante podras conectar una base externa para consultar informacion operativa desde conversaciones.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
