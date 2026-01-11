# ATO-System-B

> **프로젝트**: 메디게이트 커뮤니티 서비스 (Medigate Community Service)
> **아키텍처**: FileTree-Plan05 (Role-Skill-Protocol 기반)
> **마이그레이션 상태**: Phase 0-4 완료 ✅
> **Version**: 6.0.0 | **Updated**: 2026-01-11

---

## 📋 프로젝트 개요

AI 기반 자동화 태스크 오케스트레이션 시스템(ATO-System-B)으로, **Role-Skill-Protocol**을 적용한 구조화된 개발 환경입니다.

**핵심 특징**:
- ✅ **전역 룰북 Submodule**: `.claude/rulebook/` (role-skill-protocol)
- ✅ **서비스 기반 구조**: `services/{service-name}/apps/{api,web}/`
- ✅ **Feature 단위 관리**: 코드/문서/테스트 통합 관리
- ✅ **Run 기반 이력**: `runs/{run-id}/` 실행 로그 추적
- ✅ **HITL (Human-in-the-Loop)**: 검증 실패 시 3-way 옵션 개입

---

## 📁 디렉토리 구조

```
ATO-System-B/
├── .claude/                          # 🔧 프로젝트 설정
│   ├── CLAUDE.md                     # ⚖️ 헌법 (절대 원칙)
│   ├── rulebook/                     # 📚 전역 룰북 (Submodule → role-skill-protocol)
│   │   ├── SYSTEM_MANIFEST.md        # 시스템 지도 (문서 맵, 로딩 전략)
│   │   ├── rules/                    # 정적 규칙 (CODE_STYLE, TDD_WORKFLOW 등)
│   │   ├── workflows/                # 실행 절차 (DOCUMENT_PIPELINE, ROLE_ARCHITECTURE 등)
│   │   ├── context/                  # 배경 지식 (AI_Playbook.md)
│   │   ├── skills/                   # Claude Code Skills
│   │   └── templates/                # 산출물 템플릿
│   └── project/                      # 프로젝트 오버라이드
│       ├── PROJECT_STACK.md          # 기술 스택
│       └── DOMAIN_SCHEMA.md          # DB 스키마
│
├── services/                         # 🎯 서비스 계층
│   └── medigate-community/           # 메디게이트 커뮤니티 서비스
│       ├── apps/                     # 애플리케이션 코드
│       │   ├── api/                  # Backend (Node.js + Express)
│       │   │   └── src/features/     # Feature별 Backend 코드
│       │   └── web/                  # Frontend (React + TypeScript)
│       │       └── src/features/     # Feature별 Frontend 코드
│       ├── docs/features/            # Feature별 문서
│       │   └── {feature-name}/
│       │       ├── PRD.md            # 요구사항 정의
│       │       ├── HANDOFF.md        # 작업 지시서
│       │       ├── SDD.md            # 상세 설계
│       │       ├── analysis/         # 분석 결과
│       │       └── runs/             # 실행 이력
│       └── README.md                 # 서비스 가이드
│
├── docs/                             # 📊 시스템 문서
│   ├── README.md                     # 문서 네비게이션 가이드
│   ├── cases-archive/                # 기존 문서 아카이브 (읽기 전용)
│   └── reports/                      # 시스템 리포트
│       ├── FileTree-Plan05.md        # 목표 구조 정의
│       ├── Migration-Guide.md        # 마이그레이션 가이드
│       └── Plan05-Alignment-Report.md # 진행 상황 리포트
│
├── scripts/                          # 🔨 유틸리티 스크립트
│   └── validate-docs.sh              # 문서 검증 스크립트
│
└── _archive/                         # 🗄️ 기존 구조 보관 (참조 전용)
    ├── backend/                      # 기존 Backend
    ├── frontend/                     # 기존 Frontend
    ├── orchestrator/                 # Orchestrator 도구 (JavaScript 기반)
    └── README.md                     # Archive 안내
```

---

## 🚀 빠른 시작

### 1. Submodule 초기화

```bash
git submodule update --init --recursive
```

### 2. 새 Feature 개발

```bash
# Feature 이름 결정 (예: user-profile)
FEATURE_NAME="user-profile"

# 디렉토리 생성
mkdir -p services/medigate-community/apps/api/src/features/$FEATURE_NAME
mkdir -p services/medigate-community/apps/web/src/features/$FEATURE_NAME
mkdir -p services/medigate-community/docs/features/$FEATURE_NAME/analysis

# 문서 작성 (순서 준수)
# 1. PRD.md - 요구사항 정의
# 2. HANDOFF.md - Leader가 작업 지시 생성
# 3. 분석 (Phase A) → 설계 (Phase B) → 구현 (Phase C)
```

### 3. 예시 참조

템플릿으로 사용할 예시 Feature:
```bash
# 문서 구조 확인
ls services/medigate-community/docs/features/podcast-player/

# 코드 구조 확인
ls services/medigate-community/apps/web/src/features/podcast-player/
ls services/medigate-community/apps/api/src/features/podcast-player/
```

---

## 📚 문서 가이드

### 시스템 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| **CLAUDE.md** | `.claude/CLAUDE.md` | 팀 공통 헌법 (절대 원칙) |
| **SYSTEM_MANIFEST.md** | `.claude/rulebook/SYSTEM_MANIFEST.md` | 시스템 지도 (문서 맵, 경로 매핑) |
| **PROJECT_STACK.md** | `.claude/project/PROJECT_STACK.md` | 기술 스택 정의 |
| **DOMAIN_SCHEMA.md** | `.claude/project/DOMAIN_SCHEMA.md` | DB 스키마 정의 |

### 개발 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| **FileTree-Plan05.md** | `docs/reports/FileTree-Plan05.md` | 목표 구조 정의 |
| **Migration-Guide.md** | `docs/reports/Migration-Guide.md` | 마이그레이션 가이드 |
| **서비스 README** | `services/medigate-community/README.md` | 서비스별 가이드 |

---

## 🔧 기술 스택

**Backend**:
- Node.js 18+
- Express.js
- MySQL 8.0
- TypeScript

**Frontend**:
- React 18+
- TypeScript
- Vite
- TailwindCSS

**Tools**:
- Git Submodules (전역 룰북 참조)
- Claude Code (AI 개발 도구)
- ESLint + Prettier

---

## 📖 주요 원칙

### 1. 문서 우선 (Documentation First)
코드 작성 전 반드시 PRD → HANDOFF → 분석/설계 완료

### 2. Feature 이름 일관성
Backend와 Frontend는 **동일한 feature-name** 사용 필수

### 3. Archive 참조 금지
`_archive/`는 읽기 전용, 새 코드는 반드시 Plan05 구조 준수

### 4. Submodule 동기화
전역 룰북 업데이트 시 `git submodule update --remote` 실행

---

## 🔗 바로가기

- [새 Feature 생성 가이드](./services/medigate-community/README.md#새-feature-생성-가이드)
- [문서 네비게이션](./docs/README.md)
- [Archive 안내](./_archive/README.md)
- [마이그레이션 진행 상황](./docs/reports/Plan05-Alignment-Report.md)

---

## 📞 문의

- **Issue**: [GitHub Issues](https://github.com/Jelly1104/orchestrator/issues)
- **Pull Request**: `feat/plan05-docs-alignment` 브랜치 기준

---

**Last Updated**: 2026-01-11
**Version**: 6.0.0 (FileTree-Plan05 Phase 0-4 완료)
**License**: Private - 미래전략실 (ATO Team)
