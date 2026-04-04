import { useEffect, useState } from 'react';
import type { WhatsAppSettings } from '../../data/whatsapp-management';

export function SettingsForm({
  initialValues,
  onSave,
}: {
  initialValues: WhatsAppSettings;
  onSave: (values: WhatsAppSettings) => void;
}) {
  const [values, setValues] = useState<WhatsAppSettings>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function updateValue<K extends keyof WhatsAppSettings>(key: K, value: WhatsAppSettings[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="rounded-[24px] border border-[rgba(255,255,255,0.55)] border-b-[rgba(17,17,16,0.08)] bg-white/65 backdrop-blur-md p-6 shadow-card">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-400">Default send behavior</span>
          <select
            value={values.defaultSendBehavior}
            onChange={(e) => updateValue('defaultSendBehavior', e.target.value as WhatsAppSettings['defaultSendBehavior'])}
            className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            <option value="assistant_first">Assistant first</option>
            <option value="human_first">Human first</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-400">Fallback handling</span>
          <select
            value={values.fallbackHandling}
            onChange={(e) => updateValue('fallbackHandling', e.target.value as WhatsAppSettings['fallbackHandling'])}
            className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            <option value="router_decides">Router decides</option>
            <option value="queue_human">Queue human</option>
          </select>
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3">
          <span className="text-sm font-semibold text-ink-700">Auto sync templates</span>
          <input type="checkbox" checked={values.autoSyncTemplates} onChange={(e) => updateValue('autoSyncTemplates', e.target.checked)} />
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-[rgba(17,17,16,0.09)] px-4 py-3">
          <span className="text-sm font-semibold text-ink-700">Alert on webhook failure</span>
          <input type="checkbox" checked={values.alertOnWebhookFailure} onChange={(e) => updateValue('alertOnWebhookFailure', e.target.checked)} />
        </label>
      </div>
      <div className="mt-4 grid gap-4">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-400">Internal label</span>
          <input
            value={values.internalLabel}
            onChange={(e) => updateValue('internalLabel', e.target.value)}
            className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-400">Internal notes</span>
          <textarea
            value={values.internalNotes}
            onChange={(e) => updateValue('internalNotes', e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>
      </div>
      <button
        onClick={() => onSave(values)}
        className="mt-5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        Guardar ajustes
      </button>
    </div>
  );
}
