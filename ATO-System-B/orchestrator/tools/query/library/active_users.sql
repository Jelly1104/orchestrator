-- Query Library: active_users.sql
-- Category: 사용자 분석 (User Analysis)
-- Description: 활성 사용자 현황 조회
-- Version: 1.0.0
-- Created: 2025-12-26
--
-- 허용된 컬럼 (DOMAIN_SCHEMA.md 준수):
-- - U_ID, U_KIND, U_ALIVE, U_REG_DATE
--
-- Parameters:
-- - {{since_date}}: 조회 시작일 (YYYY-MM-DD)
-- - {{kind_filter}}: 사용자 유형 필터 (optional)
--

-- 1. 전체 활성 사용자 수
SELECT COUNT(*) as active_user_count
FROM USERS
WHERE U_ALIVE = 'Y';

-- 2. 유형별 활성 사용자 분포
SELECT
  U_KIND,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM USERS
WHERE U_ALIVE = 'Y'
GROUP BY U_KIND
ORDER BY user_count DESC;

-- 3. 월별 신규 가입자 추이 (최근 12개월)
SELECT
  DATE_FORMAT(U_REG_DATE, '%Y-%m') as month,
  COUNT(*) as new_users
FROM USERS
WHERE U_REG_DATE >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(U_REG_DATE, '%Y-%m')
ORDER BY month DESC;

-- 4. 유형별 활성/비활성 비율
SELECT
  U_KIND,
  U_ALIVE,
  COUNT(*) as user_count
FROM USERS
GROUP BY U_KIND, U_ALIVE
ORDER BY U_KIND, U_ALIVE;
