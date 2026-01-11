# SDD.md - 시스템 설계

## 1. 아키텍처 개요
- **UI Layer**: React 18+ 기반의 웹 UI
- **State Management**: 내장 React 상태 관리 활용
- **Styling**: TailwindCSS 기반 스타일링

## 2. 컴포넌트 구조

1. **SkillsDashboard.tsx**
   - 전체 대시보드 페이지를 구성하는 메인 컴포넌트
   - State: `skillsData` - Skills 정보를 포함

2. **SkillCard.tsx**
   - 개별 스킬 정보를 카드 형태로 표시하는 컴포넌트
   - Props: `name`, `version`, `status`

## 3. API 설계
- 현재 PRD에는 외부 API 의존 명시 없음

## 4. 데이터 흐름

- `SkillsDashboard.tsx`에서 `skillsData`가 초기화
- 각 `SkillCard` 컴포넌트에 props로 데이터 전달

## 5. 기술 스택 및 제약사항
- **React 18+ (Function Component, Hooks)**
- **TypeScript (strict 모드, any 사용 금지)**
- **TailwindCSS 스타일링**

## 6. 레거시 스키마 매핑
- PRD 상 레거시 DB 네트워크 없음. 신기능으로 현행 테이블과 무관

## 7. 유지보수 포인트
- Skills 데이터 변경 시 `SkillsDashboard.tsx` 내 `skillsData` 업데이트 필요