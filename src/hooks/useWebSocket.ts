import { useEffect, useRef, useState, useCallback } from 'react';

const BASE_WS = import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8000';

export function useWebSocket(path: string) {
  const [lastMessage, setLastMessage] = useState<Record<string, unknown> | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(`${BASE_WS}${path}`);
        ws.onopen = () => setConnected(true);
        ws.onclose = () => {
          setConnected(false);
          retryTimeout = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            setLastMessage(JSON.parse(e.data as string) as Record<string, unknown>);
          } catch {
            // ignore parse errors
          }
        };
        wsRef.current = ws;
      } catch {
        retryTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      clearTimeout(retryTimeout);
      wsRef.current?.close();
    };
  }, [path]);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { lastMessage, connected, sendMessage };
}
