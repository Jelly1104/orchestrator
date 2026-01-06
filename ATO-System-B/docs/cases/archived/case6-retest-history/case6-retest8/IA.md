# IA.md - 오케스트레이터 통합 기능 검증 시스템

## 정보 구조 (Information Architecture)

### 1. 메인 네비게이션

```
오케스트레이터 검증 시스템
├── Phase A: 분석 (Analysis Dashboard)
│   ├── A1. 활성 회원 세그먼트
│   ├── A2. 전문과목별 분포
│   ├── A3. 로그인 패턴
│   └── A4. 결과 해석
├── Phase B: 설계 (Design Documents)
│   ├── B1. IA 설계
│   ├── B2. Wireframe 생성
│   ├── B3. SDD 작성
│   └── B4. HANDOFF 생성
├── Phase C: 구현 (Code Implementation)
│   ├── C1. API 엔드포인트
│   ├── C2. React 컴포넌트
│   ├── C3. 테스트 코드
│   └── C4. Output Validation
└── 검증 현황 (Validation Status)
    ├── 파이프라인 진행상황
    ├── HITL 체크포인트
    ├── 성공 지표 대시보드
    └── 시스템 메트릭
```

### 2. 라우팅 구조

```
/orchestrator-validation
├── /dashboard (메인 대시보드)
├── /analysis (Phase A 분석)
│   ├── /segments (회원 세그먼트)
│   ├── /distribution (전문과목 분포)
│   ├── /login-patterns (로그인 패턴)
│   └── /insights (결과 해석)
├── /design (Phase B 설계)
│   ├── /ia (정보 구조 설계)
│   ├── /wireframes (화면 설계)
│   ├── /sdd (시스템 설계)
│   └── /handoff (작업 지시서)
├── /implementation (Phase C 구현)
│   ├── /backend (API 구현)
│   ├── /frontend (컴포넌트 구현)
│   ├── /testing (테스트 코드)
│   └── /validation (산출물 검증)
└── /monitoring (모니터링)
    ├── /pipeline (파이프라인 상태)
    ├── /metrics (시스템 메트릭)
    └── /logs (실행 로그)
```

### 3. 데이터 플로우

```
입력 데이터
├── PRD 문서 (case6-orchestrator-validation)
├── DOMAIN_SCHEMA 참조 (USERS, USER_DETAIL, USER_LOGIN)
└── 검증 파라미터 (success criteria, constraints)
    ↓
Phase A: 데이터 분석
├── SQL 생성 → 쿼리 실행 → 결과 수집
└── 통계 분석 → 패턴 식별 → 인사이트 도출
    ↓
Phase B: 설계 생성
├── IA 구조 설계 → Wireframe 화면 설계
└── SDD 시스템 설계 → HANDOFF 작업 지시
    ↓
Phase C: 코드 구현
├── API 구현 → 컴포넌트 구현
└── 테스트 작성 → Output 검증
    ↓
최종 산출물
├── 분석 리포트 (analysis_result.json, insight_report.md)
├── 설계 문서 (IA.md, Wireframe.md, SDD.md, HANDOFF.md)
└── 구현 코드 (backend/*.ts, frontend/*.tsx, tests/*.test.ts)
```

### 4. 사용자 권한 매트릭스

| 기능 영역 | AI PM | QA 엔지니어 | DevOps | 시스템 |
|-----------|-------|-------------|--------|---------|
| Phase A 실행 | Read/Write | Read | Read | Execute |
| Phase B 실행 | Read/Write | Read | Read | Execute |
| Phase C 실행 | Read/Write | Read/Write | Read/Write | Execute |
| HITL 승인 | Approve | Review | Review | Trigger |
| 메트릭 모니터링 | Read | Read | Read/Write | Execute |
| 로그 조회 | Read | Read | Read | Execute |

### 5. 컴포넌트 계층 구조

```
ValidationApp
├── Header (네비게이션, 진행 상태)
├── Sidebar (Phase별 메뉴)
├── MainContent
│   ├── PhaseADashboard
│   │   ├── SegmentAnalysis
│   │   ├── DistributionChart
│   │   ├── LoginPatternChart
│   │   └── InsightPanel
│   ├── PhaseBDesign
│   │   ├── IAEditor
│   │   ├── WireframeViewer
│   │   ├── SDDDocument
│   │   └── HandoffGenerator
│   ├── PhaseCImplementation
│   │   ├── CodeEditor
│   │   ├── TestRunner
│   │   └── ValidationResults
│   └── MonitoringDashboard
│       ├── PipelineStatus
│       ├── MetricsPanel
│       └── LogViewer
└── Footer (시스템 상태, 버전 정보)
```