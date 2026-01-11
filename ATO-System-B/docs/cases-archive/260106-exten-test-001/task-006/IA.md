# IA.md - 정보 구조

## 라우팅
- `/skills-dashboard`: Skills 대시보드 메인 페이지

## 페이지 계층
1. **SkillsDashboard Page**
   - 역할: 메인 대시보드
   - 하위 컴포넌트: `SkillCard`

2. **SkillCard Component**
   - 역할: 각 스킬에 대한 정보를 카드 형태로 표시
   - 포함 정보: Skill 이름, 버전, 상태

## 데이터 흐름
- **상위 컴포넌트**: `SkillsDashboard.tsx`
  - 하위 모듈로 `SkillCard.tsx`를 포함
  - Skills 데이터 전달