import { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
  Search,
  Paperclip,
  Upload,
  X,
  FileText,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { mockKBArticles, KB_CATEGORIES } from '../data/mock';
import type { KBCategory } from '../data/mock';
import { api } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface KBArticle {
  id: string;
  titulo: string;
  categoria: string;
  contenido: string;
  tags: string[];
  activo: boolean;
  visitas: number;
  createdAt: string;
  updatedAt: string;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br/>');
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CATEGORY_COLORS: Record<string, string> = {
  Subsidios: 'bg-blue-100 text-blue-700',
  Certificados: 'bg-violet-100 text-violet-700',
  PQRS: 'bg-orange-100 text-orange-700',
  Afiliación: 'bg-emerald-100 text-emerald-700',
  Recreación: 'bg-pink-100 text-pink-700',
  Trámites: 'bg-amber-100 text-amber-700',
  General: 'bg-slate-100 text-slate-700',
};

function emptyArticle(): KBArticle {
  return {
    id: `kb-new-${Date.now()}`,
    titulo: '',
    categoria: 'General',
    contenido: '',
    tags: [],
    activo: true,
    visitas: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface AttachedDoc {
  id: string;
  nombre: string;
  size: string;
}

export function KnowledgeBasePage() {
  const { showSuccess, showInfo } = useNotification();
  const [articles, setArticles] = useState<KBArticle[]>(mockKBArticles);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<KBCategory | 'Todos'>('Todos');
  const [formState, setFormState] = useState<KBArticle | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [attachedDocs, setAttachedDocs] = useState<AttachedDoc[]>([
    { id: 'doc1', nombre: 'reglamento_subsidios_2026.pdf', size: '1.2 MB' },
    { id: 'doc2', nombre: 'manual_afiliados.pdf', size: '843 KB' },
  ]);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Load articles from API or fallback to mock
  useEffect(() => {
    async function load() {
      try {
        const data = await (api as unknown as { getKnowledgeBase?: () => Promise<KBArticle[]> }).getKnowledgeBase?.();
        if (data && Array.isArray(data)) setArticles(data);
      } catch {
        // fallback to mock (already set)
      }
    }
    void load();
  }, []);

  const filtered = articles.filter((a) => {
    const matchCat = categoryFilter === 'Todos' || a.categoria === categoryFilter;
    const matchSearch = !search || a.titulo.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  function selectArticle(id: string) {
    const art = articles.find((a) => a.id === id);
    if (art) {
      setSelectedId(id);
      setFormState({ ...art });
      setTagsInput(art.tags.join(', '));
      setEditMode(true);
    }
  }

  function handleNew() {
    const art = emptyArticle();
    setArticles((prev) => [art, ...prev]);
    setSelectedId(art.id);
    setFormState({ ...art });
    setTagsInput('');
    setEditMode(true);
  }

  async function handleSave() {
    if (!formState) return;
    setSaving(true);
    const updated: KBArticle = {
      ...formState,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    try {
      const isNew = !articles.find((a) => a.id === formState.id) ||
        articles.find((a) => a.id === formState.id)?.visitas === 0 && formState.titulo === '';
      if (isNew) {
        await (api as unknown as { createKBArticle?: (d: KBArticle) => Promise<unknown> }).createKBArticle?.(updated);
      } else {
        await (api as unknown as { updateKBArticle?: (id: string, d: KBArticle) => Promise<unknown> }).updateKBArticle?.(updated.id, updated);
      }
    } catch {
      // Demo: save locally anyway
    }
    setArticles((prev) => prev.map((a) => a.id === updated.id ? updated : a));
    setFormState(updated);
    showSuccess('Artículo guardado correctamente');
    setSaving(false);
  }

  async function handleDelete() {
    if (!selectedId) return;
    try {
      await (api as unknown as { deleteKBArticle?: (id: string) => Promise<unknown> }).deleteKBArticle?.(selectedId);
    } catch {
      // Demo: delete locally
    }
    setArticles((prev) => prev.filter((a) => a.id !== selectedId));
    setSelectedId(null);
    setFormState(null);
    setShowDeleteConfirm(false);
    showSuccess('Artículo eliminado');
  }

  function handleToggleActive() {
    if (!formState) return;
    const updated = { ...formState, activo: !formState.activo };
    setFormState(updated);
    setArticles((prev) => prev.map((a) => a.id === updated.id ? updated : a));
    showInfo(updated.activo ? 'Artículo publicado' : 'Artículo despublicado');
  }

  const selectedArticle = articles.find((a) => a.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* LEFT COLUMN — Article list */}
      <div className="flex w-80 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="border-b border-slate-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-brand-600" />
              <h2 className="font-bold text-slate-900">Base de Conocimiento</h2>
            </div>
            <button
              onClick={handleNew}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
            >
              <Plus size={12} /> Nuevo
            </button>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search size={12} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar artículos..."
              className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder-slate-400"
            />
          </div>
          {/* Category filters */}
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              onClick={() => setCategoryFilter('Todos')}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                categoryFilter === 'Todos' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {KB_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                  categoryFilter === cat ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Article list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">Sin artículos</div>
          )}
          {filtered.map((art) => (
            <button
              key={art.id}
              onClick={() => selectArticle(art.id)}
              className={`flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                selectedId === art.id ? 'border-l-2 border-l-brand-400 bg-brand-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 leading-snug">{art.titulo}</p>
                <div
                  className={`ml-1 flex-shrink-0 cursor-pointer rounded-full p-0.5 ${art.activo ? 'text-emerald-500' : 'text-slate-300'}`}
                  title={art.activo ? 'Activo' : 'Inactivo'}
                >
                  {art.activo ? <Eye size={12} /> : <EyeOff size={12} />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[art.categoria] ?? 'bg-slate-100 text-slate-600'}`}>
                  {art.categoria}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                  <Eye size={10} /> {art.visitas.toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN — Editor / Viewer */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {!selectedId || !formState ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
            <BookOpen size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">Selecciona un artículo o crea uno nuevo</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* Editor header */}
              <div className="border-b border-slate-200 bg-white px-6 py-4">
                <div className="mb-3 flex items-center gap-3">
                  <input
                    type="text"
                    value={formState.titulo}
                    onChange={(e) => setFormState((f) => f ? { ...f, titulo: e.target.value } : f)}
                    placeholder="Título del artículo..."
                    className="flex-1 text-xl font-bold text-slate-900 outline-none placeholder-slate-300 bg-transparent"
                  />
                  <select
                    value={formState.categoria}
                    onChange={(e) => setFormState((f) => f ? { ...f, categoria: e.target.value } : f)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                  >
                    {KB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <Edit3 size={12} className="text-slate-400" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Tags separados por coma: subsidio, pago, ..."
                    className="flex-1 text-xs text-slate-600 outline-none bg-transparent placeholder-slate-400"
                  />
                </div>
                {/* Toolbar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition disabled:opacity-50"
                  >
                    <Save size={12} /> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={handleToggleActive}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      formState.activo
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {formState.activo ? <Eye size={12} /> : <EyeOff size={12} />}
                    {formState.activo ? 'Publicado' : 'Despublicado'}
                  </button>
                  <button
                    onClick={() => setEditMode((v) => !v)}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-200 transition"
                  >
                    <Eye size={12} /> {editMode ? 'Vista previa' : 'Editar'}
                  </button>
                  <div className="ml-auto">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200 transition"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-6">
                {editMode ? (
                  <textarea
                    value={formState.contenido}
                    onChange={(e) => setFormState((f) => f ? { ...f, contenido: e.target.value } : f)}
                    placeholder="Escribe el contenido en Markdown...\n\n## Título H2\n### Título H3\n**negrita** *cursiva*\n- ítem de lista"
                    className="h-full min-h-[320px] w-full resize-none rounded-xl border border-slate-200 bg-white p-4 font-mono text-sm text-slate-700 outline-none focus:border-brand-400 placeholder-slate-300"
                  />
                ) : (
                  <div
                    className="prose max-w-none rounded-xl border border-slate-200 bg-white p-6 text-slate-800"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(formState.contenido) }}
                  />
                )}
              </div>

              {/* Documentos fuente */}
              <div className="border-t border-slate-200 bg-white px-6 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <Paperclip size={13} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">Documentos fuente</span>
                  <div className="flex-1 border-t border-slate-100" />
                </div>

                {/* Attached files list */}
                {attachedDocs.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    {attachedDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
                        <FileText size={13} className="flex-shrink-0 text-brand-500" />
                        <span className="flex-1 truncate text-xs font-medium text-slate-700">{doc.nombre}</span>
                        <span className="text-[10px] text-slate-400">{doc.size}</span>
                        <button
                          onClick={() => setAttachedDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                          className="text-slate-300 hover:text-red-500 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload zone */}
                <div
                  onClick={() => docInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-center hover:border-brand-400 transition"
                >
                  <Upload size={14} className="text-slate-400" />
                  <p className="text-[11px] text-slate-500">Arrastra PDF, DOCX, TXT aquí o haz clic para subir</p>
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const sizeKb = Math.round(file.size / 1024);
                    const sizeLabel = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
                    setAttachedDocs((prev) => [
                      ...prev,
                      { id: `doc-${Date.now()}`, nombre: file.name, size: sizeLabel },
                    ]);
                    e.target.value = '';
                    showInfo('Documento subido. Procesando para RAG...');
                  }}
                />
                <p className="mt-2 text-[10px] text-slate-400 text-center">
                  Los documentos se indexan automáticamente para mejorar las respuestas del chatbot
                </p>
              </div>

              {/* Stats row */}
              <div className="border-t border-slate-200 bg-white px-6 py-3">
                <div className="flex items-center gap-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye size={11} /> <strong className="text-slate-700">{selectedArticle?.visitas.toLocaleString()}</strong> visitas
                  </span>
                  <span>Creado: <strong className="text-slate-700">{formatDate(formState.createdAt)}</strong></span>
                  <span>Actualizado: <strong className="text-slate-700">{formatDate(formState.updatedAt)}</strong></span>
                  <span className={`flex items-center gap-1 font-semibold ${formState.activo ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formState.activo ? '● Activo' : '○ Inactivo'}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-80 rounded-2xl bg-white p-6 shadow-xl"
            >
              <p className="mb-2 font-bold text-slate-900">¿Eliminar artículo?</p>
              <p className="mb-5 text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleDelete()}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
