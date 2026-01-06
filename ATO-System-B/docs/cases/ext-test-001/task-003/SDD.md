# SDD.md

> **생성일**: 2026-01-06T09:32:44.929Z
> **생성 도구**: DesignAgent v1.0.0

---

# 시스템 설계 문서 (SDD)

## 1. 시스템 개요

### 아키텍처 다이어그램
```
+-----------------+     +-------------------+     +-----------------+
| Client (Web/App)| <-> |  API Gateway      | <-> | Skills Service   |
+-----------------+     +-------------------+     +-----------------+
                                                           |
                                                           |
                                                 +-----------------+
                                                 | Database        |
                                                 +-----------------+
```
- **Client**: 사용자 인터페이스, 웹 및 앱
- **API Gateway**: API 요청 수신 및 라우팅
- **Skills Service**: Skills 관련 정보 처리, 데이터 공급
- **Database**: Skills 및 설정 데이터 저장소

## 2. API 명세

### Skills 목록 조회
```
GET /api/skills/list

Request:
- Query: page, limit, filter

Response:
```json
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "total": 100 }
}
```

### Skill 상세 정보 조회
```
GET /api/skills/details/:id

Request:
- Params: id

Response:
```json
{
  "success": true,
  "data": {
    "skill_name": "Skill Name",
    "details": "...",
    "status": "...",
    "version": "..."
  }
}
```

### Skills 카테고리 목록 조회
```
GET /api/skills/categories

Request:
- Query: none

Response:
```json
{
  "success": true,
  "data": [...]
}
```

### 사용자 설정 및 Preferences 조회
```
GET /api/skills/settings

Request:
- Query: none

Response:
```json
{
  "success": true,
  "data": {
    "preferences": {...}
  }
}
```

## 3. 데이터 모델

### Skill 엔티티
```sql
CREATE TABLE Skills (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    details TEXT,
    status VARCHAR(50),
    version VARCHAR(50)
);
```

### Skill 카테고리 엔티티
```sql
CREATE TABLE SkillCategories (
    id INT PRIMARY KEY,
    name VARCHAR(255)
);
```

### 사용자 설정 엔티티
```sql
CREATE TABLE UserSettings (
    user_id INT PRIMARY KEY,
    preferences JSONB
);
```

## 4. 에러 처리

### 에러 코드
- `400`: 잘못된 요청
- `401`: 인증 실패
- `404`: 리소스 미발견
- `500`: 서버 오류

### 예외 처리 방식
- 입력 검증 실패 시 `400` 오류 반환
- 인증 실패 시 `401` 오류 반환
- 잘못된 엔드포인트 요청 시 `404` 오류 반환
- 서버 오류 발생 시 `500` 오류 반환과 로그 기록

## 5. 보안

### 인증/인가
- OAuth2.0 기반 토큰 인증
- 각 API 요청 시 사용자 인증 필요

### 민감 정보 처리
- 데이터 전송 시 HTTPS 사용
- 데이터베이스에 민감 정보 저장 시 암호화 적용

## 6. 성능

### 캐싱
- Skills 목록 및 카테고리 목록 캐싱 적용

### 인덱싱
- `Skills`, `SkillCategories` 테이블의 자주 조회되는 열에 인덱스 생성

### 페이지네이션
- Skills 목록 조회 시 페이지네이션 적용 (기본 페이지 크기 10)