# SQL_PATTERNS.md

> **버전**: 1.0.0 | **수정일**: 2026-01-07
> **정의**: SQL 쿼리 패턴 가이드
> **대상**: Analyzer | **로딩**: 작업 시

---

## 1. 기본 조회 패턴

### 회원 기본 정보 조회
```sql
SELECT
  u.U_NO,
  u.U_ID,
  ud.U_MAJOR_CODE_1 AS specialty,
  ud.U_WORK_TYPE AS work_type,
  u.U_REG_DATE AS reg_date
FROM USER u
JOIN USER_DETAIL ud ON u.U_NO = ud.U_NO
WHERE u.U_STATUS = 'A'  -- 활성 회원
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
SELECT
  ud.U_MAJOR_CODE_1 AS specialty,
  COUNT(*) AS user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM USER u
JOIN USER_DETAIL ud ON u.U_NO = ud.U_NO
WHERE u.U_STATUS = 'A'
GROUP BY ud.U_MAJOR_CODE_1
ORDER BY user_count DESC
```

### 월별 추이 분석
```sql
SELECT
  DATE_FORMAT(u.U_REG_DATE, '%Y-%m') AS month,
  COUNT(*) AS new_users
FROM USER u
WHERE u.U_REG_DATE >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(u.U_REG_DATE, '%Y-%m')
ORDER BY month
```

---

## 3. JOIN 패턴

### 회원-활동 조인
```sql
SELECT
  u.U_NO,
  COUNT(DISTINCT al.LOG_DATE) AS active_days,
  MAX(al.LOG_DATE) AS last_active
FROM USER u
LEFT JOIN ACCESS_LOG al ON u.U_NO = al.U_NO
WHERE u.U_STATUS = 'A'
GROUP BY u.U_NO
```

### 다중 테이블 조인
```sql
SELECT
  u.U_NO,
  ud.U_MAJOR_CODE_1,
  cm.CODE_NAME AS specialty_name,
  COUNT(ra.APPLY_NO) AS apply_count
FROM USER u
JOIN USER_DETAIL ud ON u.U_NO = ud.U_NO
LEFT JOIN CODE_MASTER cm ON cm.CODE = ud.U_MAJOR_CODE_1 AND cm.KBN = 'SPC'
LEFT JOIN RECRUIT_APPLY ra ON u.U_NO = ra.U_NO
WHERE u.U_STATUS = 'A'
GROUP BY u.U_NO, ud.U_MAJOR_CODE_1, cm.CODE_NAME
```

---

## 4. 서브쿼리 패턴

### 조건부 필터링
```sql
SELECT *
FROM USER u
WHERE u.U_NO IN (
  SELECT DISTINCT U_NO
  FROM ACCESS_LOG
  WHERE LOG_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
)
```

### 집계값 비교
```sql
SELECT
  u.U_NO,
  visit_count
FROM (
  SELECT U_NO, COUNT(*) AS visit_count
  FROM ACCESS_LOG
  WHERE LOG_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY U_NO
) AS visits
JOIN USER u ON u.U_NO = visits.U_NO
WHERE visit_count >= 10  -- 활성 사용자 기준
```

---

## 5. 채용 관련 패턴

### 채용공고 조회
```sql
SELECT
  rj.JOB_NO,
  rj.HOSPITAL_NAME,
  rj.INVITE_TYPE_NAME,
  rj.LOCATION,
  rj.REG_DATE,
  rj.END_DATE
FROM CBIZ_RECJOB rj
WHERE rj.STATUS = 'Y'  -- 진행 중
  AND rj.END_DATE >= NOW()
ORDER BY rj.REG_DATE DESC
```

### 지원 현황 분석
```sql
SELECT
  rj.JOB_NO,
  rj.HOSPITAL_NAME,
  COUNT(ra.APPLY_NO) AS apply_count,
  COUNT(DISTINCT ra.U_NO) AS applicant_count
FROM CBIZ_RECJOB rj
LEFT JOIN RECRUIT_APPLY ra ON rj.JOB_NO = ra.JOB_NO
WHERE rj.STATUS = 'Y'
GROUP BY rj.JOB_NO, rj.HOSPITAL_NAME
ORDER BY apply_count DESC
```

---

## 6. 성능 최적화 패턴

### LIMIT 사용
```sql
SELECT * FROM large_table
ORDER BY created_at DESC
LIMIT 10000
```

### 인덱스 활용
```sql
-- U_NO, U_STATUS, U_REG_DATE 인덱스 활용
SELECT * FROM USER
WHERE U_STATUS = 'A'
  AND U_REG_DATE >= '2024-01-01'
ORDER BY U_NO
```

### 불필요한 컬럼 제외
```sql
-- SELECT * 대신 필요 컬럼만
SELECT U_NO, U_ID, U_REG_DATE
FROM USER
WHERE U_STATUS = 'A'
```

---

## 7. 주의사항

### 금지 패턴
- `DELETE`, `UPDATE`, `INSERT`, `DROP`, `ALTER` 사용 금지
- `SELECT *` 지양 (필요 컬럼만 명시)
- `LIMIT` 없는 대용량 조회 금지

### 권장 패턴
- 명시적 컬럼 별칭 사용
- 날짜 함수 활용 (DATE_FORMAT, DATE_SUB 등)
- NULL 처리 (COALESCE, IFNULL)

---

**END OF PATTERNS**
