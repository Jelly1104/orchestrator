# ATO-System-B

> **Human-in-the-Loop AI Orchestration System**

ATO-System-B는 Leader-SubAgent 협업 구조 기반의 AI 오케스트레이션 시스템입니다.

## 핵심 특징

- **HITL (Human-in-the-Loop)**: 5개 체크포인트에서 사람의 승인 필요
- **Leader-SubAgent 협업**: 리더가 조율하고 서브에이전트가 실행
- **Constitution 기반 문서 체계**: CLAUDE.md를 최상위 헌법으로 하는 계층적 규칙

## 프로젝트 구조

```
ATO-System-B/
├── .claude/                    # AI 에이전트 Constitution 체계
│   ├── SYSTEM_MANIFEST.md      # 시스템 설정 맵 (Control Tower)
│   ├── rules/                  # 제약 사항 (읽기 전용)
│   ├── workflows/              # 프로세스 정의
│   ├── context/                # 팀 철학 및 컨텍스트
│   └── project/                # 프로젝트별 설정
├── orchestrator/               # AI 오케스트레이션 엔진
│   ├── skills/                 # 에이전트 스킬 정의
│   ├── agents/                 # 에이전트 구현
│   └── viewer/                 # 실행 결과 뷰어
├── backend/                    # Express.js API 서버
├── frontend/                   # React 프론트엔드
├── mcp-server/                 # MCP (Model Context Protocol) 서버
├── database/                   # 데이터베이스 스키마
└── CLAUDE.md                   # 팀 공통 헌법 (최상위 문서)
```

## Quick Start (첫 실행)

```bash
# 1. 저장소 클론
git clone https://github.com/Jelly1104/orchestrator.git
cd ATO-System-B

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 API 키 입력

# 3. 전체 의존성 설치
npm install
cd orchestrator && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd mcp-server && npm install && cd ..

# 4. 개발 서버 실행 (터미널 3개 필요)
# 터미널 1: Backend
cd backend && npm run dev

# 터미널 2: Frontend
cd frontend && npm run dev

# 터미널 3: Orchestrator
cd orchestrator && npm start
```

---

## 상세 설정

### 사전 요구사항

- Node.js 18+
- npm 9+
- MySQL 8.0+

### 환경 변수

```bash
# .env 필수 항목
ANTHROPIC_API_KEY=your_api_key      # Claude API
NOTION_API_KEY=your_notion_key      # Notion 연동
DB_HOST=localhost                    # MySQL 호스트
DB_USER=ai_readonly                  # DB 계정 (읽기 전용)
DB_PASSWORD=your_password            # DB 비밀번호
DB_NAME=ato_system                   # 데이터베이스명
```

## Orchestrator 사용법

### PRD 작성

```bash
# PRD 템플릿 위치
docs/cases/<기능명>/PRD.md

# PRD 가이드 참조
.claude/workflows/PRD_GUIDE.md
```

### PRD 기반 실행

```bash
cd orchestrator

# 기본 실행
node index.js --prd ../docs/cases/case1-notice-list/PRD.md "공지사항 목록 구현"

# 옵션
node index.js --prd <PRD경로> "작업 설명"     # PRD 파일 지정
node index.js --task-id <id> "작업 설명"      # 작업 ID 지정
node index.js --no-save "작업 설명"           # dry-run (저장 안함)
node index.js --max-retries 5 "작업 설명"     # 재시도 횟수 (기본: 3)
node index.js --help                          # 도움말
```

### 실행 결과 확인

```bash
# Viewer 실행 (실행 로그 시각화)
cd orchestrator && npm run viewer
# 브라우저: http://localhost:3001
```

---

## 명령어 레퍼런스

### 개발 모드

| 모듈 | 명령어 | 설명 |
|------|--------|------|
| **Frontend** | `cd frontend && npm run dev` | Vite 개발 서버 (HMR) |
| **Backend** | `cd backend && npm run dev` | Express 개발 서버 (tsx watch) |
| **Orchestrator** | `cd orchestrator && npm start` | AI 오케스트레이션 엔진 |
| **MCP Server** | `cd mcp-server && npm start` | 실시간 통신 서버 |
| **Viewer** | `cd orchestrator && npm run viewer` | 실행 결과 뷰어 |

### 테스트

| 모듈 | 명령어 | 설명 |
|------|--------|------|
| **Orchestrator** | `cd orchestrator && npm test` | Vitest 단위 테스트 |
| **Backend** | `cd backend && npm test` | API 테스트 |
| **Coverage** | `npm run test:coverage` | 커버리지 리포트 |

### 빌드

| 모듈 | 명령어 | 설명 |
|------|--------|------|
| **Frontend** | `cd frontend && npm run build` | 프로덕션 빌드 |
| **Backend** | `cd backend && npm run build` | TypeScript 컴파일 |

### 린트

```bash
# Orchestrator
cd orchestrator && npm run lint

# Backend
cd backend && npm run lint
```

## 문서 체계

| 문서 | 역할 |
|------|------|
| `CLAUDE.md` | 팀 공통 헌법 (최상위) |
| `.claude/SYSTEM_MANIFEST.md` | Orchestrator 설정 맵 |
| `.claude/rules/*` | 엄격한 제약 사항 (읽기 전용) |
| `.claude/workflows/*` | 작업 프로세스 정의 |
| `.claude/context/*` | 팀 철학 및 행동 강령 |

## HITL 체크포인트

1. **PRD 보완** - 요구사항 정의 검토
2. **쿼리 검토** - SQL 결과 이상 시 확인
3. **설계 승인** - SDD 생성 후 승인
4. **수동 수정** - Agent 3회 연속 FAIL 시 개입
5. **배포 승인** - 프로덕션 배포 전 승인

## 기술 스택

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL (Legacy)
- **AI**: Claude API (Anthropic)

## 라이선스

Private - 미래전략실 (ATO Team)
