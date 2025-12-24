# Analysis Report

**생성 시각**: 2025-12-24T09:04:20.978Z
**Task**: (Objective)

## 1. 쿼리 실행 요약

| 쿼리명 | 상태 | 반환 행 |
|--------|------|--------|
| select_all_users | ✅ 성공 | 1000 |
| select_active_users | ✅ 성공 | 0 |
| select_users_by_kind | ❌ 실패 | 0 |
| count_users_by_kind | ✅ 성공 | 12 |
| select_user_by_id | ❌ 실패 | 0 |

**총 5개 쿼리 중 3개 성공, 총 1012행 반환**

## 2. 발견된 인사이트

### select_all_users.U_ID
총합: 9,004, 평균: 900.40, 최대: 3,444, 최소: 7, 건수: 10

### select_all_users.U_SNO
총합: 95,829,379, 평균: 95829.38, 최대: 220,028, 최소: 1, 건수: 1000

### select_all_users.U_PASSWD_ENC
총합: ∞, 평균: Infinity, 최대: ∞, 최소: 0, 건수: 626

### select_all_users.U_NAME
총합: ∞, 평균: Infinity, 최대: ∞, 최소: 0, 건수: 654

### select_all_users.U_NICK
총합: 1,238,379,641, 평균: 112579967.36, 최대: 1,234,567,890, 최소: 1, 건수: 11

### select_all_users.U_NICK_ANONY
총합: 4, 평균: 4.00, 최대: 4, 최소: 4, 건수: 1

### select_all_users.U_FOREIGN_TYPE
총합: 1, 평균: 0.00, 최대: 1, 최소: 0, 건수: 997

### select_all_users.U_SID_ENC
총합: 148,438, 평균: 21205.43, 최대: 86,842, 최소: 21, 건수: 7

### select_all_users.U_EMAIL
총합: ∞, 평균: Infinity, 최대: ∞, 최소: 0, 건수: 620

### select_all_users.U_IP
총합: 143,028.803, 평균: 143.17, 최대: 223.63, 최소: 1.211, 건수: 999

### select_all_users.U_LEVEL
총합: 4,000, 평균: 4.00, 최대: 4, 최소: 4, 건수: 1000

### select_all_users.U_MSG_TYPE
총합: 100,408, 평균: 100.41, 최대: 111, 최소: 0, 건수: 1000

### select_all_users.U_LOG_CNT
총합: 1,377,391, 평균: 1377.39, 최대: 21,243, 최소: 0, 건수: 1000

### select_all_users.U_START_DATE
총합: 4,044, 평균: 2022.00, 최대: 2,024, 최소: 2,020, 건수: 2

### select_all_users.U_STOP_DATE
총합: 2,024, 평균: 2024.00, 최대: 2,024, 최소: 2,024, 건수: 1

### select_all_users.POINT
총합: 6,000, 평균: 6.00, 최대: 6,000, 최소: 0, 건수: 1000

### select_all_users.U_PROFILE_STEP
총합: 6,911, 평균: 6.91, 최대: 9, 최소: 0, 건수: 1000

### count_users_by_kind.count
총합: 203,884, 평균: 16990.33, 최대: 128,487, 최소: 9, 건수: 12

## 3. 식별된 패턴

- **select_all_users** (high): 1000행 반환, 컬럼: U_ID, U_SNO, U_PASSWD_ENC, U_NAME, U_NICK...
- **count_users_by_kind** (medium): 12행 반환, 컬럼: U_KIND, count

