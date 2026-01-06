---
name: query
description: SQL 쿼리 생성 및 데이터 분석. PRD 요구사항을 SELECT 쿼리로 변환하고 분석 인사이트를 도출한다.
version: 1.3.0
status: active
updated: 2026-01-06
implementation: orchestrator/skills/query/index.js
---

# Query Skill (Orchestrator용)

SQL 쿼리 생성 및 데이터 분석 전문가. "무엇이 일어났는가?" 분석 담당.

> ⚠️ **중요**: Query Skill은 SQL을 **생성**만 합니다. 실제 실행은 **Orchestrator**가 담당합니다.

## 핵심 역할

| 질문 | 역할 |
|------|------|
| **What** | "무엇이 일어났는가?" - 데이터 분석 |
| **Output** | SQL 쿼리, 실행 결과, 인사이트 |

## 제약사항

| 제약 | 설명 |
|------|------|
| SELECT only | INSERT/UPDATE/DELETE/DDL 금지 |
| 스키마 준수 | DOMAIN_SCHEMA.md 테이블/컬럼만 사용 |
| 결과 제한 | 10,000행 이하, 30초 타임아웃 |
| 보안 | 개인정보 직접 조회 금지, 집계만 허용 |

## Input Format

```json
{
  "analysisGoals": [
    "목표 1: 분석하고자 하는 내용",
    "목표 2: 추가 분석 내용"
  ],
  "targetSegment": "분석 대상 세그먼트 설명",
  "timeRange": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "additionalContext": "PRD에서 추출한 추가 맥락"
}
```

---

## Output Format

> ⚠️ **토큰 폭발 방지**: Raw data 전체를 JSON에 포함하지 않습니다.
> 10,000행 결과를 JSON으로 반환하면 토큰 한도 초과 위험이 있습니다.

```json
{
  "queries": [
    {
      "id": "Q1",
      "goal": "쿼리 목적",
      "sql": "SELECT ...",
      "expectedColumns": ["col1", "col2"],
      "estimatedRows": 5000
    }
  ],
  "results": [
    {
      "queryId": "Q1",
      "rowCount": 5234,
      "executionTime": "1.2s",
      "summary_data": {
        "preview_rows": [
          {"col1": "value1", "col2": 123},
          {"col1": "value2", "col2": 456}
        ],
        "aggregations": {
          "total_count": 5234,
          "avg_col2": 289.5,
          "max_col2": 1000,
          "min_col2": 10
        }
      },
      "file_path": "output/analysis/Q1_result_20251219.csv"
    }
  ],
  "insights": [
    {
      "finding": "발견 사항",
      "evidence": "summary_data의 aggregations 기반 근거",
      "recommendation": "제안 사항",
      "confidence": "high | medium | low"
    }
  ],
  "summary": "전체 분석 요약 (3-5문장)"
}
```

### 출력 최적화 원칙

| 항목 | 포함 여부 | 설명 |
|------|----------|------|
| `preview_rows` | ✅ | 상위 5-10행만 포함 (샘플) |
| `aggregations` | ✅ | COUNT, AVG, MAX, MIN 등 집계 |
| `file_path` | ✅ | 전체 데이터는 CSV 파일로 저장 |
| `raw_data` | ❌ | 전체 데이터 JSON 포함 금지 |
```

---

## Workflow (2단계 구조)

> Query Skill은 **Think → Generate** 단계만 담당합니다.
> **Execute → Observe** 단계는 Orchestrator가 처리합니다.

```
┌─────────────────────────────────────────────────────────┐
│                    Query Skill 영역                      │
├─────────────────────────────────────────────────────────┤
│ 1. Think: 분석 목표 해석, 필요 데이터 식별              │
│ 2. Generate: SQL 쿼리 생성 (DOMAIN_SCHEMA.md 기반)      │
│    └→ Output: queries[] (SQL 문 목록)                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Orchestrator 영역                      │
├─────────────────────────────────────────────────────────┤
│ 3. Execute: MySQL 클라이언트로 쿼리 실행                │
│ 4. Observe: 결과 수집, CSV 저장, summary_data 생성      │
│    └→ Output: results[] (실행 결과)                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Query Skill 영역                      │
├─────────────────────────────────────────────────────────┤
│ 5. Interpret: summary_data 기반 인사이트 도출           │
│    └→ Output: insights[], summary                       │
└─────────────────────────────────────────────────────────┘
```

### 단계별 상세

1. **Think (입력 분석)**
   - analysisGoals에서 필요한 데이터 항목 추출
   - 분석 유형 결정 (세그먼트/패턴/코호트)

2. **Generate (쿼리 생성)**
   - DOMAIN_SCHEMA.md에서 관련 테이블/컬럼 식별
   - 목표별 SQL 쿼리 작성
   - ⚠️ **스키마 검증**: 사용하려는 테이블/컬럼이 실제 존재하는지 확인

3. **Execute (Orchestrator)**
   - MySQL 클라이언트 실행
   - 결과를 CSV 파일로 저장

4. **Observe (Orchestrator)**
   - preview_rows (상위 N행) 추출
   - aggregations (집계 통계) 계산
   - summary_data 구성

5. **Interpret (인사이트 도출)**
   - summary_data 기반 발견 사항 정리
   - confidence 레벨 평가
   - 비즈니스 제안 사항 도출

---

## Error Handling

| 에러 유형 | 대응 방안 |
|----------|----------|
| 컬럼 없음 | DOMAIN_SCHEMA.md 재확인 후 대체 컬럼 사용 |
| 타임아웃 | LIMIT 추가 또는 조건 세분화 |
| 결과 없음 | 조건 완화 후 재시도 |
| 스키마 불일치 | Lead Agent에 보고 |
| 토큰 초과 | summary_data만 반환, 전체 데이터는 file_path로 |

### 스키마 Hallucination 방지

> ⚠️ LLM은 존재하지 않는 테이블/컬럼을 "생성"할 수 있습니다.

**자기 교정 프로세스:**

1. **생성 전 검증**: SQL 작성 전 DOMAIN_SCHEMA.md의 테이블 목록 확인
2. **쿼리 자체 검증**: 작성한 SQL에 사용된 테이블/컬럼을 다시 스키마와 대조
3. **실행 오류 시**: "Unknown column" 에러 발생 시 스키마 재확인 후 수정

```
자기 검증 체크리스트:
□ 사용한 테이블이 DOMAIN_SCHEMA.md에 존재하는가?
□ 사용한 컬럼이 해당 테이블에 존재하는가?
□ JOIN 조건의 외래키 관계가 올바른가?
□ 날짜 컬럼 형식이 맞는가? (DATE vs DATETIME)
```

---

## Profiler Skill과의 연계

Query Skill과 Profiler Skill은 상호 보완적 관계입니다.

```
┌───────────────┐          ┌────────────────┐
│  Query Skill  │ ──────── │ Profiler Skill │
│  (What)       │          │  (Who)         │
└───────────────┘          └────────────────┘
   "무엇이 일어났는가?"        "누가 그랬는가?"
```

### 시너지 패턴

| 패턴 | Query Skill 역할 | Profiler Skill 역할 |
|------|----------------|------------------|
| **세그먼트 분석** | 행동 데이터 집계 | 세그먼트 정의 제공 |
| **코호트 추적** | 기간별 통계 산출 | 코호트 그룹 식별 |
| **이탈 분석** | 이탈 시점 데이터 | 이탈자 프로필 특성 |

### 협업 흐름

```
1. Profiler Skill: "의사 회원 중 최근 3개월 비활성 사용자" 세그먼트 정의
       ↓
2. Query Skill: 해당 세그먼트의 과거 활동 패턴 분석 쿼리 실행
       ↓
3. Profiler Skill: 분석 결과를 프로필 인사이트로 통합
```

---

## Quality Checklist

- [ ] 모든 테이블/컬럼이 DOMAIN_SCHEMA.md에 존재
- [ ] SELECT 문만 사용 (DDL/DML 없음)
- [ ] 개인정보 직접 조회 없음 (집계만)
- [ ] LIMIT 절 포함 (최대 10,000행)
- [ ] summary_data 포함 (raw_data 제외)
- [ ] file_path로 전체 결과 저장
- [ ] insights에 confidence 레벨 명시

---

**END OF SKILL**
