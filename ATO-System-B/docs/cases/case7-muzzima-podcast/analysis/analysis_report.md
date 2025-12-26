# Analysis Report

**생성 시각**: 2025-12-26T06:14:53.415Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| daily_best_posts_analysis | ✅ 성공 | 5 |
| top_posts_with_comments_count | ✅ 성공 | 5 |
| category_distribution_daily | ✅ 성공 | 2 |

**총 3개 쿼리 중 3개 성공, 총 12행 반환**

## 2. 발견된 인사이트

### daily_best_posts_analysis.BOARD_IDX
총합: 18,359,867, 평균: 3671973.40, 최대: 3,672,009, 최소: 3,671,951, 건수: 5

### daily_best_posts_analysis.READ_CNT
총합: 0, 평균: 0.00, 최대: 0, 최소: 0, 건수: 5

### daily_best_posts_analysis.AGREE_CNT
총합: 146, 평균: 29.20, 최대: 92, 최소: 12, 건수: 5

### top_posts_with_comments_count.BOARD_IDX
총합: 18,359,895, 평균: 3671979.00, 최대: 3,672,017, 최소: 3,671,951, 건수: 5

### top_posts_with_comments_count.TITLE
총합: 11, 평균: 11.00, 최대: 11, 최소: 11, 건수: 1

### top_posts_with_comments_count.READ_CNT
총합: 0, 평균: 0.00, 최대: 0, 최소: 0, 건수: 5

### top_posts_with_comments_count.AGREE_CNT
총합: 134, 평균: 26.80, 최대: 92, 최소: 7, 건수: 5

### top_posts_with_comments_count.COMMENT_COUNT
총합: 69, 평균: 13.80, 최대: 20, 최소: 8, 건수: 5

### category_distribution_daily.POST_COUNT
총합: 101, 평균: 50.50, 최대: 81, 최소: 20, 건수: 2

### category_distribution_daily.AVG_VIEWS
총합: 0, 평균: 0.00, 최대: 0, 최소: 0, 건수: 2

## 3. 식별된 패턴

- **daily_best_posts_analysis** (medium): 5행 반환, 컬럼: BOARD_IDX, CTG_CODE, TITLE, READ_CNT, AGREE_CNT...
- **top_posts_with_comments_count** (medium): 5행 반환, 컬럼: BOARD_IDX, CTG_CODE, TITLE, READ_CNT, AGREE_CNT...
- **category_distribution_daily** (medium): 2행 반환, 컬럼: CTG_CODE, POST_COUNT, AVG_VIEWS

