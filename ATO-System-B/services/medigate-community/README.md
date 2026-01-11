# medigate-community Service

> **서비스명**: medigate-community (메디게이트 커뮤니티 서비스)
> **상태**: Plan05 구조 예시 (Example Structure)
> **작성일**: 2026-01-11

---

## 📋 개요

이 디렉토리는 **FileTree-Plan05** 목표 구조의 예시(Example)입니다.

**현재 상태**:
- ✅ **예시 Feature**: `podcast-player` (1개만 이동 완료)
- ⏸️ **기존 Features**: `backend/`, `frontend/`에 그대로 유지
- 📅 **향후 계획**: 새로운 feature는 이 구조로 생성

---

## 📁 디렉토리 구조

```
services/medigate-community/
├── apps/
│   ├── api/                    # Backend 애플리케이션
│   │   └── src/features/
│   │       └── podcast-player/ # ✅ 예시 Feature
│   │           ├── routes.ts
│   │           ├── podcast.routes.ts
│   │           ├── services/
│   │           └── types.ts
│   │
│   └── web/                    # Frontend 애플리케이션
│       └── src/features/
│           └── podcast-player/ # ✅ 예시 Feature
│               ├── PodcastPlayer.tsx
│               ├── components/
│               ├── data.ts
│               ├── index.ts
│               └── types.ts
│
├── docs/features/
│   └── podcast-player/         # ✅ 예시 문서
│       ├── PRD.md              # 요구사항 정의
│       ├── HANDOFF.md          # 작업 지시서
│       ├── IA.md               # 정보 구조
│       ├── Wireframe.md        # 화면 설계
│       ├── SDD.md              # 상세 설계
│       ├── analysis/           # 분석 산출물
│       │   ├── analysis_report.md
│       │   ├── segment_definition.md
│       │   ├── *.sql
│       │   └── query_result.json
│       ├── runs/               # 실행 이력
│       │   └── run-001/
│       │       └── execution.log
│       └── .temp/              # 임시 파일
│           └── draft_notes.md
│
└── README.md                   # 이 파일
```

---

## 🔄 기존 Features 위치

**아래 features는 기존 위치에 그대로 유지됩니다**:

### Backend (`backend/src/`)
- `board/` - 게시판 기능
- `dashboard/` - 대시보드 기능
- `routes/` - API 라우트 (boards.ts, dashboard.routes.ts, member.routes.ts)
- `services/` - 비즈니스 로직
- `repositories/` - DB 접근 계층

### Frontend (`frontend/src/features/`)
- `Board/` - 게시판 UI
- `dashboard/` - 대시보드 UI
- `podcast/` - 팟캐스트 생성기
- `podcast-player-1turn/` - 팟캐스트 플레이어 (1턴 버전)
- `podcast-player-full/` - 팟캐스트 플레이어 (풀 버전)
- `podcast-script/` - 팟캐스트 스크립트
- `skills-dashboard/` - 스킬 대시보드
- `skills-dashboard-lite/` - 스킬 대시보드 라이트

### 문서 (`docs/cases/`)
- `case4-analysis-활성 회원 프로파일/`
- `case5-dormancy-휴면 위험 예측/`
- `260106-*/` - 테스트 케이스들
- `archived/` - 아카이브

---

## 🚀 새 Feature 생성 가이드

향후 새로운 feature를 만들 때는 **이 구조를 따라** 생성하세요.

### Step 1: Feature 디렉토리 생성
```bash
# Backend
mkdir -p services/medigate-community/apps/api/src/features/{feature-name}

# Frontend
mkdir -p services/medigate-community/apps/web/src/features/{feature-name}

# 문서
mkdir -p services/medigate-community/docs/features/{feature-name}/analysis
```

### Step 2: 문서 작성 순서
1. **PRD.md** - 요구사항 정의
2. **HANDOFF.md** - Leader가 작업 지시 생성
3. **분석** (Phase A):
   - `analysis/segment_definition.md`
   - `analysis/*.sql`
   - `analysis/analysis_report.md`
4. **설계** (Phase B):
   - `IA.md`
   - `Wireframe.md`
   - `SDD.md`
5. **구현** (Phase C):
   - `apps/web/src/features/{feature-name}/`
   - `apps/api/src/features/{feature-name}/`

### Step 3: 실행 이력 관리
```bash
# 작업 시작 시
mkdir -p services/medigate-community/docs/features/{feature-name}/runs/run-{id}

# 작업 완료 후
# runs/{run-id}/에 execution.log, 스크린샷 등 저장
```

---

## 📚 참고 문서

- [FileTree-Plan05.md](../../docs/reports/FileTree-Plan05.md) - 목표 구조 정의
- [SYSTEM_MANIFEST.md](../../.claude/SYSTEM_MANIFEST.md) - 경로 매핑 SSOT
- [Migration-Guide.md](../../docs/reports/Migration-Guide.md) - 마이그레이션 가이드

---

## ⚠️ 중요 사항

1. **기존 코드 수정 금지**: `backend/`, `frontend/`의 기존 features는 수정하지 않습니다.
2. **새 Feature만 여기에**: 새로 만드는 feature는 이 구조를 따릅니다.
3. **예시 참조**: `podcast-player`를 템플릿으로 사용하세요.
4. **문서 우선**: 코드 작성 전에 PRD → HANDOFF → 분석/설계를 먼저 완료합니다.

---

**END OF README.md**
