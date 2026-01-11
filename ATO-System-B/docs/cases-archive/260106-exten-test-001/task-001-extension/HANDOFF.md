# HANDOFF: Extension Skills 테스트 대시보드

| 항목           | 내용                                          |
| -------------- | --------------------------------------------- |
| **Case ID**    | ext-test-001                                  |
| **Task ID**    | task-001                                      |
| **PRD 버전**   | 1.0.0                                         |
| **작성일**     | 2026-01-06                                    |
| **파이프라인** | ui_mockup (Leader → Designer → Coder → ImLeader) |

---

## 1. PRD 요약

### 목적 (Objective)

Extension에서 Skills 호출 기능을 테스트하기 위해 **Skills 현황 대시보드 UI**를 설계하고 구현한다.

- **핵심 가치**: Skills 목록과 상태를 한눈에 볼 수 있는 대시보드 UI 제공

### 타겟 유저 (Target User)

| 항목              | 설명                                   |
| ----------------- | -------------------------------------- |
| **Persona**       | ATO 시스템 개발자/관리자               |
| **Pain Point**    | Skills 상태 파악이 어려움              |
| **Needs**         | Skills 목록과 버전을 한눈에 확인       |
| **사용 시나리오** | Extension에서 /designer, /coder 테스트 |

---

## 2. 핵심 기능 (Core Features)

| ID  | 기능명           | 설명                        | 검증 방법              | 담당 Skill |
| --- | ---------------- | --------------------------- | ---------------------- | ---------- |
| F1  | Skills 목록 표시 | 5개 Skills 카드 형태로 표시 | 화면에 5개 카드 렌더링 | designer   |
| F2  | 상태 뱃지        | active/inactive 상태 시각화 | 뱃지 색상 확인         | designer   |
| F3  | 버전 정보        | 각 Skill 버전 표시          | 버전 번호 표시 확인    | designer   |
| F4  | React 컴포넌트   | 설계 기반 컴포넌트 구현     | 브라우저 렌더링 성공   | coder      |

---

## 3. 성공 지표 (Success Criteria)

### 정량적 지표

| 지표        | 목표값   | 측정 방법                   |
| ----------- | -------- | --------------------------- |
| 컴포넌트 수 | 3개 이상 | 생성된 .tsx 파일 개수       |
| 빌드 성공   | 100%     | TypeScript 컴파일 에러 없음 |

### 정성적 지표

| 지표        | 판단 기준              |
| ----------- | ---------------------- |
| 설계 정합성 | IA→WF→코드 일관성 유지 |
| 코드 품질   | TypeScript strict 준수 |

---

## 4. 데이터 명세

### Skills 목록 (Static Data)

| Skill    | Version | Status | Description                     |
| -------- | ------- | ------ | ------------------------------- |
| query    | 1.3.0   | active | SQL 쿼리 생성 및 데이터 분석    |
| profiler | 1.3.0   | active | 회원 프로필 분석                |
| designer | 2.3.0   | active | IA/Wireframe/SDD 설계 문서 생성 |
| coder    | 1.4.0   | active | SDD 기반 코드 구현              |
| reviewer | 1.3.0   | active | 산출물 품질 검증                |

### 타입 정의 (TypeScript)

```typescript
interface Skill {
  name: string;
  version: string;
  status: "active" | "inactive";
  description: string;
}
```

---

## 5. 화면 요구사항

### 대시보드 레이아웃

```
┌─────────────────────────────────────────────────┐
│  Skills Dashboard                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Query   │ │Profiler │ │Designer │           │
│  │ v1.3.0  │ │ v1.3.0  │ │ v2.3.0  │           │
│  │ ●active │ │ ●active │ │ ●active │           │
│  └─────────┘ └─────────┘ └─────────┘           │
│                                                 │
│  ┌─────────┐ ┌─────────┐                       │
│  │ Coder   │ │Reviewer │                       │
│  │ v1.4.0  │ │ v1.3.0  │                       │
│  │ ●active │ │ ●active │                       │
│  └─────────┘ └─────────┘                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### UI 요구사항

| 요소        | 요구사항                              |
| ----------- | ------------------------------------- |
| 헤더        | "Skills Dashboard" 타이틀 표시        |
| 카드 레이아웃 | 그리드 형태, 반응형 (3열 → 2열 → 1열) |
| 카드 내용   | Skill 이름, 버전, 상태 뱃지, 설명     |
| 상태 뱃지   | active=초록색, inactive=회색          |

---

## 6. 기술 제약사항 (Constraints)

| 카테고리   | 항목        | 설명                       |
| ---------- | ----------- | -------------------------- |
| **기술**   | React 18+   | 함수형 컴포넌트, Hooks 사용 |
| **스타일** | TailwindCSS | inline style 금지          |
| **타입**   | TypeScript  | any 타입 금지, strict 모드 |

---

## 7. 산출물 경로

### 설계 문서

| 파일          | 경로                                           | 담당 Skill |
| ------------- | ---------------------------------------------- | ---------- |
| IA.md         | docs/cases/ext-test-001/task-001/IA.md         | designer   |
| Wireframe.md  | docs/cases/ext-test-001/task-001/Wireframe.md  | designer   |
| SDD.md        | docs/cases/ext-test-001/task-001/SDD.md        | designer   |

### 코드

| 파일                  | 경로                                              | 담당 Skill |
| --------------------- | ------------------------------------------------- | ---------- |
| SkillsDashboard.tsx   | frontend/src/features/skills-dashboard/           | coder      |
| SkillCard.tsx         | frontend/src/features/skills-dashboard/components/ | coder      |
| types.ts              | frontend/src/features/skills-dashboard/           | coder      |

---

## 8. 다음 단계 (Next Actions)

| 순서 | Skill    | 작업 내용                           | 입력              | 출력                     |
| ---- | -------- | ----------------------------------- | ----------------- | ------------------------ |
| 1    | designer | IA/Wireframe/SDD 설계 문서 생성     | 이 HANDOFF        | IA.md, Wireframe.md, SDD.md |
| 2    | coder    | SDD 기반 React 컴포넌트 구현        | SDD.md            | .tsx, types.ts           |
| 3    | imleader | 산출물 검증 (설계-코드 정합성 체크) | 전체 산출물       | PASS/FAIL                |

---

## 9. 검증 체크리스트

### Designer 산출물

- [ ] IA.md - 정보 구조 정의
- [ ] Wireframe.md - 화면 설계 (PRD 레이아웃 준수)
- [ ] SDD.md - 컴포넌트 명세, props 정의

### Coder 산출물

- [ ] types.ts - Skill 인터페이스 정의
- [ ] SkillCard.tsx - 개별 카드 컴포넌트
- [ ] SkillsDashboard.tsx - 메인 대시보드 컴포넌트
- [ ] TypeScript 컴파일 에러 없음

### 최종 검증 (ImLeader)

- [ ] 설계-코드 정합성 (IA→WF→SDD→코드 일관성)
- [ ] 기능 요구사항 충족 (F1~F4)
- [ ] 코드 품질 (TypeScript strict, TailwindCSS)

---

**END OF HANDOFF**
