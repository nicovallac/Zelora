import { useState } from 'react';
import { GitBranch, Plus, X, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';

type Strategy = 'round_robin' | 'carga' | 'especializacion' | 'ia_mixto';

interface RoutingRule {
  id: string;
  prioridad: number;
  condicion: string;
  accion: string;
  activo: boolean;
}

interface NewRule {
  condField: string;
  condOp: string;
  condValue: string;
  accion: string;
  prioridad: number;
  activo: boolean;
}

const STRATEGIES: { key: Strategy; icon: string; label: string; desc: string; badge?: string }[] = [
  { key: 'round_robin', icon: '🔄', label: 'Round Robin', desc: 'Distribuye equitativamente entre todos los asesores disponibles' },
  { key: 'carga', icon: '⚡', label: 'Por carga', desc: 'Asigna al asesor con menos conversaciones activas' },
  { key: 'especializacion', icon: '🎯', label: 'Por especialización', desc: 'Asigna según las habilidades del asesor' },
  { key: 'ia_mixto', icon: '🧠', label: 'IA Mixto', desc: 'Combina carga, especialización e historial con IA', badge: 'Recomendado' },
];

const advisorStats: Array<{ nombre: string; activas: number; enCola: number; max: number; status: string; statusColor: string }> = [];

const defaultNewRule: NewRule = {
  condField: 'Canal',
  condOp: '=',
  condValue: '',
  accion: 'Asignar a asesor',
  prioridad: 6,
  activo: true,
};

export function RoutingPage() {
  const { showSuccess, showInfo } = useNotification();
  const [strategy, setStrategy] = useState<Strategy>('carga');
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRule, setNewRule] = useState<NewRule>({ ...defaultNewRule });

  // Queue config
  const [queueWait, setQueueWait] = useState(10);
  const [queueMessage, setQueueMessage] = useState('Estamos atendiendo tu solicitud, un asesor estará contigo en breve...');
  const [maxSimultaneous, setMaxSimultaneous] = useState(5);
  const [autoAssign, setAutoAssign] = useState(true);

  function handleToggleRule(id: string) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, activo: !r.activo } : r));
    showInfo('Estado de la regla actualizado');
  }

  function handleDeleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    showInfo('Regla eliminada');
  }

  function handleCreateRule() {
    const rule: RoutingRule = {
      id: `rr${Date.now()}`,
      prioridad: newRule.prioridad,
      condicion: `${newRule.condField} ${newRule.condOp} ${newRule.condValue}`,
      accion: newRule.accion,
      activo: newRule.activo,
    };
    setRules((prev) => [...prev, rule].sort((a, b) => a.prioridad - b.prioridad));
    setModalOpen(false);
    setNewRule({ ...defaultNewRule });
    showSuccess('Regla creada');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100">
          <GitBranch className="text-sky-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Enrutamiento Inteligente</h1>
          <p className="text-sm text-ink-500">Configura cómo se asignan las conversaciones a los asesores</p>
        </div>
      </div>

      {/* Section 1: Estrategia */}
      <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-6 shadow-card backdrop-blur-sm space-y-4">
        <p className="font-bold text-ink-900">Estrategia de asignación</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {STRATEGIES.map((s) => (
            <label
              key={s.key}
              className={`flex items-start gap-3 rounded-2xl border-2 p-4 cursor-pointer transition ${
                strategy === s.key
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-[rgba(17,17,16,0.08)] hover:border-[rgba(17,17,16,0.12)] hover:bg-[rgba(17,17,16,0.02)]'
              }`}
            >
              <input
                type="radio"
                name="strategy"
                value={s.key}
                checked={strategy === s.key}
                onChange={() => setStrategy(s.key)}
                className="mt-0.5 accent-brand-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span>{s.icon}</span>
                  <span className="text-sm font-semibold text-ink-900">{s.label}</span>
                  {s.badge && (
                    <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                      {s.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500 mt-0.5">{s.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={() => showSuccess('Estrategia de enrutamiento guardada')}
          className="rounded-full bg-brand-500 px-5 py-2 text-[13px] font-semibold text-white hover:bg-brand-500 shadow-card transition"
        >
          Guardar estrategia
        </button>
      </div>

      {/* Section 2: Reglas de enrutamiento */}
      <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 shadow-card backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-[rgba(17,17,16,0.06)] px-6 py-4">
          <p className="font-bold text-ink-900">Reglas activas</p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-500 shadow-card transition"
          >
            <Plus size={13} /> Nueva regla
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(17,17,16,0.06)] text-left text-xs font-semibold text-ink-500">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Condición</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-[rgba(17,17,16,0.06)] hover:bg-[rgba(255,255,255,0.30)] transition">
                  <td className="px-4 py-3 text-ink-400 cursor-grab">
                    <GripVertical size={14} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {rule.prioridad}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-900 font-mono text-xs">{rule.condicion}</td>
                  <td className="px-4 py-3 text-sm text-ink-700">{rule.accion}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleRule(rule.id)} className="transition">
                      {rule.activo
                        ? <ToggleRight size={20} className="text-brand-600" />
                        : <ToggleLeft size={20} className="text-ink-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Colas de espera */}
      <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-6 shadow-card backdrop-blur-sm space-y-5">
        <p className="font-bold text-ink-900">Colas de espera</p>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink-700">
            Tiempo máximo en cola antes de notificar supervisor
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={queueWait}
            onChange={(e) => setQueueWait(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
          <p className="text-xs text-ink-500">
            <span className="font-bold text-ink-900">{queueWait} min</span> — se notifica al supervisor si no hay asesor disponible
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink-700">Mensaje cuando el afiliado entra en cola</label>
          <textarea
            rows={3}
            value={queueMessage}
            onChange={(e) => setQueueMessage(e.target.value)}
            className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink-700">Máximo de conversaciones simultáneas por asesor</label>
          <input
            type="number"
            min={1}
            max={20}
            value={maxSimultaneous}
            onChange={(e) => setMaxSimultaneous(Number(e.target.value))}
            className="w-24 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-ink-700">Habilitar auto-asignación</label>
          <button onClick={() => setAutoAssign((v) => !v)} className="transition">
            {autoAssign
              ? <ToggleRight size={22} className="text-brand-600" />
              : <ToggleLeft size={22} className="text-ink-400" />
            }
          </button>
          <span className={`text-xs font-semibold ${autoAssign ? 'text-brand-600' : 'text-ink-400'}`}>
            {autoAssign ? 'Activado' : 'Desactivado'}
          </span>
        </div>

        <button
          onClick={() => showSuccess('Configuración de colas guardada')}
          className="rounded-full bg-brand-500 px-5 py-2 text-[13px] font-semibold text-white hover:bg-brand-500 shadow-card transition"
        >
          Guardar configuración de colas
        </button>
      </div>

      {/* Section 4: Estadísticas */}
      <div className="rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-6 shadow-card backdrop-blur-sm space-y-5">
        <p className="font-bold text-ink-900">Estadísticas de enrutamiento</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Asignación automática', value: '91%', color: 'text-emerald-600' },
            { label: 'Tiempo promedio espera', value: '1.8 min', color: 'text-brand-600' },
            { label: 'Reasignaciones', value: '3%', color: 'text-amber-600' },
            { label: 'SLA cumplido', value: '94%', color: 'text-emerald-600' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[rgba(17,17,16,0.07)] bg-[rgba(255,255,255,0.50)] p-4 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-ink-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(17,17,16,0.06)] text-left text-xs font-semibold text-ink-500">
                <th className="px-4 py-3">Asesor</th>
                <th className="px-4 py-3 text-right">Activas</th>
                <th className="px-4 py-3 text-right">En cola</th>
                <th className="px-4 py-3 text-right">Capacidad</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {advisorStats.map((a) => (
                <tr key={a.nombre} className="border-b border-[rgba(17,17,16,0.06)] hover:bg-[rgba(255,255,255,0.30)] transition">
                  <td className="px-4 py-3 text-sm font-medium text-ink-900">{a.nombre}</td>
                  <td className="px-4 py-3 text-right text-sm text-ink-700">{a.activas}</td>
                  <td className="px-4 py-3 text-right text-sm text-ink-700">{a.enCola}</td>
                  <td className="px-4 py-3 text-right text-sm text-ink-500">{a.max} max</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${a.statusColor}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New rule modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(17,17,16,0.45)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[rgba(17,17,16,0.08)] bg-white/70 p-6 shadow-card backdrop-blur-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-ink-900">Nueva regla de enrutamiento</p>
                <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-[rgba(17,17,16,0.04)]">
                  <X size={16} />
                </button>
              </div>

              {/* Condición */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Condición</label>
                <div className="flex gap-2">
                  <select
                    value={newRule.condField}
                    onChange={(e) => setNewRule((r) => ({ ...r, condField: e.target.value }))}
                    className="flex-1 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2 text-[13px] text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    {['Canal', 'Intención', 'Sentimiento', 'Hora', 'Día semana'].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                  <select
                    value={newRule.condOp}
                    onChange={(e) => setNewRule((r) => ({ ...r, condOp: e.target.value }))}
                    className="w-16 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-2 py-2 text-[13px] text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    {['=', '≠', '>', '<'].map((op) => (
                      <option key={op}>{op}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Valor"
                    value={newRule.condValue}
                    onChange={(e) => setNewRule((r) => ({ ...r, condValue: e.target.value }))}
                    className="flex-1 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>

              {/* Acción */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Acción</label>
                <select
                  value={newRule.accion}
                  onChange={(e) => setNewRule((r) => ({ ...r, accion: e.target.value }))}
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {['Asignar a asesor', 'Asignar a grupo', 'Escalar', 'Auto-responder', 'Notificar supervisor'].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Prioridad */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Prioridad</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={newRule.prioridad}
                  onChange={(e) => setNewRule((r) => ({ ...r, prioridad: Number(e.target.value) }))}
                  className="w-24 rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              {/* Activo toggle */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-ink-700">Activo</label>
                <button onClick={() => setNewRule((r) => ({ ...r, activo: !r.activo }))}>
                  {newRule.activo
                    ? <ToggleRight size={22} className="text-brand-600" />
                    : <ToggleLeft size={22} className="text-ink-400" />
                  }
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setModalOpen(false)} className="flex-1 rounded-full border border-[rgba(17,17,16,0.12)] bg-white/75 py-2 text-[13px] font-semibold text-ink-700 hover:bg-white transition">
                  Cancelar
                </button>
                <button onClick={handleCreateRule} className="flex-1 rounded-full bg-brand-500 py-2 text-[13px] font-semibold text-white hover:bg-brand-500 shadow-card transition">
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
