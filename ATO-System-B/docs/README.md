# docs/ Directory Guide

> **작성일**: 2026-01-11
> **목적**: 문서 구조 안내 (FileTree-Plan05 적용 후)

---

## 📁 디렉토리 구조

```
docs/
├── README.md                    # 이 파일 (네비게이션 가이드)
├── cases-archive/               # 🗄️ 기존 문서 아카이브 (읽기 전용)
│   ├── case4-analysis-활성 회원 프로파일/
│   ├── case5-dormancy-휴면 위험 예측/
│   ├── 260106-*/
│   └── archived/
│
└── reports/                     # 📊 시스템 리포트 (변경 없음)
    ├── FileTree-Plan05.md
    ├── Migration-Guide.md
    ├── Plan05-Alignment-Report.md
    └── SYSTEM_MANIFEST.md
```

---

## 🔄 구조 변경 안내

### 기존 문서 (Archive)

**위치**: `docs/cases-archive/`

**구조**:
```
cases-archive/{caseId}/{taskId}/
├── PRD.md
├── HANDOFF.md
├── IA.md
├── Wireframe.md
├── SDD.md
└── analysis/
```

**용도**:
- ✅ 읽기 전용 (참고용)
- ✅ 과거 작업 이력 보존
- ❌ 새 작업 추가 금지

**접근 방법**:
```bash
# 특정 케이스 찾기
ls docs/cases-archive/

# 예시: 활성 회원 프로파일 분석
cat docs/cases-archive/case4-analysis-활성\ 회원\ 프로파일/task-001/PRD.md
```

---

### 새 문서 (Plan05 Structure)

**위치**: `services/{service-name}/docs/features/{feature-name}/`

**구조**:
```
services/medigate-community/docs/features/{feature-name}/
├── PRD.md                 # 요구사항 정의
├── HANDOFF.md             # 작업 지시서
├── IA.md                  # 정보 구조
├── Wireframe.md           # 화면 설계
├── SDD.md                 # 상세 설계
├── analysis/              # 분석 산출물
│   ├── analysis_report.md
│   ├── segment_definition.md
│   ├── *.sql
│   └── query_result.json
├── runs/                  # 실행 이력
│   └── run-{id}/
│       └── execution.log
└── .temp/                 # 임시 파일 (작업 중)
    └── draft_notes.md
```

**용도**:
- ✅ 새로운 Feature 문서화
- ✅ Feature별 문서 집중 관리
- ✅ Backend + Frontend + 문서 통합 위치

**접근 방법**:
```bash
# 예시: podcast-player feature 문서
cd services/medigate-community/docs/features/podcast-player/

# PRD 확인
cat PRD.md

# 분석 결과 확인
cat analysis/analysis_report.md
```

---

## 🚀 새 Feature 생성 시

### Step 1: Feature 디렉토리 생성

```bash
# 서비스명: medigate-community
# Feature명: {your-feature-name}

mkdir -p services/medigate-community/docs/features/{your-feature-name}/analysis
mkdir -p services/medigate-community/docs/features/{your-feature-name}/runs
mkdir -p services/medigate-community/docs/features/{your-feature-name}/.temp
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

### Step 3: 예시 참조

**템플릿 위치**: `services/medigate-community/docs/features/podcast-player/`

```bash
# 예시 문서 복사
cp -r services/medigate-community/docs/features/podcast-player/ \
      services/medigate-community/docs/features/{your-feature-name}/

# 내용 수정
# - PRD.md: 요구사항 재정의
# - HANDOFF.md: 작업 목표 재설정
# - 기타 파일: Feature에 맞게 수정
```

---

## 📚 참고 문서

### 시스템 문서

| 문서                           | 위치                                   | 용도                   |
| ------------------------------ | -------------------------------------- | ---------------------- |
| FileTree-Plan05.md             | `docs/reports/`                        | 목표 구조 정의         |
| Migration-Guide.md             | `docs/reports/`                        | 마이그레이션 가이드    |
| Plan05-Alignment-Report.md     | `docs/reports/`                        | 진행 상황 리포트       |
| SYSTEM_MANIFEST.md             | `.claude/SYSTEM_MANIFEST.md`           | 경로 매핑 SSOT         |
| medigate-community/README.md   | `services/medigate-community/`         | 서비스 구조 안내       |

### 검색 방법

**기존 문서 검색** (Archive):
```bash
# 키워드 검색
grep -r "활성 회원" docs/cases-archive/

# 파일 목록
find docs/cases-archive/ -name "*.md"
```

**새 문서 검색** (Plan05):
```bash
# Feature 목록
ls services/medigate-community/docs/features/

# 특정 Feature 문서
ls services/medigate-community/docs/features/podcast-player/
```

---

## ⚠️ 주의사항

1. **Archive는 읽기 전용**: `docs/cases-archive/`에 새 파일 추가 금지
2. **새 작업은 Plan05 구조**: `services/{service-name}/docs/features/{feature-name}/` 사용
3. **Feature 이름 일관성**: Backend, Frontend, Docs 모두 동일한 `{feature-name}` 사용
4. **문서 우선 작성**: 코드 구현 전 PRD → HANDOFF → 분석/설계 완료 필수

---

## 🔗 바로가기

- [기존 문서 아카이브](./cases-archive/)
- [새 구조 예시: podcast-player](../services/medigate-community/docs/features/podcast-player/)
- [서비스 구조 가이드](../services/medigate-community/README.md)
- [마이그레이션 가이드](./reports/Migration-Guide.md)

---

**END OF docs/README.md**
