# Segment Definition: 무찌마 일간 베스트 팟캐스트

> **Case ID**: 260107-lite-test/task-004-extension-lite
> **작성일**: 2026-01-08
> **작성자**: Profiler (Analyzer)

---

## 1. 분석 개요

### 목적
무찌마 커뮤니티의 24시간 내 인기 게시물을 추출하여 팟캐스트 대본의 소스 데이터로 활용

### 타겟 데이터

| 테이블 | 용도 | 예상 조회량 |
|--------|------|------------|
| BOARD_MUZZIMA | 게시글 본문 | 최근 24시간 ~100건 |
| COMMENT | 댓글 수 집계 | BOARD_IDX 기준 |

---

## 2. 세그먼트 정의

### 2.1 게시물 세그먼트

| 세그먼트 | 정의 | SQL 조건 |
|----------|------|----------|
| **DAILY_BEST** | 24시간 내 등록된 게시물 | `REG_DATE >= NOW() - INTERVAL 24 HOUR` |
| **HIGH_ENGAGEMENT** | 조회수+댓글수 상위 | `ORDER BY engagement_score DESC` |

### 2.2 Engagement Score 정의

```
engagement_score = READ_CNT + (댓글수 * 3)
```

- 댓글 가중치 3배: 댓글은 조회보다 적극적 참여를 의미

---

## 3. 타겟 유저 페르소나

### 페르소나 1: 바쁜 봉직의

| 항목 | 내용 |
|------|------|
| **연령대** | 30~40대 |
| **근무형태** | 봉직의 (EMP) |
| **Pain Point** | 커뮤니티 정독 시간 부족 |
| **니즈** | 이동 중 3분 오디오로 트렌드 파악 |
| **사용 시나리오** | 출퇴근 차량 내 팟캐스트 청취 |

### 페르소나 2: 정보 탐색 개원의

| 항목 | 내용 |
|------|------|
| **연령대** | 40~50대 |
| **근무형태** | 개원의 (OWN) |
| **Pain Point** | 동료 의견/트렌드 파악 어려움 |
| **니즈** | 커뮤니티 핫이슈 빠른 확인 |
| **사용 시나리오** | 진료 공백 시간 짧은 요약 청취 |

---

## 4. SQL 조건 명세 (/query용)

### 4.1 일간 베스트 게시물 추출

```sql
-- 기본 조건
WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR

-- 정렬 (Engagement Score 기준)
ORDER BY (READ_CNT + (comment_count * 3)) DESC

-- 제한
LIMIT 5
```

### 4.2 테이블별 조건

| 테이블 | 조건 | 인덱스 |
|--------|------|--------|
| BOARD_MUZZIMA | REG_DATE >= NOW() - INTERVAL 24 HOUR | (CTG_CODE, REG_DATE) |
| COMMENT | BOARD_IDX IN (베스트 게시글 ID) | (BOARD_IDX, SVC_CODE) |

### 4.3 조회 컬럼 (SELECT 명세)

#### BOARD_MUZZIMA
- `BOARD_IDX` - 게시글 ID (PK)
- `TITLE` - 제목
- `CONTENT` - 본문 (PII 마스킹 필요)
- `READ_CNT` - 조회수
- `AGREE_CNT` - 추천수
- `REG_DATE` - 등록일

#### COMMENT (집계용)
- `COUNT(*)` - 댓글 수

---

## 5. PII 마스킹 규칙

### 마스킹 대상

| 패턴 | 예시 | 마스킹 결과 |
|------|------|-------------|
| 이름 | 김OO | [이름] |
| 병원명 | OO병원 | [병원명] |
| 지역 | 강남구 | [지역] |
| 전화번호 | 010-XXXX-XXXX | [연락처] |

### 적용 시점
- Phase C (Coder): 대본 생성 API에서 마스킹 처리

---

## 6. 검증 기준

| 항목 | 기준 |
|------|------|
| 최소 결과 수 | 5건 이상 (24시간 내 게시물) |
| 쿼리 실행 시간 | < 3초 |
| 스키마 준수 | DOMAIN_SCHEMA.md 컬럼명 100% 일치 |

---

## 7. 다음 단계 (→ /query)

`/query` Skill이 이 문서를 참조하여:
1. 일간 베스트 게시물 추출 SQL 작성
2. 댓글 수 집계 SQL 작성
3. 실행 및 결과 저장

---

**END OF SEGMENT DEFINITION**
