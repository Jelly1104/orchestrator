# ATO-System-B

> **Human-in-the-Loop AI Orchestration System**
> **Version**: 5.0.0 | **Updated**: 2026-01-06

ATO-System-B는 Leader-Role 협업 구조 기반의 AI 오케스트레이션 시스템입니다.

## 핵심 특징

- **HITL (Human-in-the-Loop)**: 검증 실패 시에만 3-way 옵션으로 개입
- **6개 파이프라인**: analysis, design, analyzed_design, code, ui_mockup, full
- **Role 기반 협업**: Leader가 전략 수립, Role별 실행 (Analyzer, Designer, Coder)
- **Constitution 기반 문서 체계**: CLAUDE.md를 최상위 헌법으로 하는 계층적 규칙

## 프로젝트 구조

```
ATO-System-B/
├── CLAUDE.md                       # 팀 공통 헌법 (최상위 문서)
├── .claude/                        # Constitution 체계
│   ├── SYSTEM_MANIFEST.md          # 시스템 설정 맵 (Control Tower)
│   ├── rules/                      # 제약 사항 (DB 정책, 코드 스타일 등)
│   ├── workflows/                  # Role/Pipeline/HITL 정의
│   ├── context/                    # 팀 철학 (AI_Playbook.md)
│   ├── skills/                     # Claude Code 스킬 정의
│   ├── templates/                  # 문서 템플릿
│   └── project/                    # 프로젝트별 설정 (PRD, PROJECT_STACK)
├── orchestrator/                   # 오케스트레이션 엔진
│   ├── agents/                     # Role 구현 (leader, analyzer, designer, coder)
│   ├── tools/                      # 도구 (query, designer, coder, reviewer, doc-sync)
│   ├── providers/                  # LLM 프로바이더 (anthropic, openai)
│   ├── security/                   # 보안 (rate-limiter, kill-switch, input-validator)
│   ├── state/                      # 세션/상태 관리
│   ├── utils/                      # 유틸리티
│   ├── tests/                      # 테스트
│   └── viewer/                     # 실행 결과 웹 뷰어
├── docs/                           # 문서
│   ├── cases/                      # 케이스별 산출물
│   ├── reports/                    # 개발 리포트
│   └── architecture/               # 아키텍처 문서
└── workspace/                      # 런타임 산출물 (Git 제외)
```

## Quick Start

```bash
# 1. 저장소 클론
git clone <repository-url>
cd ATO-System-B

# 2. 환경 변수 설정
cp orchestrator/.env.example orchestrator/.env
# .env 파일에 API 키 입력

# 3. 의존성 설치
cd orchestrator && npm install

# 4. Orchestrator 실행
node index.js --prd <PRD경로> "작업 설명"
```

## 파이프라인 타입 (6개)

| 타입 | Phase | 설명 | 사용 케이스 |
|------|-------|------|-------------|
| `analysis` | A | DB 분석 → SQL 리포트 | 데이터 분석 |
| `design` | B | IA/Wireframe/SDD 생성 | UI/UX 설계 |
| `analyzed_design` | A→B | 분석 후 설계 | 데이터 기반 UX |
| `code` | C | HANDOFF 기반 코드 구현 | SDD 있을 때 코딩만 |
| `ui_mockup` | B→C | 설계 후 UI 코드 생성 | Wireframe → React |
| `full` | A→B→C | 전체 파이프라인 | 처음부터 끝까지 |

### CLI 사용법

```bash
cd orchestrator

# 기본 실행 (PRD에서 파이프라인 자동 추론)
node index.js --prd ../docs/cases/case1/PRD.md "작업 설명"

# 파이프라인 명시
node index.js --prd PRD.md --pipeline design "UI 설계"
node index.js --prd PRD.md --pipeline analysis "데이터 분석"
node index.js --prd PRD.md --pipeline full "전체 워크플로우"

# 옵션
node index.js --task-id my-task "작업 설명"    # Task ID 지정
node index.js --no-save "작업 설명"            # dry-run
node index.js --max-retries 5 "작업 설명"      # 재시도 횟수
node index.js --help                           # 도움말
```

## Phase 정의

| Phase | 이름 | Role | Tools | 산출물 |
|-------|------|------|-------|--------|
| **A** | Analysis | Analyzer | query, profiler | SQL, 분석 리포트 |
| **B** | Design | Designer | designer | IA.md, Wireframe.md, SDD.md |
| **C** | Implementation | Coder | coder | 소스 코드 |
| **D** | Security | Orchestrator | - | 입력 검증, 보안 |

## HITL 체크포인트

검증 실패 시에만 HITL이 트리거되며, 3-way 옵션을 제공합니다:

| 옵션 | 동작 |
|------|------|
| **Exception Approval** | 이번 건만 예외 허용 |
| **Rule Override** | 규칙 수정 요청 |
| **Reject** | 해당 Phase 재작업 |

```bash
# HITL 결정 (검증 실패 시)
node index.js --task-id <id> --decision EXCEPTION_APPROVAL
node index.js --task-id <id> --decision REJECT --comment "수정 필요"
```

## 산출물 경로

```
docs/cases/{caseId}/                    # 케이스 단위 (기본)
docs/cases/{caseId}/{taskId}/           # 태스크 단위 (선택)

# 구조
{caseId}/ 또는 {caseId}/{taskId}/
├── PRD.md              # 요구사항 정의
├── HANDOFF.md          # Leader → Role 업무 지시서
├── IA.md               # 정보 구조
├── Wireframe.md        # 화면 설계
├── SDD.md              # 기술 설계
└── analysis/           # 분석 결과
    ├── *.sql           # SQL 쿼리
    ├── *.json          # 쿼리 결과
    └── analysis_report.md  # 분석 리포트
```

> 동일 케이스에서 여러 태스크 실행 시 `{taskId}` 하위 폴더로 분리됩니다.

## Viewer (실행 결과 시각화)

```bash
cd orchestrator && npm run viewer
# 브라우저: http://localhost:3001
```

## 환경 변수

```bash
# orchestrator/.env
ANTHROPIC_API_KEY=your_api_key      # Claude API (필수)
OPENAI_API_KEY=your_openai_key      # GPT Fallback (선택)
DB_HOST=localhost                    # MySQL 호스트
DB_USER=ai_readonly                  # DB 계정 (읽기 전용)
DB_PASSWORD=your_password            # DB 비밀번호
DB_NAME=medigate                     # 데이터베이스명
```

## 문서 체계

| 문서 | 역할 |
|------|------|
| `CLAUDE.md` | 팀 공통 헌법 (최상위) |
| `.claude/SYSTEM_MANIFEST.md` | 시스템 설정 맵 |
| `.claude/workflows/ROLE_ARCHITECTURE.md` | Role/Phase/Pipeline 정의 |
| `.claude/workflows/ROLES_DEFINITION.md` | Role별 시스템 프롬프트 |
| `.claude/rules/*` | 제약 사항 (DB 정책, 코드 스타일 등) |

## 기술 스택

- **Runtime**: Node.js 18+
- **AI**: Claude API (Anthropic), OpenAI GPT (Fallback)
- **Database**: MySQL (읽기 전용)
- **Viewer**: Express + React + Tailwind

## 라이선스

Private - 미래전략실 (ATO Team)
