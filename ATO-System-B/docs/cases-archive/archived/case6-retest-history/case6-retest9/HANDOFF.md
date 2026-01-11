# HANDOFF.md - Sub-agent 작업 지시서

> **문서 ID**: HANDOFF-orchestrator-validation-20251223  
> **연관 PRD**: case6-orchestrator-validation-20251223  
> **Target Agent**: SubAgent (Coding Mode)  
> **생성일**: 2025-12-23

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목 | 구현 방식 | 담당 Agent | 우선순위 |
|-------------------|----------|------------|----------|
| segment_query.sql | AnalysisAgent가 이미 처리 | AnalysisAgent | DONE |
| distribution_query.sql | AnalysisAgent가 이미 처리 | AnalysisAgent | DONE |
| login_pattern_query.sql | AnalysisAgent가 이미 처리 | AnalysisAgent | DONE |
| analysis_result.json | AnalysisAgent가 이미 처리 | AnalysisAgent | DONE |
| insight_report.md | AnalysisAgent가 이미 처리 | AnalysisAgent | DONE |
| IA.md | Leader Agent가 이미 처리 | Leader Agent | DONE |
| Wireframe.md | Leader Agent가 이미 처리 | Leader Agent | DONE |
| SDD.md | Leader Agent가 이미 처리 | Leader Agent | DONE |
| HANDOFF.md | Leader Agent가 이미 처리 (이 문서) | Leader Agent | DONE |
| backend/src/features/analytics/*.ts | **TypeScript API 구현** | **SubAgent** | **HIGH** |
| frontend/src/features/analytics/*.tsx | **React 컴포넌트 구현** | **SubAgent** | **HIGH** |
| */tests/*.test.ts | **테스트 코드 작성** | **SubAgent** | **HIGH** |

**⚠️ SubAgent 핵심 임무**: Phase C 산출물 (코드 구현 + 테스트) 완성

## Mode
**CODING** - TypeScript/React 기반 풀스택 구현

## Required Outputs

### 1. Backend Implementation (우선순위 1)
```typescript
// 생성할 파일 목록 (정확한 경로)
backend/src/features/analytics/analytics.controller.ts
backend/src/features/analytics/analytics.service.ts
backend/src/features/analytics/analytics.repository.ts
backend/src/features/analytics/dto/segment-query.dto.ts
backend/src/features/analytics/dto/analytics-response.dto.ts
backend/src/features/analytics/tests/analytics.service.test.ts
```

### 2. Frontend Implementation (우선순위 2)  
```typescript
// 생성할 파일 목록 (정확한 경로)
frontend/src/features/analytics/AnalyticsDashboard.tsx
frontend/src/features/analytics/SegmentChart.tsx
frontend/src/features/analytics/LoginTrendChart.tsx
frontend/src/features/analytics/FilterPanel.tsx
frontend/src/features/analytics/tests/AnalyticsDashboard.test.tsx
```

### 3. API Endpoints 구현 요구사항

| Endpoint | Method | 기능 | 데이터 소스 |
|----------|--------|------|-------------|
| `/api/v1/validation/orchestrator/{caseId}/status` | GET | 전체 검증 상태 조회 | ORCHESTRATOR_VALIDATION_LOG |
| `/api/v1/validation/orchestrator/{caseId}/phase-a/results` | GET | Phase A 분석 결과 | SQL 실행 결과 + USERS/USER_DETAIL |
| `/api/v1/validation/orchestrator/{caseId}/phase-b/documents` | GET | Phase B 문서 정보 | 생성된 문서 메타데이터 |
| `/api/v1/validation/orchestrator/{caseId}/phase-c/implementation` | GET | Phase C 구현 결과 | 빌드/테스트 결과 |

## Input Documents

### 필수 참조 문서 (구현 시 반드시 확인)
1. **SDD.md** - API 인터페이스, 데이터 구조, 레거시 스키마 매핑
2. **Wireframe.md** - UI 컴포넌트 구조, 화면 레이아웃
3. **DOMAIN_SCHEMA.md** (.claude/rules/) - 레거시 테이블 스키마, 컬럼명
4. **CODE_STYLE.md** (.claude/rules/) - TypeScript 규칙, FSD 패턴
5. **TDD_WORKFLOW.md** (.claude/rules/) - 테스트 작성 규칙

### 참조 데이터
- **분석 결과**: UKD001(일반 사용자) 63%, UST001(활성) 상태 사용자 중심
- **테이블 구조**: USERS (U_ID, U_KIND, U_ALIVE), USER_DETAIL (U_MAJOR_CODE_1)

## Completion Criteria

### 1. 정량적 기준 (반드시 달성)
- [ ] TypeScript 컴파일 성공 (strict: true)
- [ ] 모든 테스트 PASS (Jest/Vitest)
- [ ] 테스트 커버리지 ≥ 90%
- [ ] ESLint 오류 0개
- [ ] 빌드 성공 (backend + frontend)

### 2. 정성적 기준 (코드 품질)
- [ ] FSD (Feature-Sliced Design) 패턴 준수
- [ ] Tailwind CSS 사용 (React 컴포넌트)  
- [ ] TDD Red-Green-Refactor 사이클 준수
- [ ] 레거시 컬럼명 정확히 사용 (U_ID, U_KIND 등)
- [ ] API 응답 형태 SDD 스펙 일치

### 3. 보안 기준 (필수)
- [ ] Protected Path 접근 금지 (.claude/rules/* 등)
- [ ] SQL 쿼리 파라미터화 (SQL Injection 방지)
- [ ] SELECT only 준수 (INSERT/UPDATE/DELETE 금지)
- [ ] 행 수 제한 준수 (LIMIT 10,000)

### 4. 기능 기준 (PRD 성공지표 연계)
- [ ] 4개 API 엔드포인트 모두 구현
- [ ] 대시보드 UI 렌더링 성공
- [ ] 차트 컴포넌트 데이터 바인딩 성공
- [ ] 필터링 기능 동작 확인

## Constraints

### 기술적 제약사항
```yaml
Backend:
  - Framework: NestJS (권장) 또는 Express.js
  - Language: TypeScript (strict: true)
  - ORM: TypeORM 또는 Prisma (레거시 스키마 지원)
  - Testing: Jest + Supertest
  - Validation: class-validator + class-transformer

Frontend:  
  - Framework: React 18+ with TypeScript
  - Styling: Tailwind CSS (필수)
  - Charts: Chart.js 또는 Recharts
  - Testing: Vitest + Testing Library
  - Architecture: FSD 패턴 준수
```

### 레거시 연동 제약사항
```yaml
Database:
  - Host: "222.122.26.242" (Read-Only)
  - Schema: 정확한 컬럼명 사용 (DOMAIN_SCHEMA.md 참조)
  - Connection: Connection Pool 사용
  - Timeout: 30초 이하
  - Row Limit: 10,000행 이하

File System:
  - Protected Paths 접근 금지
  - 생성 경로: /frontend/src/features/, /backend/src/features/
  - 네이밍: kebab-case (파일), PascalCase (컴포넌트)
```

### 성능 제약사항
```yaml
API Response Time: ≤ 2초
Bundle Size: Frontend ≤ 500KB (gzipped)  
Memory Usage: ≤ 512MB (개발 환경)
Build Time: ≤ 60초 (전체)
```

## 구현 가이드라인

### 1. Backend 구현 순서
```typescript
1. DTO 정의 (SDD 인터페이스 기준)
2. Repository 계층 (레거시 DB 연동)  
3. Service 계층 (비즈니스 로직)
4. Controller 계층 (API 엔드포인트)
5. 테스트 코드 (각 계층별)
```

### 2. Frontend 구현 순서
```typescript  
1. 공통 컴포넌트 (FilterPanel, StatusBadge 등)
2. 차트 컴포넌트 (SegmentChart, LoginTrendChart)
3. 메인 대시보드 (AnalyticsDashboard)
4. 라우팅 및 상태 관리
5. 테스트 코드 (컴포넌트별)
```

### 3. TDD 사이클 준수
```typescript
// Red: 실패하는 테스트 작성
describe('AnalyticsService', () => {
  it('should return user segments data', async () => {
    const result = await service.getUserSegments('case6-orchestrator-validation');
    expect(result).toHaveLength(4); // UKD001, UKD003, UKD007, 기타
  });
});

// Green: 테스트를 통과하는 최소 구현
// Refactor: 코드 개선 (테스트는 그대로)
```

### 4. 레거시 스키마 매핑 예시
```typescript
// ❌ 잘못된 예 (추측된 컬럼명)
interface User {
  id: string;           // 틀림
  type: string;         // 틀림  
  isActive: boolean;    // 틀림
}

// ✅ 올바른 예 (DOMAIN_SCHEMA.md 준수)
interface LegacyUser {
  U_ID: string;         // 정확함
  U_KIND: string;       // 정확함  
  U_ALIVE: string;      // 정확함 (주의: boolean이 아니라 string)
}
```

## 에러 핸들링 및 검증

### 1. 실시간 검증 포인트
```typescript
// 컴파일 타임 검증
type SchemaValidation<T> = T extends keyof LegacySchema ? T : never;

// 런타임 검증  
function validateQuery(sql: string): void {
  if (sql.toUpperCase().includes('INSERT') || 
      sql.toUpperCase().includes('UPDATE') ||
      sql.toUpperCase().includes('DELETE')) {
    throw new SecurityError('Only SELECT queries allowed');
  }
}

// 파일 접근 검증
function validateFilePath(path: string): boolean {
  const protectedPaths = ['.claude/rules', '.claude/context'];
  return !protectedPaths.some(p => path.startsWith(p));
}
```

### 2. 오류 시나리오 대응
| 오류 상황 | 대응 방안 | 구현 위치 |
|-----------|----------|----------|
| DB 연결 실패 | 재시도 3회 + Circuit Breaker | Repository 계층 |
| SQL 타임아웃 | Query timeout 30초 설정 | DB Config |
| 대용량 데이터 | LIMIT 자동 적용 | Repository 메서드 |
| Protected Path 접근 | 즉시 차단 + 로깅 | Middleware |
| 빌드 실패 | 상세 에러 메시지 출력 | CI/CD Script |

## 완료 검증 체크리스트

### Phase 1: 개발 완료 확인
- [ ] 모든 파일 생성됨 (11개 파일)
- [ ] TypeScript 컴파일 오류 없음
- [ ] 테스트 실행 성공 (npm test)
- [ ] 린터 검사 통과 (npm run lint)

### Phase 2: 기능 검증
- [ ] API 서버 실행 성공 (localhost:3000)
- [ ] 4개 엔드포인트 응답 확인
- [ ] 프론트엔드 렌더링 성공 (localhost:5173)
- [ ] 차트 데이터 바인딩 확인

### Phase 3: 품질 검증  
- [ ] 테스트 커버리지 ≥ 90% 달성
- [ ] 보안 규칙 위반 0건
- [ ] 성능 기준 만족 (API 응답 ≤ 2초)
- [ ] 레거시 스키마 정확히 매핑

### Phase 4: 최종 승인
- [ ] Leader Agent 코드 리뷰 PASS
- [ ] 산출물 체크리스트 100% 완료
- [ ] PRD 성공 지표 달성 확인
- [ ] Output Validation 통과

---

**🎯 SubAgent 미션**: "오케스트레이터 검증을 위한 완전한 풀스택 애플리케이션을 TDD로 구현하라"

**⏰ 예상 소요시간**: 20분 (PRD 기준)
**🔥 핵심 성공 기준**: 테스트 커버리지 ≥ 90% + 빌드 성공 + 보안 규칙 준수