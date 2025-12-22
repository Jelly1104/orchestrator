# Medi-Notion 폴더 구조 분석

**작성일**: 2025-12-22
**목적**: 폴더 정리를 위한 현재 구조 파악

---

## 1. 전체 구조 개요

```
Medi-Notion/
├── .claude/                    # Claude 설정 및 문서
├── backend/                    # 백엔드 (Express/TypeScript) - 중복 의심
├── docs/                       # 설계 문서 (Cases, PRD, Architecture)
├── frontend/                   # 프론트엔드 - 중복 의심
├── mcp-server/                 # MCP 서버
├── orchestrator/               # ⭐ 핵심: AI Orchestrator
├── scripts/                    # 유틸리티 스크립트
├── src/                        # ❌ 중복: 레거시 코드
└── tests/                      # ❌ 중복: 레거시 테스트
```

---

## 2. 핵심 폴더 상세

### 2.1 `orchestrator/` - AI Orchestrator (⭐ 핵심)

```
orchestrator/
├── agents/                     # AI 에이전트들
│   ├── leader.js              # LeaderAgent (메인 컨트롤러)
│   ├── subagent.js            # SubAgent (코딩 실행)
│   ├── analysis-agent.js      # 분석 에이전트
│   ├── code-agent.js          # 코드 생성 에이전트
│   ├── design-agent.js        # 설계 에이전트
│   ├── prd-analyzer.js        # PRD 분석
│   ├── profile-agent.js       # 프로필 분석
│   ├── query-agent.js         # SQL 쿼리 생성
│   ├── feedback-loop.js       # 피드백 루프
│   └── output-validator.js    # 출력 검증
│
├── config/                     # 설정
│   ├── feature-flags.js       # 피쳐 플래그 (HITL 등)
│   └── notion-mapping.json    # Notion 동기화 매핑
│
├── providers/                  # LLM 프로바이더
│   ├── anthropic.js           # Claude API
│   ├── openai.js              # OpenAI API
│   ├── gemini.js              # Gemini API
│   ├── factory.js             # 프로바이더 팩토리
│   └── base.js                # 베이스 클래스
│
├── security/                   # 보안 레이어
│   ├── input-validator.js     # 입력 검증
│   ├── output-sanitizer.js    # 출력 새니타이징
│   ├── path-validator.js      # 경로 검증
│   ├── rate-limiter.js        # 속도 제한
│   ├── sandbox.js             # 샌드박스
│   ├── kill-switch.js         # 킬 스위치
│   └── security-monitor.js    # 보안 모니터
│
├── skills/                     # 에이전트 스킬 (모듈화)
│   ├── skill-loader.js        # 스킬 로더
│   ├── code-agent/
│   ├── design-agent/
│   ├── doc-agent/             # 문서 동기화
│   ├── profile-agent/
│   ├── query-agent/
│   ├── review-agent/
│   └── viewer-agent/
│
├── state/                      # 상태 관리
│   ├── session-store.js       # 세션 스토어 (HITL)
│   └── sessions/              # 세션 JSON 파일
│
├── utils/                      # 유틸리티
│   ├── document-manager.js    # 문서 관리
│   ├── notion-sync.js         # Notion 동기화
│   ├── handoff-validator.js   # 핸드오프 검증
│   ├── audit-logger.js        # 감사 로깅
│   └── rulebook-validator.js  # 룰북 검증
│
├── viewer/                     # ⭐ React 뷰어 (Vite)
│   ├── server.js              # Express 서버
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── Dashboard.tsx
│       │   ├── HITLPanel.tsx  # HITL 승인 UI
│       │   ├── TaskList.tsx
│       │   └── ...
│       ├── hooks/
│       └── types/
│
├── tests/                      # 테스트
│   ├── e2e/                   # E2E 테스트
│   │   ├── hitl_flow.test.js
│   │   └── hitl_flow_runner.js
│   └── unit/
│       └── session-store.test.js
│
├── docs/                       # Orchestrator 문서
│   ├── GEMINI_REPORT_E2E_TEST.md
│   └── GEMINI_REPORT_PHASE10.md
│
├── orchestrator.js             # 메인 엔트리포인트
├── cli.js                      # HITL CLI 도구
├── index.js                    # 모듈 export
└── package.json
```

### 2.2 `.claude/` - Claude 설정

```
.claude/
├── global/                     # 전역 규칙 문서
│   ├── AGENT_ARCHITECTURE.md  # 에이전트 아키텍처
│   ├── DOMAIN_SCHEMA.md       # 도메인 스키마
│   ├── ERROR_HANDLING_GUIDE.md
│   ├── TDD_WORKFLOW.md
│   ├── VALIDATION_GUIDE.md
│   └── skills/
│       └── doc-manage/
│
├── doc-integration/            # 문서 통합 (As-Is/To-Be)
│   ├── 01-Constitution/
│   ├── 02-PRD/
│   ├── 03-Validation/
│   ├── 04-Analysis/
│   ├── 05-ErrorHandling/
│   └── 06-Architecture/
│
├── project/                    # 프로젝트 문서
│   ├── PRD.md
│   └── PROJECT_STACK.md
│
└── state/                      # 상태
    └── handoff-status.json
```

### 2.3 `docs/` - 설계 문서

```
docs/
├── architecture/               # 아키텍처 문서
│   ├── A2A_INTEGRATION_PROPOSAL.md
│   └── MIXED_PIPELINE_V2_DESIGN.md
│
├── cases/                      # 케이스별 설계
│   ├── v1_basic/              # 기본 케이스
│   │   ├── case0-welcome-alert/
│   │   ├── case1-notice-list/
│   │   └── case2-notification/
│   ├── v2_complex/            # 복잡한 케이스
│   │   └── case3-dr-insight/
│   └── v3_analysis/           # 분석 케이스
│       ├── case4-analysis/
│       └── case5-dormancy/
│
├── prd/                        # PRD 문서
│   └── job-recommendation-agent.md
│
└── task-*/                     # 자동 생성된 태스크 문서
```

---

## 3. ❌ 중복/정리 필요 폴더

### 3.1 `src/` - 레거시 코드 (중복)

```
src/                            # ❌ 정리 필요
├── backend/                   # → backend/ 와 중복
├── frontend/                  # → frontend/ 와 중복
├── features/
│   └── dr-insight/            # Case3 관련 (유지 or 이동?)
├── components/                # 루트 컴포넌트
├── services/
├── types/
└── api/
```

**권장**: `src/` 폴더 전체를 정리하거나 `backend/`, `frontend/`로 통합

### 3.2 `backend/` vs `src/backend/`

| 폴더 | 내용 | 권장 |
|------|------|------|
| `backend/` | Express 서버, 라우트 | ✅ 유지 |
| `src/backend/` | 중복 코드 | ❌ 삭제 또는 병합 |

### 3.3 `frontend/` vs `src/frontend/`

| 폴더 | 내용 | 권장 |
|------|------|------|
| `frontend/` | Dashboard 등 | ✅ 유지 |
| `src/frontend/` | 중복 코드 | ❌ 삭제 또는 병합 |

### 3.4 `tests/` - 루트 레벨 테스트 (정리 필요)

```
tests/                          # ❌ 분산됨
├── notification.test.ts       # → backend/tests/로 이동?
└── features/                  # → 해당 모듈로 이동?
```

---

## 4. 정리 권장 사항

### 4.1 폴더 통합

```bash
# 1. src/backend → backend 로 병합
# 2. src/frontend → frontend 로 병합
# 3. src/features → frontend/src/features 로 이동
# 4. 루트 tests/ → 각 모듈의 tests/로 분산
```

### 4.2 삭제 후보

| 폴더/파일 | 이유 |
|-----------|------|
| `src/backend/` | `backend/` 와 중복 |
| `src/frontend/` | `frontend/` 와 중복 |
| `src/__tests__/` | 테스트 분산 |
| `2025-12-20-chat.md` | 대화 로그 (불필요) |
| `2025-12-22-chat.md` | 대화 로그 (불필요) |
| `sessions/` (루트) | `orchestrator/state/sessions/`로 이동 |

### 4.3 권장 최종 구조

```
Medi-Notion/
├── .claude/                    # ✅ Claude 설정
├── backend/                    # ✅ 백엔드 통합
│   ├── src/
│   └── tests/
├── frontend/                   # ✅ 프론트엔드 통합
│   ├── src/
│   │   └── features/          # dr-insight 등 이동
│   └── tests/
├── docs/                       # ✅ 설계 문서
├── mcp-server/                 # ✅ MCP 서버
├── orchestrator/               # ✅ AI Orchestrator
│   ├── agents/
│   ├── providers/
│   ├── security/
│   ├── skills/
│   ├── state/
│   ├── viewer/
│   └── tests/
└── scripts/                    # ✅ 유틸리티
```

---

## 5. 파일 통계

| 카테고리 | 파일 수 | 비고 |
|----------|---------|------|
| `.claude/` | 26 | 문서 |
| `backend/` | 14 | 백엔드 |
| `docs/` | 32 | 설계 문서 |
| `frontend/` | 10 | 프론트엔드 |
| `orchestrator/` | 78 | 핵심 |
| `src/` (레거시) | 48 | 정리 필요 |
| 기타 | 10 | 설정 등 |
| **총계** | ~218 | - |

---

## 6. 정리 우선순위

1. **High**: `src/backend/`, `src/frontend/` 중복 제거
2. **Medium**: `src/features/` → `frontend/src/features/` 이동
3. **Low**: 루트 `tests/` 분산
4. **Optional**: 대화 로그 파일 삭제

---

**문서 끝**
