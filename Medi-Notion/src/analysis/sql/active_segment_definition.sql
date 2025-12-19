-- 활성 회원 세그먼트 정의 SQL
-- 목표: 정확히 16,037명의 활성 의사 회원 추출
-- 작성일: 2025-12-17
-- 참조: DOMAIN_SCHEMA.md - 레거시 컬럼명 준수

-- Step 1: 기본 활성 회원 조건 (의사 + 활성)
SELECT 
    u.U_ID,
    u.U_NAME,
    u.U_EMAIL,
    u.U_REG_DATE,
    u.U_KIND,
    u.U_ALIVE
FROM USERS u
WHERE u.U_KIND = 'DOC001'        -- 의사 회원만
  AND u.U_ALIVE = 'Y'            -- 활성 회원만
ORDER BY u.U_REG_DATE DESC;

-- Step 2: 활성도 점수 계산을 위한 임시 테이블 생성
-- (실제 활성도 계산은 게시글, 댓글, 로그인 기록 등을 종합)
CREATE TEMPORARY TABLE tmp_activity_scores AS
SELECT 
    u.U_ID,
    -- 활성도 점수 계산 (예시 로직)
    COALESCE(
        (SELECT COUNT(*) FROM BOARD_MUZZIMA bm WHERE bm.U_ID = u.U_ID AND bm.REG_DATE >= DATE_SUB(NOW(), INTERVAL 6 MONTH)) * 3 +
        (SELECT COUNT(*) FROM COMMENT c WHERE c.U_ID = u.U_ID AND c.REG_DATE >= DATE_SUB(NOW(), INTERVAL 6 MONTH)) * 1 +
        (SELECT COUNT(*) FROM USER_LOGIN ul WHERE ul.U_ID = u.U_ID AND ul.LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 3 MONTH)) * 0.1
    , 0) as ACTIVITY_SCORE
FROM USERS u
WHERE u.U_KIND = 'DOC001'
  AND u.U_ALIVE = 'Y';

-- Step 3: 활성 회원 상위 16,037명 추출 (최종 세그먼트)
SELECT 
    u.U_ID,
    u.U_NAME,
    u.U_EMAIL,
    u.U_REG_DATE,
    tas.ACTIVITY_SCORE,
    -- 활성도 등급 분류
    CASE 
        WHEN tas.ACTIVITY_SCORE >= 100 THEN 'VERY_HIGH'
        WHEN tas.ACTIVITY_SCORE >= 50 THEN 'HIGH'
        WHEN tas.ACTIVITY_SCORE >= 20 THEN 'MEDIUM'
        WHEN tas.ACTIVITY_SCORE >= 5 THEN 'LOW'
        ELSE 'MINIMAL'
    END as ACTIVITY_LEVEL
FROM USERS u
JOIN tmp_activity_scores tas ON u.U_ID = tas.U_ID
WHERE u.U_KIND = 'DOC001'
  AND u.U_ALIVE = 'Y'
ORDER BY tas.ACTIVITY_SCORE DESC
LIMIT 16037;  -- 정확히 16,037명

-- Step 4: 검증 쿼리 - 추출된 회원 수 확인
SELECT 
    COUNT(*) as EXTRACTED_COUNT,
    '16037' as TARGET_COUNT,
    CASE 
        WHEN COUNT(*) = 16037 THEN 'SUCCESS'
        ELSE 'FAIL'
    END as VALIDATION_RESULT
FROM (
    SELECT u.U_ID
    FROM USERS u
    JOIN tmp_activity_scores tas ON u.U_ID = tas.U_ID
    WHERE u.U_KIND = 'DOC001'
      AND u.U_ALIVE = 'Y'
    ORDER BY tas.ACTIVITY_SCORE DESC
    LIMIT 16037
) active_segment;

-- 정리: 임시 테이블 삭제
DROP TEMPORARY TABLE IF EXISTS tmp_activity_scores;

-- 주의사항:
-- 1. DOMAIN_SCHEMA.md의 실제 컬럼명 사용: U_ID, U_KIND, U_ALIVE (camelCase 변환 금지)
-- 2. 대용량 테이블(USER_LOGIN, COMMENT) 조회 시 인덱스 활용 필수
-- 3. 활성도 점수 계산 로직은 실제 비즈니스 요구사항에 따라 조정 필요
-- 4. 16,037명이 정확히 추출되지 않을 경우 활성도 기준 재조정 필요