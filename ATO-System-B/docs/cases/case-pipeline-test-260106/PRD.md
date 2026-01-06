# PRD: 파이프라인 실행 통합 테스트 (case-pipeline-test-260106)

| **Case ID** | case-pipeline-test-260106 |
| --- | --- |
| **Pipeline** | full |

## 1. 목적 (Objective)
단일 PRD로 분석 → 설계 → 구현(코드) 전체 파이프라인(full)을 검증한다.

## 2. 타겟 유저 (Target User)
- 내부 QA 엔지니어
- 시스템 운영자

## 3. 핵심 기능 (Core Features)
- A단계: 가입/로그인/활성도 데이터를 분석해 핵심 인사이트 3개 도출
- B단계: 분석 인사이트 기반 IA/Wireframe/SDD/HANDOFF 작성
- C단계: SDD/HANDOFF 기반 간단한 API 및 프론트 코드 생성 (모의 데이터 사용 가능)

## 4. 성공 지표 (Success Criteria)
- 분석 결과(쿼리, 표, 인사이트)가 `analysis/` 하위에 생성
- 설계 산출물(IA, Wireframe, SDD, HANDOFF)이 docs/cases 하위에 생성
- 코드 산출물(예: 간단한 API/프론트 컴포넌트) 또는 리포트가 생성
- 실행 로그가 `workspace/logs`에 기록

## 5. 산출물 체크리스트
- [ ] 가입/활성도 분석 SQL 2건 이상 (일/주/월 활성도)
- [ ] 인사이트 요약 리포트 (Markdown)
- [ ] IA 설계
- [ ] Wireframe
- [ ] SDD
- [ ] HANDOFF
- [ ] 간단한 API 혹은 UI 컴포넌트 코드 (목업/모의 데이터 OK)

## 6. 데이터 요구사항
- USERS 테이블: U_ID, U_KIND, U_REG_DATE
- USER_LOGIN 테이블: U_ID, LOGIN_DATE
- USER_DETAIL 테이블: U_ID, U_MAJOR_CODE_1

## 7. 제약사항
- SELECT only (데이터 수정 금지)
- 외부 API 연동 불필요, 모의 데이터/목업 허용
- 코드 생성 시 보안·비밀정보 미포함
