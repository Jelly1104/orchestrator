# Role-Skill-Protocol 폴더 트리 구조

> **버전**: 4.0.0 | **작성일**: 2026-01-09
> **프로토콜명**: Role-Skill-Protocol
> **변경사항**: runs/ 도입, config/ YAML+Markdown 하이브리드, Publish 단계 필수화, input/output/review 패턴

---

## 설계 원칙

| 원칙 | 설명 |
|------|------|
| **Run-based History** | 모든 작업은 `runs/{run-id}/`에 로그로 기록됨 (LangGraph 패턴) |
| **Config as Code** | Role/Task 정의는 YAML로, 상세 설명은 Markdown 참조 (CrewAI 패턴) |
| **Publish Required** | Run 완료 시 산출물을 `docs/` 또는 `apps/`로 발행 필수 |
| **Input/Output/Review** | 모든 Task는 `input.json` + `output/` + `review.md` 구조 |

---

## 폴더 트리 구조

```
github.com/strategy-ai-lab/                    # 🏢 Organization

# ═══════════════════════════════════════════════════════════════════════════════
# 1️⃣ 전역 룰북 레포 (모든 프로젝트 공통) - Git Submodule로 참조
# ═══════════════════════════════════════════════════════════════════════════════
├── role-skill-protocol/                       # 📚 전역 룰북 레포
│   │
│   ├── rules/                                 # 정적 규칙 (불변)
│   │   ├── CODE_STYLE.md                      # 코딩 컨벤션
│   │   ├── TDD_WORKFLOW.md                    # 테스트 주도 개발
│   │   ├── DB_ACCESS_POLICY.md                # DB 접근 정책
│   │   ├── TEMP_FILE_POLICY.md                # 임시 파일 정책
│   │   └── VALIDATION_GUIDE.md                # 검증 가이드
│   │
│   ├── workflows/                             # 프로세스 정의
│   │   ├── DOCUMENT_PIPELINE.md               # 문서 파이프라인
│   │   └── ROLE_ARCHITECTURE.md               # Role 아키텍처
│   │
│   ├── roles/                                 # ⭐ Role 정의 (Markdown)
│   │   ├── ROLES_DEFINITION.md                # Role 전체 개요
│   │   ├── leader.md                          # Leader Role 상세
│   │   ├── analyzer.md                        # Analyzer Role 상세
│   │   ├── designer.md                        # Designer Role 상세
│   │   ├── coder.md                           # Coder Role 상세
│   │   └── imleader.md                        # ImLeader Role 상세
│   │
│   ├── templates/                             # 템플릿
│   │   ├── .gitignore.template
│   │   ├── .env.example.template
│   │   ├── HANDOFF.template.md                # HANDOFF 템플릿
│   │   ├── input.template.json                # Task Input 템플릿
│   │   └── review.template.md                 # Review 템플릿
│   │
│   └── config/                                # ⭐ YAML Config (Markdown 참조)
│       ├── agents.yaml                        # Role → Markdown 매핑
│       └── tasks.yaml                         # Task 타입 정의

# ═══════════════════════════════════════════════════════════════════════════════
# 2️⃣ 프로젝트 레포 (고객사별 독립)
# ═══════════════════════════════════════════════════════════════════════════════
└── {project-name}/                            # 예: medigate-ato, fintech-payment
    │
    # ───────────────────────────────────────────────────────────────────────────
    # 🔷 프로젝트 설정 (.claude/)
    # ───────────────────────────────────────────────────────────────────────────
    ├── .claude/
    │   ├── rulebook/                          # [submodule] → role-skill-protocol/
    │   ├── CLAUDE.md                          # 프로젝트 진입점 (rulebook 참조)
    │   └── project/                           # 프로젝트 오버라이드
    │       ├── PROJECT_STACK.md               # 기술스택 (React/Vue, Node/Spring 등)
    │       └── DOMAIN_SCHEMA.md               # DB스키마 (테이블/컬럼 정의)
    │
    # ───────────────────────────────────────────────────────────────────────────
    # 🔷 서비스 계층 (services/)
    # ───────────────────────────────────────────────────────────────────────────
    ├── services/
    │   │
    │   └── {service-name}/                    # 예: community, recruitment, marketing
    │       │
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       # 📦 코드 (apps/) - 최종 발행된 코드만 위치
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       ├── apps/
    │       │   ├── web/                       # Frontend
    │       │   │   └── src/
    │       │   │       ├── features/
    │       │   │       │   └── {feature-name}/        # 예: daily-best, comments
    │       │   │       │       ├── components/
    │       │   │       │       ├── hooks/
    │       │   │       │       └── index.ts
    │       │   │       └── mocks/
    │       │   │           └── {feature-name}.mock.ts # Fixture (발행됨)
    │       │   │
    │       │   └── api/                       # Backend
    │       │       └── src/
    │       │           ├── features/
    │       │           │   └── {feature-name}/
    │       │           │       ├── controller.ts
    │       │           │       ├── service.ts
    │       │           │       └── repository.ts
    │       │           └── mocks/
    │       │               └── {feature-name}.mock.ts
    │       │
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       # 🧪 테스트 (tests/) - 발행된 테스트
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       ├── tests/
    │       │   └── {feature-name}.test.ts
    │       │
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       # 📄 문서 (docs/) - 발행된 산출물 + 실행 이력
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       ├── docs/
    │       │   └── features/
    │       │       │
    │       │       └── {feature-name}/        # 예: daily-best
    │       │           │
    │       │           # ─────────────────────────────────────────────────────
    │       │           # 📌 발행된 산출물 (Published) - 최신 버전만
    │       │           # ─────────────────────────────────────────────────────
    │       │           ├── PRD.md                     # 요구사항 (고정)
    │       │           ├── HANDOFF.md                 # 작업 지시서 (경로 참조 포함)
    │       │           ├── segment_definition.md     # 세그먼트 정의 (analysis 입력)
    │       │           ├── IA.md                      # 정보 구조 (design 산출물)
    │       │           ├── Wireframe.md               # 와이어프레임 (design 산출물)
    │       │           ├── SDD.md                     # 상세 설계 (design 산출물)
    │       │           │
    │       │           ├── analysis/                  # 분석 산출물 (발행됨)
    │       │           │   ├── *.sql                  # 쿼리 파일
    │       │           │   ├── analysis_result.json   # 분석 결과
    │       │           │   ├── analysis_report.md     # 분석 리포트
    │       │           │   └── fixture_source.json    # 🟢 Contract (Sanitized)
    │       │           │
    │       │           # ─────────────────────────────────────────────────────
    │       │           # ⭐ Config (YAML + Markdown 참조)
    │       │           # ─────────────────────────────────────────────────────
    │       │           ├── config/
    │       │           │   ├── agents.yaml            # 이 피쳐에서 사용할 Role
    │       │           │   │   # 예:
    │       │           │   │   # analyzer:
    │       │           │   │   #   ref: $RULEBOOK/roles/analyzer.md
    │       │           │   │   #   override:
    │       │           │   │   #     focus: "게시판 데이터 분석"
    │       │           │   │   #
    │       │           │   └── tasks.yaml             # 이 피쳐의 Task 정의
    │       │           │       # 예:
    │       │           │       # task-001-analysis:
    │       │           │       #   type: analysis
    │       │           │       #   agent: analyzer
    │       │           │       #   input_schema: [HANDOFF.md, segment_definition.md]
    │       │           │       #   output_schema: [*.sql, analysis_result.json]
    │       │           │
    │       │           # ─────────────────────────────────────────────────────
    │       │           # ⭐ 실행 이력 (runs/) - Run/Task 로그
    │       │           # ─────────────────────────────────────────────────────
    │       │           └── runs/
    │       │               │
    │       │               └── {run-id}/              # 예: 260109-initial, 260115-enhancement
    │       │                   │
    │       │                   ├── state.json         # Run 상태 (LangGraph State)
    │       │                   │   # {
    │       │                   │   #   "run_id": "260109-initial",
    │       │                   │   #   "status": "completed",
    │       │                   │   #   "started_at": "2026-01-09T10:00:00Z",
    │       │                   │   #   "completed_at": "2026-01-09T15:00:00Z",
    │       │                   │   #   "current_task": null,
    │       │                   │   #   "published": true
    │       │                   │   # }
    │       │                   │
    │       │                   └── {task-id}/         # 예: task-001-analysis, task-002-design
    │       │                       │
    │       │                       ├── input.json     # Task 입력 메타데이터
    │       │                       │   # {
    │       │                       │   #   "task_id": "task-001-analysis",
    │       │                       │   #   "type": "analysis",
    │       │                       │   #   "agent": "analyzer",
    │       │                       │   #   "input_paths": [
    │       │                       │   #     "../../HANDOFF.md",
    │       │                       │   #     "../../segment_definition.md"
    │       │                       │   #   ],
    │       │                       │   #   "constraints": {
    │       │                       │   #     "max_rows": 10000,
    │       │                       │   #     "timeout_ms": 30000
    │       │                       │   #   }
    │       │                       │   # }
    │       │                       │
    │       │                       ├── output/        # Task 산출물 (로그)
    │       │                       │   └── {산출물들}  # *.sql, *.json, *.md 등
    │       │                       │
    │       │                       └── review.md      # ImLeader 검증 결과
    │       │                           # ## Review: task-001-analysis
    │       │                           # - **판정**: PASS
    │       │                           # - **검증일**: 2026-01-09
    │       │                           # - **검증자**: ImLeader
    │       │                           # ### 체크리스트
    │       │                           # - [x] SQL 안전성
    │       │                           # - [x] 스키마 정합성
    │       │                           # ### 발행 승인
    │       │                           # - [x] output/ → docs/에 발행 완료
    │       │
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       # 🚫 임시 파일 (.temp/) - Git 제외
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       └── .temp/
    │           ├── scripts/                   # 일회성 스크립트
    │           │   └── {script-name}.mjs      # 예: run-query.mjs
    │           ├── results/                   # 🔴 Raw Data (PII 포함, Git 제외)
    │           │   └── raw_*.json
    │           └── sandbox/                   # 실험 코드
    │
    # ───────────────────────────────────────────────────────────────────────────
    # 🔷 공유 계층 (shared/) - 서비스 간 재사용
    # ───────────────────────────────────────────────────────────────────────────
    ├── shared/
    │   ├── ui-components/                     # 공용 UI 컴포넌트
    │   ├── utils/                             # 공용 유틸리티
    │   ├── types/                             # 공용 타입 정의
    │   └── api-client/                        # 공용 API 클라이언트
    │
    # ───────────────────────────────────────────────────────────────────────────
    # 🔷 프로젝트 전역 임시 (.temp/) - Git 제외
    # ───────────────────────────────────────────────────────────────────────────
    ├── .temp/
    │   ├── cross-service/                     # 서비스 걸친 임시 작업
    │   └── onboarding/                        # 신규 투입자 연습용
    │
    # ───────────────────────────────────────────────────────────────────────────
    # 🔷 환경/보안
    # ───────────────────────────────────────────────────────────────────────────
    ├── .env.example                           # ✅ 커밋 (템플릿)
    ├── .env                                   # 🚫 gitignore
    ├── .env.{environment}                     # 🚫 gitignore (development, production 등)
    │
    └── .gitignore
```

---

## Config 시스템: YAML + Markdown 하이브리드

### 설계 원칙

| 문제 | 해결 |
|------|------|
| AI는 YAML보다 Markdown을 더 잘 이해 | YAML은 참조만, 상세는 Markdown |
| Role 정의가 분산되면 관리 어려움 | 전역 `roles/*.md`에 집중 |
| 피쳐별 커스터마이징 필요 | `config/agents.yaml`에서 override |

### 전역 agents.yaml 예시

```yaml
# role-skill-protocol/config/agents.yaml
# Role 정의는 Markdown 파일 참조

leader:
  ref: ../roles/leader.md
  description: "전체 조율 및 HANDOFF 생성"

analyzer:
  ref: ../roles/analyzer.md
  description: "데이터 분석 및 SQL 생성"

designer:
  ref: ../roles/designer.md
  description: "IA, Wireframe, SDD 설계"

coder:
  ref: ../roles/coder.md
  description: "SDD 기반 코드 구현"

imleader:
  ref: ../roles/imleader.md
  description: "품질 검증 및 발행 승인"
```

### 피쳐별 agents.yaml 오버라이드 예시

```yaml
# services/community/docs/features/daily-best/config/agents.yaml
# 전역 Role 참조 + 피쳐별 오버라이드

analyzer:
  ref: $RULEBOOK/roles/analyzer.md      # 전역 참조
  override:
    focus: "BOARD_MUZZIMA 테이블 중심 분석"
    constraints:
      - "24시간 내 게시물 우선"
      - "READ_CNT + AGREE_CNT*2 인기도 공식"

designer:
  ref: $RULEBOOK/roles/designer.md
  override:
    style: "카드 기반 UI"

coder:
  ref: $RULEBOOK/roles/coder.md
  override:
    stack: "React 18 + TailwindCSS"
```

### 피쳐별 tasks.yaml 예시

```yaml
# services/community/docs/features/daily-best/config/tasks.yaml
# Task 정의 (Graph 노드)

task-001-analysis:
  type: analysis
  agent: analyzer
  depends_on: []
  input:
    - HANDOFF.md
    - segment_definition.md
  output:
    - "*.sql"
    - analysis_result.json
    - analysis_report.md
    - fixture_source.json
  publish_to:
    - ../analysis/

task-002-design:
  type: design
  agent: designer
  depends_on: [task-001-analysis]
  input:
    - HANDOFF.md
    - ../analysis/analysis_report.md
  output:
    - IA.md
    - Wireframe.md
    - SDD.md
  publish_to:
    - ../                              # 피쳐 루트로 발행

task-003-impl:
  type: code
  agent: coder
  depends_on: [task-002-design]
  input:
    - HANDOFF.md
    - ../SDD.md
    - ../analysis/fixture_source.json
  output:
    - "*.ts"
    - "*.tsx"
    - "*.mock.ts"
    - "*.test.ts"
  publish_to:
    - ../../../../apps/web/src/features/daily-best/
    - ../../../../apps/web/src/mocks/
    - ../../../../tests/
```

---

## Publish (발행) 프로세스

### 문제점

`runs/`에 있는 산출물은 '로그'일 뿐, 개발자가 참조해야 할 `SDD.md`가 묻혀 있으면 찾을 수 없음.

### 해결: Publish 단계 필수화

```
┌─────────────────────────────────────────────────────────────────┐
│                        Run 실행 흐름                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  runs/{run-id}/                                                 │
│  ├── task-001-analysis/                                         │
│  │   ├── input.json                                             │
│  │   ├── output/                                                │
│  │   │   ├── daily-best.sql                                     │
│  │   │   ├── analysis_result.json                               │
│  │   │   ├── analysis_report.md                                 │
│  │   │   └── fixture_source.json                                │
│  │   └── review.md  ──→ PASS                                    │
│  │                       │                                      │
│  │                       ▼                                      │
│  │              ┌────────────────┐                              │
│  │              │   📤 PUBLISH   │                              │
│  │              └────────────────┘                              │
│  │                       │                                      │
│  │   ┌───────────────────┴───────────────────┐                  │
│  │   ▼                                       ▼                  │
│  │  docs/features/daily-best/analysis/      (발행됨)             │
│  │   ├── daily-best.sql                                         │
│  │   ├── analysis_result.json                                   │
│  │   ├── analysis_report.md                                     │
│  │   └── fixture_source.json                                    │
│  │                                                              │
│  ├── task-002-design/                                           │
│  │   └── ... → PASS → PUBLISH → docs/features/daily-best/       │
│  │                               ├── IA.md                      │
│  │                               ├── Wireframe.md               │
│  │                               └── SDD.md                     │
│  │                                                              │
│  └── task-003-impl/                                             │
│      └── ... → PASS → PUBLISH → apps/web/src/features/          │
│                                 apps/web/src/mocks/             │
│                                 tests/                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### review.md 발행 승인 섹션

```markdown
## Review: task-001-analysis

### 판정: ✅ PASS

### 검증 항목
| 항목 | 결과 | 비고 |
|------|------|------|
| SQL 안전성 | ✅ | SELECT only |
| 스키마 정합성 | ✅ | DOMAIN_SCHEMA 준수 |
| 결과 품질 | ✅ | 10건 추출 |

### 발행 (Publish)
- **승인일**: 2026-01-09
- **발행 경로**:
  - `output/*.sql` → `../../analysis/`
  - `output/analysis_result.json` → `../../analysis/`
  - `output/analysis_report.md` → `../../analysis/`
  - `output/fixture_source.json` → `../../analysis/`
- **상태**: ✅ 발행 완료
```

---

## 경로 참조 규칙 (HANDOFF.md)

### 발행된 산출물 경로 (개발자/AI 참조용)

```markdown
# HANDOFF: daily-best

## 경로 참조 (Path Reference)

### 발행된 산출물 (Published)
| 유형 | 경로 (서비스 기준) |
|------|-------------------|
| PRD | `docs/features/daily-best/PRD.md` |
| SDD | `docs/features/daily-best/SDD.md` |
| Fixture Contract | `docs/features/daily-best/analysis/fixture_source.json` |
| Frontend 코드 | `apps/web/src/features/daily-best/` |
| Backend 코드 | `apps/api/src/features/daily-best/` |
| Mocks | `apps/{web,api}/src/mocks/daily-best.mock.ts` |
| Tests | `tests/daily-best.test.ts` |

### 실행 이력 (Runs - 로그)
| 유형 | 경로 |
|------|------|
| Run 목록 | `docs/features/daily-best/runs/` |
| 특정 Run | `docs/features/daily-best/runs/{run-id}/` |
| Task 로그 | `docs/features/daily-best/runs/{run-id}/{task-id}/` |

⚠️ **주의**: 코드/문서 참조는 항상 "발행된 경로"를 사용하세요. `runs/`는 로그입니다.
```

---

## 데이터 흐름

```
[Phase A: Analysis - Discovery]
    │
    ▼
.temp/results/raw_*.json                           # 🔴 Git 제외 (PII)
    │
    │  Query 실행
    ▼
runs/{run-id}/task-001-analysis/output/            # 🟡 로그 (Git 포함)
    ├── *.sql
    ├── analysis_result.json
    ├── analysis_report.md
    └── fixture_source.json
    │
    │  ImLeader Review → PASS
    ▼
📤 PUBLISH
    │
    ▼
docs/features/{feature}/analysis/                  # 🟢 발행됨 (Git 포함)
    ├── *.sql
    ├── analysis_result.json
    ├── analysis_report.md
    └── fixture_source.json
    │
    ▼
[Phase C: Implementation - Reproduction]
    │
    │  fixture_source.json 기반 Mock 생성
    ▼
runs/{run-id}/task-003-impl/output/                # 🟡 로그
    ├── *.ts, *.tsx
    ├── *.mock.ts
    └── *.test.ts
    │
    │  ImLeader Review → PASS
    ▼
📤 PUBLISH
    │
    ▼
apps/{web,api}/src/features/{feature}/             # 🟢 발행됨
apps/{web,api}/src/mocks/{feature}.mock.ts
tests/{feature}.test.ts
```

---

## 임시파일 위치

| 위치 | 용도 | Git |
|------|------|-----|
| `/.temp/` | 프로젝트 전역 임시 | 🚫 |
| `/services/{service}/.temp/` | 서비스별 임시 | 🚫 |
| `/services/{service}/.temp/scripts/` | 일회성 스크립트 | 🚫 |
| `/services/{service}/.temp/results/` | 🔴 Raw Data (PII) | 🚫 |
| `/services/{service}/.temp/sandbox/` | 실험 코드 | 🚫 |

---

## 실무 시나리오

### 시나리오 1: 신규 피쳐 작업 시작

```bash
cd services/community

# 1. 피쳐 디렉토리 생성
mkdir -p docs/features/daily-best/{config,runs,analysis}

# 2. Config 설정
vim docs/features/daily-best/config/agents.yaml
vim docs/features/daily-best/config/tasks.yaml

# 3. PRD, HANDOFF 작성
vim docs/features/daily-best/PRD.md
vim docs/features/daily-best/HANDOFF.md

# 4. Run 시작
mkdir -p docs/features/daily-best/runs/260109-initial/task-001-analysis
```

### 시나리오 2: Task 실행 및 발행

```bash
# 1. Task 실행
cd docs/features/daily-best/runs/260109-initial/task-001-analysis

# input.json 작성
vim input.json

# 분석 수행 (AI 또는 수동)
mkdir output
# → output/ 에 산출물 생성

# 2. Review
vim review.md  # PASS 판정

# 3. Publish (발행)
cp output/*.sql ../../analysis/
cp output/analysis_result.json ../../analysis/
cp output/analysis_report.md ../../analysis/
cp output/fixture_source.json ../../analysis/
```

### 시나리오 3: 기존 피쳐 개선

```bash
# 새 Run 생성
mkdir -p docs/features/daily-best/runs/260115-enhancement

# 이전 Run 참조하면서 작업
ls docs/features/daily-best/runs/260109-initial/

# 발행된 산출물은 덮어쓰기 (최신 버전 유지)
```

---

## 실무 시나리오 (추가)

### 시나리오 4: 신규 프로젝트 투입

```bash
# 개발자 A가 medigate-ato 프로젝트에 처음 투입
git clone https://github.com/strategy-ai-lab/medigate-ato
cd medigate-ato

# 전역 룰북 (Submodule) 받기
git submodule update --init --recursive

# 룰북 확인
ls .claude/rulebook/
# → rules/, workflows/, roles/, config/, templates/

# 온보딩 연습 (임시 영역에서)
mkdir -p .temp/onboarding
cd .temp/onboarding
# 여기서 자유롭게 연습, 실험 → 커밋 안 됨
```

### 시나리오 5: 다른 프로젝트로 이동

```bash
# 개발자 A가 fintech-payment 프로젝트로 이동
cd ~/projects/fintech-payment
git submodule update --init --recursive

# 동일한 전역 룰북 (CODE_STYLE, TDD_WORKFLOW, ROLE_ARCHITECTURE)
# 다른 프로젝트 오버라이드:
#   - PROJECT_STACK.md: Next.js + Go + MongoDB
#   - DOMAIN_SCHEMA.md: 핀테크 DB 스키마
# → 적응 비용 최소화 (룰북은 동일, 도메인만 학습)
```

### 시나리오 6: 전역 룰북 변경 발생 시

**상황**: `role-skill-protocol` 레포에서 `CODE_STYLE.md`가 업데이트됨

```bash
# ═══════════════════════════════════════════════════════════════════
# 1️⃣ 룰북 관리자 (Tech Lead / 아키텍트)
# ═══════════════════════════════════════════════════════════════════

# role-skill-protocol 레포에서 변경
cd ~/repos/role-skill-protocol
vim rules/CODE_STYLE.md   # 규칙 수정

# 커밋 및 푸시
git add rules/CODE_STYLE.md
git commit -m "chore(rules): 함수 길이 제한 30줄 → 25줄로 강화"
git push origin main

# 버전 태깅 (선택)
git tag v1.2.0
git push origin v1.2.0

# ═══════════════════════════════════════════════════════════════════
# 2️⃣ 각 프로젝트에서 업데이트 적용
# ═══════════════════════════════════════════════════════════════════

# medigate-ato 프로젝트
cd ~/projects/medigate-ato

# Submodule 최신화
cd .claude/rulebook
git fetch origin
git checkout main
git pull origin main
cd ../..

# 또는 한 줄로
git submodule update --remote .claude/rulebook

# 변경사항 커밋
git add .claude/rulebook
git commit -m "chore: 전역 룰북 v1.2.0 업데이트 (CODE_STYLE 강화)"
git push origin main

# ═══════════════════════════════════════════════════════════════════
# 3️⃣ 다른 개발자들 (팀원)
# ═══════════════════════════════════════════════════════════════════

# pull 시 자동으로 submodule도 업데이트
git pull origin main
git submodule update --init --recursive

# 변경된 룰 확인
cat .claude/rulebook/rules/CODE_STYLE.md
```

### 시나리오 7: 룰북 변경으로 인한 충돌 해결

**상황**: 프로젝트 오버라이드(`PROJECT_STACK.md`)와 전역 룰(`CODE_STYLE.md`)이 충돌

```bash
# 예: 전역 룰에서 "커버리지 90% 필수"로 변경됨
# 하지만 medigate-ato는 레거시 사유로 85%만 가능

# ═══════════════════════════════════════════════════════════════════
# 해결 방법 1: 프로젝트 오버라이드 (권장)
# ═══════════════════════════════════════════════════════════════════

# .claude/project/PROJECT_STACK.md에 오버라이드 명시
vim .claude/project/PROJECT_STACK.md
```

```markdown
# PROJECT_STACK.md - medigate-ato

## 전역 룰 오버라이드

| 규칙 | 전역 기준 | 이 프로젝트 | 사유 |
|------|----------|------------|------|
| 커버리지 | 90% | 85% | 레거시 코드 존재, 점진 개선 중 |

> 참조: CLAUDE.md의 우선순위 규칙에 따라 PROJECT_STACK.md가 전역 룰보다 우선함
```

```bash
# ═══════════════════════════════════════════════════════════════════
# 해결 방법 2: 전역 룰에 예외 조항 추가 요청
# ═══════════════════════════════════════════════════════════════════

# role-skill-protocol 레포에 Issue 또는 PR 생성
# "레거시 프로젝트 예외 조항 추가 요청"

# ═══════════════════════════════════════════════════════════════════
# 해결 방법 3: 특정 버전 고정 (비권장, 임시용)
# ═══════════════════════════════════════════════════════════════════

cd .claude/rulebook
git checkout v1.1.0   # 이전 버전으로 고정
cd ../..
git add .claude/rulebook
git commit -m "chore: 룰북 v1.1.0 고정 (마이그레이션 준비 중)"
```

### 시나리오 8: 새 Role 추가 시

**상황**: `query` Role을 전역 룰북에 추가

```bash
# ═══════════════════════════════════════════════════════════════════
# 1️⃣ 룰북 관리자
# ═══════════════════════════════════════════════════════════════════

cd ~/repos/role-skill-protocol

# Role Markdown 생성
vim roles/query.md
```

```markdown
# Query Role

## 역할
SQL 쿼리 생성 및 데이터 분석 전문가

## 책임
- DOMAIN_SCHEMA.md 기반 유효한 SQL 생성
- SELECT only (INSERT/UPDATE/DELETE 금지)
- 대용량 테이블 접근 시 LIMIT 필수

## 입력
- HANDOFF.md
- segment_definition.md
- DOMAIN_SCHEMA.md

## 출력
- *.sql
- analysis_result.json
```

```bash
# agents.yaml에 추가
vim config/agents.yaml
```

```yaml
# 기존 roles...

query:
  ref: ../roles/query.md
  description: "SQL 쿼리 생성 및 데이터 분석"
```

```bash
# 커밋 및 배포
git add roles/query.md config/agents.yaml
git commit -m "feat(roles): Query Role 추가"
git push origin main

# ═══════════════════════════════════════════════════════════════════
# 2️⃣ 프로젝트에서 사용
# ═══════════════════════════════════════════════════════════════════

cd ~/projects/medigate-ato
git submodule update --remote .claude/rulebook
git add .claude/rulebook
git commit -m "chore: 룰북 업데이트 (Query Role 추가)"

# 피쳐에서 Query Role 사용
vim services/community/docs/features/daily-best/config/agents.yaml
```

```yaml
query:
  ref: $RULEBOOK/roles/query.md
  override:
    focus: "BOARD_MUZZIMA 테이블 분석"
```

---

## .gitignore

```gitignore
# ═══════════════════════════════════════
# 임시파일
# ═══════════════════════════════════════
.temp/
**/.temp/

# 임시 스크립트 패턴
**/run-*.mjs
**/check-*.mjs
**/scratch.*

# Raw Data (PII)
**/raw_*.json

# ═══════════════════════════════════════
# 환경/보안
# ═══════════════════════════════════════
.env
.env.*
!.env.example

# ═══════════════════════════════════════
# 빌드/의존성
# ═══════════════════════════════════════
node_modules/
dist/
```

---

## 요약

> **Role-Skill-Protocol**은 전역 룰북(`role-skill-protocol/`)을 Submodule로 참조하는 멀티레포 구조입니다. Role 정의는 Markdown(`roles/*.md`)에 집중하고 YAML(`config/agents.yaml`)은 참조만 담당하는 하이브리드 방식을 채택합니다. 프로젝트 > 서비스 > 피쳐 계층 구조로 코드(`apps/`)와 산출물(`docs/features/`)을 분리하며, 모든 작업은 `runs/{run-id}/{task-id}/` 구조로 로그를 남깁니다. 각 Task는 `input.json`(입력 메타) + `output/`(산출물) + `review.md`(검증)로 구성되며, ImLeader 검증 통과 시 **Publish(발행)** 단계를 거쳐 `docs/` 또는 `apps/`의 정해진 경로로 복사됩니다. 개발자와 AI는 항상 "발행된 경로"를 참조하고, `runs/`는 이력 추적용 로그로만 활용합니다.
