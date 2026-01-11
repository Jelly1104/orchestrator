# Role-Skill-Protocol 폴더 트리 구조

> **버전**: 5.1.0 | **작성일**: 2026-01-09
> **프로토콜명**: Role-Skill-Protocol
> **변경사항**: Q1-Q4 결정사항 반영 (roles/ 제거, SYSTEM_MANIFEST.md 분리, context/ 추가)

---

## 설계 원칙

| 원칙                    | 설명                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| **Run-based History**   | 모든 작업은 `runs/{run-id}/`에 로그로 기록됨 (LangGraph 패턴)    |
| **Config as Code**      | Role/Task 정의는 YAML로, 상세 설명은 Markdown 참조 (CrewAI 패턴) |
| **Publish Required**    | Run 완료 시 산출물을 `docs/` 또는 `apps/`로 발행 필수            |
| **Input/Output/Review** | 모든 Task는 `input.json` + `output/` + `imleader-review.md` 구조 |
| **Skill-Template 분리** | Claude Code Skill(호출 진입점)과 Template(산출물 형식)을 분리    |

---

## 폴더 트리 구조

```
github.com/strategy-ai-lab/                    # 🏢 Organization

# ═══════════════════════════════════════════════════════════════════════════════
# 1️⃣ 전역 룰북 레포 (모든 프로젝트 공통) - Git Submodule로 참조
# ═══════════════════════════════════════════════════════════════════════════════
├── role-skill-protocol/                       # 📚 전역 룰북 레포
│   │
│   ├── SYSTEM_MANIFEST.md                     # 🧭 시스템 지도 (문서 맵, 로딩 전략)
│   │
│   ├── CLAUDE.md                              # ⚖️ 헌법 (절대 원칙, 금지 사항)
│   │
│   ├── rules/                                 # 정적 규칙/제약 (불변)
│   │   ├── CODE_STYLE.md                      # 코딩 컨벤션
│   │   ├── TDD_WORKFLOW.md                    # 테스트 주도 개발
│   │   ├── DB_ACCESS_POLICY.md                # DB 접근 정책
│   │   ├── ANALYSIS_GUIDE.md                  # 쿼리 전략, 샘플링, 파이프라인
│   │   ├── VALIDATION_GUIDE.md                # 검증 가이드
│   │   └── ROLES_DEFINITION.md                # Role별 R&R 정의 (정적 제약)
│   │
│   ├── workflows/                             # 실행 절차 (동적 흐름)
│   │   ├── DOCUMENT_PIPELINE.md               # 문서 파이프라인 (산출물 정의)
│   │   ├── ROLE_ARCHITECTURE.md               # Role 아키텍처 (Phase 흐름, HITL)
│   │   ├── HANDOFF_PROTOCOL.md                # 업무 지시/보고 형식
│   │   ├── PRD_GUIDE.md                       # PRD Gap Check, 완성도 체크
│   │   ├── ERROR_HANDLING_GUIDE.md            # 재시도/폴백 로직
│   │   └── INCIDENT_PLAYBOOK.md               # 에스컬레이션 절차
│   │
│   ├── context/                               # 배경 지식/철학 (불변)
│   │   └── AI_Playbook.md                     # 팀 철학, 행동 강령
│   │
│   # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   # ⭐ NEW: Claude Code Skills (호출 진입점)
│   # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   ├── skills/                                # Claude Code가 인지하는 Skill 진입점
│   │   │
│   │   ├── leader/
│   │   │   └── SKILL.md                       # /leader 명령어 호출 시 로딩
│   │   │       # - PRD 분석, HANDOFF 생성
│   │   │       # - 파이프라인 완료 후 최종 검토
│   │   │       # - templates/prd/* 참조
│   │   │
│   │   ├── imleader/
│   │   │   └── SKILL.md                       # /imleader 명령어 호출 시 로딩
│   │   │       # - Phase별 품질 검증 (QA)
│   │   │       # - rules/VALIDATION_GUIDE.md 참조
│   │   │       # - 산출물: imleader-review.md
│   │   │
│   │   ├── designer/
│   │   │   └── SKILL.md                       # /designer 명령어 호출 시 로딩
│   │   │       # - IA, Wireframe, SDD 생성
│   │   │       # - templates/designer/* 참조
│   │   │       # - 산출물: IA.md, Wireframe.md, SDD.md
│   │   │
│   │   ├── profiler/
│   │   │   └── SKILL.md                       # /profiler 명령어 호출 시 로딩
│   │   │       # - 세그먼트 정의, SQL 조건 명세
│   │   │       # - templates/profiler/* 참조
│   │   │       # - 산출물: TARGET_DEFINITION.md
│   │   │
│   │   ├── coder/
│   │   │   └── SKILL.md                       # /coder 명령어 호출 시 로딩
│   │   │       # - SDD 기반 코드 구현
│   │   │       # - 산출물: src/*, tests/*.test.ts
│   │   │
│   │   └── query/
│   │       └── SKILL.md                       # /query 명령어 호출 시 로딩
│   │           # - SQL 생성, 데이터 분석
│   │           # - rules/DOMAIN_SCHEMA.md 참조
│   │           # - 산출물: *.sql, analysis_result.json, analysis_report.md, fixture_source.json
│   │
│   # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   # ⭐ NEW: Templates (산출물 형식 정의)
│   # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   ├── templates/                             # 산출물 템플릿 (Skill이 참조)
│   │   │
│   │   ├── prd/                               # PRD 템플릿 (Leader 참조)
│   │   │   ├── PRD_FULL.md                    # 전체 PRD 템플릿
│   │   │   └── PRD_LITE.md                    # 간소화 PRD 템플릿
│   │   │
│   │   ├── designer/                          # 설계 템플릿 (Designer 참조)
│   │   │   ├── IA_TEMPLATE.md                 # 정보 구조 템플릿 → IA.md
│   │   │   ├── WF_TEMPLATE.md                 # 와이어프레임 템플릿 → Wireframe.md
│   │   │   └── SDD_TEMPLATE.md                # 상세 설계 템플릿 → SDD.md
│   │   │
│   │   └── profiler/                          # 프로파일 템플릿 (Profiler 참조)
│   │       └── TARGET_TEMPLATE.md            # 세그먼트 정의 템플릿 → TARGET_DEFINITION.md
│   │
│   └── config/                                # YAML Config (Markdown 참조)
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
    │   │
    │   │   # ⚠️ Claude Code 필수 위치 (.claude/ 직하)
    │   ├── CLAUDE.md                          # ⚖️ 헌법 (절대 원칙) - 프로젝트 진입점
    │   │
    │   ├── skills/                            # Claude Code Skills (직하 위치 필수)
    │   │   ├── leader/SKILL.md
    │   │   ├── imleader/SKILL.md
    │   │   ├── designer/SKILL.md
    │   │   ├── profiler/SKILL.md
    │   │   ├── coder/SKILL.md
    │   │   └── query/SKILL.md
    │   │
    │   │   # ─────────────────────────────────────────────────────────────
    │   │   # 📚 Submodule (전역 룰북 참조)
    │   │   # ─────────────────────────────────────────────────────────────
    │   ├── rulebook/                          # [submodule] → role-skill-protocol/
    │   │   # 포함 내용:
    │   │   # ├── SYSTEM_MANIFEST.md  ← 시스템 지도
    │   │   # ├── rules/              ← ROLES_DEFINITION.md 포함
    │   │   # ├── workflows/          ← ROLE_ARCHITECTURE.md 등
    │   │   # ├── context/            ← AI_Playbook.md
    │   │   # ├── templates/          ← 산출물 템플릿
    │   │   # └── config/
    │   │
    │   └── project/                           # 프로젝트 오버라이드
    │       ├── PROJECT_STACK.md               # 기술스택 (React/Vue, Node/Spring 등)
    │       ├── DOMAIN_SCHEMA.md               # DB스키마 (테이블/컬럼 정의)
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
    │       │           # 📌 발행된 산출물 (Published) - DOCUMENT_PIPELINE.md 참조
    │       │           # ─────────────────────────────────────────────────────
    │       │           ├── PRD.md                     # 요구사항 (Leader → prd/* 템플릿)
    │       │           ├── HANDOFF.md                 # 작업 지시서 (Leader 생성)
    │       │           ├── TARGET_DEFINITION.md     # 세그먼트 정의 (Profiler → profiler/*)
    │       │           ├── IA.md                      # 정보 구조 (Designer → designer/IA_TEMPLATE.md)
    │       │           ├── Wireframe.md               # 와이어프레임 (Designer → designer/WF_TEMPLATE.md)
    │       │           ├── SDD.md                     # 상세 설계 (Designer → designer/SDD_TEMPLATE.md)
    │       │           │
    │       │           ├── analysis/                  # 분석 산출물 (Query → query/*)
    │       │           │   ├── *.sql                  # 쿼리 파일
    │       │           │   ├── analysis_result.json   # 분석 결과
    │       │           │   ├── analysis_report.md     # 분석 리포트
    │       │           │   └── fixture_source.json    # [계약] 발행된 데이터 계약 ✅
    │       │           │
    │       │           # ─────────────────────────────────────────────────────
    │       │           # ⭐ Config (YAML + Markdown 참조)
    │       │           # ─────────────────────────────────────────────────────
    │       │           ├── config/
    │       │           │   ├── agents.yaml            # 이 피쳐에서 사용할 Role
    │       │           │   └── tasks.yaml             # 이 피쳐의 Task 정의
    │       │           │
    │       │           # ─────────────────────────────────────────────────────
    │       │           # ⭐ 실행 이력 (runs/) - Run/Task 로그
    │       │           # ─────────────────────────────────────────────────────
    │       │           └── runs/
    │       │               │
    │       │               └── {run-id}/              # 예: 260109-initial, 260115-enhancement
    │       │                   │
    │       │                   ├── state.json         # Run 상태 (LangGraph State)
    │       │                   │
    │       │                   └── {task-id}/         # 예: task-001-analysis, task-002-design
    │       │                       │
    │       │                       ├── input.json     # Task 입력 메타데이터
    │       │                       ├── output/        # Task 산출물 (로그)
    │       │                       │   └── {산출물들}  # *.sql, *.json, *.md 등
    │       │                       └── imleader-review.md  # ImLeader 검증 결과 (PASS 시 output/ 발행)
    │       │
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       # 🚫 임시 파일 (.temp/) - Git 제외
    │       # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │       └── .temp/
    │           ├── scripts/                   # 일회성 스크립트
    │           │   └── {script-name}.mjs
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

## Skill ↔ Template ↔ 산출물 매핑

### DOCUMENT_PIPELINE.md 산출물과 연결

| Skill        | 호출 명령어 | 참조 Template                                                                                                      | 산출물 (DOCUMENT_PIPELINE.md)                                                |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Leader**   | `/leader`   | `templates/prd/PRD_FULL.md`<br>`templates/prd/PRD_LITE.md`                                                         | `PRD.md`, `HANDOFF.md`                                                       |
| **Profiler** | `/profiler` | `templates/profiler/TARGET_TEMPLATE.md`                                                                            | `TARGET_DEFINITION.md`                                                       |
| **Query**    | `/query`    | (스키마는 `rules/DOMAIN_SCHEMA.md`)                                                                                | `*.sql`, `analysis_result.json`, `analysis_report.md`, `fixture_source.json` |
| **Designer** | `/designer` | `templates/designer/IA_TEMPLATE.md`<br>`templates/designer/WF_TEMPLATE.md`<br>`templates/designer/SDD_TEMPLATE.md` | `IA.md`, `Wireframe.md`, `SDD.md`                                            |
| **Coder**    | `/coder`    | (코드 컨벤션은 `rules/CODE_STYLE.md`)                                                                              | `backend/src/*`, `frontend/src/*`, `src/mocks/*`, `tests/*.test.ts`          |
| **ImLeader** | `/imleader` | `rules/VALIDATION_GUIDE.md`                                                                                        | `imleader-review.md`                                                         |

### 파이프라인 타입별 Skill 흐름

| 파이프라인 타입   | Skill 실행 순서                                         |
| ----------------- | ------------------------------------------------------- |
| `analysis`        | Leader → Profiler → Query → ImLeader                    |
| `design`          | Leader → Designer → ImLeader                            |
| `analyzed_design` | Leader → Profiler → Query → Designer → ImLeader         |
| `code`            | Leader → Coder → ImLeader                               |
| `ui_mockup`       | Leader → Designer → Coder → ImLeader                    |
| `full`            | Leader → Profiler → Query → Designer → Coder → ImLeader |

---

## Skills 상세 구조

### SKILL.md 표준 형식

```markdown
# {Role} SKILL

> **트리거**: "작업 키워드1", "작업 키워드2", ...
> 🔴 **필수**: 실행 전 이 SKILL.md 파일 전체를 Read 도구로 읽고 Step 라우팅 규칙에 따라 진행할 것.

## Step 라우팅

- Step 1: {조건} → {행동}
- Step 2: {조건} → {행동}
- ...

## 참조 Templates

- `templates/{role}/*.md`

## 입력

- HANDOFF.md
- (기타 입력 파일)

## 출력

- (산출물 목록)

## 검증 기준

- (체크리스트)
```

### 현재 Skills 목록

| Skill    | 경로                       | 역할                                                 |
| -------- | -------------------------- | ---------------------------------------------------- |
| Leader   | `skills/leader/SKILL.md`   | PRD 분석, HANDOFF 생성, 파이프라인 완료 후 최종 검토 |
| ImLeader | `skills/imleader/SKILL.md` | 산출물 품질 검증 (QA), Phase별 검증                  |
| Designer | `skills/designer/SKILL.md` | IA/Wireframe/SDD 설계 문서 생성                      |
| Profiler | `skills/profiler/SKILL.md` | 타겟 세그먼트 정의 및 SQL 조건 명세                  |
| Coder    | `skills/coder/SKILL.md`    | SDD 기반 코드 구현 (엔트리포인트 연결 필수)          |
| Query    | `skills/query/SKILL.md`    | SQL 쿼리 생성 및 데이터 분석                         |

---

## Templates 상세 구조

### Role별 Template 매핑

```
templates/
├── prd/                    # Leader 참조
│   ├── PRD_FULL.md         # 전체 기능 PRD
│   └── PRD_LITE.md         # 간소화 PRD
│
├── designer/               # Designer 참조
│   ├── IA_TEMPLATE.md      # Information Architecture → IA.md
│   ├── WF_TEMPLATE.md      # Wireframe → Wireframe.md
│   └── SDD_TEMPLATE.md     # System Design Document → SDD.md
│
└── profiler/               # Profiler 참조
    └── TARGET_TEMPLATE.md    # 세그먼트 정의 규칙 → TARGET_DEFINITION.md
```

### Template 참조 규칙

1. **Skill이 Template을 참조**: 각 SKILL.md는 `## 참조 Templates` 섹션에서 사용할 템플릿을 명시
2. **상대 경로 사용**: `$RULEBOOK/templates/{role}/*.md`
3. **오버라이드 가능**: 프로젝트별 `templates/` 추가 시 우선 적용

---

## Config 시스템: YAML + Markdown 하이브리드

### 설계 원칙

| 문제                                | 해결                               |
| ----------------------------------- | ---------------------------------- |
| AI는 YAML보다 Markdown을 더 잘 이해 | YAML은 참조만, 상세는 Markdown     |
| Role 정의가 분산되면 관리 어려움    | `rules/ROLES_DEFINITION.md`에 집중 |
| 피쳐별 커스터마이징 필요            | `config/agents.yaml`에서 override  |
| Skill 호출 경로 명확화 필요         | `skills/{role}/SKILL.md` 고정      |

### 전역 agents.yaml 예시

```yaml
# role-skill-protocol/config/agents.yaml
# Role 정의는 rules/ROLES_DEFINITION.md 참조, Skill은 고정 경로

leader:
  skill_path: ../skills/leader/SKILL.md
  templates:
    - ../templates/prd/PRD_FULL.md
    - ../templates/prd/PRD_LITE.md
  description: "전체 조율 및 HANDOFF 생성"

profiler:
  skill_path: ../skills/profiler/SKILL.md
  templates:
    - ../templates/profiler/TARGET_TEMPLATE.md
  description: "세그먼트 정의 및 SQL 조건 명세"

query:
  skill_path: ../skills/query/SKILL.md
  templates: [] # 스키마는 rules/DOMAIN_SCHEMA.md 참조
  description: "SQL 쿼리 생성 및 데이터 분석"

designer:
  skill_path: ../skills/designer/SKILL.md
  templates:
    - ../templates/designer/IA_TEMPLATE.md
    - ../templates/designer/WF_TEMPLATE.md
    - ../templates/designer/SDD_TEMPLATE.md
  description: "IA, Wireframe, SDD 설계"

coder:
  skill_path: ../skills/coder/SKILL.md
  templates: [] # 코드 컨벤션은 rules/CODE_STYLE.md 참조
  description: "SDD 기반 코드 구현"

imleader:
  skill_path: ../skills/imleader/SKILL.md
  rules:
    - ../rules/VALIDATION_GUIDE.md
  description: "품질 검증 및 발행 승인"
# Role 상세 정의는 rules/ROLES_DEFINITION.md 참조
```

### 피쳐별 agents.yaml 오버라이드 예시

```yaml
# services/community/docs/features/daily-best/config/agents.yaml
# 전역 Skill 참조 + 피쳐별 오버라이드

query:
  skill: $RULEBOOK/skills/query/SKILL.md
  override:
    focus: "BOARD_MUZZIMA 테이블 중심 분석"
    constraints:
      - "24시간 내 게시물 우선"
      - "READ_CNT + AGREE_CNT*2 인기도 공식"

designer:
  skill: $RULEBOOK/skills/designer/SKILL.md
  override:
    style: "카드 기반 UI"

coder:
  skill: $RULEBOOK/skills/coder/SKILL.md
  override:
    stack: "React 18 + TailwindCSS"
# Role 상세 정의는 $RULEBOOK/rules/ROLES_DEFINITION.md 참조
```

### 피쳐별 tasks.yaml 예시

```yaml
# services/community/docs/features/daily-best/config/tasks.yaml
# Task 정의 (Graph 노드)

task-001-analysis:
  type: analysis
  agent: query
  depends_on: []
  input:
    - HANDOFF.md
    - TARGET_DEFINITION.md
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
    - ../ # 피쳐 루트로 발행

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
│  │   └── imleader-review.md  ──→ PASS                           │
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

### imleader-review.md 발행 승인 섹션

```markdown
## Review: task-001-analysis

### 판정: ✅ PASS

### 검증 항목

| 항목          | 결과 | 비고               |
| ------------- | ---- | ------------------ |
| SQL 안전성    | ✅   | SELECT only        |
| 스키마 정합성 | ✅   | DOMAIN_SCHEMA 준수 |
| 결과 품질     | ✅   | 10건 추출          |

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

| 유형             | 경로 (서비스 기준)                                      |
| ---------------- | ------------------------------------------------------- |
| PRD              | `docs/features/daily-best/PRD.md`                       |
| SDD              | `docs/features/daily-best/SDD.md`                       |
| Fixture Contract | `docs/features/daily-best/analysis/fixture_source.json` |
| Frontend 코드    | `apps/web/src/features/daily-best/`                     |
| Backend 코드     | `apps/api/src/features/daily-best/`                     |
| Mocks            | `apps/{web,api}/src/mocks/daily-best.mock.ts`           |
| Tests            | `tests/daily-best.test.ts`                              |

### 실행 이력 (Runs - 로그)

| 유형      | 경로                                                |
| --------- | --------------------------------------------------- |
| Run 목록  | `docs/features/daily-best/runs/`                    |
| 특정 Run  | `docs/features/daily-best/runs/{run-id}/`           |
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
    │  Query Skill 실행
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
    │  Coder Skill: fixture_source.json 기반 Mock 생성
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

| 위치                                 | 용도               | Git |
| ------------------------------------ | ------------------ | --- |
| `/.temp/`                            | 프로젝트 전역 임시 | 🚫  |
| `/services/{service}/.temp/`         | 서비스별 임시      | 🚫  |
| `/services/{service}/.temp/scripts/` | 일회성 스크립트    | 🚫  |
| `/services/{service}/.temp/results/` | 🔴 Raw Data (PII)  | 🚫  |
| `/services/{service}/.temp/sandbox/` | 실험 코드          | 🚫  |

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

# 3. PRD, HANDOFF 작성 (Leader Skill 호출)
# Claude Code에서: /leader → PRD 분석 → HANDOFF 생성
vim docs/features/daily-best/PRD.md
vim docs/features/daily-best/HANDOFF.md

# 4. Run 시작
mkdir -p docs/features/daily-best/runs/260109-initial/task-001-analysis
```

### 시나리오 2: Task 실행 및 발행

```bash
# 1. Task 실행 (Query Skill 호출)
cd docs/features/daily-best/runs/260109-initial/task-001-analysis

# Claude Code에서: /query → SQL 생성 → 분석 수행
vim input.json
mkdir output
# → output/ 에 산출물 생성

# 2. Review (ImLeader Skill 호출)
# Claude Code에서: /imleader → 검증 → PASS
vim imleader-review.md

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

### 시나리오 4: 신규 프로젝트 투입

```bash
# 개발자 A가 medigate-ato 프로젝트에 처음 투입
git clone https://github.com/strategy-ai-lab/medigate-ato
cd medigate-ato

# 전역 룰북 (Submodule) 받기
git submodule update --init --recursive

# 룰북 확인 (Skills, Templates 포함)
ls .claude/rulebook/
# → rules/, workflows/, roles/, skills/, templates/, config/

# Skills 확인
ls .claude/rulebook/skills/
# → leader/, imleader/, designer/, profiler/, coder/, query/

# Templates 확인
ls .claude/rulebook/templates/
# → prd/, designer/, profiler/

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
# 동일한 Skills (leader, designer, coder 등)
# 동일한 Templates (IA_TEMPLATE.md, SDD_TEMPLATE.md 등)
# 다른 프로젝트 오버라이드:
#   - PROJECT_STACK.md: Next.js + Go + MongoDB
#   - DOMAIN_SCHEMA.md: 핀테크 DB 스키마
# → 적응 비용 최소화 (룰북/스킬은 동일, 도메인만 학습)
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

| 규칙     | 전역 기준 | 이 프로젝트 | 사유                           |
| -------- | --------- | ----------- | ------------------------------ |
| 커버리지 | 90%       | 85%         | 레거시 코드 존재, 점진 개선 중 |

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

### 시나리오 8: 새 Role/Skill 추가 시

**상황**: `auditor` Role과 Skill을 전역 룰북에 추가

```bash
# ═══════════════════════════════════════════════════════════════════
# 1️⃣ 룰북 관리자
# ═══════════════════════════════════════════════════════════════════

cd ~/repos/role-skill-protocol

# Role Markdown 생성
vim roles/auditor.md
```

```markdown
# Auditor Role

## 역할

보안 및 컴플라이언스 감사 전문가

## 책임

- 보안 취약점 스캔
- OWASP Top 10 검증
- 개인정보 노출 검사

## 입력

- Source Code
- DOMAIN_SCHEMA.md

## 출력

- audit_report.md
- vulnerability_list.json
```

```bash
# Skill 생성
mkdir -p skills/auditor
vim skills/auditor/SKILL.md
```

```markdown
# Auditor SKILL

> **트리거**: "보안 검사", "감사", "취약점 분석", "Audit"
> 🔴 **필수**: 실행 전 이 SKILL.md 파일 전체를 Read 도구로 읽고 Step 라우팅 규칙에 따라 진행할 것.

## Step 라우팅

- Step 1: 코드베이스 스캔 → OWASP 체크리스트 검증
- Step 2: 민감정보 노출 검사 → DB_ACCESS_POLICY 준수 확인
- Step 3: 결과 리포트 생성

## 참조 Templates

- `templates/auditor/AUDIT_CHECKLIST.md`

## 입력

- Source Code (apps/)
- DOMAIN_SCHEMA.md

## 출력

- audit_report.md
- vulnerability_list.json

## 검증 기준

- [ ] SQL Injection 취약점 없음
- [ ] XSS 취약점 없음
- [ ] 민감 컬럼 직접 노출 없음
```

```bash
# Template 생성
mkdir -p templates/auditor
vim templates/auditor/AUDIT_CHECKLIST.md

# agents.yaml에 추가
vim config/agents.yaml
```

```yaml
# 기존 roles...

auditor:
  role_ref: ../roles/auditor.md
  skill_path: ../skills/auditor/SKILL.md
  templates:
    - ../templates/auditor/AUDIT_CHECKLIST.md
  description: "보안 및 컴플라이언스 감사"
```

```bash
# 커밋 및 배포
git add roles/auditor.md skills/auditor/ templates/auditor/ config/agents.yaml
git commit -m "feat(roles): Auditor Role 및 Skill 추가"
git push origin main

# ═══════════════════════════════════════════════════════════════════
# 2️⃣ 프로젝트에서 사용
# ═══════════════════════════════════════════════════════════════════

cd ~/projects/medigate-ato
git submodule update --remote .claude/rulebook
git add .claude/rulebook
git commit -m "chore: 룰북 업데이트 (Auditor Role 추가)"

# Claude Code에서 새 Skill 사용 가능
# /auditor → 보안 감사 수행
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

## DOCUMENT_PIPELINE.md 확장 제안

> **결정사항**: `OUTPUT_PATHS.md` 별도 생성 대신 `DOCUMENT_PIPELINE.md` 확장으로 SSOT 유지

### 추가할 섹션

#### 1. 산출물 저장 경로 (Output Paths)

```markdown
## 산출물 저장 경로 (Output Paths)

### 디렉토리 구조

\`\`\`
services/{service}/
├── apps/                                    # 발행된 코드
│   ├── web/src/features/{feature}/
│   └── api/src/features/{feature}/
├── tests/{feature}.test.ts                  # 발행된 테스트
└── docs/features/{feature}/                 # 발행된 문서
    ├── PRD.md
    ├── HANDOFF.md
    ├── TARGET_DEFINITION.md
    ├── IA.md, Wireframe.md, SDD.md
    ├── analysis/                            # 분석 산출물
    │   ├── *.sql
    │   ├── analysis_result.json
    │   └── analysis_report.md
    └── runs/{run-id}/{task-id}/             # 실행 이력 (로그)
        ├── input.json
        ├── output/
        └── imleader-review.md
\`\`\`

### Skill별 발행 경로

| Skill      | 산출물                      | 발행 경로 (서비스 기준)                      |
|------------|----------------------------|---------------------------------------------|
| Leader     | PRD.md, HANDOFF.md         | `docs/features/{feature}/`                  |
| Profiler   | TARGET_DEFINITION.md       | `docs/features/{feature}/`                  |
| Query      | *.sql, analysis_*.json/md  | `docs/features/{feature}/analysis/`         |
| Designer   | IA.md, Wireframe.md, SDD.md| `docs/features/{feature}/`                  |
| Coder      | *.ts, *.tsx                | `apps/{web\|api}/src/features/{feature}/`   |
| Coder      | *.mock.ts                  | `apps/{web\|api}/src/mocks/`                |
| Coder      | *.test.ts                  | `tests/`                                    |
| ImLeader   | imleader-review.md         | `runs/{run-id}/{task-id}/`                  |
```

#### 2. Publish 프로세스

```markdown
## Publish 프로세스

### Run → 발행 흐름

\`\`\`
runs/{run-id}/{task-id}/output/
    │
    │  ImLeader 검증
    ▼
imleader-review.md → PASS?
    │
    ├─ YES → 📤 PUBLISH (발행 경로로 복사)
    └─ NO  → 재작업 또는 HITL
\`\`\`

### 주의사항

- `runs/`는 **로그(이력)** 용도. 개발자/AI 참조 시 **발행된 경로** 사용
- 발행 시 기존 파일 덮어쓰기 (최신 버전 유지)
```

---

## 요약

> **Role-Skill-Protocol v5.1**은 전역 룰북(`role-skill-protocol/`)을 Submodule로 참조하는 멀티레포 구조입니다. **⚠️ Claude Code 필수 위치**: `CLAUDE.md`와 `skills/`는 반드시 `.claude/` 직하에 위치해야 Claude Code가 인식합니다. 전역 룰북의 rules/, workflows/, context/, templates/는 `.claude/rulebook/` submodule로 참조됩니다. Role 정의는 **`rules/ROLES_DEFINITION.md`**에 집중됩니다 (정적 제약). 각 Skill은 `templates/{role}/*.md`를 참조하여 **DOCUMENT_PIPELINE.md에 정의된 산출물**을 생성합니다. 팀 철학과 행동 강령은 **`context/AI_Playbook.md`**에 정의되어 전역으로 공유됩니다. 프로젝트별로는 `project/DOMAIN_SCHEMA.md`, `project/PROJECT_STACK.md`에서 오버라이드합니다. 프로젝트 > 서비스 > 피쳐 계층 구조로 코드(`apps/`)와 산출물(`docs/features/`)을 분리하며, 모든 작업은 `runs/{run-id}/{task-id}/` 구조로 로그를 남깁니다. ImLeader 검증 통과 시 **Publish(발행)** 단계를 거쳐 정해진 경로로 복사됩니다.
