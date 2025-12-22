# SYSTEM_MANIFEST.md (System B Control Tower)

**Version**: 3.0.0
**Last Updated**: 2025-12-22 (Clean Sweep Completed)
**Role**: Orchestrator's Configuration Map & Human Guide

## 1. System Identity

We are **System B**, a Human-in-the-Loop AI Orchestration System.

## 2. Document Map (The New Address Book)

Orchestrator는 작업 모드에 따라 아래 경로에서 문서를 로드합니다.

### Group A: Rules (Constraints)

| Priority | Path                             | Description                                |
| :------- | :------------------------------- | :----------------------------------------- |
| P0       | `.claude/rules/CODE_STYLE.md`    | 코딩 컨벤션 및 스타일 가이드               |
| P0       | `.claude/rules/DOMAIN_SCHEMA.md` | 데이터베이스 스키마 정의 (Source of Truth) |
| P1       | `.claude/rules/TDD_WORKFLOW.md`  | 테스트 주도 개발 절차 (Red-Green-Refactor) |

### Group B: Workflows (Processes)

| Priority | Path                                      | Description                                |
| :------- | :---------------------------------------- | :----------------------------------------- |
| P0       | `.claude/workflows/DOCUMENT_PIPELINE.md`  | PRD → SDD → Code 문서 생성 파이프라인      |
| P0       | `.claude/workflows/AGENT_ARCHITECTURE.md` | Leader & Sub-agent 역할 및 HITL 체크포인트 |
| P1       | `.claude/workflows/INCIDENT_PLAYBOOK.md`  | 장애 대응 및 복구 절차                     |

### Group C: Context (Philosophy)

| Priority | Path                             | Description                       |
| :------- | :------------------------------- | :-------------------------------- |
| Root     | `.claude/CLAUDE.md`              | 시스템 최상위 헌법 (Safety Rules) |
| Key      | `.claude/context/AI_Playbook.md` | 팀의 철학 및 목표 (Why)           |

## 3. Context Mode Loading Strategy

- **Planning Mode:** Group C + Workflows/DOCUMENT_PIPELINE.md
- **Coding Mode:** Group A (Rules) + Workflows/TDD_WORKFLOW.md
- **Review Mode:** Group A (Rules/VALIDATION) + Workflows/PRD_GUIDE.md

## 4. Workspace Paths (산출물 저장소)

Skill-Centric Refactoring (2025-12-22) 이후 모든 산출물은 `workspace/`에 저장됩니다.

| Path | Description |
| :--- | :---------- |
| `workspace/logs/` | 실행 로그, HITL 승인 로그 |
| `workspace/sessions/` | 세션 데이터 |
| `workspace/analysis/` | 분석 결과물 |
| `workspace/features/` | 피처별 산출물 (dr-insight 등) |
| `workspace/docs/` | PRD, SDD, Design Docs |

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

## 6. Removed Legacy Paths (Clean Sweep 2025-12-22)

다음 경로들은 삭제되었으며 더 이상 참조하면 안 됩니다:

- ~~`src/backend/`~~ → `backend/` 사용
- ~~`src/frontend/`~~ → `frontend/` 사용
- ~~`src/analysis/`~~ → `workspace/analysis/` 사용
- ~~`src/features/dr-insight/`~~ → `workspace/features/dr-insight/` 사용
- ~~`tests/` (root)~~ → 각 서비스 폴더 내 `tests/` 사용
