# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑

| PRD 체크리스트 항목 | 구현 방식 | 담당 Agent | 우선순위 |
|-------------------|-----------|------------|----------|
| segment_query.sql | SQL 쿼리 생성 (USERS, USER_DETAIL JOIN) | AnalysisAgent | P0 |
| distribution_query.sql | 전문과목별 집계 쿼리 생성 | AnalysisAgent | P0 |
| login_pattern_query.sql | USER_LOGIN 시간대별 패턴 쿼리 | AnalysisAgent | P0 |
| analysis_result.json | 쿼리 실행 결과 JSON 변환 | AnalysisAgent | P0 |
| insight_report.md | 데이터 패턴 분석 및 인사이트 도출 | AnalysisAgent | P1 |
| IA.md | 정보구조 설계 문서 | LeaderAgent | P0 |
| Wireframe.md | 화면 설계 문서 (ASCII/Markdown) | LeaderAgent | P0 |
| SDD.md | 시스템 설계 문서 (레거시 매핑 포함) | LeaderAgent | P0 |
| HANDOFF.md | Sub-agent 작업 지시서 | LeaderAgent | P0 |
| backend/src/features/analytics/*.ts | TypeScript 백엔드 코드 | SubAgent | P1 |
| frontend/src/features/analytics/*.tsx | React 컴포넌트 코드 | SubAgent | P1 |
| */tests/*.test.ts | 테스트 코드 (커버리지 ≥90%) | SubAgent | P1 |

## Mode
**MIXED** (Analysis → Design → Coding 순차 진행)

## Required Outputs

### Phase A: Analysis Outputs (AnalysisAgent)
1. **segment_query.sql**
   ```sql
   -- 활성 회원 세그먼트 조회
   -- ⚠️ U_ALIVE 값이 'UST001' 등 코드값임에 주의
   SELECT U_KIND, 
          CASE 
            WHEN U_ALIVE = 'UST001' THEN 'Active'
            WHEN U_ALIVE = 'UST003' THEN 'Inactive' 
            ELSE 'Unknown'
          END as status,
          COUNT(*) as count
   FROM USERS 
   GROUP BY U_KIND, U_ALIVE
   LIMIT 10000;
   ```

2. **distribution_query.sql**
   ```sql
   -- 전문과목별 분포 분석
   SELECT ud.U_MAJOR_CODE_1,
          cm.CODE_NAME as major_name,
          COUNT(*) as count,
          COUNT(*) * 100.0 / (SELECT COUNT(*) FROM USER_DETAIL) as percentage
   FROM USER_DETAIL ud
   LEFT JOIN CODE_MASTER cm ON cm.CODE_TYPE = 'MAJOR' AND cm.CODE_VALUE = ud.U_MAJOR_CODE_1
   WHERE ud.U_MAJOR_CODE_1 IS NOT NULL
   GROUP BY ud.U_MAJOR_CODE_1, cm.CODE_NAME
   ORDER BY count DESC
   LIMIT 50;
   ```

3. **login_pattern_query.sql**
   ```sql
   -- 로그인 패턴 분석 (대용량 테이블 - 반드시 LIMIT 적용)
   SELECT HOUR(LOGIN_DATE) as hour_of_day,
          DAYOFWEEK(LOGIN_DATE) as day_of_week,
          COUNT(*) as login_count
   FROM USER_LOGIN 
   WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
   GROUP BY HOUR(LOGIN_DATE), DAYOFWEEK(LOGIN_DATE)
   ORDER BY login_count DESC
   LIMIT 10000;
   ```

4. **analysis_result.json**
   - 실행 결과를 JSON 구조로 변환
   - 스키마 검증 (DOMAIN_SCHEMA.md 대조)
   - 성능 지표 (실행 시간, 행 수)

5. **insight_report.md**
   - 활성 사용자 0명 문제점 분석
   - UST 코드 체계 불일치 이슈
   - 개선 권고사항

### Phase B: Design Outputs (LeaderAgent - 이미 생성 완료)
- ✅ IA.md: 정보구조 설계
- ✅ Wireframe.md: 화면 레이아웃
- ✅ SDD.md: 시스템 설계 (레거시 매핑 포함)
- ✅ HANDOFF.md: 이 문서

### Phase C: Implementation Outputs (SubAgent)
1. **Backend TypeScript Code**
   ```
   backend/src/features/analytics/
   ├── analytics.controller.ts     # REST API 엔드포인트
   ├── analytics.service.ts        # 비즈니스 로직
   ├── analytics.repository.ts     # DB 쿼리 실행
   ├── dto/
   │   ├── segment-query.dto.ts    # 요청/응답 DTO
   │   └── analytics-response.dto.ts
   └── tests/
       └── analytics.service.test.ts # 단위 테스트
   ```

2. **Frontend React Components**
   ```
   frontend/src/features/analytics/
   ├── AnalyticsDashboard.tsx      # 메인 대시보드
   ├── SegmentChart.tsx           # 세그먼트 차트 컴포넌트
   ├── LoginTrendChart.tsx        # 로그인 트렌드 차트
   ├── FilterPanel.tsx            # 필터 패널
   └── tests/
       └── AnalyticsDashboard.test.tsx
   ```

3. **Test Coverage Requirements**
   - 백엔드 테스트 커버리지 ≥ 90%
   - 프론트엔드 테스트 커버리지 ≥ 90%
   - TDD 방식 준수 (Red → Green → Refactor)

## Input Documents

| 문서 | 용도 | 필수 참조 섹션 |
|------|------|---------------|
| `DOMAIN_SCHEMA.md` | 실제 DB 스키마 확인 | 4. 핵심 레거시 스키마 |
| `DB_ACCESS_POLICY.md` | 접근 권한 및 제약사항 | 보안 정책 전체 |
| `CODE_STYLE.md` | 코딩 컨벤션 | TypeScript, React 스타일 |
| `TDD_WORKFLOW.md` | 테스트 작성 절차 | TDD 사이클, 커버리지 기준 |

## Completion Criteria

### 정량적 지표
- [ ] SQL 생성 성공률: 4/4 (100%)
- [ ] 스키마 일치율: 100% (DOMAIN_SCHEMA.md 대조)
- [ ] 테스트 커버리지: ≥ 90%
- [ ] TypeScript 빌드: PASS (strict: true)

### 정성적 지표
- [ ] IA 완성도: 모든 화면 계층 정의
- [ ] Wireframe 명확성: ASCII 형식, 컴포넌트 배치 명확
- [ ] SDD 레거시 매핑: 모든 사용 테이블 매핑 완료
- [ ] HANDOFF 완성도: 모든 필수 섹션 포함

### 시스템 지표
- [ ] 파이프라인 완주: Phase A → B → C 완료
- [ ] HITL 트리거: 최소 2회 (쿼리 검토, 설계 승인)
- [ ] 재시도 횟수: ≤ 3회
- [ ] 보안 위반: 0건

## Constraints

### 기술 제약
- **TypeScript Strict Mode**: 반드시 `strict: true` 설정
- **레거시 컬럼명 보존**: `U_ID`, `U_ALIVE` 등 변환 금지
- **FSD 패턴**: 프론트엔드 폴더 구조 준수
- **TDD 필수**: 테스트 먼저 작성 후 구현

### 보안 제약
- **SELECT Only**: INSERT/UPDATE/DELETE 절대 금지
- **Protected Path**: `.claude/rules/*` 수정 절대 금지
- **Row Limit**: 10,000행 이하만 조회
- **Timeout**: 30초 이하 쿼리만 허용

### 데이터 제약
- **대용량 테이블**: `USER_LOGIN`은 반드시 LIMIT 적용
- **상태 코드**: U_ALIVE 값이 'Y'/'N'이 아닌 'UST00X' 형태임에 주의
- **JOIN 최적화**: 인덱스 활용 필수

## HITL 체크포인트

### 체크포인트 1: 쿼리 검토 (Phase A 완료 후)
- **트리거 조건**: SQL 4개 생성 완료 시
- **검토 항목**: 
  - 실제 컬럼명 사용 여부
  - 성능 최적화 (LIMIT, 인덱스)
  - 보안 정책 준수

### 체크포인트 2: 설계 승인 (Phase B 완료 후)
- **트리거 조건**: IA/Wireframe/SDD/HANDOFF 생성 완료 시
- **검토 항목**:
  - 레거시 스키마 매핑 정확성
  - PRD 요구사항 반영 완성도
  - API 설계 적절성

### 체크포인트 3: 수동 수정 (Review 3회 FAIL 시)
- **트리거 조건**: SubAgent Review가 3회 연속 실패 시
- **대응 방안**: 수동 수정 또는 요구사항 조정

## Security Validation

### Audit 체크리스트
- [ ] Protected Path 접근 시도 없음
- [ ] DB 권한 초과 쿼리 없음 (SELECT only)
- [ ] 민감 데이터 노출 방지
- [ ] 대용량 테이블 Full Scan 방지

### 위험 시나리오 대응
| 위험 상황 | 탐지 방법 | 대응 |
|---------|----------|------|
| Protected Path 수정 시도 | 파일 변경 모니터링 | 즉시 차단 |
| SQL Injection 시도 | 쿼리 패턴 검증 | 쿼리 거부 |
| 성능 이슈 쿼리 | 실행 시간 모니터링 | 타임아웃 처리 |

---

**중요**: 이 문서의 모든 항목은 PRD의 성공 지표와 연결되어 있습니다. 각 Phase의 완료 기준을 반드시 충족해야 다음 단계로 진행할 수 있습니다.