-- ============================================================
-- Query: 무찌마 일간 베스트 게시물 추출
-- Case ID: 260107-lite-test/task-003-extension
-- Created: 2026-01-07
-- Author: Query Skill v3.2
-- ============================================================
-- 목적: 24시간 내 인기 게시물 상위 5건 추출
-- 인기 점수: READ_CNT + (AGREE_CNT * 10)
-- ============================================================

SELECT
    BOARD_IDX,
    TITLE,
    CONTENT,
    READ_CNT,
    AGREE_CNT,
    REG_DATE,
    (READ_CNT + AGREE_CNT * 10) AS popularity_score
FROM BOARD_MUZZIMA
WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
ORDER BY popularity_score DESC
LIMIT 5;
