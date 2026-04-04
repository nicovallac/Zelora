import { useEffect, useRef, useState, useCallback } from 'react';

const BASE_WS = import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8000';
const AUTH_TOKEN_KEY = 'comfa_token';

type WebSocketAuthMode = 'subprotocol' | 'query' | 'none';

function buildWebSocketUrl(path: string, authMode: WebSocketAuthMode) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (authMode === 'query' && token) {
    const separator = path.includes('?') ? '&' : '?';
    return `${BASE_WS}${path}${separator}token=${encodeURIComponent(token)}`;
  }
  return `${BASE_WS}${path}`;
}

function buildWebSocketProtocols(authMode: WebSocketAuthMode) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (authMode === 'subprotocol' && token) {
    return ['vendly-ws', `vendly-jwt.${token}`];
  }
  return undefined;
}

export function useWebSocket(path: string, authMode: WebSocketAuthMode = 'subprotocol') {
  const [lastMessage, setLastMessage] = useState<Record<string, unknown> | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!path) {
      setConnected(false);
      return;
    }
    if ((authMode === 'subprotocol' || authMode === 'query') && !token) {
      setConnected(false);
      return;
    }
    let ws: WebSocket;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let heartbeatInterval: ReturnType<typeof setInterval>;
    let shouldReconnect = true;
    let cleanupRequested = false;

    const connect = () => {
      try {
        const url = buildWebSocketUrl(path, authMode);
        const protocols = buildWebSocketProtocols(authMode);
        ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
        ws.onopen = () => {
          if (cleanupRequested) {
            ws.close();
            return;
          }
          setConnected(true);
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };
        ws.onclose = () => {
          setConnected(false);
          clearInterval(heartbeatInterval);
          if (shouldReconnect) {
            retryTimeout = setTimeout(connect, 5000);
          }
        };
        ws.onerror = () => {
          if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
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
      cleanupRequested = true;
      shouldReconnect = false;
      clearTimeout(retryTimeout);
      clearInterval(heartbeatInterval);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [authMode, path]);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { lastMessage, connected, sendMessage };
}
