# SDD.md: 알림 발송 시스템 설계

> **생성일**: 2025-12-16
> **케이스**: #2 (L1)
> **Leader**: Claude Code
> **참조**: `DOMAIN_SCHEMA.md`

---

## 1. API 설계

### 1.1 내 알림 목록 조회

```
GET /api/v1/notifications
```

**Headers**
- `X-User-Id`: 현재 사용자 ID (인증 후 주입)

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|-----|--------|------|
| page | number | N | 1 | 페이지 번호 |
| limit | number | N | 20 | 페이지당 개수 |

**Response 200**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "NOTICE",
        "title": "서비스 점검 안내",
        "message": "12월 20일 서비스 점검이 예정되어...",
        "isRead": false,
        "regDate": "2025-12-16T10:00:00Z"
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 95
    }
  }
}
```

### 1.2 알림 읽음 처리

```
PATCH /api/v1/notifications/:id/read
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "isRead": true
  }
}
```

### 1.3 알림 발송 (관리자)

```
POST /api/v1/admin/notifications
```

**Request Body**

```json
{
  "target": "ALL",
  "targetUserIds": [],
  "type": "NOTICE",
  "title": "서비스 점검 안내",
  "message": "12월 20일 서비스 점검이 예정되어 있습니다."
}
```

| 필드 | 타입 | 필수 | 설명 |
|-----|------|-----|------|
| target | string | Y | 'ALL' / 'SPECIFIC' |
| targetUserIds | string[] | N | SPECIFIC일 때 대상 U_ID 배열 |
| type | string | Y | 'NOTICE' / 'EVENT' / 'SYSTEM' |
| title | string | Y | 제목 (max 100자) |
| message | string | Y | 내용 (max 500자) |

**Response 201**

```json
{
  "success": true,
  "data": {
    "sentCount": 1500,
    "message": "알림이 발송되었습니다."
  }
}
```

---

## 2. 데이터베이스 설계

### 2.1 테이블 구조 (NOTIFICATION)

```sql
CREATE TABLE NOTIFICATION (
  NOTI_IDX        INT PRIMARY KEY AUTO_INCREMENT,
  U_ID            VARCHAR(14) NOT NULL,           -- 수신자 (USERS.U_ID FK)
  NOTI_TYPE       VARCHAR(10) NOT NULL,           -- 'NOTICE' / 'EVENT' / 'SYSTEM'
  TITLE           VARCHAR(100) NOT NULL,
  MESSAGE         VARCHAR(500) NOT NULL,
  READ_FLAG       CHAR(1) DEFAULT 'N',            -- 'Y' / 'N'
  DEL_FLAG        CHAR(1) DEFAULT 'N',
  REG_DATE        DATETIME DEFAULT CURRENT_TIMESTAMP,
  READ_DATE       DATETIME,

  INDEX idx_user_read (U_ID, READ_FLAG, DEL_FLAG),
  INDEX idx_reg_date (REG_DATE)
);
```

### 2.2 쿼리 패턴

**내 알림 목록 조회**

```sql
SELECT
  NOTI_IDX as id,
  NOTI_TYPE as type,
  TITLE as title,
  MESSAGE as message,
  READ_FLAG as isRead,
  REG_DATE as regDate
FROM NOTIFICATION
WHERE U_ID = :userId
  AND DEL_FLAG = 'N'
ORDER BY REG_DATE DESC
LIMIT :offset, :limit;
```

**안읽은 알림 개수**

```sql
SELECT COUNT(*) as unreadCount
FROM NOTIFICATION
WHERE U_ID = :userId
  AND READ_FLAG = 'N'
  AND DEL_FLAG = 'N';
```

**알림 읽음 처리**

```sql
UPDATE NOTIFICATION
SET READ_FLAG = 'Y',
    READ_DATE = NOW()
WHERE NOTI_IDX = :id
  AND U_ID = :userId;
```

**알림 발송 (Bulk Insert)**

```sql
INSERT INTO NOTIFICATION (U_ID, NOTI_TYPE, TITLE, MESSAGE)
SELECT U_ID, :type, :title, :message
FROM USERS
WHERE U_ALIVE = 'Y'
  AND (:target = 'ALL' OR U_ID IN (:targetUserIds));
```

---

## 3. 성능 고려사항

### 3.1 인덱스 전략

| 인덱스 | 용도 |
|-------|------|
| `idx_user_read` | 사용자별 알림 조회 최적화 |
| `idx_reg_date` | 최신순 정렬 최적화 |

### 3.2 대량 발송 처리

- 전체 회원 발송 시 Batch Insert 사용 (1000건 단위)
- 비동기 처리 권장 (Queue 활용)

---

## 4. 보안 고려사항

### 4.1 권한 검증

```typescript
// 알림 읽음 처리 시 본인 알림만 가능
if (notification.userId !== currentUserId) {
  throw new ForbiddenError('본인의 알림만 읽음 처리할 수 있습니다.');
}

// 관리자 API는 관리자 권한 검증 필수
if (!isAdmin(currentUser)) {
  throw new ForbiddenError('관리자 권한이 필요합니다.');
}
```

### 4.2 입력 검증

```typescript
// 제목/내용 길이 제한
const titleSchema = z.string().max(100);
const messageSchema = z.string().max(500);

// XSS 방지
const sanitizedTitle = escapeHtml(title);
const sanitizedMessage = escapeHtml(message);
```

---

## 5. 에러 처리

| 상황 | HTTP 코드 | 에러 코드 | 메시지 |
|-----|----------|----------|--------|
| 알림 없음 | 404 | NOTIFICATION_NOT_FOUND | 알림을 찾을 수 없습니다 |
| 권한 없음 | 403 | FORBIDDEN | 권한이 없습니다 |
| 입력 오류 | 400 | VALIDATION_ERROR | 입력값을 확인해주세요 |

---

**END OF SDD.md**
