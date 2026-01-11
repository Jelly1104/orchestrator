# CLAUDE.md

> **문서 버전**: 4.4.1
> **최종 업데이트**: 2026-01-07
> **관리자**: 미래전략실 (ATO Team)

---

## 🎯 이 문서의 목적

이 문서는 **팀 공통 "헌법"**입니다. 모든 AI Role이 작업 전 반드시 읽어야 하는 최상위 컨텍스트를 제공합니다.

| 이 문서       | 팀 공통 원칙 (절대 기준)                                            |
| ------------- | ------------------------------------------------------------------- |
| **다른 문서** | 팀 철학/행동 강령 → `.claude/context/AI_Playbook.md`                |
|               | 도메인/DB 지도 → `.claude/rules/DOMAIN_SCHEMA.md`                   |
|               | 프로젝트별 스택 → `.claude/project/PROJECT_STACK.md`                |
|               | 시스템 지도 → `.claude/SYSTEM_MANIFEST.md`                          |
|               | 입력/산출물 정의, 의존성 → `.claude/workflows/DOCUMENT_PIPELINE.md` |

---

## ⚠️ 문서 우선순위 (Conflict Resolution)

```yaml
우선순위 (높음 → 낮음):
  1. .claude/project/PROJECT_STACK.md (프로젝트별 오버라이드)
  2. CLAUDE.md (팀 공통 헌법)
  3. .claude/rules/*, .claude/workflows/*, .claude/context/* (세부 규칙/절차)
```

**[관리 원칙]**

1. **불변성(Immutability)**: `CLAUDE.md`를 포함한 공통 문서는 프로젝트 내에서 수정하지 않는다.
2. **오버라이딩(Overriding)**: 공통 원칙과 다른 예외 사항은 반드시 `.claude/project/PROJECT_STACK.md`에 정의하여 우선 적용받는다.
3. 혁신과 안정의 균형 (Innovation vs Stability):

- Application Layer (Code/UX): 과감한 혁신과 리팩토링을 지향한다. (Aggressive)
- Infrastructure Layer (DB/Schema): 기존 구조의 보존과 안정성을 최우선으로 한다. (Conservative)
- 충돌 해결: "DB 스키마를 변경해야만 혁신이 가능하다"면, 혁신을 포기하고 스키마를 준수한다.

---

## 🚨 절대 금지 (Safety Rules)

AI 에이전트는 아래 행위를 **절대 수행하지 않습니다**.

### 1. 룰북 불변성 (Rulebook Immutability)

| 대상                  | 규칙                                             |
| --------------------- | ------------------------------------------------ |
| `.claude/rules/*`     | 🔴 **읽기 전용** - 수정/삭제 금지                |
| `.claude/workflows/*` | 🔴 **읽기 전용** - 수정/삭제 금지                |
| `.claude/context/*`   | 🔴 **읽기 전용** - 수정/삭제 금지                |
| `.claude/project/*`   | 🟢 수정 가능 (PROJECT_STACK.md, **PRD.md 제외**) |
| `CLAUDE.md`           | 🔴 **읽기 전용** - 수정/삭제 금지                |

### 2. 데이터 사용 원칙 (Data Usage Principles) - Discovery vs Reproduction

**"실데이터는 발견에 쓰고, Mock 데이터는 재현에 쓴다."**

| Phase | 목적 | 데이터 소스 | 허용 행위 | 산출물(Contract) |
| :--- | :--- | :--- | :--- | :--- |
| **A (Analysis)** | **발견 (Discovery)** | ✅ **Real DB** (Read-Only) | 구조 파악, 관계 분석, 예외 케이스 발굴 | `ANALYSIS.md`, `DOMAIN_SCHEMA.md` |
| **C (Impl)** | **재현 (Reproduction)** | ❌ **Real DB 금지**<br>✅ **Fixture/Mock** | 계약(Phase A 산출물)에 기반한 UI 렌더링 및 로직 검증 | `Source Code`, `Tests` |

**원칙:**
1. **계약의 확정:** Phase A의 산출물은 이후 단계의 '변경 불가능한 계약'이 된다.
2. **책임의 분리:** UI는 DB 연결 상태가 아니라, 계약된 데이터 구조(Schema)에 대한 렌더링 정확성을 책임진다.

### 3. 보안 게이트 (Security Gates) 🔒

입력/쿼리 안전성, 데이터 노출 방지, 재시도 제한 등 상세 규칙은 `VALIDATION_GUIDE.md`의 **Phase A: SQL 안전성**, **Phase C: 보안**, **재시도 정책** 섹션을 참조하세요.

### 4. 실행 제한 (Operational Restrictions)

The agent is restricted from any commands that modify or delete files, access environment variables or secrets, perform network communication, or alter system state, permissions, or running processes.

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

**END OF CLAUDE.md**

_이 문서는 팀 공통 "헌법"입니다. 프로젝트별 기술 스택은 `.claude/project/PROJECT_STACK.md`를 참조하세요._
