# SDD.md - 시스템 설계

## 1. API 설계
- 엔드포인트: `GET /api/v1/user/insights`
  - 설명: 사용자 가입 및 로그인 활성도 인사이트 제공
  - 요청 파라미터: 없음
  - 응답 데이터: JSON 형식 (인사이트 요약 포함)

## 2. 데이터 흐름
- 사용자 가입 및 로그인 데이터를 분석하여 인사이트를 도출
- USERS, USER_LOGIN, USER_DETAIL 테이블을 쿼리하여 데이터 수집

## 3. 레거시 스키마 매핑
- 기본 테이블:
  - USERS: U_ID, U_KIND, U_REG_DATE
  - USER_LOGIN: U_ID, LOGIN_DATE
  - USER_DETAIL: U_ID, U_MAJOR_CODE_1

## 4. 제약사항 및 주의사항
- SELECT 쿼리만 허용 (데이터 수정 금지)
- 외부 API 연동 불필요, 모의 데이터 테스트 허용
- 보안 및 비밀정보 포함 금지