# SQL_PATTERNS.md

> **버전**: 1.1.0 | **수정일**: 2026-01-07
> **정의**: SQL 쿼리 패턴 가이드
> **대상**: Analyzer | **로딩**: 작업 시
> **참조**: DOMAIN_SCHEMA.md (스키마 준수 필수)

---

## 1. 기본 조회 패턴

### 회원 기본 정보 조회
```sql
-- DOMAIN_SCHEMA.md 준수: USERS, USER_DETAIL 테이블
SELECT
  u.U_ID,
  u.U_KIND,
  ud.U_MAJOR_CODE_1,
  ud.U_WORK_TYPE_1,
  u.U_REG_DATE
FROM USERS u
JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
WHERE u.U_ALIVE = 'Y'  -- 활성 회원 (CHAR(6) 타입 주의)
  AND u.U_KIND = 'DOC001'  -- 의사만
```

### 기간별 필터링
```sql
WHERE u.U_REG_DATE BETWEEN '2024-01-01' AND '2024-12-31'
-- 또는
WHERE u.U_REG_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
```

---

## 2. 집계 패턴

### 세그먼트별 카운트
```sql
-- 전문과목별 분포 (CODE_MASTER 조인)
SELECT
  ud.U_MAJOR_CODE_1,
  cm.CODE_NAME AS specialty_name,
  COUNT(*) AS user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM USERS u
JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
LEFT JOIN CODE_MASTER cm
  ON cm.CODE_TYPE = 'MAJOR' AND cm.CODE_VALUE = ud.U_MAJOR_CODE_1
WHERE u.U_ALIVE = 'Y'
  AND u.U_KIND = 'DOC001'
GROUP BY ud.U_MAJOR_CODE_1, cm.CODE_NAME
ORDER BY user_count DESC
```

### 월별 추이 분석
```sql
SELECT
  DATE_FORMAT(u.U_REG_DATE, '%Y-%m') AS month,
  COUNT(*) AS new_users
FROM USERS u
WHERE u.U_REG_DATE >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
  AND u.U_ALIVE = 'Y'
GROUP BY DATE_FORMAT(u.U_REG_DATE, '%Y-%m')
ORDER BY month
```

---

## 3. JOIN 패턴

### 회원-활동 조인 (⚠️ 대용량 테이블 주의)
```sql
-- USER_LOGIN: 2,267만 행 → 반드시 인덱스 활용 (U_ID, LOGIN_DATE)
SELECT
  u.U_ID,
  COUNT(DISTINCT DATE(ul.LOGIN_DATE)) AS active_days,
  MAX(ul.LOGIN_DATE) AS last_active
FROM USERS u
LEFT JOIN USER_LOGIN ul ON u.U_ID = ul.U_ID
  AND ul.LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
WHERE u.U_ALIVE = 'Y'
GROUP BY u.U_ID
LIMIT 10000
```

### 다중 테이블 조인 (허용된 패턴만)
```sql
-- 허용: USERS + USER_DETAIL + CODE_MASTER (3테이블 이하)
-- 금지: USERS + USER_LOGIN + COMMENT (행태 추적 위험)
SELECT
  u.U_ID,
  ud.U_MAJOR_CODE_1,
  cm.CODE_NAME AS specialty_name,
  ud.U_WORK_TYPE_1
FROM USERS u
JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
LEFT JOIN CODE_MASTER cm
  ON cm.CODE_TYPE = 'MAJOR' AND cm.CODE_VALUE = ud.U_MAJOR_CODE_1
WHERE u.U_ALIVE = 'Y'
  AND u.U_KIND = 'DOC001'
```

---

## 4. 서브쿼리 패턴

### 조건부 필터링 (활성 회원 추출)
```sql
-- SELECT * 금지 → 필요 컬럼만 명시
SELECT u.U_ID, u.U_KIND, u.U_REG_DATE
FROM USERS u
WHERE u.U_ID IN (
  SELECT DISTINCT U_ID
  FROM USER_LOGIN
  WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
)
AND u.U_ALIVE = 'Y'
```

### 집계값 비교 (HEAVY 세그먼트 추출)
```sql
-- HEAVY: 로그인 10회 이상 + 게시글 조회 20회 이상
SELECT
  u.U_ID,
  login_count
FROM (
  SELECT U_ID, COUNT(*) AS login_count
  FROM USER_LOGIN
  WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
  GROUP BY U_ID
  HAVING COUNT(*) >= 10
) AS visits
JOIN USERS u ON u.U_ID = visits.U_ID
WHERE u.U_ALIVE = 'Y'
  AND u.U_KIND = 'DOC001'
LIMIT 10000
```

---

## 5. 채용 관련 패턴

### 채용공고 조회 (유효 공고만)
```sql
-- DOMAIN_SCHEMA.md: 유효한 채용공고 조회 패턴
SELECT
  rj.JOB_NO,
  rj.HOSPITAL_NAME,
  rj.INVITE_TYPE_NAME,
  rj.LOCATION,
  rj.REG_DATE,
  rj.END_DATE
FROM CBIZ_RECJOB rj
WHERE rj.APPROVAL_FLAG = 'Y'
  AND rj.START_DATE <= NOW()
  AND rj.END_DATE >= NOW()
  AND rj.DISPLAY_FLAG = 'Y'
  AND rj.DEL_FLAG = 'N'
ORDER BY rj.REG_DATE DESC
LIMIT 1000
```

### 지원 현황 분석
```sql
SELECT
  rj.JOB_NO,
  rj.HOSPITAL_NAME,
  COUNT(rm.MAP_NO) AS apply_count
FROM CBIZ_RECJOB rj
LEFT JOIN CBIZ_RECJOB_MAP rm ON rj.JOB_NO = rm.JOB_NO
WHERE rj.APPROVAL_FLAG = 'Y'
  AND rj.DEL_FLAG = 'N'
GROUP BY rj.JOB_NO, rj.HOSPITAL_NAME
ORDER BY apply_count DESC
LIMIT 1000
```

---

## 6. 성능 최적화 패턴

### LIMIT 필수 (대용량 테이블)
```sql
-- USER_LOGIN(2,267만), COMMENT(1,826만), BOARD_MUZZIMA(337만)
SELECT U_ID, LOGIN_DATE
FROM USER_LOGIN
WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY LOGIN_DATE DESC
LIMIT 10000
```

### 인덱스 활용 (DOMAIN_SCHEMA.md 참조)
```sql
-- USER_LOGIN 인덱스: (U_ID, LOGIN_DATE)
-- COMMENT 인덱스: (BOARD_IDX, SVC_CODE)
-- BOARD_MUZZIMA 인덱스: (CTG_CODE, REG_DATE)
SELECT U_ID, U_KIND, U_REG_DATE
FROM USERS
WHERE U_ALIVE = 'Y'
  AND U_REG_DATE >= '2024-01-01'
ORDER BY U_ID
```

### 불필요한 컬럼 제외
```sql
-- SELECT * 금지 (DB_ACCESS_POLICY.md)
-- 민감 컬럼 제외: U_PASSWD, U_SID, U_EMAIL, U_NAME 등
SELECT U_ID, U_KIND, U_REG_DATE
FROM USERS
WHERE U_ALIVE = 'Y'
```

---

## 7. 주의사항

### 금지 패턴 (DB_ACCESS_POLICY.md)
- `DELETE`, `UPDATE`, `INSERT`, `DROP`, `ALTER`, `TRUNCATE` 사용 금지
- `SELECT *` 금지 (민감 컬럼 노출 위험)
- `LIMIT` 없는 대용량 조회 금지

### 민감 컬럼 블랙리스트 (절대 조회 금지)
- `U_PASSWD`, `U_PASSWD_ENC` (비밀번호)
- `U_SID`, `U_SID_ENC`, `U_JUMIN` (주민번호)
- `U_CARD_NO`, `U_ACCOUNT_NO` (금융정보)
- `U_EMAIL`, `U_NAME`, `U_TEL`, `U_PHONE` (개인식별정보)

### 권장 패턴
- 명시적 컬럼 별칭 사용
- 날짜 함수 활용 (DATE_FORMAT, DATE_SUB 등)
- NULL 처리 (COALESCE, IFNULL)
- **DOMAIN_SCHEMA.md 컬럼명 정확히 사용**

### 테이블명 정리 (자주 혼동되는 케이스)
| 잘못된 사용 | 올바른 사용 |
|------------|------------|
| USER | USERS |
| U_STATUS = 'A' | U_ALIVE = 'Y' |
| U_NO | U_ID |
| MAJOR_CODE | U_MAJOR_CODE_1 |
| WORK_TYPE | U_WORK_TYPE_1 |

---

**END OF PATTERNS**
