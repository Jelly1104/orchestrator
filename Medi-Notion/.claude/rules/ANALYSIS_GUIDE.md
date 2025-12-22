# 분석 Agent 가이드 v2.0

> **문서 버전**: 2.0.0
> **최종 업데이트**: 2025-12-19
> **관리자**: 미래전략실 (ATO Team)
> **통합 대상**: ANALYSIS_AGENT_SPEC.md, DB_ACCESS_POLICY.md

---

## 📋 Agent 로딩 설정

| Agent         | 로딩 문서                                          |
| ------------- | -------------------------------------------------- |
| AnalysisAgent | `.claude/rules/ANALYSIS_GUIDE.md` (이 문서)        |
| SubAgent      | `.claude/rules/ANALYSIS_GUIDE.md` (DB 정책 섹션만) |

---

## 1. AnalysisAgent 개요

### 1.1 왜 필요한가?

**문제 상황 (Case #4/#5)**:

- PRD: "HEAVY 세그먼트 분석 → SQL 쿼리 → 결과 해석"
- Orchestrator 동작: IA/Wireframe/SDD 생성 (설계 파이프라인)
- 결과: PRD와 산출물 불일치

**근본 원인**:

- 기존 Orchestrator는 **design 파이프라인**만 지원
- 정량적 분석(SQL 실행 → 데이터 수집 → 해석)을 처리할 Agent 부재

**해결책**:

- **AnalysisAgent** 신규 개발
- PRD type이 `QUANTITATIVE` 또는 `MIXED`일 때 호출

---

### 1.2 Agent 역할 비교

| Agent             | 역할                 | 입력         | 출력               |
| ----------------- | -------------------- | ------------ | ------------------ |
| **LeaderAgent**   | 전체 조율, 설계 문서 | PRD          | IA, Wireframe, SDD |
| **SubAgent**      | 코드 구현            | Task + SDD   | 소스 코드          |
| **AnalysisAgent** | 데이터 분석          | PRD + Schema | SQL, 결과, 리포트  |

---

## 2. AnalysisAgent 파이프라인

```
[입력] PRD (type: QUANTITATIVE | MIXED) + DOMAIN_SCHEMA.md + DB 연결 정보

Step 1: PRD 파싱
  - 분석 요구사항 추출
  - 필요 테이블/컬럼 식별
  - 산출물 체크리스트 확인
        ↓
Step 2: 스키마 검증
  - DOMAIN_SCHEMA.md와 대조
  - 테이블/컬럼 존재 확인
  - 누락 시 사용자 확인 요청
        ↓
Step 3: SQL 쿼리 생성
  - PRD 요구사항 → SQL 변환
  - SELECT only 제약
  - 성능 고려 (인덱스, LIMIT)
        ↓
Step 4: SQL 실행
  - Bash + mysql 명령 실행
  - 결과 데이터 수집
  - 오류 시 쿼리 수정 및 재시도 (최대 3회)
        ↓
Step 5: 결과 해석 (MIXED일 때)
  - 데이터 → 통계 요약
  - 패턴/이상치 식별
  - 인사이트 도출
        ↓
Step 6: 산출물 생성
  - src/analysis/*.sql
  - src/analysis/results/*.json
  - reports/analysis_report.md

[출력] SQL 파일, 결과 데이터, 분석 리포트
```

---

## 3. DB 접근 정책

### 3.1 스토리지 선택 기준

```
🟢 허용 (개발/테스트 시 우선 사용)
  • 메모리 (In-memory)     → Mock 데이터, 단위 테스트
  • 파일 (JSON/CSV)        → 로컬 테스트 데이터
  • SQLite                 → 로컬 DB 테스트
  • Redis (로컬)           → 캐시/세션 테스트

🔴 제한 (Production MySQL)
  • SELECT                 → ✅ 허용 (readonly 계정)
  • INSERT/UPDATE/DELETE   → 🔴 금지 (AI 에이전트)
  • DDL (CREATE/ALTER/DROP)→ 🔴 절대 금지
```

**원칙**: AI 에이전트는 **로컬 스토리지 우선**, Production DB는 **조회 전용**

---

### 3.2 MySQL 계정 분리

| 계정                  | 용도                    | 권한                           |
| --------------------- | ----------------------- | ------------------------------ |
| **medigate_readonly** | AI 에이전트 기본 계정   | SELECT                         |
| **medigate_write**    | Leader 승인 후에만 사용 | SELECT, INSERT, UPDATE, DELETE |

```sql
-- 읽기 전용 계정 생성 (AI 에이전트용)
CREATE USER 'medigate_readonly'@'%' IDENTIFIED BY '[READONLY_PASSWORD]';
GRANT SELECT ON medigate.* TO 'medigate_readonly'@'%';

-- 쓰기 계정 (프로덕션 배포용)
CREATE USER 'medigate_write'@'%' IDENTIFIED BY '[WRITE_PASSWORD]';
GRANT SELECT, INSERT, UPDATE, DELETE ON medigate.* TO 'medigate_write'@'%';
```

---

### 3.3 환경별 설정

**개발 환경 (.env.development)**:

```env
DB_USER=medigate_readonly
DB_PASSWORD=[READONLY_PASSWORD]
DB_HOST=localhost
DB_NAME=medigate
```

**프로덕션 환경 (.env.production)**:

```env
# CI/CD 파이프라인에서만 쓰기 권한 사용
DB_USER=medigate_write
DB_PASSWORD=[WRITE_PASSWORD]
DB_HOST=[PRODUCTION_HOST]
DB_NAME=medigate
```

---

### 3.4 에이전트 접근 규칙

| Agent         | 사용 계정                | 허용   | 금지                   |
| ------------- | ------------------------ | ------ | ---------------------- |
| SubAgent      | medigate_readonly        | SELECT | INSERT, UPDATE, DELETE |
| AnalysisAgent | medigate_readonly        | SELECT | INSERT, UPDATE, DELETE |
| Leader        | medigate_readonly (기본) | SELECT | 쓰기는 승인 후         |

---

### 3.5 위반 시 대응

**자동 차단**:

1. 쓰기 쿼리 감지 시 → 쿼리 실행 전 파싱하여 INSERT/UPDATE/DELETE 감지 → 즉시 차단 및 로깅
2. 권한 에러 발생 시 → MySQL 에러 로그 기록 → 알림 발송

**로깅**:

```javascript
logger.info({
  timestamp: new Date().toISOString(),
  user: connection.config.user,
  query: sql,
  type: getQueryType(sql), // SELECT, INSERT, etc.
  agent: process.env.AGENT_ID,
});
```

---

## 4. SQL 생성 가이드

### 4.1 SQL 생성 제약사항

| 제약          | 설명                                       |
| ------------- | ------------------------------------------ |
| SELECT only   | INSERT/UPDATE/DELETE 금지                  |
| 인덱스 활용   | JOIN 시 인덱스 컬럼 사용                   |
| LIMIT 필수    | 대용량 테이블(USER_LOGIN, COMMENT) 접근 시 |
| 컬럼명 정확성 | DOMAIN_SCHEMA.md에 정의된 이름만 사용      |

---

### 4.2 대용량 데이터 분석 전략 (Strategy for Large Datasets)

분석 대상이 `DB_ACCESS_POLICY`의 제한(10,000행/30초)을 초과할 경우, 포기하지 말고 아래 전략을 **자동 적용**하십시오.

1. **통계적 샘플링 (Statistical Sampling)**:

   - 전체 전수 조사 대신 `RAND()` 등을 활용하여 5~10%의 표본을 추출해 경향성을 파악합니다.
   - 예: `WHERE RAND() <= 0.05` (MySQL 8.0+)

2. **배치 분할 처리 (Batch Processing)**:
   - 전수 조사가 반드시 필요하다면, `LIMIT/OFFSET` 또는 `ID` 범위 기반으로 쿼리를 여러 번 나누어 실행할 계획을 세웁니다.
   - 리포트에 "분할 실행된 데이터의 합계임"을 명시합니다.

---

### 4.3 SQL 생성 프롬프트

```
당신은 메디게이트 데이터베이스 전문가입니다.

## 분석 요구사항
{requirements}

## 스키마 정보
{DOMAIN_SCHEMA.md 내용}

## 제약사항
- SELECT 문만 사용 (INSERT/UPDATE/DELETE 금지)
- 대용량 테이블(USER_LOGIN, COMMENT) 접근 시 반드시 WHERE 조건과 LIMIT 사용
- 테이블/컬럼명은 정확히 DOMAIN_SCHEMA.md에 정의된 이름 사용
- JOIN 시 인덱스 컬럼 활용

## 출력 형식
{
  "queries": [
    { "name": "query_name", "description": "설명", "sql": "SELECT ..." }
  ]
}
```

---

### 4.3 결과 해석 프롬프트 (MIXED PRD용)

```
당신은 데이터 분석 전문가입니다.

## 분석 목적
{requirements.objective}

## 쿼리 실행 결과
{results}

## 요청사항
1. 결과 데이터에서 주요 패턴을 식별하세요
2. 전체 대비 +5%p 이상 차이가 있는 세그먼트를 찾으세요
3. 비즈니스 인사이트를 도출하세요
4. 실행 가능한 Use Case를 제안하세요

## 출력 형식
{
  "patterns": [...],
  "insights": [...],
  "recommendations": [...]
}
```

---

## 5. 오류 처리

### 5.1 오류 유형별 처리

| 오류 유형     | 예시                    | 처리 방법                             |
| ------------- | ----------------------- | ------------------------------------- |
| 스키마 불일치 | 존재하지 않는 컬럼      | 사용자 확인 요청 → DOMAIN_SCHEMA 갱신 |
| SQL 문법 오류 | JOIN 조건 누락          | 자동 수정 재시도 (최대 3회)           |
| 타임아웃      | 대용량 Full Scan        | LIMIT 추가, WHERE 조건 강화           |
| 빈 결과       | 조건에 맞는 데이터 없음 | 조건 완화 제안 또는 사용자 확인       |
| 권한 오류     | SELECT 권한 없음        | 사용자에게 DB 권한 확인 요청          |

---

### 5.2 재시도 정책

```
SQL 실행 실패 시:
  1차 재시도: 오류 기반 쿼리 자동 수정
  2차 재시도: 오류 기반 쿼리 자동 수정
  3차 실패: 사용자 개입 요청

수정 방향:
  - 문법 오류 → 문법 수정
  - 타임아웃 → LIMIT 추가 또는 조건 강화
  - 컬럼 오류 → 정확한 컬럼명 사용
```

---

## 6. Orchestrator 통합

### 6.1 라우팅 로직

```
PRD 입력
    ↓
PRD type/pipeline 확인
    ↓
┌─────────────┬─────────────┬─────────────┐
│  analysis   │   design    │   mixed     │
└─────────────┴─────────────┴─────────────┘
      ↓             ↓             ↓
 AnalysisAgent  LeaderAgent   AnalysisAgent
                              → LeaderAgent
```

---

### 6.2 Mixed Pipeline

```
Phase A: 분석 (AnalysisAgent)
  - SQL 쿼리 생성 및 실행
  - 결과 데이터 수집
        ↓
    [데이터 전달]
        ↓
Phase B: 설계/제안 (LeaderAgent)
  - 분석 결과 기반 인사이트 해석
  - Use Case 제안 문서 생성
```

---

## 7. 체크리스트

### 배포 전

- [ ] AI 에이전트용 읽기 전용 계정 생성
- [ ] 환경별 .env 파일 설정
- [ ] 쿼리 로깅 활성화
- [ ] 쓰기 쿼리 차단 미들웨어 적용

### 코드 리뷰 시

- [ ] 하드코딩된 DB 자격증명 없음
- [ ] 동적 쿼리에 SQL Injection 방지
- [ ] 적절한 계정 사용 (readonly vs write)

---

## 8. 관련 문서

| 문서                  | 물리적 경로                         | 역할                               |
| --------------------- | ----------------------------------- | ---------------------------------- |
| `DOMAIN_SCHEMA.md`    | `.claude/rules/DOMAIN_SCHEMA.md`    | 테이블/컬럼 정의, 스키마 검증 기준 |
| `PRD_GUIDE.md`        | `.claude/workflows/PRD_GUIDE.md`    | PRD 유형/파이프라인 정의           |
| `VALIDATION_GUIDE.md` | `.claude/rules/VALIDATION_GUIDE.md` | 산출물 검증 기준                   |

---

**END OF ANALYSIS_GUIDE.md**

_데이터는 거짓말하지 않습니다. 올바른 분석이 올바른 인사이트를 만듭니다._
