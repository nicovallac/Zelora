import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe2, Inbox, BarChart3, ArrowRight, MessageCircle, Zap, Users } from 'lucide-react';
import { heroKpis } from '../data/mock';

const features = [
  {
    icon: Globe2,
    title: 'Canales Omnicanal',
    desc: 'WhatsApp, Chat Web, Instagram DM y TikTok en una sola plataforma. El afiliado elige dónde hablar; tú atiendes desde un solo lugar.',
    link: '/demo-web',
    linkLabel: 'Ver Demo Web',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Inbox,
    title: 'Inbox Unificado',
    desc: 'Bandeja centralizada con todas las conversaciones, filtros por canal y estado, asignación de asesores y línea de tiempo por caso.',
    link: '/inbox',
    linkLabel: 'Abrir Inbox',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics BI',
    desc: 'Dashboard en tiempo real con KPIs de automatización, intenciones frecuentes, horarios pico y desempeño de cada asesor.',
    link: '/analytics',
    linkLabel: 'Ver Analytics',
    color: 'bg-violet-50 text-violet-600',
  },
];

const steps = [
  {
    number: '1',
    title: 'Cliente escribe',
    desc: 'El afiliado envía un mensaje por WhatsApp, Chat Web, Instagram o TikTok en cualquier momento del día.',
    icon: MessageCircle,
  },
  {
    number: '2',
    title: 'IA detecta intención',
    desc: 'El chatbot identifica automáticamente qué necesita el afiliado (subsidio, certificado, PQRS, etc.) y su sentimiento.',
    icon: Zap,
  },
  {
    number: '3',
    title: 'Resuelve o escala',
    desc: 'El 74% se resuelve sin intervención humana. Los casos complejos se escalan al asesor correcto con todo el contexto.',
    icon: Users,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-8 py-16 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08),_transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            PoC en vivo — COMFAGUAJIRA Chatbot
          </div>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Atención al afiliado 24/7,
            <br />
            <span className="text-brand-200">automatizada con IA</span>
          </h1>
          <p className="mt-4 text-lg text-brand-100">
            Resuelve subsidios, certificados, PQRS y más a través de WhatsApp, Chat Web, Instagram y TikTok —
            sin esperas, con escalamiento inteligente al asesor cuando es necesario.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/demo-web"
              className="inline-flex items-center gap-2 rounded-xl bg-white/70 backdrop-blur-sm px-5 py-2.5 text-sm font-bold text-brand-700 shadow transition hover:bg-brand-50"
            >
              Probar Demo Web <ArrowRight size={16} />
            </Link>
            <Link
              to="/whatsapp"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Ver WhatsApp
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {heroKpis.map((kpi) => (
            <motion.div
              key={kpi.label}
              variants={itemVariants}
              className="rounded-2xl border border-white/20 bg-white/15 p-5 text-center backdrop-blur"
            >
              <p className="text-3xl font-extrabold text-white">{kpi.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-100">{kpi.label}</p>
              <p className="mt-0.5 text-xs text-brand-200">{kpi.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature cards */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-ink-900">Todo lo que necesitas en una plataforma</h2>
          <p className="mt-2 text-ink-400">Automatización, omnicanalidad y analítica para COMFAGUAJIRA</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm p-6 shadow-card transition-shadow hover:shadow-md"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                <f.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.desc}</p>
              <Link
                to={f.link}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
              >
                {f.linkLabel} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl bg-[rgba(17,17,16,0.025)] px-8 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-ink-900">Cómo funciona</h2>
          <p className="mt-2 text-ink-400">En segundos, el afiliado obtiene respuesta</p>
        </div>
        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute left-1/2 top-8 hidden h-0.5 w-2/3 -translate-x-1/2 bg-brand-200 md:block" />
          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg">
                <step.icon size={24} />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm text-xs font-bold text-brand-700 shadow">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-bold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-8 py-10 text-center text-white shadow">
        <h2 className="text-2xl font-bold">¿Listo para verlo en acción?</h2>
        <p className="mt-2 text-brand-100">Explora el demo interactivo o revisa los costos del piloto</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/demo-web"
            className="inline-flex items-center gap-2 rounded-xl bg-white/70 backdrop-blur-sm px-6 py-3 text-sm font-bold text-brand-700 shadow transition hover:bg-brand-50"
          >
            Probar Demo Web <ArrowRight size={16} />
          </Link>
          <Link
            to="/costos"
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Ver Costos del Piloto
          </Link>
        </div>
      </section>
    </div>
  );
}
