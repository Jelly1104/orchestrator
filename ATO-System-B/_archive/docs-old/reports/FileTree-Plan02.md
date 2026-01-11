# 조직 Multi-Repo 폴더 트리 구조

> **버전**: 2.0.0 | **작성일**: 2026-01-09
> **변경사항**: Air-Gap 리스크 보완, Data Contract 영속성 추가

---

## 개선된 폴더 트리 구조

```
github.com/ABCSoft/                      # 🏢 Organization

# ═══════════════════════════════════════
# 1️⃣ 전역 룰북 레포 (모든 프로젝트 공통)
# ═══════════════════════════════════════
├── claude-rulebook/
│   ├── rules/
│   │   ├── CODE_STYLE.md
│   │   ├── TDD_WORKFLOW.md
│   │   └── TEMP_FILE_POLICY.md
│   ├── workflows/
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
    │   │   │   │       └── mocks/                   # src/mocks/* (Fixture)
    │   │   │   │           └── daily-best.mock.ts   # fixture_source.json 기반 생성
    │   │   │   └── api/
    │   │   │       └── src/
    │   │   │           └── features/
    │   │   │               ├── daily-best/
    │   │   │               └── comments/
    │   │   │
    │   │   ├── docs/                    # 📄 산출물
    │   │   │   └── features/
    │   │   │       ├── daily-best/
    │   │   │       │   ├── HANDOFF.md           # ⭐ 경로 참조 명시
    │   │   │       │   ├── PRD.md
    │   │   │       │   ├── SDD.md
    │   │   │       │   └── analysis/
    │   │   │       │       ├── report.md
    │   │   │       │       └── fixture_source.json  # 🟢 Contract (Git 포함)
    │   │   │       └── comments/
    │   │   │           ├── HANDOFF.md
    │   │   │           ├── PRD.md
    │   │   │           ├── SDD.md
    │   │   │           └── analysis/
    │   │   │               └── fixture_source.json
    │   │   │
    │   │   └── .temp/                   # 🚫 서비스별 임시 (gitignore)
    │   │       ├── scripts/             # 일회성 스크립트
    │   │       │   └── run-query.mjs
    │   │       ├── results/             # 🔴 Raw Data (Git 제외)
    │   │       │   ├── raw_users.json       # PII 포함, 임시
    │   │       │   └── query_result.json    # 정제 전 결과
    │   │       └── sandbox/             # 실험 코드
    │   │
    │   └── recruitment/                 # 서비스: 채용
    │       ├── apps/
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

## Air-Gap 리스크 보완: Docs ↔ Code 연결

### 문제점

산출물(`docs/features/`)과 코드(`apps/features/`)가 물리적으로 분리되어 있어 AI가 경로를 혼동할 수 있음.

### 해결: HANDOFF.md에 경로 명시

**`docs/features/daily-best/HANDOFF.md` 예시:**

```markdown
# HANDOFF: daily-best

## 경로 참조 (Path Reference)

| 유형              | 상대 경로                                    | 절대 경로 (서비스 기준)                                 |
| ----------------- | -------------------------------------------- | ------------------------------------------------------- |
| **Frontend 코드** | `../../../apps/web/src/features/daily-best/` | `apps/web/src/features/daily-best/`                     |
| **Backend 코드**  | `../../../apps/api/src/features/daily-best/` | `apps/api/src/features/daily-best/`                     |
| **SDD 문서**      | `./SDD.md`                                   | `docs/features/daily-best/SDD.md`                       |
| **Fixture 계약**  | `./analysis/fixture_source.json`             | `docs/features/daily-best/analysis/fixture_source.json` |

## 코드 생성 규칙

⚠️ AI는 코드를 `apps/` 경로에만 생성해야 합니다.
⚠️ `docs/` 경로에 `.ts`, `.tsx`, `.mjs` 파일 생성 금지.

---

## Output (산출물)

- [ ] `apps/web/src/features/daily-best/index.ts`
- [ ] `apps/web/src/features/daily-best/components/DailyBestCard.tsx`
- [ ] `apps/api/src/features/daily-best/controller.ts`
```

### 경로 참조 다이어그램

```
services/community/
├── apps/                          # 📦 코드 생성 위치
│   ├── web/src/features/
│   │   └── daily-best/  ←─────────┐
│   └── api/src/features/          │
│       └── daily-best/  ←─────────┤
│                                  │ 상대 경로 참조
├── docs/                          │
│   └── features/                  │
│       └── daily-best/            │
│           ├── HANDOFF.md ────────┘  (경로 명시)
│           ├── SDD.md
│           └── analysis/
│               └── fixture_source.json
│
└── .temp/                         # 🚫 임시 (Git 제외)
```

---

## Data Contract 영속성: Raw Data vs Contract

### 문제점

`.temp/`는 gitignore 대상이므로 팀이 공유해야 할 "데이터 계약(Fixture)"이 증발할 수 있음.

### 해결: 2단계 데이터 분류

| 분류            | 위치                          | Git  | 설명                  |
| --------------- | ----------------------------- | ---- | --------------------- |
| 🔴 **Raw Data** | `.temp/results/`              | 제외 | PII 포함, 임시 분석용 |
| 🟢 **Contract** | `docs/features/.../analysis/` | 포함 | Sanitized, 팀 공유용  |

### 데이터 흐름

```
[Phase A: Analysis]
    │
    ▼
.temp/results/raw_users.json        # 🔴 DB에서 추출한 원본 (PII 포함)
    │
    │  Sanitize (마스킹, 익명화)
    ▼
docs/features/.../analysis/
    ├── fixture_source.json         # 🟢 계약 데이터 (Git 포함)
    └── report.md                   # 🟢 분석 리포트 (Git 포함)
    │
    ▼
[Phase C: Implementation]
    │
    │  Import as Fixture
    ▼
apps/.../features/.../
    └── __fixtures__/               # 테스트용 Fixture (Contract 기반)
```

### fixture_source.json 예시

```json
{
  "_meta": {
    "generatedAt": "2026-01-09T10:00:00Z",
    "source": "BOARD_MUZZIMA",
    "sanitized": true,
    "rowCount": 10
  },
  "schema": {
    "BOARD_IDX": "number",
    "CTG_CODE": "string",
    "TITLE": "string",
    "READ_CNT": "number",
    "AGREE_CNT": "number"
  },
  "samples": [
    {
      "BOARD_IDX": 12345,
      "CTG_CODE": "FREE01",
      "TITLE": "샘플 게시글 제목",
      "READ_CNT": 150,
      "AGREE_CNT": 12
    }
  ]
}
```

---

## 임시파일 위치 명확화 (개선)

| 위치                                    | 용도                    | Git | 범위     |
| --------------------------------------- | ----------------------- | --- | -------- |
| `/.temp/`                               | 프로젝트 전역 임시      | 🚫  | 프로젝트 |
| `/services/{서비스}/.temp/`             | 서비스 분석/실험용      | 🚫  | 서비스   |
| `/services/{서비스}/.temp/scripts/`     | 일회성 DB 쿼리 스크립트 | 🚫  | 서비스   |
| `/services/{서비스}/.temp/results/`     | 🔴 Raw Data (PII)       | 🚫  | 서비스   |
| `/services/{서비스}/docs/.../analysis/` | 🟢 Contract (Fixture)   | ✅  | 서비스   |

**원칙**:

- 임시파일 → `.temp/`
- 팀 공유 계약 → `docs/.../analysis/`

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

# 동일한 전역 룰 (CODE_STYLE, TDD_WORKFLOW)
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

# 4. Sanitize 후 Contract로 격상 (Git 포함)
# → docs/features/daily-best/analysis/fixture_source.json

# 5. 코드 작업 (HANDOFF 경로 참조)
cd apps/web/src/features/daily-best
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
**/query_result.json

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

> 전역 룰(코드 스타일, TDD 등)을 별도 레포로 관리하고 각 프로젝트에서 Submodule로 참조하는 멀티레포 구조입니다. 프로젝트 > 서비스 > 피쳐 계층 구조로 코드(`apps/features/`)와 산출물(`docs/features/`)을 분리하며, **HANDOFF.md에 상대 경로를 명시하여 Air-Gap 리스크를 방지**합니다. 서비스 간 공유 코드는 `shared/`에 위치합니다. 임시파일과 Raw Data(PII)는 `.temp/`에 격리하여 gitignore 처리하고, **Sanitized Contract(fixture_source.json)는 `docs/.../analysis/`에 커밋하여 팀이 공유**합니다. 보안 관리를 위해 DB 자격증명은 `.env`(gitignore) + `.env.example`(템플릿) 패턴으로 관리합니다. 개발자는 어떤 프로젝트에 투입되든 동일한 전역 룰을 따르고, `PROJECT_STACK.md`와 `DOMAIN_SCHEMA.md`만 프로젝트별로 학습하면 됩니다.
