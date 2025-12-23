# SYSTEM_MANIFEST.md (System B Control Tower)

**Version**: 4.2.1
**Last Updated**: 2025-12-23
**Role**: Orchestrator's Configuration Map & Human Guide

## 1. System Identity

We are **ATO-System-B v2.0**, a Human-in-the-Loop AI Orchestration System.

| Component | Version | Description |
| :-------- | :------ | :---------- |
| **System Identity** | ATO-System-B v2.0 | 리브랜딩 완료 (Medi-Notion → ATO-System-B) |
| **Orchestrator Engine** | v4.0.0 | Leader-Sub Agent 협업 엔진 |
| **Document Standard** | MANIFEST v4.2.0 | 본 문서 (Single Source of Truth) |

## 2. Document Map (The New Address Book)

Orchestrator는 작업 모드에 따라 아래 경로에서 문서를 로드합니다.

### Group A: Rules (Constraints)

엄격하게 준수해야 하는 제약 사항

| Priority | Path                                  | Description                                |
| :------- | :------------------------------------ | :----------------------------------------- |
| P0       | `.claude/rules/CODE_STYLE.md`         | 코딩 컨벤션 및 스타일 가이드               |
| P0       | `.claude/rules/DOMAIN_SCHEMA.md`      | 데이터베이스 스키마 정의 (Source of Truth) |
| P0       | `.claude/rules/VALIDATION_GUIDE.md`   | 품질 검증 기준                             |
| P1       | `.claude/rules/TDD_WORKFLOW.md`       | 테스트 주도 개발 절차 (Red-Green-Refactor) |
| P1       | `.claude/rules/DB_ACCESS_POLICY.md`   | DB 접근 권한 및 보안 정책                  |
| P1       | `.claude/rules/ANALYSIS_GUIDE.md`     | 데이터 분석 가이드                         |

### Group B: Workflows (Processes)

작업 순서와 협업 절차

| Priority | Path                                         | Description                                |
| :------- | :------------------------------------------- | :----------------------------------------- |
| P0       | `.claude/workflows/DOCUMENT_PIPELINE.md`     | PRD → SDD → Code 문서 생성 파이프라인      |
| P0       | `.claude/workflows/AGENT_ARCHITECTURE.md`    | Leader & Sub-agent 역할 및 HITL 체크포인트 |
| P1       | `.claude/workflows/INCIDENT_PLAYBOOK.md`     | 장애 대응 및 복구 절차                     |
| P1       | `.claude/workflows/PRD_GUIDE.md`             | 요구사항 정의 가이드                       |
| P1       | `.claude/workflows/ERROR_HANDLING_GUIDE.md`  | 에러 처리 및 예외 관리 가이드              |

### Group C: Context (Philosophy)

팀의 철학 및 행동 강령

| Priority | Path                             | Description                       |
| :------- | :------------------------------- | :-------------------------------- |
| Root     | `CLAUDE.md`                      | 시스템 최상위 헌법 (Safety Rules) |
| Key      | `.claude/context/AI_Playbook.md` | 팀의 철학 및 목표 (Why)           |
| Key      | `.claude/context/AI_CONTEXT.md`  | 에이전트 세부 행동 수칙           |

## 3. Agent별 필수 로딩 문서

각 Agent는 역할에 따라 아래 문서를 로드합니다. 모든 Agent는 `CLAUDE.md`를 필수 로드합니다.

| Agent | 필수 로딩 문서 | 선택 로딩 문서 |
| :---- | :------------- | :------------- |
| **Orchestrator** | SYSTEM_MANIFEST.md | AGENT_ARCHITECTURE.md |
| **Leader** | DOMAIN_SCHEMA.md, DOCUMENT_PIPELINE.md | AI_Playbook.md |
| **code-agent** | DOMAIN_SCHEMA.md, CODE_STYLE.md, TDD_WORKFLOW.md | ERROR_HANDLING_GUIDE.md |
| **query-agent** | DOMAIN_SCHEMA.md, DB_ACCESS_POLICY.md, ANALYSIS_GUIDE.md | - |
| **design-agent** | DOCUMENT_PIPELINE.md, PRD_GUIDE.md | AI_Playbook.md |
| **doc-agent** | DOCUMENT_PIPELINE.md | PRD_GUIDE.md |
| **profile-agent** | DOMAIN_SCHEMA.md, ANALYSIS_GUIDE.md | - |
| **review-agent** | VALIDATION_GUIDE.md, CODE_STYLE.md | TDD_WORKFLOW.md |
| **viewer-agent** | SYSTEM_MANIFEST.md | - |

### 3.1 Agent 용어 매핑

SYSTEM_MANIFEST(Skill 기반)와 AGENT_ARCHITECTURE(역할 기반) 간 용어 매핑입니다.

| SYSTEM_MANIFEST (Skill) | AGENT_ARCHITECTURE (Role) | 설명 |
| :---------------------- | :------------------------ | :--- |
| code-agent | SubAgent (Coding Mode) | 코드 구현 담당 |
| query-agent | AnalysisAgent | SQL 쿼리 및 데이터 분석 |
| design-agent | Leader (Planning Mode) | 설계 문서 생성 |
| review-agent | OutputValidator | 산출물 검증 |
| Leader | Leader | 전체 조율 및 PASS/FAIL 판정 |
| Orchestrator | Orchestrator | 워크플로우 제어 |

> **토큰 최적화**: 상세 토큰 예산은 `AGENT_ARCHITECTURE.md`의 **Agent 로딩 전략** 섹션을 참조하세요.

## 4. Context Mode Loading Strategy

Orchestrator는 PRD 분석 결과에 따라 자동으로 적절한 모드를 선택합니다.

| 모드 | 로딩 문서 | 트리거 조건 |
| :--- | :-------- | :---------- |
| **Planning** | Group C + DOCUMENT_PIPELINE.md | PRD 작성/분석 요청 |
| **Coding** | Group A + TDD_WORKFLOW.md | 구현/수정 요청 |
| **Review** | Group A (VALIDATION) + PRD_GUIDE.md | 검토/QA 요청 |

## 5. Skill Registry (v1.0.0)

7개 스킬이 `orchestrator/skills/` 하위에 정의되어 있습니다.

| Skill | Version | Status |
| :---- | :------ | :----- |
| query-agent | v1.1.0 | Ready |
| code-agent | v1.2.0 | Ready |
| design-agent | v2.1.0 | Ready |
| doc-agent | v2.0.0 | Ready |
| profile-agent | v1.1.0 | Ready |
| review-agent | v1.1.0 | Ready |
| viewer-agent | v1.4.0 | Ready |

## 6. Workspace Paths (런타임 산출물)

Skill-Centric Refactoring (2025-12-22) 이후 런타임 산출물은 `workspace/`에 저장됩니다.

| Path | Description |
| :--- | :---------- |
| `workspace/logs/` | 실행 로그, HITL 승인 로그 |
| `workspace/sessions/` | 세션 데이터 |
| `workspace/analysis/` | 분석 결과물 (SQL, JSON, 리포트) |
| `workspace/features/` | 피처별 산출물 (dr-insight 등) |

## 7. Docs Paths (설계 문서 저장소)

케이스별 설계 산출물은 `docs/cases/`에 저장됩니다. (Flatten 구조, 2025-12-23)

| Path | Description |
| :--- | :---------- |
| `docs/cases/{caseId}/` | 케이스별 설계 산출물 (PRD, IA, Wireframe, SDD, HANDOFF) |
| `docs/cases/{caseId}/visuals/` | 시각화 산출물 (HTML) |
| `docs/architecture/` | 시스템 아키텍처 설계 문서 |

## 8. Service Paths (코드 저장소)

ATO-System-B v2.0의 실제 코드 구조입니다. 에이전트는 이 경로들에 대한 쓰기 권한을 가집니다.

| Path | Description | Agent Access |
| :--- | :---------- | :----------- |
| `backend/src/` | Express API 서버 | ✅ code-agent |
| `frontend/src/` | React 프론트엔드 | ✅ code-agent |
| `orchestrator/` | 오케스트레이터 엔진 | ⚠️ 제한적 (skills만) |
| `mcp-server/` | MCP 서버 모듈 | ✅ code-agent |
| `src/` | 레거시 코드 (마이그레이션 대상) | ⚠️ 읽기 전용 |

## 9. 문서 작성 규칙

### 9.1 섹션 제목 변경 정책

다른 문서에서 참조되는 섹션 제목은 **변경 시 PO 승인 필수**입니다.

| 문서 | 참조되는 섹션 제목 |
| :--- | :----------------- |
| `AGENT_ARCHITECTURE.md` | "Agent 로딩 전략", "Agent 역할 정의" |
| `SYSTEM_MANIFEST.md` | "Context Mode", "Document Map", "Agent별 필수 로딩 문서" |
| `DOMAIN_SCHEMA.md` | "핵심 레거시 스키마", "보안 및 접근 제어" |
| `VALIDATION_GUIDE.md` | "보안 게이트" |
| `CODE_STYLE.md` | "필수 조건" |

### 9.2 참조 형식

섹션 번호 대신 섹션 이름으로 참조하여 순서 변경에 강건하게 합니다.

```markdown
# ❌ Bad - 섹션 번호로 참조 (순서 변경 시 깨짐)
**`AGENT_ARCHITECTURE.md` 섹션 0**을 참조하세요.

# ✅ Good - 섹션 이름으로 참조
**`AGENT_ARCHITECTURE.md`의 Agent 로딩 전략 섹션**을 참조하세요.
```
