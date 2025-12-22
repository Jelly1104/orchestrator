import React, { useState, useEffect, useCallback } from 'react';

// HITL 체크포인트 타입
export type HITLCheckpoint =
  | 'PRD_REVIEW'
  | 'QUERY_REVIEW'
  | 'DESIGN_APPROVAL'
  | 'MANUAL_FIX'
  | 'DEPLOY_APPROVAL';

// 체크포인트별 정보
const CHECKPOINT_INFO: Record<HITLCheckpoint, { label: string; icon: string; color: string; description: string }> = {
  PRD_REVIEW: {
    label: 'PRD 검토',
    icon: '📋',
    color: 'amber',
    description: 'PRD에 필수 항목이 누락되었습니다. 검토 후 승인하거나 PRD를 보완해주세요.'
  },
  QUERY_REVIEW: {
    label: 'SQL 검증',
    icon: '⚠️',
    color: 'red',
    description: '위험한 SQL 쿼리가 감지되었습니다. (DELETE, DROP, TRUNCATE, UPDATE)'
  },
  DESIGN_APPROVAL: {
    label: '설계 승인',
    icon: '📐',
    color: 'blue',
    description: '설계 문서가 생성되었습니다. 검토 후 승인해주세요.'
  },
  MANUAL_FIX: {
    label: '수동 수정',
    icon: '🔧',
    color: 'purple',
    description: 'AI가 3회 연속 실패했습니다. 직접 수정이 필요합니다.'
  },
  DEPLOY_APPROVAL: {
    label: '배포 승인',
    icon: '🚀',
    color: 'green',
    description: '모든 작업이 완료되었습니다. 배포를 승인해주세요.'
  }
};

export interface HITLRequest {
  taskId: string;
  checkpoint: HITLCheckpoint;
  type: 'approval' | 'review' | 'decision';
  phase: string;
  description: string;
  preview?: string;
  timestamp: string;
  createdAt?: string;
  context?: {
    message?: string;
    files?: Record<string, string | null>;
    dangerousQueries?: Array<{ type: string; query: string }>;
    missing?: string[];
    docsPath?: string;
    retryCount?: number;
    reviewScore?: number;
    allQueries?: string[];
  };
  metadata?: Record<string, unknown>;
}

interface HITLPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

// Toast 컴포넌트
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-[60] max-w-md animate-slide-up`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          {type === 'success' && (
            <p className="text-sm mt-2 opacity-90">
              터미널에서 오케스트레이터를 다시 실행하여 작업을 재개하세요.
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">×</button>
      </div>
    </div>
  );
}

export function HITLPanel({ isOpen, onClose, onRefresh }: HITLPanelProps) {
  const [queue, setQueue] = useState<HITLRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HITLRequest | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
        setToast({
          message: '승인되었습니다.',
          type: 'success'
        });
        onRefresh?.();
      } else {
        setToast({ message: '승인 실패', type: 'error' });
      }
    } catch (e) {
      console.error('Approve failed:', e);
      setToast({ message: '승인 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (taskId: string) => {
    if (!rejectReason.trim()) {
      setToast({ message: '거부 사유를 입력해주세요.', type: 'info' });
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
        setToast({ message: '거부되었습니다.', type: 'info' });
        onRefresh?.();
      }
    } catch (e) {
      console.error('Reject failed:', e);
      setToast({ message: '거부 중 오류가 발생했습니다.', type: 'error' });
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
        setToast({ message: '재실행 요청이 등록되었습니다.', type: 'success' });
        onRefresh?.();
      }
    } catch (e) {
      console.error('Rerun failed:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const getCheckpointInfo = (checkpoint?: HITLCheckpoint) => {
    if (!checkpoint || !CHECKPOINT_INFO[checkpoint]) {
      return { label: '알 수 없음', icon: '❓', color: 'gray', description: '' };
    }
    return CHECKPOINT_INFO[checkpoint];
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500' },
      red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500' },
      green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
      gray: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500' }
    };
    return colors[color] || colors.gray;
  };

  const formatElapsedTime = (timestamp: string) => {
    const elapsed = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-dark-bg border border-dark-border rounded-lg w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-card">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <h2 className="text-xl font-bold text-white">HITL 승인 대기열</h2>
              <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-sm font-medium">
                {queue.length} 대기
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
            <div className="w-2/5 border-r border-dark-border overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">로딩 중...</div>
              ) : queue.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <span className="text-4xl block mb-2">✓</span>
                  대기 중인 항목이 없습니다
                </div>
              ) : (
                queue.map(item => {
                  const info = getCheckpointInfo(item.checkpoint);
                  const colorClasses = getColorClasses(info.color);
                  return (
                    <button
                      key={item.taskId}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full text-left p-4 border-b border-dark-border hover:bg-secondary/20 transition-colors ${
                        selectedItem?.taskId === item.taskId ? `bg-secondary/30 border-l-4 ${colorClasses.border}` : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{info.icon}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}>
                          {info.label}
                        </span>
                      </div>
                      <div className="font-medium text-white truncate">
                        {item.taskId}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span>⏱️ {formatElapsedTime(item.timestamp || item.createdAt || '')}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Detail Panel */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedItem ? (
                <div className="space-y-5">
                  {/* Checkpoint Header */}
                  {(() => {
                    const info = getCheckpointInfo(selectedItem.checkpoint);
                    const colorClasses = getColorClasses(info.color);
                    return (
                      <div className={`${colorClasses.bg} border ${colorClasses.border} rounded-lg p-4`}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{info.icon}</span>
                          <h3 className={`text-lg font-bold ${colorClasses.text}`}>{info.label}</h3>
                        </div>
                        <p className="text-gray-300">{info.description}</p>
                      </div>
                    );
                  })()}

                  {/* Task Info */}
                  <div className="bg-dark-card rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Task ID</span>
                      <span className="text-white font-mono text-sm">{selectedItem.taskId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phase</span>
                      <span className="text-white">{selectedItem.phase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">대기 시간</span>
                      <span className="text-amber-400">{formatElapsedTime(selectedItem.timestamp || selectedItem.createdAt || '')}</span>
                    </div>
                  </div>

                  {/* Context-specific Info */}
                  {selectedItem.context && (
                    <div className="space-y-4">
                      {/* Missing fields for PRD_REVIEW */}
                      {selectedItem.context.missing && selectedItem.context.missing.length > 0 && (
                        <div className="bg-dark-card rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">누락된 항목</h4>
                          <ul className="list-disc list-inside text-gray-300 space-y-1">
                            {selectedItem.context.missing.map((item, i) => (
                              <li key={i} className="text-amber-400">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Dangerous queries for QUERY_REVIEW */}
                      {selectedItem.context.dangerousQueries && selectedItem.context.dangerousQueries.length > 0 && (
                        <div className="bg-dark-card rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">위험한 쿼리</h4>
                          <div className="space-y-2">
                            {selectedItem.context.dangerousQueries.map((q, i) => (
                              <div key={i} className="bg-red-500/10 border border-red-500/30 rounded p-3">
                                <span className="text-red-400 text-xs font-medium">{q.type}</span>
                                <pre className="text-gray-300 text-sm mt-1 overflow-x-auto">{q.query}</pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files for DESIGN_APPROVAL */}
                      {selectedItem.context.files && (
                        <div className="bg-dark-card rounded-lg p-4">
                          <h4 className="font-semibold text-white mb-2">생성된 설계 문서</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedItem.context.files).map(([name, status]) => (
                              status && (
                                <div key={name} className="bg-blue-500/10 border border-blue-500/30 rounded px-3 py-2 flex items-center gap-2">
                                  <span>📄</span>
                                  <span className="text-blue-400">{name.toUpperCase()}.md</span>
                                </div>
                              )
                            ))}
                          </div>
                          {selectedItem.context.docsPath && (
                            <p className="text-gray-500 text-sm mt-2">
                              경로: {selectedItem.context.docsPath}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Retry count for MANUAL_FIX */}
                      {selectedItem.context.retryCount !== undefined && (
                        <div className="bg-dark-card rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">재시도 횟수</span>
                            <span className="text-purple-400 font-bold">{selectedItem.context.retryCount}회 실패</span>
                          </div>
                        </div>
                      )}

                      {/* Review score for DEPLOY_APPROVAL */}
                      {selectedItem.context.reviewScore !== undefined && (
                        <div className="bg-dark-card rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Review Score</span>
                            <span className="text-green-400 font-bold">{selectedItem.context.reviewScore}점</span>
                          </div>
                        </div>
                      )}

                      {/* Message */}
                      {selectedItem.context.message && (
                        <div className="bg-dark-card rounded-lg p-4">
                          <p className="text-gray-300">{selectedItem.context.message}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Input */}
                  <div>
                    <label className="text-sm font-semibold text-white mb-2 block">
                      코멘트 (선택)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="승인 시 코멘트..."
                      className="w-full bg-dark-card border border-dark-border rounded-lg p-3 text-white placeholder-gray-500 resize-none h-20"
                    />
                  </div>

                  {/* Reject Reason */}
                  <div>
                    <label className="text-sm font-semibold text-white mb-2 block">
                      거부 사유 (거부 시 필수)
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="거부 사유를 입력하세요..."
                      className="w-full bg-dark-card border border-dark-border rounded-lg p-3 text-white placeholder-gray-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
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

                  {/* Resume Guide */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-400 text-sm">
                      <strong>참고:</strong> 승인 후 터미널에서 오케스트레이터를 다시 실행해야 작업이 재개됩니다.
                    </p>
                  </div>
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
              Human-In-The-Loop 승인 시스템 v1.1
            </span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default HITLPanel;
