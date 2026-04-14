import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/auth/';

export function useAuthWebSocket() {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const listeners = useRef({});

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      setConnected(true);
    };

    ws.current.onclose = () => {
      setConnected(false);
      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    ws.current.onerror = () => {
      ws.current?.close();
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = listeners.current[data.type];
        if (handler) handler(data);
      } catch (e) {
        console.error('WS parse error', e);
      }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const on = useCallback((type, handler) => {
    listeners.current[type] = handler;
    return () => delete listeners.current[type];
  }, []);

  const checkEmail = useCallback((email) => {
    send({ type: 'check_email', email });
  }, [send]);

  const validateToken = useCallback((token) => {
    send({ type: 'validate_token', token });
  }, [send]);

  return { connected, send, on, checkEmail, validateToken };
}
