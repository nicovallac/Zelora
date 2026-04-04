import { useRef, useState } from 'react';
import { FileText, Link2, Loader2, Paperclip, Plus, X } from 'lucide-react';
import { Button, Card } from '../ui/primitives';

type AddMode = 'texto' | 'link' | 'archivo' | 'manual';

interface AddKnowledgeModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCreateText: (payload: { title: string; content: string }) => Promise<void>;
  onCreateLink: (payload: { url: string }) => Promise<void>;
  onUploadFile: (file: File) => Promise<void>;
}

export function AddKnowledgeModal({
  open,
  loading,
  onClose,
  onCreateText,
  onCreateLink,
  onUploadFile,
}: AddKnowledgeModalProps) {
  const [mode, setMode] = useState<AddMode>('texto');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleSubmit() {
    if (mode === 'archivo') {
      fileRef.current?.click();
      return;
    }
    if (mode === 'link') {
      await onCreateLink({ url });
      setUrl('');
      onClose();
      return;
    }
    await onCreateText({ title, content });
    setTitle('');
    setContent('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(17,17,16,0.35)', backdropFilter: 'blur(6px)' }}>
      <Card className="w-full sm:max-w-2xl p-4 sm:p-5 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-500">Nueva fuente</p>
            <h2 className="mt-2 text-[18px] font-bold text-ink-900" style={{ letterSpacing: '-0.01em' }}>Agrega conocimiento a la marca</h2>
            <p className="mt-1 text-[13px] text-ink-400">Una fuente puede ser texto, un link o un documento. Luego el sistema la usa o la estructura segun corresponda.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-400 transition hover:bg-[rgba(17,17,16,0.06)] hover:text-ink-700"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([
            { key: 'texto', label: 'Pegar texto', icon: FileText },
            { key: 'manual', label: 'Crear entrada', icon: Plus },
            { key: 'link', label: 'Pegar link', icon: Link2 },
            { key: 'archivo', label: 'Subir archivo', icon: Paperclip },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-150 ${
                mode === item.key
                  ? 'bg-brand-500 text-white shadow-card'
                  : 'bg-[rgba(17,17,16,0.05)] text-ink-600 hover:bg-[rgba(17,17,16,0.08)]'
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {mode === 'link' ? (
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Link</label>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://tu-sitio.com/politicas"
                className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
              />
            </div>
          ) : mode === 'archivo' ? (
            <div className="rounded-2xl border border-dashed border-[rgba(17,17,16,0.12)] bg-[rgba(17,17,16,0.02)] p-6 text-center">
              <p className="text-[13px] font-semibold text-ink-800">Sube un archivo util</p>
              <p className="mt-1 text-[12px] text-ink-400">PDF, DOCX o TXT. Lo usaremos como fuente para responder mejor.</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onUploadFile(file).then(onClose);
                  }
                  event.target.value = '';
                }}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Titulo opcional</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ej: Politica de envios"
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Informacion</label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={10}
                  placeholder="Pega aqui lo que tu asistente deberia saber para responder mejor"
                  className="w-full rounded-2xl border border-[rgba(17,17,16,0.10)] bg-white/80 px-4 py-3 text-[13px] leading-relaxed text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : null}
            {mode === 'archivo' ? 'Elegir archivo' : 'Guardar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
