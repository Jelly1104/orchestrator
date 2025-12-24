# CLAUDE.md

> **문서 버전**: 4.3.0
> **최종 업데이트**: 2025-12-23
> **관리자**: 미래전략실 (ATO Team)
> **변경 이력**: 목차 재배치 - WHY(목적) → WHAT(원칙) → HOW(구조) → WHERE(참조) 순서로 정리

---

## 🎯 이 문서의 목적

이 문서는 **팀 공통 "헌법"**입니다. 모든 AI 에이전트가 작업 전 반드시 읽어야 하는 최상위 컨텍스트를 제공합니다.

| 이 문서       | 팀 공통 원칙 (절대 기준)             |
| ------------- | ------------------------------------ |
| **다른 문서** | 에이전트 행동 규칙 → `AI_CONTEXT.md` |
|               | 도메인/DB 지도 → `DOMAIN_SCHEMA.md`  |
|               | 프로젝트별 스택 → `PROJECT_STACK.md` |

---

## ⚠️ 문서 우선순위 (Conflict Resolution)

```yaml
우선순위 (높음 → 낮음): 1. PROJECT_STACK.md (프로젝트별 오버라이드)
  2. CLAUDE.md (팀 공통 헌법)
  3. 기타 workflow 문서
```

**[관리 원칙]**

1. **불변성(Immutability)**: `CLAUDE.md`를 포함한 공통 문서는 프로젝트 내에서 수정하지 않는다.
2. **오버라이딩(Overriding)**: 공통 원칙과 다른 예외 사항은 반드시 `PROJECT_STACK.md`에 정의하여 우선 적용받는다.
3. 혁신과 안정의 균형 (Innovation vs Stability):

- Application Layer (Code/UX): 과감한 혁신과 리팩토링을 지향한다. (Aggressive)
- Infrastructure Layer (DB/Schema): 기존 구조의 보존과 안정성을 최우선으로 한다. (Conservative)
- 충돌 해결: "DB 스키마를 변경해야만 혁신이 가능하다"면, 혁신을 포기하고 스키마를 준수한다.

---

## 🚨 절대 금지 (Safety Rules)

AI 에이전트는 아래 행위를 **절대 수행하지 않습니다**.

### 1. 룰북 불변성 (Rulebook Immutability)

| 대상                  | 규칙                                    |
| --------------------- | --------------------------------------- |
| `.claude/rules/*`     | 🔴 **읽기 전용** - 수정/삭제 금지       |
| `.claude/workflows/*` | 🔴 **읽기 전용** - 수정/삭제 금지       |
| `.claude/context/*`   | 🔴 **읽기 전용** - 수정/삭제 금지       |
| `.claude/project/*`   | 🟢 수정 가능 (PROJECT_STACK.md, PRD.md) |
| `CLAUDE.md`           | 🔴 **읽기 전용** - 수정/삭제 금지       |

### 2. 서버 데이터 보호 (Data Protection)

| 행위              | 규칙                                    |
| ----------------- | --------------------------------------- |
| **조회 (SELECT)** | ✅ 허용 - 로컬에서 작업할 데이터 확보용 |
| **생성 (INSERT)** | 🔴 금지                                 |
| **수정 (UPDATE)** | 🔴 금지                                 |
| **삭제 (DELETE)** | 🔴 금지                                 |

**원칙**: 서버 데이터는 **조회만** 허용. 모든 데이터 조작은 **로컬에서만** 수행.
**위반 시**: 작업 즉시 중단, 사용자에게 확인 요청.

### 3. 보안 게이트 (Security Gates) 🔒

입력 검증, 프롬프트 인젝션 방어, API 키 보호, 재시도 제한 등 상세 규칙은 `VALIDATION_GUIDE.md`의 **보안 게이트** 섹션을 참조하세요.

---

## 🏗️ 아키텍처 원칙

### Clean Architecture 기본 원칙

```
┌───────────────────────────────────────┐
│           Presentation (UI/API)       │  ← 외부
├───────────────────────────────────────┤
│           Application (Use Cases)     │
├───────────────────────────────────────┤
│           Domain (Entities/Rules)     │  ← 내부 (핵심)
├───────────────────────────────────────┤
│           Infrastructure (DB/External)│  ← 외부
└───────────────────────────────────────┘
```

### 의존성 규칙 (핵심 원칙)

```yaml
의존성은 항상 안쪽(내부)으로만 향해야 한다.

허용:
  - Presentation → Application → Domain
  - Infrastructure → Domain (Interface 구현)

금지:
  - Domain → Infrastructure  # 도메인은 DB를 몰라야 함
  - Domain → Presentation    # 도메인은 UI를 몰라야 함
  - Application → Presentation
```

---

## 📂 표준 프로젝트 구조 (Standard Directory Layout)

System B (HITL Orchestrator)는 아래의 구조를 따릅니다. 에이전트는 파일 탐색 시 이 구조를 가정해야 합니다.

```text
(Project Root)/
├── CLAUDE.md                    # 🔴 Root Constitution (진입점)
├── .claude/
│   ├── SYSTEM_MANIFEST.md       # 🧠 Control Tower (파일 맵 & 로딩 전략)
│   ├── rules/                   # [Group A] 제약 사항 (Code Style, DB Schema)
│   ├── workflows/               # [Group B] 실행 절차 (Pipeline, Architecture)
│   ├── context/                 # [Group C] 배경 지식 (Playbook, Context)
│   └── project/                 # 🟢 프로젝트별 설정 (PROJECT_STACK.md, PRD.md)
├── src/
├── tests/
└── docs/
```

### 📚 룰북 구조

상세한 파일 매핑과 로딩 전략은 `SYSTEM_MANIFEST.md`의 **Document Map** 섹션에 정의되어 있습니다.

- **Group A (Rules)**: 코딩 컨벤션, DB 스키마, 품질 검증 등 제약 사항
- **Group B (Workflows)**: 문서화 파이프라인, 에이전트 협업, 장애 대응 등 절차
- **Group C (Context)**: 팀 철학, 행동 강령 등 배경 지식

---

## 🤖 LLM 에이전트 연동

Leader Agent (LLM-Agnostic)는 프로젝트 루트의 `CLAUDE.md`를 **자동으로 읽습니다**.
이 파일이 진입점 역할을 하며, 상세 규칙은 `SYSTEM_MANIFEST.md`에 정의된 경로를 참조합니다.

> **Multi-LLM 지원**: Leader/Sub-agent는 Claude, GPT-4, Gemini 등으로 교체 가능합니다.(계획)

### 📋 Agent별 필수 로딩 문서

Agent별 로딩 문서 및 토큰 전략은 `AGENT_ARCHITECTURE.md`의 **Agent 로딩 전략** 섹션을 참조하세요.

> **기본 원칙**: 모든 Agent는 `CLAUDE.md` + `DOMAIN_SCHEMA.md`를 필수 로드합니다.

### 🎯 Context Mode (Token Diet)

작업 모드별 문서 로딩 전략은 `SYSTEM_MANIFEST.md`의 **Context Mode** 섹션을 참조하세요.

> **기본 원칙**: 작업 유형에 따라 필요한 문서만 선택적으로 로드하여 토큰을 절약합니다.

> Orchestrator는 PRD 분석 결과에 따라 자동으로 적절한 모드를 선택합니다.

---

## 📖 미래전략실 개발 가이드

### AI 에이전트 행동 규칙

Agent별 역할 정의 및 협업 프로토콜은 `AGENT_ARCHITECTURE.md`의 **Agent 역할 정의** 섹션을 참조하세요.

### 필수 조건 (전 영역 공통)

타입 안정성, 테스트 커버리지 등 필수 조건은 `CODE_STYLE.md`의 **필수 조건** 섹션을 참조하세요.

---

**END OF CLAUDE.md**

_이 문서는 팀 공통 "헌법"입니다. 프로젝트별 기술 스택은 PROJECT_STACK.md를 참조하세요._
