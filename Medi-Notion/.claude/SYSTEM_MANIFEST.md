# SYSTEM_MANIFEST.md (System B Control Tower)

**Version**: 2.0.0
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
