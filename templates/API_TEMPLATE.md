---
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
author: {작성자}
source: development/SDD.md
---

# API 명세: {기능명}

---

## 1. 개요

* **Base URL:** `/api/v1/{resource}`
* **인증:** Bearer Token (JWT)
* **Content-Type:** application/json

---

## 2. API 목록

* `POST /{resource}`: 생성
* `GET /{resource}`: 목록 조회
* `GET /{resource}/{id}`: 단건 조회
* `PUT /{resource}/{id}`: 수정
* `DELETE /{resource}/{id}`: 삭제

---

## 3. API 상세

### 3-1. {리소스} 생성

**Endpoint:** `POST /api/v1/{resource}`

**설명:** {API 설명}

**Request Headers:**
* `Authorization`: Bearer {token}
* `Content-Type`: application/json

**Request Body:**

```json
{
  "{필드명}": "{타입} (필수/선택)",
  "{필드명}": "{타입} (필수/선택)"
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "{필드명}": "{값}",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response 400:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "{에러 메시지}",
    "details": [
      {
        "field": "{필드명}",
        "message": "{필드별 에러 메시지}"
      }
    ]
  }
}
```

**Response 401:**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증이 필요합니다."
  }
}
```

---

### 3-2. {리소스} 목록 조회

**Endpoint:** `GET /api/v1/{resource}`

**설명:** {API 설명}

**Request Headers:**
* `Authorization`: Bearer {token}

**Query Parameters:**
* `page`: 페이지 번호 (기본값: 1)
* `limit`: 페이지당 항목 수 (기본값: 20, 최대: 100)
* `sort`: 정렬 기준 (예: created_at:desc)
* `{필터명}`: {필터 설명}

**Response 200:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "{필드명}": "{값}"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

---

### 3-3. {리소스} 단건 조회

**Endpoint:** `GET /api/v1/{resource}/{id}`

**설명:** {API 설명}

**Request Headers:**
* `Authorization`: Bearer {token}

**Path Parameters:**
* `id`: 리소스 ID (UUID)

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "{필드명}": "{값}",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response 404:**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "{리소스}를 찾을 수 없습니다."
  }
}
```

---

### 3-4. {리소스} 수정

**Endpoint:** `PUT /api/v1/{resource}/{id}`

**설명:** {API 설명}

**Request Headers:**
* `Authorization`: Bearer {token}
* `Content-Type`: application/json

**Path Parameters:**
* `id`: 리소스 ID (UUID)

**Request Body:**

```json
{
  "{필드명}": "{타입} (선택)"
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "{필드명}": "{수정된 값}",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3-5. {리소스} 삭제

**Endpoint:** `DELETE /api/v1/{resource}/{id}`

**설명:** {API 설명}

**Request Headers:**
* `Authorization`: Bearer {token}

**Path Parameters:**
* `id`: 리소스 ID (UUID)

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "deleted": true
  }
}
```

---

## 4. 에러 코드

* **VALIDATION_ERROR:** 입력값 유효성 검사 실패
* **UNAUTHORIZED:** 인증 실패 또는 토큰 만료
* **FORBIDDEN:** 권한 없음
* **NOT_FOUND:** 리소스 없음
* **CONFLICT:** 중복 데이터
* **INTERNAL_ERROR:** 서버 내부 오류

---

## 5. 변경 이력

* **YYYY-MM-DD:** 최초 작성 ({작성자})
