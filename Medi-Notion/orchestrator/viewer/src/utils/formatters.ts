/**
 * 공통 포맷터 유틸리티
 *
 * 설계 문서 기준 (orchestrator.js generateFriendlyTaskId):
 * - Task ID 형식: {case번호}-{keyword}-{timestamp/날짜}
 * - 예: case5-dormancy-1766037994472, recruit-agent-20251218
 */

/**
 * Task ID를 사용자 친화적 형식으로 변환
 * @param taskId - 원본 Task ID
 * @returns 표시용 이름
 */
export function formatTaskId(taskId: string): string {
  const parts = taskId.split('-');

  // 마지막 부분이 숫자(timestamp 또는 날짜)인지 확인
  const lastPart = parts[parts.length - 1];
  const isNumeric = /^\d+$/.test(lastPart);

  if (isNumeric && parts.length >= 2) {
    // timestamp/날짜 제외한 나머지를 이름으로 사용
    const nameParts = parts.slice(0, -1);
    const name = nameParts.join('-');

    // "task"만 남으면 timestamp 마지막 6자리 추가
    if (name === 'task') {
      return `task-${lastPart.slice(-6)}`;
    }
    return name;
  }

  // 기본: 앞 25자
  return taskId.length > 25 ? taskId.substring(0, 25) + '...' : taskId;
}

/**
 * 날짜를 상대적 시간으로 변환
 * @param timestamp - ISO 날짜 문자열
 * @returns 상대적 시간 표시
 */
export function formatRelativeDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return '오늘 ' + date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    }

    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return timestamp;
  }
}

/**
 * 날짜를 절대적 시간으로 변환
 * @param timestamp - ISO 날짜 문자열
 * @returns 절대적 시간 표시
 */
export function formatDateTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return timestamp;
  }
}

/**
 * 시간(ms)을 가독성 있는 형식으로 변환
 * @param ms - 밀리초
 * @returns 포맷된 시간
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * 토큰 수를 가독성 있는 형식으로 변환
 * @param tokens - 토큰 수
 * @returns 포맷된 토큰 수
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return String(tokens);
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}
