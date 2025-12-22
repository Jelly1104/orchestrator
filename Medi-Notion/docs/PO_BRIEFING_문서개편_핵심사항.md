# 📋 PO 전달용: 문서/폴더 개편 시 반드시 유지해야 할 핵심 내용

> **작성일**: 2025-12-22
> **작성자**: Document Agent
> **목적**: Orchestrator 중심 개편 시 누락 방지를 위한 핵심 사항 정리

---

## 🎯 요약

현재 분산된 문서 체계에서 **Orchestrator 중심으로 개편** 시, 다음 핵심 내용들이 누락되면 시스템 안정성과 보안에 심각한 문제가 발생합니다.

---

## 1. 🔐 보안 아키텍처 (절대 누락 불가)

### 1.1 4-Layer 보안 체계

| Layer | 역할 | 현재 위치 | 핵심 내용 |
|-------|------|-----------|-----------|
| L1 | Input Validation | `orchestrator/security/input-validator.js` | Path Traversal 차단, 토큰 제한 |
| L2 | Prompt Injection | `leader.js` | DANGEROUS_PATTERNS, 경계 마커 |
| L3 | Output Validation | `subagent.js` | Protected Path 보호 |
| L4 | Audit & Integrity | `utils/audit-logger.js` | 감사 로그, 룰북 해시 검증 |

### 1.2 Protected Path 정의 (ReadOnly)

```
.claude/rules/*       ← CODE_STYLE, DOMAIN_SCHEMA
.claude/workflows/*   ← AGENT_ARCHITECTURE, DOCUMENT_PIPELINE
.claude/context/*     ← AI_Playbook, AI_CONTEXT
```

**⚠️ 위 경로는 어떤 Agent도 수정 불가** → 개편 시 이 원칙 유지 필수

### 1.3 DB 접근 정책

- **SELECT만 허용**, INSERT/UPDATE/DELETE 절대 금지
- 대용량 테이블 (USER_LOGIN 2,267만행, COMMENT 1,826만행) → LIMIT/인덱스 필수

---

## 2. 📂 문서 계층 구조 (Context Mode Loading)

### 2.1 현재 3-Group 체계

| Group | 용도 | 우선순위 | 핵심 문서 |
|-------|------|----------|-----------|
| A: Rules | 제약사항 (Constraints) | P0 | DOMAIN_SCHEMA, CODE_STYLE, DB_ACCESS_POLICY |
| B: Workflows | 프로세스 (How) | P0-P1 | AGENT_ARCHITECTURE, DOCUMENT_PIPELINE |
| C: Context | 철학 (Why) | Root | AI_Playbook, AI_CONTEXT |

### 2.2 Mode별 로딩 전략 (유지 필수)

```yaml
Planning Mode:  Group C + DOCUMENT_PIPELINE
Coding Mode:    Group A (Rules) + TDD_WORKFLOW
Review Mode:    Group A (VALIDATION) + PRD_GUIDE
```

---

## 3. 🤖 Agent 역할 분리 (HITL 체크포인트)

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

## 4. 🗃️ 도메인 스키마 (Legacy 매핑 규칙)

### 4.1 핵심 테이블 매핑

```
개념(Concept)      →  물리(Physical)
─────────────────────────────────────
회원(Member)       →  USERS + USER_DETAIL + USER_CI (1:1:1)
게시글(Article)    →  BOARD_* (Sharding)
댓글(Comment)      →  COMMENT (통합) + BOARD_*_COMMENT
채용공고(Job)      →  CBIZ_RECJOB + CBIZ_RECJOB_MAP
```

### 4.2 레거시 컬럼명 규칙 (Hallucination 방지)

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

## 5. 📄 문서 파이프라인 (역방향 금지)

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

## 6. 🔧 Orchestrator Skills 체계

| Skill | 역할 | 핵심 기능 |
|-------|------|-----------|
| `query-agent` | DB 조회 | SELECT만, LIMIT 자동 추가 |
| `code-agent` | 코드 생성 | HANDOFF.md 기반 구현 |
| `design-agent` | 설계 문서 생성 | IA, SDD, Wireframe |
| `review-agent` | 코드 리뷰 | QUALITY_GATES 검증 |
| `doc-agent` | 문서 관리 | 노션 동기화, 버전 관리 |
| `profile-agent` | 프로파일링 | 사용자 분석 |
| `viewer-agent` | 결과 뷰어 | 웹 기반 결과 표시 |

---

## 7. ⚠️ 개편 시 주의사항

### 7.1 폴더 이름 변경 시

| 변경 대상 | 필요 작업 |
|-----------|-----------|
| `orchestrator/security/*` | 보안 모듈 경로 참조 코드 모두 수정 |
| `.claude/` | SYSTEM_MANIFEST.md의 Document Map 업데이트 |
| `orchestrator/skills/*` | path-validator.js의 INTERNAL_SYSTEM_PATHS 업데이트 |

### 7.2 문서 통합 시

| 통합 대상 | 권장사항 |
|-----------|----------|
| DOMAIN_SCHEMA + DB_ACCESS_POLICY | ❌ 분리 유지 (책임 분리 원칙) |
| AGENT_ARCHITECTURE | ✅ 단일 문서 유지 (Agent 로딩 최적화) |
| CLAUDE.md + AI_Playbook | ❌ 분리 유지 (What vs Why 구분) |

### 7.3 삭제 불가 문서 (Critical)

| 문서 | 이유 |
|------|------|
| **CLAUDE.md** | 시스템 헌법 (Safety Rules) |
| **DOMAIN_SCHEMA.md** | 레거시 매핑 (Source of Truth) |
| **AGENT_ARCHITECTURE.md** | Agent 역할/HITL 정의 |
| **DB_ACCESS_POLICY.md** | 보안 정책 (SELECT만 허용) |
| **SYSTEM_MANIFEST.md** | 문서 주소록 (Context Loading) |

---

## 8. 📊 현재 노션 Active 문서 현황

| 문서 | 버전 | Notion ID |
|------|------|-----------|
| CLAUDE.md | 3.4.1 | 2cc87960-3bef-81de |
| AGENT_ARCHITECTURE.md | 2.1.1 | 2cc87960-3bef-8103 |
| SYSTEM_MANIFEST.md | 2.0.0 | 2d187960-3bef-813a |
| DOMAIN_SCHEMA.md | 1.1.0 | 2cb87960-3bef-801f |
| QUALITY_GATES.md | 1.5.0 | 2cc87960-3bef-8172 |
| INCIDENT_PLAYBOOK.md | 1.2.0 | 2cc87960-3bef-810a |
| DOCUMENT_PIPELINE.md | 1.2.1 | 2cb87960-3bef-803b |
| AI_Playbook.md | 2.0.0 | 2d187960-3bef-811b |
| AI_CONTEXT.md | - | 2cc87960-3bef-817d |
| ERROR_HANDLING_GUIDE.md | - | 2d187960-3bef-81b5 |
| VALIDATION_GUIDE.md | - | 2d187960-3bef-8146 |
| ANALYSIS_GUIDE.md | - | 2d187960-3bef-817e |
| PRD_GUIDE.md | - | 2d187960-3bef-81a1 |
| CODE_STYLE.md | - | 2ca87960-3bef-81c6 |
| TDD_WORKFLOW.md | - | 2cb87960-3bef-8014 |
| DB_ACCESS_POLICY.md | 1.0.0 | 2cb87960-3bef-809a |
| PROJECT_STACK.md | - | 2cc87960-3bef-8040 |
| PRD.md | - | 2ca87960-3bef-801f |

**총 39개 중복 문서 → Deprecated 처리 완료** (2025-12-22)

---

## 9. 🔄 개편 체크리스트

개편 진행 전 아래 항목을 확인하세요:

### Phase 1: 사전 준비
- [ ] 현재 Active 문서 전체 백업
- [ ] 노션 ↔ 로컬 동기화 상태 확인
- [ ] SYSTEM_MANIFEST.md Document Map 스냅샷

### Phase 2: 구조 변경
- [ ] 폴더명 변경 시 path-validator.js 업데이트
- [ ] Protected Path 정의 유지 확인
- [ ] INTERNAL_SYSTEM_PATHS 업데이트

### Phase 3: 문서 이동
- [ ] 정방향 파이프라인 유지 (PRD → SDD → Code)
- [ ] 문서 간 상위/하위 참조 링크 업데이트
- [ ] Context Mode Loading 전략 재검증

### Phase 4: 검증
- [ ] Security Layer 4단계 동작 확인
- [ ] HITL 체크포인트 5개 동작 확인
- [ ] 노션 Active 상태 재확인

---

## 10. 📞 문의

개편 관련 추가 질문 사항은 Document Agent에게 문의하세요.

```
명령어 예시:
- "현재 문서 구조 분석해줘"
- "노션 동기화 상태 확인해줘"
- "특정 문서의 참조 관계 알려줘"
```

---

**END OF PO_BRIEFING_문서개편_핵심사항.md**

*이 문서는 개편 진행 전 반드시 검토해야 할 핵심 내용을 담고 있습니다.*
