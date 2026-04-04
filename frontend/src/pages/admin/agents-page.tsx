import { useEffect, useState, useCallback } from 'react';
import {
  Bot, BookOpen, Briefcase, ChevronRight, Loader2, Megaphone,
  Pencil, Plus, Settings2, ShoppingCart, Sparkles, ToggleLeft, ToggleRight, X, Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import type { AgentAdmin, CreateAgentPayload, OnboardingProfileApiItem, SalesAgentMetricsApiItem } from '../../services/api';
import { agentPerformance } from '../../data/mock';
import { useNotification } from '../../contexts/NotificationContext';
import { Skeleton } from '../../components/ui/primitives';
import { USE_MOCK_DATA } from '../../lib/runtime';
import { PageHeader } from '../../components/ui/page-header';

// ── helpers ───────────────────────────────────────────────────────────────────

function mockAgents(): AgentAdmin[] {
  const emails: Record<string, string> = {
    'Carlos Pérez': 'carlos.perez@comfaguajira.com',
    'Laura Gutiérrez': 'laura.gutierrez@comfaguajira.com',
    'Andrés Morales': 'andres.morales@comfaguajira.com',
    'Diana Suárez': 'diana.suarez@comfaguajira.com',
  };
  const roles: Record<string, string> = { 'Carlos Pérez': 'admin' };
  return agentPerformance.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    email: emails[a.nombre] ?? `${a.nombre.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
    rol: roles[a.nombre] ?? 'asesor',
    activo: true,
    created_at: '2025-01-15T00:00:00Z',
  }));
}

function getInitials(nombre: string) {
  return nombre.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function parseTokenInput(value: string) {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}
function stringifyTokens(values?: string[]) {
  return (values || []).join(', ');
}

function validate(form: AgentFormState, isEdit: boolean): string | null {
  if (!form.nombre.trim()) return 'El nombre es obligatorio';
  if (!form.email.trim()) return 'El correo es obligatorio';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Correo inválido';
  if (!isEdit || form.changePassword) {
    if (!form.password) return 'La contraseña es obligatoria';
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden';
  }
  return null;
}

// ── types ─────────────────────────────────────────────────────────────────────

type AgentsTab = 'ia' | 'humanos';
type ConfigTab = 'identidad' | 'marca' | 'playbook' | 'buyer' | 'reglas';

interface AgentFormState {
  nombre: string; email: string; password: string; confirmPassword: string; rol: string; changePassword: boolean;
}
const EMPTY_FORM: AgentFormState = { nombre: '', email: '', password: '', confirmPassword: '', rol: 'asesor', changePassword: false };

interface SalesAgentUiSettings {
  enabled: boolean;
  autonomyLevel: 'asistido' | 'semi_autonomo' | 'autonomo';
  followupMode: 'apagado' | 'suave' | 'activo';
  maxFollowups: '0' | '1' | '2';
  recommendationDepth: '1' | '2' | '3';
  handoffMode: 'temprano' | 'balanceado' | 'estricto';
  maxResponseLength: 'brief' | 'standard' | 'detailed';
}

interface SalesAgentProfileState {
  // Identidad
  name: string;
  agentPersona: string;
  whatYouSell: string;
  whoYouSellTo: string;
  missionStatement: string;
  industry: string;
  country: string;
  website: string;
  responseLanguage: 'auto' | 'es' | 'en';
  greetingMessage: string;
  // Marca y tono
  toneOfVoice: string;
  formalityLevel: string;
  brandPersonality: string;
  valueProposition: string;
  keyDifferentiators: string[];
  recommendedPhrases: string[];
  avoidPhrases: string[];
  preferredClosingStyle: string;
  urgencyStyle: string;
  // Playbook
  openingStyle: string;
  recommendationStyle: string;
  objectionStyle: string;
  closingStyle: string;
  followUpStyle: string;
  upsellStyle: string;
  escalateConditions: string[];
  competitorResponse: string;
  // Buyer model
  idealBuyers: string[];
  commonObjections: string[];
  purchaseSignals: string[];
  lowIntentSignals: string[];
  bulkBuyerSignals: string[];
  // Reglas de negocio
  paymentMethods: string[];
  shippingPolicy: string;
  discountPolicy: string;
  negotiationPolicy: string;
  inventoryPromiseRule: string;
  deliveryPromiseRule: string;
  returnPolicySummary: string;
  forbiddenClaims: string[];
  forbiddenPromises: string[];
}

const DEFAULT_PROFILE: SalesAgentProfileState = {
  name: 'Sales Agent', agentPersona: '', whatYouSell: '', whoYouSellTo: '',
  missionStatement: '', industry: '', country: '', website: '',
  responseLanguage: 'auto', greetingMessage: '',
  toneOfVoice: '', formalityLevel: 'balanced', brandPersonality: '',
  valueProposition: '', keyDifferentiators: [], recommendedPhrases: [], avoidPhrases: [],
  preferredClosingStyle: '', urgencyStyle: 'soft',
  openingStyle: '', recommendationStyle: '', objectionStyle: '', closingStyle: '',
  followUpStyle: '', upsellStyle: '', escalateConditions: [], competitorResponse: '',
  idealBuyers: [], commonObjections: [], purchaseSignals: [], lowIntentSignals: [], bulkBuyerSignals: [],
  paymentMethods: [], shippingPolicy: '', discountPolicy: '', negotiationPolicy: '',
  inventoryPromiseRule: '', deliveryPromiseRule: '', returnPolicySummary: '',
  forbiddenClaims: [], forbiddenPromises: [],
};

function mapProfile(profile: OnboardingProfileApiItem): SalesAgentProfileState {
  const ap = profile.sales_agent_profile || {};
  const brand = ap.brand_profile || {};
  const playbook = ap.sales_playbook || {};
  const buyer = ap.buyer_model || {};
  const rules = ap.commerce_rules || {};
  return {
    name: profile.sales_agent_name || 'Sales Agent',
    agentPersona: ap.agent_persona || '',
    whatYouSell: ap.what_you_sell || profile.what_you_sell || '',
    whoYouSellTo: ap.who_you_sell_to || profile.who_you_sell_to || '',
    missionStatement: ap.mission_statement || '',
    industry: ap.industry || '',
    country: ap.country || '',
    website: ap.website || '',
    responseLanguage: (ap.response_language as SalesAgentProfileState['responseLanguage']) || 'auto',
    greetingMessage: ap.greeting_message || '',
    toneOfVoice: brand.tone_of_voice || '',
    formalityLevel: brand.formality_level || 'balanced',
    brandPersonality: brand.brand_personality || '',
    valueProposition: brand.value_proposition || '',
    keyDifferentiators: brand.key_differentiators || [],
    recommendedPhrases: brand.recommended_phrases || [],
    avoidPhrases: brand.avoid_phrases || [],
    preferredClosingStyle: brand.preferred_closing_style || '',
    urgencyStyle: brand.urgency_style || 'soft',
    openingStyle: playbook.opening_style || '',
    recommendationStyle: playbook.recommendation_style || '',
    objectionStyle: playbook.objection_style || '',
    closingStyle: playbook.closing_style || '',
    followUpStyle: playbook.follow_up_style || '',
    upsellStyle: playbook.upsell_style || '',
    escalateConditions: playbook.escalate_conditions || [],
    competitorResponse: ap.competitor_response || playbook.competitor_response || '',
    idealBuyers: buyer.ideal_buyers || [],
    commonObjections: buyer.common_objections || [],
    purchaseSignals: buyer.purchase_signals || [],
    lowIntentSignals: buyer.low_intent_signals || [],
    bulkBuyerSignals: buyer.bulk_buyer_signals || [],
    paymentMethods: ap.payment_methods || rules.payment_methods || [],
    shippingPolicy: ap.shipping_policy || rules.shipping_policy || '',
    discountPolicy: rules.discount_policy || '',
    negotiationPolicy: rules.negotiation_policy || '',
    inventoryPromiseRule: rules.inventory_promise_rule || '',
    deliveryPromiseRule: rules.delivery_promise_rule || '',
    returnPolicySummary: rules.return_policy_summary || '',
    forbiddenClaims: rules.forbidden_claims || [],
    forbiddenPromises: rules.forbidden_promises || [],
  };
}

// ── sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">{children}</label>
      {hint && <p className="text-[10px] text-ink-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function InputField({ label, hint, value, onChange, placeholder, rows }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const cls = 'w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white';
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={`${cls} resize-none`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

function SelectField({ label, hint, value, onChange, options }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none transition focus:border-brand-400">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TokenField({ label, hint, value, onChange, placeholder }: {
  label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <textarea
        value={stringifyTokens(value)}
        onChange={(e) => onChange(parseTokenInput(e.target.value))}
        rows={2}
        placeholder={placeholder || 'Separados por comas'}
        className="w-full resize-none rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
      />
      {value.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {value.slice(0, 6).map((v, i) => (
            <span key={i} className="rounded-full bg-brand-50 border border-brand-200/60 px-2 py-0.5 text-[10px] font-medium text-brand-700">{v}</span>
          ))}
          {value.length > 6 && <span className="rounded-full bg-ink-100/60 px-2 py-0.5 text-[10px] text-ink-500">+{value.length - 6}</span>}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">{children}</p>;
}

// ── Config tabs ───────────────────────────────────────────────────────────────

const CONFIG_TABS: { id: ConfigTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'identidad', label: 'Identidad', icon: Bot },
  { id: 'marca',     label: 'Marca y Tono', icon: Sparkles },
  { id: 'playbook',  label: 'Playbook', icon: BookOpen },
  { id: 'buyer',     label: 'Buyer Model', icon: Zap },
  { id: 'reglas',    label: 'Reglas', icon: Briefcase },
];

function ConfigPanel({ profile, set }: { profile: SalesAgentProfileState; set: <K extends keyof SalesAgentProfileState>(k: K, v: SalesAgentProfileState[K]) => void }) {
  const [tab, setTab] = useState<ConfigTab>('identidad');

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-[rgba(17,17,16,0.07)] pb-0 pt-1 px-1">
        {CONFIG_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-t-xl px-3 py-2 text-[12px] font-semibold transition ${
                tab === t.id
                  ? 'border border-b-white border-[rgba(17,17,16,0.09)] bg-white text-ink-900 -mb-px'
                  : 'text-ink-400 hover:text-ink-700'
              }`}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'identidad' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="Nombre del agente" hint="Cómo se llama tu vendedor IA" value={profile.name} onChange={(v) => set('name', v)} placeholder="Ej: Sofia, Carlos, Luna…" />
            <InputField label="Persona del agente" hint="Carácter, estilo, edad imaginaria — da vida al bot" value={profile.agentPersona} onChange={(v) => set('agentPersona', v)} placeholder="Ej: Vendedora entusiasta, experta en moda, trato cálido" />
            <div className="sm:col-span-2">
              <InputField label="Qué vende la marca" hint="Describe con claridad el producto o servicio" value={profile.whatYouSell} onChange={(v) => set('whatYouSell', v)} rows={2} placeholder="Ej: Ropa deportiva femenina de alta calidad para mujeres activas" />
            </div>
            <div className="sm:col-span-2">
              <InputField label="A quién le vende" hint="Perfil del cliente objetivo y cómo compra" value={profile.whoYouSellTo} onChange={(v) => set('whoYouSellTo', v)} rows={2} placeholder="Ej: Mujeres 25-45 años que buscan calidad y estilo, deciden solas" />
            </div>
            <div className="sm:col-span-2">
              <InputField label="Misión de marca" hint="El por qué de la empresa — da contexto al agente" value={profile.missionStatement} onChange={(v) => set('missionStatement', v)} rows={2} placeholder="Ej: Empoderar a las mujeres activas con ropa que las hace sentir imparables" />
            </div>
            <InputField label="Industria" value={profile.industry} onChange={(v) => set('industry', v)} placeholder="Ej: Moda, tecnología, alimentos…" />
            <InputField label="País / Región" value={profile.country} onChange={(v) => set('country', v)} placeholder="Ej: Colombia, México, LAM…" />
            <InputField label="Sitio web" value={profile.website} onChange={(v) => set('website', v)} placeholder="https://…" />
            <SelectField
              label="Idioma de respuesta"
              hint="Auto detecta el idioma del cliente"
              value={profile.responseLanguage}
              onChange={(v) => set('responseLanguage', v as SalesAgentProfileState['responseLanguage'])}
              options={[{ value: 'auto', label: 'Auto (detecta idioma del cliente)' }, { value: 'es', label: 'Siempre español' }, { value: 'en', label: 'Always English' }]}
            />
            <div className="sm:col-span-2">
              <InputField label="Mensaje de bienvenida" hint="Primer mensaje al iniciar una conversación nueva. Deja vacío para que el agente decida." value={profile.greetingMessage} onChange={(v) => set('greetingMessage', v)} placeholder="Ej: ¡Hola! Soy Sofia de [Marca] 👋 ¿En qué puedo ayudarte hoy?" />
            </div>
          </div>
        )}

        {tab === 'marca' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Tono de voz" value={profile.toneOfVoice} onChange={(v) => set('toneOfVoice', v)}
              options={[
                { value: '', label: '— Sin definir —' },
                { value: 'amigable', label: 'Amigable y cercano' },
                { value: 'profesional', label: 'Profesional y confiable' },
                { value: 'casual', label: 'Casual y relajado' },
                { value: 'experto', label: 'Experto y técnico' },
                { value: 'inspirador', label: 'Inspirador y motivacional' },
                { value: 'divertido', label: 'Divertido y desenfadado' },
              ]}
            />
            <SelectField label="Nivel de formalidad" value={profile.formalityLevel} onChange={(v) => set('formalityLevel', v)}
              options={[
                { value: 'relajado', label: 'Relajado (tuteo, coloquial)' },
                { value: 'balanced', label: 'Balanceado' },
                { value: 'formal', label: 'Formal (usted, corporativo)' },
              ]}
            />
            <InputField label="Personalidad de marca" hint="2-3 adjetivos que definen la marca" value={profile.brandPersonality} onChange={(v) => set('brandPersonality', v)} placeholder="Ej: audaz, empática, confiable" />
            <SelectField label="Estilo de cierre" value={profile.preferredClosingStyle} onChange={(v) => set('preferredClosingStyle', v)}
              options={[
                { value: '', label: '— Sin definir —' },
                { value: 'directo', label: 'Directo — pregunta de acción' },
                { value: 'consultivo', label: 'Consultivo — resumen + pregunta' },
                { value: 'suave', label: 'Suave — sin presión' },
              ]}
            />
            <div className="sm:col-span-2">
              <InputField label="Propuesta de valor" hint="Qué hace única a esta marca vs la competencia" value={profile.valueProposition} onChange={(v) => set('valueProposition', v)} rows={2} placeholder="Ej: La única plataforma que combina moda y funcionalidad a precio accesible" />
            </div>
            <SelectField label="Intensidad comercial" hint="Cuánta presión puede ejercer el agente" value={profile.urgencyStyle} onChange={(v) => set('urgencyStyle', v)}
              options={[
                { value: 'soft', label: 'Suave — sin presión' },
                { value: 'moderate', label: 'Moderada' },
                { value: 'high', label: 'Alta — cierre agresivo permitido' },
              ]}
            />
            <div>
              <SectionTitle>Frases y diferenciadores</SectionTitle>
            </div>
            <div className="sm:col-span-2">
              <TokenField label="Diferenciadores clave" hint="Lo que más enorgullece a la marca" value={profile.keyDifferentiators} onChange={(v) => set('keyDifferentiators', v)} placeholder="Envío gratis, garantía 1 año, atención 24/7…" />
            </div>
            <TokenField label="Frases recomendadas" hint="Expresiones que el agente debe usar" value={profile.recommendedPhrases} onChange={(v) => set('recommendedPhrases', v)} placeholder="Ej: 'te va a encantar', 'es el favorito de…'" />
            <TokenField label="Frases a evitar" hint="Muletillas y expresiones que dañan la marca" value={profile.avoidPhrases} onChange={(v) => set('avoidPhrases', v)} placeholder="Ej: 'con gusto', 'estoy aquí para ayudarte'" />
          </div>
        )}

        {tab === 'playbook' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <SectionTitle>Cómo vende el agente paso a paso</SectionTitle>
            <div />
            <div className="sm:col-span-2">
              <InputField label="Apertura" hint="Cómo debe abrir o entrar en una conversación nueva" value={profile.openingStyle} onChange={(v) => set('openingStyle', v)} rows={2} placeholder="Ej: Saluda con nombre de marca, pregunta directamente qué busca" />
            </div>
            <div className="sm:col-span-2">
              <InputField label="Recomendación" hint="Cómo presenta y justifica sus sugerencias" value={profile.recommendationStyle} onChange={(v) => set('recommendationStyle', v)} rows={2} placeholder="Ej: Presenta 2 opciones máximo, explica por qué encajan con su necesidad" />
            </div>
            <div className="sm:col-span-2">
              <InputField label="Manejo de objeciones" hint="Cómo responde cuando el cliente duda o pone peros" value={profile.objectionStyle} onChange={(v) => set('objectionStyle', v)} rows={2} placeholder="Ej: Valida la duda, da 1 dato concreto y regresa con una pregunta" />
            </div>
            <div className="sm:col-span-2">
              <InputField label="Cierre" hint="Cómo empuja hacia la decisión de compra" value={profile.closingStyle} onChange={(v) => set('closingStyle', v)} rows={2} placeholder="Ej: Resume la mejor opción y termina con '¿lo pedimos?'" />
            </div>
            <InputField label="Follow-up" hint="Qué hace si el cliente dice 'luego'" value={profile.followUpStyle} onChange={(v) => set('followUpStyle', v)} rows={2} placeholder="Ej: Recuerda la opción elegida y ofrece reservar" />
            <InputField label="Upsell" hint="Cómo sugiere el producto complementario" value={profile.upsellStyle} onChange={(v) => set('upsellStyle', v)} rows={2} placeholder="Ej: Solo si ya tiene intención de compra, menciona 1 complemento" />
            <div className="sm:col-span-2">
              <InputField label="Respuesta ante competidores" hint="Qué hace/dice cuando el cliente menciona otra marca" value={profile.competitorResponse} onChange={(v) => set('competitorResponse', v)} rows={2} placeholder="Ej: Reconoce que existen, destaca el diferenciador clave y pregunta qué necesita exactamente" />
            </div>
            <div className="sm:col-span-2">
              <TokenField label="Condiciones de escalado" hint="Cuándo el agente debe pasar a un humano" value={profile.escalateConditions} onChange={(v) => set('escalateConditions', v)} placeholder="Ej: pedidos >10 unidades, cliente VIP, disputa de pago…" />
            </div>
          </div>
        )}

        {tab === 'buyer' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <SectionTitle>Quién compra y cómo se comporta</SectionTitle>
            <div />
            <div className="sm:col-span-2">
              <TokenField label="Compradores ideales" hint="Perfil de los clientes que más convierten" value={profile.idealBuyers} onChange={(v) => set('idealBuyers', v)} placeholder="Ej: emprendedoras, madres 30-45, profesionales independientes…" />
            </div>
            <TokenField label="Objeciones comunes" hint="Las dudas que aparecen más seguido" value={profile.commonObjections} onChange={(v) => set('commonObjections', v)} placeholder="Ej: está muy caro, lo pienso, no sé si me queda…" />
            <TokenField label="Señales de compra" hint="Frases o acciones que indican intención real" value={profile.purchaseSignals} onChange={(v) => set('purchaseSignals', v)} placeholder="Ej: cuánto cuesta, hay disponible, cómo pago…" />
            <TokenField label="Señales de bajo interés" hint="Indicios de que el cliente no va a comprar" value={profile.lowIntentSignals} onChange={(v) => set('lowIntentSignals', v)} placeholder="Ej: solo mirando, no por ahora, te aviso…" />
            <TokenField label="Señales de compra en volumen" hint="Frases de compradores mayoristas o B2B" value={profile.bulkBuyerSignals} onChange={(v) => set('bulkBuyerSignals', v)} placeholder="Ej: para mi empresa, necesito 50 unidades, precio especial…" />
          </div>
        )}

        {tab === 'reglas' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <SectionTitle>Reglas del negocio — lo que el agente puede y no puede prometer</SectionTitle>
            <div />
            <TokenField label="Métodos de pago aceptados" value={profile.paymentMethods} onChange={(v) => set('paymentMethods', v)} placeholder="Transferencia, tarjeta, efectivo, PSE…" />
            <div className="sm:col-span-2">
              <InputField label="Política de envíos" hint="Cobertura, tiempos, costos" value={profile.shippingPolicy} onChange={(v) => set('shippingPolicy', v)} rows={2} placeholder="Ej: Envío gratis a todo Colombia en compras mayores a $150.000. Llega en 3-5 días hábiles." />
            </div>
            <InputField label="Política de descuentos" value={profile.discountPolicy} onChange={(v) => set('discountPolicy', v)} rows={2} placeholder="Ej: Solo descuentos preautorizados en campañas activas" />
            <InputField label="Política de negociación" value={profile.negotiationPolicy} onChange={(v) => set('negotiationPolicy', v)} rows={2} placeholder="Ej: No se negocian precios de forma individual. Escalar a gerente comercial." />
            <InputField label="Regla de inventario" value={profile.inventoryPromiseRule} onChange={(v) => set('inventoryPromiseRule', v)} rows={2} placeholder="Ej: Nunca confirmar stock sin verificar en sistema" />
            <InputField label="Regla de entrega" value={profile.deliveryPromiseRule} onChange={(v) => set('deliveryPromiseRule', v)} rows={2} placeholder="Ej: No prometer fechas exactas. Dar rango de 2-5 días." />
            <div className="sm:col-span-2">
              <InputField label="Resumen política de devoluciones" value={profile.returnPolicySummary} onChange={(v) => set('returnPolicySummary', v)} rows={2} placeholder="Ej: 30 días para cambios, producto sin uso, con empaque original" />
            </div>
            <TokenField label="Claims prohibidos" hint="Qué no puede afirmar el agente nunca" value={profile.forbiddenClaims} onChange={(v) => set('forbiddenClaims', v)} placeholder="Ej: somos los mejores del mercado, garantía ilimitada…" />
            <TokenField label="Promesas prohibidas" hint="Qué no puede prometer el agente" value={profile.forbiddenPromises} onChange={(v) => set('forbiddenPromises', v)} placeholder="Ej: entrega en 24h, precio más bajo garantizado…" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Human agent modal ─────────────────────────────────────────────────────────

function AgentModal({ open, onClose, onSuccess, editAgent }: {
  open: boolean; onClose: () => void; onSuccess: () => void; editAgent: AgentAdmin | null;
}) {
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState<AgentFormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!editAgent;

  useEffect(() => {
    if (open) {
      setForm(editAgent ? { nombre: editAgent.nombre, email: editAgent.email, password: '', confirmPassword: '', rol: editAgent.rol, changePassword: false } : EMPTY_FORM);
      setError('');
    }
  }, [open, editAgent]);

  if (!open) return null;

  function set(field: keyof AgentFormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(form, isEdit);
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        const payload: Partial<CreateAgentPayload> = { nombre: form.nombre, email: form.email, rol: form.rol };
        if (form.changePassword && form.password) payload.password = form.password;
        await api.updateAgent(editAgent.id, payload);
        showSuccess('Asesor actualizado', `${form.nombre} fue actualizado`);
      } else {
        await api.createAgent({ nombre: form.nombre, email: form.email, password: form.password, rol: form.rol });
        showSuccess('Asesor creado', `${form.nombre} fue agregado al equipo`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
      showError('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(17,17,16,0.40)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full sm:max-w-md rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-6 py-4">
          <h3 className="font-bold text-ink-900">{isEdit ? 'Editar asesor' : 'Nuevo asesor'}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-ink-400 transition hover:bg-[rgba(17,17,16,0.04)] hover:text-ink-600"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {[
            { field: 'nombre', label: 'Nombre *', type: 'text', placeholder: 'Nombre completo' },
            { field: 'email', label: 'Correo *', type: 'email', placeholder: 'correo@empresa.com' },
          ].map(({ field, label, type, placeholder }) => (
            <div key={field}>
              <label className="mb-1 block text-xs font-semibold text-ink-600">{label}</label>
              <input type={type} value={form[field as keyof AgentFormState] as string} onChange={(e) => set(field as keyof AgentFormState, e.target.value)}
                className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 outline-none transition focus:border-brand-400"
                placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">Rol</label>
            <select value={form.rol} onChange={(e) => set('rol', e.target.value)}
              className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 outline-none focus:border-brand-400">
              <option value="asesor">Asesor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {isEdit && (
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-600">
              <input type="checkbox" checked={form.changePassword} onChange={(e) => set('changePassword', e.target.checked)} className="rounded" />
              Cambiar contraseña
            </label>
          )}
          {(!isEdit || form.changePassword) && (
            <>
              {['password', 'confirmPassword'].map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-semibold text-ink-600">{field === 'password' ? 'Contraseña *' : 'Confirmar contraseña *'}</label>
                  <input type="password" value={form[field as keyof AgentFormState] as string} onChange={(e) => set(field as keyof AgentFormState, e.target.value)}
                    className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 outline-none focus:border-brand-400"
                    placeholder={field === 'password' ? 'Mínimo 8 caracteres' : 'Repetir contraseña'} />
                </div>
              ))}
            </>
          )}
          {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-[rgba(17,17,16,0.12)] bg-white/75 py-2 text-[13px] font-semibold text-ink-700 transition hover:bg-white">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear asesor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AgentsPage() {
  const { showSuccess, showError } = useNotification();
  const [agents, setAgents] = useState<AgentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<AgentAdmin | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<SalesAgentProfileState>(DEFAULT_PROFILE);
  const [salesMetrics, setSalesMetrics] = useState<SalesAgentMetricsApiItem | null>(null);
  const [activeTab, setActiveTab] = useState<AgentsTab>('ia');
  const [settings, setSettings] = useState<SalesAgentUiSettings>({
    enabled: true, autonomyLevel: 'semi_autonomo', followupMode: 'suave',
    maxFollowups: '1', recommendationDepth: '2', handoffMode: 'balanceado',
    maxResponseLength: 'standard',
  });

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      setAgents(await api.getAgents());
      setLoadError('');
    } catch {
      if (USE_MOCK_DATA) setAgents(mockAgents());
      else { setAgents([]); setLoadError('No se pudieron cargar asesores.'); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const p = await api.getOnboardingProfile();
        if (!mounted) return;
        setProfile(mapProfile(p));
        const sa = p.ai_preferences?.sales_agent;
        if (sa) setSettings({
          enabled: sa.enabled ?? true,
          autonomyLevel: sa.autonomy_level ?? 'semi_autonomo',
          followupMode: sa.followup_mode ?? 'suave',
          maxFollowups: String(sa.max_followups ?? 1) as SalesAgentUiSettings['maxFollowups'],
          recommendationDepth: String(sa.recommendation_depth ?? 2) as SalesAgentUiSettings['recommendationDepth'],
          handoffMode: sa.handoff_mode ?? 'balanceado',
          maxResponseLength: (sa.max_response_length ?? 'standard') as SalesAgentUiSettings['maxResponseLength'],
        });
      } catch { /* keep defaults */ }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    api.getSalesAgentMetrics().then((m) => { if (mounted) setSalesMetrics(m); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  function setProfileField<K extends keyof SalesAgentProfileState>(key: K, value: SalesAgentProfileState[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const currentProfile = await api.getOnboardingProfile();
      await api.updateOnboardingProfile({
        sales_agent_name: profile.name.trim() || 'Sales Agent',
        sales_agent_profile: {
          agent_persona: profile.agentPersona.trim(),
          what_you_sell: profile.whatYouSell.trim(),
          who_you_sell_to: profile.whoYouSellTo.trim(),
          mission_statement: profile.missionStatement.trim(),
          industry: profile.industry.trim(),
          country: profile.country.trim(),
          website: profile.website.trim(),
          response_language: profile.responseLanguage,
          greeting_message: profile.greetingMessage.trim(),
          competitor_response: profile.competitorResponse.trim(),
          payment_methods: profile.paymentMethods,
          shipping_policy: profile.shippingPolicy.trim(),
          brand_profile: {
            tone_of_voice: profile.toneOfVoice.trim(),
            formality_level: profile.formalityLevel,
            brand_personality: profile.brandPersonality.trim(),
            value_proposition: profile.valueProposition.trim(),
            key_differentiators: profile.keyDifferentiators,
            recommended_phrases: profile.recommendedPhrases,
            avoid_phrases: profile.avoidPhrases,
            preferred_closing_style: profile.preferredClosingStyle,
            urgency_style: profile.urgencyStyle,
          },
          sales_playbook: {
            opening_style: profile.openingStyle.trim(),
            recommendation_style: profile.recommendationStyle.trim(),
            objection_style: profile.objectionStyle.trim(),
            closing_style: profile.closingStyle.trim(),
            follow_up_style: profile.followUpStyle.trim(),
            upsell_style: profile.upsellStyle.trim(),
            escalate_conditions: profile.escalateConditions,
            competitor_response: profile.competitorResponse.trim(),
          },
          buyer_model: {
            ideal_buyers: profile.idealBuyers,
            common_objections: profile.commonObjections,
            purchase_signals: profile.purchaseSignals,
            low_intent_signals: profile.lowIntentSignals,
            bulk_buyer_signals: profile.bulkBuyerSignals,
          },
          commerce_rules: {
            payment_methods: profile.paymentMethods,
            shipping_policy: profile.shippingPolicy.trim(),
            discount_policy: profile.discountPolicy.trim(),
            negotiation_policy: profile.negotiationPolicy.trim(),
            inventory_promise_rule: profile.inventoryPromiseRule.trim(),
            delivery_promise_rule: profile.deliveryPromiseRule.trim(),
            return_policy_summary: profile.returnPolicySummary.trim(),
            forbidden_claims: profile.forbiddenClaims,
            forbidden_promises: profile.forbiddenPromises,
          },
        },
        ai_preferences: {
          ...(currentProfile.ai_preferences || {}),
          sales_agent: {
            enabled: settings.enabled,
            autonomy_level: settings.autonomyLevel,
            followup_mode: settings.followupMode,
            max_followups: Number(settings.maxFollowups) as 0 | 1 | 2,
            recommendation_depth: Number(settings.recommendationDepth) as 1 | 2 | 3,
            handoff_mode: settings.handoffMode,
            max_response_length: settings.maxResponseLength,
          },
        },
      });
      showSuccess('Sales Agent', 'Configuración guardada. El agente ya usa los cambios.');
    } catch (e) {
      showError('Sales Agent', e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally { setSaving(false); }
  }

  async function handleToggle(agent: AgentAdmin) {
    setTogglingId(agent.id);
    try {
      await api.toggleAgent(agent.id, !agent.activo);
      setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, activo: !a.activo } : a));
      showSuccess(agent.activo ? 'Desactivado' : 'Activado', agent.nombre);
    } catch {
      if (USE_MOCK_DATA) setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, activo: !a.activo } : a));
      else showError('Asesores', 'No se pudo actualizar el estado.');
    } finally { setTogglingId(null); setDeactivateId(null); }
  }

  const total = agents.length;
  const activos = agents.filter((a) => a.activo).length;
  const admins = agents.filter((a) => a.rol === 'admin').length;

  return (
    <div className="page-shell overflow-hidden">
      <div className="page-stack overflow-hidden">
        <PageHeader
          eyebrow="Equipo operativo"
          title="Agentes"
          description="Configura el Sales Agent IA y administra el equipo humano de asesores."
          meta={
            <div className="flex flex-wrap items-center gap-2">
              {[{ label: 'Asesores', value: total }, { label: 'Activos', value: activos }, { label: 'Admins', value: admins }].map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1 rounded-full bg-[rgba(17,17,16,0.05)] px-2.5 py-1 text-[11px] font-semibold text-ink-600">
                  <span className="text-ink-400">{item.label}</span>
                  <span className="text-ink-700">{item.value}</span>
                </span>
              ))}
            </div>
          }
          actions={
            activeTab === 'humanos' ? (
              <button onClick={() => { setEditAgent(null); setModalOpen(true); }}
                className="flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-[12px] font-semibold text-white shadow-card transition hover:bg-brand-600">
                <Plus size={14} /> Nuevo asesor
              </button>
            ) : undefined
          }
        />

        {!USE_MOCK_DATA && loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
        )}

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-1.5 shadow-card">
          {[{ key: 'ia', label: 'Agentes IA' }, { key: 'humanos', label: 'Asesores humanos' }].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as AgentsTab)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${activeTab === tab.key ? 'bg-ink-900 text-white shadow-card' : 'text-ink-500 hover:bg-[rgba(17,17,16,0.04)] hover:text-ink-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── IA tab ── */}
        {activeTab === 'ia' && (
          <div className="min-h-0 flex-1 grid gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_300px]">

            {/* Left — config */}
            <div className="min-h-0 flex flex-col overflow-hidden rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/80 shadow-card">
              {/* Agent cards row */}
              <div className="grid grid-cols-3 gap-2 border-b border-[rgba(17,17,16,0.07)] p-3">
                {[
                  { name: profile.name || 'Sales Agent', role: 'Vendedor conversacional', status: 'active', tone: 'bg-emerald-50 border-emerald-100', accent: 'text-emerald-700', icon: ShoppingCart },
                  { name: 'Marketing Agent', role: 'Campañas y reactivación', status: 'soon', tone: 'bg-amber-50 border-amber-100', accent: 'text-amber-700', icon: Megaphone },
                  { name: 'Operations Agent', role: 'Pedidos y postventa', status: 'soon', tone: 'bg-sky-50 border-sky-100', accent: 'text-sky-700', icon: Settings2 },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.name} className={`rounded-2xl border p-2.5 ${card.tone}`}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/90 shadow-sm flex-shrink-0">
                          <Icon size={13} className={card.accent} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-bold text-ink-900">{card.name}</p>
                          <p className="truncate text-[10px] text-ink-500">{card.role}</p>
                        </div>
                      </div>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${card.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-[rgba(17,17,16,0.06)] text-ink-400'}`}>
                        {card.status === 'active' ? 'Activo' : 'Próximo'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Config form */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.07)] px-4 py-2.5">
                  <div>
                    <p className="text-[13px] font-bold text-ink-900">Configuración del Sales Agent</p>
                    <p className="text-[11px] text-ink-400">Todo lo que configures aquí se inyecta directamente en el agente en cada conversación</p>
                  </div>
                  <button onClick={() => void handleSave()} disabled={saving}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
                <ConfigPanel profile={profile} set={setProfileField} />
              </div>
            </div>

            {/* Right sidebar — behavior + metrics */}
            <div className="flex flex-col gap-2.5 overflow-y-auto">

              {/* Behavior controls */}
              <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/80 p-3 shadow-card">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Comportamiento del agente</p>
                <div className="grid gap-2">
                  {[
                    { key: 'enabled', label: 'Estado', opts: [{ value: 'on', label: 'Activo' }, { value: 'off', label: 'Pausado' }] },
                    { key: 'autonomyLevel', label: 'Autonomía', opts: [{ value: 'asistido', label: 'Asistido' }, { value: 'semi_autonomo', label: 'Semi autónomo' }, { value: 'autonomo', label: 'Autónomo' }] },
                    { key: 'followupMode', label: 'Follow-up', opts: [{ value: 'apagado', label: 'Apagado' }, { value: 'suave', label: 'Suave' }, { value: 'activo', label: 'Activo' }] },
                    { key: 'maxFollowups', label: 'Máx follow-ups', opts: [{ value: '0', label: '0' }, { value: '1', label: '1' }, { value: '2', label: '2' }] },
                    { key: 'recommendationDepth', label: 'Recomendaciones', opts: [{ value: '1', label: '1 opción' }, { value: '2', label: '2 opciones' }, { value: '3', label: '3 opciones' }] },
                    { key: 'handoffMode', label: 'Escalado', opts: [{ value: 'temprano', label: 'Temprano' }, { value: 'balanceado', label: 'Balanceado' }, { value: 'estricto', label: 'Estricto' }] },
                    { key: 'maxResponseLength', label: 'Largo de respuesta', opts: [{ value: 'brief', label: 'Breve (1-2 frases)' }, { value: 'standard', label: 'Estándar' }, { value: 'detailed', label: 'Detallado' }] },
                  ].map(({ key, label, opts }) => (
                    <label key={key} className="rounded-2xl border border-[rgba(17,17,16,0.07)] bg-white/70 px-2.5 py-2">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.10em] text-ink-400">{label}</span>
                      <select
                        value={key === 'enabled' ? (settings.enabled ? 'on' : 'off') : settings[key as keyof SalesAgentUiSettings] as string}
                        onChange={(e) => {
                          if (key === 'enabled') setSettings((s) => ({ ...s, enabled: e.target.value === 'on' }));
                          else setSettings((s) => ({ ...s, [key]: e.target.value }));
                        }}
                        className="mt-0.5 w-full bg-transparent text-[12px] font-medium text-ink-700 outline-none"
                      >
                        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <button onClick={() => void handleSave()} disabled={saving}
                  className="mt-3 w-full rounded-2xl bg-emerald-600 py-2 text-[12px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                  {saving ? 'Guardando…' : 'Guardar configuración'}
                </button>
              </div>

              {/* Metrics */}
              <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/80 p-3 shadow-card">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Métricas recientes</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Ejecuciones', value: salesMetrics?.executions },
                    { label: 'Leads útiles', value: salesMetrics?.qualified_leads },
                    { label: 'Follow-ups', value: salesMetrics?.followups_created },
                    { label: 'Handoffs', value: salesMetrics?.handoffs },
                    { label: 'Confianza', value: salesMetrics ? `${salesMetrics.avg_confidence_pct}%` : undefined },
                    { label: 'Con producto', value: salesMetrics?.product_recommendations },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border border-[rgba(17,17,16,0.06)] bg-white/80 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.10em] text-ink-400">{label}</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-ink-800">{value !== undefined ? String(value) : '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connections */}
              <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/80 p-3 shadow-card">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">Se conecta con</p>
                <div className="space-y-1.5">
                  {[
                    { title: 'Catálogo', text: 'Productos, precios, stock, promociones', href: '/products' },
                    { title: 'Knowledge Base', text: 'FAQs, objeciones, voz de marca', href: '/knowledge-base' },
                    { title: 'Flujos', text: 'Flows estructurados por canal', href: '/flows' },
                  ].map((item) => (
                    <a key={item.title} href={item.href}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-[rgba(17,17,16,0.06)] bg-white/80 px-3 py-2 transition hover:bg-white">
                      <div>
                        <p className="text-[12px] font-semibold text-ink-800">{item.title}</p>
                        <p className="text-[10px] text-ink-400">{item.text}</p>
                      </div>
                      <ChevronRight size={13} className="text-ink-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Human tab ── */}
        {activeTab === 'humanos' && (
          <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card">
            <div className="h-full overflow-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-[rgba(17,17,16,0.06)] bg-[rgba(17,17,16,0.02)]">
                    {['Asesor', 'Email', 'Rol', 'Estado', 'Acciones'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[rgba(17,17,16,0.06)]">
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                      {[40, 16, 14, 20].map((w, j) => <td key={j} className="px-4 py-3"><Skeleton className={`h-4 w-${w}`} /></td>)}
                    </tr>
                  )) : agents.map((agent) => (
                    <tr key={agent.id} className="border-b border-[rgba(17,17,16,0.06)] transition hover:bg-[rgba(255,255,255,0.30)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{getInitials(agent.nombre)}</div>
                          <span className="text-sm font-semibold text-ink-900">{agent.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-600">{agent.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${agent.rol === 'admin' ? 'bg-violet-100/80 text-violet-800' : 'bg-sky-100/80 text-sky-800'}`}>
                          {agent.rol === 'admin' ? 'Admin' : 'Asesor'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${agent.activo ? 'bg-emerald-100/80 text-emerald-800' : 'bg-[rgba(17,17,16,0.04)] text-ink-500'}`}>
                          {agent.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {deactivateId === agent.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-600">¿{agent.activo ? 'Desactivar' : 'Activar'}?</span>
                            <button onClick={() => void handleToggle(agent)} className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-200">Confirmar</button>
                            <button onClick={() => setDeactivateId(null)} className="rounded-full bg-[rgba(17,17,16,0.04)] px-2 py-1 text-[11px] font-bold text-ink-600 hover:bg-[rgba(17,17,16,0.08)]">Cancelar</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditAgent(agent); setModalOpen(true); }}
                              className="flex items-center gap-1 rounded-full border border-[rgba(17,17,16,0.12)] bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-ink-700 hover:bg-white">
                              <Pencil size={11} /> Editar
                            </button>
                            <button onClick={() => setDeactivateId(agent.id)} disabled={togglingId === agent.id}
                              className="flex items-center gap-1 rounded-full border border-[rgba(17,17,16,0.12)] bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-ink-700 hover:bg-white disabled:opacity-50">
                              {agent.activo ? <><ToggleRight size={13} className="text-emerald-600" /> Desactivar</> : <><ToggleLeft size={13} /> Activar</>}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && agents.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-400">Aún no hay asesores en esta organización.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AgentModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchAgents} editAgent={editAgent} />
      </div>
    </div>
  );
}
