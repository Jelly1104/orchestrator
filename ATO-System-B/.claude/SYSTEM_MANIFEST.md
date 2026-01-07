# SYSTEM_MANIFEST.md (LLM Control Tower)

> **Version**: 6.0.0 | **대상**: Orchestrator 내 모든 AI Role

---

## 이 문서를 읽는 법

**당신이 AI Role이라면**, 이 문서는 당신의 **지도(Map)**입니다.

### 읽기 순서

1. **Quick Context** → 시스템이 무엇인지 30초 안에 파악
2. **Role별 필수 로딩** → 내가 어떤 Role인지 확인하고, 필수 문서 로딩
3. **Document Map** → 작업 중 필요한 문서를 찾아서 JIT 로딩
4. **Safety Rules** → 절대 하면 안 되는 것 확인

### 컬럼 설명

| 컬럼          | 의미                                   | 예시                          |
| ------------- | -------------------------------------- | ----------------------------- |
| **Pri**       | 우선순위 (P0=필수, P1=작업시, P2=참조) | P0, P1, P2                    |
| **Path**      | 파일 경로                              | `.claude/rules/CODE_STYLE.md` |
| **비유**      | 문서의 역할을 비유로 표현              | ⚖️ 법전, 📖 매뉴얼, 📚 사전   |
| **정의 범위** | 이 문서가 정의하는 내용                | "네이밍/구조 규칙"            |
| **Who**       | 어떤 Role이 읽는가                     | Leader, Analyzer, Coder 등    |
| **로딩**      | 문서 로딩 방식                         | 전체, JIT, 필요 시            |

---

## Quick Context

**시스템**: ATO-System-B - PRD → 분석 → 설계 → 구현을 AI Role 협업으로 처리

**핵심 원칙**:

1. **실행/검증 분리** - 만드는 자(Executor) ≠ 검사하는 자(ImLeader)
2. **HITL 체크포인트** - 구조적 결정은 인간 승인 필수
3. **JIT Injection** - 필요한 문서만 로딩 (토큰 다이어트)

**Phase 흐름**: `A(Analysis)` → `B(Design)` → `C(Implementation)`

---

## Document Map

### Group A: Rules (제약 사항)

| Pri | Path                                | 비유          | 정의 범위                     | Who      | 로딩    |
| --- | ----------------------------------- | ------------- | ----------------------------- | -------- | ------- |
| P0  | `.claude/rules/DOMAIN_SCHEMA.md`    | 📚 사전       | DB 테이블/컬럼, 레거시 매핑   | All      | 전체    |
| P0  | `.claude/rules/CODE_STYLE.md`       | ⚖️ 법전       | 네이밍/구조 규칙, 필수 조건   | Coder    | 전체    |
| P0  | `.claude/rules/VALIDATION_GUIDE.md` | ✅ 체크리스트 | Quality Gates, 검증 기준      | ImLeader | 전체    |
| P1  | `.claude/rules/TDD_WORKFLOW.md`     | 🔄 절차서     | Red-Green-Refactor 사이클     | Coder    | 작업 시 |
| P1  | `.claude/rules/DB_ACCESS_POLICY.md` | 🔒 보안정책   | 권한/금지 패턴, 민감 컬럼     | Analyzer | 작업 시 |
| P1  | `.claude/rules/ANALYSIS_GUIDE.md`   | 📊 가이드     | 쿼리 전략, 샘플링, 파이프라인 | Analyzer | 작업 시 |

### Group B: Workflows (실행 절차)

| Pri | Path                                        | 비유           | 정의 범위                            | Who              | 로딩            |
| --- | ------------------------------------------- | -------------- | ------------------------------------ | ---------------- | --------------- |
| P0  | `.claude/workflows/ROLE_ARCHITECTURE.md`    | 🏗️ 설계도      | Topology, Phase, HITL, **Role 흐름** | Orchestrator     | 전체            |
| P0  | `.claude/workflows/ROLES_DEFINITION.md`     | 📖 매뉴얼      | Role별 R&R, **파이프라인 요약**      | 각 Role          | JIT (해당 섹션) |
| P0  | `.claude/workflows/HANDOFF_PROTOCOL.md`     | 📋 양식        | 업무 지시/보고 형식                  | Leader, ImLeader | 전체            |
| P0  | `.claude/workflows/DOCUMENT_PIPELINE.md`    | 📦 산출물 명세 | **입력/산출물 정의**, 의존성         | All              | 전체            |
| P1  | `.claude/workflows/PRD_GUIDE.md`            | 📝 가이드      | PRD 유형, 파이프라인 판별            | Leader           | 작업 시         |
| P1  | `.claude/workflows/ERROR_HANDLING_GUIDE.md` | 🚨 대응책      | 재시도/폴백 로직                     | Orchestrator     | 에러 시         |
| P1  | `.claude/workflows/INCIDENT_PLAYBOOK.md`    | 🆘 비상매뉴얼  | 에스컬레이션 절차                    | Human            | 장애 시         |

### Group C: Context (배경 지식)

| Pri  | Path                               | 비유      | 정의 범위                       | Who    | 로딩    |
| ---- | ---------------------------------- | --------- | ------------------------------- | ------ | ------- |
| Root | `CLAUDE.md`                        | ⚖️ 헌법   | 절대 원칙, 금지 사항, 아키텍처  | All    | 전체    |
| Key  | `.claude/context/AI_Playbook.md`   | 🧭 나침반 | 팀 철학, 행동 강령              | Leader | 판단 시 |
| Key  | `.claude/project/PROJECT_STACK.md` | 🔧 설정   | 프로젝트별 기술 스택 오버라이드 | All    | 전체    |

### Group D: Templates (SSOT) - 산출물 작성 시 참조

| Pri | Path                                          | Who      |
| --- | --------------------------------------------- | -------- |
| P1  | `.claude/templates/designer/IA_TEMPLATE.md`   | Designer |
| P1  | `.claude/templates/designer/WF_TEMPLATE.md`   | Designer |
| P1  | `.claude/templates/designer/SDD_TEMPLATE.md`  | Designer |
| P1  | `.claude/templates/query/SQL_PATTERNS.md`     | Analyzer |
| P1  | `.claude/templates/profiler/SEGMENT_RULES.md` | Analyzer |
| P1  | `.claude/templates/reviewer/QUALITY_RULES.md` | ImLeader |
| P1  | `.claude/templates/reviewer/PRD_CHECKLIST.md` | ImLeader |
| P2  | `.claude/templates/prd/PRD_LITE.md`           | Human    |
| P2  | `.claude/templates/prd/PRD_FULL.md`           | Human    |

### Group E: Skills (Extension용) - 슬래시 커맨드 실행 시

| Pri | Path                               | Who      |
| --- | ---------------------------------- | -------- |
| P0  | `.claude/skills/leader/SKILL.md`   | Leader   |
| P1  | `.claude/skills/query/SKILL.md`    | Analyzer |
| P1  | `.claude/skills/profiler/SKILL.md` | Analyzer |
| P1  | `.claude/skills/designer/SKILL.md` | Designer |
| P1  | `.claude/skills/coder/SKILL.md`    | Coder    |
| P1  | `.claude/skills/reviewer/SKILL.md` | ImLeader |
| P0  | `.claude/skills/imleader/SKILL.md` | ImLeader |

> **실행 순서**: leader → (query/profiler/designer/coder) → imleader → reviewer

---

## Role별 필수 로딩 문서

### 공통 (모든 AI Role)

| 문서                                     | Why                             |
| ---------------------------------------- | ------------------------------- |
| `SYSTEM_MANIFEST.md`                     | 시스템 지도, 문서 맵, 로딩 전략 |
| `CLAUDE.md`                              | 시스템 헌법, 절대 금지 사항     |
| `.claude/rules/DOMAIN_SCHEMA.md`         | DB 스키마, Hallucination 방지   |
| `.claude/project/PROJECT_STACK.md`       | 프로젝트별 기술 스택            |
| `.claude/workflows/DOCUMENT_PIPELINE.md` | 입력/산출물 정의, 의존성        |

### Role별 추가 로딩

| Role         | 추가 로딩 문서                                                                       | Tools           | Why                       |
| ------------ | ------------------------------------------------------------------------------------ | --------------- | ------------------------- |
| **Leader**   | ROLES_DEFINITION#Leader, HANDOFF_PROTOCOL, PRD_GUIDE, AI_Playbook                    | ❌              | 전략 수립, 하위 Role 지휘 |
| **Analyzer** | ROLES_DEFINITION#Analyzer, DB_ACCESS_POLICY, ANALYSIS_GUIDE                          | query, profiler | SQL 실행, 데이터 분석     |
| **Designer** | ROLES_DEFINITION#Designer                                                            | designer        | IA/WF/SDD 설계            |
| **Coder**    | ROLES_DEFINITION#Coder, CODE_STYLE, TDD_WORKFLOW                                     | coder           | 코드 구현                 |
| **ImLeader** | ROLES_DEFINITION#ImLeader, HANDOFF_PROTOCOL, VALIDATION_GUIDE                        | reviewer        | 산출물 검증, PASS/FAIL    |

> **JIT 원칙**: 전체 문서 로딩 금지. Role에 필요한 문서만 선택적 로딩.

---

## Output Paths (산출물 저장 위치)

| 용도            | 경로                                     | 예시                      |
| --------------- | ---------------------------------------- | ------------------------- |
| Case 산출물     | `docs/cases/{caseId}/{taskId}/`          | HANDOFF.md, IA.md, SDD.md |
| 분석 결과       | `docs/cases/{caseId}/{taskId}/analysis/` | _.sql, _.json, report.md  |
| 백엔드 코드     | `backend/src/{feature}/`                 | API, Service, Repository  |
| 프론트엔드 코드 | `frontend/src/{feature}/`                | Components, Pages         |
| 실행 로그       | `workspace/logs/{caseId}/{taskId}.json`  | 실행 이력                 |

---

## Safety Rules (절대 금지)

### 룰북 보호

- **수정 금지** - `.claude/rules/`, `.claude/workflows/`, `CLAUDE.md`
- **수정 가능** - `.claude/project/` (PROJECT_STACK.md, PRD.md)

---

**END OF SYSTEM_MANIFEST.md**
