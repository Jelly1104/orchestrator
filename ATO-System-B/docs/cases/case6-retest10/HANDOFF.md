# HANDOFF.md - Sub-agent 작업 지시서

> **문서 버전**: 1.0.0  
> **작성일**: 2025-12-23  
> **세션 ID**: case6-orchestrator-validation-20251223  
> **대상**: SubAgent, AnalysisAgent

---

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목 | 구현 방식 | 담당 Agent | 우선순위 |
|-------------------|-----------|------------|----------|
| **Phase A 산출물** ||||
| segment_query.sql | SQL_QUERY 생성 + 실행 | AnalysisAgent | P0 |
| distribution_query.sql | SQL_QUERY 생성 + 실행 | AnalysisAgent | P0 |
| login_pattern_query.sql | SQL_QUERY 생성 + 실행 | AnalysisAgent | P0 |
| analysis_result.json | ANALYSIS_TABLE 구조화 | AnalysisAgent | P0 |
| insight_report.md | REPORT 생성 (패턴 분석) | AnalysisAgent | P1 |
| **Phase B 산출물** ||||
| IA.md | IA_DOCUMENT (정보구조) | ✅ LeaderAgent 완료 | P0 |
| Wireframe.md | WIREFRAME (화면설계) | ✅ LeaderAgent 완료 | P0 |
| SDD.md | SDD (시스템설계) | ✅ LeaderAgent 완료 | P0 |
| HANDOFF.md | HANDOFF (작업지시서) | ✅ LeaderAgent 완료 | P0 |
| **Phase C 산출물** ||||
| backend/src/features/analytics/*.ts | CODE (TypeScript) | SubAgent | P0 |
| frontend/src/features/analytics/*.tsx | CODE (React+TS) | SubAgent | P0 |
| */tests/*.test.ts | TEST (Jest) | SubAgent | P0 |

## Mode

**MIXED** - 3단계 순차 실행
1. **Analysis Mode**: AnalysisAgent → SQL 쿼리 생성 및 실행
2. **Planning Mode**: LeaderAgent → 설계 문서 생성 (완료됨)
3. **Coding Mode**: SubAgent → 코드 및 테스트 구현

## Required Outputs

### Phase A: AnalysisAgent 산출물

| 파일명 | 타입 | 설명 | 검증 기준 |
|--------|------|------|----------|
| `queries/segment_query.sql` | SQL_QUERY | 활성 회원 세그먼트 조회 | DOMAIN_SCHEMA 컬럼명 준수, 실행 가능 |
| `queries/distribution_query.sql` | SQL_QUERY | 전문과목별 분포 분석 | JOIN 정확성, 인덱스 활용 |
| `queries/login_pattern_query.sql` | SQL_QUERY | 로그인 패턴 분석 | LIMIT 포함, 30초 내 실행 |
| `results/analysis_result.json` | ANALYSIS_TABLE | 쿼리 실행 결과 | 스키마 정의, 데이터 존재 |
| `reports/insight_report.md` | REPORT | 분석 인사이트 | 패턴 식별, 비즈니스 해석 |

### Phase C: SubAgent 산출물

| 파일명 | 타입 | 설명 | 검증 기준 |
|--------|------|------|----------|
| `backend/src/features/analytics/analytics.controller.ts` | CODE | API 컨트롤러 | TypeScript strict, NestJS 패턴 |
| `backend/src/features/analytics/analytics.service.ts` | CODE | 비즈니스 로직 | 레거시 DB 매핑 정확 |
| `backend/src/features/analytics/analytics.repository.ts` | CODE | 데이터 액세스 | DOMAIN_SCHEMA 컬럼명 준수 |
| `backend/src/features/analytics/dto/segment-query.dto.ts` | CODE | 요청/응답 DTO | 타입 안전성 |
| `backend/src/features/analytics/dto/analytics-response.dto.ts` | CODE | 응답 DTO | API 스펙 일치 |
| `frontend/src/features/analytics/AnalyticsDashboard.tsx` | CODE | 메인 대시보드 | React, TypeScript, Tailwind |
| `frontend/src/features/analytics/SegmentChart.tsx` | CODE | 세그먼트 차트 | Chart.js/Recharts 활용 |
| `frontend/src/features/analytics/LoginTrendChart.tsx` | CODE | 로그인 트렌드 차트 | 시계열 데이터 처리 |
| `frontend/src/features/analytics/FilterPanel.tsx` | CODE | 필터 패널 | 상태 관리 (Zustand/Context) |
| `backend/src/features/analytics/tests/analytics.service.test.ts` | TEST | 서비스 테스트 | Jest, 90%+ 커버리지 |
| `frontend/src/features/analytics/tests/AnalyticsDashboard.test.tsx` | TEST | 컴포넌트 테스트 | RTL, 주요 시나리오 |

## Input Documents

| 문서 | 역할 | 필수 참조 섹션 |
|------|------|---------------|
| `DOMAIN_SCHEMA.md` | 레거시 DB 스키마 정의 | 4. 핵심 레거시 스키마, 5. 쿼리 패턴 |
| `DB_ACCESS_POLICY.md` | 보안 제약사항 | 접근 권한, 쿼리 제한 |
| `CODE_STYLE.md` | 코딩 컨벤션 | 1.1 TypeScript, 2.2 FSD 패턴 |
| `TDD_WORKFLOW.md` | 테스트 작성 규칙 | Red-Green-Refactor 절차 |
| `SDD.md` | 시스템 설계 (위에서 생성) | API 설계, 컴포넌트 구조 |
| `Wireframe.md` | 화면 설계 (위에서 생성) | 컴포넌트 배치, 데이터 바인딩 |

## Completion Criteria

### Phase A 완료 기준 (AnalysisAgent)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| SQL 생성 성공률 | 100% | 4개 쿼리 모두 신택스 오류 없음 |
| 스키마 일치율 | 100% | DOMAIN_SCHEMA.md 컬럼명 대조 |
| 쿼리 실행 성공 | 100% | 실제 DB 연결 후 결과 반환 |
| 실행 시간 | ≤ 30초 | 각 쿼리별 타임아웃 준수 |
| 결과 데이터 존재 | > 0행 | analysis_result.json에 데이터 포함 |

### Phase C 완료 기준 (SubAgent)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 빌드 성공 | PASS | TypeScript 컴파일 오류 없음 |
| 린트 통과 | PASS | ESLint, Prettier 규칙 준수 |
| 테스트 커버리지 | ≥ 90% | Jest coverage report |
| 테스트 통과 | 100% | 모든 테스트 케이스 PASS |
| Protected Path 위반 | 0건 | .claude/ 수정 시도 없음 |

### 전체 파이프라인 완료 기준

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| HITL 체크포인트 | 최소 2회 | 쿼리 검토, 설계 승인 |
| 재시도 횟수 | ≤ 3회 | 각 Phase별 재시도 로그 |
| 보안 위반 | 0건 | audit 로그 확인 |
| 전체 소요 시간 | ≤ 60분 | 세션 시작~종료 시간 |

## Constraints

### 기술 제약사항

| 제약 | 세부사항 | 위반 시 대응 |
|------|----------|-------------|
| TypeScript strict | compilerOptions.strict: true | 빌드 실패 |
| 레거시 컬럼명 보존 | U_ID, U_KIND, U_ALIVE 등 | 쿼리 검증 실패 |
| FSD 폴더 구조 | features/{domain}/{layer} | 구조 검증 실패 |
| TDD 절차 | Red→Green→Refactor | 테스트 먼저 작성 |

### 보안 제약사항

| 제약 | 세부사항 | 위반 시 대응 |
|------|----------|-------------|
| SELECT Only | INSERT/UPDATE/DELETE 금지 | SQL 파싱 단계 차단 |
| Protected Path | .claude/rules/* 수정 금지 | 즉시 차단, 감사 로그 |
| Row Limit | 최대 10,000행 | 강제 LIMIT 추가 |
| Timeout | 30초 제한 | 쿼리 자동 중단 |

### HITL 체크포인트

| 체크포인트 | 트리거 조건 | 예상 발생 시점 | 대기 시간 |
|-----------|-------------|---------------|----------|
| 쿼리 검토 | SQL 결과 이상 또는 보안 위험 | Phase A 완료 후 | 최대 5분 |
| 설계 승인 | IA/SDD/HANDOFF 생성 완료 | Phase B 완료 후 | 최대 10분 |
| 수동 수정 | 자동 Review 3회 연속 FAIL | Phase C 중 (조건부) | 최대 15분 |

## 세부 작업 지시

### AnalysisAgent 지시사항

```yaml
task: "Phase A 정량적 분석 실행"
priority: P0

step1_segment_query:
  - USERS 테이블에서 U_ALIVE='Y' 회원 추출
  - U_KIND별 집계 (DOC001, PHA001 등)
  - 비율 계산 포함
  - 실행 시간 < 5초 목표

step2_distribution_query:
  - USER_DETAIL과 CODE_MASTER JOIN
  - U_MAJOR_CODE_1 기준 그룹핑
  - 전체 vs 활성 회원 비교
  - 차이 분석 (+5%p 이상)

step3_login_pattern_query:
  - USER_LOGIN 테이블 사용 (⚠️ 대용량)
  - 반드시 LIMIT 10000 포함
  - 최근 7일 범위 제한
  - 시간대별, 요일별 패턴 분석

step4_result_formatting:
  - analysis_result.json 구조화
  - 메타데이터 포함 (실행시간, 행수 등)
  - 스키마 정의 명시

step5_insight_generation:
  - 패턴 식별 및 해석
  - 비즈니스 인사이트 도출
  - insight_report.md 생성
```

### SubAgent 지시사항

```yaml
task: "Phase C 코드 구현"
priority: P0

backend_development:
  framework: NestJS
  language: TypeScript
  patterns:
    - Controller-Service-Repository
    - DTO validation
    - Exception handling
  database:
    - TypeORM entity (기존 테이블 매핑)
    - Repository pattern
    - 쿼리 최적화

frontend_development:
  framework: React 18
  language: TypeScript
  styling: Tailwind CSS
  structure: FSD (Feature-Sliced Design)
  components:
    - Dashboard (메인 화면)
    - Chart components (Chart.js)
    - Filter panel (상태 관리)
  state_management: Context API or Zustand

testing_strategy:
  backend:
    - Unit tests (Jest)
    - Service layer 중점 테스트
    - Database mocking
    - Error scenario 테스트
  frontend:
    - Component tests (RTL)
    - User interaction 테스트
    - API integration 테스트
```

## 예외 상황 대응

### Critical Failures

| 상황 | 대응 방안 | 에스컬레이션 |
|------|----------|-------------|
| DB 연결 실패 | 재시도 3회, 네트워크 확인 | 즉시 HITL 트리거 |
| 쿼리 타임아웃 | LIMIT 축소, 인덱스 확인 | 쿼리 검토 요청 |
| 보안 위반 감지 | 작업 즉시 중단, 감사 로그 | 보안팀 알람 |
| Protected Path 접근 | 차단, 경고 메시지 | 시스템 관리자 통보 |

### Performance Issues

| 상황 | 대응 방안 |
|------|----------|
| 메모리 사용량 > 80% | 가비지 컬렉션 강제 실행 |
| CPU 사용량 > 90% | 동시 작업 수 제한 |
| 응답 시간 > 10초 | 캐싱 전략 적용 |

## 성공 지표 모니터링

```yaml
real_time_metrics:
  - pipeline_progress: "Phase A → B → C"
  - sql_execution_time: "average < 5초"
  - test_coverage: "current ≥ 90%"
  - build_status: "PASS/FAIL"
  - hitl_pending: "count"

business_metrics:
  - data_accuracy: "스키마 일치율"
  - user_experience: "UI 반응성"
  - maintainability: "코드 품질 점수"
  - security_compliance: "위반 0건"

completion_tracking:
  phase_a: "SQL 4개 + 결과 1개 + 리포트 1개"
  phase_b: "완료됨 (IA, Wireframe, SDD, HANDOFF)"
  phase_c: "Backend 5개 + Frontend 4개 + Tests 2개"
```

---

## 최종 체크리스트

**AnalysisAgent 완료 확인**
- [ ] segment_query.sql 생성 및 실행 성공
- [ ] distribution_query.sql 생성 및 실행 성공  
- [ ] login_pattern_query.sql 생성 및 실행 성공 (LIMIT 포함)
- [ ] analysis_result.json 구조화 완료
- [ ] insight_report.md 인사이트 도출 완료
- [ ] 모든 쿼리 30초 내 실행 완료
- [ ] DOMAIN_SCHEMA.md 컬럼명 100% 일치
- [ ] HITL 쿼리 검토 통과

**SubAgent 완료 확인**
- [ ] Backend Controller/Service/Repository 생성
- [ ] Frontend Dashboard/Chart/Filter 컴포넌트 생성
- [ ] DTO 타입 정의 및 검증 로직
- [ ] Jest 테스트 90%+ 커버리지
- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 검증 통과
- [ ] Protected Path 위반 0건
- [ ] FSD 구조 준수

**파이프라인 전체 확인**
- [ ] 60분 내 전체 완료
- [ ] HITL 체크포인트 최소 2회 통과
- [ ] 보안 위반 0건
- [ ] 모든 PRD 산출물 생성 완료
- [ ] 성공 지표 목표치 달성