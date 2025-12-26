# Analysis Report

**생성 시각**: 2025-12-26T02:32:59.915Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| total_active_users | ✅ 성공 | 1 |
| active_users_by_type | ✅ 성공 | 0 |
| 월별_신규_가입자_추이_최근_12개월 | ✅ 성공 | 13 |
| user_status_distribution | ✅ 성공 | 22 |

**총 4개 쿼리 중 4개 성공, 총 36행 반환**

## 2. 발견된 인사이트

### total_active_users.active_user_count
총합: 0, 평균: 0.00, 최대: 0, 최소: 0, 건수: 1

### 월별_신규_가입자_추이_최근_12개월.month
총합: 26,324, 평균: 2024.92, 최대: 2,025, 최소: 2,024, 건수: 13

### 월별_신규_가입자_추이_최근_12개월.new_users
총합: 5,305, 평균: 408.08, 최대: 532, 최소: 59, 건수: 13

### user_status_distribution.user_count
총합: 203,914, 평균: 9268.82, 최대: 128,356, 최소: 1, 건수: 22

## 3. 식별된 패턴

- **total_active_users** (medium): 1행 반환, 컬럼: active_user_count
- **월별_신규_가입자_추이_최근_12개월** (medium): 13행 반환, 컬럼: month, new_users
- **user_status_distribution** (medium): 22행 반환, 컬럼: U_KIND, U_ALIVE, user_count

