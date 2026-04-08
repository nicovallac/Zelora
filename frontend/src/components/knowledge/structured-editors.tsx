import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

// ── shared primitives — aligned to app design system ─────────────────────────

const inputCls =
  'w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white';

const textareaCls =
  'w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2.5 text-[13px] leading-relaxed text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white resize-none';

const sectionLabelCls =
  'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400';

const eyebrowCls =
  'text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-400';

const entryCls =
  'rounded-2xl border border-[rgba(17,17,16,0.08)] bg-[rgba(17,17,16,0.018)] p-3.5';

const addBtnCls =
  'flex items-center gap-1.5 self-start rounded-full border border-dashed border-[rgba(17,17,16,0.15)] bg-white/60 px-3.5 py-1.5 text-[12px] font-semibold text-ink-500 transition hover:border-brand-400 hover:bg-white hover:text-brand-600 active:scale-95';

function EntryHeader({
  label,
  showDelete,
  onDelete,
}: {
  label: string;
  showDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className={eyebrowCls}>{label}</span>
      {showDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-5 w-5 items-center justify-center rounded-full text-ink-300 transition hover:bg-red-50 hover:text-red-400"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className={`mt-2.5 ${sectionLabelCls}`}>{children}</label>;
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

interface FaqPair { question: string; answer: string }

function parseFaq(text: string): FaqPair[] {
  if (!text.trim()) return [{ question: '', answer: '' }];
  const blocks = text.split(/\n\n+/);
  const pairs = blocks.flatMap((block): FaqPair[] => {
    const qMatch = block.match(/^P:\s*(.+)/m);
    const aMatch = block.match(/^R:\s*([\s\S]+)/m);
    if (qMatch) return [{ question: qMatch[1].trim(), answer: aMatch ? aMatch[1].trim() : '' }];
    return [];
  }).filter((p) => p.question || p.answer);
  return pairs.length ? pairs : [{ question: '', answer: '' }];
}

function serializeFaq(pairs: FaqPair[]): string {
  return pairs
    .filter((p) => p.question.trim() || p.answer.trim())
    .map((p) => `P: ${p.question}\nR: ${p.answer}`)
    .join('\n\n');
}

export function FaqEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [pairs, setPairs] = useState<FaqPair[]>(() => parseFaq(value));

  function update(next: FaqPair[]) {
    setPairs(next);
    onChange(serializeFaq(next));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {pairs.map((pair, i) => (
        <div key={i} className={entryCls}>
          <EntryHeader
            label={`Pregunta ${i + 1}`}
            showDelete={pairs.length > 1}
            onDelete={() => update(pairs.filter((_, j) => j !== i))}
          />
          <label className={sectionLabelCls}>Pregunta</label>
          <input
            value={pair.question}
            onChange={(e) => update(pairs.map((p, j) => j === i ? { ...p, question: e.target.value } : p))}
            placeholder="¿Cuánto cuesta el servicio?"
            className={inputCls}
          />
          <FieldLabel>Respuesta</FieldLabel>
          <textarea
            value={pair.answer}
            onChange={(e) => update(pairs.map((p, j) => j === i ? { ...p, answer: e.target.value } : p))}
            rows={3}
            placeholder="Desde $50,000 al mes, sin contratos anuales."
            className={textareaCls}
          />
        </div>
      ))}
      <button type="button" onClick={() => update([...pairs, { question: '', answer: '' }])} className={addBtnCls}>
        <Plus size={12} />
        Agregar pregunta
      </button>
    </div>
  );
}

// ── Business ──────────────────────────────────────────────────────────────────

interface BusinessFields { offer: string; who: string; why: string; differentiators: string }

function parseBusiness(text: string): BusinessFields {
  const get = (label: string) => {
    const m = text.match(new RegExp(`${label}:\\s*([^\n]+)`));
    return m ? m[1].trim() : '';
  };
  return {
    offer:           get('Qué ofrecemos'),
    who:             get('Para quién'),
    why:             get('Por qué elegirnos'),
    differentiators: get('Diferenciadores'),
  };
}

function serializeBusiness(f: BusinessFields): string {
  return [
    f.offer           && `Qué ofrecemos: ${f.offer}`,
    f.who             && `Para quién: ${f.who}`,
    f.why             && `Por qué elegirnos: ${f.why}`,
    f.differentiators && `Diferenciadores: ${f.differentiators}`,
  ].filter(Boolean).join('\n');
}

const BUSINESS_FIELDS: { key: keyof BusinessFields; label: string; placeholder: string }[] = [
  { key: 'offer',           label: 'Qué ofrecemos',     placeholder: 'Software de gestión para restaurantes con integración POS' },
  { key: 'who',             label: 'Para quién',         placeholder: 'Dueños de restaurantes con 1 a 5 locales en LATAM' },
  { key: 'why',             label: 'Por qué elegirnos',  placeholder: 'Onboarding en 1 día, soporte 24/7, precio fijo sin sorpresas' },
  { key: 'differentiators', label: 'Diferenciadores',    placeholder: 'Sin contratos, soporte en español, integración con Rappi y PedidosYa' },
];

export function BusinessEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [fields, setFields] = useState<BusinessFields>(() => parseBusiness(value));

  function update(key: keyof BusinessFields, val: string) {
    const next = { ...fields, [key]: val };
    setFields(next);
    onChange(serializeBusiness(next));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {BUSINESS_FIELDS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className={sectionLabelCls}>{label}</label>
          <textarea
            value={fields[key]}
            onChange={(e) => update(key, e.target.value)}
            rows={2}
            placeholder={placeholder}
            className={textareaCls}
          />
        </div>
      ))}
    </div>
  );
}

// ── Sales Scripts ─────────────────────────────────────────────────────────────

interface ScriptEntry { objection: string; response: string; closing: string }

function parseSalesScripts(text: string): ScriptEntry[] {
  if (!text.trim()) return [{ objection: '', response: '', closing: '' }];
  const blocks = text.split(/\n\n+/);
  const entries = blocks.flatMap((block): ScriptEntry[] => {
    const oMatch = block.match(/^Objeción:\s*(.+)/m);
    const rMatch = block.match(/^Respuesta:\s*([\s\S]+?)(?=\nCierre:|$)/m);
    const cMatch = block.match(/^Cierre:\s*(.+)/m);
    if (oMatch) return [{
      objection: oMatch[1].trim(),
      response:  rMatch ? rMatch[1].trim() : '',
      closing:   cMatch ? cMatch[1].trim() : '',
    }];
    return [];
  }).filter((e) => e.objection || e.response);
  return entries.length ? entries : [{ objection: '', response: '', closing: '' }];
}

function serializeSalesScripts(entries: ScriptEntry[]): string {
  return entries
    .filter((e) => e.objection.trim() || e.response.trim())
    .map((e) => `Objeción: ${e.objection}\nRespuesta: ${e.response}\nCierre: ${e.closing}`)
    .join('\n\n');
}

export function SalesScriptsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [entries, setEntries] = useState<ScriptEntry[]>(() => parseSalesScripts(value));

  function update(next: ScriptEntry[]) {
    setEntries(next);
    onChange(serializeSalesScripts(next));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((entry, i) => (
        <div key={i} className={entryCls}>
          <EntryHeader
            label={`Script ${i + 1}`}
            showDelete={entries.length > 1}
            onDelete={() => update(entries.filter((_, j) => j !== i))}
          />
          <label className={sectionLabelCls}>Objeción del cliente</label>
          <input
            value={entry.objection}
            onChange={(e) => update(entries.map((en, j) => j === i ? { ...en, objection: e.target.value } : en))}
            placeholder='"está muy caro"'
            className={inputCls}
          />
          <FieldLabel>Cómo responder</FieldLabel>
          <textarea
            value={entry.response}
            onChange={(e) => update(entries.map((en, j) => j === i ? { ...en, response: e.target.value } : en))}
            rows={3}
            placeholder="Entiendo que el precio importa. Comparado con X, nosotros incluimos soporte sin costo adicional..."
            className={textareaCls}
          />
          <FieldLabel>Frase de cierre</FieldLabel>
          <input
            value={entry.closing}
            onChange={(e) => update(entries.map((en, j) => j === i ? { ...en, closing: e.target.value } : en))}
            placeholder="¿Te muestro exactamente qué incluye cada plan?"
            className={inputCls}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => update([...entries, { objection: '', response: '', closing: '' }])}
        className={addBtnCls}
      >
        <Plus size={12} />
        Agregar objeción
      </button>
    </div>
  );
}

// ── Policy ────────────────────────────────────────────────────────────────────

interface PolicyEntry { name: string; conditions: string; exceptions: string }

function parsePolicies(text: string): PolicyEntry[] {
  if (!text.trim()) return [{ name: '', conditions: '', exceptions: '' }];
  const blocks = text.split(/\n\n+/);
  const entries = blocks.flatMap((block): PolicyEntry[] => {
    const nMatch = block.match(/^Política:\s*(.+)/m);
    const cMatch = block.match(/^Condiciones:\s*([\s\S]+?)(?=\nExcepciones:|$)/m);
    const eMatch = block.match(/^Excepciones:\s*(.+)/m);
    if (nMatch) return [{
      name:       nMatch[1].trim(),
      conditions: cMatch ? cMatch[1].trim() : '',
      exceptions: eMatch ? eMatch[1].trim() : '',
    }];
    return [];
  }).filter((e) => e.name || e.conditions);
  return entries.length ? entries : [{ name: '', conditions: '', exceptions: '' }];
}

function serializePolicies(entries: PolicyEntry[]): string {
  return entries
    .filter((e) => e.name.trim() || e.conditions.trim())
    .map((e) => `Política: ${e.name}\nCondiciones: ${e.conditions}\nExcepciones: ${e.exceptions}`)
    .join('\n\n');
}

export function PolicyEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [entries, setEntries] = useState<PolicyEntry[]>(() => parsePolicies(value));

  function update(next: PolicyEntry[]) {
    setEntries(next);
    onChange(serializePolicies(next));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((entry, i) => (
        <div key={i} className={entryCls}>
          <EntryHeader
            label={`Política ${i + 1}`}
            showDelete={entries.length > 1}
            onDelete={() => update(entries.filter((_, j) => j !== i))}
          />
          <label className={sectionLabelCls}>Nombre</label>
          <input
            value={entry.name}
            onChange={(e) => update(entries.map((en, j) => j === i ? { ...en, name: e.target.value } : en))}
            placeholder="Devoluciones"
            className={inputCls}
          />
          <FieldLabel>Condiciones</FieldLabel>
          <textarea
            value={entry.conditions}
            onChange={(e) => update(entries.map((en, j) => j === i ? { ...en, conditions: e.target.value } : en))}
            rows={3}
            placeholder="Se aceptan dentro de los 30 días con empaque original y comprobante de compra."
            className={textareaCls}
          />
          <FieldLabel>Excepciones</FieldLabel>
          <input
            value={entry.exceptions}
            onChange={(e) => update(entries.map((en, j) => j === i ? { ...en, exceptions: e.target.value } : en))}
            placeholder="Productos personalizados y ofertas especiales no aplican."
            className={inputCls}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => update([...entries, { name: '', conditions: '', exceptions: '' }])}
        className={addBtnCls}
      >
        <Plus size={12} />
        Agregar política
      </button>
    </div>
  );
}
