# HANDOFF.md - 오케스트레이터 통합 기능 검증 구현 지시서

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목 | 구현 방식 | Sub-agent 담당 |
|-------------------|----------|---------------|
| **Phase A 산출물** | | |
| segment_query.sql | SQL 쿼리 파일 생성 | Analysis Agent |
| distribution_query.sql | SQL 쿼리 파일 생성 | Analysis Agent |
| login_pattern_query.sql | SQL 쿼리 파일 생성 | Analysis Agent |
| analysis_result.json | 데이터 분석 결과 JSON | Analysis Agent |
| insight_report.md | 인사이트 리포트 문서 | Analysis Agent |
| **Phase B 산출물** | | |
| IA.md | 정보 구조 문서 (완료됨) | Leader Agent ✅ |
| Wireframe.md | 화면 설계 문서 (완료됨) | Leader Agent ✅ |
| SDD.md | 시스템 설계 문서 (완료됨) | Leader Agent ✅ |
| HANDOFF.md | 작업 지시서 (현재 문서) | Leader Agent ✅ |
| **Phase C 산출물** | | |
| backend/src/features/analytics/*.ts | API 구현 (TypeScript) | Sub Agent |
| frontend/src/features/analytics/*.tsx | React 컴포넌트 | Sub Agent |
| */tests/*.test.ts | 테스트 코드 (Jest/Vitest) | Sub Agent |

## Mode
**MIXED** - 정량적 분석(Phase A) + 정성적 설계(Phase B) + 코드 구현(Phase C)

## Required Outputs

### Phase A: Analysis Agent 산출물
```yaml
파일명: segment_query.sql
내용: USERS 테이블 활성 회원 세그먼트 조회
검증: DOMAIN_SCHEMA 컬럼명 준수 (U_KIND, U_ALIVE)

파일명: distribution_query.sql  
내용: USER_DETAIL + CODE_MASTER JOIN 전문과목 분포
검증: 인덱스 활용, LIMIT 적용

파일명: login_pattern_query.sql
내용: USER_LOGIN 테이블 로그인 패턴 (⚠️ 대용량 - LIMIT 10000 필수)
검증: 타임아웃 30초 이하, 페이징 처리

파일명: analysis_result.json
내용: 3개 쿼리 실행 결과 데이터
스키마: SegmentAnalysisResponse, DistributionResponse, LoginPatternResponse

파일명: insight_report.md
내용: 데이터 패턴 분석 및 비즈니스 인사이트
포함: 핵심 발견사항, 권장 액션, 통계적 유의성
```

### Phase C: Sub Agent 산출물 (코드 구현)

#### Backend 구현 (Node.js + TypeScript)
```yaml
경로: backend/src/features/analytics/
구조:
  ├── analytics.controller.ts (RESTful API 엔드포인트)
  ├── analytics.service.ts (비즈니스 로직)
  ├── analytics.repository.ts (DB 접근 레이어)  
  ├── dto/
  │   ├── segment-query.dto.ts (요청/응답 DTO)
  │   └── analytics-response.dto.ts (API 응답 형식)
  └── tests/
      └── analytics.service.test.ts (TDD 테스트 코드)

API 엔드포인트:
- GET /api/v1/analytics/segments
- GET /api/v1/analytics/distribution
- GET /api/v1/analytics/login-patterns
- GET /api/v1/validation/pipeline-status
- GET /api/v1/validation/metrics

기술 요구사항:
- TypeScript strict 모드
- Express.js 프레임워크
- MySQL2 드라이버 (레거시 DB 연동)
- 에러 핸들링 (DB_TIMEOUT, SCHEMA_MISMATCH)
- 보안 검증 (SQL Injection 방지, SELECT only)
```

#### Frontend 구현 (React + TypeScript)
```yaml
경로: frontend/src/features/analytics/
구조:
  ├── AnalyticsDashboard.tsx (메인 대시보드)
  ├── SegmentChart.tsx (회원 세그먼트 차트)
  ├── DistributionChart.tsx (전문과목 분포 차트)
  ├── LoginTrendChart.tsx (로그인 패턴 차트)
  ├── FilterPanel.tsx (필터 컨트롤)
  ├── ValidationPanel.tsx (파이프라인 상태)
  └── tests/
      ├── AnalyticsDashboard.test.tsx
      └── SegmentChart.test.tsx

UI 라이브러리:
- React 18 + TypeScript
- Tailwind CSS (스타일링)
- Recharts (차트 라이브러리)
- Zustand (상태 관리)
- React Query (서버 상태)

레이아웃 요구사항:
- 반응형 디자인 (Desktop/Mobile)
- 실시간 데이터 갱신
- 로딩/에러 상태 처리
- 접근성 준수 (ARIA)
```

#### 테스트 코드 (TDD)
```yaml
백엔드 테스트:
- analytics.service.test.ts (비즈니스 로직 테스트)
- analytics.controller.test.ts (API 엔드포인트 테스트)
- 레거시 DB 모킹 (실제 컬럼명 사용)
- 에러 시나리오 테스트 (타임아웃, 제한 초과)

프론트엔드 테스트:
- 컴포넌트 렌더링 테스트
- 차트 데이터 바인딩 테스트
- 사용자 인터랙션 테스트
- 에러 바운더리 테스트

커버리지 목표: ≥ 90%
테스트 프레임워크: Jest (Backend), Vitest (Frontend)
```

## Input Documents

| 문서 | 역할 | Sub-agent 필수 참조 |
|------|------|-------------------|
| `DOMAIN_SCHEMA.md` | DB 스키마 정의 | ✅ 필수 - 실제 컬럼명 확인 |
| `DB_ACCESS_POLICY.md` | DB 접근 권한/제한 | ✅ 필수 - LIMIT, 타임아웃 준수 |  
| `CODE_STYLE.md` | 코딩 컨벤션 | ✅ 필수 - TypeScript/React 규칙 |
| `TDD_WORKFLOW.md` | TDD 절차 | ✅ 필수 - Red-Green-Refactor |
| `VALIDATION_GUIDE.md` | 산출물 검증 | ✅ 필수 - Output 검증 규칙 |

## Completion Criteria

### Phase A 완료 기준 (Analysis Agent)
- [ ] SQL 쿼리 3개 문법 오류 없이 실행 가능
- [ ] DOMAIN_SCHEMA.md의 실제 컬럼명 사용 (U_ID, U_KIND, U_ALIVE 등)
- [ ] USER_LOGIN 쿼리에 LIMIT 10,000 포함
- [ ] 실행 시간 30초 이하
- [ ] analysis_result.json 스키마 준수
- [ ] insight_report.md에 통계적 유의성 분석 포함

### Phase C 완료 기준 (Sub Agent)
- [ ] TypeScript 컴파일 에러 0개
- [ ] ESLint/Prettier 규칙 통과
- [ ] 테스트 커버리지 ≥ 90%
- [ ] API 응답 시간 < 5초
- [ ] 반응형 레이아웃 (Desktop/Mobile) 구현
- [ ] Protected Path 접근 시도 0건
- [ ] FSD 패턴 폴더 구조 준수

### 통합 검증 기준
- [ ] 파이프라인 Phase A → B → C 완전 실행
- [ ] HITL 체크포인트 최소 2회 트리거 (쿼리 검토, 설계 승인)
- [ ] 보안 위반 0건
- [ ] 모든 PRD 체크리스트 항목 산출물 존재

## Constraints

### 기술 제약사항
```yaml
Backend:
  - Node.js ≥ 18.x
  - TypeScript strict: true
  - Express.js 4.x
  - MySQL2 드라이버 (mysql 아님)
  - 환경변수 통한 DB 연결 (하드코딩 금지)

Frontend:
  - React 18 + TypeScript
  - Vite 빌드 도구
  - Tailwind CSS 3.x
  - 번들 크기 < 2MB

테스트:
  - Jest (Backend) + Vitest (Frontend)
  - TDD Red-Green-Refactor 사이클 준수
  - 모든 public 메소드 테스트 필수
```

### 보안 제약사항 (엄격 준수)
```yaml
DB 접근:
  - SELECT 쿼리만 허용
  - 최대 10,000행 제한
  - 타임아웃 30초
  - SQL Injection 방지 (Prepared Statement)

파일 시스템:
  - .claude/rules/ 디렉터리 접근 금지
  - .claude/workflows/ 디렉터리 접근 금지  
  - backend/config/ 민감 설정 접근 금지
  - 상위 디렉터리 접근 (.., ~) 금지

데이터 보호:
  - 개인식별정보(PII) 로그 기록 금지
  - DB 연결 정보 하드코딩 금지
  - API 키/토큰 평문 저장 금지
```

### 성능 제약사항
```yaml
응답 시간:
  - API 응답 < 5초
  - 차트 렌더링 < 2초
  - 페이지 로딩 < 3초

메모리 사용:
  - 백엔드 프로세스 < 512MB
  - 프론트엔드 번들 < 2MB
  - 차트 데이터 포인트 < 1000개

동시성:
  - 동시 사용자 100명 지원
  - DB 연결 풀 최대 10개
  - API 레이트 리밋 1000req/min
```

## 특수 지시사항

### HITL 체크포인트 처리
```yaml
Phase A 완료 후:
  trigger: 'sql_result_review'
  condition: SQL 실행 결과 이상 데이터 탐지
  action: 사용자 검토 요청, 승인 대기

Phase B 완료 후:  
  trigger: 'design_approval'
  condition: IA/SDD/HANDOFF 생성 완료
  action: 설계 문서 검토, 승인 대기

자동 승인 조건:
  - SQL 실행 시간 < 10초
  - 결과 행 수 < 5000개
  - 스키마 검증 100% 통과
  - 보안 위반 0건
```

### 에러 복구 전략
```yaml
DB 연결 실패:
  - 3회 재시도 (지수 백오프)
  - Circuit Breaker 패턴 적용
  - 캐시된 결과 반환 (가능 시)

쿼리 타임아웃:
  - LIMIT 값 50% 감소 후 재시도
  - 인덱스 힌트 추가
  - 실패 시 사용자 알림

메모리 부족:
  - 데이터 스트리밍 처리
  - 청크 단위 데이터 로드
  - GC 강제 실행
```

### 산출물 파일 경로 (엄격 준수)
```yaml
Analysis Agent 산출물:
  - queries/segment_query.sql
  - queries/distribution_query.sql  
  - queries/login_pattern_query.sql
  - results/analysis_result.json
  - reports/insight_report.md

Sub Agent 산출물:
  - backend/src/features/analytics/ (전체 폴더)
  - frontend/src/features/analytics/ (전체 폴더)
  - tests/ (각 기능별 테스트 파일)

⚠️ 주의: Protected Path 접근 금지
  - .claude/rules/ ❌
  - .claude/workflows/ ❌
  - backend/config/database.ts ❌
```

---

**END OF HANDOFF**

이 지시서는 오케스트레이터 통합 검증의 성공적 완료를 위한 완전한 구현 가이드입니다.
모든 제약사항과 요구사항을 엄격히 준수하여 구현하시기 바랍니다.