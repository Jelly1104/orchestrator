import React from 'react';

interface WSStatusProps {
  isConnected: boolean;
  onReconnect?: () => void;
}

export function WSStatus({ isConnected, onReconnect }: WSStatusProps) {
  return (
    <div
      className={`fixed bottom-3 right-3 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
        isConnected
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white hover:bg-red-600'
      }`}
      onClick={isConnected ? undefined : onReconnect}
      title={isConnected ? 'WebSocket 연결됨' : '클릭하여 재연결'}
    >
      {isConnected ? (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          실시간 연결됨
        </span>
      ) : (
        <span>연결 끊김 - 클릭하여 재연결</span>
      )}
    </div>
  );
}

export default WSStatus;
