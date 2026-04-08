import type { RefObject } from 'react';
import { SendHorizonal } from 'lucide-react';

export function AppChatChatInput({
  input,
  sending,
  inputRef,
  inputHeightClass,
  primaryColor,
  placeholder,
  placeholderVisible,
  showGradientLine,
  onChange,
  onSend,
}: {
  input: string;
  sending: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  inputHeightClass: string;
  primaryColor: string;
  placeholder: string;
  placeholderVisible: boolean;
  showGradientLine?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="relative flex-1">
        {!input ? (
          <span
            className={`pointer-events-none absolute left-0 top-1 text-[14px] text-[rgba(17,17,16,0.34)] transition-opacity duration-700 ${placeholderVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            {placeholder}
          </span>
        ) : null}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder=""
          className={`w-full border-0 border-b border-[rgba(17,17,16,0.16)] bg-transparent px-0 pb-2 pt-1 text-ink-900 outline-none focus:border-[rgba(17,17,16,0.48)] ${inputHeightClass}`}
        />
        {showGradientLine ? (
          <span
            className="pointer-events-none absolute bottom-0 left-0 h-px w-full"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}00 0%, ${primaryColor}66 20%, ${primaryColor} 50%, ${primaryColor}66 80%, ${primaryColor}00 100%)`,
            }}
          />
        ) : null}
      </div>
      <button
        onClick={onSend}
        disabled={sending || !input.trim()}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40"
        style={{ color: primaryColor }}
      >
        <SendHorizonal size={16} />
      </button>
    </div>
  );
}
