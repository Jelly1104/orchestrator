import { useState, useEffect, useCallback, useRef } from 'react';

export interface WSMessage {
  type: 'connected' | 'running_status' | 'task_created' | 'task_updated' | 'hitl_pending' | 'hitl_resolved' | 'rerun_requested';
  timestamp: string;
  taskId?: string;
  message?: string;
  action?: string;
  reason?: string;
  data?: any;
}

export interface RunningTask {
  taskId: string;
  currentPhase: string;
  progress?: number;
  startTime?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  runningTask: RunningTask | null;
  lastMessage: WSMessage | null;
  reconnect: () => void;
}

// 전역 연결 상태 관리 (StrictMode 중복 마운트 방지)
let globalWs: WebSocket | null = null;
let globalConnectionCount = 0;

export function useWebSocket(onMessage?: (msg: WSMessage) => void): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [runningTask, setRunningTask] = useState<RunningTask | null>(null);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessage);
  const mountedRef = useRef(false);

  // onMessage 콜백을 ref로 관리하여 재연결 방지
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    // 이미 전역 연결이 있고 열려있으면 재사용
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      wsRef.current = globalWs;
      setIsConnected(true);
      return;
    }

    // 연결 중이면 대기
    if (globalWs && globalWs.readyState === WebSocket.CONNECTING) {
      wsRef.current = globalWs;
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // 개발 환경에서는 API 서버 포트로 연결
    const host = window.location.port === '5173' ? 'localhost:3000' : window.location.host;
    const ws = new WebSocket(`${protocol}//${host}`);
    globalWs = ws;

    ws.onopen = () => {
      console.log('[WS] 연결됨');
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log('[WS] 연결 해제');
      setIsConnected(false);

      // 자동 재연결 (3초 후)
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[WS] 재연결 시도...');
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('[WS] 에러:', error);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        console.log('[WS] 메시지:', msg.type, msg);

        setLastMessage(msg);

        // 실행 중 상태 업데이트
        if (msg.type === 'running_status') {
          setRunningTask(msg.data);
        }

        // 콜백 호출 (ref 사용)
        if (onMessageRef.current) {
          onMessageRef.current(msg);
        }
      } catch (e) {
        console.error('[WS] 메시지 파싱 에러:', e);
      }
    };

    wsRef.current = ws;
  }, []); // 의존성 제거 - onMessageRef 사용

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    // 강제 재연결 시 전역 연결도 초기화
    if (globalWs) {
      globalWs.close();
      globalWs = null;
    }
    connect();
  }, [connect]);

  useEffect(() => {
    // StrictMode 중복 마운트 방지
    if (mountedRef.current) {
      return;
    }
    mountedRef.current = true;
    globalConnectionCount++;

    connect();

    return () => {
      globalConnectionCount--;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // 마지막 컴포넌트가 언마운트될 때만 연결 종료
      if (globalConnectionCount === 0 && globalWs) {
        globalWs.close();
        globalWs = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    runningTask,
    lastMessage,
    reconnect
  };
}

export default useWebSocket;
