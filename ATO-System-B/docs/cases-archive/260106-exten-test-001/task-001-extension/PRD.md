# PRD: Extension Skills 테스트 대시보드

| 항목          | 내용                |
| ------------- | ------------------- |
| **Case ID**   | ext-test-001        |
| **PRD 버전**  | 1.0.0               |
| **작성일**    | 2026-01-06          |
| **작성자**    | ATO Team            |
| **참조 문서** | DOMAIN_SCHEMA.md    |

---

## Skills 연동 (Extension용)

> Extension에서 경량 Orchestrator 실행 시 사용할 Skills 정의

```yaml
# ui_mockup 파이프라인: Leader → B → C → ImLeader
skills:
  - leader          # PRD 분석, HANDOFF 생성
  - designer        # IA/Wireframe/SDD 설계
  - coder           # 코드 구현
  - imleader        # 산출물 검증

# 입력 파일 (Skills가 참조할 문서)
input:
  schema: .claude/rules/DOMAIN_SCHEMA.md

# 출력 경로 (Skills 산출물 저장 위치)
output:
  handoff: docs/cases/ext-test-001/task-002/HANDOFF.md
  design: docs/cases/ext-test-001/task-002/
  code:
    frontend: frontend/src/features/skills-dashboard-task-002/

### 오케스트레이터 실행 시 주의
- 기존 Claude Code 확장 산출물: `docs/cases/ext-test-001/task-001/`
- 오케스트레이터 산출물 격리: `--task-id "ext-test-001/task-002"`로 실행하면 위 출력 경로에 저장됩니다.
```

### Skills 개별 실행 예시

```bash
# Extension에서 슬래시 커맨드로 순차 실행
/leader         # PRD 분석 → HANDOFF 생성
/designer       # IA/Wireframe/SDD 설계
/coder          # React 컴포넌트 구현
/imleader       # 산출물 검증 (PASS/FAIL)
```

---

## 목적 (Objective)

Extension에서 Skills 호출 기능을 테스트하기 위해 간단한 Skills 현황 대시보드 UI를 설계하고 구현한다.

> **요약**: "Skills 목록과 상태를 한눈에 볼 수 있는 대시보드 UI 구현"

---

## 타겟 유저 (Target User)

| 항목              | 설명                                  |
| ----------------- | ------------------------------------- |
| **Persona**       | ATO 시스템 개발자/관리자              |
| **Pain Point**    | Skills 상태 파악이 어려움             |
| **Needs**         | Skills 목록과 버전을 한눈에 확인      |
| **사용 시나리오** | Extension에서 /designer, /coder 테스트 |

---

## 핵심 기능 (Core Features)

| ID  | 기능명           | 설명                              | 검증 방법               | Skill    |
| --- | ---------------- | --------------------------------- | ----------------------- | -------- |
| F1  | Skills 목록 표시 | 5개 Skills 카드 형태로 표시       | 화면에 5개 카드 렌더링  | designer |
| F2  | 상태 뱃지        | active/inactive 상태 시각화       | 뱃지 색상 확인          | designer |
| F3  | 버전 정보        | 각 Skill 버전 표시                | 버전 번호 표시 확인     | designer |
| F4  | React 컴포넌트   | 설계 기반 컴포넌트 구현           | 브라우저 렌더링 성공    | coder    |

---

## 성공 지표 (Success Criteria)

### 정량적 지표

| 지표           | 목표값   | 측정 방법                   |
| -------------- | -------- | --------------------------- |
| 컴포넌트 수    | 3개 이상 | 생성된 .tsx 파일 개수       |
| 빌드 성공      | 100%     | TypeScript 컴파일 에러 없음 |

### 정성적 지표

| 지표           | 판단 기준                     |
| -------------- | ----------------------------- |
| 설계 정합성    | IA→WF→코드 일관성 유지        |
| 코드 품질      | TypeScript strict 준수        |

---

## 화면 요구사항

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

### Skills 데이터

| Skill    | Version | Status | Description                    |
|----------|---------|--------|--------------------------------|
| query    | 1.3.0   | active | SQL 쿼리 생성 및 데이터 분석   |
| profiler | 1.3.0   | active | 회원 프로필 분석               |
| designer | 2.3.0   | active | IA/Wireframe/SDD 설계 문서 생성 |
| coder    | 1.4.0   | active | SDD 기반 코드 구현             |
| reviewer | 1.3.0   | active | 산출물 품질 검증               |

---

## 제약사항 (Constraints)

| 카테고리   | 항목           | 설명                          |
| ---------- | -------------- | ----------------------------- |
| **기술**   | React 18+      | 함수형 컴포넌트, Hooks 사용   |
| **스타일** | TailwindCSS    | inline style 금지             |
| **타입**   | TypeScript     | any 타입 금지, strict 모드    |

---

## 산출물 체크리스트 (Deliverables)

- [ ] IA.md (정보 구조 문서)
- [ ] Wireframe.md (화면 설계 문서)
- [ ] SDD.md (기술 명세 문서)
- [ ] SkillsDashboard.tsx (메인 컴포넌트)
- [ ] SkillCard.tsx (카드 컴포넌트)
- [ ] types.ts (타입 정의)

---

**END OF PRD**
