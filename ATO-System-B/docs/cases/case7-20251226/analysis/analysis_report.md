# Analysis Report

**생성 시각**: 2025-12-26T02:27:46.444Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| users_basic_info | ✅ 성공 | 1000 |
| users_count_by_kind | ✅ 성공 | 12 |
| active_users_count | ✅ 성공 | 4 |
| users_kind_distribution | ✅ 성공 | 22 |

**총 4개 쿼리 중 4개 성공, 총 1038행 반환**

## 2. 발견된 인사이트

### users_basic_info.U_ID
총합: 667,067, 평균: 74118.56, 최대: 601,016, 최소: 74, 건수: 9

### users_count_by_kind.count
총합: 203,914, 평균: 16992.83, 최대: 128,496, 최소: 9, 건수: 12

### active_users_count.count
총합: 203,914, 평균: 50978.50, 최대: 202,804, 최소: 1, 건수: 4

### users_kind_distribution.count
총합: 203,914, 평균: 9268.82, 최대: 128,356, 최소: 1, 건수: 22

## 3. 식별된 패턴

- **users_basic_info** (high): 1000행 반환, 컬럼: U_ID, U_KIND, U_ALIVE
- **users_count_by_kind** (medium): 12행 반환, 컬럼: U_KIND, count
- **active_users_count** (medium): 4행 반환, 컬럼: U_ALIVE, count
- **users_kind_distribution** (medium): 22행 반환, 컬럼: U_KIND, U_ALIVE, count

