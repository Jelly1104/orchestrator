# Analysis Report

**생성 시각**: 2025-12-24T08:35:15.944Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| select_all_users | ✅ 성공 | 1000 |
| select_active_users | ✅ 성공 | 0 |
| count_users_by_kind | ✅ 성공 | 12 |
| count_active_users_by_kind | ✅ 성공 | 0 |

**총 4개 쿼리 중 4개 성공, 총 1012행 반환**

## 2. 발견된 인사이트

### select_all_users.U_ID
총합: 3,278,208, 평균: 234157.71, 최대: 2,608,011, 최소: 1, 건수: 14

### count_users_by_kind.user_count
총합: 203,884, 평균: 16990.33, 최대: 128,487, 최소: 9, 건수: 12

## 3. 식별된 패턴

- **select_all_users** (high): 1000행 반환, 컬럼: U_ID, U_KIND, U_ALIVE
- **count_users_by_kind** (medium): 12행 반환, 컬럼: U_KIND, user_count

