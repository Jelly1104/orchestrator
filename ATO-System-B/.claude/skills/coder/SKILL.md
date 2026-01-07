---
name: coder
version: 3.0.0
description: |
  SDD 기반 코드 구현.
  트리거: "코드 구현", "API 개발", "컴포넌트 작성", "코드 생성".
  ⚠️ v3.0.0: 필수 문서 로딩 검증 단계 추가 - Phase 0 완료 후에만 Phase 1 진행 가능.
  ⚠️ 엔트리포인트 연결 및 구동 테스트 필수.
---

# Coder Skill (Extension용)

설계 문서 기반 코드 구현.

---

## ⚠️ 실행 프로토콜 (위반 시 산출물 무효)

### Phase 0: 문서 로딩 (필수) 🔴

> **이 단계를 건너뛰면 Phase 1로 진행할 수 없습니다.**

아래 문서를 **반드시 Read 도구로 읽고**, 각 문서의 핵심 내용을 요약 출력하세요.

#### 공통 로딩 (모든 Skill 필수)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| 시스템 헌법 | `CLAUDE.md` | 절대 금지 사항 1가지 |
| DB 스키마 | `.claude/rules/DOMAIN_SCHEMA.md` | 사용할 테이블 목록 |
| 기술 스택 | `.claude/project/PROJECT_STACK.md` | Frontend/Backend 스택 |
| 산출물 정의 | `.claude/workflows/DOCUMENT_PIPELINE.md` | Coder 산출물 목록 |

#### Role별 추가 로딩 (Coder 전용)

| 문서 | 경로 | 요약할 내용 |
|------|------|-------------|
| Role 정의 | `.claude/workflows/ROLES_DEFINITION.md` | Coder 섹션 - 역할/제약 |
| 코드 스타일 | `.claude/rules/CODE_STYLE.md` | 네이밍 규칙, 필수 조건 |
| TDD 워크플로우 | `.claude/rules/TDD_WORKFLOW.md` | Red-Green-Refactor |

### Phase 0 출력 (검증용) 🔴

**아래 형식으로 요약을 출력해야 Phase 1 진행 가능:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 [문서 로딩 확인]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[공통]
- CLAUDE.md: {절대 금지 사항 1가지}
- DOMAIN_SCHEMA.md: {사용할 테이블 n개}
- PROJECT_STACK.md: {Frontend/Backend 스택}
- DOCUMENT_PIPELINE.md: {Coder 산출물 목록}

[Coder 전용]
- ROLES_DEFINITION.md#Coder: {역할 1줄 요약}
- CODE_STYLE.md: {네이밍 규칙 요약}
- TDD_WORKFLOW.md: {TDD 사이클 요약}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> ⚠️ **위 출력이 없으면 Phase 1 Write가 무효 처리됩니다.**

---

### Phase 1: 입력 분석

- HANDOFF.md, SDD.md 읽기
- 구현 범위 파악

### Phase 2: 코드 구현

| 영역 | 산출물 |
|------|--------|
| **Backend** | API, Controller, Service |
| **Frontend** | 컴포넌트, Hooks, 타입 정의 |
| **Test** | 단위/통합 테스트 |

### Phase 3: 검증 및 보고서 출력

---

## 핵심 역할

| 영역 | 산출물 |
|------|--------|
| **Backend** | API, Controller, Service (스택 참조) |
| **Frontend** | 컴포넌트, Hooks, 타입 정의 (스택 참조) |
| **Test** | 단위/통합 테스트 (스택 참조) |

## 제약사항

| 제약 | 설명 |
|------|------|
| 설계 준수 | SDD 명세 정확히 따름, 임의 변경 금지 |
| PRD 직접 참조 금지 | SDD를 통해서만 요구사항 확인 |
| 보안 | SQL Injection, XSS 방지 필수 |
| 테스트 | 주요 함수/컴포넌트 테스트 코드 포함 |

---

## 완료 조건 ⚠️ 필수

> 코드 작성만으로 완료 아님. 아래 조건을 모두 충족해야 완료.

### 필수 체크리스트

- [ ] 컴포넌트/모듈 코드 작성 완료
- [ ] 타입 정의 파일 작성 완료
- [ ] **엔트리포인트 연결** (main.tsx에서 import/렌더링)
- [ ] **빌드 테스트 통과** (`npm run build` 또는 `tsc --noEmit`)
- [ ] **구동 테스트** (`npm run dev` 실행 후 렌더링 확인)

### 엔트리포인트 연결 가이드

```typescript
// main.tsx 수정 예시
import { NewComponent } from './features/new-feature'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NewComponent />  // ← 신규 컴포넌트 연결
  </React.StrictMode>,
)
```

> ⚠️ **중요**: SDD에 엔트리포인트 연결 가이드가 있으면 반드시 따를 것.

---

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Coder Skill Report]
🔧 사용된 Skill: coder v3.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Phase 0):
  - 공통: {n}/4개 ✅
  - Coder 전용: {n}/3개 ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 입력: {sdd_summary}
📤 출력: {n}개 파일 생성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Backend: {n}개 파일
✅ Frontend: {n}개 컴포넌트
✅ Tests: {n}개 테스트
✅ 타입체크: PASS
✅ 엔트리포인트: 연결됨 (main.tsx)
✅ 구동 테스트: PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
