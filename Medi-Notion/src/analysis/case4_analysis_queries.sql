-- ============================================
-- Case #4: 활성 회원 패턴 분석 PoC
-- PRD 체크리스트 기반 분석 쿼리
-- 생성일: 2025-12-18
-- ============================================

-- ============================================
-- [Query 1] 활성 회원 세그먼트 정의 SQL
-- 기준: 최근 30일 내 6+ 세션 로그인
-- 결과: 19,868명 (의사 회원 중 HEAVY 세그먼트)
-- ============================================

-- 기본 통계 (실행 완료)
-- 전체 활성 의사 회원: 128,324명
-- 전문과목 입력률: 100%
-- 근무형태 입력률: 100%

WITH HEAVY_USERS AS (
  SELECT
    ul.U_ID,
    COUNT(DISTINCT ul.LOGIN_DATE) AS login_days,
    COUNT(*) AS total_sessions
  FROM USER_LOGIN ul
  WHERE ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 30 DAY), '%Y%m%d')
    AND ul.U_KIND = 'UKD001'
  GROUP BY ul.U_ID
  HAVING COUNT(*) >= 6
)
SELECT
  COUNT(*) AS heavy_segment_count,
  AVG(login_days) AS avg_login_days,
  AVG(total_sessions) AS avg_sessions
FROM HEAVY_USERS;

-- 결과:
-- heavy_segment_count: 19,868
-- avg_login_days: 15.3
-- avg_sessions: 24.2


-- ============================================
-- [Query 2] 프로필-행동 조인 분석 쿼리
-- HEAVY 세그먼트 회원의 프로필 데이터 조인
-- ============================================

WITH HEAVY_USERS AS (
  SELECT
    ul.U_ID,
    COUNT(*) AS total_sessions
  FROM USER_LOGIN ul
  WHERE ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 30 DAY), '%Y%m%d')
    AND ul.U_KIND = 'UKD001'
  GROUP BY ul.U_ID
  HAVING COUNT(*) >= 6
)
SELECT
  'HEAVY' AS segment,
  COUNT(*) AS member_count,
  AVG(hu.total_sessions) AS avg_sessions,
  ROUND(SUM(CASE WHEN ud.U_MAJOR_CODE_1 IS NOT NULL AND ud.U_MAJOR_CODE_1 != '' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS major_fill_rate,
  ROUND(SUM(CASE WHEN ud.U_WORK_TYPE_1 IS NOT NULL AND ud.U_WORK_TYPE_1 != '' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS work_type_fill_rate
FROM HEAVY_USERS hu
INNER JOIN USERS u ON hu.U_ID = u.U_ID
LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
WHERE u.U_ALIVE = 'UST001';

-- 결과:
-- segment: HEAVY
-- member_count: 19,863
-- avg_sessions: 24.2
-- major_fill_rate: 100.0%
-- work_type_fill_rate: 100.0%


-- ============================================
-- [Query 3] 전문과목별 분포 비교 (활성 vs 전체)
-- ============================================

-- 전체 의사 전문과목별 분포
SELECT
  cm.CODE_NAME AS major_name,
  ud.U_MAJOR_CODE_1 AS major_code,
  COUNT(*) AS all_count,
  ROUND(COUNT(*) * 100.0 / (
    SELECT COUNT(*) FROM USERS u2
    INNER JOIN USER_DETAIL ud2 ON u2.U_ID = ud2.U_ID
    WHERE u2.U_KIND = 'UKD001' AND u2.U_ALIVE = 'UST001'
      AND ud2.U_MAJOR_CODE_1 IS NOT NULL AND ud2.U_MAJOR_CODE_1 != ''
  ), 1) AS all_pct
FROM USERS u
INNER JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
LEFT JOIN CODE_MASTER cm ON ud.U_MAJOR_CODE_1 = cm.CODE
WHERE u.U_KIND = 'UKD001'
  AND u.U_ALIVE = 'UST001'
  AND ud.U_MAJOR_CODE_1 IS NOT NULL
  AND ud.U_MAJOR_CODE_1 != ''
GROUP BY ud.U_MAJOR_CODE_1, cm.CODE_NAME
ORDER BY all_count DESC
LIMIT 15;

-- HEAVY 세그먼트 전문과목별 분포
WITH HEAVY_USERS AS (
  SELECT ul.U_ID
  FROM USER_LOGIN ul
  WHERE ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 30 DAY), '%Y%m%d')
    AND ul.U_KIND = 'UKD001'
  GROUP BY ul.U_ID
  HAVING COUNT(*) >= 6
)
SELECT
  cm.CODE_NAME AS major_name,
  ud.U_MAJOR_CODE_1 AS major_code,
  COUNT(*) AS heavy_count,
  ROUND(COUNT(*) * 100.0 / (
    SELECT COUNT(*) FROM HEAVY_USERS hu2
    INNER JOIN USER_DETAIL ud2 ON hu2.U_ID = ud2.U_ID
    WHERE ud2.U_MAJOR_CODE_1 IS NOT NULL AND ud2.U_MAJOR_CODE_1 != ''
  ), 1) AS heavy_pct
FROM HEAVY_USERS hu
INNER JOIN USER_DETAIL ud ON hu.U_ID = ud.U_ID
LEFT JOIN CODE_MASTER cm ON ud.U_MAJOR_CODE_1 = cm.CODE
WHERE ud.U_MAJOR_CODE_1 IS NOT NULL AND ud.U_MAJOR_CODE_1 != ''
GROUP BY ud.U_MAJOR_CODE_1, cm.CODE_NAME
ORDER BY heavy_count DESC
LIMIT 15;


-- ============================================
-- [Query 4] 근무형태별 분포 비교 (활성 vs 전체)
-- ============================================

-- 전체 의사 근무형태별 분포
SELECT
  cm.CODE_NAME AS work_type_name,
  ud.U_WORK_TYPE_1 AS work_type_code,
  COUNT(*) AS all_count,
  ROUND(COUNT(*) * 100.0 / (
    SELECT COUNT(*) FROM USERS u2
    INNER JOIN USER_DETAIL ud2 ON u2.U_ID = ud2.U_ID
    WHERE u2.U_KIND = 'UKD001' AND u2.U_ALIVE = 'UST001'
      AND ud2.U_WORK_TYPE_1 IS NOT NULL AND ud2.U_WORK_TYPE_1 != ''
  ), 1) AS all_pct
FROM USERS u
INNER JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
LEFT JOIN CODE_MASTER cm ON ud.U_WORK_TYPE_1 = cm.CODE
WHERE u.U_KIND = 'UKD001'
  AND u.U_ALIVE = 'UST001'
  AND ud.U_WORK_TYPE_1 IS NOT NULL
  AND ud.U_WORK_TYPE_1 != ''
GROUP BY ud.U_WORK_TYPE_1, cm.CODE_NAME
ORDER BY all_count DESC
LIMIT 10;

-- HEAVY 세그먼트 근무형태별 분포
WITH HEAVY_USERS AS (
  SELECT ul.U_ID
  FROM USER_LOGIN ul
  WHERE ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 30 DAY), '%Y%m%d')
    AND ul.U_KIND = 'UKD001'
  GROUP BY ul.U_ID
  HAVING COUNT(*) >= 6
)
SELECT
  cm.CODE_NAME AS work_type_name,
  ud.U_WORK_TYPE_1 AS work_type_code,
  COUNT(*) AS heavy_count,
  ROUND(COUNT(*) * 100.0 / (
    SELECT COUNT(*) FROM HEAVY_USERS hu2
    INNER JOIN USER_DETAIL ud2 ON hu2.U_ID = ud2.U_ID
    WHERE ud2.U_WORK_TYPE_1 IS NOT NULL AND ud2.U_WORK_TYPE_1 != ''
  ), 1) AS heavy_pct
FROM HEAVY_USERS hu
INNER JOIN USER_DETAIL ud ON hu.U_ID = ud.U_ID
LEFT JOIN CODE_MASTER cm ON ud.U_WORK_TYPE_1 = cm.CODE
WHERE ud.U_WORK_TYPE_1 IS NOT NULL AND ud.U_WORK_TYPE_1 != ''
GROUP BY ud.U_WORK_TYPE_1, cm.CODE_NAME
ORDER BY heavy_count DESC
LIMIT 10;


-- ============================================
-- [Query 5] 활성 회원 프로파일 요약
-- ============================================

WITH HEAVY_USERS AS (
  SELECT ul.U_ID
  FROM USER_LOGIN ul
  WHERE ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 30 DAY), '%Y%m%d')
    AND ul.U_KIND = 'UKD001'
  GROUP BY ul.U_ID
  HAVING COUNT(*) >= 6
)
SELECT
  '전체 의사' AS category,
  COUNT(*) AS total_count
FROM USERS u
WHERE u.U_KIND = 'UKD001' AND u.U_ALIVE = 'UST001'
UNION ALL
SELECT
  'HEAVY 세그먼트' AS category,
  COUNT(*) AS total_count
FROM HEAVY_USERS
UNION ALL
SELECT
  'HEAVY 비율' AS category,
  ROUND((SELECT COUNT(*) FROM HEAVY_USERS) * 100.0 /
        (SELECT COUNT(*) FROM USERS WHERE U_KIND = 'UKD001' AND U_ALIVE = 'UST001'), 1) AS total_count;


-- ============================================
-- 참고: 레거시 코드 매핑
-- ============================================
-- U_KIND: UKD001 = 의사
-- U_ALIVE: UST001 = 활성, UST000 = 비활성
-- U_MAJOR_CODE_1: SPC116 = 일반의, SPC103 = 내과, SPC121 = 정형외과 등
-- U_WORK_TYPE_1: 근무형태 코드 (CODE_MASTER KBN='WRK' 참조)
