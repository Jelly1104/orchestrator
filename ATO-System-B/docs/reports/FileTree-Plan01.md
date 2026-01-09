# SI 조직 Multi-Repo 폴더 트리 구조

> **버전**: 1.0.0 | **작성일**: 2026-01-09

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
    │   │   │   │       └── features/    # 피쳐별 코드
    │   │   │   │           ├── daily-best/
    │   │   │   │           └── comments/
    │   │   │   └── api/
    │   │   │       └── src/
    │   │   │           └── features/
    │   │   │               ├── daily-best/
    │   │   │               └── comments/
    │   │   │
    │   │   ├── docs/                    # 📄 산출물
    │   │   │   └── features/
    │   │   │       ├── daily-best/
    │   │   │       │   ├── PRD.md
    │   │   │       │   ├── SDD.md
    │   │   │       │   └── analysis/
    │   │   │       │       └── report.md
    │   │   │       └── comments/
    │   │   │
    │   │   └── .temp/                   # 🚫 서비스별 임시 (gitignore)
    │   │       ├── scripts/             # 일회성 스크립트
    │   │       │   └── run-query.mjs
    │   │       ├── results/             # 쿼리 결과
    │   │       │   └── query_result.json
    │   │       └── sandbox/             # 실험 코드
    │   │
    │   └── recruitment/                 # 서비스: 채용
    │       ├── apps/
    │       ├── docs/
    │       └── .temp/                   # 🚫 서비스별 임시
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

## 임시파일 위치 명확화

| 위치 | 용도 | 범위 |
|------|------|------|
| `/.temp/` | 프로젝트 전역, 서비스 걸친 작업, 온보딩 연습 | 프로젝트 |
| `/services/{서비스}/.temp/` | 해당 서비스 분석/실험용 | 서비스 |
| `/services/{서비스}/.temp/scripts/` | 일회성 DB 쿼리 스크립트 | 서비스 |
| `/services/{서비스}/.temp/results/` | 쿼리/분석 결과 임시 저장 | 서비스 |
| `/services/{서비스}/.temp/sandbox/` | 실험 코드, POC | 서비스 |

**원칙**: 임시파일은 작업 범위에 따라 해당 계층의 `.temp/`에 생성

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

# 분석 스크립트 작성 (임시)
vim .temp/scripts/analyze-posts.mjs

# 결과 확인 후 최종 산출물만 docs로 이동
mv .temp/results/final-report.md docs/features/daily-best/analysis/

# 코드 작업
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

> 전역 룰(코드 스타일, TDD 등)을 별도 레포로 관리하고 각 프로젝트에서 Submodule로 참조하는 멀티레포 구조입니다. 프로젝트 > 서비스 > 피쳐 계층 구조로 코드(`apps/features/`)와 산출물(`docs/features/`)을 분리하며, 서비스 간 공유 코드는 `shared/`에 위치합니다. 임시파일은 작업 범위에 따라 프로젝트 또는 서비스별 `.temp/`에 격리하여 gitignore 처리하고, 보안 관리를 위해 DB 자격증명은 `.env`(gitignore) + `.env.example`(템플릿) 패턴으로 관리합니다. 개발자는 어떤 프로젝트에 투입되든 동일한 전역 룰을 따르고, `PROJECT_STACK.md`와 `DOMAIN_SCHEMA.md`만 프로젝트별로 학습하면 됩니다.
