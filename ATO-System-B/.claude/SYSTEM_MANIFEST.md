# SYSTEM_MANIFEST.md (System B Control Tower)

> **Version**: 5.10.0
> **Last Updated**: 2026-01-06
> **Role**: Orchestrator's Configuration Map
> **다이어그램**: README.md 참조
> **대상**: Orchestrator

---

## System Identity

| Component           | Version           | Description                   |
| ------------------- | ----------------- | ----------------------------- |
| System Identity     | ATO-System-B v2.1 | Role-Based Architecture 적용  |
| Orchestrator Engine | v5.3.0            | JIT Loader + Role-Tool Matrix |
| Document Standard   | MANIFEST v5.3.0   | 본 문서                       |

---

## Document Map

### Group A: Rules (Constraints)

| Priority | Path                                | Description      |
| -------- | ----------------------------------- | ---------------- |
| P0       | `.claude/rules/CODE_STYLE.md`       | 코딩 컨벤션      |
| P0       | `.claude/rules/DOMAIN_SCHEMA.md`    | DB 스키마 (SSOT) |
| P0       | `.claude/rules/VALIDATION_GUIDE.md` | 품질 검증 기준   |
| P1       | `.claude/rules/TDD_WORKFLOW.md`     | TDD 절차         |
| P1       | `.claude/rules/DB_ACCESS_POLICY.md` | DB 보안 정책     |
| P1       | `.claude/rules/ANALYSIS_GUIDE.md`   | 분석 가이드      |

### Group B: Workflows (Processes)

| Priority | Path                                        | Description          |
| -------- | ------------------------------------------- | -------------------- |
| P0       | `.claude/workflows/ROLE_ARCHITECTURE.md`    | Role-Based Model     |
| P0       | `.claude/workflows/ROLES_DEFINITION.md`     | Role별 R&R           |
| P0       | `.claude/workflows/HANDOFF_PROTOCOL.md`     | 업무 지시 양식       |
| P0       | `.claude/workflows/DOCUMENT_PIPELINE.md`    | 문서 생성 파이프라인 |
| P1       | `.claude/workflows/INCIDENT_PLAYBOOK.md`    | 장애 대응            |
| P1       | `.claude/workflows/PRD_GUIDE.md`            | PRD 가이드           |
| P1       | `.claude/workflows/ERROR_HANDLING_GUIDE.md` | 에러 처리 가이드     |

### Group C: Context (Philosophy)

| Priority | Path                             | Description |
| -------- | -------------------------------- | ----------- |
| Root     | `CLAUDE.md`                      | 시스템 헌법 |
| Key      | `.claude/context/AI_Playbook.md` | 팀 철학     |

### Group D: Templates (SSOT)

| Priority | Path                                          | Description           |
| -------- | --------------------------------------------- | --------------------- |
| P1       | `.claude/templates/designer/IA_TEMPLATE.md`   | IA 템플릿             |
| P1       | `.claude/templates/designer/WF_TEMPLATE.md`   | Wireframe 템플릿      |
| P1       | `.claude/templates/query/SQL_PATTERNS.md`     | SQL 패턴              |
| P1       | `.claude/templates/profiler/SEGMENT_RULES.md` | 세그먼트 규칙         |
| P1       | `.claude/templates/reviewer/QUALITY_RULES.md` | 품질 검증 규칙        |
| P1       | `.claude/templates/reviewer/PRD_CHECKLIST.md` | PRD 체크리스트        |
| P2       | `.claude/templates/prd/PRD_LITE.md`           | PRD 템플릿 (수동용)   |
| P2       | `.claude/templates/prd/PRD_FULL.md`           | PRD 템플릿 (자동화용) |

> **SSOT**: 모든 템플릿의 단일 원천. `orchestrator/tools/*/resources/`는 deprecated.

### Group E: Skills (Extension용)

| Priority | Path                               | Description            |
| -------- | ---------------------------------- | ---------------------- |
| P0       | `.claude/skills/leader/SKILL.md`   | PRD 분석, HANDOFF 생성 |
| P1       | `.claude/skills/query/SKILL.md`    | SQL 쿼리 생성 (경량)   |
| P1       | `.claude/skills/profiler/SKILL.md` | 프로필 분석 (경량)     |
| P1       | `.claude/skills/designer/SKILL.md` | 설계 문서 생성 (경량)  |
| P1       | `.claude/skills/coder/SKILL.md`    | 코드 구현 (경량)       |
| P1       | `.claude/skills/reviewer/SKILL.md` | 품질 검증 (경량)       |
| P0       | `.claude/skills/imleader/SKILL.md` | 산출물 검증, PASS/FAIL |

> **용도**: VSCode Extension에서 Orchestrator 없이 직접 호출하는 경량 Skill
> **실행 순서**: leader → (query/profiler/designer/coder) → imleader

> **다이어그램**: README.md 섹션 1.2 참조

---

## Role별 필수 로딩 문서

### 공통 (모든 AI Role)

| 폴더       | 문서             | 설명                 |
| ---------- | ---------------- | -------------------- |
| `/`        | CLAUDE.md        | 시스템 헌법          |
| `rules/`   | DOMAIN_SCHEMA.md | DB 스키마 (SSOT)     |
| `project/` | PROJECT_STACK.md | 프로젝트별 기술 스택 |

### Role별 추가 로딩

| Role         | 폴더         | 추가 로딩 문서                                                 | Tools            |
| ------------ | ------------ | -------------------------------------------------------------- | ---------------- |
| Orchestrator | `workflows/` | SYSTEM_MANIFEST, ROLE_ARCHITECTURE                             | doc-sync, viewer |
|              |              | ⚠️*ERROR_HANDLING_GUIDE* (Backstage)                           |                  |
| Leader       | `workflows/` | ROLES_DEFINITION(Leader 섹션), DOCUMENT_PIPELINE               | ❌ 없음          |
|              |              | HANDOFF_PROTOCOL, PRD_GUIDE                                    |                  |
|              | `context/`   | AI_Playbook                                                    |                  |
|              | `project/`   | _PRD.md_ (런타임 입력)                                         |                  |
| Analyzer     | `workflows/` | ROLES_DEFINITION(Analyzer 섹션)                                | query, profiler  |
|              | `rules/`     | DB_ACCESS_POLICY, ANALYSIS_GUIDE                               |                  |
| Designer     | `workflows/` | ROLES_DEFINITION(Designer 섹션)                                | designer         |
| Coder        | `workflows/` | ROLES_DEFINITION(Coder 섹션)                                   | coder            |
|              | `rules/`     | CODE_STYLE, TDD_WORKFLOW                                       |                  |
| ImLeader     | `workflows/` | ROLES_DEFINITION(Implementation Leader 섹션), HANDOFF_PROTOCOL | reviewer         |
|              | `rules/`     | VALIDATION_GUIDE                                               |                  |
| Human        | `/`          | README.md                                                      | -                |
|              | `workflows/` | ⚠️*INCIDENT_PLAYBOOK* (Backstage)                              |                  |

> **범례**: ⚠️*이탤릭* = Backstage 문서 (시스템/운영자 전용, 필요 시 JIT 로딩), _이탤릭_ = 런타임 입력 문서
> **상세 토폴로지**: README.md 섹션 1-3 참조

---

## SSOT 참조 원칙

| 문서                | 역할      | SSOT 원칙               |
| ------------------- | --------- | ----------------------- |
| CLAUDE.md           | 원칙 선언 | 구체적 규칙 정의 금지   |
| DB_ACCESS_POLICY.md | **SSOT**  | 모든 DB 보안 규칙 정의  |
| DOMAIN_SCHEMA.md    | 대상 정의 | 처리 방법은 POLICY 참조 |

---

## Tools Registry

| Tool         | Version | Owner        | 설명           |
| ------------ | ------- | ------------ | -------------- |
| QueryTool    | v1.2.0  | Analyzer     | SQL 쿼리 실행  |
| CoderTool    | v3.0.1  | Coder        | 코드 구현      |
| DesignerTool | v2.2.0  | Designer     | IA/WF/SDD 생성 |
| DocSyncTool  | v2.1.0  | Orchestrator | Notion 동기화  |
| ProfilerTool | v1.2.0  | Analyzer     | 프로필 분석    |
| ReviewerTool | v2.0.0  | Impl Leader  | 품질 검증      |
| ViewerTool   | v1.5.0  | Orchestrator | 웹 뷰어        |

> **Role-Tool 권한 매트릭스**: ROLE_ARCHITECTURE.md `Role-Tool 권한 매트릭스` 섹션 참조

---

## Paths

### Workspace (런타임)

| Path                  | Description   | Status                         |
| --------------------- | ------------- | ------------------------------ |
| `workspace/logs/`     | 실행 로그     | Active                         |
| `workspace/sessions/` | 세션 데이터   | Active                         |
| `workspace/analysis/` | ~~분석 결과~~ | **Deprecated** → `docs/cases/` |

### Docs (Case-Centric)

| Path                                     | Description                          |
| ---------------------------------------- | ------------------------------------ |
| `docs/cases/{caseId}/`                   | Case 루트                            |
| `docs/cases/{caseId}/{taskId}/`          | Task별 산출물 (HANDOFF, IA, SDD, WF) |
| `docs/cases/{caseId}/{taskId}/analysis/` | 분석 결과 (SQL, JSON, 리포트)        |
| `backend/src/{feature}/`                 | 백엔드 코드                          |
| `frontend/src/{feature}/`                | 프론트엔드 코드                      |
| `workspace/logs/{caseId}/{taskId}.json`  | 실행 로그 (Case/Task별 그룹화)       |

> **구조**: 하나의 Case(프로젝트)에 여러 Task(작업)가 존재할 수 있음

### Service (코드)

| Path            | Description    | Role Access |
| --------------- | -------------- | ----------- |
| `backend/src/`  | Express API    | ✅ Coder    |
| `frontend/src/` | React 프론트   | ✅ Coder    |
| `orchestrator/` | 오케스트레이터 | ⚠️ 제한적   |
| `mcp-server/`   | MCP 서버       | ✅ Coder    |

---

## 문서 작성 규칙

### 섹션 제목 변경 정책

> 다른 문서에서 참조되는 섹션 제목은 **PO 승인 필수**

| 문서              | 참조되는 섹션                                                           |
| ----------------- | ----------------------------------------------------------------------- |
| ROLE_ARCHITECTURE | `Role 정의 요약`, `Role-Tool 권한 매트릭스`                             |
| ROLES_DEFINITION  | `Leader`, `Analyzer`, `Designer`, `Implementation Leader`, `Coder` 섹션 |
| DOMAIN_SCHEMA     | `핵심 레거시 스키마`                                                    |

### 참조 형식

```markdown
❌ Bad: ROLE_ARCHITECTURE.md 섹션 0 참조
✅ Good: ROLE_ARCHITECTURE.md의 Role 정의 요약 섹션 참조
```

---

## 관련 문서

| 문서                 | 역할                |
| -------------------- | ------------------- |
| CLAUDE.md            | 시스템 헌법         |
| ROLE_ARCHITECTURE.md | 시스템 지도         |
| ROLES_DEFINITION.md  | Role별 매뉴얼       |
| README.md            | 다이어그램 (인간용) |

---

## 변경 이력

| 버전   | 날짜       | 변경 내용                                                                |
| ------ | ---------- | ------------------------------------------------------------------------ |
| 5.10.0 | 2026-01-06 | Skills에 leader, imleader 추가, 실행 순서 명시                           |
| 5.9.0  | 2026-01-06 | Role별 필수 로딩 문서 매트릭스 재정의 (공통/Role별 분리), 대상 헤더 추가 |

---

**END OF SYSTEM_MANIFEST.md**
