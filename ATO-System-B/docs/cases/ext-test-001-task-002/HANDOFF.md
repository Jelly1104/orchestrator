# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑
| PRD 항목            | 구현 방식                       |
|---------------------|--------------------------------|
| IA.md               | 정보 구조 문서로 대체            |
| Wireframe.md        | 화면 설계 문서로 대체            |
| SDD.md              | 시스템 설계 문서로 대체          |
| SkillsDashboard.tsx | 메인 대시보드 컴포넌트            |
| SkillCard.tsx       | 개별 스킬 카드 컴포넌트          |
| types.ts            | 타입 정의 컴포넌트               |

## Mode
UI Mockup

## Required Outputs
- IA.md
- Wireframe.md
- SDD.md
- SkillsDashboard.tsx
- SkillCard.tsx

## Input Documents
- .claude/rules/DOMAIN_SCHEMA.md: 레거시 시스템 구조 (해당 없음)
- PRD: Extension Skills 테스트 대시보드

## Completion Criteria
- 대시보드 컴포넌트 화면에 5개 카드 정상 출력
- 카드별 라운드 선택 및 상황 변경 가능
- 타입스크립트 컴파일 에러 없음

## Constraints
- React 18+ 사용
- TailwindCSS 스타일 적용
- any 타입 사용 금지, strict mode 적용