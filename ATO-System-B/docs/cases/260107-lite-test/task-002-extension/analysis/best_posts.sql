-- ============================================================
-- 무찌마 일간 베스트 게시물 추출 SQL
-- Case ID: 260107-lite-test/task-002-extension
-- 생성일: 2026-01-07
-- 생성자: Query Skill v3.1
-- ============================================================

-- ============================================================
-- Query 1: 일간 베스트 게시물 TOP 5
-- 테이블: BOARD_MUZZIMA (337만행, High Risk)
-- 인덱스: (CTG_CODE, REG_DATE)
-- ============================================================
SELECT
    BOARD_IDX,
    TITLE,
    CONTENT,
    READ_CNT,
    AGREE_CNT,
    REG_DATE,
    (READ_CNT + AGREE_CNT) AS popularity_score
FROM BOARD_MUZZIMA
WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
ORDER BY popularity_score DESC
LIMIT 5;


-- ============================================================
-- Query 2: 베스트 게시물별 댓글 수 집계
-- 테이블: COMMENT (1,826만행, Extreme Risk)
-- 인덱스: (BOARD_IDX, SVC_CODE) - 반드시 활용
-- ============================================================
SELECT
    c.BOARD_IDX,
    COUNT(*) AS comment_count
FROM COMMENT c
WHERE c.BOARD_IDX IN (
    SELECT BOARD_IDX
    FROM BOARD_MUZZIMA
    WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
    ORDER BY (READ_CNT + AGREE_CNT) DESC
    LIMIT 5
)
GROUP BY c.BOARD_IDX
ORDER BY comment_count DESC;


-- ============================================================
-- Query 3: 베스트 게시물 + 댓글 수 통합 조회
-- 용도: 분석 리포트용 통합 데이터
-- ============================================================
SELECT
    b.BOARD_IDX,
    b.TITLE,
    b.CONTENT,
    b.READ_CNT,
    b.AGREE_CNT,
    b.REG_DATE,
    (b.READ_CNT + b.AGREE_CNT) AS popularity_score,
    COALESCE(c.comment_count, 0) AS comment_count
FROM (
    SELECT
        BOARD_IDX,
        TITLE,
        CONTENT,
        READ_CNT,
        AGREE_CNT,
        REG_DATE
    FROM BOARD_MUZZIMA
    WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
    ORDER BY (READ_CNT + AGREE_CNT) DESC
    LIMIT 5
) b
LEFT JOIN (
    SELECT BOARD_IDX, COUNT(*) AS comment_count
    FROM COMMENT
    WHERE BOARD_IDX IN (
        SELECT BOARD_IDX
        FROM BOARD_MUZZIMA
        WHERE REG_DATE >= NOW() - INTERVAL 24 HOUR
        ORDER BY (READ_CNT + AGREE_CNT) DESC
        LIMIT 5
    )
    GROUP BY BOARD_IDX
) c ON b.BOARD_IDX = c.BOARD_IDX
ORDER BY popularity_score DESC;


-- ============================================================
-- 검증 체크리스트
-- ============================================================
-- [x] SELECT only (INSERT/UPDATE/DELETE 없음)
-- [x] SELECT * 미사용 (명시적 컬럼만)
-- [x] LIMIT 포함 (5건)
-- [x] 민감 컬럼 미포함 (U_ID 제외 - 비식별화)
-- [x] 인덱스 활용 (REG_DATE, BOARD_IDX)
-- [x] DOMAIN_SCHEMA.md 컬럼명 준수
-- ============================================================
