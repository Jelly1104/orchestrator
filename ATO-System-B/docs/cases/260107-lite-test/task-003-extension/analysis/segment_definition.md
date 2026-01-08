# Segment Definition: 무찌마 일간 베스트

| 항목 | 내용 |
|------|------|
| **Case ID** | 260107-lite-test/task-003-extension |
| **작성일** | 2026-01-07 |
| **작성자** | Profiler Skill v3.2 |

---

## 1. 분석 목표

BOARD_MUZZIMA 테이블에서 **24시간 내 인기 게시물 상위 5건**을 추출한다.

---

## 2. 타겟 세그먼트 정의

### 세그먼트 유형: 게시글 기반 (Content Segment)

| 세그먼트 | 정의 | 기준 |
|----------|------|------|
| **DAILY_BEST** | 일간 베스트 게시물 | 24시간 내 인기 점수 상위 5건 |

### 인기도 점수 산정

```
popularity_score = READ_CNT + (AGREE_CNT * 10)
```

| 지표 | 가중치 | 이유 |
|------|--------|------|
| READ_CNT (조회수) | 1 | 기본 노출 지표 |
| AGREE_CNT (추천수) | 10 | 적극적 반응, 조회보다 높은 가치 |

---

## 3. SQL 조건 명세

### 타겟 테이블

| 테이블 | 용도 | 인덱스 |
|--------|------|--------|
| BOARD_MUZZIMA | 일간 베스트 게시물 추출 | (CTG_CODE, REG_DATE) |

### 사용 컬럼

| 컬럼 | 타입 | 용도 |
|------|------|------|
| BOARD_IDX | INT | 게시글 고유 ID |
| TITLE | VARCHAR(200) | 게시글 제목 |
| CONTENT | MEDIUMTEXT | 게시글 본문 (대본 소스) |
| READ_CNT | INT | 조회수 |
| AGREE_CNT | INT | 추천수 |
| REG_DATE | DATETIME | 작성일시 |

### WHERE 조건

```sql
WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
```

### ORDER BY 조건

```sql
ORDER BY (READ_CNT + AGREE_CNT * 10) DESC
```

### LIMIT 조건

```sql
LIMIT 5
```

---

## 4. 제약사항 준수

| 제약 | 준수 여부 |
|------|----------|
| SELECT 쿼리만 사용 | ✅ |
| SELECT * 금지 | ✅ (명시적 컬럼 지정) |
| 인덱스 활용 | ✅ (REG_DATE 인덱스) |
| LIMIT 적용 | ✅ (5건) |

---

## 5. /query Skill 전달 사항

다음 SQL 조건을 기반으로 쿼리를 생성해주세요:

```yaml
target_table: BOARD_MUZZIMA
columns:
  - BOARD_IDX
  - TITLE
  - CONTENT
  - READ_CNT
  - AGREE_CNT
  - REG_DATE
where: "REG_DATE >= NOW() - INTERVAL 24 HOUR"
order_by: "(READ_CNT + AGREE_CNT * 10) DESC"
limit: 5
output_file: analysis/best_posts.sql
```

---

**END OF SEGMENT DEFINITION**
