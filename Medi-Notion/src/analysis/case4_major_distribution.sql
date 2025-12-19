-- ============================================
-- Case #4: 전문과목별 분포 비교 (HEAVY vs 전체)
-- PRD: 전문과목별 분포 비교 (활성 vs 전체)
-- ============================================

-- Step 1: 전체 의사 전문과목별 분포
SELECT
  cm.CODE_NAME AS major_name,
  ud.U_MAJOR_CODE_1 AS major_code,
  COUNT(*) AS all_count
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
