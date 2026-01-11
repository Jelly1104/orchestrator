# Analysis Report

**생성 시각**: 2025-12-26T02:08:02.163Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| active_users_by_type | ✅ 성공 | 0 |
| total_active_users | ✅ 성공 | 1 |
| user_status_distribution | ✅ 성공 | 4 |

**총 3개 쿼리 중 3개 성공, 총 5행 반환**

## 2. 발견된 인사이트

### total_active_users.total_active_users
총합: 0, 평균: 0.00, 최대: 0, 최소: 0, 건수: 1

### user_status_distribution.count
총합: 203,914, 평균: 50978.50, 최대: 202,804, 최소: 1, 건수: 4

## 3. 식별된 패턴

- **total_active_users** (medium): 1행 반환, 컬럼: total_active_users
- **user_status_distribution** (medium): 4행 반환, 컬럼: U_ALIVE, count

