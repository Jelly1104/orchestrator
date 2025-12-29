# SYSTEM_MANIFEST.md (System B Control Tower)

**Version**: 5.3.0
**Last Updated**: 2025-12-29
**Role**: Orchestrator's Configuration Map
**다이어그램**: README.md 참조

---

## 1. System Identity

| Component | Version | Description |
|-----------|---------|-------------|
| System Identity | ATO-System-B v2.1 | Role-Based Architecture 적용 |
| Orchestrator Engine | v5.3.0 | JIT Loader + Role-Tool Matrix |
| Document Standard | MANIFEST v5.3.0 | 본 문서 |

---

## 2. Document Map

### Group A: Rules (Constraints)

| Priority | Path | Description |
|----------|------|-------------|
| P0 | `.claude/rules/CODE_STYLE.md` | 코딩 컨벤션 |
| P0 | `.claude/rules/DOMAIN_SCHEMA.md` | DB 스키마 (SSOT) |
| P0 | `.claude/rules/VALIDATION_GUIDE.md` | 품질 검증 기준 |
| P1 | `.claude/rules/TDD_WORKFLOW.md` | TDD 절차 |
| P1 | `.claude/rules/DB_ACCESS_POLICY.md` | DB 보안 정책 |
| P1 | `.claude/rules/ANALYSIS_GUIDE.md` | 분석 가이드 |

### Group B: Workflows (Processes)

| Priority | Path | Description |
|----------|------|-------------|
| P0 | `.claude/workflows/ROLE_ARCHITECTURE.md` | Role-Based Model |
| P0 | `.claude/workflows/ROLES_DEFINITION.md` | Role별 R&R |
| P0 | `.claude/workflows/HANDOFF_PROTOCOL.md` | 업무 지시 양식 |
| P0 | `.claude/workflows/DOCUMENT_PIPELINE.md` | 문서 생성 파이프라인 |
| P1 | `.claude/workflows/INCIDENT_PLAYBOOK.md` | 장애 대응 |
| P1 | `.claude/workflows/PRD_GUIDE.md` | PRD 가이드 |
| P1 | `.claude/workflows/ERROR_HANDLING_GUIDE.md` | 에러 처리 가이드 |

### Group C: Context (Philosophy)

| Priority | Path | Description |
|----------|------|-------------|
| Root | `CLAUDE.md` | 시스템 헌법 |
| Key | `.claude/context/AI_Playbook.md` | 팀 철학 |

> **다이어그램**: README.md 섹션 1.2 참조

---

## 3. Role별 필수 로딩 문서

| Role/Module | 필수 로딩 문서 | Tools |
|-------------|---------------|-------|
| **Orchestrator** | SYSTEM_MANIFEST, ROLE_ARCHITECTURE(§1-3) | doc-sync, viewer |
| **Leader** | ROLES_DEFINITION(§2), HANDOFF_PROTOCOL, DOCUMENT_PIPELINE, PROJECT_STACK, AI_Playbook | ❌ 없음 |
| **Designer** | ROLES_DEFINITION(§4), DOCUMENT_PIPELINE, DOMAIN_SCHEMA | designer |
| **Coder** | ROLES_DEFINITION(§6), HANDOFF_PROTOCOL, DOMAIN_SCHEMA, CODE_STYLE, TDD_WORKFLOW, ⚠️*ERROR_HANDLING_GUIDE* | coder |
| **Analyzer** | ROLES_DEFINITION(§3), DOMAIN_SCHEMA, DB_ACCESS_POLICY, ANALYSIS_GUIDE | query, profiler |
| **Impl Leader** | ROLES_DEFINITION(§5), VALIDATION_GUIDE | reviewer |

> **범례**: ⚠️*이탤릭* = 보조 참고 (Backstage, 필요 시 JIT 로딩)
> **상세 토폴로지**: README.md 섹션 1.2 참조

---

## 4. Context Mode (Token Diet)

| 모드 | Load (필수) | Drop (제외) |
|------|------------|------------|
| **Planning** | CLAUDE, PROJECT_STACK, ROLES_DEFINITION(§Leader), DOCUMENT_PIPELINE | CODE_STYLE, TDD_WORKFLOW |
| **Coding** | CLAUDE, PROJECT_STACK, ROLES_DEFINITION(§Coder), HANDOFF, CODE_STYLE, TDD_WORKFLOW | DOCUMENT_PIPELINE |
| **Review** | CLAUDE, ROLES_DEFINITION(§ImplLeader), VALIDATION_GUIDE | 기타 (동적 로드) |

### 동적 로딩 (Review Mode)

| 검증 대상 | 추가 로드 |
|----------|----------|
| DB 쿼리 | DOMAIN_SCHEMA, DB_ACCESS_POLICY |
| 코드 | CODE_STYLE, TDD_WORKFLOW |
| 설계 문서 | DOCUMENT_PIPELINE, PRD_GUIDE |

### SSOT 참조 원칙

| 문서 | 역할 | SSOT 원칙 |
|------|------|----------|
| CLAUDE.md | 원칙 선언 | 구체적 규칙 정의 금지 |
| DB_ACCESS_POLICY.md | **SSOT** | 모든 DB 보안 규칙 정의 |
| DOMAIN_SCHEMA.md | 대상 정의 | 처리 방법은 POLICY 참조 |

---

## 5. Tools Registry

| Tool | Version | Owner | 설명 |
|------|---------|-------|------|
| QueryTool | v1.2.0 | Analyzer | SQL 쿼리 실행 |
| CoderTool | v3.0.1 | Coder | 코드 구현 |
| DesignerTool | v2.2.0 | Designer | IA/WF/SDD 생성 |
| DocSyncTool | v2.1.0 | Orchestrator | Notion 동기화 |
| ProfilerTool | v1.2.0 | Analyzer | 프로필 분석 |
| ReviewerTool | v2.0.0 | Impl Leader | 품질 검증 |
| ViewerTool | v1.5.0 | Orchestrator | 웹 뷰어 |

### Role-Tool 권한 매트릭스

> **원칙**: "실행하는 자는 검증하지 않고, 검증하는 자는 실행하지 않는다"

| Role | 허용 Tools | 금지 |
|------|-----------|------|
| Leader | ❌ 없음 | 모든 Tool (전략만 수립) |
| Analyzer | QueryTool, ProfilerTool | CoderTool, DesignerTool |
| Designer | DesignerTool | QueryTool, CoderTool |
| Coder | CoderTool | QueryTool, ReviewerTool |
| Impl Leader | ReviewerTool | CoderTool (검증 전담) |

### 레거시 매핑

| 기존 Agent | 신규 Role | 파일 경로 |
|-----------|----------|----------|
| code-agent | Coder | `orchestrator/agents/code-agent.legacy.js` |
| design-agent | Designer | `orchestrator/agents/design-agent.legacy.js` |
| analysis-agent | Analyzer | `orchestrator/agents/analysis-agent.legacy.js` |
| *(신규)* | Impl Leader | `orchestrator/agents/implementation-leader.js` |

---

## 6. Paths

### Workspace (런타임)

| Path | Description | Status |
|------|-------------|--------|
| `workspace/logs/` | 실행 로그 | Active |
| `workspace/sessions/` | 세션 데이터 | Active |
| `workspace/analysis/` | ~~분석 결과~~ | **Deprecated** → `docs/cases/` |

### Docs (Case-Centric)

| Path | Description |
|------|-------------|
| `docs/cases/{caseId}/` | 통합 산출물 폴더 |
| `docs/cases/{caseId}/PRD.md` | PRD 스냅샷 |
| `docs/cases/{caseId}/analysis/` | 분석 결과 (SQL, JSON) |
| `docs/cases/{caseId}/visuals/` | 시각화 (HTML) |

### PRD 스냅샷 전략

```
.claude/project/PRD.md  ──(Snapshot)──>  docs/cases/{caseId}/PRD.md
```

### Service (코드)

| Path | Description | Role Access |
|------|-------------|-------------|
| `backend/src/` | Express API | ✅ Coder |
| `frontend/src/` | React 프론트 | ✅ Coder |
| `orchestrator/` | 오케스트레이터 | ⚠️ 제한적 |
| `mcp-server/` | MCP 서버 | ✅ Coder |

---

## 7. 문서 작성 규칙

### 섹션 제목 변경 정책

> 다른 문서에서 참조되는 섹션 제목은 **PO 승인 필수**

| 문서 | 참조되는 섹션 |
|------|-------------|
| ROLE_ARCHITECTURE | "Role 정의", "Role-Tool 권한 매트릭스" |
| ROLES_DEFINITION | 각 Role 섹션 (§2~§7) |
| DOMAIN_SCHEMA | "핵심 레거시 스키마" |

### 참조 형식

```markdown
❌ Bad: ROLE_ARCHITECTURE.md 섹션 0 참조
✅ Good: ROLE_ARCHITECTURE.md의 Role 정의 요약 섹션 참조
```

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| CLAUDE.md | 시스템 헌법 |
| ROLE_ARCHITECTURE.md | 시스템 지도 |
| ROLES_DEFINITION.md | Role별 매뉴얼 |
| README.md | 다이어그램 (인간용) |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 5.3.0 | 2025-12-29 | Role-Tool Matrix 적용, Tool 네이밍 통일 (*Tool), Progressive Migration |
| 5.2.1 | 2025-12-29 | §3 보조 참고 문서 범례 추가 (Backstage 일관성) |
| 5.2.0 | 2025-12-29 | 300줄 다이어트: 다이어그램→README.md |
| 5.1.0 | 2025-12-29 | 문서 책임 경계 명확화 |

---

**END OF SYSTEM_MANIFEST.md**
