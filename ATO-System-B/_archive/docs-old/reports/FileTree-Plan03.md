# SI 조직 Multi-Repo 폴더 트리 구조

> **버전**: 3.0.0 | **작성일**: 2026-01-09
> **변경사항**: DOCUMENT_PIPELINE.md 산출물 이름 정합성 반영

---

## 개선된 폴더 트리 구조

```
github.com/ABCSoft/                      # 🏢 SI 회사 Organization

# ═══════════════════════════════════════
# 1️⃣ 전역 룰북 레포 (모든 프로젝트 공통)
# ═══════════════════════════════════════
├── claude-rulebook/
│   ├── rules/
│   │   ├── CODE_STYLE.md
│   │   ├── TDD_WORKFLOW.md
│   │   └── TEMP_FILE_POLICY.md
│   ├── workflows/
│   │   └── DOCUMENT_PIPELINE.md
│   └── templates/
│       ├── .gitignore.template
│       └── .env.example.template

# ═══════════════════════════════════════
# 2️⃣ 프로젝트 레포 (고객사별 독립)
# ═══════════════════════════════════════
└── medigate-ato/
    │
    ├── .claude/
    │   ├── rulebook/                    # [submodule] 전역 룰 참조
    │   ├── CLAUDE.md
    │   └── project/
    │       ├── PROJECT_STACK.md         # 기술스택 오버라이드
    │       └── DOMAIN_SCHEMA.md         # DB스키마 오버라이드
    │
    # ───────────────────────────────────
    # 🔷 서비스 계층
    # ───────────────────────────────────
    ├── services/
    │   │
    │   ├── community/                   # 서비스: 커뮤니티
    │   │   │
    │   │   ├── apps/                    # 📦 코드
    │   │   │   ├── web/
    │   │   │   │   └── src/
    │   │   │   │       ├── features/    # 피쳐별 코드
    │   │   │   │       │   ├── daily-best/
    │   │   │   │       │   │   ├── components/
    │   │   │   │       │   │   ├── hooks/
    │   │   │   │       │   │   └── index.ts
    │   │   │   │       │   └── comments/
    │   │   │   │       └── mocks/       # Fixture (DOCUMENT_PIPELINE: src/mocks/*)
    │   │   │   │           ├── daily-best.mock.ts
    │   │   │   │           └── comments.mock.ts
    │   │   │   └── api/
    │   │   │       └── src/
    │   │   │           ├── features/
    │   │   │           │   ├── daily-best/
    │   │   │           │   └── comments/
    │   │   │           └── mocks/
    │   │   │               ├── daily-best.mock.ts
    │   │   │               └── comments.mock.ts
    │   │   │
    │   │   ├── tests/                   # 테스트 (DOCUMENT_PIPELINE: tests/*.test.ts)
    │   │   │   ├── daily-best.test.ts
    │   │   │   └── comments.test.ts
    │   │   │
    │   │   ├── docs/                    # 📄 산출물
    │   │   │   └── features/
    │   │   │       ├── daily-best/
    │   │   │       │   ├── HANDOFF.md               # ⭐ 경로 참조 명시
    │   │   │       │   ├── PRD.md
    │   │   │       │   ├── segment_definition.md   # analysis 입력
    │   │   │       │   ├── IA.md                    # design 산출물
    │   │   │       │   ├── Wireframe.md             # design 산출물
    │   │   │       │   ├── SDD.md                   # design 산출물
    │   │   │       │   └── analysis/
    │   │   │       │       ├── *.sql                # analysis 산출물
    │   │   │       │       ├── analysis_result.json # analysis 산출물 (Raw 결과)
    │   │   │       │       ├── analysis_report.md   # analysis 산출물 (리포트)
    │   │   │       │       └── fixture_source.json  # 🟢 Contract (Sanitized)
    │   │   │       └── comments/
    │   │   │           ├── HANDOFF.md
    │   │   │           ├── PRD.md
    │   │   │           ├── segment_definition.md
    │   │   │           ├── IA.md
    │   │   │           ├── Wireframe.md
    │   │   │           ├── SDD.md
    │   │   │           └── analysis/
    │   │   │               ├── *.sql
    │   │   │               ├── analysis_result.json
    │   │   │               ├── analysis_report.md
    │   │   │               └── fixture_source.json
    │   │   │
    │   │   └── .temp/                   # 🚫 서비스별 임시 (gitignore)
    │   │       ├── scripts/             # 일회성 스크립트
    │   │       │   └── run-query.mjs
    │   │       ├── results/             # 🔴 Raw Data (Git 제외)
    │   │       │   ├── raw_*.json           # PII 포함 원본
    │   │       │   └── query_result.json    # 정제 전 결과
    │   │       └── sandbox/             # 실험 코드
    │   │
    │   └── recruitment/                 # 서비스: 채용
    │       ├── apps/
    │       ├── tests/
    │       ├── docs/
    │       └── .temp/
    │
    # ───────────────────────────────────
    # 🔷 공유 계층 (서비스 간 재사용)
    # ───────────────────────────────────
    ├── shared/
    │   ├── ui-components/               # 공용 UI 컴포넌트
    │   ├── utils/                       # 공용 유틸리티
    │   ├── types/                       # 공용 타입 정의
    │   └── api-client/                  # 공용 API 클라이언트
    │
    # ───────────────────────────────────
    # 🔷 프로젝트 루트 임시 (gitignore)
    # ───────────────────────────────────
    ├── .temp/                           # 🚫 프로젝트 전역 임시
    │   ├── cross-service/               # 서비스 걸친 임시 작업
    │   └── onboarding/                  # 신규 투입자 연습용
    │
    # ───────────────────────────────────
    # 🔷 환경/보안
    # ───────────────────────────────────
    ├── .env.example                     # ✅ 커밋 (템플릿)
    ├── .env                             # 🚫 gitignore (실제 값)
    ├── .env.development                 # 🚫 gitignore
    ├── .env.production                  # 🚫 gitignore
    │
    └── .gitignore
```

---

## DOCUMENT_PIPELINE.md 산출물 매핑

### 파이프라인 타입별 산출물 위치

| 타입 | 산출물 (DOCUMENT_PIPELINE) | 위치 (FileTree) |
|------|---------------------------|-----------------|
| `analysis` | `*.sql` | `docs/features/{피쳐}/analysis/*.sql` |
| `analysis` | `analysis_result.json` | `docs/features/{피쳐}/analysis/analysis_result.json` |
| `analysis` | `analysis_report.md` | `docs/features/{피쳐}/analysis/analysis_report.md` |
| `design` | `IA.md` | `docs/features/{피쳐}/IA.md` |
| `design` | `Wireframe.md` | `docs/features/{피쳐}/Wireframe.md` |
| `design` | `SDD.md` | `docs/features/{피쳐}/SDD.md` |
| `code` | `frontend/src/*` | `apps/web/src/features/{피쳐}/*` |
| `code` | `backend/src/*` | `apps/api/src/features/{피쳐}/*` |
| `code` | `src/mocks/*` | `apps/{web,api}/src/mocks/*.mock.ts` |
| `code` | `tests/*.test.ts` | `tests/*.test.ts` |

### 입력 파일 위치

| 입력 (DOCUMENT_PIPELINE) | 위치 (FileTree) |
|-------------------------|-----------------|
| `PRD.md` | `docs/features/{피쳐}/PRD.md` |
| `HANDOFF.md` | `docs/features/{피쳐}/HANDOFF.md` |
| `segment_definition.md` | `docs/features/{피쳐}/segment_definition.md` |
| `DOMAIN_SCHEMA.md` | `.claude/project/DOMAIN_SCHEMA.md` |

---

## 데이터 흐름 (Phase A → Phase C)

```
[Phase A: Analysis - Discovery]
    │
    ▼
.temp/results/raw_*.json                    # 🔴 Git 제외 (PII 포함)
    │
    │  Query 실행
    ▼
docs/.../analysis/analysis_result.json      # 🟡 Git 포함 (Raw 결과)
    │
    │  Sanitize (PII 마스킹)
    ▼
docs/.../analysis/fixture_source.json       # 🟢 Git 포함 (계약)
    │
    ▼
[Phase C: Implementation - Reproduction]
    │
    │  Import & Convert (DOMAIN_SCHEMA 기반)
    ▼
apps/.../src/mocks/*.mock.ts                # 🟢 Git 포함 (코드용 Fixture)
tests/*.test.ts                             # 🟢 Git 포함 (테스트)
```

### 데이터 파일 분류

| 파일 | 위치 | Git | 용도 |
|------|------|-----|------|
| `raw_*.json` | `.temp/results/` | 🚫 | PII 포함 원본 |
| `analysis_result.json` | `docs/.../analysis/` | ✅ | 쿼리 결과 (DOCUMENT_PIPELINE 명시) |
| `fixture_source.json` | `docs/.../analysis/` | ✅ | Sanitized 계약 (팀 공유) |
| `*.mock.ts` | `apps/.../src/mocks/` | ✅ | 코드용 Fixture (DOCUMENT_PIPELINE 명시) |

---

## Air-Gap 리스크 보완: Docs ↔ Code 연결

### HANDOFF.md 경로 참조

**`docs/features/daily-best/HANDOFF.md` 예시:**

```markdown
# HANDOFF: daily-best

## 경로 참조 (Path Reference)

| 유형 | 상대 경로 | 절대 경로 (서비스 기준) |
|------|-----------|------------------------|
| **Frontend 코드** | `../../../apps/web/src/features/daily-best/` | `apps/web/src/features/daily-best/` |
| **Backend 코드** | `../../../apps/api/src/features/daily-best/` | `apps/api/src/features/daily-best/` |
| **Frontend Mocks** | `../../../apps/web/src/mocks/` | `apps/web/src/mocks/` |
| **Backend Mocks** | `../../../apps/api/src/mocks/` | `apps/api/src/mocks/` |
| **Tests** | `../../../tests/` | `tests/` |
| **SDD 문서** | `./SDD.md` | `docs/features/daily-best/SDD.md` |
| **Fixture 계약** | `./analysis/fixture_source.json` | `docs/features/daily-best/analysis/fixture_source.json` |

## 코드 생성 규칙

⚠️ AI는 코드를 `apps/` 또는 `tests/` 경로에만 생성해야 합니다.
⚠️ `docs/` 경로에 `.ts`, `.tsx`, `.mjs` 파일 생성 금지.

---

## Output (산출물)

- [ ] `apps/web/src/features/daily-best/index.ts`
- [ ] `apps/web/src/features/daily-best/components/DailyBestCard.tsx`
- [ ] `apps/web/src/mocks/daily-best.mock.ts`
- [ ] `apps/api/src/features/daily-best/controller.ts`
- [ ] `apps/api/src/mocks/daily-best.mock.ts`
- [ ] `tests/daily-best.test.ts`
```

### 경로 참조 다이어그램

```
services/community/
├── apps/                              # 📦 코드 생성 위치
│   ├── web/src/
│   │   ├── features/
│   │   │   └── daily-best/  ←─────────┐
│   │   └── mocks/                     │
│   │       └── daily-best.mock.ts ←───┤
│   └── api/src/                       │
│       ├── features/                  │
│       │   └── daily-best/  ←─────────┤
│       └── mocks/                     │
│           └── daily-best.mock.ts ←───┤
│                                      │
├── tests/                             │
│   └── daily-best.test.ts  ←──────────┤
│                                      │ 상대 경로 참조
├── docs/                              │
│   └── features/                      │
│       └── daily-best/                │
│           ├── HANDOFF.md ────────────┘  (경로 명시)
│           ├── PRD.md
│           ├── segment_definition.md
│           ├── IA.md
│           ├── Wireframe.md
│           ├── SDD.md
│           └── analysis/
│               ├── *.sql
│               ├── analysis_result.json
│               ├── analysis_report.md
│               └── fixture_source.json
│
└── .temp/                             # 🚫 임시 (Git 제외)
    └── results/
        └── raw_*.json
```

---

## 임시파일 위치 명확화

| 위치 | 용도 | Git | 범위 |
|------|------|-----|------|
| `/.temp/` | 프로젝트 전역 임시 | 🚫 | 프로젝트 |
| `/services/{서비스}/.temp/` | 서비스 분석/실험용 | 🚫 | 서비스 |
| `/services/{서비스}/.temp/scripts/` | 일회성 DB 쿼리 스크립트 | 🚫 | 서비스 |
| `/services/{서비스}/.temp/results/` | 🔴 Raw Data (PII) | 🚫 | 서비스 |
| `/services/{서비스}/docs/.../analysis/` | 🟢 Contract (Fixture) | ✅ | 서비스 |

**원칙**:
- 임시파일 → `.temp/`
- 팀 공유 계약 → `docs/.../analysis/`
- 코드용 Fixture → `apps/.../src/mocks/`

---

## 실무 관점: 개발자 투입 시나리오

### 시나리오 1: 신규 프로젝트 투입

```bash
# 개발자 A가 medigate-ato 프로젝트에 처음 투입
git clone https://github.com/ABCSoft/medigate-ato
cd medigate-ato
git submodule update --init --recursive   # 전역 룰북 받기

# 온보딩 연습 (임시 영역에서)
cd .temp/onboarding
# 여기서 자유롭게 연습, 실험 → 커밋 안 됨
```

### 시나리오 2: 다른 프로젝트로 이동

```bash
# 개발자 A가 fintech-payment 프로젝트로 이동
cd ~/projects/fintech-payment
git submodule update --init --recursive

# 동일한 전역 룰 (CODE_STYLE, TDD_WORKFLOW, DOCUMENT_PIPELINE)
# 다른 오버라이드 (PROJECT_STACK: Next.js+Go, DOMAIN_SCHEMA: MongoDB)
# → 적응 비용 최소화
```

### 시나리오 3: 특정 서비스/피쳐 작업

```bash
# community 서비스의 daily-best 피쳐 작업
cd services/community

# 1. HANDOFF 확인 (경로 참조)
cat docs/features/daily-best/HANDOFF.md

# 2. 분석 스크립트 작성 (임시)
vim .temp/scripts/analyze-posts.mjs

# 3. Raw Data 추출 (임시, Git 제외)
node .temp/scripts/analyze-posts.mjs
# → .temp/results/raw_posts.json

# 4. 분석 결과 저장 (Git 포함)
# → docs/features/daily-best/analysis/analysis_result.json
# → docs/features/daily-best/analysis/analysis_report.md

# 5. Sanitize 후 Contract 생성 (Git 포함)
# → docs/features/daily-best/analysis/fixture_source.json

# 6. 코드 작업 (HANDOFF 경로 참조)
cd apps/web/src/features/daily-best

# 7. Fixture 생성 (fixture_source.json 기반)
# → apps/web/src/mocks/daily-best.mock.ts

# 8. 테스트 작성
# → tests/daily-best.test.ts
```

---

## 개선된 .gitignore

```gitignore
# ═══════════════════════════════════════
# 임시파일 (계층별 .temp/ 전체 제외)
# ═══════════════════════════════════════
.temp/
**/.temp/

# 임시 스크립트 패턴 (혹시 .temp 밖에 생성된 경우 방어)
**/run-*.mjs
**/check-*.mjs
**/scratch.*

# Raw Data 패턴 (혹시 .temp 밖에 생성된 경우 방어)
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

> 전역 룰(코드 스타일, TDD, DOCUMENT_PIPELINE 등)을 별도 레포로 관리하고 각 프로젝트에서 Submodule로 참조하는 멀티레포 구조입니다. 프로젝트 > 서비스 > 피쳐 계층 구조로 코드(`apps/`)와 산출물(`docs/features/`)을 분리하며, **HANDOFF.md에 상대 경로를 명시하여 Air-Gap 리스크를 방지**합니다. 산출물 이름은 DOCUMENT_PIPELINE.md와 정합성을 유지하여 `analysis_result.json`, `analysis_report.md`, `*.sql` (분석), `IA.md`, `Wireframe.md`, `SDD.md` (설계), `src/mocks/*.mock.ts`, `tests/*.test.ts` (코드)로 통일합니다. 임시파일과 Raw Data(PII)는 `.temp/`에 격리하여 gitignore 처리하고, **Sanitized Contract(`fixture_source.json`)는 `docs/.../analysis/`에, 코드용 Fixture(`*.mock.ts`)는 `apps/.../src/mocks/`에 커밋**합니다. 개발자는 어떤 프로젝트에 투입되든 동일한 전역 룰을 따르고, `PROJECT_STACK.md`와 `DOMAIN_SCHEMA.md`만 프로젝트별로 학습하면 됩니다.
