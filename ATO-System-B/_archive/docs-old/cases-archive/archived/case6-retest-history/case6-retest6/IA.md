# IA.md - 오케스트레이터 통합 검증 시스템

## 1. 시스템 정보 구조

### 1.1 메인 대시보드 계층

```
오케스트레이터 검증 대시보드
├── 1. 검증 개요 (Overview)
│   ├── 1.1 전체 진행 상태
│   ├── 1.2 Phase별 성공률
│   └── 1.3 실시간 메트릭
├── 2. Phase A: 정량적 분석
│   ├── 2.1 SQL 쿼리 실행 현황
│   ├── 2.2 활성 회원 세그먼트 결과
│   ├── 2.3 전문과목별 분포 분석
│   └── 2.4 로그인 패턴 분석
├── 3. Phase B: 정성적 설계
│   ├── 3.1 IA 설계 검증
│   ├── 3.2 Wireframe 생성 검증
│   ├── 3.3 SDD 작성 검증
│   └── 3.4 HANDOFF 생성 검증
├── 4. Phase C: 코드 구현
│   ├── 4.1 API 엔드포인트 생성
│   ├── 4.2 React 컴포넌트 구현
│   ├── 4.3 테스트 커버리지
│   └── 4.4 빌드/배포 상태
└── 5. HITL 체크포인트
    ├── 5.1 쿼리 검토 현황
    ├── 5.2 설계 승인 현황
    └── 5.3 수동 개입 이력
```

### 1.2 네비게이션 구조

| Level 1 | Level 2 | Level 3 | 라우팅 경로 |
|---------|---------|---------|-------------|
| Overview | - | - | `/dashboard` |
| Phase A | SQL Queries | Active Users | `/phase-a/sql/active-users` |
| Phase A | SQL Queries | Major Distribution | `/phase-a/sql/major-distribution` |
| Phase A | SQL Queries | Login Patterns | `/phase-a/sql/login-patterns` |
| Phase A | Analysis Results | Data Summary | `/phase-a/results/summary` |
| Phase B | Design Docs | IA Validation | `/phase-b/design/ia` |
| Phase B | Design Docs | Wireframe Check | `/phase-b/design/wireframe` |
| Phase B | Design Docs | SDD Review | `/phase-b/design/sdd` |
| Phase B | Design Docs | HANDOFF Status | `/phase-b/design/handoff` |
| Phase C | Code Output | API Endpoints | `/phase-c/code/api` |
| Phase C | Code Output | React Components | `/phase-c/code/react` |
| Phase C | Testing | Coverage Report | `/phase-c/testing/coverage` |
| HITL | Checkpoints | Query Review | `/hitl/query-review` |
| HITL | Checkpoints | Design Approval | `/hitl/design-approval` |

## 2. 데이터 흐름 구조

### 2.1 입력 데이터 소스

```
PRD Input → Gap Check → Pipeline Router
├── Phase A Input: DB Connection (medigate)
│   ├── USERS (활성 상태, 회원 유형)
│   ├── USER_DETAIL (전문과목, 근무형태)
│   └── USER_LOGIN (로그인 이력 - LIMIT 필수)
├── Phase B Input: Analysis Results
│   └── Phase A 산출물 + DOMAIN_SCHEMA.md
└── Phase C Input: Design Documents
    └── Phase B 산출물 (IA, Wireframe, SDD, HANDOFF)
```

### 2.2 출력 데이터 구조

```
검증 결과 Dashboard
├── 성공 지표 (Success Metrics)
│   ├── SQL 생성 성공률: 4/4 (100%)
│   ├── 스키마 일치율: 100%
│   ├── 테스트 커버리지: ≥90%
│   └── 빌드 성공 여부: PASS/FAIL
├── 시스템 지표 (System Metrics)
│   ├── 파이프라인 완주율
│   ├── HITL 트리거 횟수
│   ├── 재시도 횟수 (≤3회)
│   └── 보안 위반 건수 (0건)
└── 산출물 현황 (Output Status)
    ├── Phase A: 5개 파일
    ├── Phase B: 4개 문서
    └── Phase C: TypeScript/React 코드
```

## 3. 사용자 권한별 뷰 구조

### 3.1 AI PM 뷰 (관리자)

```
전체 시스템 상태
├── 실시간 파이프라인 모니터링
├── 에이전트별 성능 지표
├── HITL 승인 대기 항목
└── 시스템 설정 및 제어
```

### 3.2 QA 엔지니어 뷰

```
품질 검증 포커스
├── 테스트 결과 상세
├── 스키마 검증 현황
├── 코드 품질 지표
└── 버그 추적 및 리포트
```

### 3.3 DevOps 뷰

```
운영 관점 모니터링
├── 시스템 리소스 사용률
├── DB 연결 상태
├── 로깅 및 감사 추적
└── 배포 전 Sanity Check
```

## 4. 검색 및 필터링 구조

### 4.1 필터 카테고리

| 필터 그룹 | 옵션 | 기본값 |
|-----------|------|---------|
| Phase | A, B, C, All | All |
| Status | Running, Success, Failed, Pending | All |
| Agent | Leader, Sub, Analysis, Orchestrator | All |
| Date Range | Last Hour, Today, Last Week | Today |
| Priority | High, Medium, Low | All |

### 4.2 검색 스코프

```
Global Search
├── PRD Content
├── Error Messages
├── SQL Query Text
├── File Names
└── Log Messages
```

## 5. 알림 및 상태 구조

### 5.1 실시간 알림

```
Notification Center
├── HITL 승인 요청 (High Priority)
├── SQL 실행 실패 (Medium Priority)
├── 테스트 실패 (Medium Priority)
├── Phase 완료 (Low Priority)
└── 시스템 상태 변경 (Info)
```

### 5.2 상태 표시 시스템

| 상태 | 아이콘 | 색상 | 설명 |
|------|--------|------|------|
| Running | ⏳ | Blue | 실행 중 |
| Success | ✅ | Green | 성공 완료 |
| Failed | ❌ | Red | 실행 실패 |
| Pending | ⏸️ | Yellow | HITL 대기 |
| Warning | ⚠️ | Orange | 주의 필요 |

## 6. 반응형 레이아웃 구조

### 6.1 데스크톱 (≥1200px)

```
Header (고정)
├── 로고 + 제목
├── Phase 네비게이션 탭
└── 사용자 정보 + 설정

Main Content (3열 레이아웃)
├── Left Sidebar (300px)
│   └── 상세 필터 + 메뉴
├── Center Content (auto)
│   └── 메인 대시보드/차트
└── Right Sidebar (250px)
    └── 실시간 알림 + 상태

Footer
└── 시스템 정보 + 링크
```

### 6.2 태블릿 (768px-1199px)

```
Header (고정)
Hamburger Menu + 제목 + 알림

Main Content (2열 → 1열 전환)
├── 접이식 사이드바
└── 메인 콘텐츠 (100%)

Bottom Navigation
└── Phase 탭 네비게이션
```

### 6.3 모바일 (≤767px)

```
Header (고정)
Menu Button + 로고 + Notifications Badge

Main Content (1열, 세로 스크롤)
├── 요약 카드 (스와이프 가능)
├── 차트 (터치 상호작용)
└── 테이블 (가로 스크롤)

Bottom Tab Bar
├── Overview | Phase A | Phase B | Phase C | HITL
```

## 7. 접근성 (A11y) 구조

### 7.1 키보드 네비게이션

```
Tab Order
1. Skip to Main Content
2. Header Navigation
3. Filter Controls
4. Main Content Cards
5. Chart Controls
6. Data Tables
7. Footer Links
```

### 7.2 스크린 리더 지원

```
ARIA Labels
├── region: "Phase A Analysis Results"
├── status: "Pipeline Running"
├── alert: "SQL Query Failed"
├── tabpanel: "Active Users Data"
└── progressbar: "Test Coverage 92%"
```

## 8. 성능 최적화 구조

### 8.1 데이터 로딩 전략

```
Progressive Loading
├── Critical Above-fold (즉시)
├── Secondary Content (500ms 지연)
├── Charts/Visualizations (1s 지연)
└── Historical Data (On-demand)
```

### 8.2 캐싱 계층

```
Cache Strategy
├── Browser Cache: 정적 자원 (24h)
├── Memory Cache: 실시간 데이터 (5min)
├── Session Cache: 사용자 설정 (세션)
└── API Cache: 분석 결과 (1h)
```