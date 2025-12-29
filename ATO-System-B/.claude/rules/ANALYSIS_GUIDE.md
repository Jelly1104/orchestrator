# 분석 Agent 가이드 v2.1

> **문서 버전**: 2.1.0
> **최종 업데이트**: 2025-12-29
> **물리적 경로**: `.claude/rules/ANALYSIS_GUIDE.md`
> **목적**: Analyzer Role 특화 가이드

---

## 로딩 설정

| Role | 로딩 문서 |
|------|----------|
| Analyzer | 이 문서 |
| Coder | 이 문서 (섹션 4만) |

---

## 1. Analyzer 개요

### 1.1 왜 필요한가?

| 문제 | 원인 | 해결 |
|------|------|------|
| PRD: "세그먼트 분석" | Orchestrator가 설계 파이프라인만 지원 | Analyzer Role 신설 |
| 산출물: IA/Wireframe | 정량 분석 처리 Role 부재 | QUANTITATIVE/MIXED PRD 처리 |

### 1.2 Role 비교

| Role | 역할 | 입력 | 출력 |
|------|------|------|------|
| Leader | 전체 조율 | PRD | 전략, HANDOFF |
| Analyzer | 데이터 분석 | PRD + Schema | SQL, 결과, 리포트 |
| Coder | 코드 구현 | HANDOFF + SDD | 소스 코드 |

---

## 2. 파이프라인

```
[입력] PRD (QUANTITATIVE | MIXED) + DOMAIN_SCHEMA.md

Step 1: PRD 파싱 → 요구사항/테이블/컬럼 추출
Step 2: 스키마 검증 → DOMAIN_SCHEMA.md 대조
Step 3: SQL 생성 → SELECT only, 인덱스 활용
Step 4: SQL 실행 → 재시도 최대 3회
Step 5: 결과 해석 → 패턴/이상치/인사이트
Step 6: 산출물 → docs/cases/{id}/analysis/

[출력] *.sql, *.json, report.md
```

---

## 3. DB 접근 정책 (요약)

> **상세 정책**: DB_ACCESS_POLICY.md 참조 (SSOT)

### 3.1 스토리지 선택

```
🟢 허용: 메모리, JSON/CSV, SQLite, Redis (로컬)
🔴 제한: Production MySQL → SELECT만 허용
```

### 3.2 계정 분리

| 계정 | 용도 | 권한 |
|------|------|------|
| ai_readonly | 기본 | SELECT |
| ai_write | Leader 승인 후 | SELECT, INSERT, UPDATE, DELETE |

### 3.3 접근 규칙

| Role | 계정 | 허용 | 금지 |
|------|------|------|------|
| Analyzer | ai_readonly | SELECT | INSERT, UPDATE, DELETE |
| Coder | ai_readonly | SELECT | 쓰기 전체 |

---

## 4. SQL 생성 가이드

### 4.1 제약사항

| 제약 | 설명 |
|------|------|
| SELECT only | INSERT/UPDATE/DELETE 금지 |
| 인덱스 활용 | JOIN 시 인덱스 컬럼 사용 |
| LIMIT 필수 | 대용량 테이블 (USER_LOGIN, COMMENT) |
| 컬럼명 정확성 | DOMAIN_SCHEMA.md 준수 |

### 4.2 대용량 데이터 전략

1. **통계적 샘플링**: `WHERE RAND() <= 0.05` (5% 표본)
2. **배치 분할**: LIMIT/OFFSET 또는 ID 범위 분할

### 4.3 SQL 생성 프롬프트

```
당신은 메디게이트 데이터베이스 전문가입니다.

## 제약사항
- SELECT 문만 사용
- 대용량 테이블 접근 시 WHERE + LIMIT 필수
- DOMAIN_SCHEMA.md 컬럼명 정확히 사용

## 출력: { "queries": [{ "name": "", "sql": "SELECT ..." }] }
```

### 4.4 결과 해석 프롬프트 (MIXED)

```
## 요청
1. 주요 패턴 식별
2. 전체 대비 +5%p 이상 차이 세그먼트
3. 인사이트 도출
4. Use Case 제안

## 출력: { "patterns": [], "insights": [], "recommendations": [] }
```

---

## 5. 오류 처리

> **HITL 참조**: ROLE_ARCHITECTURE.md의 HITL 체크포인트 섹션 참조

### 5.1 오류 유형별 처리

| 오류 | 처리 | HITL |
|------|------|:----:|
| 스키마 불일치 | 사용자 확인 요청 | ✅ |
| SQL 문법 오류 | 자동 수정 재시도 (3회) | 3회 실패 시 |
| 타임아웃 | LIMIT/WHERE 강화 | ✅ |
| 빈 결과 | 조건 완화 제안 | ✅ |
| 권한 오류 | DB 권한 확인 요청 | ✅ |

### 5.2 재시도 정책

```
1차: 오류 기반 자동 수정
2차: 오류 기반 자동 수정
3차 실패: 사용자 개입 요청 (HITL)
```

---

## 6. Orchestrator 통합

### 6.1 라우팅

```
PRD type → Pipeline
  QUANTITATIVE → analysis → Analyzer
  QUALITATIVE  → design   → Leader
  MIXED        → mixed    → Analyzer → Leader
```

### 6.2 Mixed Pipeline

```
Phase A: Analyzer → SQL 실행 → 데이터 수집
Phase B: Leader   → 인사이트 해석 → Use Case 제안
```

---

## 7. 체크리스트

### 배포 전
- [ ] ai_readonly 계정 생성
- [ ] 환경별 .env 설정
- [ ] 쿼리 로깅 활성화

### 코드 리뷰
- [ ] 하드코딩 DB 자격증명 없음
- [ ] SQL Injection 방지
- [ ] readonly 계정 사용

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| DOMAIN_SCHEMA.md | 테이블/컬럼 정의 |
| DB_ACCESS_POLICY.md | DB 접근 권한 (SSOT) |
| PRD_GUIDE.md | PRD 유형/파이프라인 |
| VALIDATION_GUIDE.md | 산출물 검증 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.1.0 | 2025-12-29 | 300줄 다이어트: DB정책→참조, 프롬프트 압축 |
| 2.0.4 | 2025-12-23 | 섹션 참조 이름 기반 전환 |

---

**END OF ANALYSIS_GUIDE.md**
