# Extension Skills (Claude Code / VSCode)

> **버전**: 1.1.0
> **최종 수정**: 2026-01-07
> **목적**: Claude Code Extension에서 실행하는 경량화 Skills 가이드

---

## 1. 파이프라인별 Skill 순서

> **핵심**: 각 Phase 완료 후 `/imleader`로 검증, 파이프라인 완료 후 `/leader` 최종 확인 → HITL

| 파이프라인        | Phase | Skill 순서                                                                                                               |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `analysis`        | A만   | `/leader` → `/profiler` → `/query` → `/imleader` → `/leader` → HITL                                                      |
| `design`          | B만   | `/leader` → `/designer` → `/imleader` → `/leader` → HITL                                                                 |
| `code`            | C만   | `/leader` → `/coder` → `/imleader` → `/leader` → HITL                                                                    |
| `ui_mockup`       | B→C   | `/leader` → `/designer` → `/imleader` → `/coder` → `/imleader` → `/leader` → HITL                                        |
| `analyzed_design` | A→B   | `/leader` → `/profiler` → `/query` → `/imleader` → `/designer` → `/imleader` → `/leader` → HITL                          |
| `full`            | A→B→C | `/leader` → `/profiler` → `/query` → `/imleader` → `/designer` → `/imleader` → `/coder` → `/imleader` → `/leader` → HITL |

### Skill 역할별 분류

| Phase              | 역할                       | Skills                |
| ------------------ | -------------------------- | --------------------- |
| **Phase A (분석)** | 세그먼트 정의, SQL 생성    | `/profiler`, `/query` |
| **Phase B (설계)** | 설계 문서 생성             | `/designer`           |
| **Phase C (구현)** | 코드 구현                  | `/coder`              |
| **검증**           | 품질 검증 (HANDOFF 기준)   | `/imleader`           |
| **조율**           | 전체 조율, 파이프라인 결정 | `/leader`             |

---

## 2. 개요

`.claude/skills/`는 **Claude Code Extension**에서 슬래시 커맨드(`/leader`, `/coder` 등)로 실행하는 경량화된 스킬입니다.

### Orchestrator vs Extension

| 구분     | Orchestrator                     | Extension                 |
| -------- | -------------------------------- | ------------------------- |
| **경로** | `orchestrator/tools/{skill}/`    | `.claude/skills/{skill}/` |
| **구성** | SKILL.md + index.js + resources/ | SKILL.md (단독)           |
| **실행** | Node.js 코드 실행                | LLM 프롬프트 기반         |
| **용도** | 자동화 파이프라인, HITL          | 대화형 작업, 빠른 반복    |

---

## 3. Skills 목록 (6개)

| Skill       | 역할                       | 입력                                   | 출력                                                 |
| ----------- | -------------------------- | -------------------------------------- | ---------------------------------------------------- |
| `/leader`   | PRD 분석, 파이프라인 결정  | PRD.md                                 | HANDOFF.md                                           |
| `/profiler` | 세그먼트 정의, 페르소나    | HANDOFF.md                             | 세그먼트 정의서, SQL 조건 명세                       |
| `/query`    | SQL 쿼리 생성/실행         | HANDOFF.md, 세그먼트 정의              | `*.sql`, `analysis_result.json`, `report.md`, `Fixture_Source.json` |
| `/designer` | 설계 문서 생성             | HANDOFF.md (+ analysis 결과 if 있으면) | `IA.md`, `Wireframe.md`, `SDD.md`                    |
| `/coder`    | 코드 구현                  | HANDOFF.md, SDD.md                     | `frontend/src/*`, `backend/src/*`, `tests/*.test.ts` |
| `/imleader` | 산출물 검증 (HANDOFF 기준) | HANDOFF.md + 해당 Phase 산출물         | PASS/FAIL 판정, 검증 리포트                          |

> **참조**: 파이프라인별 상세 입출력은 `DOCUMENT_PIPELINE.md`의 **파이프라인 타입별 산출물** 섹션 참조

---

## 4. 실행 프로토콜 (필수)

> **모든 Skill 실행 시 반드시 아래 순서를 따라야 합니다.**

```
1. SKILL.md 전체 Read (해당 스킬의 SKILL.md 파일)
2. Phase 0: 문서 로딩 확인 출력
3. Phase 1~N: 실제 작업 수행
4. Skill Report 출력
```

### Phase 0 출력 형식

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 [문서 로딩 확인]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[공통]
- CLAUDE.md: {절대 금지 사항 1가지}
- DOMAIN_SCHEMA.md: {사용할 테이블 n개}
- PROJECT_STACK.md: {기술 스택}
- DOCUMENT_PIPELINE.md: {산출물 목록}

[{Skill}별 추가 로딩]
- {문서명}: {요약}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **Phase 0 출력 없이 작업을 진행하면 산출물이 무효 처리됩니다.**

---

## 5. 프롬프트 예시 (모든 Skill)

> **공통 형식**: `SKILL.md 읽고 Phase 라우팅 규칙에 따라 진행해줘.`

### /leader

```
/leader
{PRD 주소} 첨부
.claude/skills/leader/SKILL.md 읽고 Phase 라우팅 규칙에 따라 진행해줘.
```

### /profiler

```
/profiler
.claude/skills/profiler/SKILL.md 읽고 Phase 라우팅 규칙에 따라 진행해줘.
```

### /query

```
/query
.claude/skills/query/SKILL.md 읽고 Phase 라우팅 규칙에 따라 진행해줘.
```

### /designer

```
/designer
.claude/skills/designer/SKILL.md 읽고 Phase 라우팅 규칙에 따라 진행해줘.
```

### /coder

```
/coder
.claude/skills/coder/SKILL.md 읽고 Phase 라우팅 규칙에 따라 진행해줘.
```

### /imleader

```
/imleader
.claude/skills/imleader/SKILL.md 읽고 Phase 라우팅 규칙에 따라 진행해줘.
```

---

## 6. 산출물 경로

### analysis 파이프라인

```text
docs/cases/{case-id}/
├── PRD.md              # 사용자 작성
├── HANDOFF.md          # /leader 생성
└── analysis/
    ├── TARGET_DEFINITION.md  # /profiler 생성
    ├── analysis_report.md     # /query 생성
    └── results/
        └── *.sql              # /query 생성
```

### ui_mockup / full 파이프라인

```text
docs/cases/{caseId}/{taskId}/
├── PRD.md              # 사용자 작성
├── HANDOFF.md          # /leader 생성
├── IA.md               # /designer 생성
├── Wireframe.md        # /designer 생성
└── SDD.md              # /designer 생성

frontend/src/features/{feature}/
├── {Component}.tsx     # /coder 생성
├── types.ts            # /coder 생성
└── index.ts            # /coder 생성

frontend/src/main.tsx   # /coder 수정 (엔트리포인트 연결)
```

> **참고**: 현재 파이프라인은 Frontend(React) 중심. Backend API가 필요한 경우 PRD에 명시 필요.

---

## 7. 주의사항

### Skill 선택 기준

| 상황                             | 적합한 Skill |
| -------------------------------- | ------------ |
| 타겟 세그먼트/페르소나 정의 필요 | `/profiler`  |
| DB 데이터 추출/SQL 생성 필요     | `/query`     |
| UI/UX 설계 + 기술 설계 필요      | `/designer`  |
| 코드 구현 필요                   | `/coder`     |

### Designer 역할 범위 (Phase B)

> `/designer`는 UX 기획과 기술 설계를 **모두** 담당합니다.

| 모드                 | 산출물              | 설명                                                      |
| -------------------- | ------------------- | --------------------------------------------------------- |
| **UX Planner**       | IA.md, Wireframe.md | 화면 구조, 사용자 흐름                                    |
| **System Architect** | SDD.md              | 컴포넌트 명세, Props, 타입 정의, 엔트리포인트 연결 가이드 |

> **핵심**: "화면을 설계한 자가 데이터 바인딩(SDD)을 정의해야 한다" - 화면↔데이터 정합성 책임

### Skill 역할 구분 (Phase A)

- `/profiler`: **누가** 대상인지 (WHO - 세그먼트 정의, SQL 조건 명세)
- `/query`: **무엇을** 추출할지 (WHAT - SQL 생성, 결과 분석)

> **순서**: `/profiler` (세그먼트 정의) → `/query` (SQL 생성)
>
> **이유**: "누구를 분석할지" 먼저 정의 → "그 조건으로 무엇을 추출할지" SQL 작성

### Skill 건너뛰기

- PRD에 "회원 분석", "세그먼트 정의", "페르소나"가 없으면 `/profiler`는 건너뛸 수 있음
- 단순 데이터 추출만 필요하면 `/query`만 실행

### Discovery vs Reproduction 원칙

> **"실데이터는 발견에 쓰고, Mock 데이터는 재현에 쓴다."**

| Phase | Skill | 데이터 소스 | 역할 |
|-------|-------|-------------|------|
| **Phase A** | `/profiler`, `/query` | ✅ Real DB (Read-Only) | 구조 파악, 계약 확정 |
| **Phase C** | `/coder` | ❌ Real DB 금지<br>✅ Fixture/Mock | 계약 기반 UI 재현 |

**⚠️ Coder 제약**: `/coder`는 DB에 접근하지 않습니다. `Fixture_Source.json` 또는 SDD의 스키마를 기반으로 구현합니다.

---

## 8. 폴더 구조

```text
.claude/skills/
├── README.md           # 이 문서
├── leader/
│   └── SKILL.md
├── profiler/
│   └── SKILL.md
├── query/
│   └── SKILL.md
├── designer/
│   └── SKILL.md
├── coder/
│   └── SKILL.md
└── imleader/
    └── SKILL.md
```

---

**END OF README**
