# .claude/state/ - Leader/Sub-agent 상태 공유

## handoff-status.json 스키마

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-12-16T10:00:00Z",
  "currentHandoff": {
    "id": "case2-notification",
    "status": "in_progress | completed | failed",
    "startedAt": "2025-12-16T10:00:00Z",
    "completedAt": null,
    "agent": "cline",
    "handoffDoc": "docs/case2-notification/HANDOFF.md",
    "progress": {
      "totalFiles": 7,
      "completedFiles": 3,
      "currentTask": "Creating NotificationList.tsx"
    },
    "violations": [],
    "errors": []
  },
  "history": []
}
```

## 사용 규칙

### Sub-agent (Cline)
1. 작업 시작 시 `currentHandoff.status = "in_progress"` 설정
2. 파일 생성 시 `progress.completedFiles` 증가
3. 작업 완료 시 `status = "completed"`, `completedAt` 기록
4. 오류 발생 시 `errors` 배열에 추가

### Leader (Claude Code)
1. 상태 파일을 읽어 진행상황 확인
2. `violations` 배열 확인하여 .clinerules 위반 감지
3. `completed` 상태 시 코드 리뷰 시작

## .clinerules 연동

Sub-agent는 반드시 이 상태 파일을 업데이트해야 합니다.
위반 시 commit이 차단됩니다 (pre-commit hook).
