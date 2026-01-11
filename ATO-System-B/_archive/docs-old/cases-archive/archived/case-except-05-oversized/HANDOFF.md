# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑
- **회원가입 플로우 재설계** → `/sign-up` 경로 구현
- **로그인 시스템** → `/login` 경로, OAuth 2.0 방식
- **게시판 CRUD** → `/community/board` 경로 CRUD 기능 구현
- **채용공고 등록/수정/삭제** → `/jobs` 경로 CRUD 기능 구현

## Mode
[Design, Coding]

## Required Outputs
- IA.md: 페이지 라우팅 및 계층
- Wireframe.md: UI 컴포넌트 배치 및 데이터 매핑
- SDD.md: API 설계 및 데이터 흐름
- 구현된 코드 (Redux 또는 Context API 사용)

## Input Documents
- DOMAIN_SCHEMA.md
- DOCUMENT_PIPELINE.md

## Completion Criteria
- 각 핵심 기능 PRD에 맞게 설계 및 구현
- 기능성 테스트 통과
- 사용자 플로우 매끄러움 확인

## Constraints
- PostgreSQL 및 Redis 사용
- AWS / GCP 멀티 클라우드 호환성