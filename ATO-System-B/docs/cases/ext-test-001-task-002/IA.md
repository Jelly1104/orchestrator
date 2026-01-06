# IA.md - 정보 구조

## 대시보드 정보 구조

### 라우팅 및 페이지 계층
- **메인 페이지**: `/skills-dashboard`
  - 기능: Skills 상태를 카드 형태로 한눈에 보여주는 대시보드
  - 서브 컴포넌트: `SkillCard`

### 컴포넌트 계층 구조
1. `SkillsDashboard.tsx`
   - 역할: 대시보드의 메인 컴포넌트로, 여러 `SkillCard` 컴포넌트를 포함
   - 포함 컴포넌트: `SkillCard`
   
2. `SkillCard.tsx`
   - 역할: 각 Skill의 상태, 버전 등 정보를 카드 형태로 나타냄

### 데이터 플로우
- JSON 형태의 Skills 데이터 로딩
- 각 Skill 데이터를 `SkillCard` 컴포넌트로 전달하여 표시

## 사용자 인터랙션 및 흐름
1. **대시보드 로딩**
   - API 또는 JSON 파일을 통해 Skills 데이터 로드
2. **SkillCard 생성**
   - 로드된 데이터를 바탕으로 각 Skill 상태, 버전 등이 포함된 카드 표시