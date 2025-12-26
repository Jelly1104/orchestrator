# Analysis Report

**생성 시각**: 2025-12-26T02:28:32.331Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| user_count_by_kind | ✅ 성공 | 0 |
| active_users_overview | ✅ 성공 | 0 |
| user_status_distribution | ✅ 성공 | 4 |

**총 3개 쿼리 중 3개 성공, 총 4행 반환**

## 2. 발견된 인사이트

### user_status_distribution.status_count
총합: 203,914, 평균: 50978.50, 최대: 202,804, 최소: 1, 건수: 4

## 3. 식별된 패턴

- **user_status_distribution** (medium): 4행 반환, 컬럼: U_ALIVE, status_count

