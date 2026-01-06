# Skill-Centric Architecture 리팩토링 계획서

> **문서 버전**: 2.0.0 (Final)
> **작성일**: 2025-12-22
> **작성자**: Document Agent
> **상태**: ✅ **IMPLEMENTED / CLOSED** - 2025-12-22 완료
> **대상**: Product Owner, Tech Lead

---

## 📋 Executive Summary

현재 ATO-System-B 프로젝트는 **Orchestrator 중심의 Skill-Centric Architecture**로 진화하고 있습니다.
이 문서는 폴더 구조 개편, 문서 체계 정비, AI 스킬 고도화를 통합한 **마스터 리팩토링 계획서**입니다.

### 핵심 목표

| 영역 | AS-IS | TO-BE | 효과 |
|------|-------|-------|------|
| 폴더 구조 | 중복 3곳 (218 파일) | 통합 (~150 파일) | 유지보수성 ↑ 30% |
| AI 스킬 활용 | 29% (7개 중 2개) | 100% (7개 전체) | AI 성능 ↑ |
| 문서 체계 | 분산 (39개 중복) | 통합 (18개 Active) | 컨텍스트 효율 ↑ |
| 보안 계층 | 부분 구현 | 4-Layer 완전 구현 | 보안 강화 |

---

## 1. Target Directory Structure (To-Be)

```
ATO-System-B/
├── .claude/               # [Brain] 룰북 & 컨텍스트 (수정 금지 영역)
│   ├── rules/             # DOMAIN_SCHEMA, CODE_STYLE 등 P0 제약
│   ├── workflows/         # AGENT_ARCHITECTURE, PIPELINE 등 프로세스
│   └── context/           # CLAUDE.md, AI_Playbook 등 철학
│
├── orchestrator/          # [Engine] AI Orchestrator Core
│   ├── agents/            # [Actors] 실행 주체 (Role)
│   │   ├── leader.js      # 설계 및 검증자
│   │   ├── subagent.js    # 구현자
│   │   └── analysis.js    # 데이터 분석가
│   ├── skills/            # [Capabilities] 에이전트가 사용하는 도구
│   │   ├── query-agent/   # SQL 생성/검증 (SELECT only, LIMIT 강제)
│   │   ├── code-agent/    # 코드 생성/TDD
│   │   ├── design-agent/  # IA/Wireframe/SDD 생성
│   │   ├── review-agent/  # Quality Gate 검증
│   │   ├── doc-agent/     # Notion 동기화 및 문서 관리
│   │   ├── profile-agent/ # 사용자 프로파일링
│   │   └── viewer-agent/  # 결과 뷰어 연동
│   ├── security/          # [Guardrails] 4-Layer 보안 체계
│   │   ├── input-validator.js
│   │   ├── output-validator.js
│   │   ├── path-validator.js
│   │   └── audit-logger.js
│   ├── state/             # 세션 및 상태 관리
│   ├── docs/              # Orchestrator 관련 문서
│   │   ├── _MASTER_PLAN.md               # ← 이 문서 (마스터)
│   │   ├── _REF_01_PO_BRIEFING.md        # 참조 1: PO 브리핑
│   │   ├── _REF_02_REFACTORING_PROPOSAL.md # 참조 2: 리팩토링 제안
│   │   └── _REF_03_FOLDER_STRUCTURE.md   # 참조 3: 폴더 구조 분석
│   └── orchestrator.js    # Main Entry
│
├── services/              # [Body] 실제 서비스 코드 (통합)
│   ├── backend/           # (구 backend + src/backend 통합)
│   ├── frontend/          # (구 frontend + src/frontend 통합)
│   └── mobile/            # (Future use)
│
├── workspace/             # [Outputs] 산출물 저장소
│   ├── docs/              # PRD, SDD, Design Docs
│   ├── analysis/          # 분석 결과물
│   └── logs/              # 실행 로그
│
└── README.md              # 온보딩 가이드
```

---

## 2. 보안 아키텍처 (4-Layer 체계)

> **출처**: [Implemented_REF_01_PO_BRIEFING_20251222.md](./Implemented_REF_01_PO_BRIEFING_20251222.md) 섹션 1

### 2.1 Layer 구성

| Layer | 역할 | 구현 위치 | 핵심 내용 |
|-------|------|-----------|-----------|
| L1 | Input Validation | `orchestrator/security/input-validator.js` | Path Traversal 차단, 토큰 제한 |
| L2 | Prompt Injection | `agents/leader.js` | DANGEROUS_PATTERNS, 경계 마커 |
| L3 | Output Validation | `agents/subagent.js` | Protected Path 보호 |
| L4 | Audit & Integrity | `utils/audit-logger.js` | 감사 로그, 룰북 해시 검증 |

### 2.2 Protected Path (ReadOnly)

```
.claude/rules/*       ← CODE_STYLE, DOMAIN_SCHEMA
.claude/workflows/*   ← AGENT_ARCHITECTURE, DOCUMENT_PIPELINE
.claude/context/*     ← AI_Playbook, AI_CONTEXT
```

**⚠️ 원칙**: 위 경로는 어떤 Agent도 수정 불가

### 2.3 DB 접근 정책

- **SELECT만 허용**, INSERT/UPDATE/DELETE 절대 금지
- 대용량 테이블 접근 시 LIMIT/인덱스 필수:
  - `USER_LOGIN`: 2,267만행
  - `COMMENT`: 1,826만행

---

## 3. Agent 역할 분리 및 HITL 체크포인트

> **출처**: [Implemented_REF_01_PO_BRIEFING_20251222.md](./Implemented_REF_01_PO_BRIEFING_20251222.md) 섹션 3

### 3.1 역할 정의

| Agent | 역할 | 권한 | 제약 |
|-------|------|------|------|
| **Orchestrator** | 전체 제어 + 보안 게이트웨이 | Rate Limiting, Path 검증 | - |
| **Leader** | 설계자 + 검증자 | `.claude/project/*` 수정 가능 | Prompt Injection 방어 |
| **Sub-agent** | 구현자 (코드 생성) | `src/*`, `tests/*` 수정 가능 | Protected Path 수정 금지 |

### 3.2 Human-in-the-Loop 5개 체크포인트

| # | 체크포인트 | 트리거 조건 |
|---|-----------|-------------|
| 1 | **PRD 보완** | 필수 항목 누락 시 |
| 2 | **쿼리 검토** | SQL 결과 이상 시 (0행, 타임아웃) |
| 3 | **설계 승인** | IA/Wireframe/SDD 생성 후 |
| 4 | **수동 수정** | 3회 연속 Review FAIL |
| 5 | **배포 승인** | 프론트엔드 배포 시 |

---

## 4. Orchestrator Skills 체계

> **출처**: [Implemented_REF_02_REFACTORING_PROPOSAL_20251222.md](./Implemented_REF_02_REFACTORING_PROPOSAL_20251222.md) 섹션 2.2

### 4.1 7개 스킬 정의

| Skill | 역할 | 핵심 기능 | 현재 활용 |
|-------|------|-----------|-----------|
| `query-agent` | DB 조회 | SELECT만, LIMIT 자동 추가 | ⚠️ 부분 |
| `code-agent` | 코드 생성 | HANDOFF.md 기반 구현 | ✅ 사용 |
| `design-agent` | 설계 문서 생성 | IA, SDD, Wireframe | ✅ 사용 |
| `review-agent` | 코드 리뷰 | QUALITY_GATES 검증 | ⚠️ 부분 |
| `doc-agent` | 문서 관리 | 노션 동기화, 버전 관리 | ⚠️ 부분 |
| `profile-agent` | 프로파일링 | 사용자 분석 | ❌ 미사용 |
| `viewer-agent` | 결과 뷰어 | 웹 기반 결과 표시 | ❌ 미사용 |

### 4.2 스킬 고도화 목표

```
AS-IS                           TO-BE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
각 Agent가 개별 스킬 로드      →  Orchestrator 중앙 관리
LeaderAgent 스킬 미사용        →  review-agent 스킬 연동
viewer-agent 미활용            →  React Viewer AI 기능 연동
하드코딩된 프롬프트            →  동적 스킬 기반 프롬프트
활용률 29%                     →  활용률 100%
```

---

## 5. 문서 파이프라인 (역방향 금지)

> **출처**: [Implemented_REF_01_PO_BRIEFING_20251222.md](./Implemented_REF_01_PO_BRIEFING_20251222.md) 섹션 5

### 5.1 정방향 흐름만 허용

```
PRD → IA/Wireframe → SDD → API Spec → TDD Spec → Code
       ────────────────────────────────────────────→
```

### 5.2 역방향 금지 (문서 변조로 간주)

| 금지 패턴 | 이유 |
|-----------|------|
| Code → SDD 수정 | ❌ 문서 변조 |
| Code → PRD 수정 | ❌ 요구사항 조작 |
| 구현 → 설계 변경 | ❌ Leader 승인 필요 |

---

## 6. 레거시 매핑 규칙 (Hallucination 방지)

> **출처**: [Implemented_REF_01_PO_BRIEFING_20251222.md](./Implemented_REF_01_PO_BRIEFING_20251222.md) 섹션 4

### 6.1 핵심 테이블 매핑

```
개념(Concept)      →  물리(Physical)
─────────────────────────────────────
회원(Member)       →  USERS + USER_DETAIL + USER_CI (1:1:1)
게시글(Article)    →  BOARD_* (Sharding)
댓글(Comment)      →  COMMENT (통합) + BOARD_*_COMMENT
채용공고(Job)      →  CBIZ_RECJOB + CBIZ_RECJOB_MAP
```

### 6.2 레거시 컬럼명 규칙

```sql
-- ✅ 올바른 사용
U_KIND = 'DOC001'        -- (NOT KIND_CODE)
U_ALIVE = 'Y'            -- (NOT ACTIVE_FLAG)
U_MAJOR_CODE_1           -- (NOT MAJOR_CODE)
CTG_CODE                 -- (NOT SVC_CODE)

-- ❌ AI가 추측하면 안 되는 컬럼
MAJOR_CODE, WORK_TYPE_CODE, CMT_IDX 등 존재하지 않음
```

---

## 7. 실행 과제 (Action Items)

> **출처**: [Implemented_REF_02_REFACTORING_PROPOSAL_20251222.md](./Implemented_REF_02_REFACTORING_PROPOSAL_20251222.md) 섹션 3, [Implemented_REF_03_FOLDER_STRUCTURE_20251222.md](./Implemented_REF_03_FOLDER_STRUCTURE_20251222.md) 섹션 6

### Phase 1: 레거시 정리 (0.5일)

| 작업 | 대상 | 우선순위 |
|------|------|----------|
| 중복 폴더 삭제 | `src/backend/`, `src/frontend/`, `src/analysis/` | **High** |
| 레거시 테스트 정리 | 루트 `tests/` 분산 | Medium |
| 채팅 로그 삭제 | `2025-*.md` 파일들 | Low |

### Phase 2: 폴더 이동/통합 (0.5일)

| 작업 | From | To |
|------|------|-----|
| Features 이동 | `src/features/` | `services/frontend/src/features/` |
| Sessions 이동 | 루트 `sessions/` | `orchestrator/state/sessions/` |
| Docs 통합 | 분산된 문서들 | `orchestrator/docs/` 계층화 |

### Phase 3: 스킬 고도화 (2일)

| 작업 | 설명 | 우선순위 |
|------|------|----------|
| LeaderAgent 스킬 연동 | `review-agent` 스킬 통합 | **High** |
| Orchestrator 스킬 레지스트리 | 중앙 관리 체계 구축 | **High** |
| viewer-agent 활용 | React Viewer AI 기능 연동 | Medium |

### Phase 4: 보안 강화 (1일)

| 작업 | 설명 | 우선순위 |
|------|------|----------|
| path-validator 업데이트 | INTERNAL_SYSTEM_PATHS 수정 | **Critical** |
| Protected Path 검증 | 읽기 전용 속성 확인 | **Critical** |
| 감사 로그 강화 | 4-Layer 로깅 완성 | High |

### Phase 5: 검증 및 문서화 (1일)

| 작업 | 설명 |
|------|------|
| Security Layer 테스트 | 4단계 동작 확인 |
| HITL 체크포인트 테스트 | 5개 동작 확인 |
| 노션 동기화 확인 | Active 상태 재확인 |
| SYSTEM_MANIFEST 업데이트 | Document Map 동기화 |

---

## 8. 삭제 불가 문서 (Critical)

> **출처**: [Implemented_REF_01_PO_BRIEFING_20251222.md](./Implemented_REF_01_PO_BRIEFING_20251222.md) 섹션 7.3

| 문서 | 이유 | Notion ID |
|------|------|-----------|
| **CLAUDE.md** | 시스템 헌법 (Safety Rules) | 2cc87960-3bef-81de |
| **DOMAIN_SCHEMA.md** | 레거시 매핑 (Source of Truth) | 2cb87960-3bef-801f |
| **AGENT_ARCHITECTURE.md** | Agent 역할/HITL 정의 | 2cc87960-3bef-8103 |
| **DB_ACCESS_POLICY.md** | 보안 정책 (SELECT만 허용) | 2cb87960-3bef-809a |
| **SYSTEM_MANIFEST.md** | 문서 주소록 (Context Loading) | 2d187960-3bef-813a |

---

## 9. 참조 문서 (Reference Documents)

이 마스터 문서는 다음 하위 문서들을 기반으로 작성되었습니다:

| 참조 ID | 문서명 | 역할 | 원본 위치 |
|---------|--------|------|-----------|
| REF_01 | [Implemented_REF_01_PO_BRIEFING_20251222.md](./Implemented_REF_01_PO_BRIEFING_20251222.md) | PO 전달용 핵심 사항 | docs/ |
| REF_02 | [Implemented_REF_02_REFACTORING_PROPOSAL_20251222.md](./Implemented_REF_02_REFACTORING_PROPOSAL_20251222.md) | 폴더 구조 + 스킬 고도화 제안 | orchestrator/docs/ |
| REF_03 | [Implemented_REF_03_FOLDER_STRUCTURE_20251222.md](./Implemented_REF_03_FOLDER_STRUCTURE_20251222.md) | 현재 폴더 구조 분석 | orchestrator/docs/ |

### 문서 계층 구조

```
Implemented_SKILL_CENTRIC_REFACTORING_PLAN_20251222.md  ← Master Document (이 문서)
├── Implemented_REF_01_PO_BRIEFING_20251222.md         ← 보안/HITL/문서 핵심 (PO 전달용)
├── Implemented_REF_02_REFACTORING_PROPOSAL_20251222.md ← 기술적 제안 (개발팀용)
└── Implemented_REF_03_FOLDER_STRUCTURE_20251222.md    ← 현황 분석 (참고용)
```

---

## 10. 승인란

| 역할 | 이름 | 서명 | 날짜 |
|------|------|------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Document Agent | AI | ✅ | 2025-12-22 |

---

**END OF SKILL_CENTRIC_REFACTORING_PLAN.md**

*이 문서는 Orchestrator 중심의 Skill-Centric Architecture 리팩토링의 마스터 계획서입니다.*
