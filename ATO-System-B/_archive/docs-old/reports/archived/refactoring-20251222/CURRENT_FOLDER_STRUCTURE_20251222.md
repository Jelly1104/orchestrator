# ATO-System-B 현재 폴더 구조

> **문서 버전**: 1.1.0
> **작성일**: 2025-12-22
> **최종 수정**: 2025-12-22 (Clean Sweep 완료)
> **상태**: Active (레거시 정리 완료)
> **관련 문서**: [Implemented_SKILL_CENTRIC_REFACTORING_PLAN_20251222.md](./Implemented_SKILL_CENTRIC_REFACTORING_PLAN_20251222.md)

---

## 1. 전체 구조 개요

```
ATO-System-B/
├── .claude/               # [Brain] AI 룰북 & 컨텍스트 (ReadOnly)
├── orchestrator/          # [Engine] AI Orchestrator Core
├── workspace/             # [Outputs] 산출물 저장소
├── backend/               # [Service] 백엔드 서비스
├── frontend/              # [Service] 프론트엔드 서비스
├── docs/                  # [Docs] 프로젝트 문서
├── database/              # DB 마이그레이션
├── mcp-server/            # MCP 서버 (Notion 연동)
├── scripts/               # 유틸리티 스크립트
└── src/                   # [Minimal] 공유 코드 (todo 피처만 잔존)
```

---

## 2. 핵심 디렉토리 상세

### 2.1 `.claude/` - AI Brain (ReadOnly)

```
.claude/
├── rules/                 # P0 제약사항 (CODE_STYLE, DOMAIN_SCHEMA)
├── workflows/             # 프로세스 정의 (AGENT_ARCHITECTURE, PIPELINE)
├── context/               # AI 컨텍스트 (CLAUDE.md, AI_Playbook)
├── project/               # 프로젝트별 설정
├── state/                 # 상태 관리
├── global/                # 글로벌 설정
│   └── skills/            # 스킬 마스터 정의
└── archive/               # 아카이브된 문서
    ├── doc-integration/
    └── doc-manage/
```

**보안 정책**: 이 디렉토리는 PathValidator에 의해 보호됨 (ReadOnly)

### 2.2 `orchestrator/` - AI Engine Core

```
orchestrator/
├── orchestrator.js        # Main Entry (v4.0.0)
├── index.js               # 외부 export
│
├── agents/                # [Actors] 실행 주체
│   ├── leader.js          # 설계자 + 검증자 (v4.0.0, Skill 연동)
│   ├── subagent.js        # 구현자
│   └── analysis.js        # 데이터 분석가
│
├── skills/                # [Capabilities] 스킬 정의
│   ├── skill-loader.js    # 스킬 로더
│   ├── skill-registry.js  # 스킬 레지스트리 (DI 패턴)
│   ├── query-agent/       # SQL 생성/검증
│   ├── code-agent/        # 코드 생성/TDD
│   ├── design-agent/      # IA/Wireframe/SDD
│   ├── review-agent/      # Quality Gate 검증
│   ├── doc-agent/         # Notion 동기화
│   ├── profile-agent/     # 사용자 프로파일링
│   └── viewer-agent/      # 결과 뷰어 연동
│
├── security/              # [Guardrails] 4-Layer 보안
│   ├── input-validator.js     # L1: 입력 검증
│   ├── path-validator.js      # L2: 경로 검증
│   ├── output-sanitizer.js    # L3: 출력 정제
│   ├── kill-switch.js         # 긴급 중단
│   ├── rate-limiter.js        # 속도 제한
│   ├── sandbox.js             # 샌드박스
│   ├── security-monitor.js    # 보안 모니터
│   └── index.js               # 통합 export
│
├── providers/             # LLM Provider 추상화
│   ├── factory.js         # Provider 팩토리
│   ├── base.js            # 기본 인터페이스
│   ├── anthropic.js       # Claude
│   ├── openai.js          # GPT
│   └── gemini.js          # Gemini
│
├── state/                 # 상태 관리
│   ├── session-store.js   # 세션 저장소 (workspace/ 참조)
│   └── sessions/          # 세션 파일 (심볼릭 링크 대상)
│
├── utils/                 # 유틸리티
│   └── audit-logger.js    # 감사 로그
│
├── config/                # 설정
│   └── feature-flags.js   # 기능 플래그
│
├── metrics/               # 메트릭
│   └── tracker.js         # 추적기
│
├── logs/                  # 로그 (로컬)
│   ├── audit/             # 감사 로그
│   ├── .hitl/             # HITL 승인 로그
│   ├── .feedback/         # 피드백 로그
│   └── .rerun/            # 재실행 로그
│
├── docs/                  # Orchestrator 문서
│   ├── Implemented_SKILL_CENTRIC_REFACTORING_PLAN_20251222.md
│   ├── Implemented_TODO_REFACTORING_CHECKLIST_20251222.md
│   ├── Implemented_REF_01_PO_BRIEFING_20251222.md
│   ├── Implemented_REF_02_REFACTORING_PROPOSAL_20251222.md
│   ├── Implemented_REF_03_FOLDER_STRUCTURE_20251222.md
│   ├── CURRENT_FOLDER_STRUCTURE_20251222.md  ← 이 문서
│   ├── GEMINI_REPORT_E2E_TEST.md
│   └── GEMINI_REPORT_PHASE10.md
│
├── tests/                 # 테스트
│   ├── unit/              # 단위 테스트
│   └── e2e/               # E2E 테스트
│
└── viewer/                # React Viewer
    └── src/               # 소스 코드
```

### 2.3 `workspace/` - 산출물 저장소

```
workspace/
├── analysis/              # 분석 결과물
├── docs/                  # PRD, SDD, Design Docs
├── features/              # 피처별 산출물
│   └── dr-insight/        # Dr.Insight 피처
├── logs/                  # 실행 로그
│   ├── .hitl/             # HITL 승인 로그
│   ├── .feedback/         # 피드백
│   └── .rerun/            # 재실행 로그
└── sessions/              # 세션 데이터
```

**경로 정책**: `ALLOWED_BASE_PATHS`에 등록됨 (읽기/쓰기 허용)

### 2.4 `backend/` - 백엔드 서비스

```
backend/
├── src/
│   ├── repositories/      # 데이터 접근 계층
│   ├── routes/            # API 라우트
│   ├── services/          # 비즈니스 로직
│   └── types/             # TypeScript 타입
└── tests/
    └── unit/              # 단위 테스트
```

### 2.5 `frontend/` - 프론트엔드 서비스

```
frontend/
├── src/
│   ├── components/        # React 컴포넌트
│   ├── services/          # API 클라이언트
│   └── types/             # TypeScript 타입
└── tests/
    └── components/        # 컴포넌트 테스트
```

---

## 3. 스킬 디렉토리 구조 (Skill-Centric)

각 스킬은 동일한 구조를 따릅니다:

```
orchestrator/skills/{skill-name}/
├── SKILL.md               # 스킬 정의 (프롬프트)
├── index.js               # 스킬 구현 (선택)
└── resources/             # 추가 리소스 (선택)
    └── *.md               # 참조 문서
```

### 3.1 7개 스킬 현황

| 스킬 | 버전 | Agent Class | 상태 |
|------|------|-------------|------|
| query-agent | v1.1.0 | ✅ | Ready |
| code-agent | v1.2.0 | ❌ (Prompt Only) | Ready |
| design-agent | v2.1.0 | ✅ | Ready |
| doc-agent | v2.0.0 | ✅ | Ready |
| profile-agent | v1.1.0 | ✅ | Ready |
| review-agent | v1.1.0 | ✅ | Ready |
| viewer-agent | v1.4.0 | ✅ | Ready |

---

## 4. 보안 경로 정책

### 4.1 허용된 기본 경로 (ALLOWED_BASE_PATHS)

```javascript
['.claude/', 'orchestrator/', 'workspace/']
```

### 4.2 내부 시스템 경로 (INTERNAL_SYSTEM_PATHS)

```javascript
[
  'workspace/logs',
  'workspace/sessions',
  'workspace/analysis',
  'workspace/features',
  'workspace/docs'
]
```

### 4.3 차단된 레거시 경로

- `src/` - PathValidator에서 차단 (ALLOWED_BASE_PATHS에서 제외)
- `src/analysis/` - ✅ 삭제 완료
- `src/backend/` - ✅ 삭제 완료 (Clean Sweep)
- `src/frontend/` - ✅ 삭제 완료 (Clean Sweep)
- `src/features/dr-insight/` - ✅ 삭제 완료 (workspace/로 이동됨)
- `tests/` (root) - ✅ 삭제 완료 (Clean Sweep)

---

## 5. 레거시 정리 현황 (Clean Sweep 완료)

| 디렉토리 | 상태 | 비고 |
|----------|------|------|
| `src/backend/` | ✅ **삭제 완료** | 2025-12-22 Clean Sweep |
| `src/frontend/` | ✅ **삭제 완료** | 2025-12-22 Clean Sweep |
| `src/analysis/` | ✅ **삭제 완료** | Pre-Step에서 제거 |
| `src/features/dr-insight/` | ✅ **삭제 완료** | workspace/features/로 이동 완료 |
| `src/features/todo/` | ⚠️ 잔존 | 별도 피처 (이동 검토 필요) |
| `tests/` (루트) | ✅ **삭제 완료** | 2025-12-22 Clean Sweep |

---

## 6. 문서 계층 구조

```
orchestrator/docs/
├── [Master Documents] - 완료/종결
│   ├── Implemented_SKILL_CENTRIC_REFACTORING_PLAN_20251222.md
│   └── Implemented_TODO_REFACTORING_CHECKLIST_20251222.md
│
├── [Reference Documents] - 참조용
│   ├── Implemented_REF_01_PO_BRIEFING_20251222.md
│   ├── Implemented_REF_02_REFACTORING_PROPOSAL_20251222.md
│   └── Implemented_REF_03_FOLDER_STRUCTURE_20251222.md
│
├── [Reports] - 보고서
│   ├── GEMINI_REPORT_E2E_TEST.md
│   └── GEMINI_REPORT_PHASE10.md
│
└── [Active] - 현재 문서
    └── CURRENT_FOLDER_STRUCTURE_20251222.md  ← 이 문서
```

---

## 7. 주요 변경 사항 (Skill-Centric Refactoring)

### 7.1 Pre-Step 변경

| 변경 전 | 변경 후 |
|---------|---------|
| `src/analysis` | `workspace/analysis` |
| `orchestrator/logs` | `workspace/logs` |

### 7.2 Phase 2 & 4 변경

| 변경 전 | 변경 후 |
|---------|---------|
| `orchestrator/state/sessions/` | `workspace/sessions/` |
| `src/features/dr-insight/` | `workspace/features/dr-insight/` |

### 7.3 Phase 3 추가

- `orchestrator/skills/skill-registry.js` (신규)
- `orchestrator/agents/leader.js` v4.0.0 (스킬 연동)
- `orchestrator/orchestrator.js` v4.0.0 (DI 패턴)

---

## 8. 권장 사항

### 8.1 단기 (백로그)

1. `src/backend/`, `src/frontend/` 레거시 통합
2. 루트 `tests/` 분산
3. 채팅 로그 정리 (`2025-*.md`)

### 8.2 중기

1. viewer-agent AI 기능 활성화
2. Audit Logger 강화
3. SYSTEM_MANIFEST 동기화

---

**END OF CURRENT_FOLDER_STRUCTURE_20251222.md**

*이 문서는 Phase 5 검증 완료 후 ATO-System-B 프로젝트의 현재 폴더 구조를 정의합니다.*
*작성일: 2025-12-22*
