# PRD: 오케스트레이터 통합 기능 검증

> **Case ID**: case6-retest12
> **PRD 버전**: 1.0.0
> **작성일**: 2025-12-26
> **작성자**: ATO Team
> **타입**: MIXED
> **파이프라인**: mixed

---

## 1. 목적 (Objective)

**오케스트레이터의 전체 파이프라인 정상 작동 여부를 검증하기 위해 실제 비즈니스 시나리오 기반 통합 테스트를 수행한다.**

### 1.1 검증 대상 컴포넌트

| 컴포넌트      | 검증 항목                                |
| ------------- | ---------------------------------------- |
| PRD Analyzer  | Gap Check, 유형 판별, 파이프라인 매칭    |
| Leader Agent  | Planning Mode, Review Mode, HANDOFF 생성 |
| SubAgent      | 코드 생성, TDD 준수, Output Validation   |
| AnalysisAgent | SQL 생성, 스키마 검증, 결과 해석         |
| Orchestrator  | 라우팅, 재시도, 로깅, 보안 레이어        |
| HITL          | 5개 체크포인트 트리거 확인               |

---

## 2. 타겟 유저 (Target User)

| 페르소나    | 역할                  | 사용 맥락             |
| ----------- | --------------------- | --------------------- |
| AI PM       | 오케스트레이터 관리자 | 시스템 정상 작동 검증 |
| QA 엔지니어 | 품질 검증             | 파이프라인 테스트     |
| DevOps      | 운영 담당             | 배포 전 sanity check  |

---

## 3. 핵심 기능 (Core Features)

### Phase A: 정량적 분석 (AnalysisAgent 검증)

| ID  | 기능                    | 검증 포인트                  |
| --- | ----------------------- | ---------------------------- |
| A1  | 활성 회원 세그먼트 조회 | SQL 생성, DOMAIN_SCHEMA 준수 |
| A2  | 전문과목별 분포 분석    | JOIN 쿼리, 인덱스 활용       |
| A3  | 로그인 패턴 분석        | 대용량 테이블 LIMIT 적용     |
| A4  | 결과 데이터 해석        | 통계 요약, 패턴 식별         |

**A1: 활성 회원 세그먼트 조회**

```
- USERS 테이블에서 U_ALIVE='Y' 회원 추출
- U_KIND별 분포 집계
- 최근 30일 로그인 회원 필터링 (USER_LOGIN JOIN)
```

**A2: 전문과목별 분포 분석**

```
- USER_DETAIL.U_MAJOR_CODE_1 기준 그룹핑
- 전체 회원 vs 활성 회원 비교
- +5%p 이상 차이 세그먼트 식별
```

**A3: 로그인 패턴 분석**

```
- USER_LOGIN 테이블 (대용량 - 반드시 LIMIT 필요)
- 시간대별 로그인 분포
- 요일별 패턴 분석
- DB_ACCESS_POLICY 제한: 10,000행, 30초 타임아웃
```

### Phase B: 정성적 설계 (Leader/SubAgent 검증)

| ID  | 기능                  | 검증 포인트                  |
| --- | --------------------- | ---------------------------- |
| B1  | 분석 대시보드 IA 설계 | 정보 구조, 네비게이션        |
| B2  | Wireframe 생성        | 화면 구조, 컴포넌트 배치     |
| B3  | SDD 작성              | 레거시 스키마 매핑, API 설계 |
| B4  | HANDOFF 생성          | 필수 섹션, 보안 검증         |

**B1: 분석 대시보드 IA**

```
- 메인 대시보드
  ├── 요약 카드 (KPI)
  ├── 세그먼트 분포 차트
  ├── 로그인 트렌드
  └── 필터 패널
```

**B2: Wireframe 요구사항**

```
- 반응형 레이아웃 (Desktop/Mobile)
- 차트 컴포넌트 (Bar, Line, Pie)
- 필터 드롭다운 (전문과목, 기간, 회원유형)
- 데이터 테이블 (정렬, 페이징)
```

---

## 4. 성공 지표 (Success Criteria)

### 4.1 정량적 지표

| 지표            | 목표  | 측정 방법               |
| --------------- | ----- | ----------------------- |
| SQL 생성 성공률 | 100%  | 4개 쿼리 모두 실행 가능 |
| 스키마 일치율   | 100%  | DOMAIN_SCHEMA.md 대조   |
| 테스트 커버리지 | >= 90% | Jest/Vitest 리포트      |
| 빌드 성공       | PASS  | TypeScript 컴파일       |

### 4.2 시스템 지표 (오케스트레이터)

| 지표            | 목표             | 측정 방법            |
| --------------- | ---------------- | -------------------- |
| 파이프라인 완주 | Phase A->B 완료  | 로그 확인            |
| HITL 트리거     | 최소 2회         | 설계 승인, 쿼리 검토 |
| 재시도 횟수     | <= 3회           | 메트릭 로그          |
| 보안 위반       | 0건              | audit 로그           |

---

## 5. PRD 유형 및 파이프라인

```yaml
type: MIXED
pipeline: mixed

rationale:
  - Phase A: 정량적 (SQL 실행 -> 데이터 수집)
  - Phase B: 정성적 (설계 문서 생성)

agent_routing:
  - Phase A: AnalysisAgent
  - Phase B: LeaderAgent
```

---

## 6. 데이터 요구사항 (정량적 Phase 필수)

### 6.1 필요 테이블

| 테이블      | 용도                 | 예상 행 수 | 제약          |
| ----------- | -------------------- | ---------- | ------------- |
| USERS       | 회원 기본 정보       | ~500K      | -             |
| USER_DETAIL | 회원 상세 (전문과목) | ~500K      | -             |
| USER_LOGIN  | 로그인 이력          | ~10M+      | LIMIT 필수    |

### 6.2 필요 컬럼

```yaml
USERS:
  - U_ID (PK)
  - U_KIND (회원 유형)
  - U_ALIVE (활성 여부)
  - REG_DATE (가입일)

USER_DETAIL:
  - U_ID (FK)
  - U_MAJOR_CODE_1 (전문과목)
  - U_WORK_TYPE_1 (근무형태)

USER_LOGIN:
  - U_ID (FK)
  - LOGIN_DATE (로그인 일시)
  - LOGIN_IP
```

---

## 7. 산출물 체크리스트

### Phase A 산출물

| 산출물                  | 타입           | 검증 기준                     |
| ----------------------- | -------------- | ----------------------------- |
| segment_query.sql       | SQL_QUERY      | DOMAIN_SCHEMA 일치, 실행 가능 |
| distribution_query.sql  | SQL_QUERY      | JOIN 정확성, 인덱스 활용      |
| login_pattern_query.sql | SQL_QUERY      | LIMIT 포함, 타임아웃 미초과   |
| analysis_result.json    | ANALYSIS_TABLE | 데이터 존재, 스키마 정의      |
| insight_report.md       | REPORT         | 패턴 식별, 인사이트 도출      |

### Phase B 산출물

| 산출물       | 타입        | 검증 기준             |
| ------------ | ----------- | --------------------- |
| IA.md        | IA_DOCUMENT | 레벨 구조, 네이밍     |
| Wireframe.md | WIREFRAME   | ASCII/Markdown 형식   |
| SDD.md       | SDD         | 레거시 매핑, API 정의 |
| HANDOFF.md   | HANDOFF     | 필수 섹션, 보안 검증  |

---

## 8. 제약사항 (Constraints)

### 8.1 기술 제약

| 제약            | 내용                | 참조 문서         |
| --------------- | ------------------- | ----------------- |
| TypeScript 필수 | strict: true        | CODE_STYLE.md     |
| 레거시 컬럼명   | 변환 금지 (U_ID 등) | CODE_STYLE.md 1.1 |

### 8.2 보안 제약

| 제약           | 내용                       | 참조 문서             |
| -------------- | -------------------------- | --------------------- |
| SELECT only    | INSERT/UPDATE/DELETE 금지  | DB_ACCESS_POLICY.md   |
| Protected Path | .claude/rules/* 수정 금지  | AGENT_ARCHITECTURE.md |
| 행 제한        | 10,000행 이하              | DB_ACCESS_POLICY.md   |
| 타임아웃       | 30초 이하                  | DB_ACCESS_POLICY.md   |

---

## 9. 검증 시나리오

### 9.1 Happy Path

```
1. PRD 입력 -> Gap Check PASS
2. 유형 판별 -> MIXED 확인
3. Phase A 실행 -> SQL 4개 생성 및 실행
4. [HITL] 쿼리 결과 검토 -> 승인
5. Phase B 실행 -> IA/Wireframe/SDD/HANDOFF 생성
6. [HITL] 설계 승인 -> 승인
7. Leader Review -> PASS
8. Doc-Sync 트리거 -> Notion 업로드 (Mock)
9. 최종 산출물 저장 -> 완료
```

---

## 10. 관련 문서

| 문서                    | 역할                  |
| ----------------------- | --------------------- |
| `DOMAIN_SCHEMA.md`      | 테이블/컬럼 정의      |
| `DB_ACCESS_POLICY.md`   | DB 접근 권한          |
| `AGENT_ARCHITECTURE.md` | 파이프라인 정의, HITL |
| `VALIDATION_GUIDE.md`   | 산출물 검증 기준      |

---

**END OF PRD**
