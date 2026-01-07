# ANALYSIS_GUIDE.md

> **버전**: 2.1.0 | **수정일**: 2025-12-29
> **정의**: 쿼리 전략, 샘플링, 파이프라인
> **대상**: Analyzer | **로딩**: 작업 시

---

## 로딩 설정

| Role     | 로딩 문서                        |
| -------- | -------------------------------- |
| Analyzer | 이 문서                          |
| Coder    | 이 문서 'SQL 생성 가이드'섹션 만 |

---

## Analyzer 개요

### 왜 필요한가?

| 문제                 | 원인                                  | 해결                |
| -------------------- | ------------------------------------- | ------------------- |
| PRD: "세그먼트 분석" | Orchestrator가 설계 파이프라인만 지원 | Analyzer Role 신설  |
| 산출물: IA/Wireframe | 정량 분석 처리 Role 부재              | Pipeline별 PRD 처리 |

### Role 비교

| Role     | 역할        | 입력             | 출력              |
| -------- | ----------- | ---------------- | ----------------- |
| Leader   | 전체 조율   | PRD              | 전략, HANDOFF     |
| Analyzer | 데이터 분석 | HANDOFF + Schema | SQL, 결과, 리포트 |
| Coder    | 코드 구현   | HANDOFF + SDD    | 소스 코드         |

---

## 파이프라인

```
[입력] HANDOFF.md + DOMAIN_SCHEMA.md

Step 1: HANDOFF 파싱 → 요구사항/테이블/컬럼 추출
Step 2: 스키마 검증 → DOMAIN_SCHEMA.md 대조
Step 3: SQL 생성 → SELECT only, 인덱스 활용
Step 4: SQL 실행 → 재시도 최대 3회
Step 5: 결과 해석 → 패턴/이상치/인사이트
Step 6: 산출물 → docs/cases/{caseId}/{taskId}/analysis/

[출력] *.sql, *.json, report.md
```

---

## DB 접근 정책 (요약)

> **상세 정책**: DB_ACCESS_POLICY.md의 **권한 레벨** 섹션 참조 (SSOT)

### 스토리지 선택

```
🟢 허용: 메모리, JSON/CSV, SQLite, Redis (로컬)
🔴 제한: Production MySQL → SELECT만 허용
```

### 접근 규칙

| Role     | 계정        | 허용   | 금지                   |
| -------- | ----------- | ------ | ---------------------- |
| Analyzer | ai_readonly | SELECT | INSERT, UPDATE, DELETE |
| Coder    | ai_readonly | SELECT | 쓰기 전체              |

---

## SQL 생성 가이드

### 제약사항

| 제약          | 설명                                |
| ------------- | ----------------------------------- |
| SELECT only   | INSERT/UPDATE/DELETE 금지           |
| 인덱스 활용   | JOIN 시 인덱스 컬럼 사용            |
| LIMIT 필수    | 대용량 테이블 (USER_LOGIN, COMMENT) |
| 컬럼명 정확성 | DOMAIN_SCHEMA.md 준수               |

### 대용량 데이터 전략

1. **통계적 샘플링**: `WHERE RAND() <= 0.05` (5% 표본)
2. **배치 분할**: LIMIT/OFFSET 또는 ID 범위 분할

### SQL 생성 프롬프트

```
당신은 메디게이트 데이터베이스 전문가입니다.

## 제약사항
- SELECT 문만 사용
- 대용량 테이블 접근 시 WHERE + LIMIT 필수
- DOMAIN_SCHEMA.md 컬럼명 정확히 사용

## 출력: { "queries": [{ "name": "", "sql": "SELECT ..." }] }
```

### 결과 해석 프롬프트

```
## 요청
1. 주요 패턴 식별
2. 전체 대비 +5%p 이상 차이 세그먼트
3. 인사이트 도출
4. Use Case 제안

## 출력: { "patterns": [], "insights": [], "recommendations": [] }
```

---

## 오류 처리

> **HITL 참조**: ROLE_ARCHITECTURE.md의 HITL 체크포인트 섹션 참조

### 오류 유형별 처리

| 오류          | 처리                   |    HITL     |
| ------------- | ---------------------- | :---------: |
| 스키마 불일치 | 사용자 확인 요청       |     ✅      |
| SQL 문법 오류 | 자동 수정 재시도 (3회) | 3회 실패 시 |
| 타임아웃      | LIMIT/WHERE 강화       |     ✅      |
| 빈 결과       | 조건 완화 제안         |     ✅      |
| 권한 오류     | DB 권한 확인 요청      |     ✅      |

### 재시도 정책

```
1차: 오류 기반 자동 수정
2차: 오류 기반 자동 수정
3차 실패: 사용자 개입 요청 (HITL)
```

---

## Orchestrator 통합

**상세 정책**: ROLE_ARCHITECTURE.md `파이프라인 타입` 섹션 참조

---

## 체크리스트

### 배포 전

- [ ] ai_readonly 계정 생성
- [ ] 환경별 .env 설정
- [ ] 쿼리 로깅 활성화

### 코드 리뷰

- [ ] 하드코딩 DB 자격증명 없음
- [ ] SQL Injection 방지
- [ ] readonly 계정 사용

**END OF ANALYSIS_GUIDE.md**
