# PRD: Skill Dashboard - 파이프라인 테스트용

> **대상**: Leader, Designer, Coder

| 항목          | 내용                                                |
| ------------- | --------------------------------------------------- |
| **Case ID**   | case-pipeline-test-260106                           |
| **PRD 버전**  | 1.0.0                                               |
| **작성일**    | 2026-01-06                                          |
| **작성자**    | ATO Team                                            |
| **Pipeline**  | ui_mockup                                           |
| **참조 문서** | PRD_GUIDE.md, SDD_TEMPLATE.md                       |

---

## 1. 목적 (Objective)

ATO 시스템의 Skill 현황을 한눈에 파악할 수 있는 대시보드 UI를 구현한다.
현재 등록된 Skill 목록, 버전, 상태를 카드 형식으로 표시하고,
각 Skill의 상세 정보를 확인할 수 있는 인터페이스를 제공한다.

> **요약**: "Skill 목록을 카드 형식으로 표시하는 React 대시보드 구현"

---

## 2. 타겟 유저 (Target User)

| 항목              | 설명                                      |
| ----------------- | ----------------------------------------- |
| **Persona**       | ATO 시스템 관리자, 개발자                 |
| **Pain Point**    | Skill 현황을 파악하기 위해 파일을 직접 확인해야 함 |
| **Needs**         | 등록된 Skill 목록과 상태를 빠르게 파악    |
| **사용 시나리오** | 개발/운영 중 Skill 현황 모니터링          |

---

## 3. 핵심 기능 (Core Features)

| ID  | Phase | 기능명           | 설명                                        | 검증 방법                    |
| --- | ----- | ---------------- | ------------------------------------------- | ---------------------------- |
| F1  | B     | Skill 카드 레이아웃 | Skill 정보를 카드 형식으로 배치              | Wireframe 검증               |
| F2  | B     | 상태 표시        | active/inactive 상태를 색상으로 구분         | SDD 명세 확인                |
| F3  | C     | React 컴포넌트   | TailwindCSS 기반 카드 컴포넌트 구현          | `npm run build` 성공         |
| F4  | C     | 타입 정의        | Skill 데이터 타입 정의                       | `tsc --noEmit` 성공          |
| F5  | C     | 엔트리포인트 연결 | main.tsx에서 SkillsDashboard 렌더링         | 브라우저 렌더링 확인         |

---

## 4. 성공 지표 (Success Criteria)

### 4.1 설계 검증 (Phase B)

| 지표             | 목표값    | 측정 방법            |
| ---------------- | --------- | -------------------- |
| IA 화면 정의     | 1개 화면  | IA.md 검토           |
| Wireframe 완성도 | 100%      | ASCII 레이아웃 검토  |
| SDD 완성도       | 100%      | 엔트리포인트 섹션 포함 |

### 4.2 구현 검증 (Phase C) - 동적 검증 필수

| 지표                 | 목표값    | 측정 방법                    |
| -------------------- | --------- | ---------------------------- |
| TypeScript 컴파일    | PASS      | `tsc --noEmit`               |
| **빌드 테스트**      | PASS      | `npm run build`              |
| **엔트리포인트 연결** | 확인됨    | main.tsx import 검증         |
| **구동 테스트**      | PASS      | `npm run dev` 후 렌더링 확인 |

---

## 5. PRD 유형 및 파이프라인

```yaml
pipeline: ui_mockup
rationale: "분석(Phase A) 없이 설계(Phase B) → 구현(Phase C) 진행. 정적 데이터 기반 UI 구현."

phases:
  - id: B
    name: Design
    input: PRD
    output: IA.md, Wireframe.md, SDD.md (엔트리포인트 섹션 필수)

  - id: C
    name: Implementation
    input: HANDOFF.md + SDD.md
    output:
      - React 컴포넌트
      - TypeScript 타입 정의
      - 엔트리포인트 연결 (main.tsx)
```

---

## 6. 데이터 요구사항 (Data Requirements)

### 6.1 Mock 데이터 (정적)

```typescript
const SKILLS_DATA = [
  { name: 'leader', version: '1.3.0', status: 'active', description: 'PRD 분석, HANDOFF 생성' },
  { name: 'designer', version: '2.4.0', status: 'active', description: 'IA/Wireframe/SDD 생성' },
  { name: 'coder', version: '1.5.0', status: 'active', description: 'SDD 기반 코드 구현' },
  { name: 'reviewer', version: '1.4.0', status: 'active', description: '품질 검증' },
  { name: 'imleader', version: '1.1.0', status: 'active', description: '구현 검증' },
  { name: 'query', version: '1.2.0', status: 'active', description: 'SQL 쿼리 생성' },
  { name: 'profiler', version: '1.0.0', status: 'inactive', description: '프로필 분석' },
];
```

> **DB 연동 없음**: 이 PRD는 정적 데이터 기반 UI 테스트용입니다.

---

## 7. UI 요구사항

### 7.1 레이아웃

```
+--------------------------------------------------+
|  🔧 Skill Dashboard                    [Refresh] |
+--------------------------------------------------+
|                                                  |
|  +----------+  +----------+  +----------+        |
|  | leader   |  | designer |  | coder    |        |
|  | v1.3.0   |  | v2.4.0   |  | v1.5.0   |        |
|  | ● active |  | ● active |  | ● active |        |
|  +----------+  +----------+  +----------+        |
|                                                  |
|  +----------+  +----------+  +----------+        |
|  | reviewer |  | imleader |  | query    |        |
|  | v1.4.0   |  | v1.1.0   |  | v1.2.0   |        |
|  | ● active |  | ● active |  | ● active |        |
|  +----------+  +----------+  +----------+        |
|                                                  |
|  +----------+                                    |
|  | profiler |                                    |
|  | v1.0.0   |                                    |
|  | ○ inactive|                                   |
|  +----------+                                    |
|                                                  |
+--------------------------------------------------+
|  Total: 7 Skills | Active: 6 | Inactive: 1       |
+--------------------------------------------------+
```

### 7.2 스타일 요구사항

| 요소           | 스펙                           |
| -------------- | ------------------------------ |
| 카드 배경      | 흰색, 그림자 효과              |
| Active 상태    | 초록색 dot (●)                 |
| Inactive 상태  | 회색 dot (○)                   |
| 폰트           | 시스템 기본 sans-serif         |
| 레이아웃       | CSS Grid (3열)                 |
| 스타일링       | **TailwindCSS 클래스 필수**    |

---

## 8. 산출물 체크리스트 (Deliverables)

### Phase B (Design) - Designer

```yaml
deliverables:
  - name: "IA.md"
    criteria:
      - 1개 화면 정의 (SkillsDashboard)
      - 화면 계층 구조 포함

  - name: "Wireframe.md"
    criteria:
      - ASCII 레이아웃 포함
      - 컴포넌트 목록 정의
      - 인터랙션 명세

  - name: "SDD.md"
    criteria:
      - 컴포넌트 구조 정의
      - 타입 정의
      - **엔트리포인트 연결 섹션 필수** (섹션 5)
```

### Phase C (Implementation) - Coder

```yaml
deliverables:
  - name: "SkillsDashboard.tsx"
    location: "frontend/src/features/skills-dashboard/"
    criteria:
      - TypeScript strict mode
      - TailwindCSS 클래스 사용
      - Props 타입 정의

  - name: "types.ts"
    location: "frontend/src/features/skills-dashboard/"
    criteria:
      - Skill 인터페이스 정의
      - Status 타입 정의

  - name: "main.tsx 수정"
    location: "frontend/src/main.tsx"
    criteria:
      - SkillsDashboard import 추가
      - 렌더링 코드 추가

completion_criteria:
  - npm run build 성공
  - npm run dev 후 브라우저 렌더링 확인
  - 엔트리포인트 연결 확인
```

---

## 9. 제약사항 (Constraints)

| 카테고리     | 항목              | 설명                              |
| ------------ | ----------------- | --------------------------------- |
| **기술**     | React + TypeScript | strict mode 필수                  |
| **스타일**   | TailwindCSS       | inline style 금지                 |
| **구조**     | FSD 패턴          | features/ 디렉토리 구조           |
| **검증**     | 동적 검증 필수    | 빌드/구동 테스트 필수             |

---

## 10. HITL 체크포인트

| Phase  | 체크포인트        | 승인 조건                              | 실패 시         |
| ------ | ----------------- | -------------------------------------- | --------------- |
| B 완료 | 설계 검증         | IA/Wireframe/SDD 완성, 엔트리포인트 포함 | 설계 수정       |
| C 완료 | **동적 검증**     | 빌드 성공, 엔트리포인트 연결, 구동 확인 | 코드 수정       |

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                          |
| ----- | ---------- | ---------------------------------- |
| 1.0.0 | 2026-01-06 | ui_mockup 파이프라인 테스트용 초안 |

---

**END OF PRD**
