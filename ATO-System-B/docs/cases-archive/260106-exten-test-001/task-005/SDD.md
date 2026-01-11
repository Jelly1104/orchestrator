# SDD.md

> **생성일**: 2026-01-06T10:17:44.974Z
> **생성 도구**: DesignAgent v1.0.0

---

# System Design Document (SDD)

## 1. 시스템 개요

이 시스템은 사용자가 기술 목록을 관리하고, 각 기술의 상세 정보와 버전을 확인하며, 필요한 경우 기술 정보를 수정할 수 있는 웹 애플리케이션의 구조를 설계합니다. 아래는 전체 시스템의 아키텍처 다이어그램입니다.

```
+-------------------------------+
|         Client (Web UI)       |
|-------------------------------|
| - Dashboard                   |
| - Skills List                 |
| - Skill Detail                |
| - Skill Edit                  |
| - Settings                    |
+---------------v---------------+
                |
+---------------+---------------+
|            REST API           |
|-------------------------------|
| - Skills API                  |
| - Skill Detail API            |
| - Skill Update API            |
| - Settings API                |
+---------------v---------------+
                |
+---------------+---------------+
|       Database (RDBMS)        |
|-------------------------------|
| - Skills                      |
| - Users                       |
| - Settings                    |
+-------------------------------+
```

## 2. API 명세

### 2.1 Skills API

#### GET /api/skills

- Request:
  - Query: page, limit

- Response:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "name": "string",
        "status": "string",
        "version": "string"
      }
    ],
    "pagination": { "page": 1, "total": 100 }
  }
  ```

### 2.2 Skill Detail API

#### GET /api/skills/:skillId

- Request:
  - Params: skillId

- Response:
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "name": "string",
      "status": "string",
      "version": "string"
    }
  }
  ```

### 2.3 Skill Update API

#### PUT /api/skills/:skillId

- Request:
  - Params: skillId
  - Body: 
    ```json
    {
      "name": "string",
      "status": "string"
    }
    ```

- Response:
  ```json
  {
    "success": true,
    "message": "Skill updated successfully."
  }
  ```

### 2.4 Settings API

#### GET /api/settings

- Request: None

- Response:
  ```json
  {
    "success": true,
    "data": {
      "settings": {...}
    }
  }
  ```

## 3. 데이터 모델

### 3.1 Skills 엔티티

```sql
CREATE TABLE Skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL,
  version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.2 Users 엔티티

```sql
CREATE TABLE Users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Settings 엔티티

```sql
CREATE TABLE Settings (
  id INT PRIMARY KEY,
  key VARCHAR(50) NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 4. 에러 처리

### 4.1 에러 코드

- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

### 4.2 예외 처리 방식

서버에서 발생하는 모든 예외는 표준화된 JSON 형식으로 클라이언트에 전달됩니다. 예외 처리는 글로벌 예외 핸들러를 사용하여 관리합니다.

```json
{
  "success": false,
  "error": {
    "code": 500,
    "message": "Internal server error."
  }
}
```

## 5. 보안

### 5.1 인증/인가

- JWT (JSON Web Token) 기반의 인증 방식을 사용합니다.
- 모든 API 엔드포인트는 JWT 인증 헤더를 통해 사용자를 인증합니다.

### 5.2 민감 정보 처리

- 사용자 패스워드는 SHA-256 알고리즘을 사용하여 해시 저장합니다.
- TLS/SSL를 통해 모든 클라이언트-서버 통신을 암호화합니다.

## 6. 성능

### 6.1 캐싱

- Redis를 사용하여 DB 조회 결과를 캐싱하여 성능을 향상시킵니다.
- 캐시 만료 시간은 60초로 설정됩니다.

### 6.2 인덱싱

- 데이터베이스 쿼리 성능을 최적화하기 위해 Skills 테이블의 `name`과 `status` 칼럼에 인덱스를 생성합니다.

### 6.3 페이지네이션

- Skills 목록 API는 기본적으로 페이지네이션을 사용하여 쿼리 및 응답 성능을 향상시킵니다.

이 SDD는 시스템의 요구 사항과 역할을 완전히 지원하며, 각 섹션이 시스템의 다른 구성 요소와 잘 연동되도록 설계합니다.