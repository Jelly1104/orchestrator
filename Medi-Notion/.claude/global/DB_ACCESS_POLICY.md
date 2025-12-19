# DB_ACCESS_POLICY.md

> **버전**: 1.0.0
> **최종 수정**: 2025-12-19
> **목적**: AI Agent의 데이터베이스 접근 정책

---

## 1. 핵심 원칙

### 1.1 절대 금지 (🔴 NEVER)

```sql
-- 다음 명령어는 AI Agent가 절대 실행할 수 없음

INSERT INTO ...    -- 데이터 삽입 금지
UPDATE ...         -- 데이터 수정 금지
DELETE FROM ...    -- 데이터 삭제 금지
DROP TABLE ...     -- 테이블 삭제 금지
ALTER TABLE ...    -- 스키마 변경 금지
TRUNCATE TABLE ... -- 테이블 비우기 금지
CREATE TABLE ...   -- 테이블 생성 금지
GRANT ...          -- 권한 부여 금지
REVOKE ...         -- 권한 회수 금지
```

### 1.2 허용 (✅ ALLOWED)

```sql
-- SELECT 쿼리만 허용 (읽기 전용)

SELECT * FROM table WHERE condition;
SELECT COUNT(*) FROM table;
SELECT column FROM table GROUP BY column;
SELECT ... JOIN ... ON ...;
SHOW TABLES;
DESCRIBE table;
EXPLAIN SELECT ...;
```

---

## 2. 권한 레벨

### 2.1 AI Agent 계정

| 항목 | 설정 |
|------|------|
| **계정명** | `ai_readonly` |
| **권한** | SELECT, SHOW, DESCRIBE |
| **접근 DB** | `medigate` (읽기 전용) |
| **접근 IP** | 허용된 서버 IP만 |
| **세션 제한** | 최대 5개 동시 연결 |

### 2.2 권한 부여 SQL

```sql
-- AI Agent용 읽기 전용 계정 생성
CREATE USER 'ai_readonly'@'%' IDENTIFIED BY 'SECURE_PASSWORD';

-- SELECT 권한만 부여
GRANT SELECT ON medigate.* TO 'ai_readonly'@'%';

-- 권한 적용
FLUSH PRIVILEGES;
```

---

## 3. 쿼리 제한

### 3.1 실행 제한

| 제한 항목 | 값 | 이유 |
|----------|-----|------|
| **최대 행 수** | 10,000행 | 메모리 보호 |
| **실행 시간** | 30초 | 장시간 쿼리 방지 |
| **동시 쿼리** | 3개 | 리소스 보호 |
| **일일 쿼리 수** | 1,000개 | 과도한 사용 방지 |

### 3.2 구현 (QueryAgent)

```javascript
// orchestrator/skills/query-agent/index.js

const QUERY_LIMITS = {
  MAX_ROWS: 10000,
  TIMEOUT_MS: 30000,
  MAX_CONCURRENT: 3,
  DAILY_LIMIT: 1000
};

// 쿼리에 LIMIT 자동 추가
function sanitizeQuery(sql) {
  if (!sql.toUpperCase().includes('LIMIT')) {
    return `${sql} LIMIT ${QUERY_LIMITS.MAX_ROWS}`;
  }
  return sql;
}
```

---

## 4. 민감 데이터 보호

### 4.1 접근 금지 테이블

```yaml
금지 테이블:
  - USER_PASSWORD       # 비밀번호 해시
  - USER_SESSION        # 세션 토큰
  - PAYMENT_INFO        # 결제 정보
  - ADMIN_LOG           # 관리자 로그
  - API_KEYS            # API 키
```

### 4.2 마스킹 대상 컬럼

```yaml
마스킹 컬럼:
  - email → test***@example.com
  - phone → 010-****-1234
  - ssn → ******-*******
  - card_number → ****-****-****-1234
```

### 4.3 마스킹 구현

```javascript
// 결과 데이터 마스킹
function maskSensitiveData(rows) {
  const sensitiveColumns = ['email', 'phone', 'ssn', 'card_number'];

  return rows.map(row => {
    const masked = { ...row };
    for (const col of sensitiveColumns) {
      if (masked[col]) {
        masked[col] = maskValue(col, masked[col]);
      }
    }
    return masked;
  });
}
```

---

## 5. 감사 로깅

### 5.1 로깅 대상

모든 DB 쿼리는 다음 정보와 함께 로깅됨:

```json
{
  "timestamp": "2024-12-19T12:00:00Z",
  "agent": "QueryAgent",
  "taskId": "task-123",
  "query": "SELECT * FROM USER_DETAIL LIMIT 100",
  "rowCount": 100,
  "executionTime": "245ms",
  "status": "success"
}
```

### 5.2 로그 저장 위치

```
orchestrator/logs/db-audit/
├── 2024-12-19.json
├── 2024-12-18.json
└── ...
```

### 5.3 로그 보존 기간

| 유형 | 보존 기간 |
|------|----------|
| 일반 쿼리 로그 | 30일 |
| 에러 로그 | 90일 |
| 보안 이벤트 | 1년 |

---

## 6. 쿼리 검증

### 6.1 사전 검증 체크리스트

```javascript
function validateQuery(sql) {
  const checks = [
    { name: 'SELECT_ONLY', fn: () => sql.trim().toUpperCase().startsWith('SELECT') },
    { name: 'NO_WRITE', fn: () => !/(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)/i.test(sql) },
    { name: 'NO_SUBQUERY_WRITE', fn: () => !/\(\s*(INSERT|UPDATE|DELETE)/i.test(sql) },
    { name: 'NO_UNION_WRITE', fn: () => !/UNION\s+(INSERT|UPDATE|DELETE)/i.test(sql) },
    { name: 'LIMIT_EXISTS', fn: () => /LIMIT\s+\d+/i.test(sql) || addLimit(sql) }
  ];

  for (const check of checks) {
    if (!check.fn()) {
      throw new Error(`Query validation failed: ${check.name}`);
    }
  }
}
```

### 6.2 금지 패턴

```javascript
const FORBIDDEN_PATTERNS = [
  /;\s*(INSERT|UPDATE|DELETE)/i,  // 다중 명령문
  /INTO\s+OUTFILE/i,              // 파일 출력
  /LOAD\s+DATA/i,                 // 파일 로드
  /BENCHMARK\s*\(/i,              // 벤치마크 공격
  /SLEEP\s*\(/i,                  // 시간 지연 공격
  /@@\w+/i,                       // 시스템 변수 접근
];
```

---

## 7. 비상 대응

### 7.1 이상 징후

- 비정상적 쿼리 빈도 (분당 100회 초과)
- 대량 데이터 조회 (10,000행 초과)
- 반복적인 에러 발생

### 7.2 자동 차단

```javascript
// 이상 징후 감지 시 자동 차단
if (queryCount > 100 || errorRate > 0.5) {
  await killSwitch.activate('DB_ACCESS');
  await alertTeam('DB 접근 차단됨: 이상 징후 감지');
}
```

### 7.3 수동 차단

```bash
# DB 접근 즉시 차단
echo '{"DB_ACCESS": false}' > orchestrator/config/kill-switch.json

# 또는 MySQL에서 직접 차단
REVOKE ALL PRIVILEGES ON medigate.* FROM 'ai_readonly'@'%';
```

---

## 8. 규정 준수

### 8.1 관련 규정

- 개인정보보호법 (PIPA)
- 의료법 (환자 정보 보호)
- GDPR (해당 시)

### 8.2 준수 사항

1. **최소 권한 원칙**: 필요한 데이터만 조회
2. **목적 제한**: 분석 목적 외 사용 금지
3. **데이터 최소화**: 불필요한 개인정보 조회 금지
4. **익명화**: 결과 리포트에서 개인 식별 불가능하게 처리

---

## 9. 검토 주기

| 항목 | 주기 | 담당 |
|------|------|------|
| 권한 검토 | 분기별 | 보안팀 |
| 쿼리 로그 감사 | 월별 | 개발팀 |
| 정책 업데이트 | 반기별 | PO + 보안팀 |

---

**END OF POLICY**
