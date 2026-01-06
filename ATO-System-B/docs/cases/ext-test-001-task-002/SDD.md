# SDD.md - 시스템 설계

## 1. 아키텍처 개요
- 기술 스택: React 18, TypeScript, TailwindCSS
- 사용 모듈: useState, useEffect(Hooks)

## 2. 데이터 모델
- **Skill 데이터 모델**
  ```typescript
  interface Skill {
    name: string;
    version: string;
    status: "active" | "inactive";
    description: string;
  }
  ```

## 3. 컴포넌트 설계
### SkillsDashboard.tsx
- skills 데이터를 `SkillCard` 컴포넌트로 전달
- 데이터를 받아서 `SkillCard`의 리스트로 렌더링

### SkillCard.tsx
- Props: `name`, `version`, `status`
- 각 상태에 대한 스타일 적용: `status`에 따라 배경 색상 정의

## 4. API 통합 계획 (Draft)
- 현재 단계에서는 API 연결 없이 로컬 JSON 데이터 사용

## 5. 기술 및 제약사항
- **타입스크립트 엄격 모드**
  - `any` 타입 사용 금지
  - 모든 변수 및 함수에 타입 명시

## 6. 레거시 스키마 매핑
- 레거시 데이터베이스와 직접적인 연결 없음, JSON 데이터 사용