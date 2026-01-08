-- ============================================================
-- Query: 베스트 게시물별 댓글 수 집계
-- Case ID: 260107-lite-test/task-005-extension-full
-- 생성일: 2026-01-08
-- 생성자: Query Skill v3.4
-- ============================================================
--
-- 목적: 베스트 게시물의 댓글 수 집계
-- 제약사항:
--   - COMMENT 테이블 대용량(1,826만 행) - BOARD_IDX 인덱스 필수
--   - PII 컬럼 제외 (U_ID, CONTENT 등)
--   - GROUP BY BOARD_IDX
-- ============================================================

SELECT
    c.BOARD_IDX,
    COUNT(*) AS COMMENT_CNT
FROM COMMENT c
WHERE c.BOARD_IDX IN (
    SELECT bm.BOARD_IDX
    FROM BOARD_MUZZIMA bm
    WHERE bm.REG_DATE >= NOW() - INTERVAL 24 HOUR
      AND bm.REG_DATE <= NOW()
    ORDER BY (bm.READ_CNT + bm.AGREE_CNT * 2) DESC
    LIMIT 10
)
GROUP BY c.BOARD_IDX
ORDER BY COMMENT_CNT DESC;
