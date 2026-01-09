# 현재 파일트리 vs FileTree-Plan04 비교 분석

> **작성일**: 2026-01-09
> **목적**: 현재 구조와 Role-Skill-Protocol 제안 구조의 Gap 분석

---

## 1. 구조 개요 비교

### 현재 구조 (As-Is)

```
ATO-System-B/
├── .claude/                    # 룰북
│   ├── rules/
│   ├── workflows/
│   ├── skills/                 # Role별 Skill
│   ├── templates/
│   ├── context/
│   └── project/
├── backend/                    # 백엔드 (루트 레벨)
├── frontend/                   # 프론트엔드 (루트 레벨)
├── src/                        # 또 다른 소스 (중복?)
├── docs/cases/{case-id}/       # Case > Task 구조
├── workspace/                  # 분석/피쳐 작업 공간
├── orchestrator/               # 오케스트레이터 시스템
└── test-output/                # 테스트 산출물
```

### 제안 구조 (To-Be: FileTree-Plan04)

```
{project}/
├── .claude/
│   ├── rulebook/               # [submodule] 전역 룰
│   └── project/                # 프로젝트 오버라이드
├── services/
│   └── {service}/
│       ├── apps/               # 코드 (web/, api/)
│       ├── tests/              # 테스트
│       └── docs/features/
│           └── {feature}/
│               ├── config/     # YAML Config
│               └── runs/       # 실행 이력
├── shared/                     # 공유 코드
└── .temp/                      # 임시 파일
```

---

## 2. 상세 비교표

### 2.1 공통점

| 항목 | 현재 | Plan04 | 비고 |
|------|------|--------|------|
| `.claude/` 룰북 | ✅ | ✅ | 동일한 위치 |
| `rules/`, `workflows/` | ✅ | ✅ | 규칙/프로세스 분리 |
| Feature 기반 코드 구조 | ✅ `frontend/src/features/` | ✅ `apps/web/src/features/` | 구조 유사 |
| Case/Task 계층 | ✅ `docs/cases/{case}/{task}/` | ✅ `runs/{run-id}/{task-id}/` | 이름만 다름 |
| 분석 결과 저장 | ✅ `analysis/results/` | ✅ `analysis/` | 유사 |
| 템플릿 관리 | ✅ `.claude/templates/` | ✅ `templates/` | 동일 |

### 2.2 변경점

| 항목 | 현재 (As-Is) | Plan04 (To-Be) | 변경 사유 |
|------|--------------|----------------|-----------|
| **코드 위치** | 루트 `backend/`, `frontend/`, `src/` (3곳 분산) | `services/{service}/apps/{web,api}/` (통합) | 서비스별 격리, 중복 제거 |
| **서비스 계층** | 없음 (단일 프로젝트) | `services/{service}/` 도입 | 멀티 서비스 지원 |
| **피쳐 문서** | `docs/cases/{case}/` | `docs/features/{feature}/` | 피쳐 중심 재편 |
| **실행 이력** | `docs/cases/{case}/{task}/` | `docs/features/{feature}/runs/{run-id}/` | 피쳐 하위로 이동 |
| **Config** | 없음 | `config/agents.yaml`, `tasks.yaml` | CrewAI 패턴 도입 |
| **Role 정의** | `.claude/skills/` (Skill 기반) | `rulebook/roles/*.md` (Markdown 기반) | YAML이 Markdown 참조 |
| **Publish 개념** | 없음 (수동 이동) | `runs/output/` → `docs/` 또는 `apps/` 발행 필수 | Air-Gap 해결 |
| **Task 구조** | 자유 형식 | `input.json` + `output/` + `review.md` 고정 | 표준화 |
| **임시 파일** | `workspace/`, `test-output/` (분산) | `.temp/` (통합) | gitignore 일원화 |
| **전역 룰북** | 프로젝트 내 포함 | 별도 레포 + Submodule | 멀티 프로젝트 공유 |
| **orchestrator/** | 루트에 존재 | 제거 또는 `shared/` 이동 | 프로젝트 코드와 분리 |

### 2.3 장점 비교

| 관점 | 현재 구조 장점 | Plan04 장점 |
|------|---------------|-------------|
| **학습 곡선** | 기존 익숙함, 즉시 사용 가능 | 표준화로 온보딩 비용 감소 |
| **유연성** | Case 단위 자유로운 구조 | Feature > Run > Task 명확한 계층 |
| **히스토리** | Case별 아카이브 가능 | Run별 상태 추적 (state.json) |
| **코드 찾기** | 루트에서 바로 접근 | 서비스/피쳐별 명확한 경로 |
| **산출물 참조** | `docs/cases/`에서 바로 확인 | 발행된 경로 고정 (Air-Gap 해결) |
| **멀티 프로젝트** | 해당 없음 (단일) | Submodule로 룰북 공유 |
| **AI 이해도** | Skill 기반 호출 익숙 | YAML → Markdown 참조로 더 명확 |
| **검증 추적** | 수동 확인 | `review.md` 필수로 검증 이력 보존 |

### 2.4 단점 비교

| 관점 | 현재 구조 단점 | Plan04 단점 |
|------|---------------|-------------|
| **코드 분산** | `backend/`, `frontend/`, `src/` 3곳에 분산 | 경로 깊이 증가 (`services/{s}/apps/web/src/features/{f}/`) |
| **산출물 위치** | Case 내에 묻혀서 찾기 어려움 | Publish 단계 누락 시 동일 문제 |
| **임시 파일** | `workspace/`, `test-output/` 분산 | `.temp/` 규칙 학습 필요 |
| **서비스 개념** | 없음 (확장 어려움) | 단일 서비스면 오버엔지니어링 |
| **Config 관리** | 없음 | YAML 파일 추가 관리 부담 |
| **마이그레이션** | 해당 없음 | 기존 구조에서 전환 비용 |
| **orchestrator** | 독립 시스템으로 분리 어려움 | 위치 재정의 필요 |

---

## 3. 주요 Gap 분석

### 3.1 코드 위치 Gap

| 현재 경로 | Plan04 경로 | 마이그레이션 작업 |
|----------|-------------|------------------|
| `backend/` | `services/community/apps/api/` | 이동 + 구조 변경 |
| `frontend/` | `services/community/apps/web/` | 이동 + 구조 변경 |
| `src/` | 삭제 또는 `shared/`로 이동 | 중복 코드 정리 |
| `frontend/src/features/*` | `apps/web/src/features/*` | 경로만 변경 |

### 3.2 문서 위치 Gap

| 현재 경로 | Plan04 경로 | 비고 |
|----------|-------------|------|
| `docs/cases/{case-id}/` | `docs/features/{feature}/runs/{run-id}/` | Case → Feature+Run 분리 |
| `docs/cases/{case}/{task}/` | `runs/{run-id}/{task-id}/` | 피쳐 하위로 이동 |
| `workspace/analysis/` | `.temp/` 또는 `docs/.../analysis/` | 임시 vs 발행 구분 |

### 3.3 새로 도입해야 할 요소

| 요소 | 현재 | Plan04 | 도입 난이도 |
|------|------|--------|------------|
| `services/` 계층 | ❌ | ✅ | 높음 (구조 재편) |
| `config/agents.yaml` | ❌ | ✅ | 중간 (파일 추가) |
| `config/tasks.yaml` | ❌ | ✅ | 중간 (파일 추가) |
| `runs/{run-id}/state.json` | ❌ | ✅ | 낮음 (파일 추가) |
| `{task-id}/input.json` | ❌ | ✅ | 낮음 (표준화) |
| `{task-id}/review.md` | ❌ (일부 있음) | ✅ 필수 | 낮음 (표준화) |
| Publish 프로세스 | ❌ | ✅ | 중간 (워크플로우) |
| 전역 룰북 Submodule | ❌ | ✅ | 중간 (Git 설정) |

---

## 4. 마이그레이션 권장 사항

### 4.1 단계별 전환

| 단계 | 작업 | 우선순위 | 영향도 |
|------|------|----------|--------|
| 1 | `.temp/` 통합 및 gitignore 정리 | 🔴 높음 | 낮음 |
| 2 | `config/` 도입 (agents.yaml, tasks.yaml) | 🔴 높음 | 중간 |
| 3 | Task 구조 표준화 (input.json, output/, review.md) | 🔴 높음 | 중간 |
| 4 | `docs/cases/` → `docs/features/{f}/runs/` 전환 | 🟡 중간 | 높음 |
| 5 | `services/` 계층 도입 | 🟡 중간 | 높음 |
| 6 | 코드 통합 (`backend/`, `frontend/` → `apps/`) | 🟡 중간 | 높음 |
| 7 | 전역 룰북 분리 (Submodule) | 🟢 낮음 | 중간 |

### 4.2 병행 운영 가능 여부

| 요소 | 병행 가능 | 비고 |
|------|----------|------|
| `.temp/` 도입 | ✅ | 기존 `workspace/` 유지하면서 점진 전환 |
| `config/` 도입 | ✅ | 기존 `.claude/skills/` 유지 가능 |
| Task 표준화 | ✅ | 새 Task부터 적용 |
| `services/` 도입 | ⚠️ | 코드 이동 필요, 병행 어려움 |
| 전역 룰북 분리 | ✅ | Submodule로 점진 전환 |

---

## 5. 결론

### 현재 구조 유지 시

- ✅ 즉시 사용 가능, 학습 비용 없음
- ❌ 코드 분산 (3곳), 산출물 Air-Gap, 멀티 프로젝트 불가

### Plan04 전환 시

- ✅ 서비스/피쳐/Run/Task 명확한 계층
- ✅ Publish로 Air-Gap 해결
- ✅ 멀티 프로젝트 지원 (Submodule)
- ❌ 마이그레이션 비용, 경로 깊이 증가

### 권장

1. **단기**: `.temp/`, `config/`, Task 표준화 먼저 도입 (병행 가능)
2. **중기**: 새 피쳐부터 `docs/features/{feature}/runs/` 구조 적용
3. **장기**: 조직 레포 이전 시점에 `services/` 및 Submodule 전환
