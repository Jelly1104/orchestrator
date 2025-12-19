-- 프로필-행동 조인 분석 SQL
-- 목표: 활성 회원의 프로필 데이터와 행동 데이터 통합 조회
-- 작성일: 2025-12-17
-- 참조: DOMAIN_SCHEMA.md - 레거시 스키마 정확한 매핑

-- Step 1: 활성 회원 + 프로필 정보 조인
SELECT 
    u.U_ID,
    u.U_NAME,
    u.U_EMAIL,
    u.U_REG_DATE,
    
    -- USER_DETAIL 프로필 정보 (DOMAIN_SCHEMA 정확한 컬럼명)
    ud.U_MAJOR_CODE_1,      -- NOT major_code
    ud.U_MAJOR_CODE_2,
    ud.U_WORK_TYPE_1,       -- NOT work_type_code  
    ud.U_OFFICE_ZIP,
    ud.U_OFFICE_ADDR,
    ud.U_HOSPITAL_NAME,
    ud.U_CAREER_YEAR,
    
    -- 전문과목 1 코드명
    cm_major1.CODE_NAME as MAJOR_1_NAME,
    -- 전문과목 2 코드명 (있는 경우)
    cm_major2.CODE_NAME as MAJOR_2_NAME,
    -- 근무형태 코드명
    cm_work.CODE_NAME as WORK_TYPE_NAME,
    
    -- 프로필 완성도 계산
    CASE 
        WHEN ud.U_MAJOR_CODE_1 IS NOT NULL 
             AND ud.U_WORK_TYPE_1 IS NOT NULL 
             AND ud.U_CAREER_YEAR IS NOT NULL 
             THEN 'COMPLETE'
        WHEN ud.U_MAJOR_CODE_1 IS NOT NULL 
             OR ud.U_WORK_TYPE_1 IS NOT NULL 
             THEN 'PARTIAL'
        ELSE 'EMPTY'
    END as PROFILE_COMPLETENESS

FROM USERS u

-- 활성 세그먼트와 조인 (이전 단계에서 정의된 16,037명)
JOIN (
    SELECT u2.U_ID
    FROM USERS u2
    WHERE u2.U_KIND = 'DOC001'
      AND u2.U_ALIVE = 'Y'
    -- 실제 활성도 기준은 active_segment_definition.sql 결과 활용
    ORDER BY u2.U_REG_DATE DESC  -- 임시 기준
    LIMIT 16037
) active_list ON u.U_ID = active_list.U_ID

-- 프로필 상세 정보 LEFT JOIN (모든 활성 회원 포함)
LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID

-- 전문과목 1 코드명 조회
LEFT JOIN CODE_MASTER cm_major1 ON (
    cm_major1.CODE_TYPE = 'MAJOR' 
    AND cm_major1.CODE_VALUE = ud.U_MAJOR_CODE_1
    AND cm_major1.USE_FLAG = 'Y'
)

-- 전문과목 2 코드명 조회 (복수 전공인 경우)
LEFT JOIN CODE_MASTER cm_major2 ON (
    cm_major2.CODE_TYPE = 'MAJOR' 
    AND cm_major2.CODE_VALUE = ud.U_MAJOR_CODE_2
    AND cm_major2.USE_FLAG = 'Y'
)

-- 근무형태 코드명 조회
LEFT JOIN CODE_MASTER cm_work ON (
    cm_work.CODE_TYPE = 'WORK_TYPE' 
    AND cm_work.CODE_VALUE = ud.U_WORK_TYPE_1
    AND cm_work.USE_FLAG = 'Y'
)

ORDER BY u.U_ID;

-- Step 2: 프로필 입력률 통계
SELECT 
    'PROFILE_COMPLETION_STATS' as METRIC_TYPE,
    
    COUNT(*) as TOTAL_ACTIVE_MEMBERS,
    
    -- 전문과목 입력률
    COUNT(ud.U_MAJOR_CODE_1) as MAJOR_FILLED_COUNT,
    ROUND(COUNT(ud.U_MAJOR_CODE_1) * 100.0 / COUNT(*), 2) as MAJOR_FILL_RATE,
    
    -- 근무형태 입력률  
    COUNT(ud.U_WORK_TYPE_1) as WORK_TYPE_FILLED_COUNT,
    ROUND(COUNT(ud.U_WORK_TYPE_1) * 100.0 / COUNT(*), 2) as WORK_TYPE_FILL_RATE,
    
    -- 경력 입력률
    COUNT(ud.U_CAREER_YEAR) as CAREER_FILLED_COUNT,
    ROUND(COUNT(ud.U_CAREER_YEAR) * 100.0 / COUNT(*), 2) as CAREER_FILL_RATE,
    
    -- 완전한 프로필 비율
    SUM(CASE 
        WHEN ud.U_MAJOR_CODE_1 IS NOT NULL 
             AND ud.U_WORK_TYPE_1 IS NOT NULL 
             AND ud.U_CAREER_YEAR IS NOT NULL 
        THEN 1 ELSE 0 
    END) as COMPLETE_PROFILE_COUNT,
    
    ROUND(
        SUM(CASE 
            WHEN ud.U_MAJOR_CODE_1 IS NOT NULL 
                 AND ud.U_WORK_TYPE_1 IS NOT NULL 
                 AND ud.U_CAREER_YEAR IS NOT NULL 
            THEN 1 ELSE 0 
        END) * 100.0 / COUNT(*), 2
    ) as COMPLETE_PROFILE_RATE

FROM USERS u
JOIN (
    SELECT u2.U_ID
    FROM USERS u2
    WHERE u2.U_KIND = 'DOC001'
      AND u2.U_ALIVE = 'Y'
    ORDER BY u2.U_REG_DATE DESC
    LIMIT 16037
) active_list ON u.U_ID = active_list.U_ID
LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID;

-- Step 3: 데이터 품질 검증
SELECT 
    'DATA_QUALITY_CHECK' as CHECK_TYPE,
    
    -- 중복 체크
    COUNT(*) as TOTAL_ROWS,
    COUNT(DISTINCT u.U_ID) as UNIQUE_MEMBERS,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT u.U_ID) THEN 'PASS'
        ELSE 'FAIL'
    END as DUPLICATE_CHECK,
    
    -- NULL 패턴 분석
    COUNT(CASE WHEN ud.U_ID IS NULL THEN 1 END) as NO_PROFILE_COUNT,
    COUNT(CASE WHEN ud.U_MAJOR_CODE_1 IS NULL THEN 1 END) as NO_MAJOR_COUNT,
    COUNT(CASE WHEN ud.U_WORK_TYPE_1 IS NULL THEN 1 END) as NO_WORK_TYPE_COUNT

FROM USERS u
JOIN (
    SELECT u2.U_ID  
    FROM USERS u2
    WHERE u2.U_KIND = 'DOC001'
      AND u2.U_ALIVE = 'Y'
    ORDER BY u2.U_REG_DATE DESC
    LIMIT 16037
) active_list ON u.U_ID = active_list.U_ID
LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID;

-- 주의사항:
-- 1. 모든 테이블 조인은 U_ID 기준 (인덱스 활용)
-- 2. CODE_MASTER 조회 시 USE_FLAG = 'Y' 필수
-- 3. LEFT JOIN 사용으로 프로필 미입력 회원도 포함
-- 4. 대용량 테이블 Full Scan 방지를 위한 서브쿼리 활용
-- 5. 레거시 컬럼명 정확 사용: U_MAJOR_CODE_1, U_WORK_TYPE_1 등