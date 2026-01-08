---
name: coder
version: 3.2.0
description: |
  SDD 기반 코드 구현.
  트리거: "코드 구현", "API 개발", "컴포넌트 작성", "코드 생성".
  🔴 필수: 실행 전 이 SKILL.md 파일 전체를 Read 도구로 읽고 Step 라우팅 규칙에 따라 진행할 것.
  ⚠️ 엔트리포인트 연결 및 구동 테스트 필수.
allowed-tools: Read, Grep, Glob
---

# Coder Skill (Extension용)

설계 문서 기반 코드 구현.

---

## 파이프라인 위치

**호출 여부 판단**:
1. HANDOFF.md의 `pipeline` 필드 확인
2. `code`, `ui_mockup`, `full` 중 하나인가?
3. SDD.md 존재 여부 확인

> **상세 파이프라인 흐름**: `.claude/workflows/ROLE_ARCHITECTURE.md` - 파이프라인 타입 섹션 참조

---

## Step 라우팅 규칙 🔴

> **Step 0은 항상 필수**. 이후 Step은 순서대로 진행.
> **참고**: Pipeline Phase (A/B/C)와 Skill 내부 Step은 별개 개념입니다.

| 호출 시점 | 진입 Step | 설명 |
|-----------|-----------|------|
| Phase C 시작 | Step 0 → 1 → 2 → 3 | 코드 구현, 엔트리포인트 연결 |

---

## ⚠️ 실행 프로토콜 (위반 시 산출물 무효)

### Step 0: 문서 참조 (필수) 🔴

> **전체 문서 읽기 금지** - 해당 섹션만 선택적 Read

#### 참조 디렉토리 구조

```
.claude/
├── SYSTEM_MANIFEST.md              # Quick Context, Role별 필수 로딩
├── rules/
│   ├── DOMAIN_SCHEMA.md            # 핵심 레거시 스키마, 개념-물리 매핑
│   ├── CODE_STYLE.md               # 공통 원칙, 네이밍 컨벤션
│   └── TDD_WORKFLOW.md             # Red-Green-Refactor, 품질 게이트
├── workflows/
│   ├── ROLES_DEFINITION.md         # Coder 섹션만
│   └── DOCUMENT_PIPELINE.md        # 파이프라인 타입별 산출물
└── project/
    └── PROJECT_STACK.md            # 기술 스택
```

#### 확인 체크리스트

- [ ] `SYSTEM_MANIFEST.md` → Quick Context, Role별 필수 로딩
- [ ] `DOMAIN_SCHEMA.md` → 핵심 레거시 스키마, 개념-물리 매핑
- [ ] `PROJECT_STACK.md` → 기술 스택
- [ ] `DOCUMENT_PIPELINE.md` → 파이프라인 타입별 산출물
- [ ] `ROLES_DEFINITION.md` → Coder 섹션
- [ ] `CODE_STYLE.md` → 공통 원칙, 네이밍 컨벤션
- [ ] `TDD_WORKFLOW.md` → Red-Green-Refactor, 품질 게이트

> **참조 가이드**: `docs/reports/Role-reference-guide.md`

---

### Step 1: 입력 분석

- HANDOFF.md, SDD.md 읽기
- 구현 범위 파악

### Step 2: 코드 구현 및 데이터 재현

| 영역 | 산출물 | 비고 |
|------|--------|------|
| **Fixture** (New) | `src/mocks/handlers.ts` 또는 `fixtures/*.json` | **필수 선행:** `DOMAIN_SCHEMA.md`와 동일한 구조의 Mock 데이터 생성 |
| **Backend** | API, Controller, Service | Real DB 연결 로직은 환경변수(`USE_MOCK=true`)로 분기 처리 |
| **Frontend** | 컴포넌트, Hooks, 타입 정의 | API 호출 실패 시 Fixture Fallback 구현 |
| **Test** | 단위/통합 테스트 | Fixture 기반 테스트 작성 |

### Step 3: 검증 및 보고서 출력

- 엔트리포인트 연결
- 빌드 테스트
- Fixture 기반 구동 테스트

---

## 핵심 역할

| 영역 | 산출물 |
|------|--------|
| **Fixture** | Schema-Compliant Fixture (스택 참조) |
| **Backend** | API, Controller, Service (스택 참조) |
| **Frontend** | 컴포넌트, Hooks, 타입 정의 (스택 참조) |
| **Test** | 단위/통합 테스트 (스택 참조) |

## 제약사항

| 제약 | 설명 |
|------|------|
| 설계 준수 | SDD 명세 정확히 따름, 임의 변경 금지 |
| PRD 직접 참조 금지 | SDD를 통해서만 요구사항 확인 |
| 보안 | SQL Injection, XSS 방지 필수 |
| 데이터 소스 | Real DB 연결 금지 (Phase C). UI는 `DOMAIN_SCHEMA.md` 구조를 따르는 Fixture로 렌더링 |
| 테스트 | 주요 함수/컴포넌트 테스트 코드 포함 |

---

## 완료 조건 ⚠️ 필수

> 코드 작성만으로 완료 아님. 아래 조건을 모두 충족해야 완료.

### 필수 체크리스트

- [ ] **HANDOFF Output 형식에 맞는 산출물 생성**
- [ ] 컴포넌트/모듈 코드 작성 완료
- [ ] 타입 정의 파일 작성 완료
- [ ] **엔트리포인트 연결** (SDD에 따라 적용)
- [ ] **빌드 테스트 통과** (`npm run build` 또는 `tsc --noEmit`)
- [ ] **Fixture 기반 구동 테스트** (DB 연결 없이 `npm run dev` 실행 시, Fixture 데이터로 정상 렌더링되고 Console에 DB 에러 없음)

### 엔트리포인트 연결 가이드

> **산출물 유형에 따라 적용** (SDD 참조)

| 유형 | 엔트리포인트 |
|------|-------------|
| **Frontend (React)** | `frontend/src/main.tsx` |
| **Backend (Express)** | `backend/src/index.ts` 또는 `app.ts` |
| **문서 산출물** | 해당 없음 (파일 생성만) |

> ⚠️ **중요**: HANDOFF Output 형식과 SDD 엔트리포인트 가이드를 우선 따를 것.

---

## Skill Report (필수 출력)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 [Coder Skill Report]
🔧 사용된 Skill: coder v3.2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 문서 로딩 (Step 0):
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
✅ Fixture 기반 구동 테스트: PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
