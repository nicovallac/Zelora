import { Search } from 'lucide-react';

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[rgba(17,17,16,0.10)] px-3 py-2 bg-white/70 backdrop-blur-sm">
      <Search size={14} className="text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
      />
    </div>
  );
}
