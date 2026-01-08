# DB_ACCESS_POLICY.md

> **버전**: 1.3.0 | **수정일**: 2026-01-08
> **정의**: 권한/금지 패턴, 민감 컬럼
> **대상**: Analyzer | **로딩**: 작업 시

---

## 핵심 원칙

### 절대 금지 (🔴 NEVER)

```sql
INSERT INTO ...    -- 데이터 삽입 금지
UPDATE ...         -- 데이터 수정 금지
DELETE FROM ...    -- 데이터 삭제 금지
DROP TABLE ...     -- 테이블 삭제 금지
ALTER TABLE ...    -- 스키마 변경 금지
TRUNCATE TABLE ... -- 테이블 비우기 금지
CREATE TABLE ...   -- 테이블 생성 금지
GRANT / REVOKE ... -- 권한 변경 금지
```

### SELECT \* 금지 (🔴 FORBIDDEN)

```sql
❌ SELECT * FROM USERS WHERE condition;     -- 민감 컬럼 노출 위험
✅ SELECT U_ID, U_KIND, U_ALIVE FROM USERS; -- 명시적 컬럼만
```

### 허용 (✅ ALLOWED)

```sql
SELECT column1, column2 FROM table WHERE condition;
SELECT COUNT(*) FROM table;
SHOW TABLES; DESCRIBE table; EXPLAIN SELECT ...;
```

---

## 권한 레벨

### 접근 규칙 (Role-Based Access)

| Role         | 계정          | 허용          | 금지                  | 목적                                           |
| :----------- | :------------ | :------------ | :-------------------- | :--------------------------------------------- |
| **Analyzer** | `ai_readonly` | **SELECT**    | INSERT/UPDATE/DELETE  | **발견(Discovery):** 데이터 구조 및 패턴 파악  |
| **Coder**    | -             | **접근 차단** | **ALL (SELECT 포함)** | **재현(Reproduction):** 계약/Fixture 기반 구현 |

| 항목      | 설정                   |
| --------- | ---------------------- |
| 계정명    | `ai_readonly`          |
| 권한      | SELECT, SHOW, DESCRIBE |
| 접근 DB   | `medigate` (읽기 전용) |
| 세션 제한 | 최대 5개 동시 연결     |

```sql
CREATE USER 'ai_readonly'@'%' IDENTIFIED BY 'SECURE_PASSWORD';
GRANT SELECT ON medigate.* TO 'ai_readonly'@'%';
FLUSH PRIVILEGES;
```

---

## 쿼리 제한

| 제한 항목    | 값       | 이유             |
| ------------ | -------- | ---------------- |
| 최대 행 수   | 10,000행 | 메모리 보호      |
| 실행 시간    | 30초     | 장시간 쿼리 방지 |
| 동시 쿼리    | 3개      | 리소스 보호      |
| 일일 쿼리 수 | 1,000개  | 과도한 사용 방지 |

```javascript
// LIMIT 자동 추가
function sanitizeQuery(sql) {
  if (!sql.toUpperCase().includes("LIMIT")) {
    return `${sql} LIMIT 10000`;
  }
  return sql;
}
```

---

## 민감 컬럼 블랙리스트 (🚨 CRITICAL)

> **모든 쿼리에서 조회 금지** - 쿼리 검증 게이트에서 자동 차단

| 컬럼명                          | 민감도     | 사유         |
| ------------------------------- | ---------- | ------------ |
| `U_PASSWD`, `U_PASSWD_ENC`      | 🚨 Extreme | 비밀번호     |
| `U_SID`, `U_SID_ENC`, `U_JUMIN` | 🚨 Extreme | 주민번호     |
| `U_CARD_NO`, `U_ACCOUNT_NO`     | 🚨 Extreme | 금융정보     |
| `U_EMAIL`, `U_NAME`             | 🔴 High    | 개인식별정보 |
| `U_TEL`, `U_PHONE`, `U_MOBILE`  | 🔴 High    | 연락처       |
| `U_LICENSE_NO`                  | 🔴 High    | 면허번호     |
| `U_IP`, `LOGIN_IP`              | 🟡 Medium  | 접속정보     |

```javascript
const SENSITIVE_COLUMNS = [
  "U_PASSWD",
  "U_PASSWD_ENC",
  "U_EMAIL",
  "U_NAME",
  "U_SID",
  "U_SID_ENC",
  "U_JUMIN",
  "U_TEL",
  "U_PHONE",
  "U_MOBILE",
  "U_IP",
  "LOGIN_IP",
  "U_CARD_NO",
  "U_ACCOUNT_NO",
  "U_LICENSE_NO",
];
// 위 컬럼이 SQL에 포함되면 CRITICAL 위반으로 쿼리 차단
```

---

## 접근 제한 테이블

| 테이블          | 제한 수준    | 사유             |
| --------------- | ------------ | ---------------- |
| `USER_PASSWORD` | 🚨 완전 차단 | 인증 정보        |
| `USER_SESSION`  | 🚨 완전 차단 | 세션 토큰        |
| `PAYMENT_INFO`  | 🚨 완전 차단 | 결제 정보        |
| `API_KEYS`      | 🚨 완전 차단 | API 키           |
| `ADMIN_LOG`     | 🔴 승인 필요 | 관리자 감사 로그 |

---

## 마스킹 처리

| 데이터 유형 | 마스킹 패턴                    | 예시                  |
| ----------- | ------------------------------ | --------------------- |
| 이메일      | 앞 4자 + \*\*\* + 도메인       | `test***@example.com` |
| 전화번호    | 앞 3자리 + \*\*\*\* + 뒤 4자리 | `010-****-1234`       |
| 주민번호    | 전체 마스킹                    | `******-*******`      |
| 카드번호    | 뒤 4자리만                     | `****-****-****-1234` |

---

## 쿼리 검증

### 사전 검증 체크리스트

```javascript
const checks = [
  {
    name: "SELECT_ONLY",
    fn: () => sql.trim().toUpperCase().startsWith("SELECT"),
  },
  {
    name: "NO_WRITE",
    fn: () => !/(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)/i.test(sql),
  },
  {
    name: "NO_SUBQUERY_WRITE",
    fn: () => !/\(\s*(INSERT|UPDATE|DELETE)/i.test(sql),
  },
  {
    name: "NO_UNION_WRITE",
    fn: () => !/UNION\s+(INSERT|UPDATE|DELETE)/i.test(sql),
  },
  { name: "LIMIT_EXISTS", fn: () => /LIMIT\s+\d+/i.test(sql) },
];
```

### 금지 패턴

```javascript
const FORBIDDEN_PATTERNS = [
  /;\s*(INSERT|UPDATE|DELETE)/i, // 다중 명령문
  /INTO\s+OUTFILE/i, // 파일 출력
  /LOAD\s+DATA/i, // 파일 로드
  /BENCHMARK\s*\(/i, // 벤치마크 공격
  /SLEEP\s*\(/i, // 시간 지연 공격
  /@@\w+/i, // 시스템 변수 접근
];
```

---

**END OF DB_ACCESS_POLICY.md**
