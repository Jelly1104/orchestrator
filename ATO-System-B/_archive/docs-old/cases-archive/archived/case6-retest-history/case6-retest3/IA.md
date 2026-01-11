# IA.md - 오케스트레이터 검증 대시보드 정보 구조

## 1. 사이트 구조

```
Dashboard Root /
├── Overview (메인 대시보드)
├── Phase Results
│   ├── Phase A: Analysis Results
│   ├── Phase B: Design Documents  
│   └── Phase C: Code Implementation
├── System Monitoring
│   ├── Pipeline Status
│   ├── Agent Performance
│   └── HITL Checkpoints
└── Validation Reports
    ├── Component Validation
    ├── Security Audit
    └── Performance Metrics
```

## 2. 페이지별 정보 구조

### 2.1 Overview Dashboard
```
Header
├── System Status Indicator
├── Current Phase Badge
└── Last Updated Timestamp

Main Content
├── KPI Cards Section
│   ├── Pipeline Success Rate
│   ├── Active Tests
│   ├── HITL Triggers
│   └── Security Violations
├── Phase Progress Tracker
├── Real-time Activity Feed
└── Quick Actions Panel

Sidebar
├── Navigation Menu
├── Test Scenario Selector
└── System Configuration
```

### 2.2 Phase A: Analysis Results
```
Navigation Breadcrumb
Data Analysis Results
├── SQL Query Results
│   ├── segment_query.sql Results
│   ├── distribution_query.sql Results  
│   └── login_pattern_query.sql Results
├── Analysis Tables
│   ├── User Segment Distribution
│   ├── Major Code Analysis
│   └── Login Pattern Analysis
├── Generated Insights
└── Data Quality Metrics
```

### 2.3 Phase B: Design Documents
```
Navigation Breadcrumb
Document Repository
├── Generated Documents
│   ├── IA.md Preview
│   ├── Wireframe.md Preview
│   ├── SDD.md Preview
│   └── HANDOFF.md Preview
├── Design Validation Status
├── Legacy Schema Mapping Review
└── HITL Approval Status
```

### 2.4 Phase C: Code Implementation  
```
Navigation Breadcrumb
Implementation Results
├── Backend Code
│   ├── Controller Files
│   ├── Service Files
│   ├── Repository Files
│   └── Test Coverage
├── Frontend Code
│   ├── Component Files
│   ├── Test Files
│   └── Build Status
├── Code Quality Metrics
└── TDD Compliance Report
```

## 3. 네비게이션 패턴

### 3.1 Primary Navigation
- **Dashboard**: 메인 개요 화면 (기본 랜딩)
- **Phases**: Phase A/B/C 결과 조회
- **Monitoring**: 시스템 상태 모니터링  
- **Reports**: 검증 및 성능 리포트

### 3.2 Secondary Navigation (Phase 내)
- **Results**: 산출물 결과 조회
- **Validation**: 검증 상태 확인
- **Logs**: 실행 로그 조회
- **Metrics**: 성능 지표 확인

### 3.3 Contextual Actions
- **Re-run Phase**: 특정 Phase 재실행
- **Export Results**: 결과 데이터 내보내기  
- **View Details**: 상세 정보 모달
- **Download Artifacts**: 산출물 다운로드

## 4. 데이터 흐름 구조

### 4.1 Real-time Data Flow
```
Orchestrator Events → WebSocket → Dashboard State → UI Components
```

### 4.2 Static Data Flow  
```
Generated Artifacts → File System → API → Dashboard Cache → UI
```

### 4.3 User Interaction Flow
```
User Action → API Request → Agent Processing → Result Update → UI Refresh
```

## 5. 상태 관리 구조

### 5.1 Global State
- **systemStatus**: 오케스트레이터 전체 상태
- **currentPhase**: 현재 실행 중인 Phase
- **testScenario**: 선택된 테스트 시나리오
- **hitlQueue**: HITL 대기 항목

### 5.2 Phase-specific State
- **phaseAResults**: 분석 결과 데이터
- **phaseBDocuments**: 설계 문서 상태
- **phaseCImplementation**: 구현 결과 상태

## 6. 접근 권한 구조

### 6.1 Role-based Access
- **AI PM**: 전체 접근 권한
- **QA Engineer**: 검증 결과 조회 권한
- **DevOps**: 시스템 모니터링 권한
- **Viewer**: 읽기 전용 권한

### 6.2 Feature Access Matrix
| Role | Dashboard | Phase Results | System Config | Raw Logs |
|------|-----------|---------------|---------------|----------|
| AI PM | ✅ | ✅ | ✅ | ✅ |
| QA Engineer | ✅ | ✅ | ❌ | ✅ |
| DevOps | ✅ | ✅ | ✅ | ✅ |
| Viewer | ✅ | ✅ | ❌ | ❌ |