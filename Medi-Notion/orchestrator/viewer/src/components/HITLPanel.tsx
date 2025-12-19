import React, { useState, useEffect, useCallback } from 'react';

export interface HITLRequest {
  taskId: string;
  type: 'approval' | 'review' | 'decision';
  phase: string;
  description: string;
  preview?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface HITLPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function HITLPanel({ isOpen, onClose, onRefresh }: HITLPanelProps) {
  const [queue, setQueue] = useState<HITLRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HITLRequest | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hitl/queue');
      const data = await res.json();
      setQueue(data);
    } catch (e) {
      console.error('Failed to fetch HITL queue:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen, fetchQueue]);

  const handleApprove = async (taskId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: feedback })
      });
      if (res.ok) {
        setQueue(prev => prev.filter(item => item.taskId !== taskId));
        setSelectedItem(null);
        setFeedback('');
        onRefresh?.();
      }
    } catch (e) {
      console.error('Approve failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (taskId: string) => {
    if (!rejectReason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        setQueue(prev => prev.filter(item => item.taskId !== taskId));
        setSelectedItem(null);
        setRejectReason('');
        onRefresh?.();
      }
    } catch (e) {
      console.error('Reject failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRerun = async (taskId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/rerun`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications: {} })
      });
      if (res.ok) {
        alert('재실행 요청이 등록되었습니다.');
        onRefresh?.();
      }
    } catch (e) {
      console.error('Rerun failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const submitFeedback = async (taskId: string) => {
    if (!feedback.trim()) {
      alert('피드백을 입력해주세요.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, rating: null })
      });
      if (res.ok) {
        alert('피드백이 제출되었습니다.');
        setFeedback('');
      }
    } catch (e) {
      console.error('Feedback failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-dark-bg border border-dark-border rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-card">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <h2 className="text-xl font-bold text-white">HITL 승인 대기열</h2>
            <span className="bg-primary text-white px-2 py-0.5 rounded-full text-sm">
              {queue.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Queue List */}
          <div className="w-1/3 border-r border-dark-border overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">로딩 중...</div>
            ) : queue.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl block mb-2">✓</span>
                대기 중인 항목이 없습니다
              </div>
            ) : (
              queue.map(item => (
                <button
                  key={item.taskId}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-4 border-b border-dark-border hover:bg-secondary/20 transition-colors ${
                    selectedItem?.taskId === item.taskId ? 'bg-secondary/30 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.type === 'approval' ? 'bg-amber-500/20 text-amber-400' :
                      item.type === 'review' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {item.type === 'approval' ? '승인 필요' :
                       item.type === 'review' ? '검토 필요' : '결정 필요'}
                    </span>
                  </div>
                  <div className="font-medium text-white truncate">
                    {item.taskId.substring(0, 20)}...
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {item.phase} · {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedItem ? (
              <div className="space-y-6">
                {/* Task Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    요청 상세
                  </h3>
                  <div className="bg-dark-card rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Task ID</span>
                      <span className="text-white font-mono text-sm">
                        {selectedItem.taskId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phase</span>
                      <span className="text-white">{selectedItem.phase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="text-white">{selectedItem.type}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    설명
                  </h3>
                  <div className="bg-dark-card rounded-lg p-4 text-gray-300">
                    {selectedItem.description}
                  </div>
                </div>

                {/* Preview */}
                {selectedItem.preview && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      미리보기
                    </h3>
                    <pre className="bg-dark-card rounded-lg p-4 text-sm text-gray-300 overflow-x-auto max-h-48">
                      {selectedItem.preview}
                    </pre>
                  </div>
                )}

                {/* Feedback Input */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    피드백 / 코멘트
                  </h3>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="승인 시 코멘트 또는 일반 피드백..."
                    className="w-full bg-dark-card border border-dark-border rounded-lg p-3 text-white placeholder-gray-500 resize-none h-24"
                  />
                </div>

                {/* Reject Reason */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    거부 사유 (거부 시 필수)
                  </h3>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="거부 사유를 입력하세요..."
                    className="w-full bg-dark-card border border-dark-border rounded-lg p-3 text-white placeholder-gray-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedItem.taskId)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>✓</span> 승인
                  </button>
                  <button
                    onClick={() => handleReject(selectedItem.taskId)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>✗</span> 거부
                  </button>
                  <button
                    onClick={() => handleRerun(selectedItem.taskId)}
                    disabled={actionLoading}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>↻</span> 재실행
                  </button>
                </div>

                {/* Feedback Only Button */}
                <button
                  onClick={() => submitFeedback(selectedItem.taskId)}
                  disabled={actionLoading || !feedback.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  피드백만 제출
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <span className="text-4xl block mb-2">←</span>
                  좌측에서 항목을 선택하세요
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-dark-border bg-dark-card flex justify-between items-center">
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>↻</span> 새로고침
          </button>
          <span className="text-gray-500 text-sm">
            Human-In-The-Loop 승인 시스템
          </span>
        </div>
      </div>
    </div>
  );
}

export default HITLPanel;
