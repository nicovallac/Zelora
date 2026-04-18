import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SHORTCUTS = [
  {
    section: 'Navegar',
    items: [
      { keys: ['G', 'D'], label: 'Dashboard' },
      { keys: ['G', 'I'], label: 'Inbox' },
      { keys: ['G', 'P'], label: 'Catálogo de productos' },
      { keys: ['G', 'K'], label: 'Base de conocimiento' },
      { keys: ['G', 'F'], label: 'Flujos' },
      { keys: ['G', 'C'], label: 'Canales' },
      { keys: ['G', 'A'], label: 'Analytics' },
    ],
  },
  {
    section: 'General',
    items: [
      { keys: ['?'], label: 'Mostrar atajos' },
      { keys: ['Esc'], label: 'Cerrar modal / panel' },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md rounded-3xl p-6"
            style={{
              background: 'rgba(255,255,255,0.96)',
              border: '1px solid rgba(17,17,16,0.08)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
            }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-ink-900" style={{ letterSpacing: '-0.01em' }}>
                  Atajos de teclado
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-400">
                  Presiona <Kbd>G</Kbd> + una tecla para navegar rápidamente
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-xl p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Sections */}
            <div className="space-y-5">
              {SHORTCUTS.map((section) => (
                <div key={section.section}>
                  <p
                    className="mb-2 text-[9px] font-bold uppercase text-ink-400"
                    style={{ letterSpacing: '0.14em' }}
                  >
                    {section.section}
                  </p>
                  <div className="space-y-1">
                    {section.items.map(({ keys, label }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl px-3 py-2"
                        style={{ background: 'rgba(17,17,16,0.03)' }}
                      >
                        <span className="text-[13px] text-ink-700">{label}</span>
                        <div className="flex items-center gap-1">
                          {keys.map((k, i) => (
                            <span key={k} className="flex items-center gap-1">
                              {i > 0 && (
                                <span className="text-[10px] text-ink-300">then</span>
                              )}
                              <Kbd>{k}</Kbd>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-ink-600"
      style={{
        background: '#fff',
        border: '1px solid rgba(17,17,16,0.15)',
        boxShadow: '0 1px 0 rgba(17,17,16,0.10)',
        minWidth: '22px',
      }}
    >
      {children}
    </kbd>
  );
}
