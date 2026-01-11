# HANDOFF.md - Skill Dashboard (LITE Test)

> **생성일**: 2026-01-06
> **생성자**: Leader
> **Case ID**: 260106-lite-test
> **PRD 템플릿**: PRD_LITE (Leader 구체화 테스트)

---

## Pipeline

ui_mockup

## TargetRole

Designer → Coder

## TaskSummary

ATO 시스템의 7개 Skill 현황을 카드 형식으로 표시하는 React 대시보드 UI 구현.
각 Skill의 이름, 버전, 상태(active/inactive)를 시각화한다.

---

## Phases

### Phase B: Design (Designer)

**목표**: IA, Wireframe, SDD 설계 문서 생성

**Input**:
- docs/cases/260106-lite-test/HANDOFF.md (이 문서)
- .claude/templates/designer/IA_TEMPLATE.md
- .claude/templates/designer/WF_TEMPLATE.md
- .claude/templates/designer/SDD_TEMPLATE.md

**Output**:
- docs/cases/260106-lite-test/IA.md
- docs/cases/260106-lite-test/Wireframe.md
- docs/cases/260106-lite-test/SDD.md

**Constraints**:
- SDD에 **엔트리포인트 연결 섹션 (섹션 5)** 필수 포함
- TailwindCSS 클래스 사용 명세

**CompletionCriteria**:
- IA: 1개 화면 정의 (SkillsDashboardLite)
- Wireframe: ASCII 레이아웃 포함
- SDD: 엔트리포인트 연결 섹션 포함

### Phase C: Implementation (Coder)

**목표**: React 컴포넌트 및 타입 정의 구현

**Input**:
- docs/cases/260106-lite-test/HANDOFF.md
- docs/cases/260106-lite-test/SDD.md
- .claude/rules/CODE_STYLE.md

**Output**:
- frontend/src/features/skills-dashboard-lite/SkillsDashboardLite.tsx
- frontend/src/features/skills-dashboard-lite/types.ts
- frontend/src/features/skills-dashboard-lite/index.ts
- frontend/src/main.tsx (수정 - SkillsDashboardLite import 추가)

**Constraints**:
- TypeScript strict mode 필수
- TailwindCSS 클래스 사용 (inline style 금지)
- FSD 패턴 (features/ 디렉토리 구조)
- PRD 직접 참조 금지 (SDD만 참조)

**CompletionCriteria**:
- 빌드 성공 (`npm run build` 또는 `tsc --noEmit`)
- 타입체크 PASS
- **엔트리포인트 연결** (main.tsx에서 import/렌더링)
- **구동 테스트** (`npm run dev` 실행 후 렌더링 확인)

---

## UI 요구사항 (Leader 생성)

> ⚠️ **PRD_LITE에 없어서 Leader가 구체화한 항목**

### 레이아웃

```
+--------------------------------------------------+
|  Skill Dashboard                       [Refresh] |
+--------------------------------------------------+
|                                                  |
|  +----------+  +----------+  +----------+        |
|  | leader   |  | designer |  | coder    |        |
|  | v1.3.0   |  | v2.4.0   |  | v1.5.0   |        |
|  | ● active |  | ● active |  | ● active |        |
|  | PRD분석  |  | 설계생성 |  | 코드구현 |        |
|  +----------+  +----------+  +----------+        |
|                                                  |
|  +----------+  +----------+  +----------+        |
|  | reviewer |  | imleader |  | query    |        |
|  | v1.4.0   |  | v1.1.0   |  | v1.2.0   |        |
|  | ● active |  | ● active |  | ● active |        |
|  | 품질검증 |  | 구현검증 |  | SQL생성  |        |
|  +----------+  +----------+  +----------+        |
|                                                  |
|  +----------+                                    |
|  | profiler |                                    |
|  | v1.0.0   |                                    |
|  | ○ inactive                                    |
|  | 프로필   |                                    |
|  +----------+                                    |
|                                                  |
+--------------------------------------------------+
|  Total: 7 | Active: 6 | Inactive: 1              |
+--------------------------------------------------+
```

### 카드 구성요소

| 요소 | 내용 |
|------|------|
| 이름 | Skill name (예: leader) |
| 버전 | v{major}.{minor}.{patch} |
| 상태 | ● active (초록) / ○ inactive (회색) |
| 설명 | 짧은 설명 (1줄) |

### 스타일 요구사항

| 요소 | 스펙 |
|------|------|
| 카드 배경 | 흰색, 그림자 효과 |
| Active 상태 | 초록색 (bg-green-500) |
| Inactive 상태 | 회색 (bg-gray-400) |
| 레이아웃 | CSS Grid (3열, 반응형) |
| 스타일링 | TailwindCSS 클래스 필수 |

---

## Mock 데이터 (Leader 생성)

> ⚠️ **PRD_LITE에 7개 Skill 이름만 있어서 Leader가 상세 구조 정의**

```typescript
interface Skill {
  name: string;
  version: string;
  status: 'active' | 'inactive';
  description: string;
}

const SKILLS_DATA: Skill[] = [
  { name: 'leader', version: '1.3.0', status: 'active', description: 'PRD 분석, HANDOFF 생성' },
  { name: 'designer', version: '2.4.0', status: 'active', description: 'IA/Wireframe/SDD 생성' },
  { name: 'coder', version: '1.5.0', status: 'active', description: 'SDD 기반 코드 구현' },
  { name: 'reviewer', version: '1.4.0', status: 'active', description: '품질 검증' },
  { name: 'imleader', version: '1.1.0', status: 'active', description: '구현 검증' },
  { name: 'query', version: '1.2.0', status: 'active', description: 'SQL 쿼리 생성' },
  { name: 'profiler', version: '1.0.0', status: 'inactive', description: '프로필 분석' },
];
```

---

## HITL 체크포인트

| Phase | 체크포인트 | 승인 조건 |
|-------|-----------|----------|
| B 완료 | 설계 검증 | IA/Wireframe/SDD 완성, 엔트리포인트 포함 |
| C 완료 | **동적 검증** | 빌드 성공, 엔트리포인트 연결, 구동 확인 |

---

## Leader 구체화 항목 요약

| 항목 | PRD_LITE 제공 | Leader 생성 |
|------|--------------|-------------|
| ASCII 레이아웃 | ❌ | ✅ (위 레이아웃) |
| Mock 데이터 구조 | 이름만 | ✅ (interface + 전체 데이터) |
| 카드 구성요소 | ❌ | ✅ (4가지 요소 정의) |
| 스타일 스펙 | TailwindCSS만 언급 | ✅ (색상, Grid 상세) |
| 버전 정보 | ❌ | ✅ (각 Skill별 버전) |

---

**END OF HANDOFF.md**
