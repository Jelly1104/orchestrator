# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑
| PRD 항목 | 구현 방식 |
| --- | --- |
| 가입/활성도 분석 SQL | USERS, USER_LOGIN 테이블의 SELECT 쿼리 작성 |
| 인사이트 요약 리포트 | 분석 결과 요약하여 markdown 파일 생성 |
| IA 설계 | 정보 구조 문서(IA.md) 작성 |
| Wireframe | 화면 설계 문서(Wireframe.md) 작성 |
| SDD | 시스템 설계 문서(SDD.md) 작성 |
| HANDOFF | 작업 지시서 이 문서(HANDOFF.md) 작성 |
| API/UI 컴포넌트 코드 | 간단한 API 및 프론트 코드 작성 |

## Mode
Full Pipeline

## Required Outputs
- SQL 쿼리 파일: 활성도 분석 (일/주/월)
- 분석 인사이트 리포트 (Markdown)
- 설계 문서: IA, Wireframe, SDD, HANDOFF
- 간단한 모의 데이터 기반 API/UI 컴포넌트 코드

## Input Documents
- PRD 내용 (위 규격 참고)
- .claude/rules/DOMAIN_SCHEMA.md

## Completion Criteria
- 문서 및 코드가 각각의 지정된 디렉토리에 존재
- 모든 산출물이 PRD 성공 지표를 충족하며 제대로 작동

## Constraints
- 데이터베이스 접근 시 SELECT 문만 사용
- 외부 API와의 통신 절대 금지