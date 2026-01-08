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
│   ├── README.md                   # 상세 아키텍처 문서 ⭐
│   ├── rules/                      # 제약 사항 (DB 정책, 코드 스타일 등)
│   ├── workflows/                  # Role/Pipeline/HITL 정의
│   ├── context/                    # 팀 철학 (AI_Playbook.md)
│   ├── skills/                     # Claude Code Extension 스킬 정의
│   ├── templates/                  # 문서 템플릿 (SSOT)
│   └── project/                    # 프로젝트별 설정 (PRD, PROJECT_STACK)
├── orchestrator/                   # 오케스트레이션 엔진
│   ├── README.md                   # Orchestrator 상세 문서 ⭐
│   ├── agents/                     # Role 구현
│   ├── tools/                      # 도구 (query, designer, coder 등)
│   └── providers/                  # LLM 프로바이더
├── docs/cases/                     # 케이스별 산출물
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

# 3. 의존성 설치 및 실행
cd orchestrator && npm install
node index.js --prd <PRD경로> "작업 설명"
```

> **상세 실행법**: [orchestrator/README.md](orchestrator/README.md) 참조

## 파이프라인 타입 (6개)

| 타입 | Phase | 설명 | Skill 순서 |
|------|-------|------|------------|
| `analysis` | A | DB 분석 → SQL 리포트 | leader → profiler → query → reviewer |
| `design` | B | IA/Wireframe/SDD 생성 | leader → designer → reviewer |
| `code` | C | HANDOFF 기반 코드 구현 | leader → coder → imleader |
| `analyzed_design` | A→B | 분석 후 설계 | leader → profiler → query → designer → reviewer |
| `ui_mockup` | B→C | 설계 후 UI 코드 생성 | leader → designer → coder → imleader |
| `full` | A→B→C | 전체 파이프라인 | leader → profiler → query → designer → coder → imleader |

## 사용 방법

### CLI (Orchestrator)

```bash
cd orchestrator
node index.js --prd ../docs/cases/case1/PRD.md "작업 설명"
```

> **CLI 옵션, 환경 변수, Provider 설정**: [orchestrator/README.md](orchestrator/README.md) 섹션 7-8 참조

### Extension (Claude Code)

```
/leader PRD.md 기반으로 HANDOFF.md 생성해줘
/designer HANDOFF.md 기반으로 IA.md, Wireframe.md, SDD.md 생성해줘
/coder SDD.md 기반으로 React 컴포넌트 구현해줘
/imleader 코드 검증해줘 (빌드/엔트리포인트/구동)
```

> **Extension Skills 상세**: [orchestrator/README.md](orchestrator/README.md) 섹션 11 참조

## 문서 체계

| 문서 | 역할 |
|------|------|
| `CLAUDE.md` | 팀 공통 헌법 (최상위) |
| `.claude/README.md` | 상세 아키텍처 (Role, Phase, 다이어그램) |
| `.claude/SYSTEM_MANIFEST.md` | 시스템 설정 맵 |
| `orchestrator/README.md` | Orchestrator 실행 가이드, Skills |

## 기술 스택

- **Runtime**: Node.js 18+
- **AI**: Claude API (Primary), OpenAI GPT (Fallback)
- **Database**: MySQL (읽기 전용)

## 라이선스

Private - 미래전략실 (ATO Team)
