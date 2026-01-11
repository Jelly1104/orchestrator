# case6-retest8 vs extension 품질 비교 보고서 v04

> **작성일**: 2025-12-24
> **작성자**: ATO-System-B 개발팀
> **버전**: v04
> **목적**: retest8 vs extension1 비교 + Hallucination 원인 분석 + DB 연동 케이스별 분리 비교

---

## 핵심 요약 (Executive Summary)

### 결론: Extension 모드가 안전하고 품질이 높음

| 관점 | 우세 | 근거 |
|------|------|------|
| **DB 보안** | 🏆 **extension1** | SELECT * 사용 안함, 필요 컬럼만 조회 |
| **Hallucination 방지** | 🏆 **extension1** | SDD에 쿼리 사전 정의 |
| **구현 준비도** | 🏆 **extension1** | SDD + API 설계 포함 |
| 화면 설계 풍부함 | ⚠️ retest8 | 더 많은 화면, 컴포넌트 |

### 치명적 발견: retest8에서 SELECT * Hallucination 발생

```
⚠️ CRITICAL: retest8 분석 보고서에서 민감 정보 노출 확인

노출된 컬럼:
- U_PASSWD_ENC (암호화된 비밀번호)
- U_EMAIL (이메일)
- U_NAME (이름)
- U_SID_ENC (암호화된 주민번호)
- U_IP (IP 주소)

원인: Analysis Agent가 `SELECT * FROM USERS` 생성
```

---

## 1. Hallucination 원인 분석

### 1.1 SQL 쿼리 비교 (retest 시리즈)

| 케이스 | select_all_users 쿼리 | 결과 |
|--------|----------------------|------|
| **retest1** | `SELECT U_ID, U_KIND, U_ALIVE FROM USERS` | ✅ 안전 (3개 컬럼) |
| **retest3** | `SELECT U_ID, U_KIND, U_ALIVE FROM USERS` | ✅ 안전 (3개 컬럼) |
| retest5 | `SELECT U_ID, U_KIND, U_ALIVE FROM USERS` | ✅ 안전 (3개 컬럼) |
| **retest6** | `SELECT * FROM USERS` | ❌ **Hallucination** (17개+ 컬럼) |
| **retest8** | `SELECT * FROM USERS` | ❌ **Hallucination** (17개+ 컬럼) |

### 1.2 SELECT * 발생 케이스의 노출 데이터

```
retest6, retest8 analysis_report.md에서 발견:

### select_all_users.U_PASSWD_ENC
총합: ∞, 평균: Infinity, 최대: ∞, 최소: 0, 건수: 626

### select_all_users.U_NAME
총합: ∞, 평균: Infinity, 최대: ∞, 최소: 0, 건수: 654

### select_all_users.U_EMAIL
총합: ∞, 평균: Infinity, 최대: ∞, 최소: 0, 건수: 620

### select_all_users.U_SID_ENC
총합: 148,438, 평균: 21205.43, 최대: 86,842, 최소: 21, 건수: 7
```

### 1.3 Hallucination 발생 원인

| 원인 | 상세 | 심각도 |
|------|------|--------|
| **Analysis Agent 비결정성** | 동일 PRD → 다른 SQL 생성 | 🔴 Critical |
| **SELECT * 허용** | 쿼리 검증 로직 부재 | 🔴 Critical |
| **스키마 참조 실패** | DOMAIN_SCHEMA.md 미준수 | 🟡 High |
| **DB_ACCESS_POLICY 미적용** | 민감 컬럼 필터링 없음 | 🔴 Critical |

### 1.4 Audit 로그 분석

```json
// audit-2025-12-24.jsonl에서 발견
{
  "level": "WARN",
  "event": "INPUT_VALIDATION_WARNING",
  "message": "Potential injection in code context",
  "context": {"type":"DOCUMENT_CONTENT","context":"agent_output"}
}
```

**발견**: 보안 경고가 발생했으나 SQL 쿼리 내용 검증은 수행되지 않음

---

## 2. retest8 vs extension1 산출물 비교

### 2.1 파일 크기 비교

| 산출물 | retest8 | extension1 | 차이 |
|--------|---------|------------|------|
| IA.md | 4,138 bytes (119줄) | 7,243 bytes (228줄) | extension +91% |
| Wireframe.md | 24,296 bytes (322줄) | 32,218 bytes (412줄) | extension +32% |
| SDD.md | 26,721 bytes (997줄) | 20,359 bytes (628줄) | retest8 +31% |
| HANDOFF.md | 9,046 bytes (286줄) | ❌ 없음 | - |
| **합계** | ~64KB | ~60KB | - |

### 2.2 Analysis 결과 비교

| 항목 | retest8 | extension1 |
|------|---------|------------|
| 실행 쿼리 수 | 5개 | 0개 (사전 정의) |
| 성공 쿼리 | 3개 | N/A |
| SELECT * 사용 | ⚠️ **4개 쿼리** | ❌ 없음 |
| 민감 정보 노출 | ⚠️ **17개 컬럼** | ❌ 없음 |

### 2.3 retest8 SQL 쿼리 (실제 실행)

```sql
-- select_all_users.sql (Hallucination)
SELECT * FROM USERS

-- select_active_users.sql (Hallucination)
SELECT * FROM USERS WHERE U_ALIVE = 1

-- select_user_by_id.sql (Hallucination)
SELECT * FROM USERS WHERE U_ID = ?

-- select_users_by_kind.sql (Hallucination)
SELECT * FROM USERS WHERE U_KIND = ?

-- count_users_by_kind.sql (정상)
SELECT U_KIND, COUNT(*) as count FROM USERS GROUP BY U_KIND
```

### 2.4 extension1 SDD의 사전 정의 쿼리

```sql
-- A1: 활성 회원 세그먼트 조회 (DOMAIN_SCHEMA 5.3 패턴)
SELECT
  u.U_KIND as segment_id,
  cm.CODE_NAME as segment_name,
  COUNT(*) as member_count,
  ROUND(SUM(CASE WHEN u.U_ALIVE = 'Y' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as active_rate
FROM USERS u
LEFT JOIN CODE_MASTER cm ON cm.CODE_TYPE = 'U_KIND' AND cm.CODE_VALUE = u.U_KIND
GROUP BY u.U_KIND, cm.CODE_NAME;

-- A3: 로그인 패턴 분석 (⚠️ LIMIT 필수)
SELECT
  HOUR(LOGIN_DATE) as hour,
  DAYOFWEEK(LOGIN_DATE) as day_of_week,
  COUNT(*) as login_count
FROM USER_LOGIN
WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY HOUR(LOGIN_DATE), DAYOFWEEK(LOGIN_DATE)
LIMIT 10000;  -- ⚠️ DB_ACCESS_POLICY
```

---

## 3. DB 연동 필요/불필요 케이스 분리 비교

### 3.1 케이스 분류

| 분류 | 설명 | 예시 |
|------|------|------|
| **DB 연동 필요** | 실시간 데이터 조회/분석 필요 | 회원 현황, 로그인 패턴, 세그먼트 분석 |
| **DB 연동 불필요** | 정적 기능, 화면 설계만 필요 | 관리자 페이지 레이아웃, 설정 화면 |

### 3.2 DB 연동 필요 케이스 비교

| 평가 항목 | retest (pipeline) | extension | 권장 |
|-----------|-------------------|-----------|------|
| SQL 생성 | AI 동적 생성 | 사전 정의 | 🏆 **extension** |
| 쿼리 품질 | 비결정적 (변동성 높음) | 일관됨 | 🏆 **extension** |
| 보안 | SELECT * 위험 | 필요 컬럼만 | 🏆 **extension** |
| LIMIT 적용 | 미적용 | 적용 | 🏆 **extension** |
| 타임아웃 | 미설정 | 30초 설정 | 🏆 **extension** |
| 민감정보 필터 | 없음 | 적용 | 🏆 **extension** |

#### DB 연동 필요 시 권장: **Extension 모드**

```
이유:
1. SDD에 쿼리가 사전 정의되어 Hallucination 방지
2. DOMAIN_SCHEMA.md 명시적 준수
3. DB_ACCESS_POLICY (LIMIT, 타임아웃) 적용
4. 민감 컬럼 (PII) 조회 제외
```

### 3.3 DB 연동 불필요 케이스 비교

| 평가 항목 | retest (pipeline) | extension | 권장 |
|-----------|-------------------|-----------|------|
| 화면 수 | 7개+ | 4개 | 🏆 **retest** |
| 컴포넌트 정의 | 11개+ | 3개 | 🏆 **retest** |
| 상호작용 정의 | 상세 | 기본 | 🏆 **retest** |
| 애니메이션 | 포함 | 미포함 | 🏆 **retest** |
| 반응형 레이아웃 | 상세 | 기본 | 🏆 **retest** |

#### DB 연동 불필요 시 권장: **Retest (Pipeline) 모드**

```
이유:
1. 화면 설계가 더 풍부함 (7개 vs 4개)
2. 컴포넌트 매핑이 상세함 (11개 vs 3개)
3. SQL 생성 단계가 불필요하므로 Hallucination 위험 없음
```

### 3.4 케이스별 권장 모드 결정표

| PRD 유형 | DB 연동 필요 | 권장 모드 | 이유 |
|----------|-------------|-----------|------|
| 대시보드 기능 | ✅ 필요 | **Extension** | 안전한 쿼리 |
| 회원 분석 기능 | ✅ 필요 | **Extension** | 민감정보 보호 |
| 로그인 패턴 분석 | ✅ 필요 | **Extension** | LIMIT 적용 |
| 관리자 설정 화면 | ❌ 불필요 | **Retest** | 화면 풍부 |
| 정적 콘텐츠 페이지 | ❌ 불필요 | **Retest** | 화면 풍부 |
| CRUD 화면 | ❌ 불필요 | **Retest** | 화면 풍부 |

---

## 4. 종합 품질 점수

### 4.1 DB 연동 필요 케이스 점수 (100점 만점)

| 평가 항목 | retest8 | extension1 | 비고 |
|-----------|---------|------------|------|
| SQL 보안 | 20 | **100** | SELECT * vs 명시적 컬럼 |
| Hallucination 방지 | 30 | **100** | 비결정적 vs 사전정의 |
| DOMAIN_SCHEMA 준수 | 40 | **95** | 부분 준수 vs 명시적 |
| DB_ACCESS_POLICY 준수 | 20 | **95** | LIMIT 미적용 vs 적용 |
| 민감정보 보호 | 10 | **100** | 노출 vs 필터링 |
| **DB 연동 총점** | **24/100** | **98/100** | extension +74점 |

### 4.2 DB 연동 불필요 케이스 점수 (100점 만점)

| 평가 항목 | retest8 | extension1 | 비고 |
|-----------|---------|------------|------|
| 화면 수 | **95** | 60 | 7개 vs 4개 |
| 컴포넌트 정의 | **95** | 50 | 11개 vs 3개 |
| 상호작용 | **90** | 70 | 상세 vs 기본 |
| 반응형 | **85** | 80 | 3단계 vs 3단계 |
| IA 구조 | 80 | **90** | 유사 |
| **비DB 총점** | **89/100** | **70/100** | retest +19점 |

### 4.3 점수 비교 그래프

```
DB 연동 필요 케이스 (100점 만점)
100 ┤                      ▲ extension1 (98점)
 90 ┤                      █
 80 ┤                      █
 70 ┤                      █
 60 ┤                      █
 50 ┤                      █
 40 ┤                      █
 30 ┤ ▲ retest8 (24점)    █
 20 ┤ █                    █
 10 ┤ █                    █
  0 ┼────────────────────────
      retest8          extension1
           (extension 압도적 우세)


DB 연동 불필요 케이스 (100점 만점)
100 ┤
 90 ┤ ▲ retest8 (89점)
 80 ┤ █
 70 ┤ █                    ▲ extension1 (70점)
 60 ┤ █                    █
 50 ┤ █                    █
 40 ┤ █                    █
 30 ┤ █                    █
 20 ┤ █                    █
 10 ┤ █                    █
  0 ┼────────────────────────
      retest8          extension1
           (retest 우세)
```

---

## 5. Hallucination 방지 대책

### 5.1 단기 대책 (즉시 적용)

| 대책 | 상세 | 담당 |
|------|------|------|
| **SELECT * 금지** | Analysis Agent에 규칙 추가 | Constitution |
| **민감 컬럼 블랙리스트** | PASSWD, EMAIL, NAME, SID 등 | DB_ACCESS_POLICY |
| **쿼리 검증 게이트** | HITL 체크포인트에서 SELECT * 차단 | Orchestrator |

### 5.2 중기 대책 (파이프라인 개선)

| 대책 | 상세 | 효과 |
|------|------|------|
| **쿼리 템플릿 적용** | SDD처럼 사전 정의된 쿼리 사용 | Hallucination 90% 감소 |
| **컬럼 화이트리스트** | PRD별 허용 컬럼 목록 정의 | 민감정보 100% 차단 |
| **쿼리 유사도 검사** | 이전 성공 쿼리와 비교 | 비정상 쿼리 탐지 |

### 5.3 장기 대책 (아키텍처 개선)

```
┌─────────────────────────────────────────────────────────────┐
│ 권장 아키텍처: Query Library 도입                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [PRD] → [Gap Check] → [Query Library 매칭]                │
│                              │                              │
│                              ▼                              │
│                    ┌─────────────────┐                     │
│                    │  Query Library  │                     │
│                    │  (사전 검증됨)   │                     │
│                    ├─────────────────┤                     │
│                    │ - segment_query │                     │
│                    │ - login_pattern │                     │
│                    │ - distribution  │                     │
│                    │ - ...           │                     │
│                    └─────────────────┘                     │
│                              │                              │
│                              ▼                              │
│                    [SQL 실행] → [분석]                      │
│                                                             │
│  효과:                                                      │
│  - SELECT * 원천 차단                                       │
│  - 민감 컬럼 노출 방지                                      │
│  - 쿼리 품질 일관성 보장                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 결론 및 권장사항

### 6.1 최종 결론

| 케이스 | 권장 모드 | 이유 |
|--------|----------|------|
| **DB 연동 필요** | 🏆 **Extension** | Hallucination 방지, 보안, 품질 |
| **DB 연동 불필요** | 🏆 **Retest** | 화면 풍부함, 컴포넌트 다양성 |

### 6.2 즉시 조치 사항

| 우선순위 | 조치 | 담당 |
|---------|------|------|
| **P0** | SELECT * 금지 규칙 추가 | Constitution 수정 |
| **P0** | 민감 컬럼 블랙리스트 추가 | DB_ACCESS_POLICY 수정 |
| **P1** | PRD 분석 시 DB 연동 필요 여부 판단 로직 | Gap Check 개선 |
| **P1** | 케이스별 모드 자동 선택 기능 | Orchestrator 개선 |

### 6.3 케이스별 모드 선택 가이드

```
┌─────────────────────────────────────────────────────────────┐
│ PRD 분석 → DB 연동 필요 여부 판단                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRD에 다음 키워드 포함?                                    │
│  ├─ "회원 조회", "데이터 분석", "통계", "실시간"           │
│  ├─ "로그인 패턴", "세그먼트", "분포 분석"                 │
│  └─ "DB", "쿼리", "테이블", "집계"                         │
│                                                             │
│       │                           │                         │
│       ▼ YES                       ▼ NO                      │
│  ┌──────────────┐           ┌──────────────┐               │
│  │  Extension   │           │   Retest     │               │
│  │    모드      │           │ (Pipeline)   │               │
│  │              │           │    모드      │               │
│  │ ✅ 안전한 쿼리 │           │ ✅ 풍부한 화면 │               │
│  │ ✅ 민감정보 보호│           │ ✅ 다양한 컴포넌트│              │
│  │ ✅ LIMIT 적용 │           │ ✅ 상호작용 정의│               │
│  └──────────────┘           └──────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 참조 문서

| 문서 | 경로 |
|------|------|
| retest8 산출물 | `docs/cases/case6-retest8/` |
| extension1 산출물 | `docs/cases/case6-extension1/` |
| retest8 분석 보고서 | `docs/cases/case6-retest8/analysis/analysis_report.md` |
| 파이프라인 로그 | `orchestrator/logs/case6-retest8.json` |
| 감사 로그 | `orchestrator/logs/audit/audit-2025-12-24.jsonl` |
| v03 비교 보고서 | `docs/develo-report/case6-retest vs extension 품질 비교 보고서-v03.md` |

---

## 8. 부록: retest 시리즈 SQL 쿼리 상세 비교

### 8.1 안전한 쿼리 (retest1, retest3, retest5)

```sql
-- retest1/analysis/results/select_all_users.sql
SELECT U_ID, U_KIND, U_ALIVE FROM USERS

-- retest1/analysis/results/select_active_users.sql
SELECT U_ID, U_KIND, U_ALIVE FROM USERS WHERE U_ALIVE = 1

-- retest1/analysis/results/count_users_by_kind.sql
SELECT U_KIND, COUNT(*) as user_count FROM USERS GROUP BY U_KIND
```

### 8.2 위험한 쿼리 (retest6, retest8) - Hallucination

```sql
-- retest8/analysis/results/select_all_users.sql
SELECT * FROM USERS  -- ❌ 17개+ 컬럼 노출

-- retest8/analysis/results/select_active_users.sql
SELECT * FROM USERS WHERE U_ALIVE = 1  -- ❌

-- retest8/analysis/results/select_user_by_id.sql
SELECT * FROM USERS WHERE U_ID = ?  -- ❌

-- retest8/analysis/results/select_users_by_kind.sql
SELECT * FROM USERS WHERE U_KIND = ?  -- ❌
```

---

**END OF REPORT**

*이 보고서는 파이프라인 안정성과 보안을 위한 분석 결과입니다. DB 연동이 필요한 기능 개발 시 Extension 모드 사용을 강력히 권장합니다.*
