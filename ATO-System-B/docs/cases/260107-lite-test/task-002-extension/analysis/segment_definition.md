# Segment Definition

> **버전**: 1.0.0 | **생성일**: 2026-01-07
> **Case ID**: 260107-lite-test/task-002-extension
> **생성자**: Profiler Skill v3.1

---

## 1. 분석 대상 개요

### 분석 목표
무찌마 커뮤니티 24시간 내 인기 게시물 5건 추출

### 타겟 콘텐츠 소비자 (Persona)

| 항목 | 내용 |
|------|------|
| **연령대** | 30~40대 |
| **직업** | 봉직의/개원의 |
| **Pain Point** | 커뮤니티 정독 시간 부족 |
| **Needs** | 이동 중 오디오로 트렌드 파악 |
| **사용 시나리오** | 출퇴근 중 3분 팟캐스트 청취 |

---

## 2. 게시물 인기도 세그먼트

> **참고**: 이 케이스는 회원 세그먼트가 아닌 **게시물 세그먼트** 분석

### 인기도 기준 정의

| 세그먼트 | 정의 | 산정 기준 |
|----------|------|----------|
| **HOT** | 최고 인기 | READ_CNT + AGREE_CNT 상위 5건 |
| **TRENDING** | 급상승 | 24시간 내 조회수 증가율 상위 |
| **ENGAGING** | 고참여 | 댓글 수 상위 |

### 적용 세그먼트

본 분석에서는 **HOT 세그먼트**를 적용:
- 24시간 내 등록된 게시물 중
- `READ_CNT + AGREE_CNT` 합산 점수 상위 5건

---

## 3. SQL 조건 명세

### 3.1 일간 베스트 게시물 추출

```sql
-- 테이블: BOARD_MUZZIMA
-- 인덱스: (CTG_CODE, REG_DATE)

SELECT
    BOARD_IDX,
    TITLE,
    CONTENT,
    READ_CNT,
    AGREE_CNT,
    REG_DATE,
    (READ_CNT + AGREE_CNT) AS popularity_score
FROM BOARD_MUZZIMA
WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
ORDER BY popularity_score DESC
LIMIT 5;
```

### 3.2 베스트 게시물별 댓글 수 집계

```sql
-- 테이블: COMMENT
-- 인덱스: (BOARD_IDX, SVC_CODE)
-- ⚠️ 대용량 테이블: 반드시 BOARD_IDX 인덱스 활용

SELECT
    BOARD_IDX,
    COUNT(*) AS comment_count
FROM COMMENT
WHERE BOARD_IDX IN (
    SELECT BOARD_IDX
    FROM BOARD_MUZZIMA
    WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
    ORDER BY (READ_CNT + AGREE_CNT) DESC
    LIMIT 5
)
AND SVC_CODE = 'MUZZIMA'
GROUP BY BOARD_IDX;
```

---

## 4. 컬럼 매핑 검증

> **DOMAIN_SCHEMA.md 준수 확인**

### BOARD_MUZZIMA 테이블

| 사용 컬럼 | 스키마 정의 | 검증 |
|-----------|------------|------|
| `BOARD_IDX` | INT PRIMARY KEY | ✅ |
| `TITLE` | VARCHAR(200) | ✅ |
| `CONTENT` | MEDIUMTEXT | ✅ |
| `READ_CNT` | INT DEFAULT 0 | ✅ |
| `AGREE_CNT` | INT DEFAULT 0 | ✅ |
| `REG_DATE` | DATETIME | ✅ |

### COMMENT 테이블

| 사용 컬럼 | 스키마 정의 | 검증 |
|-----------|------------|------|
| `COMMENT_IDX` | INT UNSIGNED PRIMARY KEY | ✅ |
| `BOARD_IDX` | INT UNSIGNED | ✅ |
| `SVC_CODE` | VARCHAR(10) | ✅ |

---

## 5. 제약사항 준수

| 제약 | 적용 |
|------|------|
| SELECT only | ✅ INSERT/UPDATE/DELETE 없음 |
| LIMIT 필수 | ✅ LIMIT 5 적용 |
| 인덱스 활용 | ✅ BOARD_IDX, REG_DATE 인덱스 |
| 쿼리 시간 | ✅ 3초 미만 예상 |
| PII 노출 | ✅ U_ID 조회 안함 (비식별화) |

---

## 6. 다음 단계 (Query Skill용)

`/query` Skill이 이 명세를 기반으로:
1. `best_posts.sql` 파일 생성
2. SQL 실행 (가능한 경우)
3. 결과 기반 `analysis_report.md` 작성

**END OF SEGMENT_DEFINITION.md**
