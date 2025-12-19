-- 활성 의사 회원 추출 쿼리 (단순화 버전)
-- DOMAIN_SCHEMA.md의 실제 스키마만 사용

SELECT 
    u.U_ID,
    u.U_EMAIL,
    u.U_KIND,
    u.U_ALIVE,
    u.U_REG_DATE
FROM USERS u
WHERE u.U_KIND = 'DOC001'  -- 의사 회원만
  AND u.U_ALIVE = 'Y'      -- 활성 회원만
  AND u.U_REG_DATE >= DATE_SUB(NOW(), INTERVAL 24 MONTH) -- 최근 2년 가입
ORDER BY u.U_REG_DATE DESC
LIMIT 1000; -- 페이징으로 안전한 조회