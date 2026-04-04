import { Card, SectionTitle, Tag } from "../components/ui/primitives";

export function ChannelPage({
  title,
  subtitle,
  primaryTag
}: {
  title: string;
  subtitle: string;
  primaryTag: string;
}) {
  return (
    <div className="space-y-4">
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="grid gap-4 lg:grid-cols-[0.65fr_0.35fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Tag text={primaryTag} color="bg-emerald-100 text-emerald-800" />
            <Tag text="Vista cliente" color="bg-emerald-100 text-emerald-800" />
          </div>
          <div className="space-y-3 rounded-2xl bg-[rgba(17,17,16,0.06)] p-4">
            <div className="max-w-[80%] rounded-2xl bg-white/70 backdrop-blur-sm p-3 text-sm">Hola, necesito ayuda con mi subsidio.</div>
            <div className="ml-auto max-w-[80%] rounded-2xl bg-brand-500 p-3 text-sm text-white">
              Claro, te ayudo a consultar tu estado en segundos.
            </div>
            <div className="max-w-[80%] rounded-2xl bg-white/70 backdrop-blur-sm p-3 text-sm">Si deseas, te paso con un asesor.</div>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-900">Acciones de demo</p>
          <div className="mt-3 space-y-2">
            {["Simular flujo", "Responder con IA", "Escalar a asesor"].map((item) => (
              <button
                key={item}
                className="w-full rounded-xl border border-[rgba(17,17,16,0.09)] bg-white/70 backdrop-blur-sm px-3 py-2 text-left text-sm font-medium text-ink-700 hover:bg-[rgba(17,17,16,0.025)]"
              >
                {item}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
