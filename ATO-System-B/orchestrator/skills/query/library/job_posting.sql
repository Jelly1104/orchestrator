-- Query Library: job_posting.sql
-- Category: 채용 분석 (Job Posting Analysis)
-- Description: 채용공고 현황 및 트렌드 분석
-- Version: 1.0.0
-- Created: 2025-12-26
--
-- 허용된 테이블/컬럼 (DOMAIN_SCHEMA.md 준수):
-- - BOARD_RECRUIT: BW_ID, BW_TITLE, BW_REG_DATE, BW_VIEW_COUNT, BW_STATUS
-- - COMPANY: C_ID, C_NAME, C_KIND
--
-- Parameters:
-- - {{since_date}}: 조회 시작일 (YYYY-MM-DD)
-- - {{status_filter}}: 공고 상태 필터 (OPEN/CLOSED)
--

-- 1. 전체 채용공고 현황
SELECT
  BW_STATUS as status,
  COUNT(*) as posting_count
FROM BOARD_RECRUIT
GROUP BY BW_STATUS;

-- 2. 월별 채용공고 등록 추이 (최근 6개월)
SELECT
  DATE_FORMAT(BW_REG_DATE, '%Y-%m') as month,
  COUNT(*) as posting_count
FROM BOARD_RECRUIT
WHERE BW_REG_DATE >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY DATE_FORMAT(BW_REG_DATE, '%Y-%m')
ORDER BY month DESC;

-- 3. 인기 채용공고 TOP 10 (조회수 기준)
SELECT
  BW_ID,
  BW_TITLE,
  BW_VIEW_COUNT,
  BW_REG_DATE
FROM BOARD_RECRUIT
WHERE BW_STATUS = 'OPEN'
ORDER BY BW_VIEW_COUNT DESC
LIMIT 10;

-- 4. 기업 유형별 채용공고 분포
SELECT
  c.C_KIND as company_type,
  COUNT(b.BW_ID) as posting_count
FROM BOARD_RECRUIT b
INNER JOIN COMPANY c ON b.C_ID = c.C_ID
GROUP BY c.C_KIND
ORDER BY posting_count DESC;
