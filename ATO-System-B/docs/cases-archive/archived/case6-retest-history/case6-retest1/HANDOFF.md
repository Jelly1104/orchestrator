# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

PRD가 명시적으로 제공되지 않았으나, "오케스트레이터 통합 기능 검증"이라는 작업 제목을 기반으로 다음과 같이 매핑합니다:

| 예상 PRD 요구사항 | 구현 방식 | 담당 |
|------------------|-----------|------|
| 오케스트레이터 상태 모니터링 | 대시보드 페이지 + 실시간 API | Frontend + Backend |
| 에이전트 관리 기능 | 에이전트 목록/상세 페이지 | Frontend |
| 통합 검증 도구 | 검증 페이지 + 테스트 실행 API | Backend + Frontend |
| 워크플로우 추적 | 실행 기록 조회 기능 | Backend |
| 시스템 헬스체크 | 헬스체크 API + 알람 시스템 | Backend |

## Mode
**Coding** - 관리자 도구 개발 및 API 구현

## Required Outputs

### Backend (API) 개발
1. **오케스트레이터 관리 API**
   - `GET /api/v1/orchestrator/agents` - 에이전트 목록
   - `GET /api/v1/orchestrator/agents/{agentId}` - 에이전트 상세  
   - `POST /api/v1/orchestrator/agents/{agentId}/heartbeat` - 헬스체크
   - `GET /api/v1/orchestrator/workflows` - 워크플로우 기록
   - `POST /api/v1/orchestrator/workflows/execute` - 워크플로우 실행

2. **검증 API**
   - `POST /api/v1/orchestrator/validation/integration-test` - 통합 테스트 실행
   - `GET /api/v1/orchestrator/validation/results/{validationId}` - 검증 결과
   - `GET /api/v1/orchestrator/health` - 시스템 헬스체크

3. **실시간 모니터링**
   - WebSocket 엔드포인트: `WS /api/v1/orchestrator/monitor/stream`
   - 메트릭 API: `GET /api/v1/orchestrator/metrics/dashboard`

### Frontend 개발  
1. **관리자 대시보드** (`/admin/orchestrator/dashboard`)
   - 에이전트 상태 실시간 모니터링
   - 워크플로우 실행 현황
   - 시스템 메트릭 시각화

2. **에이전트 관리 페이지** (`/admin/orchestrator/agents/`)
   - 에이전트 목록 조회/필터링
   - 에이전트 상세 정보 조회
   - 설정 변경 인터페이스

3. **검증 도구 페이지** (`/admin/orchestrator/validation/`)
   - 통합 테스트 실행 UI
   - 테스트 결과 시각화
   - 성능 메트릭 차트

### 데이터베이스 설계
1. **신규 테이블 생성** (SDD의 스키마 참조)
   - `ORCHESTRATOR_AGENTS` - 에이전트 레지스트리
   - `ORCHESTRATOR_EXECUTIONS` - 워크플로우 실행 기록
   - `ORCHESTRATOR_VALIDATIONS` - 검증 결과
   - `ORCHESTRATOR_LOGS` - 시스템 로그

## Input Documents
- **IA.md**: 페이지 구조 및 라우팅 정의
- **Wireframe.md**: UI 컴포넌트 배치 및 데이터 바인딩
- **SDD.md**: API 스펙, 데이터베이스 스키마, 아키텍처 설계
- **DOMAIN_SCHEMA.md**: 기존 테이블 구조 (권한 관리용 USERS 테이블)

## Completion Criteria

### 기능적 요구사항
- [ ] 모든 에이전트의 상태를 실시간으로 모니터링 가능
- [ ] 워크플로우 실행 요청 및 결과 추적 가능  
- [ ] 통합 테스트 실행 및 결과 확인 가능
- [ ] 시스템 헬스체크 및 알람 기능 동작
- [ ] 관리자 권한 기반 접근 제어 적용

### 성능 요구사항  
- [ ] Agent Response Time < 3초
- [ ] Dashboard 로딩 시간 < 2초
- [ ] 실시간 업데이트 지연 시간 < 1초
- [ ] 동시 10개 워크플로우 처리 가능

### 검증 시나리오
- [ ] Agent Communication Test 통과
- [ ] Error Recovery Test 통과  
- [ ] Performance Load Test 통과
- [ ] Integration Test Suite 전체 통과

## Constraints

### 기술적 제약
- 기존 인증/권한 체계 활용 (USERS 테이블 연동)
- REST API + WebSocket 하이브리드 아키텍처
- MySQL 기반 데이터 저장
- 기존 프론트엔드 프레임워크와 일관성 유지

### 보안 제약
- 관리자 권한(`U_KIND = 'ADM001'`) 필수
- API 엔드포인트 모든 요청에 인증 토큰 검증
- 민감한 에이전트 설정 정보 암호화 저장
- 시스템 로그에 개인정보 포함 금지

### 운영 제약  
- 24시간 무중단 서비스 요구
- 기존 시스템과의 호환성 보장
- 점진적 배포 가능하도록 기능별 모듈화
- 롤백 가능한 데이터베이스 스키마 변경

### 개발 우선순위
1. **1단계**: 기본 모니터링 (대시보드, 에이전트 상태)
2. **2단계**: 워크플로우 관리 (실행, 추적)  
3. **3단계**: 검증 도구 (통합 테스트, 성능 테스트)
4. **4단계**: 고급 기능 (알람, 자동 복구)