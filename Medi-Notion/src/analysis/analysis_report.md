# 분석 리포트

> **생성일**: 2025-12-19T04:39:27.698Z
> **PRD 유형**: QUANTITATIVE
> **파이프라인**: analysis

---

## 1. 분석 개요

### 1.1 목적
**: HEAVY 세그먼트 회원(16,037명)의 프로필 패턴을 분석하여 AI Agent Use Case 우선 적용 대상 세그먼트를 정의

### 1.2 실행 결과 요약
- 총 쿼리: 6개
- 성공: 6개
- 실패: 0개

---

## 2. 쿼리 실행 결과

### case_01_활성회원세그먼트정의
- **설명**: HEAVY 세그먼트 회원(16,037명) 활성 회원 세그먼트 정의
- **결과 행 수**: 2

```sql
SELECT u.U_KIND, COUNT(*) as total_count, SUM(CASE WHEN u.U_ALIVE = 'UST001' THEN 1 ELSE 0 END) as active_count, ROUND(SUM(CASE WHEN u.U_ALIVE = 'UST001' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as active_ratio FROM USERS u WHERE u.U_KIND IN ('UKD001', 'UKD003') GROUP BY u.U_KIND ORDER BY active_count DESC
```

**샘플 데이터** (최대 5행):
```json
[
  {
    "U_KIND": "UKD001",
    "total_count": "128468",
    "active_count": "128329",
    "active_ratio": "99.89"
  },
  {
    "U_KIND": "UKD003",
    "total_count": "57877",
    "active_count": "57876",
    "active_ratio": "100.00"
  }
]
```

---

### case_02_프로필행동조인분석
- **설명**: 활성 회원의 프로필과 최근 로그인 행동 패턴 분석
- **결과 행 수**: 1000

```sql
SELECT u.U_ID, u.U_KIND, ud.U_MAJOR_CODE_1, ud.U_WORK_TYPE_1, DATEDIFF(CURDATE(), STR_TO_DATE(u.U_REG_DATE, '%Y%m%d')) as days_since_reg, (SELECT MAX(LOGIN_DATE) FROM USER_LOGIN ul WHERE ul.U_ID = u.U_ID AND ul.LOGIN_DATE >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) LIMIT 1) as last_login_30days FROM USERS u LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID WHERE u.U_ALIVE = 'UST001' AND u.U_KIND = 'UKD001' ORDER BY u.U_REG_DATE DESC LIMIT 1000
```

**샘플 데이터** (최대 5행):
```json
[
  {
    "U_ID": "smurpjr1",
    "U_KIND": "UKD001",
    "U_MAJOR_CODE_1": "SPC121",
    "U_WORK_TYPE_1": "WTP006",
    "days_since_reg": "NULL",
    "last_login_30days": "20251218"
  },
  {
    "U_ID": "yasha3939",
    "U_KIND": "UKD001",
    "U_MAJOR_CODE_1": "SPC106",
    "U_WORK_TYPE_1": "WTP005",
    "days_since_reg": "NULL",
    "last_login_30days": "20251218"
  },
  {
    "U_ID": "hardcore65",
    "U_KIND": "UKD001",
    "U_MAJOR_CODE_1": "SPC109",
    "U_WORK_TYPE_1": "WTP006",
    "days_since_reg": "NULL",
    "last_login_30days": "20251218"
  },
  {
    "U_ID": "medjhlee",
    "U_KIND": "UKD001",
    "U_MAJOR_CODE_1": "SPC111",
    "U_WORK_TYPE_1": "WTP007",
    "days_since_reg": "NULL",
    "last_login_30days": "20251218"
  },
  {
    "U_ID": "bsson47",
    "U_KIND": "UKD001",
    "U_MAJOR_CODE_1": "SPC124",
    "U_WORK_TYPE_1": "WTP007",
    "days_since_reg": "NULL",
    "last_login_30days": "20251218"
  }
]
```

---

### case_03_전문과목별분포비교
- **설명**: 전문과목별 분포 - 활성 회원 vs 전체 회원 비교
- **결과 행 수**: 20

```sql
SELECT cm.CODE_NAME as specialty, COUNT(CASE WHEN u.U_ALIVE = 'UST001' THEN 1 END) as active_count, COUNT(*) as total_count, ROUND(COUNT(CASE WHEN u.U_ALIVE = 'UST001' THEN 1 END) * 100.0 / COUNT(*), 2) as active_ratio FROM USERS u LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID LEFT JOIN CODE_MASTER cm ON cm.KBN = 'SPC' AND cm.CODE = ud.U_MAJOR_CODE_1 WHERE u.U_KIND = 'UKD001' AND ud.U_MAJOR_CODE_1 IS NOT NULL GROUP BY ud.U_MAJOR_CODE_1, cm.CODE_NAME HAVING COUNT(*) >= 50 ORDER BY active_count DESC LIMIT 20
```

**샘플 데이터** (최대 5행):
```json
[
  {
    "specialty": "일반의",
    "active_count": "21691",
    "total_count": "21739",
    "active_ratio": "99.78"
  },
  {
    "specialty": "내과",
    "active_count": "20125",
    "total_count": "20140",
    "active_ratio": "99.93"
  },
  {
    "specialty": "가정의학과",
    "active_count": "9015",
    "total_count": "9020",
    "active_ratio": "99.94"
  },
  {
    "specialty": "정형외과",
    "active_count": "8021",
    "total_count": "8029",
    "active_ratio": "99.90"
  },
  {
    "specialty": "외과",
    "active_count": "7097",
    "total_count": "7101",
    "active_ratio": "99.94"
  }
]
```

---

### case_04_근무형태별분포비교
- **설명**: 근무형태별 분포 - 활성 회원 vs 전체 회원 비교
- **결과 행 수**: 10

```sql
SELECT cm.CODE_NAME as work_type, COUNT(CASE WHEN u.U_ALIVE = 'UST001' THEN 1 END) as active_count, COUNT(*) as total_count, ROUND(COUNT(CASE WHEN u.U_ALIVE = 'UST001' THEN 1 END) * 100.0 / COUNT(*), 2) as active_ratio FROM USERS u LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID LEFT JOIN CODE_MASTER cm ON cm.KBN = 'WTP' AND cm.CODE = ud.U_WORK_TYPE_1 WHERE u.U_KIND = 'UKD001' AND ud.U_WORK_TYPE_1 IS NOT NULL GROUP BY ud.U_WORK_TYPE_1, cm.CODE_NAME ORDER BY active_count DESC
```

**샘플 데이터** (최대 5행):
```json
[
  {
    "work_type": "봉직",
    "active_count": "41939",
    "total_count": "41973",
    "active_ratio": "99.92"
  },
  {
    "work_type": "개원의",
    "active_count": "37305",
    "total_count": "37322",
    "active_ratio": "99.95"
  },
  {
    "work_type": "레지던트",
    "active_count": "12176",
    "total_count": "12190",
    "active_ratio": "99.89"
  },
  {
    "work_type": "교직",
    "active_count": "10146",
    "total_count": "10155",
    "active_ratio": "99.91"
  },
  {
    "work_type": "기타",
    "active_count": "9868",
    "total_count": "9902",
    "active_ratio": "99.66"
  }
]
```

---

### case_05_활성회원프로파일요약
- **설명**: 활성 회원 프로파일 요약 리포트 - 가입연도, 전문과목, 근무형태 종합
- **결과 행 수**: 50

```sql
SELECT YEAR(STR_TO_DATE(u.U_REG_DATE, '%Y%m%d')) as reg_year, cm1.CODE_NAME as specialty, cm2.CODE_NAME as work_type, COUNT(*) as member_count, AVG(DATEDIFF(CURDATE(), STR_TO_DATE(u.U_REG_DATE, '%Y%m%d'))) as avg_career_days FROM USERS u JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID LEFT JOIN CODE_MASTER cm1 ON cm1.KBN = 'SPC' AND cm1.CODE = ud.U_MAJOR_CODE_1 LEFT JOIN CODE_MASTER cm2 ON cm2.KBN = 'WTP' AND cm2.CODE = ud.U_WORK_TYPE_1 WHERE u.U_ALIVE = 'UST001' AND u.U_KIND = 'UKD001' AND u.U_REG_DATE >= '20200101' GROUP BY YEAR(STR_TO_DATE(u.U_REG_DATE, '%Y%m%d')), ud.U_MAJOR_CODE_1, ud.U_WORK_TYPE_1, cm1.CODE_NAME, cm2.CODE_NAME HAVING COUNT(*) >= 10 ORDER BY reg_year DESC, member_count DESC LIMIT 50
```

**샘플 데이터** (최대 5행):
```json
[
  {
    "reg_year": "NULL",
    "specialty": "일반의",
    "work_type": "인턴",
    "member_count": "4404",
    "avg_career_days": "NULL"
  },
  {
    "reg_year": "NULL",
    "specialty": "일반의",
    "work_type": "기타",
    "member_count": "2783",
    "avg_career_days": "NULL"
  },
  {
    "reg_year": "NULL",
    "specialty": "일반의",
    "work_type": "봉직",
    "member_count": "1874",
    "avg_career_days": "NULL"
  },
  {
    "reg_year": "NULL",
    "specialty": "내과",
    "work_type": "레지던트",
    "member_count": "814",
    "avg_career_days": "NULL"
  },
  {
    "reg_year": "NULL",
    "specialty": "일반의",
    "work_type": "공보의",
    "member_count": "526",
    "avg_career_days": "NULL"
  }
]
```

---

### case_06_AI에이전트타겟후보제안
- **설명**: AI Agent Use Case 우선 적용 대상 - 활성도 높은 세그먼트 식별
- **결과 행 수**: 9

```sql
SELECT 'HIGH_PRIORITY' as segment_type, cm1.CODE_NAME as specialty, cm2.CODE_NAME as work_type, COUNT(*) as target_count, ROUND(AVG(DATEDIFF(CURDATE(), STR_TO_DATE(u.U_REG_DATE, '%Y%m%d'))/365), 1) as avg_career_years FROM USERS u JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID LEFT JOIN CODE_MASTER cm1 ON cm1.KBN = 'SPC' AND cm1.CODE = ud.U_MAJOR_CODE_1 LEFT JOIN CODE_MASTER cm2 ON cm2.KBN = 'WTP' AND cm2.CODE = ud.U_WORK_TYPE_1 WHERE u.U_ALIVE = 'UST001' AND u.U_KIND = 'UKD001' AND ud.U_MAJOR_CODE_1 IN ('SPC103', 'SPC104', 'SPC105', 'SPC106', 'SPC107') AND ud.U_WORK_TYPE_1 IN ('WTP006', 'WTP007') GROUP BY ud.U_MAJOR_CODE_1, ud.U_WORK_TYPE_1, cm1.CODE_NAME, cm2.CODE_NAME HAVING COUNT(*) >= 100 ORDER BY target_count DESC LIMIT 10
```

**샘플 데이터** (최대 5행):
```json
[
  {
    "segment_type": "HIGH_PRIORITY",
    "specialty": "내과",
    "work_type": "봉직",
    "target_count": "7025",
    "avg_career_years": "NULL"
  },
  {
    "segment_type": "HIGH_PRIORITY",
    "specialty": "내과",
    "work_type": "개원의",
    "target_count": "5939",
    "avg_career_years": "NULL"
  },
  {
    "segment_type": "HIGH_PRIORITY",
    "specialty": "마취통증의학과",
    "work_type": "봉직",
    "target_count": "2567",
    "avg_career_years": "NULL"
  },
  {
    "segment_type": "HIGH_PRIORITY",
    "specialty": "산부인과",
    "work_type": "개원의",
    "target_count": "2526",
    "avg_career_years": "NULL"
  },
  {
    "segment_type": "HIGH_PRIORITY",
    "specialty": "산부인과",
    "work_type": "봉직",
    "target_count": "2448",
    "avg_career_years": "NULL"
  }
]
```

---

## 참고

- 이 리포트는 AnalysisAgent에 의해 자동 생성되었습니다.
- 원본 쿼리 파일은 `src/analysis/` 디렉토리에서 확인할 수 있습니다.
- 전체 결과 데이터는 `src/analysis/results/` 디렉토리에서 확인할 수 있습니다.

---

**END OF REPORT**
