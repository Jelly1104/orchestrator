# Analysis Report

**생성 시각**: 2025-12-29T09:44:44.093Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| daily_best_posts_analysis | ✅ 성공 | 5 |
| user_activity_stats | ✅ 성공 | 0 |

**총 2개 쿼리 중 2개 성공, 총 5행 반환**

## 2. 발견된 인사이트

### daily_best_posts_analysis.BOARD_IDX
총합: 18,367,532, 평균: 3673506.40, 최대: 3,673,517, 최소: 3,673,497, 건수: 5

### daily_best_posts_analysis.READ_CNT
총합: 0, 평균: 0.00, 최대: 0, 최소: 0, 건수: 5

### daily_best_posts_analysis.AGREE_CNT
총합: 93, 평균: 18.60, 최대: 43, 최소: 10, 건수: 5

### daily_best_posts_analysis.popularity_score
총합: 279, 평균: 55.80, 최대: 129, 최소: 30, 건수: 5

## 3. 식별된 패턴

- **daily_best_posts_analysis** (medium): 5행 반환, 컬럼: BOARD_IDX, CTG_CODE, TITLE, READ_CNT, AGREE_CNT...

