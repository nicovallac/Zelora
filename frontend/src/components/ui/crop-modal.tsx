import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface CropModalProps {
  src: string;
  aspect: number;
  shape: 'rect' | 'round';
  title: string;
  onApply: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

async function buildCroppedImage(src: string, pixelCrop: Area, shape: 'rect' | 'round'): Promise<string> {
  const image = new Image();
  image.src = src;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const size = Math.max(pixelCrop.width, pixelCrop.height);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  if (shape === 'round') {
    ctx.beginPath();
    ctx.arc(pixelCrop.width / 2, pixelCrop.height / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
  }

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height,
  );

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function CropModal({ src, aspect, shape, title, onApply, onCancel }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function apply() {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const result = await buildCroppedImage(src, croppedAreaPixels, shape);
      onApply(result);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(17,17,16,0.60)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-t-3xl sm:w-auto sm:min-w-[440px] sm:max-w-[520px] sm:rounded-3xl"
        style={{
          background: 'rgba(245,244,240,0.97)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.60)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.80)',
          maxHeight: '92dvh',
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(17,17,16,0.08)' }}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-500">Editar imagen</p>
            <p className="text-[15px] font-bold text-ink-900" style={{ letterSpacing: '-0.015em' }}>{title}</p>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition hover:bg-[rgba(17,17,16,0.07)] hover:text-ink-700"
          >
            <X size={15} />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative shrink-0" style={{ height: '320px', background: '#1a1a1a' }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={shape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: '2px solid rgba(167,139,250,0.90)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.52)',
              },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="shrink-0 px-5 py-4" style={{ borderTop: '1px solid rgba(17,17,16,0.07)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 text-ink-500 transition hover:bg-white"
            >
              <ZoomOut size={13} />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[rgba(17,17,16,0.12)] accent-brand-500"
            />
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(17,17,16,0.10)] bg-white/80 text-ink-500 transition hover:bg-white"
            >
              <ZoomIn size={13} />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-ink-400">Arrastra para encuadrar · Pellizca o usa el slider para el zoom</p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-[rgba(17,17,16,0.12)] bg-white/80 py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-white"
          >
            Cancelar
          </button>
          <button
            onClick={() => void apply()}
            disabled={applying}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 py-2.5 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-50"
          >
            <Check size={14} />
            {applying ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
