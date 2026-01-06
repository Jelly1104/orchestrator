# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑
| PRD 체크리스트 항목 | 구현 방식 매핑 |
|---------------------|---------------|
| IA.md               | 정보 구조 문서 생성 |
| Wireframe.md        | 화면 설계 문서 생성 |
| SDD.md              | 시스템 설계 문서 생성 |
| SkillsDashboard.tsx | 메인 컴포넌트 구현 |
| SkillCard.tsx       | 카드 컴포넌트 구현 |

## Mode
Design

## Required Outputs
1. IA.md (정보 구조 문서)
2. Wireframe.md (화면 설계 문서)
3. SDD.md (기술 명세 문서)
4. SkillsDashboard.tsx (대시보드 메인 컴포넌트)
5. SkillCard.tsx (카드 컴포넌트)

## Input Documents
- DOMAIN_SCHEMA.md (.claude/rules/DOMAIN_SCHEMA.md)

## Completion Criteria
- 모든 컴포넌트와 문서는 PRD의 산출물 체크리스트에 명시된 항목과 일치
- TypeScript strict 모드 컴파일 에러 없음
- TailwindCSS를 활용한 스타일 적용

## Constraints
- React 18+ 함수형 컴포넌트 및 Hooks 사용
- TypeScript 사용 (any 타입 사용 금지)
- TailwindCSS 사용 (inline style 금지)