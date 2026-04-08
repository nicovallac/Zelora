import type { RefObject } from 'react';
import type { AppChatPublicConfig, MessageItem, PublicProductApiItem } from '../../services/api';
import { formatTime, renderRichMessage } from './appchat-utils';

function BotAvatar({ config }: { config: Pick<AppChatPublicConfig, 'header_logo_url' | 'app_name' | 'primary_color'> }) {
  if (config.header_logo_url) {
    return (
      <img
        src={config.header_logo_url}
        alt={config.app_name}
        className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
      />
    );
  }
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-card"
      style={{ backgroundColor: config.primary_color }}
    >
      {config.app_name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function AppChatMessageList({
  messages,
  typingMessage,
  isBotTyping,
  scrollerRef,
  messageGap,
  fontSize,
  bubbleRadius,
  bubblePadding,
  bubbleTextClass,
  productHrefMap,
  config,
}: {
  messages: MessageItem[];
  typingMessage: MessageItem | null;
  isBotTyping: boolean;
  scrollerRef: RefObject<HTMLDivElement | null>;
  messageGap: string;
  fontSize: string;
  bubbleRadius: string;
  bubblePadding: string;
  bubbleTextClass: string;
  productHrefMap: Map<string, PublicProductApiItem>;
  config: Pick<AppChatPublicConfig, 'user_bubble_color' | 'agent_bubble_color' | 'header_logo_url' | 'app_name' | 'primary_color'>;
}) {
  const resolveProduct = (href: string) => productHrefMap.get(href);

  return (
    <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-0.5 py-1">
      <div className={`mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end ${messageGap}`} style={{ fontSize }}>
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              {isUser ? (
                <div className="flex max-w-[84%] flex-col items-end gap-1">
                  <div
                    className={`${bubbleRadius} text-white shadow-[0_4px_12px_rgba(15,23,42,0.025)] ${bubblePadding}`}
                    style={{ backgroundColor: config.user_bubble_color }}
                  >
                    {renderRichMessage(message.content, bubbleTextClass, 'font-semibold text-white', resolveProduct)}
                  </div>
                  <span className="px-1 text-[10px] text-slate-400">{formatTime(message.timestamp)}</span>
                </div>
              ) : (
                <div className="flex max-w-[88%] items-end gap-2">
                  <BotAvatar config={config} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <div
                      className={`${bubbleRadius} border border-[rgba(17,17,16,0.07)] text-ink-800 shadow-[0_4px_12px_rgba(15,23,42,0.022)] ${bubblePadding}`}
                      style={{ backgroundColor: config.agent_bubble_color || '#ffffff' }}
                    >
                      {renderRichMessage(message.content, bubbleTextClass, 'font-semibold text-ink-900', resolveProduct)}
                    </div>
                    <span className="px-1 text-[10px] text-slate-400">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {typingMessage ? (
          <div className="flex justify-start">
            <div className="flex max-w-[88%] items-end gap-2">
              <BotAvatar config={config} />
              <div className="flex min-w-0 flex-col gap-1">
                <div
                  className={`${bubbleRadius} border border-[rgba(17,17,16,0.07)] text-ink-800 shadow-[0_4px_12px_rgba(15,23,42,0.022)] ${bubblePadding}`}
                  style={{ backgroundColor: config.agent_bubble_color || '#ffffff' }}
                >
                  {renderRichMessage(typingMessage.content, bubbleTextClass, 'font-semibold text-ink-900', resolveProduct)}
                </div>
                <span className="px-1 text-[10px] text-slate-400">{formatTime(typingMessage.timestamp)}</span>
              </div>
            </div>
          </div>
        ) : null}

        {isBotTyping ? (
          <div className="flex justify-start">
            <div className="flex max-w-[88%] items-end gap-2">
              <BotAvatar config={config} />
              <div
                className={`${bubbleRadius} border border-[rgba(17,17,16,0.07)] shadow-[0_4px_12px_rgba(15,23,42,0.022)] ${bubblePadding}`}
                style={{ backgroundColor: config.agent_bubble_color || '#ffffff' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-400 [animation-delay:240ms]" />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
