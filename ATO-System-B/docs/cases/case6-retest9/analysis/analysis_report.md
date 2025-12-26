# Analysis Report

**생성 시각**: 2025-12-26T00:34:37.711Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| basic_user_analysis | ✅ 성공 | 22 |
| user_kind_distribution | ✅ 성공 | 12 |
| active_users_by_kind | ✅ 성공 | 0 |

**총 3개 쿼리 중 3개 성공, 총 34행 반환**

## 2. 발견된 인사이트

### basic_user_analysis.user_count
총합: 203,914, 평균: 9268.82, 최대: 128,356, 최소: 1, 건수: 22

### user_kind_distribution.count
총합: 203,914, 평균: 16992.83, 최대: 128,496, 최소: 9, 건수: 12

## 3. 식별된 패턴

- **basic_user_analysis** (medium): 22행 반환, 컬럼: U_KIND, U_ALIVE, user_count
- **user_kind_distribution** (medium): 12행 반환, 컬럼: U_KIND, count

