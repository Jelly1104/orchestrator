# IA.md - 정보 구조

## 1. 서비스 정의
오케스트레이터 통합 기능의 검증을 위한 관리자 도구 및 모니터링 시스템

## 2. 페이지 계층 구조

```
/admin/orchestrator/
├── /dashboard                    # 오케스트레이터 대시보드
├── /agents                      # 에이전트 상태 관리
│   ├── /list                   # 에이전트 목록
│   ├── /detail/{agentId}       # 에이전트 상세
│   └── /logs/{agentId}         # 에이전트 실행 로그
├── /workflows                  # 워크플로우 관리  
│   ├── /list                   # 워크플로우 목록
│   ├── /detail/{workflowId}    # 워크플로우 상세
│   └── /execution/{executionId} # 실행 상세
├── /validation                 # 검증 도구
│   ├── /integration-test       # 통합 테스트
│   ├── /performance           # 성능 검증
│   └── /health-check          # 헬스 체크
└── /settings                   # 시스템 설정
    ├── /agents-config         # 에이전트 설정
    └── /orchestrator-config   # 오케스트레이터 설정
```

## 3. 라우팅 규칙

| 경로 | 컴포넌트 | 권한 | 설명 |
|------|----------|------|------|
| `/admin/orchestrator/dashboard` | OrchestratorDashboard | ADMIN | 전체 현황 대시보드 |
| `/admin/orchestrator/agents/list` | AgentListPage | ADMIN | 에이전트 목록 관리 |
| `/admin/orchestrator/workflows/list` | WorkflowListPage | ADMIN | 워크플로우 목록 |
| `/admin/orchestrator/validation/*` | ValidationPages | ADMIN | 검증 도구들 |

## 4. 데이터 소스 매핑

- 에이전트 정보: `ORCHESTRATOR_AGENTS` 테이블
- 워크플로우 실행 기록: `ORCHESTRATOR_EXECUTIONS` 테이블  
- 검증 결과: `ORCHESTRATOR_VALIDATIONS` 테이블
- 시스템 로그: `ORCHESTRATOR_LOGS` 테이블