import { useState } from 'react';
import { GitBranch, Plus, X, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockRoutingRules } from '../../data/mock';
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

const advisorStats = [
  { nombre: 'Carlos Pérez', activas: 3, enCola: 1, max: 5, status: 'Disponible', statusColor: 'bg-emerald-100 text-emerald-700' },
  { nombre: 'Laura Gutiérrez', activas: 5, enCola: 0, max: 5, status: 'Ocupado', statusColor: 'bg-amber-100 text-amber-700' },
  { nombre: 'Andrés Morales', activas: 2, enCola: 0, max: 5, status: 'Disponible', statusColor: 'bg-emerald-100 text-emerald-700' },
  { nombre: 'Diana Suárez', activas: 4, enCola: 2, max: 5, status: 'Ocupado', statusColor: 'bg-amber-100 text-amber-700' },
];

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
  const [rules, setRules] = useState<RoutingRule[]>(mockRoutingRules);
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
          <GitBranch className="text-sky-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enrutamiento Inteligente</h1>
          <p className="text-sm text-slate-500">Configura cómo se asignan las conversaciones a los asesores</p>
        </div>
      </div>

      {/* Section 1: Estrategia */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <p className="font-bold text-slate-900">Estrategia de asignación</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {STRATEGIES.map((s) => (
            <label
              key={s.key}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${
                strategy === s.key
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
                  <span className="text-sm font-semibold text-slate-900">{s.label}</span>
                  {s.badge && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {s.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={() => showSuccess('Estrategia de enrutamiento guardada')}
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          Guardar estrategia
        </button>
      </div>

      {/* Section 2: Reglas de enrutamiento */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="font-bold text-slate-900">Reglas activas</p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
          >
            <Plus size={13} /> Nueva regla
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
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
                <tr key={rule.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-slate-300 cursor-grab">
                    <GripVertical size={14} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {rule.prioridad}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 font-mono text-xs">{rule.condicion}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{rule.accion}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleRule(rule.id)} className="transition">
                      {rule.activo
                        ? <ToggleRight size={20} className="text-brand-600" />
                        : <ToggleLeft size={20} className="text-slate-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition"
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <p className="font-bold text-slate-900">Colas de espera</p>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
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
          <p className="text-xs text-slate-500">
            <span className="font-bold text-slate-900">{queueWait} min</span> — se notifica al supervisor si no hay asesor disponible
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Mensaje cuando el afiliado entra en cola</label>
          <textarea
            rows={3}
            value={queueMessage}
            onChange={(e) => setQueueMessage(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Máximo de conversaciones simultáneas por asesor</label>
          <input
            type="number"
            min={1}
            max={20}
            value={maxSimultaneous}
            onChange={(e) => setMaxSimultaneous(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700">Habilitar auto-asignación</label>
          <button onClick={() => setAutoAssign((v) => !v)} className="transition">
            {autoAssign
              ? <ToggleRight size={22} className="text-brand-600" />
              : <ToggleLeft size={22} className="text-slate-400" />
            }
          </button>
          <span className={`text-xs font-semibold ${autoAssign ? 'text-brand-600' : 'text-slate-400'}`}>
            {autoAssign ? 'Activado' : 'Desactivado'}
          </span>
        </div>

        <button
          onClick={() => showSuccess('Configuración de colas guardada')}
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          Guardar configuración de colas
        </button>
      </div>

      {/* Section 4: Estadísticas */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <p className="font-bold text-slate-900">Estadísticas de enrutamiento</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Asignación automática', value: '91%', color: 'text-emerald-600' },
            { label: 'Tiempo promedio espera', value: '1.8 min', color: 'text-brand-600' },
            { label: 'Reasignaciones', value: '3%', color: 'text-amber-600' },
            { label: 'SLA cumplido', value: '94%', color: 'text-emerald-600' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-slate-50 p-4 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">Asesor</th>
                <th className="px-4 py-3 text-right">Activas</th>
                <th className="px-4 py-3 text-right">En cola</th>
                <th className="px-4 py-3 text-right">Capacidad</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {advisorStats.map((a) => (
                <tr key={a.nombre} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{a.nombre}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">{a.activas}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">{a.enCola}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-500">{a.max} max</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.statusColor}`}>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">Nueva regla de enrutamiento</p>
                <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>

              {/* Condición */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Condición</label>
                <div className="flex gap-2">
                  <select
                    value={newRule.condField}
                    onChange={(e) => setNewRule((r) => ({ ...r, condField: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    {['Canal', 'Intención', 'Sentimiento', 'Hora', 'Día semana'].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                  <select
                    value={newRule.condOp}
                    onChange={(e) => setNewRule((r) => ({ ...r, condOp: e.target.value }))}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
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
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>

              {/* Acción */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Acción</label>
                <select
                  value={newRule.accion}
                  onChange={(e) => setNewRule((r) => ({ ...r, accion: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {['Asignar a asesor', 'Asignar a grupo', 'Escalar', 'Auto-responder', 'Notificar supervisor'].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Prioridad */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prioridad</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={newRule.prioridad}
                  onChange={(e) => setNewRule((r) => ({ ...r, prioridad: Number(e.target.value) }))}
                  className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              {/* Activo toggle */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">Activo</label>
                <button onClick={() => setNewRule((r) => ({ ...r, activo: !r.activo }))}>
                  {newRule.activo
                    ? <ToggleRight size={22} className="text-brand-600" />
                    : <ToggleLeft size={22} className="text-slate-400" />
                  }
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button onClick={handleCreateRule} className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition">
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
