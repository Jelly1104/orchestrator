-- 일간 베스트 게시물 추출 (24시간 내 Engagement Score 상위 5건)
-- DOMAIN_SCHEMA.md 준수: BOARD_MUZZIMA, COMMENT 테이블
-- 인덱스 활용: BOARD_MUZZIMA(CTG_CODE, REG_DATE), COMMENT(BOARD_IDX, SVC_CODE)

SELECT
  bm.BOARD_IDX,
  bm.TITLE,
  bm.CONTENT,
  bm.READ_CNT,
  bm.AGREE_CNT,
  bm.REG_DATE,
  COALESCE(c.comment_count, 0) AS comment_count,
  (bm.READ_CNT + COALESCE(c.comment_count, 0) * 3) AS engagement_score
FROM BOARD_MUZZIMA bm
LEFT JOIN (
  SELECT BOARD_IDX, COUNT(*) AS comment_count
  FROM COMMENT
  WHERE SVC_CODE = 'MUZZIMA'
  GROUP BY BOARD_IDX
) c ON bm.BOARD_IDX = c.BOARD_IDX
WHERE bm.REG_DATE >= NOW() - INTERVAL 24 HOUR
ORDER BY engagement_score DESC
LIMIT 5;
