-- ============================================================
-- Query: 무찌마 일간 베스트 게시물 추출
-- Case ID: 260107-lite-test/task-005-extension-full
-- 생성일: 2026-01-08
-- 생성자: Query Skill v3.4
-- ============================================================
--
-- 목적: 24시간 내 인기 게시물 상위 10건 추출
-- 인기도 공식: READ_CNT + (AGREE_CNT * 2)
-- 제약사항:
--   - SELECT only (INSERT/UPDATE/DELETE 금지)
--   - PII 컬럼 제외 (U_ID는 익명화 처리용으로만 사용)
--   - LIMIT 필수
--   - REG_DATE 인덱스 활용
-- ============================================================

SELECT
    bm.BOARD_IDX,
    bm.CTG_CODE,
    bm.TITLE,
    bm.CONTENT,
    bm.READ_CNT,
    bm.AGREE_CNT,
    bm.REG_DATE,
    (bm.READ_CNT + bm.AGREE_CNT * 2) AS popularity_score
FROM BOARD_MUZZIMA bm
WHERE bm.REG_DATE >= NOW() - INTERVAL 24 HOUR
  AND bm.REG_DATE <= NOW()
ORDER BY popularity_score DESC
LIMIT 10;
