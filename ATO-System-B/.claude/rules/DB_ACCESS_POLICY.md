# DB_ACCESS_POLICY.md

> **버전**: 1.3.0
> **최종 수정**: 2025-12-29
> **물리적 경로**: `.claude/rules/DB_ACCESS_POLICY.md`
> **목적**: AI Agent의 데이터베이스 접근 정책 (SSOT)

---

## 로딩 설정

| Role | 로딩 문서 |
|------|----------|
| Analyzer | 이 문서 |
| Coder | 이 문서 (섹션 1, 4만) |
| Implementation Leader | 이 문서 (검증 시) |

---

## 1. 핵심 원칙

### 1.1 절대 금지 (🔴 NEVER)

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

### 1.2 SELECT * 금지 (🔴 FORBIDDEN)

```sql
❌ SELECT * FROM USERS WHERE condition;     -- 민감 컬럼 노출 위험
✅ SELECT U_ID, U_KIND, U_ALIVE FROM USERS; -- 명시적 컬럼만
```

### 1.3 허용 (✅ ALLOWED)

```sql
SELECT column1, column2 FROM table WHERE condition;
SELECT COUNT(*) FROM table;
SHOW TABLES; DESCRIBE table; EXPLAIN SELECT ...;
```

---

## 2. 권한 레벨

| 항목 | 설정 |
|------|------|
| 계정명 | `ai_readonly` |
| 권한 | SELECT, SHOW, DESCRIBE |
| 접근 DB | `medigate` (읽기 전용) |
| 세션 제한 | 최대 5개 동시 연결 |

```sql
CREATE USER 'ai_readonly'@'%' IDENTIFIED BY 'SECURE_PASSWORD';
GRANT SELECT ON medigate.* TO 'ai_readonly'@'%';
FLUSH PRIVILEGES;
```

---

## 3. 쿼리 제한

| 제한 항목 | 값 | 이유 |
|----------|-----|------|
| 최대 행 수 | 10,000행 | 메모리 보호 |
| 실행 시간 | 30초 | 장시간 쿼리 방지 |
| 동시 쿼리 | 3개 | 리소스 보호 |
| 일일 쿼리 수 | 1,000개 | 과도한 사용 방지 |

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

## 4. 민감 컬럼 블랙리스트 (🚨 CRITICAL)

> **모든 쿼리에서 조회 금지** - 쿼리 검증 게이트에서 자동 차단

| 컬럼명 | 민감도 | 사유 |
|--------|--------|------|
| `U_PASSWD`, `U_PASSWD_ENC` | 🚨 Extreme | 비밀번호 |
| `U_SID`, `U_SID_ENC`, `U_JUMIN` | 🚨 Extreme | 주민번호 |
| `U_CARD_NO`, `U_ACCOUNT_NO` | 🚨 Extreme | 금융정보 |
| `U_EMAIL`, `U_NAME` | 🔴 High | 개인식별정보 |
| `U_TEL`, `U_PHONE`, `U_MOBILE` | 🔴 High | 연락처 |
| `U_LICENSE_NO` | 🔴 High | 면허번호 |
| `U_IP`, `LOGIN_IP` | 🟡 Medium | 접속정보 |

```javascript
const SENSITIVE_COLUMNS = [
  'U_PASSWD', 'U_PASSWD_ENC', 'U_EMAIL', 'U_NAME',
  'U_SID', 'U_SID_ENC', 'U_JUMIN', 'U_TEL', 'U_PHONE',
  'U_MOBILE', 'U_IP', 'LOGIN_IP', 'U_CARD_NO',
  'U_ACCOUNT_NO', 'U_LICENSE_NO'
];
// 위 컬럼이 SQL에 포함되면 CRITICAL 위반으로 쿼리 차단
```

---

## 5. 접근 제한 테이블

| 테이블 | 제한 수준 | 사유 |
|--------|----------|------|
| `USER_PASSWORD` | 🚨 완전 차단 | 인증 정보 |
| `USER_SESSION` | 🚨 완전 차단 | 세션 토큰 |
| `PAYMENT_INFO` | 🚨 완전 차단 | 결제 정보 |
| `API_KEYS` | 🚨 완전 차단 | API 키 |
| `ADMIN_LOG` | 🔴 승인 필요 | 관리자 감사 로그 |

---

## 6. 마스킹 처리

| 데이터 유형 | 마스킹 패턴 | 예시 |
|------------|------------|------|
| 이메일 | 앞 4자 + *** + 도메인 | `test***@example.com` |
| 전화번호 | 앞 3자리 + **** + 뒤 4자리 | `010-****-1234` |
| 주민번호 | 전체 마스킹 | `******-*******` |
| 카드번호 | 뒤 4자리만 | `****-****-****-1234` |

---

## 7. 쿼리 검증

### 7.1 사전 검증 체크리스트

```javascript
const checks = [
  { name: "SELECT_ONLY", fn: () => sql.trim().toUpperCase().startsWith("SELECT") },
  { name: "NO_WRITE", fn: () => !/(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)/i.test(sql) },
  { name: "NO_SUBQUERY_WRITE", fn: () => !/\(\s*(INSERT|UPDATE|DELETE)/i.test(sql) },
  { name: "NO_UNION_WRITE", fn: () => !/UNION\s+(INSERT|UPDATE|DELETE)/i.test(sql) },
  { name: "LIMIT_EXISTS", fn: () => /LIMIT\s+\d+/i.test(sql) }
];
```

### 7.2 금지 패턴

```javascript
const FORBIDDEN_PATTERNS = [
  /;\s*(INSERT|UPDATE|DELETE)/i, // 다중 명령문
  /INTO\s+OUTFILE/i,             // 파일 출력
  /LOAD\s+DATA/i,                // 파일 로드
  /BENCHMARK\s*\(/i,             // 벤치마크 공격
  /SLEEP\s*\(/i,                 // 시간 지연 공격
  /@@\w+/i                       // 시스템 변수 접근
];
```

---

## 8. 감사 로깅

```json
{
  "timestamp": "2024-12-19T12:00:00Z",
  "agent": "QueryAgent",
  "taskId": "task-123",
  "query": "SELECT U_ID, U_KIND FROM USERS LIMIT 100",
  "rowCount": 100,
  "executionTime": "245ms",
  "status": "success"
}
```

| 유형 | 보존 기간 |
|------|----------|
| 일반 쿼리 로그 | 30일 |
| 에러 로그 | 90일 |
| 보안 이벤트 | 1년 |

---

## 9. 비상 대응

### 이상 징후
- 비정상적 쿼리 빈도 (분당 100회 초과)
- 대량 데이터 조회 (10,000행 초과)
- 반복적인 에러 발생

### 자동 차단

```javascript
if (queryCount > 100 || errorRate > 0.5) {
  await killSwitch.activate("DB_ACCESS");
  await alertTeam("DB 접근 차단됨: 이상 징후 감지");
}
```

### 수동 차단

```bash
echo '{"DB_ACCESS": false}' > orchestrator/config/kill-switch.json
# 또는
REVOKE ALL PRIVILEGES ON medigate.* FROM 'ai_readonly'@'%';
```

---

## 10. 규정 준수

| 규정 | 준수 사항 |
|------|----------|
| 개인정보보호법 | 최소 권한, 목적 제한, 데이터 최소화, 익명화 |
| 의료법 | 환자 정보 보호 |
| GDPR | 해당 시 적용 |

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| DOMAIN_SCHEMA.md | 민감 데이터 정의, 스키마 구조 |
| VALIDATION_GUIDE.md | 쿼리 실행 전 검증 규칙 |
| ANALYSIS_GUIDE.md | Analyzer 특화 가이드 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.3.0 | 2025-12-29 | 300줄 다이어트: 중복 제거, 테이블 압축 |
| 1.2.0 | 2025-12-26 | 민감 컬럼 블랙리스트 추가 |

---

**END OF DB_ACCESS_POLICY.md**
