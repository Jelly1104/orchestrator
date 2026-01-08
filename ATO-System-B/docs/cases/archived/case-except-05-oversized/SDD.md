# SDD.md - 시스템 설계

## 1. 아키텍처 개요
- 백엔드: Node.js, Nest.js
- 프론트엔드: React, Next.js
- 데이터베이스: PostgreSQL
- 상태 관리: Redux / SWR

## 2. 레거시 스키마 매핑
- **회원 정보**: `USERS` (U_ID, U_EMAIL 등)
- **게시글**: `BOARD_MUZZIMA` 및 댓글은 `COMMENT` 테이블

## 3. 데이터 모델 변경
- [ ] 기존 테이블 컬럼 추가 필요?: 없음 (기존 스키마 활용)
- [ ] 신규 테이블 생성 필요?: 교육, 마케팅 관련 추가 테이블 [⚠️ AI 추론됨 - 검토 필요]

## 4. API 설계 (Draft)
### 4.1 회원 시스템
- POST /api/v1/members/signup
- POST /api/v1/members/login

### 4.2 게시판 시스템
- GET /api/v1/community/posts
- POST /api/v1/community/posts

### 4.3 채용 시스템
- POST /api/v1/jobs
- GET /api/v1/jobs/{job_id}

## 5. 비즈니스 로직
- 회원 등급 변경 요건: 포인트 기준 시스템
- 자동 알림: 회원 인증과 채용 공고 연계

## 6. 보안 및 인증
- OAuth 2.0 인증 처리
- JWT 기반 세션 관리