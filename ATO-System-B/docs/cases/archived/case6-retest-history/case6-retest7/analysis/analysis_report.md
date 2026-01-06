# Analysis Report

**생성 시각**: 2025-12-24T08:57:59.834Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| get_all_users | ✅ 성공 | 1000 |
| get_active_users | ✅ 성공 | 0 |
| get_users_by_kind | ❌ 실패 | 0 |
| count_users_by_status | ✅ 성공 | 4 |

**총 4개 쿼리 중 3개 성공, 총 1004행 반환**

## 2. 발견된 인사이트

### get_all_users.U_ID
총합: 675,256, 평균: 51942.77, 최대: 601,016, 최소: 7, 건수: 13

### count_users_by_status.user_count
총합: 203,884, 평균: 50971.00, 최대: 202,776, 최소: 1, 건수: 4

## 3. 식별된 패턴

- **get_all_users** (high): 1000행 반환, 컬럼: U_ID, U_KIND, U_ALIVE
- **count_users_by_status** (medium): 4행 반환, 컬럼: U_ALIVE, user_count

