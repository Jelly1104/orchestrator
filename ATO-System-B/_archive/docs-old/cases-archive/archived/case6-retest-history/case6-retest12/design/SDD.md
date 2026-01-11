# System Design Document

## 1. Overview

활성 사용자 대시보드 시스템 설계

## 2. Data Model

### 2.1 Source Tables
- USERS (U_ID, U_KIND, U_ALIVE)
- USER_DETAIL (U_ID, U_MAJOR_CODE_1)

### 2.2 API Endpoints

```typescript
GET /api/analytics/users/summary
GET /api/analytics/users/distribution
GET /api/analytics/users/trend
```

## 3. Security

- SELECT only
- Row limit: 10,000
